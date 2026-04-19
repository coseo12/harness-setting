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
// mode: '429' | 'ok' | 'fatal' | 'recover-after-1' | '429-counted'
//   recover-after-1: 1차 호출 429, 2차 이후 정상 — 복구 분기 검증 (reviewer 권고 6, #131 Phase A)
//   429-counted: 모든 호출 429, 호출 횟수를 counter 파일에 기록 — probe 생략 검증 (권고 4, #131 Phase B)
function setupMockGemini(mode) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-mock-'));
  const mockPath = path.join(tmpDir, 'gemini');
  const counterPath = path.join(tmpDir, 'counter');
  let script;
  if (mode === '429') {
    // 모든 호출 실패 (capacity 체크 + 재시도 모두 429)
    script = `#!/bin/bash\necho "Error: 429 RESOURCE_EXHAUSTED" >&2\nexit 1\n`;
  } else if (mode === 'ok') {
    script = `#!/bin/bash\necho "mock gemini response"\nexit 0\n`;
  } else if (mode === 'fatal') {
    script = `#!/bin/bash\necho "Error: invalid argument" >&2\nexit 2\n`;
  } else if (mode === 'recover-after-1') {
    // 임시 디렉토리 내 counter 파일로 호출 순번 추적 — 1차 429, 2차+ 정상
    script = `#!/bin/bash
COUNTER_FILE="${counterPath}"
count=0
if [ -f "\${COUNTER_FILE}" ]; then count=$(cat "\${COUNTER_FILE}"); fi
count=$((count + 1))
echo "\${count}" > "\${COUNTER_FILE}"
if [ "\${count}" = "1" ]; then
  echo "Error: 429 RESOURCE_EXHAUSTED" >&2
  exit 1
fi
echo "mock gemini recovered response (call \${count})"
exit 0
`;
  } else if (mode === '429-counted') {
    // 모든 호출 429 + 호출 횟수 counter 기록 — SKIP_CAPACITY_PROBE 검증용 (권고 4, #131 Phase B)
    script = `#!/bin/bash
COUNTER_FILE="${counterPath}"
count=0
if [ -f "\${COUNTER_FILE}" ]; then count=$(cat "\${COUNTER_FILE}"); fi
count=$((count + 1))
echo "\${count}" > "\${COUNTER_FILE}"
echo "Error: 429 RESOURCE_EXHAUSTED" >&2
exit 1
`;
  } else {
    throw new Error(`unknown mode: ${mode}`);
  }
  fs.writeFileSync(mockPath, script, { mode: 0o755 });
  return { tmpDir, mockPath, counterPath };
}

// 각 테스트마다 고유 LOG_DIR 을 사용해 outcome JSON 간섭 방지 (reviewer 권고 5)
function setupLogDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-logs-'));
}

function runScript(args, env) {
  const result = spawnSync('bash', [SCRIPT_PATH, ...args], {
    cwd: PROJECT_DIR,
    env: {
      ...process.env,
      // 테스트에서는 sleep 생략 — 재시도 로직 자체만 검증
      GEMINI_RETRY_SLEEP_SECONDS: '0',
      ...env,
    },
    encoding: 'utf8',
    timeout: 60_000,
  });
  return result;
}

// 지정한 LOG_DIR 에서 최신 outcome JSON 읽기 (테스트 격리용)
function readOutcomeFromDir(logDir) {
  const files = fs.readdirSync(logDir)
    .filter((f) => f.endsWith('-outcome.json'))
    .map((f) => ({ full: path.join(logDir, f), mtime: fs.statSync(path.join(logDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files[0]) return null;
  return JSON.parse(fs.readFileSync(files[0].full, 'utf8'));
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

// Phase 3 (#131) — outcome JSON 파일 출력 + architect 자동 매핑 근거 검증
// 테스트 격리: 각 테스트가 자체 LOG_DIR 사용 (reviewer 권고 5)

test('cross-validate outcome: 429 응답 → outcome JSON 에 "429-fallback-claude-only" 기록', () => {
  const { tmpDir } = setupMockGemini('429');
  const logDir = setupLogDir();
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      REMINDER_ISSUE_DRYRUN: '1',
      CROSS_VALIDATE_ANCHOR: 'MINOR-behavior-change',
    });
    assert.strictEqual(result.status, 77);

    const outcome = readOutcomeFromDir(logDir);
    assert.ok(outcome, 'outcome JSON 파일이 생성되어야 함');
    assert.strictEqual(outcome.outcome, '429-fallback-claude-only');
    assert.strictEqual(outcome.exit_code, 77);
    assert.strictEqual(outcome.anchor, 'MINOR-behavior-change');
    // reminder 이슈는 dry-run 이므로 "dryrun" 기대 (reviewer 차단 반영: 실제 결과)
    assert.strictEqual(outcome.reminder_issue, 'dryrun');
    // stdout 에 outcome-file prefix 출력 (architect bash 스니펫 파싱용)
    assert.ok(
      result.stdout.includes('[outcome-file]'),
      `stdout 에 [outcome-file] prefix 필요. 실제 stdout: ${result.stdout}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('cross-validate outcome: 정상 응답 → outcome JSON 에 "applied" 기록', () => {
  const { tmpDir } = setupMockGemini('ok');
  const logDir = setupLogDir();
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 0);

    const outcome = readOutcomeFromDir(logDir);
    assert.ok(outcome);
    assert.strictEqual(outcome.outcome, 'applied');
    assert.strictEqual(outcome.exit_code, 0);
    assert.strictEqual(outcome.reminder_issue, 'none');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('cross-validate outcome: fatal 오류 → outcome JSON 에 "fatal-error" 기록', () => {
  const { tmpDir } = setupMockGemini('fatal');
  const logDir = setupLogDir();
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 1);

    const outcome = readOutcomeFromDir(logDir);
    assert.ok(outcome);
    assert.strictEqual(outcome.outcome, 'fatal-error');
    assert.strictEqual(outcome.exit_code, 1);
    assert.strictEqual(outcome.reminder_issue, 'none');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

// Phase A (#131) — 권고 1, 6 추가 검증

test('cross-validate: 1차 429 → capacity 복구 → 2차 정상 응답 → exit 0 (복구 분기, 권고 6)', () => {
  const { tmpDir } = setupMockGemini('recover-after-1');
  const logDir = setupLogDir();
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    // 1차 429 → check_gemini_capacity (2차 호출, ok) → run_gemini 재시도 (3차 호출, ok) → exit 0
    assert.strictEqual(result.status, 0, `복구 후 exit 0 기대. 실제: ${result.status}, stderr: ${result.stderr}`);
    // fallback 프리픽스는 없어야 함 (최종적으로 성공)
    assert.ok(
      !result.stderr.includes('claude-only analysis completed'),
      `복구 성공 시 fallback 프리픽스 없어야 함. 실제 stderr: ${result.stderr}`
    );
    assert.ok(
      !result.stdout.includes('[claude-only-fallback]'),
      `복구 성공 시 stdout fallback 헤더 없어야 함. 실제 stdout: ${result.stdout}`
    );
    // outcome JSON 은 "applied"
    const outcome = readOutcomeFromDir(logDir);
    assert.ok(outcome);
    assert.strictEqual(outcome.outcome, 'applied');
    assert.strictEqual(outcome.exit_code, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('cross-validate: 429 fallback 시 stdout 에 [claude-only-fallback] 헤더 출력 (권고 1)', () => {
  const { tmpDir } = setupMockGemini('429');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 77);
    // stdout 에도 fallback 헤더가 있어야 호출 측이 stdout 만으로 모드 구분 가능
    assert.ok(
      result.stdout.includes('[claude-only-fallback]'),
      `stdout 에 [claude-only-fallback] 헤더 기대. 실제 stdout: ${result.stdout}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// Phase B (#131) — 권고 4 (SKIP_CAPACITY_PROBE) / sleep cap / 헬퍼 스크립트

test('cross-validate: SKIP_CAPACITY_PROBE=1 → probe 호출 생략, mock 호출 횟수 = MAX_RETRIES (권고 4)', () => {
  const { tmpDir, counterPath } = setupMockGemini('429-counted');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
      SKIP_CAPACITY_PROBE: '1',
    });
    assert.strictEqual(result.status, 77);
    // probe 생략 시 mock gemini 호출은 run_gemini 의 재시도 루프 횟수만 (= MAX_GEMINI_RETRIES = 2)
    // probe 가 활성이었다면 3번 호출 (초기 + probe + 재시도)
    const callCount = parseInt(fs.readFileSync(counterPath, 'utf8').trim(), 10);
    assert.strictEqual(callCount, 2, `SKIP_PROBE=1 시 mock 호출 2회 기대. 실제: ${callCount}`);
    assert.ok(
      result.stderr.includes('capacity probe 생략') || result.stdout.includes('capacity probe 생략'),
      `probe 생략 로그 기대. stderr: ${result.stderr}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('cross-validate: SKIP_CAPACITY_PROBE=0 (기본) → probe 호출 수행, mock 호출 횟수 = 3', () => {
  const { tmpDir, counterPath } = setupMockGemini('429-counted');
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 77);
    // 기본값: probe 활성 → 3번 호출 (초기 429 + probe 429 + 재시도 429)
    const callCount = parseInt(fs.readFileSync(counterPath, 'utf8').trim(), 10);
    assert.strictEqual(callCount, 3, `기본 probe 활성 시 mock 호출 3회 기대. 실제: ${callCount}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('cross-validate: GEMINI_RETRY_SLEEP_CAP 적용 시 cap 로그 출력', () => {
  const { tmpDir } = setupMockGemini('429');
  const logDir = setupLogDir();
  try {
    // sleep cap 로그 검증 — raw=2*100=200s > cap=1s 이므로 cap 적용
    // 실제 sleep 은 1초 (테스트 slowdown)
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      REMINDER_ISSUE_DRYRUN: '1',
      GEMINI_RETRY_SLEEP_SECONDS: '100',
      GEMINI_RETRY_SLEEP_CAP: '1',
    });
    assert.strictEqual(result.status, 77);
    // 로그 파일에서 cap 적용 메시지 확인
    const logFiles = fs.readdirSync(logDir).filter((f) => f.endsWith('.log'));
    assert.ok(logFiles.length > 0, 'log 파일이 생성되어야 함');
    const logContent = fs.readFileSync(path.join(logDir, logFiles[0]), 'utf8');
    assert.ok(
      logContent.includes('sleep cap 1s 적용'),
      `sleep cap 적용 로그 기대. 실제 log: ${logContent}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

// parse-cross-validate-outcome.sh 헬퍼 스크립트 단위 테스트 (권고 7, #131 Phase B)
const HELPER_PATH = path.join(PROJECT_DIR, 'scripts/parse-cross-validate-outcome.sh');

function runHelper(args, stdinContent) {
  const result = spawnSync('bash', [HELPER_PATH, ...args], {
    cwd: PROJECT_DIR,
    input: stdinContent,
    encoding: 'utf8',
    timeout: 10_000,
  });
  return result;
}

function writeOutcomeJson(dir, data) {
  const outcomeFile = path.join(dir, `cross-validate-structure-${Date.now()}-outcome.json`);
  fs.writeFileSync(outcomeFile, JSON.stringify(data, null, 2));
  return outcomeFile;
}

test('parse-helper: outcome JSON 직접 파싱 → KEY=value 형식 stdout 출력', () => {
  const logDir = setupLogDir();
  try {
    const outcomeFile = writeOutcomeJson(logDir, {
      outcome: 'applied',
      exit_code: 0,
      anchor: 'MINOR-behavior-change',
      pr_ref: '#137',
      context: 'code:137',
      log_file: '/tmp/test.log',
      reminder_issue: 'none',
      timestamp: '2026-04-19T00:00:00Z',
    });
    const result = runHelper([outcomeFile]);
    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /CROSS_VALIDATE_OUTCOME="applied"/);
    assert.match(result.stdout, /CROSS_VALIDATE_EXIT_CODE=0/);
    assert.match(result.stdout, /CROSS_VALIDATE_REMINDER="none"/);
    assert.match(result.stdout, /CROSS_VALIDATE_ANCHOR="MINOR-behavior-change"/);
  } finally {
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('parse-helper: 429 fallback outcome JSON → exit_code=77 + reminder 추출', () => {
  const logDir = setupLogDir();
  try {
    const outcomeFile = writeOutcomeJson(logDir, {
      outcome: '429-fallback-claude-only',
      exit_code: 77,
      anchor: 'ADR-new-or-amendment',
      pr_ref: '',
      context: 'architecture:docs/decisions/foo.md',
      log_file: '/tmp/test.log',
      reminder_issue: 'dryrun',
      timestamp: '2026-04-19T00:00:00Z',
    });
    const result = runHelper([outcomeFile]);
    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /CROSS_VALIDATE_OUTCOME="429-fallback-claude-only"/);
    assert.match(result.stdout, /CROSS_VALIDATE_EXIT_CODE=77/);
    assert.match(result.stdout, /CROSS_VALIDATE_REMINDER="dryrun"/);
  } finally {
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('parse-helper: 파일 없음 → OUTCOME="missing" + stderr 경고', () => {
  const result = runHelper(['/nonexistent/path.json']);
  assert.strictEqual(result.status, 0, `파일 없어도 exit 0 (안전 기본값 출력)`);
  assert.match(result.stdout, /CROSS_VALIDATE_OUTCOME="missing"/);
  assert.match(result.stdout, /CROSS_VALIDATE_EXIT_CODE=1/);
  assert.ok(
    result.stderr.includes('outcome 파일 없음'),
    `stderr 에 경고 기대. 실제: ${result.stderr}`
  );
});

test('parse-helper: --from-stdout 모드 → [outcome-file] 프리픽스 자동 추출', () => {
  const logDir = setupLogDir();
  try {
    const outcomeFile = writeOutcomeJson(logDir, {
      outcome: 'applied',
      exit_code: 0,
      anchor: '',
      pr_ref: '',
      context: 'skill:cross-validate',
      log_file: '/tmp/test.log',
      reminder_issue: 'none',
      timestamp: '2026-04-19T00:00:00Z',
    });
    // cross_validate.sh stdout 모방
    const fakeStdout = `Some gemini response body\n[outcome-file] ${outcomeFile}\n`;
    const result = runHelper(['--from-stdout'], fakeStdout);
    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /CROSS_VALIDATE_OUTCOME="applied"/);
  } finally {
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('parse-helper: --from-stdout 에서 프리픽스 부재 → OUTCOME="missing"', () => {
  const result = runHelper(['--from-stdout'], 'No outcome prefix here\n');
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /CROSS_VALIDATE_OUTCOME="missing"/);
  assert.ok(
    result.stderr.includes('찾지 못함'),
    `stderr 에 경고 기대. 실제: ${result.stderr}`
  );
});

test('parse-helper + cross_validate.sh 통합: 실제 outcome JSON 파싱 (정상 경로)', () => {
  const { tmpDir } = setupMockGemini('ok');
  const logDir = setupLogDir();
  try {
    const result = runScript(['structure'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      REMINDER_ISSUE_DRYRUN: '1',
    });
    assert.strictEqual(result.status, 0);
    // 실측 stdout 을 헬퍼에 파이프
    const helperResult = runHelper(['--from-stdout'], result.stdout);
    assert.strictEqual(helperResult.status, 0);
    assert.match(helperResult.stdout, /CROSS_VALIDATE_OUTCOME="applied"/);
    assert.match(helperResult.stdout, /CROSS_VALIDATE_EXIT_CODE=0/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});
