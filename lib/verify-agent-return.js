#!/usr/bin/env node
'use strict';

// sub-agent 반환 JSON 의 9 코어 필드 런타임 검증 (#184).
//
// 정적 가드 `scripts/verify-agent-ssot.sh` 는 에이전트 파일(.claude/agents/*.md) 의
// JSON 블록 drift 만 잡고, sub-agent 가 실제 반환하는 JSON 의 variance 는 놓친다.
// 본 도구는 메인 오케스트레이터가 Agent tool 반환 직후 호출하여 variance 탐지.
//
// 3 variance 패턴 모두 커버:
//   1. 필드 누락 (object 에 key 자체 없음)
//   2. `null` 과 기본값 이탈 (array 에 null 등) — 타입 검증에서 걸림
//   3. 값 타입 불일치 (string 에 number 등)
//
// 호출:
//   node lib/verify-agent-return.js --json '<JSON 문자열>'
//   node lib/verify-agent-return.js --file path/to/return.json
//   cat return.json | node lib/verify-agent-return.js --stdin
//
// Exit code:
//   0 — 9필드 + 타입 정합
//   1 — variance 감지 (stderr 에 누락/불일치 목록)
//   2 — 입력 오류 (JSON 파싱 실패 / 파일 없음)
//
// 근거: harness #184, ADR docs/decisions/20260422-subagent-runtime-variance-defense.md

const fs = require('node:fs');

// 9 코어 필드 스펙 (CLAUDE.md SSoT 와 동기화).
// 수정 시 반드시 에이전트 파일 `## 마무리 체크리스트 JSON 반환` 섹션 + ADR 표와 동반 갱신.
const CORE_FIELDS = [
  { name: 'commit_sha', check: isStringOrNull },
  { name: 'pr_url', check: isStringOrNull },
  { name: 'pr_comment_url', check: isStringOrNull },
  { name: 'labels_applied_or_transitioned', check: isStringArray },
  { name: 'auto_close_issue_states', check: isStringValueObject },
  { name: 'blocking_issues', check: isStringArray },
  { name: 'non_blocking_suggestions', check: isStringArray },
  { name: 'spawned_bg_pids', check: isIntegerArray },
  {
    name: 'bg_process_handoff',
    check: (v) => typeof v === 'string' && ['main-cleanup', 'sub-agent-confirmed-done', 'none'].includes(v),
    hint: 'enum: "main-cleanup" | "sub-agent-confirmed-done" | "none"',
  },
];

function isStringOrNull(v) {
  return v === null || typeof v === 'string';
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}
function isIntegerArray(v) {
  return Array.isArray(v) && v.every((x) => Number.isInteger(x));
}
function isStringValueObject(v) {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  return Object.values(v).every((x) => typeof x === 'string');
}

function parseArgs(argv) {
  const args = { mode: null, value: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') {
      args.mode = 'json';
      args.value = argv[++i];
    } else if (a === '--file') {
      args.mode = 'file';
      args.value = argv[++i];
    } else if (a === '--stdin') {
      args.mode = 'stdin';
    } else if (a === '-h' || a === '--help') {
      printUsage();
      process.exit(0);
    }
  }
  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node lib/verify-agent-return.js --json \'{"commit_sha":"abc1234",...}\'');
  console.log('  node lib/verify-agent-return.js --file path/to/return.json');
  console.log('  cat return.json | node lib/verify-agent-return.js --stdin');
}

function readStdin() {
  return fs.readFileSync(0, 'utf8');
}

function loadInput(args) {
  if (args.mode === 'json') return args.value;
  if (args.mode === 'file') {
    if (!fs.existsSync(args.value)) {
      console.error(`verify-agent-return: 파일 없음: ${args.value}`);
      process.exit(2);
    }
    return fs.readFileSync(args.value, 'utf8');
  }
  if (args.mode === 'stdin') return readStdin();
  console.error('verify-agent-return: 입력 모드 필요 (--json / --file / --stdin)');
  printUsage();
  process.exit(2);
}

function validate(obj) {
  const missing = [];
  const typeErrors = [];
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { missing: [], typeErrors: [{ field: '(root)', reason: 'object 여야 함', actualType: Array.isArray(obj) ? 'array' : typeof obj }] };
  }
  for (const spec of CORE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(obj, spec.name)) {
      missing.push(spec.name);
      continue;
    }
    const value = obj[spec.name];
    if (!spec.check(value)) {
      typeErrors.push({
        field: spec.name,
        actualType: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value,
        hint: spec.hint,
      });
    }
  }
  return { missing, typeErrors };
}

function report(result) {
  const { missing, typeErrors } = result;
  if (missing.length === 0 && typeErrors.length === 0) {
    console.log('✅ sub-agent 반환 JSON 정합 (9 코어 필드 + 타입 준수)');
    return 0;
  }
  console.error('❌ sub-agent 반환 JSON variance 감지');
  if (missing.length > 0) {
    console.error(`\n필드 누락 ${missing.length}건:`);
    for (const f of missing) console.error(`   - ${f}`);
  }
  if (typeErrors.length > 0) {
    console.error(`\n타입/값 불일치 ${typeErrors.length}건:`);
    for (const e of typeErrors) {
      const hint = e.hint ? ` (기대: ${e.hint})` : '';
      console.error(`   - ${e.field}: 실제 타입 '${e.actualType}'${hint}`);
    }
  }
  console.error('\n대응:');
  console.error('   1. 메인 오케스트레이터가 누락 필드를 수동 보완 박제 (커밋/코멘트)');
  console.error('   2. sub-agent 재호출은 idempotent 보장 안 되므로 금지 (reviewer/qa 중복 박제 위험)');
  console.error('   3. 반복 관찰 시 ADR docs/decisions/20260422-subagent-runtime-variance-defense.md 재검토 조건 확인');
  return 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = loadInput(args);
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    console.error(`verify-agent-return: JSON 파싱 실패: ${err.message}`);
    process.exit(2);
  }
  const result = validate(obj);
  process.exit(report(result));
}

// 테스트에서 재사용 가능하도록 export
if (require.main === module) {
  main();
} else {
  module.exports = { validate, CORE_FIELDS };
}
