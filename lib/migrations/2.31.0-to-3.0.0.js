'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * 3.0.0 — `.github/workflows/` 책임 분리.
 *
 * 변경 요약 (이슈 #196, ADR 20260421-workflows-responsibility-split.md):
 *   - `.github/workflows/ci.yml` 말미의 harness 전용 가드 블록 → `harness-guards.yml` 로 이동
 *   - `.github/workflows/pr-review.yml` → `harness-pr-review.yml` 로 rename (내부 `name:` 도 갱신)
 *   - `ci.yml` 은 이제 user-only (다운스트림이 자유롭게 수정 가능)
 *   - `harness-*.yml` 만 frozen (upstream 소유)
 *
 * 본 마이그레이션의 책임:
 *   기존 다운스트림 프로젝트의 ci.yml 에서 **가드 블록만 안전하게 제거** 하여
 *   harness-guards.yml 과 중복 실행되지 않게 한다. 파일 내용이 아주 미세하게라도
 *   손상될 위험이 있으면 **스킵 + 수동 가이드** 로 안전하게 빠진다.
 *
 * 3단 매칭:
 *   6a. 다운스트림이 ci.yml 을 전혀 수정 안 함 (sha256 == v2.31.0 upstream sha256)
 *        → 완전 덮어쓰기 (새 ci.yml + harness-guards.yml 배치 + pr-review rename)
 *        실제 덮어쓰기는 `harness update` 의 일반 경로가 수행하므로, 본 마이그레이션은
 *        **판정만** 하고 notes 에 "자동 덮어쓰기 대상" 을 남긴다.
 *   6b. `detect-and-test` 는 수정됐지만 가드 블록은 v2.31.0 byte-exact 원형 유지
 *        → 가드 블록만 제거 (blockSnapshot 삭제 + 대체 안내 주석 삽입) +
 *          harness-guards.yml 은 `harness update` 가 새로 배치
 *   6c. 가드 블록 자체를 수정 (blockSnapshot 이 ci.yml 안에 존재하지 않음)
 *        → 스킵 + stderr 수동 가이드 (`docs/harness-ci-migration.md`)
 *
 * 백업:
 *   모든 경로에서 원본 `ci.yml` 과 `pr-review.yml` 을 `.harness/backup/ci-split-<ISO-timestamp>/`
 *   에 보존. 실패 시 수동 복원 경로 명확.
 *
 * 실패 모드:
 *   본 마이그레이션은 **exit 1 을 발생시키지 않는다**. 모든 분기는 notes 로 반환되며
 *   `harness update` 전체가 실패하지 않도록 보장. (CLAUDE.md "매니페스트 최신 ≠ 파일 적용 완료"
 *   교훈 — 부분 성공 + 명확 안내 우선)
 *
 * 멱등성:
 *   2회 실행 시 첫 회차에서 ci.yml 이 이미 수정됐으므로 2회차엔 blockSnapshot 이 이미 없어
 *   6c 로 판정된다. 그러나 이 경우 "가드 블록이 없음 = 이미 마이그레이션 완료" 로 선행 감지
 *   하여 silent skip 한다 (already-migrated 경로).
 */

// v2.31.0 ci.yml 의 가드 블록 (byte-exact). 이 문자열이 사용자 ci.yml 에 포함되어 있으면
// "가드 블록 원형 유지" 로 판정 (6b 경로).
//
// NOTE: leading `\n` 은 파일 중간 매칭 정확도를 위해 의도적으로 포함.
// v2.31.0 릴리스의 `.github/workflows/ci.yml` 라인 250-282 (가드 블록 직전 공백줄 포함).
const GUARDS_BLOCK_V2_31_0 = `
      # ============================================================
      # harness 저장소 전용 가드 (다운스트림은 hashFiles 조건으로 skip)
      # ============================================================
      # agent SSoT drift 가드 (#145)
      # CLAUDE.md \`### sub-agent 검증 완료 ≠ GitHub 박제 완료\` 의 공통 JSON 스키마 9개 필드가
      # 5개 에이전트 파일의 \`## 마무리 체크리스트 JSON 반환\` 섹션에 모두 존재하고 선언 순서를
      # 유지하는지 검사. drift 시 exit 1 로 PR 머지 전 차단.
      - name: agent SSoT drift 가드
        if: hashFiles('scripts/verify-agent-ssot.sh') != ''
        run: bash scripts/verify-agent-ssot.sh

      # release version bump 가드 (v2.28.1 복구와 함께 도입)
      # chore(release) PR 에서 CHANGELOG 를 업데이트했으나 package.json::version bump 를 누락하는 회귀를 차단.
      # 세션 3연속 릴리스 (v2.26.0~v2.28.0) 에서 실제 발생 → v2.28.1 로 복구 + 본 가드 도입.
      # CHANGELOG 최신 \`## [X.Y.Z]\` 엔트리와 package.json::version 일치 검증, 불일치 시 exit 1.
      - name: release version bump 가드
        if: hashFiles('scripts/verify-release-version-bump.sh') != ''
        run: bash scripts/verify-release-version-bump.sh

      # CLAUDE.md 각인 예산 가드 (#197 Phase 2)
      # 45k chars 초과 시 exit 1 로 감축 PR 을 강제. 35k/40k 는 warn (exit 0).
      # 지침: docs/guides/claudemd-governance.md §3 (정량 게이트)
      - name: CLAUDE.md 각인 예산 가드
        if: hashFiles('scripts/verify-claudemd-size.sh') != ''
        run: bash scripts/verify-claudemd-size.sh

      # CLAUDE.md 상대 링크 무결성 가드 (#197 Phase 2)
      # CLAUDE.md → docs/ 포인터가 많아질수록 link rot 위험 증가 — 파일 존재 검증.
      # 지침: docs/guides/claudemd-governance.md §4.3
      - name: CLAUDE.md 상대 링크 무결성 가드
        if: hashFiles('scripts/verify-docs-links.sh') != ''
        run: bash scripts/verify-docs-links.sh`;

// ci.yml 에서 가드 블록을 제거한 뒤 삽입하는 대체 안내 주석.
// v3.0.0 ci.yml 말미와 동일 내용 — "가드는 harness-guards.yml 로 이동됨" 명시.
const GUARDS_REPLACEMENT_NOTE = `
      # ============================================================
      # NOTE: harness 저장소 전용 가드는 \`.github/workflows/harness-guards.yml\` 로 이동됨
      # (v3.0.0, #196). 다운스트림은 본 ci.yml 을 자유롭게 수정해도 업스트림과 충돌하지 않는다.
      # 가드 목록 (harness-guards.yml 참조):
      #   - agent SSoT drift 가드
      #   - release version bump 가드
      #   - CLAUDE.md 각인 예산 가드
      #   - CLAUDE.md 상대 링크 무결성 가드
      # ============================================================`;

function isoTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function backupFile(cwd, rel, backupDir, notes) {
  const src = path.join(cwd, rel);
  if (!fs.existsSync(src)) return false;
  const dst = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  notes.push(`백업: ${rel} → .harness/backup/ci-split-<timestamp>/${rel}`);
  return true;
}

module.exports = {
  from: '2.31.0',
  to: '3.0.0',
  name: '.github/workflows/ 책임 분리 (harness-* vs user-only)',
  // 테스트에서 재사용 가능하도록 내부 상수 노출
  _constants: {
    GUARDS_BLOCK_V2_31_0,
    GUARDS_REPLACEMENT_NOTE,
  },
  run(cwd) {
    const notes = [];
    const changed = [];

    const ciRel = '.github/workflows/ci.yml';
    const ciAbs = path.join(cwd, ciRel);
    const prReviewRel = '.github/workflows/pr-review.yml';
    const prReviewAbs = path.join(cwd, prReviewRel);
    const newPrReviewRel = '.github/workflows/harness-pr-review.yml';
    const newPrReviewAbs = path.join(cwd, newPrReviewRel);

    // 1. pr-review.yml → harness-pr-review.yml rename
    //    v2.31.0 에서 frozen 으로 관리돼 있으므로 사용자 수정 가능성은 낮지만,
    //    rename 자체는 본 마이그레이션의 일관성 책임.
    if (fs.existsSync(prReviewAbs) && !fs.existsSync(newPrReviewAbs)) {
      const backupDir = path.join(cwd, '.harness', 'backup', `ci-split-${isoTimestamp()}`);
      fs.mkdirSync(backupDir, { recursive: true });
      backupFile(cwd, prReviewRel, backupDir, notes);
      try {
        fs.renameSync(prReviewAbs, newPrReviewAbs);
        notes.push(`rename: ${prReviewRel} → ${newPrReviewRel} (v3.0.0 책임 분리)`);
        changed.push(prReviewRel, newPrReviewRel);
      } catch (err) {
        notes.push(`pr-review.yml rename 실패 (스킵): ${err.message}`);
      }
    } else if (fs.existsSync(newPrReviewAbs) && !fs.existsSync(prReviewAbs)) {
      notes.push(`pr-review.yml rename: 이미 완료됨 — 스킵`);
    } else if (!fs.existsSync(prReviewAbs) && !fs.existsSync(newPrReviewAbs)) {
      notes.push(`pr-review.yml 없음 — rename 스킵`);
    } else {
      // 양쪽 다 존재: 사용자가 수동으로 만든 상태. 안전 스킵
      notes.push(
        `pr-review.yml 과 harness-pr-review.yml 이 둘 다 존재 — 수동 병합 필요 (자동 rename 스킵)`
      );
    }

    // 2. ci.yml 가드 블록 제거 (6a/6b/6c 분기)
    if (!fs.existsSync(ciAbs)) {
      notes.push(`ci.yml 없음 — 마이그레이션 스킵`);
      return { changed, notes };
    }

    const ciText = fs.readFileSync(ciAbs, 'utf8');

    // 이미 마이그레이션된 상태 선행 감지 — GUARDS_REPLACEMENT_NOTE 가 이미 있거나
    // 가드 블록이 없고 harness-guards.yml 이 이미 존재하면 skip.
    const harnessGuardsExists = fs.existsSync(
      path.join(cwd, '.github', 'workflows', 'harness-guards.yml')
    );
    if (ciText.includes(GUARDS_REPLACEMENT_NOTE.trimEnd()) || harnessGuardsExists) {
      notes.push(`ci.yml 가드 블록 제거: 이미 완료됨 (already-migrated) — 스킵`);
      return { changed, notes };
    }

    // 6b 감지: v2.31.0 byte-exact 가드 블록이 ci.yml 안에 존재
    if (ciText.includes(GUARDS_BLOCK_V2_31_0)) {
      // 백업 먼저
      const backupDir = path.join(cwd, '.harness', 'backup', `ci-split-${isoTimestamp()}`);
      fs.mkdirSync(backupDir, { recursive: true });
      backupFile(cwd, ciRel, backupDir, notes);

      // 가드 블록 → 대체 안내 주석으로 교체
      const newText = ciText.replace(GUARDS_BLOCK_V2_31_0, GUARDS_REPLACEMENT_NOTE);
      fs.writeFileSync(ciAbs, newText);
      notes.push(
        `ci.yml: 가드 블록 제거 완료 (6a/6b 경로). harness-guards.yml 은 \`harness update --apply-all-safe\` 가 새로 배치합니다.`
      );
      changed.push(ciRel);
      return { changed, notes };
    }

    // 6c: 가드 블록이 byte-exact 로 존재하지 않음 → 스킵 + 수동 가이드
    // stderr 로 출력해 eye-catchy 하게 (`harness update` 는 stdout 을 진행 로그로 씀).
    const manualGuideMsg = [
      `ci.yml 가드 블록이 v2.31.0 원형과 다릅니다 (6c 경로 — 사용자 수정 감지).`,
      `자동 분리가 안전하지 않아 스킵합니다.`,
      `수동 마이그레이션 가이드: docs/harness-ci-migration.md`,
      `(원본 ci.yml 은 수정되지 않았습니다 — 다음 \`harness update --check\` 는 divergent 로 표시)`,
    ];
    notes.push(...manualGuideMsg);
    try {
      process.stderr.write(
        `\n[harness] ci.yml 가드 블록 마이그레이션 스킵 (6c — 사용자 수정 감지)\n` +
          `         수동 가이드: docs/harness-ci-migration.md\n`
      );
    } catch {
      // stderr write 실패해도 계속 진행
    }
    return { changed, notes };
  },
};
