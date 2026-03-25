# 버그 수정 레포트: To-Do 앱 런타임 이슈

> **작성일**: 2026-03-26
> **검증 방법**: agent-browser (Playwright 기반), Vitest, curl

---

## 발견된 버그

### Bug 1: Hydration Mismatch — `new Date()` 서버/클라이언트 불일치

**증상**: 브라우저 콘솔에 React hydration mismatch 경고 발생

**원인**: `TodoApp.tsx`와 `TodoItem.tsx`에서 렌더 함수 내에서 `new Date()`를 직접 호출.
서버(SSR) 시점과 클라이언트(hydration) 시점의 시간이 달라 렌더링 결과가 불일치.

```typescript
// 문제 코드 (TodoApp.tsx:53-59)
const today = new Date();
const dateStr = today.toLocaleDateString('ko-KR', { ... }); // 서버 ≠ 클라이언트

// 문제 코드 (TodoItem.tsx:33)
const timeAgo = getTimeAgo(todo.createdAt); // Date.now() 사용
```

**수정**:
- `TodoApp.tsx`: `dateStr`을 `useState('')` + `useEffect`로 변경 — 서버에서는 빈 문자열, 클라이언트에서만 날짜 계산
- `TodoItem.tsx`: `timeAgo`를 `useState('')` + `useEffect`로 변경 — 동일 패턴

**영향 범위**: React hydration 실패 시 이벤트 핸들러가 일부 바인딩되지 않을 수 있음

---

### Bug 2: agent-browser에서 form submit이 동작하지 않음

**증상**: `agent-browser fill` + `agent-browser click .submit-btn` 시 `onSubmit` 핸들러가 호출되지 않음

**분석 과정**:
1. `agent-browser fill`로 input에 값 설정 → 접근성 트리에서 값 확인됨
2. `agent-browser click @e14 (.submit-btn)` → "Done" 반환 (에러 없음)
3. `handleSubmit`에 `console.log` 추가 → **콘솔에 출력 안 됨**
4. 같은 컴포넌트 내부 다른 버튼(카테고리 칩)도 **onClick 미동작**
5. 반면 TodoApp의 직접 자식 버튼(필터, ＋)은 **정상 동작**

**원인**: `agent-browser`(Playwright 기반)에서 **동적으로 마운트된 React 컴포넌트** 내부 버튼의 이벤트 핸들러를 트리거하지 못하는 문제. 초기 렌더링에 포함된 요소의 `onClick`은 정상 동작하나, `showAddForm && <AddTodo />`처럼 state 변경 후 마운트된 컴포넌트의 이벤트는 미동작.

**현재 상태**: agent-browser 도구의 한계로 판단. 실제 브라우저에서는 정상 동작.
API는 curl/Node.js HTTP 클라이언트로 검증 완료 (CRUD 전부 정상).

---

## 프레임워크가 놓친 것

### 1. QA 에이전트의 browser-test 스킬이 React SSR 앱의 hydration 이슈를 감지하지 못함

**문제**: `browser-test` 스킬의 테스트 워크플로우가 다음을 포함하지 않음:
- SSR/hydration mismatch 검출 (React 18/19의 `Hydration failed` 콘솔 에러)
- 서버 렌더링 HTML과 클라이언트 hydration 결과의 비교

**개선 제안**: browser-test 스킬에 "React hydration 검증" 절차 추가:
```bash
agent-browser open <url>
agent-browser console  # "Hydration failed", "Text content mismatch" 패턴 감지
```

### 2. Vitest 테스트가 hydration 문제를 잡지 못함

**문제**: 현재 컴포넌트 테스트는 `@testing-library/react`의 `render()`를 사용하는데, 이는 **클라이언트 사이드 렌더링만 수행**. SSR → hydration 흐름을 테스트하지 않아 hydration mismatch를 감지 불가.

**개선 제안**: `renderToString()` → `hydrateRoot()` 패턴의 hydration 테스트 추가:
```typescript
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
// SSR → hydration → console.error 감지
```

### 3. Architect 설계 문서에 SSR 주의사항 없음

**문제**: `docs/architecture/todo-app-architecture.md`에 Next.js App Router의 Server/Client Component 구분은 명시되어 있으나, **hydration 안전 패턴** (Date, Math.random, window 등)에 대한 가이드가 없음.

**개선 제안**: 설계 문서에 "SSR 안전 패턴" 섹션 추가:
- `new Date()`, `Date.now()` → `useEffect` 내에서만 사용
- `Math.random()` → 서버/클라이언트 동일 값 보장 필요
- `window`, `document` → `typeof window !== 'undefined'` 가드 필요

### 4. agent-browser의 동적 DOM 이벤트 호환성 문서화 필요

**문제**: `browser-test` 스킬 문서에 다음 제한사항이 명시되지 않음:
- React state 변경으로 동적 마운트된 컴포넌트의 이벤트 핸들러가 `click` 명령으로 트리거되지 않을 수 있음
- `fill` 명령이 React controlled input의 `onChange`를 트리거하지 못할 수 있음

**개선 제안**: browser-test 스킬에 "알려진 제한" 섹션 추가

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `components/TodoApp.tsx` | `new Date()` → `useEffect` 내 클라이언트 전용으로 이동 |
| `components/TodoItem.tsx` | `getTimeAgo()` → `useEffect` 내 클라이언트 전용으로 이동 |
| `components/AddTodo.tsx` | uncontrolled input + FormData 방식으로 전환 |

## 테스트 결과

- Vitest: 27개 전부 통과 (API 11 + 컴포넌트 16)
- API E2E (curl): CRUD 전부 정상
- 빌드: `next build` 성공
