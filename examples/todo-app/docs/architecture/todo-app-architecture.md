# 설계 문서: To-Do List 웹 애플리케이션

> **작성자**: Architect Agent
> **작성일**: 2026-03-26

## 1. 시스템 구조

```
┌─────────────┐     HTTP/JSON     ┌─────────────┐     fs     ┌──────────┐
│   Frontend   │ ←──────────────→ │   Backend    │ ←────────→ │ data.json│
│  (Vite+JS)   │  localhost:5173   │  (Express)   │            │          │
│  port:5173   │   proxy→:3000    │  port:3000   │            │          │
└─────────────┘                   └─────────────┘            └──────────┘
```

## 2. API 계약 (Contract)

FE/BE 병렬 개발을 위한 API 인터페이스 정의.

### 2-1. 데이터 모델

```typescript
interface Todo {
  id: string;        // UUID v4
  title: string;     // 필수, 1~200자
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
| GET | /api/todos?filter=completed | - | `{ todos: Todo[] }` | 필터 조회 |
| POST | /api/todos | `{ title, description? }` | `{ todo: Todo }` | 생성 |
| PATCH | /api/todos/:id | `{ title?, description?, completed? }` | `{ todo: Todo }` | 수정 |
| DELETE | /api/todos/:id | - | `{ success: true }` | 삭제 |

### 2-3. 에러 응답

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "제목은 필수입니다."
  }
}
```

## 3. 디렉토리 구조

```
examples/todo-app/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js           # 진입점
│       ├── api.js            # API 클라이언트
│       ├── components/
│       │   ├── TodoApp.js    # 루트 컴포넌트
│       │   ├── TodoList.js   # 목록 렌더링
│       │   ├── TodoItem.js   # 개별 항목
│       │   └── AddTodo.js    # 추가 폼
│       └── styles/
│           └── main.css
├── backend/
│   ├── package.json
│   ├── server.js             # Express 서버
│   ├── routes/
│   │   └── todos.js          # /api/todos 라우터
│   ├── middleware/
│   │   └── errorHandler.js   # 에러 핸들러
│   └── data/
│       └── todos.json        # 데이터 파일
└── package.json              # 루트 (concurrently로 FE+BE 실행)
```

## 4. FE/BE 병렬 개발 전략

- **FE**: `src/api.js`에 Mock 모드 내장. BE 미완료 시 로컬 배열로 동작.
- **BE**: Postman/curl로 독립 테스트. FE 없이 API만 검증.
- **통합**: Mock 플래그 제거 후 Vite proxy로 BE 연결.
