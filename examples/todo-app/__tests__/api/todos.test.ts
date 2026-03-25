import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/todos/route';
import { PATCH, DELETE } from '@/app/api/todos/[id]/route';
import { todoRepository } from '@/lib/todo-repository';

// NextRequest 생성 헬퍼
function createRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// [id] 라우트용 context 생성 헬퍼
function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  todoRepository.reset();
});

describe('To-Do API', () => {
  it('GET /api/todos — 빈 목록 반환', async () => {
    const res = await GET(createRequest('GET', '/api/todos'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.todos).toEqual([]);
  });

  it('POST /api/todos — 할 일 생성', async () => {
    const res = await POST(
      createRequest('POST', '/api/todos', { title: '테스트 할 일', description: '설명' }),
    );
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.todo.title).toBe('테스트 할 일');
    expect(body.todo.completed).toBe(false);
    expect(body.todo.id).toBeDefined();
  });

  it('POST /api/todos — 제목 없으면 400', async () => {
    const res = await POST(createRequest('POST', '/api/todos', { title: '' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/todos/:id — 완료 토글', async () => {
    // 생성
    const createRes = await POST(
      createRequest('POST', '/api/todos', { title: '토글 테스트' }),
    );
    const { todo: created } = await createRes.json();

    // 수정
    const res = await PATCH(
      createRequest('PATCH', `/api/todos/${created.id}`, { completed: true }),
      createContext(created.id),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.todo.completed).toBe(true);
  });

  it('DELETE /api/todos/:id — 삭제', async () => {
    const createRes = await POST(
      createRequest('POST', '/api/todos', { title: '삭제 대상' }),
    );
    const { todo: created } = await createRes.json();

    const res = await DELETE(
      createRequest('DELETE', `/api/todos/${created.id}`),
      createContext(created.id),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // 삭제 확인
    const listRes = await GET(createRequest('GET', '/api/todos'));
    const listBody = await listRes.json();
    expect(listBody.todos.length).toBe(0);
  });

  it('GET /api/todos?filter=completed — 필터 동작', async () => {
    // 2개 생성, 1개만 완료
    await POST(createRequest('POST', '/api/todos', { title: '미완료' }));
    const t2Res = await POST(createRequest('POST', '/api/todos', { title: '완료됨' }));
    const { todo: t2 } = await t2Res.json();
    await PATCH(
      createRequest('PATCH', `/api/todos/${t2.id}`, { completed: true }),
      createContext(t2.id),
    );

    const res = await GET(createRequest('GET', '/api/todos?filter=completed'));
    const body = await res.json();
    expect(body.todos.length).toBe(1);
    expect(body.todos[0].title).toBe('완료됨');
  });

  it('PATCH /api/todos/:id — 존재하지 않는 ID', async () => {
    const res = await PATCH(
      createRequest('PATCH', '/api/todos/nonexistent', { title: 'x' }),
      createContext('nonexistent'),
    );
    expect(res.status).toBe(404);
  });

  it('POST /api/todos — 카테고리 지정', async () => {
    const res = await POST(
      createRequest('POST', '/api/todos', { title: '운동', category: 'health' }),
    );
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.todo.category).toBe('health');
  });

  it('POST /api/todos — 카테고리 미지정 시 기본값', async () => {
    const res = await POST(
      createRequest('POST', '/api/todos', { title: '기본' }),
    );
    const body = await res.json();
    expect(body.todo.category).toBe('personal');
  });

  it('GET /api/health — 헬스체크', async () => {
    const { GET: healthGET } = await import('@/app/api/health/route');
    const res = await healthGET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
  });
});
