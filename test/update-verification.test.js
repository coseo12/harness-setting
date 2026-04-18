'use strict';

/**
 * post-apply 검증 게이트 — lint-staged partial revert 시뮬레이션.
 *
 * 시나리오:
 *   1. 사용자 프로젝트에 harness 파일 A, B 가 오래된 버전으로 존재 (modified-pristine).
 *   2. `harness update --apply-all-safe` 실행 → 둘 다 upstream 내용으로 덮어써짐.
 *   3. 외부 프로세스(lint-staged 모사)가 B 를 이전 내용으로 즉시 되돌린다.
 *   4. 매니페스트 갱신 단계에서 B 의 해시 불일치 감지 → B 해시는 이전 매니페스트 값 유지.
 *   5. 재-apply 시 B 가 modified-pristine 으로 재감지되어 다시 적용 가능.
 *
 * 이슈 #89 — CLAUDE.md "매니페스트 최신 ≠ 파일 적용 완료" 대응.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { update, check } = require('../lib/update');
const { readManifest, writeManifest, buildManifest, categoricalSha256 } = require('../lib/manifest');

const PKG_ROOT = path.resolve(__dirname, '..');

function makeTmpCwd(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `harness-test-${prefix}-`));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * 테스트 픽스처: 사용자 프로젝트에 tracked 디렉토리를 만들고,
 * 지정 파일들을 "이전 내용" 으로 시드 + 매니페스트를 "이전 내용 해시" 로 기록한다.
 * 이 상태는 modified-pristine (사용자 미수정, 업스트림 업데이트 대기) 을 시뮬레이션한다.
 */
function seedStaleProject(cwd, targets) {
  for (const [rel, oldContent] of Object.entries(targets)) {
    const abs = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, oldContent);
  }
  const manifest = {
    harnessVersion: '0.0.1',
    installedAt: '2020-01-01T00:00:00Z',
    files: {},
  };
  for (const [rel, oldContent] of Object.entries(targets)) {
    manifest.files[rel] = { sha256: shaOf(oldContent), category: guessCategory(rel) };
  }
  writeManifest(cwd, manifest);
}

function shaOf(text) {
  return require('node:crypto').createHash('sha256').update(text).digest('hex');
}

function guessCategory(rel) {
  // 테스트용 단순화 — 실제 categorize 를 사용해도 무방
  const { categorize } = require('../lib/categorize');
  return categorize(rel);
}

test('post-apply 검증: 외부 rollback 감지 시 매니페스트 해시는 이전 값 유지', async () => {
  const cwd = makeTmpCwd('rollback');
  try {
    // 실제 upstream 파일 중 하나를 타겟으로 선정 — scripts/setup-labels.sh 같은 frozen 후보
    // 테스트 안정성을 위해 docs/ 아래 파일 중 하나로 고정.
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) {
      // 업스트림에 파일이 없으면 테스트 스킵 (환경 독립적 보장)
      return;
    }
    const upstreamContent = fs.readFileSync(upstreamAbs, 'utf8');
    const oldContent = '# stale baseline\n';

    seedStaleProject(cwd, { [targetRel]: oldContent });
    const oldSha = shaOf(oldContent);

    // update 실행 전 스텁: 적용 직후 외부 프로세스가 파일을 revert 하도록 흉내내기 위해,
    // fs.copyFileSync 를 감싼 뒤 원래 동작 + 즉시 revert 를 한다.
    const origCopy = fs.copyFileSync;
    fs.copyFileSync = (src, dest) => {
      origCopy(src, dest);
      if (path.resolve(dest) === path.resolve(path.join(cwd, targetRel))) {
        // lint-staged 가 파일을 revert 한 것으로 모사
        fs.writeFileSync(dest, oldContent);
      }
    };

    let result;
    try {
      result = await update(cwd, { applyAllSafe: true });
    } finally {
      fs.copyFileSync = origCopy;
    }

    // 검증 1: update 가 실패(ok:false) 를 반환 — 부분 실패 감지
    assert.strictEqual(result.ok, false, 'rollback 감지 시 ok=false 반환');
    assert.ok(Array.isArray(result.rolledBack), 'rolledBack 배열 포함');
    assert.ok(result.rolledBack.some((rb) => rb.rel === targetRel), `대상 파일이 rolledBack 에 포함돼야 함: ${JSON.stringify(result.rolledBack)}`);

    // 검증 2: 매니페스트에 기록된 해시는 "이전 해시"(oldSha) 로 유지되어야 함.
    // 새 업스트림 해시로 갱신되면 안 됨 (해시 위조 방지).
    const after = readManifest(cwd);
    assert.ok(after.files[targetRel], '대상 파일 엔트리 존재');
    assert.strictEqual(
      after.files[targetRel].sha256,
      oldSha,
      `매니페스트 해시가 이전 값으로 유지되어야 함. 실제: ${after.files[targetRel].sha256}, 기대: ${oldSha}`
    );
  } finally {
    cleanup(cwd);
  }
});

test('post-apply 검증: 재-apply 시 롤백된 파일이 modified-pristine 으로 재감지', async () => {
  const cwd = makeTmpCwd('reapply');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;

    const oldContent = '# stale baseline 2\n';
    seedStaleProject(cwd, { [targetRel]: oldContent });

    // 1차 apply + rollback 모사
    const origCopy = fs.copyFileSync;
    fs.copyFileSync = (src, dest) => {
      origCopy(src, dest);
      if (path.resolve(dest) === path.resolve(path.join(cwd, targetRel))) {
        fs.writeFileSync(dest, oldContent);
      }
    };
    try {
      await update(cwd, { applyAllSafe: true });
    } finally {
      fs.copyFileSync = origCopy;
    }

    // 2차 check — 해당 파일은 여전히 modified-pristine 으로 감지되어야 함
    const result2 = check(cwd);
    assert.ok(result2.ok, 'check 성공');
    const entry = result2.actions.find((a) => a.rel === targetRel);
    assert.ok(entry, `${targetRel} 이 actions 에 포함돼야 함`);
    assert.strictEqual(
      entry.action,
      'modified-pristine',
      `재-apply 시 modified-pristine 으로 감지돼야 함. 실제: ${entry.action}`
    );
  } finally {
    cleanup(cwd);
  }
});

test('post-apply 검증: 정상 apply 시 ok=true 반환 + 매니페스트 최신 해시 기록', async () => {
  const cwd = makeTmpCwd('happy');
  try {
    const targetRel = 'docs/agents-guide.md';
    const upstreamAbs = path.join(PKG_ROOT, targetRel);
    if (!fs.existsSync(upstreamAbs)) return;

    const oldContent = '# stale baseline 3\n';
    seedStaleProject(cwd, { [targetRel]: oldContent });

    // rollback 없이 정상 apply
    const result = await update(cwd, { applyAllSafe: true });
    assert.strictEqual(result.ok, true, '정상 apply 시 ok=true');
    assert.strictEqual(result.rolledBack.length, 0, 'rolledBack 이 비어있어야 함');

    const after = readManifest(cwd);
    const upstreamSha = categoricalSha256(targetRel, upstreamAbs);
    assert.strictEqual(
      after.files[targetRel].sha256,
      upstreamSha,
      '정상 apply 후 매니페스트 해시가 upstream 과 일치해야 함'
    );
  } finally {
    cleanup(cwd);
  }
});
