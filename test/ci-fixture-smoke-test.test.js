'use strict';

/**
 * CI fixture-smoke-test 영속 가드 (issue #190).
 *
 * 의도: ADR 20260423-ci-fixture-pnpm-workspace 의 축 (c) — "유닛 테스트 가드" 축.
 * 의도적 red 커밋 (dynamic 검증) 과 짝을 이루는 static 검증. 두 축은 서로 다른 실패 모드를 방어:
 *   - dynamic: 파이프라인 자체가 regression 감지 가능한가
 *   - static (본 테스트): ci.yml / fixture 파일이 미래에 조용히 사라지지 않는가
 *
 * 검증 대상:
 *   1. .github/workflows/ci.yml 에 fixture-smoke-test job 이 선언되어 있다
 *   2. job 이 pnpm/action-setup + setup-node + frozen-lockfile + --if-present 패턴을 유지한다
 *   3. test/fixtures/pnpm-monorepo/ 디렉토리의 최소 7 파일이 존재한다
 *   4. fixture 내 @fixture/lib 는 dist 기반 exports 를 유지한다 (main/exports 필드 형태)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CI_YML = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const FIXTURE_ROOT = path.join(ROOT, 'test', 'fixtures', 'pnpm-monorepo');

test('ci.yml 에 fixture-smoke-test job 이 선언되어 있다', () => {
  assert.ok(fs.existsSync(CI_YML), 'ci.yml 존재');
  const content = fs.readFileSync(CI_YML, 'utf8');
  // job key 형식: 들여쓰기 2칸 + 'fixture-smoke-test:'
  assert.match(
    content,
    /^ {2}fixture-smoke-test:\s*$/m,
    'fixture-smoke-test job 선언 존재',
  );
});

test('fixture-smoke-test job 이 핵심 step 패턴을 유지한다', () => {
  const content = fs.readFileSync(CI_YML, 'utf8');
  // job 블록 추출 — 들여쓰기 2칸 job key 다음 줄부터, 다음 2칸 key (또는 EOF) 까지.
  // YAML 에서 `jobs:` 하위 job 들은 모두 2칸 들여쓰기이므로 이 경계로 분리.
  const lines = content.split('\n');
  const startIdx = lines.findIndex((line) => /^ {2}fixture-smoke-test:\s*$/.test(line));
  assert.ok(startIdx >= 0, 'fixture-smoke-test job 시작 라인 존재');
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    // 다음 2칸 들여쓰기 key (단, 주석/빈 줄 제외) 를 발견하면 종료
    if (/^ {2}[A-Za-z_][\w-]*:\s*(#.*)?$/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const block = lines.slice(startIdx, endIdx).join('\n');
  assert.ok(block.length > 0, 'fixture-smoke-test job 블록 추출 성공');

  // 필수 step 패턴
  assert.match(block, /pnpm\/action-setup@v\d+/, 'pnpm/action-setup@v4 사용');
  assert.match(block, /actions\/setup-node@v\d+/, 'actions/setup-node 사용');
  assert.match(block, /node-version:\s*20/, 'node-version 20 고정');
  assert.match(block, /cache:\s*['"]pnpm['"]/, 'pnpm cache 활성');
  assert.match(
    block,
    /cache-dependency-path:\s*test\/fixtures\/\$\{\{\s*matrix\.fixture\s*\}\}\/pnpm-lock\.yaml/,
    'lock 경로 matrix.fixture 치환',
  );
  assert.match(block, /pnpm install --frozen-lockfile/, 'frozen-lockfile 설치');
  // --if-present 는 pnpm 의 플래그로 사용 (script args 앞). `pnpm test --if-present` 는 금지 패턴 (#181)
  assert.match(
    block,
    /pnpm run --if-present test/,
    'pnpm run --if-present test 패턴 (pnpm 플래그)',
  );
  assert.doesNotMatch(
    block,
    /pnpm test --if-present/,
    'pnpm test --if-present 금지 패턴 (v2.28.2 regression 재발 방지)',
  );

  // matrix.fixture 확장 지점
  assert.match(block, /matrix:\s*\n\s*fixture:\s*\[/, 'matrix.fixture 선언');
  assert.match(block, /fixture:\s*\[pnpm-monorepo\]/, 'pnpm-monorepo 포함');
});

test('test/fixtures/pnpm-monorepo 최소 파일 집합이 존재한다', () => {
  const required = [
    '.gitignore',
    'package.json',
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'packages/lib/package.json',
    'packages/lib/src/index.ts',
    'packages/app/package.json',
    'packages/app/src/index.test.ts',
  ];
  for (const rel of required) {
    const abs = path.join(FIXTURE_ROOT, rel);
    assert.ok(fs.existsSync(abs), `fixture 필수 파일 존재: ${rel}`);
  }
});

test('@fixture/lib 는 dist-based exports 를 유지한다 (v2.29.1 regression 가드)', () => {
  const libPkgPath = path.join(FIXTURE_ROOT, 'packages', 'lib', 'package.json');
  const libPkg = JSON.parse(fs.readFileSync(libPkgPath, 'utf8'));

  assert.strictEqual(
    libPkg.main,
    './dist/index.js',
    'lib.main 이 dist 경로 유지',
  );
  assert.ok(libPkg.exports, 'lib.exports 필드 존재');
  // exports 의 "." 엔트리가 dist 로 향하는지
  const dotExport = libPkg.exports['.'];
  const defaultPath =
    typeof dotExport === 'string' ? dotExport : dotExport?.default;
  assert.match(
    defaultPath,
    /^\.\/dist\//,
    'exports["."].default 가 dist 경로 유지',
  );
});

test('@fixture/app 는 workspace:* 로 @fixture/lib 를 소비한다', () => {
  const appPkgPath = path.join(FIXTURE_ROOT, 'packages', 'app', 'package.json');
  const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf8'));
  assert.strictEqual(
    appPkg.dependencies?.['@fixture/lib'],
    'workspace:*',
    'app 이 @fixture/lib workspace:* 의존',
  );
});
