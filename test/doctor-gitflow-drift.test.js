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

// v2.15.0 (#105 #110) 추가 테스트 — --is-ancestor / unrelated histories / hotfix 문맥

test('drift(v2.15): merge commit 직후 fast-forward 대기 → pass (거짓 양성 제거, Gemini 고유 발견)', () => {
  // release PR 을 --merge 로 머지한 직후 상태. main 에 merge commit 1개 생성,
  // develop 은 그 merge commit 의 부모 중 하나 = main 의 직계 조상.
  // 이전: warn (거짓 양성). v2.15.0: pass (fast-forward 동기화 대기).
  const result = classifyGitflowDrift(1, 0, { developIsAncestorOfMain: true });
  assert.strictEqual(result.status, 'pass');
  assert.match(result.detail, /fast-forward 동기화 대기 중/);
  assert.match(result.detail, /git push origin main:develop/);
});

test('drift(v2.15): develop 이 main 조상이어도 mainAhead === 0 이면 단순 pass (merge 없이 동기)', () => {
  const result = classifyGitflowDrift(0, 0, { developIsAncestorOfMain: true });
  assert.strictEqual(result.status, 'pass');
  assert.match(result.detail, /동기/);
  // ancestor 경로로 빠지지 않고 일반 동기 detail 사용 확인
  assert.ok(!result.detail.includes('fast-forward'));
});

test('drift(v2.15): unrelated histories — mainAhead null → warn', () => {
  // git rev-list 실패 (공통 조상 없음 등) 시 tryExec 가 null 반환
  const result = classifyGitflowDrift(null, 0);
  assert.strictEqual(result.status, 'warn');
  assert.match(result.detail, /unrelated histories|격차 계산 실패/);
  assert.match(result.detail, /merge-base/);
});

test('drift(v2.15): unrelated histories — devAhead null → warn', () => {
  const result = classifyGitflowDrift(0, null);
  assert.strictEqual(result.status, 'warn');
  assert.match(result.detail, /unrelated histories|격차 계산 실패/);
});

test('drift(v2.15): hotfix 진행 중 → warn + 브랜치명 포함', () => {
  const result = classifyGitflowDrift(2, 3, { hasHotfixBranch: 'origin/hotfix/99-critical' });
  assert.strictEqual(result.status, 'warn');
  assert.match(result.detail, /hotfix 진행 중/);
  assert.match(result.detail, /99-critical/);
  assert.match(result.detail, /merge-back PR 필요/);
});

test('drift(v2.15): hotfix 진행 중이면서 develop 이 main 조상인 모순 상태 — ancestor 우선 (fast-forward pass)', () => {
  // 이론상 발생 드물지만 안전망. merge commit 으로 이미 머지된 release + hotfix 브랜치 잔존.
  // ancestor 성립하면 이미 해소 가능한 상태이므로 pass.
  const result = classifyGitflowDrift(1, 0, {
    developIsAncestorOfMain: true,
    hasHotfixBranch: 'origin/hotfix/old',
  });
  assert.strictEqual(result.status, 'pass');
  assert.match(result.detail, /fast-forward/);
});
