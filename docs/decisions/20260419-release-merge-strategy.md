# ADR: Release PR merge 전략 — merge commit 채택

- 날짜: 2026-04-19
- 상태: Accepted
- 관련 이슈/PR: [#104](https://github.com/coseo12/harness-setting/issues/104), v2.14.0 PR
- 선행 ADR: [20260419-gitflow-main-develop.md](20260419-gitflow-main-develop.md) (상위 gitflow 결정)

## 배경

v2.13.0 gitflow 복원 후 첫 릴리스 (PR #102 develop → main) 에서 **release PR 을 squash merge 하자 매번 merge-back PR 이 강제되는 구조** 가 드러났다. v2.13.0 릴리스만으로 3개 PR (#101 feature → develop, #102 release squash, #103 merge-back merge commit) 이 필요했고, 그중 #103 은 새 코드 변경이 없는 sync-only PR 이었다.

### 근본 기전

- squash merge 는 main 에 **새 squash commit** 을 생성한다
- 이 commit 의 부모는 이전 main tip 하나뿐 — develop tip 을 조상으로 포함하지 않음
- 결과: `main..develop = 0`, `develop..main = 1` → `harness doctor` 가 "gitflow 브랜치 정합성: main 이 develop 보다 앞섬" 으로 drift 경고
- 해소 방법이 merge-back PR 밖에 없음 (force-push 는 CRITICAL #5 위반)

### 운영 부담

매 릴리스마다 3 PR. 연 10 릴리스 기준 연간 10개 추가 PR + doctor 경고 노이즈.

## 후보 비교

| 축 | A. Release PR merge commit | B. GitHub Action 자동 merge-back | C. 현재 유지 (수동 merge-back) |
|---|---|---|---|
| 초기 구현 | 거의 0 — 문서 규칙만 | 중간 — Action 1개 + 테스트 | 0 |
| 유지 비용 (연간) | 0 | 저-중 — Action 디버깅/업데이트 | 릴리스마다 +1 PR |
| main 히스토리 가독성 | 저하 — feature 커밋 섞임 | 양호 — release squash 1 줄 | 양호 |
| doctor drift 로직 영향 | **drift 없음 (원천 제거)** | drift 발생 → Action 이 해소 | drift 발생 → 수동 해소 |
| 회귀 위험 | 낮음 (GitHub 네이티브 지원) | 중간 (Action 실패 시 drift 방치) | 낮음 |
| AI 에이전트 친화도 | 최고 — 단계 단순 | 중간 — 실패 복구 판단 필요 | 낮음 — 매번 판단 |
| 릴리스 1회당 PR 수 | **2** (feature→dev, release→main) | 3 | 3 |
| 실패 시 복구 | 자연 동기화 (불필요) | 수동 fallback | 원래 수동 |

## 결정

**A. Release PR 을 merge commit 방식으로 머지 + 직후 fast-forward push** 채택.

- `gh pr merge <PR> --merge` 사용 (repo 기본 merge 전략은 squash 유지 — feature PR 에만 적용)
- **`gh pr merge --merge` 직후 `git push origin main:develop` (fast-forward) 필수** — main 의 merge commit 자체가 develop 에 없어 doctor 가 일시 warn. fast-forward push 로 즉시 해소 (force-push 아님, main 이 develop 의 후손)
- 일반 feature/fix PR 은 변경 없이 squash 유지
- hotfix 는 기존 방식 유지 (main 분기 → main PR → merge-back PR). hotfix 는 main 이 develop 을 선행하는 정상 사례이므로 merge-back 불가피
- PR 템플릿 / CLAUDE.md / create-pr 스킬 / doctor 경고 문구에 "release PR 은 merge commit + fast-forward push" 규칙 박제

### 릴리스 워크플로 4단계 (v2.14.0 → v2.15.0 확정)

```
1. gh pr merge <PR> --merge              # release PR 을 merge commit 으로 머지
2. git push origin main:develop          # fast-forward (main → develop mirror)
3. git tag vX.Y.Z + git push origin vX.Y.Z
4. gh release create vX.Y.Z ...
```

### 근거

1. v2.13.0 실 운영에서 merge-back PR 은 **내용 없는 sync-only PR** 로 확인됨 — 필요성 자체를 제거하는 것이 근본 해결
2. 1인 + AI 페어 환경에서 GitHub Action 디버깅 비용이 비싸고, A 는 구현 비용 0
3. main 로그 가독성 저하는 `gh release` 페이지 + CHANGELOG + `git log --first-parent main` 로 보완 가능
4. Behavior Changes 가 PR 본문에 기록되므로 release merge commit 메시지가 아니라 PR 추적으로 릴리스 요약 접근

### 채택하지 않은 옵션의 재검토 조건

- **옵션 B (자동화 Action)**: 릴리스 빈도가 주당 3회 이상이 되고 merge commit 실수로 `--squash` 머지가 3회 이상 반복되면 Action 자동화 재고
- **옵션 C (수동 merge-back)**: 채택 안 함. 매 릴리스마다 강제되는 sync-only PR 은 정보 가치 0

## 결과 / Behavior Changes

- CLAUDE.md 릴리스 워크플로에 "`gh pr merge <PR> --merge` 사용, `--squash` 금지" 명시
- **CLAUDE.md 에 `git push origin main:develop` fast-forward 단계 명시** (v2.15.0 추가 — v2.14.0 실 운영에서 누락 발견)
- PR 템플릿 Release PR 섹션에 "merge commit 방식으로 머지" + "fast-forward push" 체크박스 추가. merge-back 체크박스는 hotfix 전용으로 복원
- create-pr 스킬 Base 선택 표에 머지 방식 컬럼 추가 (release=merge commit, 그 외=squash)
- **doctor `--is-ancestor` 체크 추가** (v2.15.0) — merge commit 직후 fast-forward 전 거짓 양성 제거
- 후속 이슈 #106 (PR 템플릿 merge-back 용어 일반화) 는 **불필요** — release merge-back 이 사라지므로 hotfix 전용 용어 유지

## 재검토 조건

- **6개월 후 (2026-10-19)**: 실제 1인 + AI 운영에서 실수로 squash 머지한 사례가 3회 이상이면 옵션 B (Action 자동화) 재고
- **main 로그 가독성 불만 누적 시**: `git log --first-parent main --oneline` 을 기본 조회 명령으로 CLAUDE.md 에 박제하여 완화. 그래도 불만이면 옵션 C 복귀 검토
- **대형 stabilization window 필요 시**: release branch 도입 (`release/vX.Y.Z` → main + develop 양쪽 머지) 으로 확장. 현재 구조의 자연스러운 진화 경로

## 참고

- 상위 gitflow 결정: [20260419-gitflow-main-develop.md](20260419-gitflow-main-develop.md)
- v2.13.0 실 사례: PR [#101](https://github.com/coseo12/harness-setting/pull/101), [#102](https://github.com/coseo12/harness-setting/pull/102), [#103](https://github.com/coseo12/harness-setting/pull/103)
- 후속 이슈: [#104](https://github.com/coseo12/harness-setting/issues/104) (본 ADR 이 해결), [#106](https://github.com/coseo12/harness-setting/issues/106) (불필요로 전환), [#105](https://github.com/coseo12/harness-setting/issues/105) (drift 로직 별도)
