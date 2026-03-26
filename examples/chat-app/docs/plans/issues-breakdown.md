# 이슈 분해 — 채팅 앱

## 이슈 목록

| # | 이슈 | scope | agent | 선행 | size |
|---|------|-------|-------|------|------|
| 1 | 프로젝트 초기화 + Prisma 스키마 | infra | architect | - | M |
| 2 | 인증 API (register, login, me) | backend | backend-developer | #1 | L |
| 3 | 채팅방 API (CRUD + messages) | backend | backend-developer | #1 | L |
| 4 | 인증 UI (로그인/회원가입) | frontend | frontend-developer | #1 | M |
| 5 | 채팅방 목록 UI | frontend | frontend-developer | #1 | M |
| 6 | Socket.IO 서버 | backend | backend-developer | #2,#3 | L |
| 7 | Socket.IO 클라이언트 훅 | frontend | frontend-developer | #4 | M |
| 8 | 채팅 메시지 UI | frontend | frontend-developer | #5,#7 | L |
| 9 | FE/BE 통합 | fullstack | developer | #2~#8 | M |
| 10 | 문서화 + 시뮬레이션 | docs | integrator | #9 | S |

## FE/BE 병렬 구간

```
#1 (Architect) ─────────────────────────────>
                ├─ #2 (BE) ─── #3 (BE) ──── #6 (BE) ──>
                ├─ #4 (FE) ─── #5 (FE) ──── #7 (FE) ── #8 (FE) ──>
                                                                     └─ #9 (통합) ─ #10 (문서)
```
