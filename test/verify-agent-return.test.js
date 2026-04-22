// verify-agent-return.js 회귀 테스트 (#184)
//
// 3 variance 패턴 커버 (ADR docs/decisions/20260422-subagent-runtime-variance-defense.md):
//   1. 필드 누락 — #167 / #178 실측 재현 (spawned_bg_pids / bg_process_handoff 자체 부재)
//   2. null 과 기본값 이탈 — #170 실측 재현 (array 필드에 null)
//   3. 값 타입 불일치 — string 에 number 등
//
// 추가 검증:
//   - 정상 9필드 JSON → exit 0
//   - JSON 파싱 실패 → exit 2
//   - 파일 입력 / stdin 입력 동등성

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const SCRIPT = path.join(PROJECT_DIR, 'lib/verify-agent-return.js');

const VALID = {
  commit_sha: 'abc1234',
  pr_url: 'https://github.com/coseo12/harness-setting/pull/1',
  pr_comment_url: null,
  labels_applied_or_transitioned: ['stage:qa'],
  auto_close_issue_states: { '#118': 'CLOSED' },
  blocking_issues: [],
  non_blocking_suggestions: [],
  spawned_bg_pids: [85117],
  bg_process_handoff: 'main-cleanup',
};

function run(args, stdin) {
  return spawnSync('node', [SCRIPT, ...args], {
    cwd: PROJECT_DIR,
    input: stdin,
    encoding: 'utf8',
    timeout: 30_000,
  });
}

function runJson(obj) {
  return run(['--json', JSON.stringify(obj)]);
}

test('정상 9필드 JSON → exit 0', () => {
  const r = runJson(VALID);
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /정합/);
});

test('variance 1 — 필드 누락 (#167 / #178 재현)', () => {
  const obj = { ...VALID };
  delete obj.spawned_bg_pids;
  delete obj.bg_process_handoff;
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /필드 누락 2건/);
  assert.match(r.stderr, /spawned_bg_pids/);
  assert.match(r.stderr, /bg_process_handoff/);
});

test('variance 2 — null 과 기본값 이탈 (#170 재현)', () => {
  // spawned_bg_pids 는 array 기본값 [], bg_process_handoff 는 enum 기본값 "none"
  // null 은 규약 위반 (array/enum 필드에 null 허용 안 함)
  const obj = { ...VALID, spawned_bg_pids: null, bg_process_handoff: null };
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /타입\/값 불일치/);
  assert.match(r.stderr, /spawned_bg_pids/);
  assert.match(r.stderr, /bg_process_handoff/);
});

test('variance 3 — 값 타입 불일치 (string 에 number)', () => {
  const obj = { ...VALID, commit_sha: 12345 };
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /commit_sha/);
  assert.match(r.stderr, /'number'/);
});

test('bg_process_handoff enum 이탈', () => {
  const obj = { ...VALID, bg_process_handoff: 'invalid-value' };
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /bg_process_handoff/);
  assert.match(r.stderr, /enum/);
});

test('labels_applied_or_transitioned 에 non-string 혼입', () => {
  const obj = { ...VALID, labels_applied_or_transitioned: ['stage:qa', 42] };
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /labels_applied_or_transitioned/);
});

test('auto_close_issue_states 에 non-string 값', () => {
  const obj = { ...VALID, auto_close_issue_states: { '#1': 'CLOSED', '#2': 123 } };
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /auto_close_issue_states/);
});

test('spawned_bg_pids 에 non-integer', () => {
  const obj = { ...VALID, spawned_bg_pids: [1.5, 2] };
  const r = runJson(obj);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /spawned_bg_pids/);
});

test('빈 배열 / 빈 객체 허용 (pr_comment_url null 포함)', () => {
  const r = runJson({
    commit_sha: null,
    pr_url: null,
    pr_comment_url: null,
    labels_applied_or_transitioned: [],
    auto_close_issue_states: {},
    blocking_issues: [],
    non_blocking_suggestions: [],
    spawned_bg_pids: [],
    bg_process_handoff: 'none',
  });
  assert.equal(r.status, 0);
});

test('전체 9필드 모두 누락 (root empty object)', () => {
  const r = runJson({});
  assert.equal(r.status, 1);
  assert.match(r.stderr, /필드 누락 9건/);
});

test('root 가 object 가 아닌 경우 (array)', () => {
  const r = runJson([1, 2, 3]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\(root\)/);
});

test('JSON 파싱 실패 → exit 2', () => {
  const r = run(['--json', 'not-json-at-all{']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /JSON 파싱 실패/);
});

test('--stdin 모드 동등성', () => {
  const r = run(['--stdin'], JSON.stringify(VALID));
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /정합/);
});

test('--file 모드 동등성', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-return-'));
  const file = path.join(tmp, 'return.json');
  fs.writeFileSync(file, JSON.stringify(VALID));
  try {
    const r = run(['--file', file]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /정합/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--file 파일 없음 → exit 2', () => {
  const r = run(['--file', '/tmp/does-not-exist-agent-return-xyz.json']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /파일 없음/);
});

test('입력 모드 생략 → exit 2 + usage', () => {
  const r = run([]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /입력 모드 필요/);
});
