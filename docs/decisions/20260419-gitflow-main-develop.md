# ADR: gitflow 복원 — main=배포 / develop=개발

- 날짜: 2026-04-19
- 상태: Accepted
- 관련 이슈/PR: harness [#99](https://github.com/coseo12/harness-setting/pull/99) (v2.12.0), 본 ADR 은 v2.13.0 PR 에 포함

## 배경

v2.12.0 릴리스 직후 브랜치 하우스키핑 중 `develop` 이 `main` 보다 56 커밋 뒤처져 있고, 2026-04-13 (#57) 이후 업데이트 없이 6일간 방치된 상태가 확인되었다.

### 타임라인 원인 분석

**1단계 (2026-03-28 ~ 2026-04-12, PR #37~#58)** — **dual PR 이중 머지 패턴**
한 작업을 `base=develop` + `base=main` 두 개의 PR 로 각각 머지 (11쌍 연속):
```
PR #37 develop → PR #38 main   (같은 내용 2번 머지)
PR #39 develop → PR #40 main
... PR #57/#58 까지
```
정석 gitflow (`feature → develop → release → main`) 가 아닌 변형으로, 한 변경을 양쪽에 각각 PR 하는 고비용 구조였다.

**전환점 (2026-04-15, PR #59)** — harness 확장 작업(record-adr / update Phase A~C / agents Phase 1~3) 이 4일간 42 PR 로 쏟아지면서 dual PR 유지 비용을 포기.

**2단계 (2026-04-15 ~ 2026-04-18, PR #59~#99)** — `base=main` 만 사용. `develop` 업데이트 완전 중단. CLAUDE.md 의 "develop: 통합 브랜치" 선언과 현실이 불일치한 채 6일 경과.

### 핵심 원인
1. **변형된 구현** — 처음부터 dual PR 이라는 고비용 변형. release 브랜치 경유 머지 개념 부재로 develop 존재 가치가 얕음
2. **고빈도 작업 압박** — 4일 42 PR 상황에서 중복 작업이 즉시 희생
3. **문서-현실 drift 미감지** — 워크플로 변경 시 CLAUDE.md 를 갱신하는 가드 부재

## 후보 비교

| 옵션 | 워크플로 | 장점 | 단점 |
|---|---|---|---|
| A. **정석 gitflow** (채택) | feature → develop / develop → main release PR / hotfix → main + merge-back | 역할 분리 명확. dual PR 구조적 방지 | 3-layer 학습 비용. 1인 운영 시 release 타이밍 판단 필요 |
| B. main-only (trunk-based) | feature → main | 단순. 최근 42 PR 실적 | develop/release 개념 포기. hotfix 프로세스 별도 |
| C. simplified gitflow | feature → develop / develop → main 직접 (release 브랜치 없음) | 옵션 A 보다 단순 | dual PR 재발 위험 (주의 필요) |

### 결정

**옵션 A (정석 gitflow, simplified)** 채택. 단 release 브랜치는 생략 — develop 자체가 release candidate 역할을 하고, `develop → main` release PR 이 release cut-over 를 수행한다 (C 와 A 의 절충).

**핵심 규칙**:
- `main` = 배포 anchor. 태그된 릴리스만 존재. 직접 push 금지, feature/fix PR 대상 금지
- `develop` = 개발 통합. 모든 완성된 변경이 먼저 도착
- release = `develop → main` 단일 PR + 태그
- hotfix = `main` 에서 분기 → main PR → 태그 → `main → develop` merge-back 의무

### 근거
1. 사용자 명시적 선호 — main/develop 분리가 기본 요구사항
2. dual PR 은 금지로 명시 (feature PR 은 main 대상 불가). 구조적 재발 방지
3. release 브랜치 생략은 1인 운영 단순성 확보. 필요 시 추후 도입 가능 (재검토 조건에 명시)
4. hotfix merge-back 의무화로 2단계 drift 재발 방지
5. **통합 스테이징 수요** — 여러 feature 가 상호작용하는 기능일 때 각자 main 에 머지하면 상호작용 버그 가능. `develop` 은 이 통합 검증 공간 역할. 이 수요는 **tag trigger 로 대체 불가능** (배포 타이밍 제어와 다른 축). v2.14.0 검토에서 사용자 지적으로 근거 확정
6. **하네스 사용자 프로젝트의 PaaS 현실** — 이 하네스를 쓰는 프로젝트 대부분은 웹 앱이며 Vercel/Netlify/AWS Amplify/Cloudflare Pages/Railway/Render 등 **브랜치 기반 push 트리거** PaaS 를 사용한다. 이런 도구는 tag trigger 를 네이티브 지원하지 않아 `main push = 즉시 배포`가 강제된다. gitflow 의 `main=production / develop=staging` 매핑이 PaaS 환경에서 자연스럽게 작동한다. 상세: [docs/deployment-patterns.md](../deployment-patterns.md)

## 결과 / Behavior Changes

- CLAUDE.md 브랜치 전략 섹션 재작성 (4개 브랜치 역할 표 + 워크플로 3단계)
- CLAUDE.md 금지 사항 2줄 추가 (base=main 금지 / hotfix merge-back 누락 금지)
- `.github/PULL_REQUEST_TEMPLATE.md` 에 base 확인 체크박스 + release/hotfix 전용 섹션
- `harness doctor` 에 "gitflow 브랜치 정합성" 항목 추가 — main vs develop 커밋 격차 점검

## 재검토 조건

- **옵션 B (main-only) 재고 시점**: 아래 **두 조건 모두 만족**시에만 재고 (v2.14.0 에서 통합 스테이징 + PaaS 근거 추가로 조건 강화):
  - develop 이 6개월 이상 연속으로 main 과 동일 해시를 유지 (release cut-over 가 실질 무용)
  - **통합 스테이징 수요 소멸** — 프로젝트 단일 feature 모델로 전환되어 feature 간 상호작용 검증이 필요 없음
  - 1차 리뷰: 2026-10-19
- **release 브랜치 도입 시점**: 릴리스 준비 기간이 1주일 이상 걸리는 대형 변경이 늘어나는 경우 (`release/vX.Y.Z` 브랜치로 stabilization window 분리)
- **hotfix 프로세스 실측**: 첫 hotfix 발생 시 merge-back 자동화 여부를 재평가 (수동 merge-back 누락이 1회라도 발생하면 doctor drift 체크로 복구 가능한지 확인)

## 참고
- gitflow 원형: https://nvie.com/posts/a-successful-git-branching-model/
- harness CLAUDE.md "브랜치 전략" 섹션 — 본 ADR 의 운영 요약
