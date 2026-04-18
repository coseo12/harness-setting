'use strict';

/**
 * sentinels.managedSha256 불변성 — managed-block 센티널 외부 편집 오탐 방지.
 *
 * post-apply 검증(lib/update.js) 과 doctor 정합성(lib/doctor.js) 은 managed-block
 * 카테고리 파일에 대해 `categoricalSha256` 을 사용하며, 이는 `managedSha256` 로
 * 위임되어 **센티널 내부 콘텐츠만** 해시한다.
 *
 * 따라서 사용자가 센티널 외부 영역(자유 편집 가능 구간) 을 수정해도
 * update 는 "롤백 의심" 오탐을 일으키지 않아야 한다. 이 테스트는 이 계약을
 * 회귀 가드로 박제한다 (이슈 #92 Phase 2, Gemini #89 교차검증 지적).
 */

const test = require('node:test');
const assert = require('node:assert');

const { managedSha256 } = require('../lib/sentinels');

test('managedSha256: 센티널 외부 편집은 해시에 영향을 주지 않는다', () => {
  const base = [
    '# intro (편집 가능)',
    '',
    '<!-- harness:managed:x:start -->',
    'harness-owned line 1',
    'harness-owned line 2',
    '<!-- harness:managed:x:end -->',
    '',
    '# outro (편집 가능)',
    '',
  ].join('\n');

  const editedOutside = [
    '# intro (사용자가 대폭 수정했음)',
    '',
    '새로운 단락이 추가됐다.',
    '',
    '<!-- harness:managed:x:start -->',
    'harness-owned line 1',
    'harness-owned line 2',
    '<!-- harness:managed:x:end -->',
    '',
    '# outro (사용자가 대폭 수정했음)',
    '추가 내용까지 더함',
  ].join('\n');

  assert.strictEqual(
    managedSha256(base),
    managedSha256(editedOutside),
    '센티널 외부 편집은 managedSha256 을 변경해서는 안 됨'
  );
});

test('managedSha256: 센티널 내부 편집은 해시를 변경한다 (정상 민감도)', () => {
  const base = [
    '<!-- harness:managed:x:start -->',
    'original inner',
    '<!-- harness:managed:x:end -->',
  ].join('\n');

  const editedInside = [
    '<!-- harness:managed:x:start -->',
    'MODIFIED inner',
    '<!-- harness:managed:x:end -->',
  ].join('\n');

  assert.notStrictEqual(
    managedSha256(base),
    managedSha256(editedInside),
    '센티널 내부 편집은 managedSha256 을 변경해야 함'
  );
});

test('managedSha256: 여러 블록 중 한 블록 내부만 바뀌어도 해시 변화', () => {
  const base = [
    '<!-- harness:managed:a:start -->',
    'A-original',
    '<!-- harness:managed:a:end -->',
    '<!-- harness:managed:b:start -->',
    'B-original',
    '<!-- harness:managed:b:end -->',
  ].join('\n');

  const changedB = [
    '<!-- harness:managed:a:start -->',
    'A-original',
    '<!-- harness:managed:a:end -->',
    '<!-- harness:managed:b:start -->',
    'B-MODIFIED',
    '<!-- harness:managed:b:end -->',
  ].join('\n');

  assert.notStrictEqual(managedSha256(base), managedSha256(changedB));
});
