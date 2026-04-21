'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'verify-claudemd-size.sh');

function makeFixture(size) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudemd-size-'));
  const file = path.join(dir, 'CLAUDE.md');
  // ASCII char 1 byte/char 로 정확히 size 문자 생성
  fs.writeFileSync(file, 'a'.repeat(size));
  return { dir, file };
}

function run(file, extraEnv = {}) {
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      env: { ...process.env, CLAUDEMD_FILE: file, ...extraEnv },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err) {
    return {
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || '',
      code: err.status || 1,
    };
  }
}

test('35k 미만 → pass + 조용 (경고 없음)', () => {
  const { dir, file } = makeFixture(20000);
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /정상/);
    assert.doesNotMatch(result.stdout, /경계 경보/);
    assert.doesNotMatch(result.stdout, /PR warn/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('35k 이상 40k 미만 → 경계 경보 (exit 0)', () => {
  const { dir, file } = makeFixture(37000);
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /각인 예산 경계 경보/);
    assert.doesNotMatch(result.stdout, /각인 예산 PR warn/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('40k 이상 45k 미만 → PR warn (exit 0)', () => {
  const { dir, file } = makeFixture(42000);
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /각인 예산 PR warn/);
    assert.match(result.stdout, /신규 인라인 블록 금지/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('45k 이상 → fail (exit 1 + stderr 가지치기 안내)', () => {
  const { dir, file } = makeFixture(46000);
  try {
    const result = run(file);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /각인 예산 초과/);
    assert.match(result.stderr, /가지치기/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('환경변수 override 로 임계 조정 가능', () => {
  const { dir, file } = makeFixture(20000);
  try {
    // 15k 를 fail 임계로 낮추면 20k 파일은 fail
    const result = run(file, { CLAUDEMD_SIZE_LIMIT_FAIL: '15000', CLAUDEMD_SIZE_LIMIT_WARN_PR: '10000', CLAUDEMD_SIZE_LIMIT_WARN_BOUNDARY: '5000' });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /각인 예산 초과/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('파일 없음 → exit 1', () => {
  const result = run('/tmp/does-not-exist-verify-size-test.md');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /파일 없음/);
});
