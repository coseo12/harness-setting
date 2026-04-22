// cross_validate.sh 의 diff 2000줄 초과 처리 회귀 테스트 (이슈 #207)
//
// 배경: `echo "$DIFF" | head -2000` 가 파이프 버퍼(64KB) 초과 시
// producer 에 SIGPIPE 를 전달해 `set -euo pipefail` 하에서 스크립트가
// exit 141 로 조기 종료하던 버그. `awk 'NR<=2000'` 으로 교체해 회피.
//
// 검증 항목:
// - 3000 라인 (>64KB) diff 에서 스크립트 정상 완료 + outcome.json 생성
// - 1000 라인 diff 에서 기존 동작 유지 (truncation 분기 미진입)
// - 두 케이스 모두 log 에 적절한 메시지 출력 여부 확인

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(
  PROJECT_DIR,
  '.claude/skills/cross-validate/scripts/cross_validate.sh'
);

// mock gh + gemini 바이너리 생성.
// gh pr diff <N> 는 지정된 라인 수만큼 fake diff 출력,
// gh pr view ... 는 고정 PR 메타, gemini 는 정상 응답을 낸다.
// 각 라인을 40자 이상으로 채워 총 용량이 64KB 파이프 버퍼를 초과하도록 구성.
function setupMocks(diffLines) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-diff-'));

  const ghPath = path.join(tmpDir, 'gh');
  const ghScript = `#!/bin/bash
# 첫 인자 "pr", 두 번째 "diff" | "view" 분기
if [ "$1" = "pr" ] && [ "$2" = "diff" ]; then
  # 40+ 자 라인을 N줄 출력 — 64KB 파이프 버퍼 초과 유도
  awk -v n=${diffLines} 'BEGIN {
    for (i = 1; i <= n; i++) {
      printf "+++++++++++++++ fake diff line %05d ++++++++++++++++\\n", i
    }
  }'
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "view" ]; then
  echo "제목: mock PR"
  echo "라벨: "
  echo "본문: mock body"
  exit 0
fi
exit 0
`;
  fs.writeFileSync(ghPath, ghScript, { mode: 0o755 });

  const geminiPath = path.join(tmpDir, 'gemini');
  fs.writeFileSync(
    geminiPath,
    `#!/bin/bash\necho "mock gemini review"\nexit 0\n`,
    { mode: 0o755 }
  );

  return { tmpDir, ghPath, geminiPath };
}

function setupLogDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-logs-'));
}

function runScript(args, env) {
  return spawnSync('bash', [SCRIPT_PATH, ...args], {
    cwd: PROJECT_DIR,
    env: { ...process.env, GEMINI_RETRY_SLEEP_SECONDS: '0', ...env },
    encoding: 'utf8',
    timeout: 60_000,
  });
}

function readOutcomeFromDir(logDir) {
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.endsWith('-outcome.json'))
    .map((f) => ({
      full: path.join(logDir, f),
      mtime: fs.statSync(path.join(logDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files[0]) return null;
  return JSON.parse(fs.readFileSync(files[0].full, 'utf8'));
}

function readLatestLog(logDir) {
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.startsWith('cross-validate-code-') && f.endsWith('.log'))
    .map((f) => ({
      full: path.join(logDir, f),
      mtime: fs.statSync(path.join(logDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files[0]) return '';
  return fs.readFileSync(files[0].full, 'utf8');
}

test('cross-validate code: 2000줄 초과 diff 에서도 완주 + outcome.json 생성 (#207)', () => {
  const { tmpDir } = setupMocks(3000);
  const logDir = setupLogDir();
  try {
    const result = runScript(['code', '207'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
    });

    assert.strictEqual(
      result.status,
      0,
      `3000줄 diff 에서 exit 0 기대, 실제: ${result.status}\nstderr: ${result.stderr}\nstdout: ${result.stdout}`
    );

    const outcome = readOutcomeFromDir(logDir);
    assert.ok(outcome, 'outcome.json 생성 기대');
    assert.strictEqual(outcome.outcome, 'applied');
    assert.strictEqual(outcome.exit_code, 0);

    const log = readLatestLog(logDir);
    assert.ok(
      log.includes('경고: diff가') && log.includes('3000'),
      `truncation 경고 로그 기대. 실제 log 일부: ${log.slice(0, 500)}`
    );
    assert.ok(
      log.includes('=== 교차검증 완료 ==='),
      `완료 로그 기대 (조기 종료 회귀 탐지). 실제 log 일부: ${log.slice(-500)}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});

test('cross-validate code: 2000줄 미만 diff 는 truncation 분기 미진입 (회귀 가드)', () => {
  const { tmpDir } = setupMocks(1000);
  const logDir = setupLogDir();
  try {
    const result = runScript(['code', '207'], {
      PATH: `${tmpDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
    });

    assert.strictEqual(result.status, 0, `exit 0 기대. stderr: ${result.stderr}`);

    const outcome = readOutcomeFromDir(logDir);
    assert.ok(outcome);
    assert.strictEqual(outcome.outcome, 'applied');

    const log = readLatestLog(logDir);
    assert.ok(
      !log.includes('경고: diff가'),
      `2000줄 미만에서는 truncation 경고 없어야 함. log: ${log.slice(0, 500)}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
  }
});
