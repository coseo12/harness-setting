'use strict';

/**
 * 파일 경로를 4종 카테고리 중 하나로 분류한다.
 *   - frozen        : 사용자 수정 의도 없음 (CI/스크립트 보일러플레이트). 자동 덮어쓰기 안전.
 *   - managed-block : 일부만 harness 소유 (Phase A에서 센티널 블록으로 분리). Phase B는 atomic처럼 취급.
 *   - atomic        : 단일 단위 교체 (스킬/에이전트/커맨드/PR 템플릿). 사용자 수정 시 충돌.
 *   - user-only     : init 후엔 harness가 손대지 않음 (state, logs, 사용자 추가 파일).
 */
function categorize(relPath) {
  // 정규화: 윈도우 경로 대비
  const p = relPath.replace(/\\/g, '/');

  if (p.startsWith('.harness/')) return 'user-only';
  // harness / agent 실행 로그는 user-only — categorize.js 머리 주석의 "state, logs" 계약 반영 (#157)
  if (p.startsWith('.claude/logs/')) return 'user-only';
  if (p === '.gitignore') return 'user-only';
  if (p.startsWith('scripts/')) return 'frozen';
  // .github/workflows/ 책임 분리 (#196, v3.0.0):
  //   harness-*.yml  → frozen (upstream 소유, 자동 덮어쓰기 안전)
  //   나머지 yml     → user-only (다운스트림 소유, harness 는 손대지 않음)
  // 이전에는 `.github/workflows/` 전체를 frozen 으로 둬서 다운스트림 ci.yml 커스터마이즈가
  // 매 `harness update` 마다 충돌했다 (volt #62 6단계 push-fail-fix 루프의 원인). 책임 경계를
  // 파일 경계로 일치시켜 근본 해결. 자세한 근거:
  // docs/decisions/20260421-workflows-responsibility-split.md
  if (p.startsWith('.github/workflows/')) {
    const basename = p.slice('.github/workflows/'.length);
    if (basename.startsWith('harness-')) return 'frozen';
    return 'user-only';
  }
  if (p === 'CLAUDE.md') return 'managed-block';

  // 사용자가 자유롭게 추가하는 디렉토리의 README만 atomic, 나머지는 user-only
  if (p.startsWith('docs/decisions/') && p !== 'docs/decisions/README.md') return 'user-only';
  if (p.startsWith('docs/retrospectives/') && p !== 'docs/retrospectives/README.md') return 'user-only';

  // 기본: atomic (스킬/에이전트/커맨드/템플릿/문서)
  return 'atomic';
}

module.exports = { categorize };
