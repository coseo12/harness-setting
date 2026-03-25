# 파이프라인 시뮬레이션 보고서

> **프로젝트**: To-Do List 웹 애플리케이션
> **목적**: Harness 파이프라인 전체 흐름 검증 및 구조적 문제 재현
> **실행일**: 2026-03-26

---

## 시뮬레이션 결과 요약

| 단계 | 에이전트 | 결과 | 발견된 문제 |
|------|---------|------|------------|
| 1. 기획 | Planner | 통과 | 없음 |
| 2. 이슈 분해 | PM | **실패** | 라벨 생성 불가 (#4, #10) |
| 3. 설계 | Architect | 통과 | 없음 |
| 4a. BE 구현 | Backend Dev | **디스패치 실패** | auto_dispatch 미감지 (#3) |
| 4b. FE 구현 | Frontend Dev | **디스패치 실패** | auto_dispatch 미감지 (#3) |
| 5. 정적 분석 | Auditor | **스킵됨** | 파이프라인에서 누락 (#1) |
| 6. 코드 리뷰 | Reviewer | 조건부 통과 | Auditor 없이 진행 |
| 7. QA | QA | 통과 | 테스트 8/8 성공 |
| 8. 정합성 검증 | Integrator | **트리거 불가** | qa-passed 라벨 미존재 (#6) |
| 9. 교차검증 | Cross Validator | **실패** | Gemini 429 에러 (#7) |

---

## 단계별 상세

### Stage 1: Planner → 통과

- `docs/plans/todo-app-plan.md` 생성
- 기능 정의, 기술 스택 결정, 이슈 분해 제안까지 정상 수행
- **문제 없음**: Planner는 GitHub/라벨과 무관하게 문서만 생성

### Stage 2: PM (이슈 분해) → 실패

**재현된 문제:**
1. `create-issue` 스킬의 라벨 가이드에 `agent:frontend-developer`, `agent:backend-developer`, `scope:frontend`, `scope:backend` 없음
   - PM이 FE/BE 이슈를 분리할 때 올바른 라벨을 선택할 수 없음
2. `setup-labels.sh`에 해당 라벨이 정의되어 있지 않아 GitHub에도 라벨 미존재
   - `gh issue create --label "agent:backend-developer"` 실행 시 라벨이 없어 경고 발생

**영향**: 이후 auto_dispatch가 이슈를 감지할 수 없게 됨

### Stage 3: Architect → 통과

- `docs/architecture/todo-app-architecture.md` 생성
- API 계약(Contract) 정의로 FE/BE 병렬 개발 기반 마련
- **문제 없음**: Architect도 문서 생성 역할이라 파이프라인 영향 없음

### Stage 4: FE Dev + BE Dev (병렬) → 디스패치 실패

**재현된 문제:**
- `orchestrator.sh`의 `auto_dispatch()`가 `agent:developer` 라벨만 감지
- `agent:frontend-developer`, `agent:backend-developer` 라벨은 무시됨
- **결과**: 수동으로 `dispatch-agent.sh`를 호출해야만 개발자 에이전트 실행 가능

**우회 방법 (현재):**
```bash
# 수동 디스패치 필요
./scripts/dispatch-agent.sh frontend-developer 1
./scripts/dispatch-agent.sh backend-developer 2
```

**코드 자체의 결과:**
- BE: 테스트 8개 전부 통과 (CRUD + 필터 + 유효성 검증 + 헬스체크)
- FE: Vanilla JS 컴포넌트 구현 완료 (Mock API 내장으로 독립 동작 확인)

### Stage 5: Auditor → 스킵됨

**재현된 문제:**
- PR 생성 시 `pr-review.yml`이 `status:review` 라벨을 자동 부착
- `auto_dispatch()`가 이를 감지해 바로 Reviewer에게 디스패치
- Auditor 단계(정적 분석, 시크릿 검출)가 완전히 건너뛰어짐

**예상 파이프라인:**
```
PR 생성 → Auditor → status:audit-passed → Reviewer
```

**실제 파이프라인:**
```
PR 생성 → (pr-review.yml이 status:review 부착) → Reviewer (Auditor 스킵)
```

### Stage 6: Reviewer → 조건부 통과

- Auditor 없이 진행되므로 정적 분석 결과 없이 리뷰
- 리뷰 자체는 가능하나, 품질 게이트가 약해짐

### Stage 7: QA → 통과

```
▶ To-Do API
  ✔ GET /api/todos — 빈 목록 반환
  ✔ POST /api/todos — 할 일 생성
  ✔ POST /api/todos — 제목 없으면 400
  ✔ PATCH /api/todos/:id — 완료 토글
  ✔ DELETE /api/todos/:id — 삭제
  ✔ GET /api/todos?filter=completed — 필터 동작
  ✔ PATCH /api/todos/:id — 존재하지 않는 ID
  ✔ GET /api/health — 헬스체크
✔ To-Do API (8/8 통과)
```

### Stage 8: Integrator → 트리거 불가

**재현된 문제:**
- QA 완료 후 `status:qa-passed` 라벨을 부착해야 하는데, 이 라벨이 `setup-labels.sh`에 없음
- Integrator는 `status:qa-passed`를 트리거 조건으로 사용하므로 자동 호출 불가
- `sync-status` 스킬의 상태 전이에도 `qa-passed` 경로 없음

### Stage 9: Cross Validator → 실패

**재현된 문제:**
- Gemini CLI `gemini-3.1-pro-preview` 모델에서 429 RESOURCE_EXHAUSTED 발생
- `cross_validate.sh`에 재시도/폴백 로직 없어 스크립트 전체 종료
- `gemini-2.5-pro` 모델로 수동 전환하면 동작함

---

## 문제 분류

### 파이프라인 차단 (Pipeline Blocker) — 자동 모드 작동 불가

| # | 문제 | 영향 범위 |
|---|------|----------|
| 3 | auto_dispatch FE/BE 미감지 | 개발 단계 자동화 불가 |
| 1 | Auditor 스킵 | 품질 게이트 무력화 |
| 6 | Integrator 트리거 라벨 미존재 | 정합성 검증 자동화 불가 |
| 10 | setup-labels.sh 라벨 7개 누락 | 이슈 생성/디스패치 전반에 영향 |

### 기능 저하 (Degraded) — 수동 우회 가능

| # | 문제 | 우회 방법 |
|---|------|----------|
| 4 | create-issue 라벨 누락 | PM이 수동으로 라벨 지정 |
| 5 | audit-passed 상태 전이 없음 | 수동 라벨 변경 |
| 9 | Draft PR에 status:review 부착 | Draft PR 사용 자제 |

### 외부 의존 (External) — 환경에 따라 달라짐

| # | 문제 | 대안 |
|---|------|------|
| 7 | Gemini 429 에러 | 모델 폴백 (gemini-2.5-pro) |
| 8 | lock-file 미사용 | 병렬 에이전트 실행 시에만 문제 |

---

## 결론

**9단계 파이프라인 중 4단계가 자동 모드에서 실패**하며,
이 중 3개는 라벨/상태 전이 불일치가 원인이다.

핵심 수정 사항:
1. `setup-labels.sh` — 누락 라벨 추가
2. `orchestrator.sh auto_dispatch()` — FE/BE 에이전트 감지 + Auditor 단계 삽입
3. `sync-status` SKILL.md — audit-passed 상태 전이 추가
4. `cross_validate.sh` — Gemini 모델 폴백 로직 추가

위 4건을 수정하면 이 To-Do 앱 예제로 전체 파이프라인 E2E 자동 실행이 가능해진다.
