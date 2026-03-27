# SimpleShop 파이프라인 시뮬레이션

## 목적
간소화된 Harness Framework(9 에이전트, 적응형 파이프라인)의 동작을 SimpleShop 프로젝트에서 검증한다.

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
| 1 | 제품 카드 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |
| 2 | 검색바 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |
| 3 | 위시리스트 버튼 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |
| 4 | 제품 목록 그리드 컴포넌트 | s | frontend | Architect→Developer→Evaluator→Merge |

### size:m 이슈 (5단계 파이프라인)
| # | 이슈 | size | scope | 파이프라인 |
|---|------|------|-------|----------|
| 5 | 제품 목록+검색+정렬 페이지 | m | fullstack | PM→Architect→Developer→Evaluator→QA→Merge |
| 6 | 제품 상세 페이지 | m | fullstack | PM→Architect→Developer→Evaluator→QA→Merge |
| 7 | 위시리스트 관리 페이지+API | m | fullstack | PM→Architect→Developer→Evaluator→QA→Merge |

### size:l 이슈 (6단계 파이프라인)
| # | 이슈 | size | scope | 파이프라인 |
|---|------|------|-------|----------|
| 8 | 카테고리 필터+가격 정렬 시스템 (FE+BE) | l | fullstack | Planner→PM→Architect→FE/BE Dev(병렬)→Evaluator→QA→Merge |
| 9 | 위시리스트 연동+실시간 상태 동기화 | l | fullstack | Planner→PM→Architect→FE/BE Dev(병렬)→Evaluator→QA→Merge |

## 상태 전이 시뮬레이션

### 정상 흐름 (이슈 #5: 제품 목록+검색+정렬)
```
status:todo → status:in-progress (Developer 착수)
→ status:evaluating (PR 생성 → Evaluator 평가)
→ status:qa (Evaluator 승인 → QA 테스트)
→ status:done (QA 통과)
```

### 반려 흐름 (이슈 #7: 위시리스트 관리 — 중복 추가 방지 로직 누락)
```
status:todo → status:in-progress (Developer 착수)
→ status:evaluating (PR 생성)
→ status:in-progress (Evaluator 반려: "위시리스트 중복 추가 방지 로직 누락")
→ status:evaluating (Developer 수정 후 재제출)
→ status:qa (Evaluator 승인)
→ status:done (QA 통과)
```

## Developer 워크플로우 (8단계, 브라우저 검증 포함)

```
1. 이슈 분석 — 요구사항/설계 문서 확인
2. 테스트 시나리오 → 테스트 코드 변환 (테스트 우선)
3. 구현 — 테스트를 통과하는 코드 작성
4. 린트/타입 체크 — ESLint + TypeScript 검증
5. 단위 테스트 실행 — vitest run
6. 브라우저 검증 — 로컬 서버 기동 후 실제 렌더링 확인
   - 모바일(480px) 뷰포트에서 그리드 1열 표시 확인
   - 데스크톱(1200px) 뷰포트에서 그리드 4열 표시 확인
   - 제품 카드 클릭 → 상세 페이지 네비게이션 동작 확인
   - 위시리스트 버튼 토글 상태 시각적 확인
7. PR 생성 — 변경 사항/테스트 계획/영향 범위 명시
8. Evaluator 피드백 대응 — 반려 시 수정 후 재제출
```

## Evaluator 검증 포인트

### 1단계: 자동화된 검증
- [x] ESLint 통과
- [x] TypeScript 타입 에러 없음
- [x] 하드코딩된 시크릿 없음
- [x] 테스트 과적합 없음 (하드코딩/편법 검증)

### 2단계: 판단 기반 검증
- [x] Architect 설계 문서 인터페이스 준수
- [x] API 계약 준수 (GET/POST/DELETE 응답 형식)
- [x] 테스트 시나리오 13개 모두 테스트 코드 변환 확인
- [x] 반응형 브레이크포인트 준수 (1열/2열/3열/4열 그리드)
- [x] 브라우저 검증 결과 첨부 확인 (모바일+데스크톱 스크린샷)

### 부정 편향 발동 사례
- "display-only" 패턴 감지: 위시리스트 버튼이 실제 API를 호출하는지 확인
- 검색 필터링이 빈 문자열 입력 시 전체 목록을 반환하는지 확인
- 가격 정렬이 동일 가격 제품의 순서를 안정적으로 유지하는지 확인

## 적응형 파이프라인 검증 결과

| 이슈 크기 | 파이프라인 단계 | 검증 결과 |
|----------|--------------|----------|
| size:s | 4단계 | 단순 UI 컴포넌트에 적합 — QA 단계 생략으로 속도 향상 |
| size:m | 5단계 | FE+BE 통합 기능에 적합 — QA E2E 검증 필요 |
| size:l | 6단계 | FE/BE 병렬 개발 시 전체 파이프라인 + 브라우저 검증 필요 |

## 테스트 실행 결과

```
 Test Files  3 passed (3)
      Tests  13 passed (13)
```

| 테스트 파일 | 테스트 수 | 결과 |
|-----------|---------|------|
| products-api.test.ts | 5 | PASS |
| wishlist.test.ts | 4 | PASS |
| components.test.tsx | 4 | PASS |

## 결론
간소화된 프레임워크(9 에이전트)가 SimpleShop MVP를 성공적으로 처리.
적응형 파이프라인이 이슈 크기별로 적절한 깊이의 검증을 제공함을 확인.
Developer 워크플로우 8단계에 브라우저 검증이 추가되어 시각적 회귀 방지를 강화.
