# To-Do App — 파이프라인 검증 예제

Harness Engineering Framework의 전체 파이프라인을 검증하기 위한 예제 프로젝트.

## 실행

```bash
# 의존성 설치
npm run install:all

# FE + BE 동시 실행
npm run dev

# 테스트
npm test
```

## 구조

```
todo-app/
├── docs/                    # Planner + PM + Architect 산출물
│   ├── plans/
│   │   ├── todo-app-plan.md
│   │   └── issues-breakdown.md
│   └── architecture/
│       └── todo-app-architecture.md
├── backend/                 # Backend Developer 산출물
│   ├── server.js
│   ├── routes/todos.js
│   ├── middleware/errorHandler.js
│   ├── data/todos.json
│   └── tests/todos.test.js
├── frontend/                # Frontend Developer 산출물
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── api.js
│       └── components/
└── PIPELINE-SIMULATION.md   # 파이프라인 시뮬레이션 결과
```

## 파이프라인 시뮬레이션 결과

9단계 중 4단계 자동 모드 실패 — 상세: [PIPELINE-SIMULATION.md](./PIPELINE-SIMULATION.md)
