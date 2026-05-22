# Claude Code 워크플로우 템플릿

<!-- harness:managed:critical-directives:start -->
## 🚫 CRITICAL DIRECTIVES (NEVER BYPASS)

**아래 규칙은 세션 초기화/신규 프로젝트 셋업/모호한 지시 상황에서도 예외 없이 적용된다.**
세부 근거는 하단 섹션에 있으며, 이 블록은 어텐션 환기용 요약이다.

1. **브랜치 보호** — `main` 직접 수정/푸시 금지. 모든 변경은 `feature/*` 또는 `fix/*` 브랜치에서 PR로만 반영.
2. **모호한 지시 사전 확인** — "리뉴얼", "개선", "셋팅해줘" 등 범위 불명 지시는 **작업 전** 범위를 사용자에게 제시하고 승인받는다. 보수적 해석으로 임의 진행 금지.
3. **UI 작업 3단계 검증** — 빌드/테스트 통과는 "동작" 증거가 아니다. 정적 → 인터랙션 → 흐름 3단계를 브라우저에서 확인 후 커밋.
4. **한글 인코딩 검증** — 한국어 포함 파일 Edit 후 `grep -rn '�'` 실행. U+FFFD 발견 시 즉시 수정.
5. **파괴적 작업 사전 경고** — `rm -rf`, force-push, DB drop 등은 사용자 cwd/데이터 영향을 사전에 고지하고 확인.
6. **스프린트 계약** — 구현 착수 전 검증 가능한 완료 기준 목록을 사용자와 합의한다.

> **세션 시작 시 자기 점검**: 새 대화에서 첫 작업을 시작하기 전, 본 블록을 인지했는지 확인하고 위반 가능성이 있는 경우 사용자에게 명시한다. 프레임워크 구성 이상이 의심되면 `harness doctor`를 실행한다.
<!-- harness:managed:critical-directives:end -->

---

## 개요
AI 에이전트 기반 개발 워크플로우 템플릿. 1인 개발자-AI 페어 프로그래밍에 최적화.

---

## 브랜치 전략 (classic gitflow)

> 과거 이력: v2.12.0 이전까지 `feature → develop` + `feature → main` 의 **dual PR** 변형을 썼고, 고비용으로 인해 2026-04-15 부터 `develop` 이 방치되는 drift 가 발생했다. v2.13.0 부터 정석 gitflow 로 복원 — 자세한 결정 근거는 [ADR 20260419](docs/decisions/20260419-gitflow-main-develop.md) 참조.

> **develop 의 두 가지 핵심 역할**: (1) **통합 스테이징** — 여러 feature 가 상호작용하는 기능일 때 main 으로 가기 전에 함께 동작하는지 검증하는 공간. tag trigger 로는 대체 불가. (2) **PaaS staging environment 매핑** — Vercel/Netlify/Amplify 등 브랜치 기반 자동 배포 도구에서 `main=production / develop=staging / feature/*=preview` 로 자연스럽게 매핑. 자세한 패턴: [docs/deployment-patterns.md](docs/deployment-patterns.md).

> **이 저장소 자체의 릴리스 vs 하네스 사용 프로젝트 릴리스**: 이 하네스 저장소는 수동 `git tag + gh release create` 방식이라 `main push = 배포` 가 아니다. 반면 하네스를 사용하는 웹 앱 프로젝트 대부분은 PaaS 자동 배포 (브랜치 기반 push 트리거) 를 쓴다. 양쪽 모두 **gitflow 브랜치 전략은 동일**하게 적용되며 배포 트리거만 다르다.

| 브랜치 | 역할 | 진입 경로 | 금지 사항 |
|---|---|---|---|
| `main` | **배포 anchor**. 태그된 릴리스만 존재 | `develop → main` **release PR** 로만 / `hotfix/* → main` PR | 직접 push 금지. feature/fix PR 의 `base=main` 금지 |
| `develop` | **개발 통합**. 모든 완성된 변경이 먼저 도착 | `feature/*`, `fix/*` PR / `main → develop` merge-back (hotfix 후) | 직접 push 금지 |
| `feature/<이슈번호>-<설명>` | 신기능 | `develop` 에서 분기 | `main` 대상 PR 생성 금지 |
| `fix/<이슈번호>-<설명>` | 개발 중 발견된 버그 수정 | `develop` 에서 분기 | `main` 대상 PR 생성 금지 |
| `hotfix/<이슈번호>-<설명>` | **prod 긴급 패치** | `main` 에서 분기. 머지 후 즉시 `main → develop` merge-back | 드물게 사용. develop merge-back 누락 금지 |

### 워크플로 3단계 + drift 감지

3단계 (일상 개발 / 릴리스 / 핫픽스) 흐름 + release PR `--merge` 의무 + fast-forward push + `harness doctor` 의 gitflow 정합성 정상/경고 분류는 [docs/guides/branch-strategy-workflow.md](docs/guides/branch-strategy-workflow.md) 참조.

핵심 의무 (각인층):
- **release PR 은 반드시 `--merge` (merge commit) 방식** — `--squash` 금지. 결정 근거: [ADR 20260419-release-merge-strategy](docs/decisions/20260419-release-merge-strategy.md)
- **merge commit 직후 `git push origin main:develop` (fast-forward) 필수**
- **feature/fix PR 의 `base=main` 금지** — release/hotfix PR 만 main 대상

## 커밋 컨벤션 + PR 규칙
형식 `<type>(<scope>): <description>` (type: feat/fix/refactor/test/docs/chore). PR 제목 `[#이슈번호] 설명`. **multi-issue auto-close keyword 함정** (각 이슈 앞 `Closes` 반복 또는 줄 분리 필수, 콜론·콤마 단일 형태는 #B 미인식) + 머지 직후 `gh issue view` 검증 루틴. 상세: [docs/guides/pr-conventions.md](docs/guides/pr-conventions.md). 근거: volt [#41](https://github.com/coseo12/volt/issues/41).

---

## 스프린트 계약 (Sprint Contract)

구현 전에 "완료"의 정의를 검증 가능한 기준으로 합의한다.
AI는 자기 작업을 과도하게 긍정 평가하는 경향이 있으므로, 사전 합의된 기준이 객관적 검증의 기반이 된다.

1. 이슈/기능 착수 전 **완료 기준 목록**을 작성한다
2. 각 기준은 **측정 가능**해야 한다 — 정성적 표현 금지, 수치/관찰 가능한 동작으로 표현
   - 좋은 예: "버튼 클릭 시 모달 열림", "API 응답 200", "axe 0 위반", "60fps 유지", "회귀율 < 25%"
   - 나쁜 예: "성능 좋아짐", "UX 개선", "안정적"
3. 기준 미충족 시 **구체적 피드백과 함께 반려** — 단순 "실패"가 아닌 원인+수정점 명시
4. 표면적 테스트가 아닌 **엣지 케이스까지 탐색**한다
5. 합의된 기준은 실측 후 **재조정 가능** — 단, 사용자와 명시적으로 합의 후 갱신
6. **재조정 시 테스트 ROI 5문 체크** (+ 보강 3문, 6-a 순수 함수 추출 우선, 10항 수치 DoD 4단계, 10-a 메인 오케스트레이터 SSoT JSON 부호 규약 자기 점검) — 상세: [docs/lessons/sprint-contract-roi.md](docs/lessons/sprint-contract-roi.md). 근거: volt [#71](https://github.com/coseo12/volt/issues/71) / [#32](https://github.com/coseo12/volt/issues/32) / [#53](https://github.com/coseo12/volt/issues/53) / [#73](https://github.com/coseo12/volt/issues/73) / [#75](https://github.com/coseo12/volt/issues/75)
7. 재조정 사실은 **세 위치에 동시 박제** (누락 방지):
   - **코드 주석** — 계약 자체 (무엇을 의도적으로 스킵했는지)
   - **PR 본문** — 결정 근거 (왜 재조정했는지)
   - **CHANGELOG Notes** — 미래 관찰자용 기록 (재발견 시 "누락"으로 오인 방지)
8. 반대 함정: "완료 기준에 있으니 무조건 테스트 작성" (의존성 복잡도 무시한 단발성 부채) vs "ROI 낮다고 조용히 스킵" (재조정 박제 누락). 둘 다 금지.
9. 근거: volt [#31](https://github.com/coseo12/volt/issues/31) — harness #92 Phase 2 merge 스킵 테스트에서 git fixture 구축 비용이 검증 대상 1줄 대비 역전되어 주석 계약 + 인접 속성 테스트로 대체한 사례

### 마일스톤 회고 루틴

마일스톤(또는 Phase) 종료 시 **회고 문서 작성은 의무**다.
- 위치: `docs/retrospectives/<phase-or-milestone>-retrospective.md`
- 고정 4섹션: **달성도(완료 기준 표) / 잘 된 것 / 어려웠던 것 / 다음 인수인계**
- 테스트 증분·성능 변화는 baseline 대비 수치로 기록
- 회고에서 도출된 프로세스 교훈은 다음 마일스톤 가드(PR 템플릿/검사 스크립트)로 **제도화**한다

## 디자인 품질 루브릭 (UI 프로젝트)
UI 작업 4축 평가 (Design Quality 30% / Originality 30% / Craft 20% / Functionality 20%). 점수 < 70% 축은 개선 의무. 상세: [docs/guides/design-quality-rubric.md](docs/guides/design-quality-rubric.md).

---

<!-- harness:managed:real-lessons:start -->
## 실전 교훈 (portfolio-26, simple-shop 등에서 추출)

> **블록 내 포인터 포맷 컨벤션**: 각 실전 교훈 블록은 내용 불릿 → `근거:` 불릿 → (선택) `일반화된 설계 지식:` 불릿 순서로 마감한다. `docs/architecture/` 나 `docs/decisions/` 로 승격된 지식이 있을 때만 마지막 포인터를 추가하고, 없으면 생략한다 (빈 placeholder 금지). 형식: `- 일반화된 설계 지식: [docs/architecture/<파일>.md](경로) — 한 줄 요약`. 근거: PR [#113](https://github.com/coseo12/harness-setting/pull/113) reviewer 권고 3, 이슈 [#114](https://github.com/coseo12/harness-setting/issues/114).

### 빌드 성공 ≠ 동작하는 앱
빌드/단위 테스트 통과 ≠ 브라우저 동작. 커밋 전 **3단계 브라우저 검증 의무**:
1. **정적**: 이미지 로드 / 콘솔 에러 0 / 모바일·데스크톱 레이아웃
2. **인터랙션**: 버튼·링크·검색·필터·폼
3. **흐름**: 네비게이션 → 페이지 → 데이터 연동, URL ↔ 상태 동기화

> 스크린샷 = Level 1. "렌더링 = 동작" 아님.

변형 3종 (lessons): **monorepo dist stale** ([docs/lessons/monorepo-dist-stale.md](docs/lessons/monorepo-dist-stale.md), volt #70) / **엄격 원칙 + 동적 적응 부재** ([docs/lessons/strict-principle-dynamic-context.md](docs/lessons/strict-principle-dynamic-context.md), volt #68) / **DoD PASS ≠ 제품 동작** ([docs/lessons/ux-dod-vs-product-behavior.md](docs/lessons/ux-dod-vs-product-behavior.md), volt #72/#74)

### CI 통과 ≠ 테스트 실행
"언어 자동 감지" 범용 CI 템플릿이 `echo` 만 수행하고 실제 `npm test` 를 돌리지 않는 경우 — 초록 체크 머지 뒤에도 테스트 미실행. 실행 시간/Actions 로그/CI 구조 3개 진단 신호로 감지, 고의적 실패 PR 실측으로 게이트 작동 확인.
- 상세: [docs/lessons/ci-and-downstream-verification.md](docs/lessons/ci-and-downstream-verification.md)

### 다운스트림 harness update 부합성 사전 체크리스트
`harness update` 후 다운스트림 CI push-fail-fix 루프 **사전 진단** — 4단계 체크 + 4 옵션 (A 제거 / B shim / C divergent / D upstream 확장, 애매 시 A). 상세: [docs/harness-update-compat-checklist.md](docs/harness-update-compat-checklist.md). 근거: volt [#62](https://github.com/coseo12/volt/issues/62) / [harness#190](https://github.com/coseo12/harness-setting/issues/190).

### 다운스트림 실측이 최종 가드 — upstream 3중 방어 blindspot
upstream 의 단위 테스트 / reviewer / cross-validate 3중 방어가 통과해도 다운스트림 환경 매트릭스에서만 드러나는 결함 존재. release 를 막는 대신 **역방향 피드백 속도 최대화**. "N 적용 시나리오" 근거는 `[실측]` / `[가정]` 라벨 부착 + 박제 문턱 (실측 ≥ 1 + 가정 ≥ 3 + 공통 조건 매트릭스) 충족 필수 (#195).
- 상세: [docs/lessons/ci-and-downstream-verification.md](docs/lessons/ci-and-downstream-verification.md)

### workflow_dispatch 2단계 함정 (GitHub Actions)
`workflow_dispatch` 트리거는 default branch 반영 후에만 discover 된다 (feature/develop push 로는 실행 불가). 추가로 PR 자동 생성 workflow 는 저장소 Settings `can_approve_pull_request_reviews` 가 기본 OFF 라 거부된다. 도입 PR DoD 에 "default branch 반영 후 실행 검증" 명시.
- 상세: [docs/lessons/workflow-dispatch-pitfalls.md](docs/lessons/workflow-dispatch-pitfalls.md)
- **함정의 양면성 — release 가속 트리거 변형 (volt [#97](https://github.com/coseo12/volt/issues/97))**: 검증 차단이 사용자에게 release 결정 강제 노출하는 부산물 + 자연 리듬 정렬 효과. 단 모든 차단이 정당화 아님 — 누적 < 10 커밋이면 옵션 B (대기) / C (cherry-pick) 합리. release-cadence-check workflow 신설로 함정 의존 제거 가능.

### gh CLI 마크다운 본문 발송 — execSync shell metachar 함정 (volt #114)
Node.js `execSync('gh pr comment N --body "..."')` 로 백틱/`$`/`!`/`;` 포함 본문 발송 시 shell 이 명령 치환·변수 확장으로 해석 → silent syntax error. **`spawnSync('gh', [...args])` + `--body-file -` + `{ input: body, stdio: ['pipe', 'inherit', 'inherit'] }` 3축 우회** 의무. 상세: [docs/lessons/gh-cli-execsync-pitfall.md](docs/lessons/gh-cli-execsync-pitfall.md).

### 주석 계약 vs 구현 drift — 버그 생성원
파일 상단 주석 / JSDoc 이 선언한 계약과 구현의 drift 는 **버그 생성원**. default fallback 이 누락을 조용히 흡수해 테스트도 fail 하지 않는다. 주석에 선언된 규칙은 테스트 커버리지 대상이며, enum 분기 fallback 에 경고·assert 추가로 drift 감지.
- 상세: [docs/lessons/comment-implementation-drift.md](docs/lessons/comment-implementation-drift.md)
- **숨은 상수 변형 (volt [#69](https://github.com/coseo12/volt/issues/69))**: 위성 모듈 독립 선언 잔존 → 상대 비율/단위/스케일 drift 조용히 생성. 저장소 전체 `grep -rn "<CONST_NAME>"` + 주석 SSoT 참조 dead reference 차단 의무 (reviewer.md §4).

### HTTP 200 ≠ 올바른 리소스
- 이미지 URL이 200을 반환해도 **내용이 의도와 다를 수 있다**
- `next/image` 프록시는 쿼리 파라미터 포함 URL에서 실패할 수 있다
- 외부 리소스는 반드시 다운로드하여 내용을 직접 확인한다

### display-only 버그 패턴
AI가 생성하는 코드에서 반복되는 실패 패턴:
- UI가 존재하지만 이벤트 핸들러가 없음 (버튼 렌더링만, 클릭 미동작)
- 조건 논리 버그로 삭제/수정이 실제로 반영되지 않음
- 입력 필드가 사용자 입력에 반응하지 않음

### 프로젝트 재구축 시 주의
`rm -rf`로 재구축 시 사용자 터미널의 cwd가 삭제된 디렉토리를 가리킬 수 있다.
반드시 사전 경고한다.

### 인계 항목 실측 재검증 — NO-OP ADR 패턴
인계 "수정 필요 항목" 이 환경 변화로 착수 시점 이미 해소된 경우 — 실측 → NO-OP ADR (`docs/decisions/<YYYYMMDD>-<topic>-no-op.md`) + 회귀 가드. Explore 미결정 시 debug 스크립트 (`scripts/_debug-<topic>-tmp.mjs`, 즉시 `rm`) 로 runtime 실측 선행. 상세: [docs/lessons/no-op-adr-pattern.md](docs/lessons/no-op-adr-pattern.md). 근거: volt [#14](https://github.com/coseo12/volt/issues/14) / [#67](https://github.com/coseo12/volt/issues/67).

### 신규 함수 ≠ 신규 구현
새 함수/헬퍼/유틸리티를 쓰기 전 "이미 있을 수 있다"를 기본 가설로 둔다. AI는 "없다"고 가정하고 바로 구현으로 들어가는 편향이 있어, 이전 마일스톤에서 구축된 공용 함수를 재발견하지 못한 채 중복 코드와 테스트를 생성한 사례가 반복된다.

- 구현 착수 전 `Grep`으로 함수명·핵심 키워드 검색 (예: `stateVector`, `velocity.*orbital`, `parse.*X`)
- 같은 패키지의 `index.ts` export 목록을 먼저 훑는다 — 한 파일만 봐도 재사용 대상이 드러나는 경우가 많다
- 중복을 발견하면 미련 없이 삭제하고 기존 함수 import로 대체 (sunk cost 편향 경계)
- 근거: volt [#21](https://github.com/coseo12/volt/issues/21) — 50줄 + 테스트 70줄 작성 후 동일 기능 함수가 동일 패키지에 이미 존재함을 발견한 사례

### 신규 데이터 ≠ 신규 코드 — ADR 예측 재현
레이어/플러그인/스키마 구조에서 "데이터만 추가, 코드 변경 0" 예측을 ADR 에 Concrete Prediction 으로 박제하고 `git diff --stat` 로 실측 재현. 예측 성공은 추상화 건강성의 구체 증거, 실패는 리팩토링 필요 신호.
- 상세: [docs/lessons/data-not-code-extension.md](docs/lessons/data-not-code-extension.md)

### 커밋 성공 ≠ 의도한 변경 커밋됨
`git commit` 종료 코드 0과 "커밋 성공" 메시지만 믿지 말 것. 특히 lint-staged + tracked/ignored 혼재 상황에서 staged 변경 일부가 **조용히 유실**될 수 있다.

- lint-staged 출력에서 `[FAILED]` 키워드를 발견하면 **커밋 후 필수 검증**
- 커밋 직후 `git diff <base> HEAD -- <예상 파일 목록>` 또는 `git show --stat HEAD` 로 실제 반영된 파일 확인
- `.gitignore` 규칙을 새로 추가할 때는 `git ls-files <path>` 로 이미 tracked된 파일이 있는지 확인 후 `git rm --cached` 로 정리
- 근거: volt [#13](https://github.com/coseo12/volt/issues/13) — "빌드 성공 ≠ 동작", "HTTP 200 ≠ 올바른 리소스" 원칙의 연장선

### 매니페스트 최신 ≠ 파일 적용 완료 — 부분 실패 교착 복구
매니페스트 기반 패키지 관리자(`harness update`, Nix, brew, dpkg/apt 등)는 파일 적용과 해시 기록이 **원자적 트랜잭션이 아닐** 수 있어, 부분 롤백 시 `--apply-all-safe` 가 "동일 상태" 로 오판하고 스킵하면 **복구 불가능한 교착** 에 빠진다. 즉시 복구는 이전 머지 커밋에서 `.harness/manifest.json` 복구 후 재-apply. v2.8.0 (post-apply 검증 게이트) + v2.9.0 (`previousSha256` 자가 복구) 로 코드 레벨에서 상당 부분 해소.

- 상세 (증상 / 즉시 복구 절차 / formatter 재포맷 drift / 버전 이력): [docs/lessons/manifest-partial-failure-recovery.md](docs/lessons/manifest-partial-failure-recovery.md)
- 일반화된 설계 지식: [docs/architecture/state-atomicity-3-layer-defense.md](docs/architecture/state-atomicity-3-layer-defense.md) — 도중/사후/안내 3계층 직교 방어 패턴

### sub-agent 검증 완료 ≠ GitHub 박제 완료
sub-agent(dev/qa 페르소나 등) 는 **검증** 까지는 신뢰하되 **박제** (커밋/푸시/PR 생성/`gh pr comment`/auto-close) 는 신뢰하지 말 것. sub-agent 보고는 *의도* 이고 실제 외부 가시성은 별도. 메인이 `git log --oneline -1` / `gh pr view` / `gh issue view --json state` 로 직접 확인.

- **공통 SSoT 9 필드 + 메인 게이트 + bg 인계 + base=develop 함정** 통합 상세: [docs/lessons/sub-agent-ssot-handoff.md](docs/lessons/sub-agent-ssot-handoff.md)
- **SSoT 동기화 자동 가드** (#145, v2.23.0~): 9 필드는 5 에이전트 `.md` 의 체크리스트 JSON 에 그대로 등장해야 하며 `scripts/verify-agent-ssot.sh` 가 CI `detect-and-test` 에서 drift 차단. SSoT 블록 수정 PR 은 5 에이전트 파일 동시 갱신 + 로컬 verify 사전 확인 필수.
- **메인 오케스트레이터 단계 게이트** (volt [#77](https://github.com/coseo12/volt/issues/77)): `developer → reviewer → qa → 사용자/머지` 순서 강제. 예외: docs only / chore. 상세: [docs/lessons/headless-browser-verification.md](docs/lessons/headless-browser-verification.md)

### sub-agent multi-turn 라운드 이탈 — 매트릭스 일관성 검증
sub-agent 에 multi-turn 세션 위임 시 세부 매트릭스가 다음 라운드에서 이탈. SendMessage 는 **이전 라운드 매트릭스를 본문에 인라인 재첨부** ("권고 A" 참조 레이블만으론 부족). 메인 오케스트레이터가 핵심 키워드 대조로 이탈 즉시 감지. PM 재계약 시 DoD 자체 재구조화 금지 — 사용자 응답은 파라미터만 조정.
- 상세 (라운드 이탈 / PM DoD drift 재현 / 예방 규약): [docs/lessons/sub-agent-multiturn-drift.md](docs/lessons/sub-agent-multiturn-drift.md) — volt [#34](https://github.com/coseo12/volt/issues/34) / [#76](https://github.com/coseo12/volt/issues/76)

### headless 브라우저 검증 ≠ 실 브라우저 동작
`agent-browser` / Playwright headless (특히 swiftshader adapter) 는 3D/WebGPU 경로에서 부분 freeze 로 false positive 를 낸다. "headless 8/8 PASS" 만 믿지 말 것. 시각 효과 포함 작업은 `status:review` 전 **실 Chrome GUI 수동 검증 최소 1회** 필수. CRITICAL #3 의 확장.
- 상세: [docs/lessons/headless-browser-verification.md](docs/lessons/headless-browser-verification.md)

### 가드 도입 PR DoD — 4축 검증 의무
신규 `verify-*.sh` + CI step 등 negative-test 성격 가드 도입 PR 은 positive PASS 만으론 작동 보장 불가. 4축 명시: (1) 격리 동적 테스트 / (2) 3중 시뮬레이션 (positive→negative→recovery) / (3) 5 페르소나 self-consistency N×5 셀 결정적 일치 / (4) 메타 측정 도구 자기 적용 안정성. harness `verify-agent-ssot.sh` (#145) 도입 시 3중 시뮬레이션 누락 회고 포함.
- 상세: [docs/lessons/guard-pr-dod.md](docs/lessons/guard-pr-dod.md) — volt [#96](https://github.com/coseo12/volt/issues/96) / [#100](https://github.com/coseo12/volt/issues/100) / [#109](https://github.com/coseo12/volt/issues/109) / [#112](https://github.com/coseo12/volt/issues/112)

### 가드 설계 원칙 — measurement-first / 의식적 silent 약화 / fail-fast
가드 무력화 3축 (설계/구현/운영) 차단: (1) architect broad 권고 → dev D1 실측 false-positive → precision 정정 3중 박제 (measurement-first), (2) 발화 빈도 ≥ 1/주 시 의식적 silent 약화 + ADR §결정 CRITICAL 명시, (3) drift 가드는 fail-fast 만 — fallback 분기 절대 금지 (strict assertion 자기모순 회피).
- 상세: [docs/lessons/guard-design-principles.md](docs/lessons/guard-design-principles.md) — volt [#101](https://github.com/coseo12/volt/issues/101) / [#106](https://github.com/coseo12/volt/issues/106) / [#107](https://github.com/coseo12/volt/issues/107)
<!-- harness:managed:real-lessons:end -->

---

## 교차검증 (cross-validate)

정답이 없는 의사결정에서 외부 검증 모델 (현재 Antigravity `agy`, Phase 1A #269 부터 — 이전 gemini-cli) 의 두 번째 시각을 활용한다. 결과는 Claude 가 재분석하여 합의/이견/고유 발견으로 분류 — 맹목 수용 금지.

- **박제 직후 1회 루틴** — CRITICAL DIRECTIVE 개정 / ADR 신규·중대 개정 / MINOR 이상 `Behavior Changes` / 프로젝트 원칙 선언 직후 노출 효율이 가장 높다
- **API 429 폴백 프로토콜** — capacity 체크 + 지연 재시도 → 최종 실패 시 Claude 단독 분석 + `claude-only analysis completed — 단일 모델 편향 노출 미확보` 박제. 박제 위치 우선순위: CHANGELOG Notes > ADR 각주 > 커밋 메시지 > PR 코멘트 (중복 금지). 스크립트 레벨 강제: `.claude/skills/cross-validate/scripts/cross_validate.sh` (exit 77 + outcome JSON)
- **Claude 자체 편향 4종 셀프 체크** — 호출 전 낙관적 일정 / 결합 관계 간과 / 폐기 프레이밍 / 순수주의 원칙을 자기 산출물과 대조 (감지 시 명시 질문으로 프롬프트에 삽입)
- **수용 전 실측 sanity check (volt [#66](https://github.com/coseo12/volt/issues/66))** — 외부 모델이 제안한 **수치 DoD 재정의·물리/환경 제약** 은 ADR/계약 박제 전 1회 실측 (실 환경 실행 또는 단위 테스트 snippet) 으로 자가모순 확인 선행. "엄격한 DoD = 안전" 편향은 외부 모델+Claude 공유이므로 교차검증 자체로는 self-contradiction 을 거르지 못한다. cross-validate 스킬 결과 분석 §0 참조.
- **외부 툴 동작 주장은 실측 필수** — 같은 생태계 내 도구 간 flag 복사 금지. 검증 템플릿: `<tool> --help | grep -A 2 <flag>` (공식 지원 여부 판정)
- **고유 발견은 스프린트 비목표와 대조** — 범위 밖이면 후속 이슈로 분리 (CRITICAL #6 보호)
- **plan-mode 우회 자동 가드 (#479)** — `cross_validate.sh` 가 외부 모델 호출 전/후 워킹트리 snapshot 비교 + 자동 롤백 (tracked = `git checkout --`, untracked = `rm -f`) + outcome JSON 3 필드 (`plan_bypass` / `bypass_files` / `rollback_failed`). agy 는 **L1** (prompt strict prefix — 도구 호출 사전 차단) + **L3** (사후 snapshot diff + 자동 롤백) 이중 가드 (Phase 1A 부터, `--approval-mode plan` 등가 부재). **메인 오케스트레이터 의무**: sub-agent 복귀 직후 `parse-cross-validate-outcome.sh` 파싱 + `plan_bypass == false` 확인. `true` 발견 시 즉시 사용자 보고 + `bypass_files` 추가 검증, `rollback_failed == true` 면 수동 개입. `.gitignore` 변경 시 CRITICAL 격상. 5 페르소나 SSoT (architect/reviewer/qa §절차 + developer/pm §금지, drift 0)
- 상세 프로토콜 / 매트릭스 / 근거 체인: [docs/guides/cross-validate-protocol.md](docs/guides/cross-validate-protocol.md)

---

## 원칙

### 우선순위
```
사용자 명시적 지시 > 프레임워크 기본 원칙
```
예외: 보안 취약점, 데이터 손실이 예상될 때만 경고 후 사용자 확인

### 모호한 지시 대응
"리뉴얼", "개선" 등 범위가 넓은 지시 → 작업 전 범위를 사용자에게 제시하고 확인
- 보수적 해석 편향 금지
- 기존 코드 보존 관성 금지
- 확신이 없으면 3번 재작업보다 1번 질문

### 세션 의도 이탈 감지 (메인 오케스트레이터)
단일 세션에서 **본래 사용자 의도** → 부수 작업 이탈 패턴 감지 + 사용자 명시적 선택 요청 트리거. 이탈 시그널 4개 (PR 3+ 생성 / 릴리스 태그 ≥ 이슈 / 시간 2배 / 관심사 4+ 트랙) 중 2개 이상 충족 시 발화. 사전 분리 권고 + 세션 사후 3축 평가 + 예외 조건 (escape hatch 방지 — 사후 재분류 금지). 상세: [docs/lessons/session-intent-drift.md](docs/lessons/session-intent-drift.md). 근거: volt [#63](https://github.com/coseo12/volt/issues/63) / [#24](https://github.com/coseo12/volt/issues/24) / [#34](https://github.com/coseo12/volt/issues/34)

### 릴리스
- **SemVer 분류 (각인층)** — 판정 애매 시 낮은 쪽:
  - **MAJOR** — 하위 호환 파괴 (CLI 인자/시그니처/스킬·에이전트 계약/`.harness` 스키마/설정 키)
  - **MINOR** — 코드·에이전트 행동 신규/변경 (에이전트 지시어·스킬 절차·체크리스트·행동 제약의 추가/수정 = MINOR)
  - **PATCH** — 행동 변화 없는 문서·문구 (실전 교훈/README/오타/버그 수정)
- **행동 변화 vs 문서 판정 질문**: "같은 입력에 다르게 동작하는가?" → 예 MINOR / 아니오 PATCH
- **CHANGELOG 의무**:
  - MINOR/MAJOR — `### Behavior Changes` 섹션 필수 (다운스트림 `harness update` 후 관찰 항목)
  - PATCH 도 `.claude/` 변경 시 `### Behavior Changes: None — 문서/문구만` 명시 (자동 업데이트 신뢰 모델 보호)
- **`package.json::version` bump 필수** — chore(release) PR 에서 CHANGELOG 엔트리와 **동일 커밋**. `scripts/verify-release-version-bump.sh` CI 검증
- **Phase 분리 / CHANGELOG 작성 / 근거** 상세: [docs/guides/release-process.md](docs/guides/release-process.md)

### 문서 동기화
에이전트/스킬/설정 변경·삭제 시 docs/ 동기화 + dead reference 0 확인.

### CLAUDE.md 비대화 방지
- CLAUDE.md 는 **각인층** — 세션 시작 즉시 상기돼야 행동이 바뀌는 규칙만. 매트릭스(3행+)·코드블록(5라인+)·프로토콜(3스텝+)·근거 체인(이슈 2+) 은 `docs/` 로 추출하고 1~3 줄 포인터만 남긴다.
- 정량 게이트: **35k chars** warn / **40k** PR warn (신규 인라인 블록 금지) / **45k** CI fail. 임계 초과 시 올바른 대응은 "예외 박제" 가 아니라 **기존 블록 가지치기 (각인층 → 참조층 이동)**.
- 예외는 ADR 로만 박제 (`docs/decisions/<YYYYMMDD>-claudemd-exception-<topic>.md`) — 사유·대체 불가 근거·재검토 조건 필수. 상세 프로토콜: [docs/guides/claudemd-governance.md](docs/guides/claudemd-governance.md)

### 파일명 규칙
- **기본**: kebab-case (`user-profile.ts`, `api-client.js`)
  - 이유: macOS APFS(case-insensitive) ↔ Linux(case-sensitive) 간 유령 파일/충돌 방지
- **예외** (언어·프레임워크 관습 우선):
  - React/Vue/Svelte 컴포넌트: `PascalCase.tsx`
  - Python 모듈: `snake_case.py` (PEP 8)
  - Java/Kotlin 클래스: `PascalCase.java`
  - 프레임워크 특수 파일: `page.tsx`, `layout.tsx`, `[id].tsx`, `Dockerfile`, `Makefile`, `README.md` 등 관습 고정값
- **기존 파일 수정·추가 시**: 주변 디렉토리의 기존 컨벤션을 따른다 (일관성 > 규칙)

### 모노레포 가드
- 신규 워크스페이스(apps/*, packages/*) 추가 시 **테스트 설정(vitest/jest config + scripts.test) 필수**
- `pnpm -r test` / `npm -ws test` 는 scripts.test 누락 워크스페이스를 **조용히 스킵**한다 — 사고 방지를 위해 루트에 `verify:test-coverage` 스크립트(각 워크스페이스에 테스트 설정 존재 검사) 운용을 권장
- 신규 패키지 스캐폴딩 시 테스트 베이스를 기본 포함시킨다

### 아키텍처 결정 기록 (ADR)
- 코어 기술 스택 선택(언어/런타임/프레임워크/주요 라이브러리)을 도입·교체할 때는 `docs/decisions/<YYYYMMDD>-<topic>.md` 로 ADR을 남긴다
- 섹션: **배경 / 후보 비교(축별) / 결정 / 결과·재검토 조건**
- 프로젝트별 고유 패턴(상태 관리, 씬 동기화 등)도 추후 에이전트가 참조 가능하도록 `docs/architecture/` 또는 해당 프로젝트 CLAUDE.md에 명시 기록한다

### 한글 인코딩 검증
한국어 파일 Edit 후 `grep -rn '�' <파일>` (U+FFFD) 검증 의무. 발견 시 즉시 수정.

### 금지 사항
- main 브랜치 직접 수정 금지
- 리뷰 없이 머지 금지
- 테스트 없이 PR 생성 금지
- feature/fix PR 의 `base=main` 금지 — 반드시 `develop` 대상. `base=main` 은 release/hotfix PR 만 허용
- hotfix 머지 후 `main → develop` merge-back 누락 금지 — 누락 시 `harness doctor` 가 drift 로 감지
