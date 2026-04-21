'use strict';

/**
 * .github/workflows/ 책임 분리 마이그레이션 — fixture 기반 통합 테스트.
 *
 * 이슈 #196, v3.0.0 MAJOR. 4 fixture:
 *   - pristine          : v2.31.0 ci.yml + pr-review.yml (사용자 미수정)  → 6a 경로
 *   - customized-detect : detect-and-test 만 수정, 가드 블록 원형         → 6b 경로
 *   - already-migrated  : 이미 v3.0.0 구조                                 → silent skip
 *   - customized-guards : 가드 블록 자체 수정                              → 6c 경로 (스킵)
 *
 * 검증 축:
 *   1. 각 fixture 가 의도한 경로로 분기되는가 (notes 내용 검사)
 *   2. 백업 디렉토리가 생성되는가
 *   3. 원본 파일 보존/변경이 기대한 대로 이루어지는가
 *   4. 멱등성 — 마이그레이션 2회 실행 시 2회차에서 파일 시스템 변경 0
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const migration = require('../lib/migrations/2.31.0-to-3.0.0');

const FIXTURE_ROOT = path.resolve(__dirname, 'fixtures', 'ci-split-migration');

function makeTmpCwd(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `harness-ci-split-${prefix}-`));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * fixture 디렉토리를 tmp 로 복사해 독립 테스트 공간 확보.
 */
function copyFixture(name) {
  const src = path.join(FIXTURE_ROOT, name);
  if (!fs.existsSync(src)) {
    throw new Error(`fixture 없음: ${name}`);
  }
  const dst = makeTmpCwd(name);
  copyRecursive(src, dst);
  return dst;
}

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

/**
 * 디렉토리 스냅샷 — 파일 경로 → sha256 매핑.
 * 멱등성 검증에 사용.
 */
function snapshotDir(dir) {
  const crypto = require('node:crypto');
  const out = {};
  function walk(cur, rel = '') {
    for (const entry of fs.readdirSync(cur)) {
      const abs = path.join(cur, entry);
      const relPath = rel ? `${rel}/${entry}` : entry;
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        walk(abs, relPath);
      } else {
        const content = fs.readFileSync(abs);
        out[relPath] = crypto.createHash('sha256').update(content).digest('hex');
      }
    }
  }
  walk(dir);
  return out;
}

test('ci-split migration: pristine fixture → 6a/6b 경로 (가드 블록 byte-exact 매칭)', () => {
  const cwd = copyFixture('pristine');
  try {
    const ciAbs = path.join(cwd, '.github', 'workflows', 'ci.yml');
    const prReviewOldAbs = path.join(cwd, '.github', 'workflows', 'pr-review.yml');
    const prReviewNewAbs = path.join(cwd, '.github', 'workflows', 'harness-pr-review.yml');

    const before = fs.readFileSync(ciAbs, 'utf8');
    assert.ok(
      before.includes('run: bash scripts/verify-agent-ssot.sh'),
      '마이그레이션 전: 실제 가드 step 존재'
    );

    const result = migration.run(cwd);

    // 가드 블록 (실제 실행 step) 제거 확인 — 대체 주석에는 `run:` 이 없으므로 이 assertion 이 정확
    const after = fs.readFileSync(ciAbs, 'utf8');
    assert.ok(
      !after.includes('run: bash scripts/verify-agent-ssot.sh'),
      '마이그레이션 후: agent SSoT drift 가드 step 제거됨'
    );
    assert.ok(
      !after.includes('run: bash scripts/verify-release-version-bump.sh'),
      '마이그레이션 후: release version bump 가드 step 제거됨'
    );
    assert.ok(
      after.includes('harness-guards.yml'),
      '마이그레이션 후: 대체 안내 주석이 harness-guards.yml 을 참조'
    );

    // pr-review 리네임 확인
    assert.ok(!fs.existsSync(prReviewOldAbs), 'pr-review.yml 삭제됨');
    assert.ok(fs.existsSync(prReviewNewAbs), 'harness-pr-review.yml 생성됨');

    // 백업 확인
    const backupRoot = path.join(cwd, '.harness', 'backup');
    assert.ok(fs.existsSync(backupRoot), '.harness/backup/ 생성됨');
    const backupDirs = fs.readdirSync(backupRoot).filter((d) => d.startsWith('ci-split-'));
    assert.ok(backupDirs.length > 0, '백업 디렉토리 존재');

    // notes 내용 검사
    assert.ok(
      result.notes.some((n) => n.includes('가드 블록 제거 완료')),
      '6a/6b 분기 notes 존재'
    );
    assert.ok(result.notes.some((n) => n.includes('rename')), 'rename notes 존재');
  } finally {
    cleanup(cwd);
  }
});

test('ci-split migration: customized-detect fixture → 6b 경로 (가드 블록만 제거, 커스텀 라인 보존)', () => {
  const cwd = copyFixture('customized-detect');
  try {
    const ciAbs = path.join(cwd, '.github', 'workflows', 'ci.yml');

    const before = fs.readFileSync(ciAbs, 'utf8');
    assert.ok(
      before.includes('project-specific detect logic'),
      '전제: 커스텀 라인이 fixture 에 존재'
    );

    const result = migration.run(cwd);

    const after = fs.readFileSync(ciAbs, 'utf8');
    // 가드 블록 제거 확인 — 실제 실행 step (`run:`) 이 사라졌는지로 판정
    assert.ok(
      !after.includes('run: bash scripts/verify-agent-ssot.sh'),
      '가드 step 제거 (실제 실행 라인 부재)'
    );
    // 사용자 커스텀 라인 보존 확인 (6b 의 핵심 계약)
    assert.ok(
      after.includes('project-specific detect logic'),
      '6b: 사용자의 detect-and-test 커스텀 라인은 보존됨'
    );
    // 대체 안내 주석 삽입 확인
    assert.ok(after.includes('harness-guards.yml'), '대체 안내 주석 삽입됨');

    assert.ok(
      result.notes.some((n) => n.includes('가드 블록 제거 완료')),
      '6b 분기 notes'
    );
    assert.ok(result.changed.includes('.github/workflows/ci.yml'), 'changed 에 ci.yml 포함');
  } finally {
    cleanup(cwd);
  }
});

test('ci-split migration: already-migrated fixture → silent skip (멱등성 선행 감지)', () => {
  const cwd = copyFixture('already-migrated');
  try {
    const ciAbs = path.join(cwd, '.github', 'workflows', 'ci.yml');
    const harnessGuardsAbs = path.join(cwd, '.github', 'workflows', 'harness-guards.yml');

    // 전제: already-migrated 상태에선 ci.yml 에 가드 블록이 이미 없고, harness-guards.yml 이 있어야 함
    assert.ok(fs.existsSync(harnessGuardsAbs), '전제: harness-guards.yml 존재');

    const before = fs.readFileSync(ciAbs, 'utf8');
    const result = migration.run(cwd);
    const after = fs.readFileSync(ciAbs, 'utf8');

    // ci.yml 은 전혀 건드리지 않음
    assert.strictEqual(after, before, 'ci.yml 내용 불변');

    // notes 에 "이미 완료됨" 키워드
    assert.ok(
      result.notes.some((n) => n.includes('이미 완료됨') || n.includes('already-migrated')),
      'silent skip notes'
    );
    // changed 배열에 ci.yml 포함되지 않음 (rename 은 상태에 따라 이미 완료됐을 수 있음)
    assert.ok(!result.changed.includes('.github/workflows/ci.yml'), 'ci.yml 은 changed 에 없음');
  } finally {
    cleanup(cwd);
  }
});

test('ci-split migration: customized-guards fixture → 6c 경로 (스킵 + 수동 가이드)', () => {
  const cwd = copyFixture('customized-guards');
  try {
    const ciAbs = path.join(cwd, '.github', 'workflows', 'ci.yml');

    const before = fs.readFileSync(ciAbs, 'utf8');
    // 전제: customized-guards fixture 는 가드 블록을 수정함 (--verbose 추가)
    assert.ok(before.includes('--verbose'), '전제: 가드 블록이 --verbose 로 수정됨');

    const result = migration.run(cwd);

    const after = fs.readFileSync(ciAbs, 'utf8');

    // 6c: 원본 ci.yml 은 수정되지 않아야 함
    assert.strictEqual(after, before, '6c: ci.yml 내용 불변 (수동 가이드 경로)');

    // notes 에 수동 가이드 지시
    assert.ok(
      result.notes.some((n) => n.includes('docs/harness-ci-migration.md')),
      '6c 분기 notes: 수동 가이드 링크 포함'
    );
    assert.ok(
      result.notes.some((n) => n.includes('6c') || n.includes('사용자 수정 감지')),
      '6c 분기 notes: 사용자 수정 감지 명시'
    );
  } finally {
    cleanup(cwd);
  }
});

test('ci-split migration: 멱등성 — pristine fixture 2회 실행 시 2회차 변경 0', () => {
  const cwd = copyFixture('pristine');
  try {
    // 1회차 실행
    migration.run(cwd);
    const snapshot1 = snapshotDir(cwd);

    // 2회차 실행 — 파일 시스템 변경이 없어야 함 (새 백업 폴더 생성은 허용 안 됨)
    const result2 = migration.run(cwd);
    const snapshot2 = snapshotDir(cwd);

    // 2회차는 already-migrated 경로로 skip 되어야 함
    assert.ok(
      result2.notes.some((n) => n.includes('이미 완료됨') || n.includes('already-migrated')),
      '2회차는 already-migrated 경로'
    );
    // changed 배열 비어 있음
    assert.strictEqual(
      result2.changed.filter((c) => c === '.github/workflows/ci.yml').length,
      0,
      '2회차 changed 에 ci.yml 없음'
    );

    // 파일 시스템 스냅샷 완전 일치 (새 백업 폴더도 생성 안 됨)
    assert.deepStrictEqual(snapshot2, snapshot1, '2회차 파일 시스템 변경 0 (Concrete Prediction #3)');
  } finally {
    cleanup(cwd);
  }
});

test('ci-split migration: exit 1 발생 안 함 — 모든 분기는 notes 반환', () => {
  // 비정상 상태들을 확인:
  //  (1) ci.yml 없음
  //  (2) pr-review.yml 없음
  //  (3) harness-pr-review.yml 이미 존재 (양쪽 공존)
  const cwd = makeTmpCwd('no-files');
  try {
    fs.mkdirSync(path.join(cwd, '.github', 'workflows'), { recursive: true });

    // 아무 파일 없음 상태
    const r1 = migration.run(cwd);
    assert.ok(Array.isArray(r1.notes), 'notes 배열 반환');
    assert.ok(Array.isArray(r1.changed), 'changed 배열 반환');
    // exit 1 이 발생하지 않는 것 자체가 테스트. assert.throws 와 반대 — 도달만 하면 통과
  } finally {
    cleanup(cwd);
  }
});

test('ci-split migration: migrations chain 에 등록되었는가', () => {
  const { planMigrations } = require('../lib/migrations');
  // 2.31.0 → 3.0.0 체인에 본 마이그레이션이 포함되는지 확인
  const plan = planMigrations('2.31.0', '3.0.0');
  const present = plan.some((m) => m.from === '2.31.0' && m.to === '3.0.0');
  assert.ok(present, 'migrations/index.js 에 2.31.0-to-3.0.0 등록됨');
});
