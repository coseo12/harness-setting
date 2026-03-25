# To-Do App — 파이프라인 검증 예제

Harness Engineering Framework의 전체 파이프라인을 검증하기 위한 예제 프로젝트.
Next.js + TypeScript + Vitest 기반.

## 실행

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:3000)
npm run dev

# 테스트
npm test

# 빌드
npm run build
```

## 구조

```
todo-app/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 메인 페이지
│   ├── globals.css
│   └── api/                     # Route Handlers
│       ├── health/route.ts
│       └── todos/
│           ├── route.ts         # GET, POST
│           └── [id]/route.ts    # PATCH, DELETE
├── components/                  # React 클라이언트 컴포넌트
│   ├── TodoApp.tsx
│   ├── AddTodo.tsx
│   ├── TodoList.tsx
│   └── TodoItem.tsx
├── lib/                         # 공유 로직
│   ├── types.ts                 # TypeScript 타입
│   ├── todo-repository.ts       # 파일 기반 DB
│   ├── validation.ts            # 입력 검증
│   └── api-client.ts            # fetch 래퍼
├── data/todos.json              # 파일 DB
├── __tests__/                   # Vitest 테스트
│   ├── api/                     # Route Handler 테스트 (9개)
│   └── components/              # 컴포넌트 테스트 (14개)
├── docs/                        # 설계 문서
└── PIPELINE-SIMULATION.md       # 파이프라인 시뮬레이션 결과
```

## 테스트 결과

23개 테스트 전부 통과 (API 9 + 컴포넌트 14)

## 파이프라인 시뮬레이션 결과

상세: [PIPELINE-SIMULATION.md](./PIPELINE-SIMULATION.md)
