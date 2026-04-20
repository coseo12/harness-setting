// boundary regression guard — parse-cross-validate-outcome.sh
//
// 목적: write 측 cross_validate.sh::json_escape() 와 read 측
// parse-cross-validate-outcome.sh 의 grep/sed 파이프라인 간 round-trip 을
// 경계 문자 (`\`, tab, newline, CR) 에 대해 검증한다.
// double-quote 는 알려진 한계 (아래 NOTE 참조) — 실 사용 필드 값 범위 밖.
//
// 이 테스트가 실패한다는 것은 다음 중 하나를 의미:
//   1. write 측 json_escape() 의 escape 범위가 축소/깨짐
//   2. parse 측 정규식이 (double-quote 외) escape 경계를 잘못 해석
//   3. outcome JSON 스키마가 flat 이 아닌 구조로 변경 (재검토 트리거)
//
// 배경: #141 NO-OP ADR (docs/decisions/20260420-jq-based-parsing-no-op.md).
// jq 기반 전환을 기각한 대신 본 가드로 grep/sed 파이프라인의 장기 안정성을
// 지속 관측한다. 테스트 이름에 `boundary regression guard` 명시 — 이 가드를
// 제거하려면 ADR 재검토 트리거 중 하나가 선행되어야 한다.

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const CROSS_VALIDATE_SCRIPT = path.join(
  PROJECT_DIR,
  '.claude/skills/cross-validate/scripts/cross_validate.sh'
);
const PARSE_HELPER = path.join(PROJECT_DIR, 'scripts/parse-cross-validate-outcome.sh');

// mock gemini (ok 모드) 생성 — write 경로까지 정상 도달시키려면 최소 1회 성공 응답 필요
function setupMockGemini() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-boundary-'));
  const mockPath = path.join(tmpDir, 'gemini');
  fs.writeFileSync(
    mockPath,
    `#!/bin/bash\necho "mock gemini boundary-test response"\nexit 0\n`,
    { mode: 0o755 }
  );
  return { tmpDir, mockPath };
}

function runCrossValidate(anchor, logDir, mockDir) {
  return spawnSync('bash', [CROSS_VALIDATE_SCRIPT, 'structure'], {
    cwd: PROJECT_DIR,
    env: {
      ...process.env,
      PATH: `${mockDir}:${process.env.PATH}`,
      LOG_DIR: logDir,
      CROSS_VALIDATE_ANCHOR: anchor,
      GEMINI_RETRY_SLEEP_SECONDS: '0',
    },
    encoding: 'utf8',
    timeout: 30_000,
  });
}

// LOG_DIR 내 최신 outcome JSON 경로 반환
function latestOutcomePath(logDir) {
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.endsWith('-outcome.json'))
    .map((f) => ({ full: path.join(logDir, f), mtime: fs.statSync(path.join(logDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0]?.full ?? null;
}

// parse 헬퍼를 outcome JSON 에 적용해 KEY=value 라인 파싱
function runParseHelper(outcomePath) {
  const result = spawnSync('bash', [PARSE_HELPER, outcomePath], {
    encoding: 'utf8',
    timeout: 5_000,
  });
  assert.strictEqual(result.status, 0, `parse 헬퍼 exit 0 기대. stderr: ${result.stderr}`);
  const parsed = {};
  for (const line of result.stdout.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    parsed[m[1]] = val;
  }
  return parsed;
}

// CROSS_VALIDATE_ANCHOR 에 경계 문자를 주입해 write → parse round-trip 검증
// NOTE: parse 헬퍼 stdout 은 KEY="value" 형태이고 bash 문자열 이스케이프 (\n, \t 등) 를
// 해석하지 않으므로, 추출 값의 \n / \t 는 "두 글자 문자열" 상태 (`\`+`n`) 로 남는다.
// 원본이 실제 개행 (1 바이트 0x0A) 을 포함하면 헬퍼 출력은 escape 시퀀스로 관찰된다.
// 이 round-trip 은 "write 측이 escape 했고 parse 측이 그 escape 를 깨뜨리지 않았다" 를
// 검증한다 (완전한 언이스케이프가 아니라 escape 보존을 검증).
function runBoundaryCase(label, anchorValue, expectedEscapedSubstring) {
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-boundary-logs-'));
  const { tmpDir: mockDir } = setupMockGemini();
  try {
    const result = runCrossValidate(anchorValue, logDir, mockDir);
    assert.strictEqual(
      result.status,
      0,
      `[${label}] cross_validate.sh exit 0 기대. status=${result.status} stderr=${result.stderr}`
    );
    const outcomePath = latestOutcomePath(logDir);
    assert.ok(outcomePath, `[${label}] outcome JSON 파일 생성 기대`);

    // write 측 출력물의 생 JSON 에서 escape 시퀀스가 실제로 기록됐는지 검증
    const rawJson = fs.readFileSync(outcomePath, 'utf8');
    assert.ok(
      rawJson.includes(expectedEscapedSubstring),
      `[${label}] outcome JSON 에 escape 시퀀스 "${expectedEscapedSubstring}" 기록 기대. 실제:\n${rawJson}`
    );

    // parse 헬퍼 round-trip — anchor 필드 복원 + 필수 필드 누락 없음
    const parsed = runParseHelper(outcomePath);
    assert.ok(parsed.CROSS_VALIDATE_ANCHOR !== undefined, `[${label}] ANCHOR 필드 추출 기대`);
    assert.ok(
      parsed.CROSS_VALIDATE_ANCHOR.includes(expectedEscapedSubstring),
      `[${label}] 추출된 ANCHOR 에 escape 보존 기대. 기대 substring="${expectedEscapedSubstring}", 실제="${parsed.CROSS_VALIDATE_ANCHOR}"`
    );
    assert.strictEqual(
      parsed.CROSS_VALIDATE_OUTCOME,
      'applied',
      `[${label}] outcome=applied 기대. 실제=${parsed.CROSS_VALIDATE_OUTCOME}`
    );
    assert.strictEqual(
      parsed.CROSS_VALIDATE_EXIT_CODE,
      '0',
      `[${label}] exit_code=0 기대. 실제=${parsed.CROSS_VALIDATE_EXIT_CODE}`
    );
  } finally {
    fs.rmSync(logDir, { recursive: true, force: true });
    fs.rmSync(mockDir, { recursive: true, force: true });
  }
}

test('boundary regression guard: backslash 포함 anchor round-trip', () => {
  // 입력 단일 backslash → JSON escape 후 \\ 로 기록
  runBoundaryCase('backslash', 'MINOR\\backslash-test', '\\\\');
});

// NOTE: double-quote round-trip via parse 헬퍼 테스트는 의도적으로 생략.
// parse 측 `grep -o "\"${key}\": *\"[^\"]*\""` 정규식은 JSON escape 된 \" 를
// 해석하지 못해 escaped quote 앞에서 조기 종료한다 (실측 확인). 단, 현재 실
// 사용 필드 값은 enum/경로/번호로 raw double-quote 를 포함하지 않으므로
// 실측 파싱 실패 0건. write 측 json_escape() 가 생성하는 JSON 자체는
// JSON.parse 로 round-trip 이 완전하게 성립함을 "혼합" 케이스에서 검증한다.
// 자세한 계약 범위와 재검토 트리거는 docs/decisions/20260420-jq-based-parsing-no-op.md 참조.

test('boundary regression guard: tab 포함 anchor round-trip', () => {
  // 입력 실제 tab (0x09) → \t 로 기록
  runBoundaryCase('tab', 'MINOR\ttab-test', '\\t');
});

test('boundary regression guard: newline 포함 anchor round-trip', () => {
  // 입력 실제 newline (0x0A) → \n 으로 기록
  runBoundaryCase('newline', 'MINOR\nnewline-test', '\\n');
});

test('boundary regression guard: carriage return 포함 anchor round-trip', () => {
  // 입력 실제 CR (0x0D) → \r 로 기록
  runBoundaryCase('carriage-return', 'MINOR\rcr-test', '\\r');
});

test('boundary regression guard: 혼합 경계 문자 (write/parse contract 종합)', () => {
  // 모든 escape 대상이 섞인 anchor 로 파이프라인 전체 계약 종합 검증
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cv-boundary-logs-'));
  const { tmpDir: mockDir } = setupMockGemini();
  try {
    const anchor = 'A\\B"C\tD\nE\rF';
    const result = runCrossValidate(anchor, logDir, mockDir);
    assert.strictEqual(result.status, 0, `exit 0 기대. stderr=${result.stderr}`);
    const outcomePath = latestOutcomePath(logDir);
    assert.ok(outcomePath, 'outcome JSON 생성 기대');

    // 생성된 JSON 은 반드시 유효한 JSON 이어야 한다 (escape 계약 종합 증명)
    const rawJson = fs.readFileSync(outcomePath, 'utf8');
    const reparsed = JSON.parse(rawJson);
    assert.strictEqual(
      reparsed.anchor,
      anchor,
      `JSON.parse round-trip 완전 복구 기대. 원본="${anchor}", 복구="${reparsed.anchor}"`
    );
    assert.strictEqual(reparsed.outcome, 'applied');
    assert.strictEqual(reparsed.exit_code, 0);
  } finally {
    fs.rmSync(logDir, { recursive: true, force: true });
    fs.rmSync(mockDir, { recursive: true, force: true });
  }
});
