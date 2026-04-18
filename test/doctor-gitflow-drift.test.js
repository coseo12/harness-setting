'use strict';

/**
 * harness doctor — gitflow 브랜치 정합성 분류 검증.
 *
 * 목적: main vs develop 커밋 격차로 drift 조기 탐지.
 * 과거 v2.12.0 이전에 dual PR 변형 + 고빈도 작업 압박으로 develop 이 56 커밋 뒤처진
 * drift 를 놓친 사례가 본 체크의 도입 배경.
 *
 * ADR: docs/decisions/20260419-gitflow-main-develop.md
 */

const test = require('node:test');
const assert = require('node:assert');

const { classifyGitflowDrift } = require('../lib/doctor');

test('drift: main === develop 동기 상태 → pass (릴리스 직후)', () => {
  const result = classifyGitflowDrift(0, 0);
  assert.strictEqual(result.status, 'pass');
  assert.match(result.detail, /동기/);
});

test('drift: develop 이 main 보다 앞섬 → pass (릴리스 대기 정상)', () => {
  const result = classifyGitflowDrift(0, 5);
  assert.strictEqual(result.status, 'pass');
  assert.match(result.detail, /5 커밋 앞섬/);
  assert.match(result.detail, /릴리스 대기 정상/);
});

test('drift: main 이 develop 보다 앞섬 → warn (hotfix merge-back 누락 의심)', () => {
  const result = classifyGitflowDrift(3, 0);
  assert.strictEqual(result.status, 'warn');
  assert.match(result.detail, /3 커밋 앞섬/);
  assert.match(result.detail, /hotfix merge-back/);
});

test('drift: 양쪽 모두 앞서는 diverged 상태 → warn (main 이 앞서면 merge-back 필요)', () => {
  // merge-back 누락 + 신규 develop 작업 진행 시나리오
  const result = classifyGitflowDrift(2, 10);
  assert.strictEqual(result.status, 'warn');
  assert.match(result.detail, /2 커밋 앞섬/);
});

test('drift: 대규모 drift (v2.12.0 이전 재현) → warn', () => {
  // 과거 실제 관찰값: develop 이 56 커밋 뒤처진 상태를 main 이 앞선 것으로 재해석
  const result = classifyGitflowDrift(56, 0);
  assert.strictEqual(result.status, 'warn');
  assert.match(result.detail, /56 커밋 앞섬/);
});

test('drift: warn 메시지에 복구 명령 힌트 포함', () => {
  const result = classifyGitflowDrift(1, 0);
  assert.strictEqual(result.status, 'warn');
  assert.ok(
    result.detail.includes('git push origin main:develop') || result.detail.includes('merge-back PR'),
    '복구 방법이 detail 에 포함되어야 함'
  );
});
