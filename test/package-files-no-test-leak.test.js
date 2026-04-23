'use strict';

/**
 * package.json::files 누수 방지 가드 (issue #190, 필수 보안 가드).
 *
 * 의도: `test/fixtures/pnpm-monorepo/` 가 `npm publish` 를 통해 다운스트림 `harness update`
 * 로 유출되면 (a) 다운스트림 저장소 크기 급증 (b) 선언되지 않은 경로 포함 리스크.
 * `package.json::files` 배열에 `test` 또는 `test/` 접두어가 포함되지 않음을 영속 가드.
 *
 * ADR 20260423-ci-fixture-pnpm-workspace §2 (필수 보안 가드, Gemini 교차검증 격상).
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const PKG_PATH = path.resolve(__dirname, '..', 'package.json');

test('package.json::files 에 test / test/ 가 포함되지 않는다 (fixture 유출 방지)', () => {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  assert.ok(Array.isArray(pkg.files), 'files 배열 존재');

  for (const entry of pkg.files) {
    // 허용 안 되는 패턴: 'test', 'test/', 'test/**', 'test/fixtures', '**/test' 등
    // 정규식: 정확히 "test" 이거나, "test/" 로 시작, 또는 와일드카드 내 test/ 경로
    const normalized = String(entry).trim();
    assert.ok(
      normalized !== 'test',
      `files 에 'test' 항목 금지 (발견: ${entry})`,
    );
    assert.ok(
      !normalized.startsWith('test/'),
      `files 에 'test/' 접두어 금지 (발견: ${entry})`,
    );
    // glob 패턴에도 test 경로가 끼어들지 못하게
    assert.ok(
      !/\btest\/fixtures\b/.test(normalized),
      `files 에 'test/fixtures' 경로 금지 (발견: ${entry})`,
    );
  }
});

test('package.json::files 가 알려진 허용 경로만 포함한다 (화이트리스트)', () => {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  // 화이트리스트 — 현 시점 합의된 배포 대상. 신규 경로 추가 시 본 테스트 업데이트 필수.
  // 테스트 fixture 가 실수로 추가되면 첫 assertion 이 차단, 그 외 비정상 경로는 본 assertion 이 차단.
  const allowed = new Set([
    'bin/',
    'lib/',
    '.claude/',
    '.github/',
    'docs/',
    'scripts/',
    'CLAUDE.md',
    'README.md',
  ]);
  for (const entry of pkg.files) {
    assert.ok(
      allowed.has(entry),
      `files 에 허용되지 않은 경로: ${entry} (화이트리스트 업데이트 필요 시 본 테스트도 함께 수정)`,
    );
  }
});
