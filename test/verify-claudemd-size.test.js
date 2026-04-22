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

// ---- #203 locale 독립성 / SSoT 회귀 가드 ----

test('한글 UTF-8 문자가 code point 단위로 측정 (byte 수 아님, #203)', () => {
  // 한글 1 글자는 UTF-8 에서 3 bytes. "가" × 20000 = code point 20000 / byte 60000
  // PR warn 임계(40000) 를 code point 로는 안 넘어야 정상, byte 로 세면 넘는다
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudemd-size-unicode-'));
  const file = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(file, '가'.repeat(20000));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    // code point 20000 → 35k 미만 → 정상 pass
    assert.match(result.stdout, /정상/);
    assert.doesNotMatch(result.stdout, /PR warn/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('LC_ALL=POSIX 환경에서도 code point 수 정확 (self-hosted 오차 62% 재발 차단, #203)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudemd-size-posix-'));
  const file = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(file, '한'.repeat(10000));
  try {
    const result = run(file, { LC_ALL: 'POSIX', LANG: 'POSIX' });
    // code point 10000 이어야 하며, byte 수 30000 으로 세지 않아야 한다
    assert.equal(result.code, 0);
    assert.match(result.stdout, /10000/);
    assert.doesNotMatch(result.stdout, /30000/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('기본 임계값이 lib/claudemd-size-constants.js SSoT 와 일치 (#203)', () => {
  const ssot = require('../lib/claudemd-size-constants');
  assert.equal(ssot.WARN_BOUNDARY, 35000, 'SSoT WARN_BOUNDARY 가 35000 이어야 함');
  assert.equal(ssot.WARN_PR, 40000, 'SSoT WARN_PR 가 40000 이어야 함');
  assert.equal(ssot.FAIL_THRESHOLD, 45000, 'SSoT FAIL_THRESHOLD 가 45000 이어야 함');

  // 스크립트가 실제로 SSoT 기본값을 사용하는지 — 34999 chars 파일은 pass (경계 미만)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudemd-size-ssot-'));
  const file = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(file, 'a'.repeat(ssot.WARN_BOUNDARY - 1));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /정상/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
