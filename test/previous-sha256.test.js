'use strict';

/**
 * previousSha256 자가 복구 — 커밋 시점 외부 롤백에서도 재-apply 성공.
 *
 * 시나리오 (v2.8.0 post-apply 게이트가 못 잡는 타이밍 커버):
 *   1. 사용자 프로젝트에 oldContent 상태의 파일 A + 매니페스트에 oldSha 기록
 *   2. `harness update --apply-all-safe` 실행 → 파일은 upstream 내용, 매니페스트는
 *      { sha256: upstreamSha, previousSha256: oldSha } 로 갱신됨
 *   3. 이 상태로 git commit — 성공
 *   4. git commit 시점에 lint-staged 같은 외부 프로세스가 A 를 oldContent 로 revert
 *      (매니페스트는 건드리지 않음)
 *   5. 다시 `harness update --check` 실행 →
 *      기존 로직: divergent (사용자 수정) 오분류 → 재-apply 스킵 (교착)
 *      v2.9.0: userSha === previousSha256 이므로 modified-pristine 으로 재분류 → 재-apply 가능
 *   6. `harness update --apply-all-safe` 재실행 → A 가 다시 upstream 으로 복원됨
 *
 * 이슈 #92 Phase 1
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const { update, check } = require('../lib/update');
const { readManifest, writeManifest, categoricalSha256 } = require('../lib/manifest');

const PKG_ROOT = path.resolve(__dirname, '..');

function makeTmpCwd(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `harness-prev-${prefix}-`));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function shaOf(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function seedProject(cwd, rel, content) {
  const abs = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

test('previousSha256: update 완료 후 매니페스트에 이전 sha256 자동 기록', async () => {
  const cwd = makeTmpCwd('record');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;

    const oldContent = '# previousSha256 test 1\n';
    const oldSha = shaOf(oldContent);
    seedProject(cwd, targetRel, oldContent);
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: { [targetRel]: { sha256: oldSha, category: 'atomic' } },
    });

    const result = await update(cwd, { applyAllSafe: true });
    assert.strictEqual(result.ok, true, 'update 성공');

    const after = readManifest(cwd);
    const entry = after.files[targetRel];
    assert.ok(entry, '대상 파일 엔트리 존재');
    assert.strictEqual(entry.previousSha256, oldSha, 'previousSha256 이 이전 sha256 으로 기록돼야 함');
    assert.notStrictEqual(entry.sha256, oldSha, '새 sha256 은 upstream 해시');
  } finally {
    cleanup(cwd);
  }
});

test('previousSha256: userSha === prevSha 면 check 가 modified-pristine 으로 재분류', () => {
  const cwd = makeTmpCwd('rollback-detect');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;

    // 외부 롤백 상태를 수동 시뮬레이션:
    //   파일 = oldContent (롤백됨), 매니페스트 sha256 = upstreamSha (최신), previousSha256 = oldSha
    const oldContent = '# previousSha256 test 2 (rolled back)\n';
    const oldSha = shaOf(oldContent);
    const upstreamSha = categoricalSha256(targetRel, upstreamAbs);

    seedProject(cwd, targetRel, oldContent);
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: {
        [targetRel]: {
          sha256: upstreamSha, // 최신으로 기록돼 있지만 파일은 롤백된 상태
          previousSha256: oldSha,
          category: 'atomic',
        },
      },
    });

    const result = check(cwd);
    assert.ok(result.ok);
    const entry = result.actions.find((a) => a.rel === targetRel);
    assert.ok(entry);
    assert.strictEqual(
      entry.action,
      'modified-pristine',
      `userSha === previousSha256 이면 modified-pristine. 실제: ${entry.action}`
    );
  } finally {
    cleanup(cwd);
  }
});

test('previousSha256: 자가 복구 통합 — 외부 롤백 후 --apply-all-safe 재실행으로 복원', async () => {
  const cwd = makeTmpCwd('self-heal');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;
    const upstreamContent = fs.readFileSync(upstreamAbs, 'utf8');
    const upstreamSha = categoricalSha256(targetRel, upstreamAbs);

    const oldContent = '# previousSha256 test 3 (stale)\n';
    const oldSha = shaOf(oldContent);
    seedProject(cwd, targetRel, oldContent);
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: { [targetRel]: { sha256: oldSha, category: 'atomic' } },
    });

    // 1차 update — 정상 apply
    const first = await update(cwd, { applyAllSafe: true });
    assert.strictEqual(first.ok, true);
    const afterFirst = readManifest(cwd);
    assert.strictEqual(afterFirst.files[targetRel].sha256, upstreamSha);
    assert.strictEqual(afterFirst.files[targetRel].previousSha256, oldSha);

    // 사용자 외부 롤백 모사 (commit 시점 lint-staged 가 파일만 되돌림, 매니페스트는 유지)
    fs.writeFileSync(path.join(cwd, targetRel), oldContent);

    // 2차 check — modified-pristine 으로 재감지돼야 함
    const checkResult = check(cwd);
    const entry = checkResult.actions.find((a) => a.rel === targetRel);
    assert.strictEqual(entry.action, 'modified-pristine', '롤백된 파일이 modified-pristine 으로 재감지');

    // 3차 apply — 자가 복구
    const recover = await update(cwd, { applyAllSafe: true });
    assert.strictEqual(recover.ok, true);
    const restored = fs.readFileSync(path.join(cwd, targetRel), 'utf8');
    assert.strictEqual(restored, upstreamContent, '자가 복구 후 파일이 upstream 과 일치');
  } finally {
    cleanup(cwd);
  }
});

test('previousSha256: legacy 매니페스트(필드 부재)도 update 후 자연 채움', async () => {
  const cwd = makeTmpCwd('legacy');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;

    const oldContent = '# previousSha256 test 4 (legacy)\n';
    const oldSha = shaOf(oldContent);
    seedProject(cwd, targetRel, oldContent);
    // 레거시 매니페스트: previousSha256 필드 없음
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: { [targetRel]: { sha256: oldSha, category: 'atomic' } },
    });
    const before = readManifest(cwd);
    assert.strictEqual(before.files[targetRel].previousSha256, undefined, '레거시는 필드 없음');

    await update(cwd, { applyAllSafe: true });

    const after = readManifest(cwd);
    assert.strictEqual(
      after.files[targetRel].previousSha256,
      oldSha,
      'update 후 previousSha256 이 자연 채워져야 함 (migration 스텝 불필요)'
    );
  } finally {
    cleanup(cwd);
  }
});

test('previousSha256: sha256 이 변경되지 않은 update 는 previousSha256 을 새로 쓰지 않음', async () => {
  const cwd = makeTmpCwd('no-change');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;
    const upstreamSha = categoricalSha256(targetRel, upstreamAbs);
    const upstreamContent = fs.readFileSync(upstreamAbs, 'utf8');

    // 이미 최신 상태로 시드
    seedProject(cwd, targetRel, upstreamContent);
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: { [targetRel]: { sha256: upstreamSha, category: 'atomic' } },
    });

    await update(cwd, { applyAllSafe: true });

    const after = readManifest(cwd);
    // 변경 없으면 previousSha256 필드가 생성되지 않아야 함 (sha 가 같으므로 의미 없음)
    assert.strictEqual(
      after.files[targetRel].previousSha256,
      undefined,
      'sha256 변경 없으면 previousSha256 을 새로 기록하지 않음'
    );
  } finally {
    cleanup(cwd);
  }
});
