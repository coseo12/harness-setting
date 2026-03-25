# 설계 문서: To-Do List 웹 애플리케이션

> **작성자**: Architect Agent
> **작성일**: 2026-03-26
> **v2 갱신**: Next.js + TypeScript + Vitest 리팩토링 반영

## 1. 시스템 구조

```
┌──────────────────────────────────────────────┐
│              Next.js (port:3000)               │
│  ┌─────────────┐     ┌──────────────────────┐ │
│  │   React UI   │────→│   Route Handlers     │ │
│  │ (Client Comp)│ API │ app/api/todos/*.ts    │ │
│  └─────────────┘     └────────┬─────────────┘ │
│                                │ fs             │
│                        ┌───────┴──────┐        │
│                        │ data/todos.json│        │
│                        └──────────────┘        │
└──────────────────────────────────────────────┘
```

## 2. API 계약 (Contract)

### 2-1. 데이터 모델

```typescript
interface Todo {
  id: string;          // crypto.randomUUID()
  title: string;       // 필수, 1~200자
  description: string; // 선택, 최대 1000자
  completed: boolean;  // 기본값 false
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### 2-2. 엔드포인트

| Method | Path | Request Body | Response | 설명 |
|--------|------|-------------|----------|------|
| GET | /api/todos | - | `{ todos: Todo[] }` | 전체 목록 |
| GET | /api/todos?filter=completed\|active | - | `{ todos: Todo[] }` | 필터 조회 |
| POST | /api/todos | `{ title, description? }` | `{ todo: Todo }` | 생성 (201) |
| PATCH | /api/todos/:id | `{ title?, description?, completed? }` | `{ todo: Todo }` | 수정 |
| DELETE | /api/todos/:id | - | `{ success: true }` | 삭제 |
| GET | /api/health | - | `{ status: 'ok' }` | 헬스체크 |

### 2-3. 에러 응답

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "제목은 필수입니다." } }
```

## 3. 기술 스택

| 구분 | 기술 | 이유 |
|------|------|------|
| Framework | Next.js 15 (App Router) | FE/BE 통합, TypeScript 기본 지원 |
| Language | TypeScript | 타입 안전성 |
| Test | Vitest + @testing-library/react | 빠른 실행, React 생태계 호환 |
| Data | JSON 파일 | 예제 프로젝트, 외부 의존성 최소화 |

## 4. 디렉토리 구조

```
examples/todo-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # RootLayout (Server)
│   ├── page.tsx            # 메인 페이지 (Server)
│   ├── globals.css
│   └── api/
│       ├── health/route.ts
│       └── todos/
│           ├── route.ts    # GET, POST
│           └── [id]/route.ts # PATCH, DELETE
├── components/             # Client Components
│   ├── TodoApp.tsx         # 상태 관리 (useState)
│   ├── AddTodo.tsx         # 입력 폼
│   ├── TodoList.tsx        # 목록 렌더링
│   └── TodoItem.tsx        # 개별 항목
├── lib/
│   ├── types.ts            # 타입 정의
│   ├── todo-repository.ts  # 파일 기반 DB (서버 전용)
│   ├── validation.ts       # 입력 검증
│   └── api-client.ts       # fetch 래퍼 (클라이언트)
├── data/todos.json         # 파일 DB
└── __tests__/              # Vitest 테스트 (23개)
```

## 5. 파이프라인 흐름

```
PR 생성 → Auditor → status:audit-passed → Reviewer
       → status:qa → QA → status:qa-passed → Integrator → Merge
```
