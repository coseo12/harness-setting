# RecipeHub 파이프라인 시뮬레이션

## 목적
간소화된 Harness Framework(9 에이전트, 적응형 파이프라인)의 동작을 검증한다.

## 프레임워크 변경 사항 (Before → After)
| 지표 | Before | After |
|------|--------|-------|
| 에이전트 | 15개 | 9개 |
| 파이프라인 | 10단계 | 6단계 (적응형 4~6) |
| 상태 라벨 | 14개 | 8개 |

## 이슈 분해 (PM 에이전트 시뮬레이션)

### size:s 이슈 (4단계 파이프라인)
| # | 이슈 | size | scope | 파이프라인 |
|---|------|------|-------|----------|
| 1 | 레시피 카드 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |
| 2 | 검색바 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |
| 3 | 별점 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |
| 4 | 반응형 헤더/네비게이션 | s | frontend | Architect→Developer→Evaluator→Merge |

### size:m 이슈 (5단계 파이프라인)
| # | 이슈 | size | scope | 파이프라인 |
|---|------|------|-------|----------|
| 5 | 레시피 목록+검색 페이지 | m | fullstack | PM→Architect→Developer→Evaluator→QA→Merge |
| 6 | 레시피 상세 페이지 | m | fullstack | PM→Architect→Developer→Evaluator→QA→Merge |
| 7 | 레시피 등록 폼+API | m | fullstack | PM→Architect→Developer→Evaluator→QA→Merge |

### size:l 이슈 (6단계 파이프라인)
| # | 이슈 | size | scope | 파이프라인 |
|---|------|------|-------|----------|
| 8 | 별점 시스템 (FE+BE) | l | fullstack | Planner→PM→Architect→FE/BE Dev(병렬)→Evaluator→QA→Merge |
| 9 | 카테고리 필터+고급 검색 | l | fullstack | Planner→PM→Architect→FE/BE Dev(병렬)→Evaluator→QA→Merge |

## 상태 전이 시뮬레이션

### 정상 흐름 (이슈 #5: 레시피 목록+검색)
```
status:todo → status:in-progress (Developer 착수)
→ status:evaluating (PR 생성 → Evaluator 평가)
→ status:qa (Evaluator 승인 → QA 테스트)
→ status:done (QA 통과)
```

### 반려 흐름 (이슈 #7: 등록 폼 — 필수 필드 검증 누락)
```
status:todo → status:in-progress (Developer 착수)
→ status:evaluating (PR 생성)
→ status:in-progress (Evaluator 반려: "필수 필드 검증 로직 누락")
→ status:evaluating (Developer 수정 후 재제출)
→ status:qa (Evaluator 승인)
→ status:done (QA 통과)
```

## Evaluator 검증 포인트

### 1단계: 자동화된 검증
- [x] ESLint 통과
- [x] TypeScript 타입 에러 없음
- [x] 하드코딩된 시크릿 없음
- [x] 테스트 과적합 없음

### 2단계: 판단 기반 검증
- [x] Architect 설계 문서 인터페이스 준수
- [x] API 계약 준수 (GET/POST 응답 형식)
- [x] 테스트 시나리오 9개 모두 테스트 코드 변환 확인
- [x] 반응형 브레이크포인트 준수 (1열/3열)

### 부정 편향 발동 사례
- "display-only" 패턴 감지: 별점 클릭 이벤트가 실제 API를 호출하는지 확인
- 검색 필터링이 제목뿐 아니라 재료도 검색하는지 확인

## 적응형 파이프라인 검증 결과

| 이슈 크기 | 파이프라인 단계 | 검증 결과 |
|----------|--------------|----------|
| size:s | 4단계 | 단순 UI 컴포넌트에 적합 — QA 단계 생략으로 속도 향상 |
| size:m | 5단계 | FE+BE 통합 기능에 적합 — QA E2E 검증 필요 |
| size:l | 6단계 | FE/BE 병렬 개발 시 전체 파이프라인 필요 |

## 결론
간소화된 프레임워크(9 에이전트)가 RecipeHub MVP를 성공적으로 처리.
적응형 파이프라인이 이슈 크기별로 적절한 깊이의 검증을 제공함을 확인.
