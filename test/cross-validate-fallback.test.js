// cross_validate.sh 의 API capacity 폴백 프로토콜 스모크 테스트
// CLAUDE.md `## 교차검증` API capacity 폴백 프로토콜 준수 여부를
// mock gemini 바이너리로 시뮬레이션해 검증한다.
//
// 검증 항목:
// - 429 시뮬레이션 → capacity 체크 실행 + 재시도 + 최종 claude-only fallback
// - exit code 77 (EXIT_CLAUDE_ONLY_FALLBACK) 반환
// - stderr 에 "claude-only analysis completed" 프리픽스 출력
// - CROSS_VALIDATE_ANCHOR 환경변수 있을 때 reminder 이슈 dry-run 출력
// - CROSS_VALIDATE_ANCHOR 없을 때 dry-run 생략
// - 정상 응답 시 exit 0 + dry-run 출력 없음

const { test } = require('node:test');
const assert = require('node:assert');
const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_DIR, '.claude/skills/cross-validate/scripts/cross_validate.sh');

// mock gemini 바이너리 생성 헬퍼
// mode: '429' | 'ok' | 'fatal'
function setupMockGemini(mode) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-mock-'));
  const mockPath = path.join(tmpDir, 'gemini');
  let script;
  if (mode === '429') {
    // 모든 호출 실패 (capacity 체크 + 재시도 모두 429)
    script = `#!/bin/bash\necho "Error: 429 RESOURCE_EXHAUSTED" >&2\nexit 1\n`;
  } else if (mode === 'ok') {
    script = `#!/bin/bash\necho "mock gemini response"\nexit 0\n`;
  } else if (mode === 'fatal') {
    script = `#!/bin/bash\necho "Error: invalid argument" >&2\nexit 2\n`;
  } else {
    throw new Error(`unknown mode: ${mode}`);
  }
  fs.writeFileSync(mockPath, script, { mode: 0o755 });
  return { tmpDir, mockPath };
}

function runScript(args, env) {
  const result = spawnSync('bash', [SCRIPT_PATH, ...args], {
    cwd: PROJECT_DIR,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 60_000,
  });
  return result;
}

test('cross-validate: 429 응답 → claude-only fallback exit code 77', () => {
  const { tmpDir, mockPath } = setupMockGemini('429');
  try {
    // MAX_GEMINI_RETRIES 는 스크립트 내부 고정값(2) — 실행 시간 단축 위해 sleep 을 회피하는
    // 환경변수가 없으므로 짧은 structure 프롬프트로 테스트 (sleep 총 5초 이내)
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 77, `exit code 77 기대, 실제: ${result.status}`);
    assert.ok(
      result.stderr.includes('claude-only analysis completed'),
      `stderr 에 claude-only 프리픽스 기대. 실제 stderr: ${result.stderr}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('cross-validate: CROSS_VALIDATE_ANCHOR 설정 시 reminder 이슈 dry-run 출력', () => {
  const { tmpDir } = setupMockGemini('429');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
      CROSS_VALIDATE_ANCHOR: 'MINOR-behavior-change',
    });
    assert.strictEqual(result.status, 77);
    assert.ok(
      result.stderr.includes('[reminder-issue-dryrun]'),
      `reminder dry-run prefix 기대. 실제 stderr: ${result.stderr}`
    );
    assert.ok(
      result.stderr.includes('MINOR-behavior-change'),
      `앵커 유형 출력 기대. 실제 stderr: ${result.stderr}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('cross-validate: CROSS_VALIDATE_ANCHOR 미설정 시 dry-run 생략', () => {
  const { tmpDir } = setupMockGemini('429');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
      CROSS_VALIDATE_ANCHOR: '',
    });
    assert.strictEqual(result.status, 77);
    assert.ok(
      !result.stderr.includes('[reminder-issue-dryrun]'),
      `앵커 미설정 시 dry-run 출력 없어야 함. 실제 stderr: ${result.stderr}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('cross-validate: 정상 응답 → exit 0', () => {
  const { tmpDir } = setupMockGemini('ok');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 0, `정상 응답은 exit 0. 실제: ${result.status}, stderr: ${result.stderr}`);
    assert.ok(
      !result.stderr.includes('claude-only analysis completed'),
      `정상 응답에는 fallback 프리픽스 없어야 함`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('cross-validate: 비-capacity fatal 오류 → exit 1 (claude-only 시그널 아님)', () => {
  const { tmpDir } = setupMockGemini('fatal');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 1, `fatal 오류는 exit 1. 실제: ${result.status}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
