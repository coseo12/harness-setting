// verify-lessons-readme.sh 회귀 테스트 (#213)
//
// 검증 항목:
// - 모든 파일이 README 에 등록된 상태 → exit 0
// - 신규 파일 추가 but README 미등록 → exit 1 + stderr 누락 목록 출력
// - README 부재 → exit 1
// - 디렉토리 부재 → exit 0 (다운스트림 skip)
// - README 만 있고 다른 .md 없음 → exit 0

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_DIR, 'scripts/verify-lessons-readme.sh');

function setupLessonsDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'harness-lessons-'));
}

function writeReadme(dir, registeredFiles) {
  const rows = registeredFiles
    .map((f) => `| [${f}](${f}) | 요지 | [#1](https://example.com) |`)
    .join('\n');
  const content = `# docs/lessons/

## 파일 목록

| 파일 | 요지 | 관련 볼트 이슈 |
|---|---|---|
${rows}
`;
  fs.writeFileSync(path.join(dir, 'README.md'), content);
}

function runScript(lessonsDir) {
  return spawnSync('bash', [SCRIPT_PATH], {
    cwd: PROJECT_DIR,
    env: { ...process.env, LESSONS_DIR: lessonsDir },
    encoding: 'utf8',
    timeout: 30_000,
  });
}

test('verify-lessons-readme: 모든 파일 등록 → exit 0', () => {
  const dir = setupLessonsDir();
  try {
    fs.writeFileSync(path.join(dir, 'foo.md'), '# foo');
    fs.writeFileSync(path.join(dir, 'bar.md'), '# bar');
    writeReadme(dir, ['foo.md', 'bar.md']);
    const r = runScript(dir);
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\nstderr: ${r.stderr}`);
    assert.match(r.stdout, /동기화 정합/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('verify-lessons-readme: 신규 파일 미등록 → exit 1', () => {
  const dir = setupLessonsDir();
  try {
    fs.writeFileSync(path.join(dir, 'foo.md'), '# foo');
    fs.writeFileSync(path.join(dir, 'bar.md'), '# bar');
    fs.writeFileSync(path.join(dir, 'baz.md'), '# baz');
    writeReadme(dir, ['foo.md', 'bar.md']); // baz 누락
    const r = runScript(dir);
    assert.strictEqual(r.status, 1);
    assert.ok(r.stderr.includes('baz.md'), `stderr 에 누락 파일 포함 기대. 실제: ${r.stderr}`);
    assert.ok(!r.stderr.includes('foo.md'), '등록된 파일은 stderr 에 없어야 함');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('verify-lessons-readme: README 부재 → exit 1', () => {
  const dir = setupLessonsDir();
  try {
    fs.writeFileSync(path.join(dir, 'foo.md'), '# foo');
    const r = runScript(dir);
    assert.strictEqual(r.status, 1);
    assert.ok(r.stderr.includes('README.md 부재'), `stderr: ${r.stderr}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('verify-lessons-readme: 디렉토리 부재 → exit 0 (skip)', () => {
  const dir = setupLessonsDir();
  const nonexistent = path.join(dir, 'nope');
  try {
    const r = runScript(nonexistent);
    assert.strictEqual(r.status, 0);
    assert.match(r.stdout, /부재.*skip/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('verify-lessons-readme: README 만 있고 다른 .md 없음 → exit 0', () => {
  const dir = setupLessonsDir();
  try {
    writeReadme(dir, []);
    const r = runScript(dir);
    assert.strictEqual(r.status, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
