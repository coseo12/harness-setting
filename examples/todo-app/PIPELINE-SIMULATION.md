# 파이프라인 시뮬레이션 보고서 (v2)

> **프로젝트**: To-Do List 웹 애플리케이션
> **스택**: Next.js 15 + TypeScript + Vitest
> **목적**: Harness 파이프라인 전체 흐름 검증 및 구조적 문제 재현/수정 확인
> **실행일**: 2026-03-26

---

## v1 → v2 변경 이력

| 항목 | v1 | v2 |
|------|----|----|
| Backend | Express + Node.js test runner | Next.js Route Handlers |
| Frontend | Vanilla JS + Vite | React (Client Components) |
| Language | JavaScript | TypeScript |
| Test | node:test (8개, BE만) | Vitest (23개, API+컴포넌트) |
| 구조 | FE/BE 분리 (2개 서버) | 단일 Next.js 앱 |

## 파이프라인 수정 사항 반영 결과

### 이전 시뮬레이션에서 발견된 10가지 문제 → 수정 현황

| # | 문제 | 수정 여부 | 수정 커밋/PR |
|---|------|----------|------------|
| 1 | Auditor 스킵 | **수정됨** | PR #8 — orchestrator.sh |
| 2 | state.json 스키마 불일치 | 미수정 (단기) | — |
| 3 | FE/BE 자동 디스패치 미지원 | **수정됨** | PR #8 — orchestrator.sh |
| 4 | create-issue 라벨 누락 | **수정됨** | 본 PR — SKILL.md |
| 5 | audit-passed 상태 전이 누락 | **수정됨** | PR #8 — sync-status |
| 6 | Integrator 트리거 라벨 미존재 | **수정됨** | PR #8 — setup-labels.sh |
| 7 | Gemini 실패 미처리 | **수정됨** | PR #8 — cross_validate.sh |
| 8 | lock-file 미사용 | 미수정 (중장기) | — |
| 9 | Draft PR에 status:review | **수정됨** | PR #9 — pr-review.yml |
| 10 | setup-labels.sh 라벨 누락 | **수정됨** | PR #8 — setup-labels.sh |

### v2 시뮬레이션 결과

| 단계 | 에이전트 | 결과 | 비고 |
|------|---------|------|------|
| 1. 기획 | Planner | 통과 | docs/plans/ 생성 |
| 2. 이슈 분해 | PM | **통과** | create-issue 라벨 수정으로 해결 |
| 3. 설계 | Architect | 통과 | API Contract 유지 |
| 4. 구현 | Developer (Fullstack) | **통과** | Next.js 단일 앱이므로 scope:fullstack |
| 5. 정적 분석 | Auditor | **통과** | auto_dispatch에 Auditor 삽입됨 |
| 6. 코드 리뷰 | Reviewer | 통과 | Auditor 통과 후 진행 |
| 7. QA | QA | **통과** | 23개 테스트 전부 통과 |
| 8. 정합성 검증 | Integrator | **통과** | status:qa-passed 라벨 추가됨 |
| 9. 교차검증 | Cross Validator | **통과** | Gemini 모델 폴백 동작 |

### 테스트 결과

```
 ✓ __tests__/api/health.test.ts        (1 test)
 ✓ __tests__/api/todos.test.ts         (8 tests)
 ✓ __tests__/components/AddTodo.test.tsx   (3 tests)
 ✓ __tests__/components/TodoApp.test.tsx   (4 tests)
 ✓ __tests__/components/TodoList.test.tsx  (3 tests)
 ✓ __tests__/components/TodoItem.test.tsx  (4 tests)

 Test Files  6 passed (6)
      Tests  23 passed (23)
```

---

## 결론

v1에서 9단계 중 4단계 실패 → v2에서 **9단계 전부 통과**.
파이프라인 핵심 수정(PR #8, #9) + create-issue 라벨 보완으로 자동 모드 E2E 동작 가능.

### 남은 과제 (중장기)
- state.json 스키마 불일치 (#2) — init-project.sh와 copy-template.js 통일
- lock-file 미사용 (#8) — 병렬 에이전트 실행 시 필요, 에이전트 프롬프트에 호출 패턴 추가
