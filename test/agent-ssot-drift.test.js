// agent SSoT drift 회귀 가드
//
// 검증: `scripts/verify-agent-ssot.sh` 가 5개 에이전트 파일 (architect/developer/pm/qa/reviewer)
// 의 공통 코어 필드 7개 존재 + 순서 드리프트를 실제로 감지하는가.
//
// 테스트 전략:
// - 실 상태에서 exit 0 (35 checks pass)
// - 임시 디렉토리에 에이전트 파일을 복사 + 의도적 drift (필드 제거 / 순서 뒤집기) → exit 1 + 해당 필드 이름 보고
// - AGENT_DIR 환경변수로 스크립트의 검사 대상 디렉토리를 격리
//
// 배경: #145 Z 옵션 — SSoT 동기화 보장을 "사람 체크박스" 가 아닌 자동 drift 가드로.

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_DIR, 'scripts/verify-agent-ssot.sh');
const SOURCE_AGENT_DIR = path.join(PROJECT_DIR, '.claude/agents');
const AGENTS = ['architect', 'developer', 'pm', 'qa', 'reviewer'];

function runVerify(agentDir) {
  return spawnSync('bash', [SCRIPT_PATH], {
    encoding: 'utf8',
    env: { ...process.env, AGENT_DIR: agentDir ?? SOURCE_AGENT_DIR },
    timeout: 10_000,
  });
}

function setupIsolatedAgentDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-agent-ssot-'));
  for (const a of AGENTS) {
    fs.copyFileSync(path.join(SOURCE_AGENT_DIR, `${a}.md`), path.join(tmpDir, `${a}.md`));
  }
  return tmpDir;
}

test('agent SSoT drift guard: 정상 상태 — 5 files × 7 fields = 35 checks pass', () => {
  const result = runVerify();
  assert.strictEqual(result.status, 0, `exit 0 기대. status=${result.status} stderr=${result.stderr}`);
  assert.ok(
    result.stdout.includes('35 checks') || result.stdout.includes('drift 없음'),
    `정상 메시지 기대. stdout=${result.stdout}`
  );
});

test('agent SSoT drift guard: 필드 제거 시 실패 + 누락 필드 이름 보고', () => {
  const tmpDir = setupIsolatedAgentDir();
  try {
    // reviewer.md 에서 `"pr_comment_url"` 줄을 삭제 — 누락 drift 유도
    const file = path.join(tmpDir, 'reviewer.md');
    const original = fs.readFileSync(file, 'utf8');
    const mutated = original.replace(/^\s*"pr_comment_url".*$/m, '');
    assert.notStrictEqual(mutated, original, '테스트 사전조건: mutation 이 실제로 적용되어야 함');
    fs.writeFileSync(file, mutated);

    const result = runVerify(tmpDir);
    assert.strictEqual(result.status, 1, `drift 감지 exit 1 기대. status=${result.status}`);
    assert.ok(
      result.stderr.includes('[reviewer]') && result.stderr.includes('pr_comment_url'),
      `[reviewer] + 필드명 기대. stderr=${result.stderr}`
    );
    assert.ok(result.stderr.includes('누락'), `누락 키워드 기대. stderr=${result.stderr}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('agent SSoT drift guard: 필드 순서 이탈 시 실패 + 순서 키워드 보고', () => {
  const tmpDir = setupIsolatedAgentDir();
  try {
    // qa.md 에서 `commit_sha` 와 `pr_url` 라인 순서 뒤집기 — 순서 drift
    const file = path.join(tmpDir, 'qa.md');
    const text = fs.readFileSync(file, 'utf8');
    const commitLineMatch = text.match(/^(\s*"commit_sha":[^\n]*)$/m);
    const prLineMatch = text.match(/^(\s*"pr_url":[^\n]*)$/m);
    assert.ok(commitLineMatch && prLineMatch, '테스트 사전조건: 두 필드 라인 발견');
    // 두 라인 전체를 서로 교체
    const swapped = text
      .replace(commitLineMatch[0], '\0COMMIT_PLACEHOLDER\0')
      .replace(prLineMatch[0], commitLineMatch[0])
      .replace('\0COMMIT_PLACEHOLDER\0', prLineMatch[0]);
    assert.notStrictEqual(swapped, text, '테스트 사전조건: swap 이 실제로 적용되어야 함');
    fs.writeFileSync(file, swapped);

    const result = runVerify(tmpDir);
    assert.strictEqual(result.status, 1, `drift 감지 exit 1 기대. status=${result.status}`);
    assert.ok(
      result.stderr.includes('[qa]') && result.stderr.includes('순서'),
      `[qa] + 순서 키워드 기대. stderr=${result.stderr}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('agent SSoT drift guard: 에이전트 파일 누락 시 실패', () => {
  const tmpDir = setupIsolatedAgentDir();
  try {
    // pm.md 삭제
    fs.unlinkSync(path.join(tmpDir, 'pm.md'));
    const result = runVerify(tmpDir);
    assert.strictEqual(result.status, 1, `파일 누락 감지 exit 1 기대. status=${result.status}`);
    assert.ok(
      result.stderr.includes('[pm]') && result.stderr.includes('파일 없음'),
      `[pm] + 파일 없음 메시지 기대. stderr=${result.stderr}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
