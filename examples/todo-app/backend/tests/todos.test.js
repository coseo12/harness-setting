const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'todos.json');

// 테스트용 HTTP 요청 헬퍼
function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('To-Do API', () => {
  let server;

  before(async () => {
    process.env.PORT = '3001';
    // 데이터 초기화
    fs.writeFileSync(DATA_FILE, '[]');
    const app = require('../server');
    server = app.listen(3001);
    // 서버 시작 대기
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  after(() => {
    server?.close();
    fs.writeFileSync(DATA_FILE, '[]');
  });

  beforeEach(() => {
    // 각 테스트 전 데이터 초기화
    fs.writeFileSync(DATA_FILE, '[]');
  });

  it('GET /api/todos — 빈 목록 반환', async () => {
    const res = await request('GET', '/api/todos');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.todos, []);
  });

  it('POST /api/todos — 할 일 생성', async () => {
    const res = await request('POST', '/api/todos', {
      title: '테스트 할 일',
      description: '설명',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.todo.title, '테스트 할 일');
    assert.equal(res.body.todo.completed, false);
    assert.ok(res.body.todo.id);
  });

  it('POST /api/todos — 제목 없으면 400', async () => {
    const res = await request('POST', '/api/todos', { title: '' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('PATCH /api/todos/:id — 완료 토글', async () => {
    // 먼저 생성
    const created = await request('POST', '/api/todos', { title: '토글 테스트' });
    const id = created.body.todo.id;

    const res = await request('PATCH', `/api/todos/${id}`, { completed: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.todo.completed, true);
  });

  it('DELETE /api/todos/:id — 삭제', async () => {
    const created = await request('POST', '/api/todos', { title: '삭제 대상' });
    const id = created.body.todo.id;

    const res = await request('DELETE', `/api/todos/${id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // 삭제 확인
    const list = await request('GET', '/api/todos');
    assert.equal(list.body.todos.length, 0);
  });

  it('GET /api/todos?filter=completed — 필터 동작', async () => {
    // 2개 생성, 1개만 완료
    const t1 = await request('POST', '/api/todos', { title: '미완료' });
    const t2 = await request('POST', '/api/todos', { title: '완료됨' });
    await request('PATCH', `/api/todos/${t2.body.todo.id}`, { completed: true });

    const res = await request('GET', '/api/todos?filter=completed');
    assert.equal(res.body.todos.length, 1);
    assert.equal(res.body.todos[0].title, '완료됨');
  });

  it('PATCH /api/todos/:id — 존재하지 않는 ID', async () => {
    const res = await request('PATCH', '/api/todos/nonexistent', { title: 'x' });
    assert.equal(res.status, 404);
  });

  it('GET /api/health — 헬스체크', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});
