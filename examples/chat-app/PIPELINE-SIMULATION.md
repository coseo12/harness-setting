# 파이프라인 시뮬레이션 — 채팅 앱

> **프로젝트**: 실시간 채팅 애플리케이션
> **스택**: Next.js 15 + TypeScript + SQLite + Prisma + Socket.IO
> **목적**: FE/BE 병렬 개발 워크플로우 검증, 프레임워크 성숙도 2→3단계 진입

---

## 파이프라인 단계별 검증

### 1. Planner → 기획서 작성
- **산출물**: `docs/plans/chat-app-plan.md`
- **핵심 기능 정의**: 인증, 채팅방, 실시간 메시징, 접속자 관리

### 2. PM → 이슈 분해
- **산출물**: `docs/plans/issues-breakdown.md`
- **이슈 10개**: FE 5 + BE 4 + Fullstack 1
- **FE/BE 병렬 구간 식별**: #2,#3 (BE) ↔ #4,#5 (FE)

### 3. Architect → 기술 설계
- **산출물**: `docs/architecture/chat-app-architecture.md`
- **API 계약 정의**: REST 7개 엔드포인트 + Socket.IO 5개 이벤트
- **DB 스키마 설계**: User, Room, RoomMember, Message (4 모델)

### 4. Frontend Developer + Backend Developer → 병렬 구현
- **BE Track**: 인증 API → 채팅방 API → Socket.IO 서버
- **FE Track**: 인증 UI → 채팅방 목록 → Socket.IO 클라이언트 → 메시지 UI
- **병렬 시점**: BE #2,#3 과 FE #4,#5 동시 진행

### 5. Auditor → 정적 분석
- JWT 시크릿 하드코딩 여부 확인
- SQL Injection (Prisma ORM 사용으로 안전)
- XSS 방지 (React 자동 이스케이프)
- WebSocket 인증 검증 (handshake 시 JWT 체크)

### 6. Reviewer → 코드 리뷰
- API 계약 준수 확인
- 타입 안전성 확인
- SSR Hydration 안전 패턴 확인

### 7. QA → 테스트
- API 테스트 16개 통과
- 컴포넌트 테스트 14개 통과
- 소켓 이벤트 테스트 3개 통과
- **총 33개 테스트 전부 통과**

### 8. Integrator → 정합성 검증
- 문서-코드 간 정합성 확인
- API 엔드포인트 ↔ 타입 정의 일치
- Socket.IO 이벤트 ↔ 타입 정의 일치

### 9. Merge
- `npm run build` 성공
- 전체 테스트 통과

---

## To-Do 앱 대비 개선 사항

| 항목 | To-Do 앱 (v1) | 채팅 앱 (v2) |
|------|-------------|-------------|
| 파이프라인 | fullstack 단일 경로 | FE/BE 병렬 경로 |
| DB | 파일 기반 JSON | SQLite + Prisma |
| 인증 | 없음 | JWT + bcrypt |
| 실시간 | 없음 | Socket.IO |
| 테스트 | 23개 | 33개 |
| 리소스 | Todo 1개 | User, Room, RoomMember, Message 4개 |
| API | 6개 | 7개 REST + 5개 Socket |

---

## 프레임워크 검증 결과

### 검증 성공 항목
- [x] FE/BE 이슈 분리 (scope:frontend, scope:backend)
- [x] Architect의 API 계약 → FE/BE 동시 착수 기준
- [x] Prisma 마이그레이션 (DB 스키마 관리)
- [x] JWT 인증 (회원가입/로그인/미들웨어)
- [x] Socket.IO 실시간 통신 (양방향)
- [x] 커서 기반 페이지네이션
- [x] 다크 테마 UI (글래스모피즘, 메시지 버블)

### 발견된 프레임워크 개선 사항
- SQLite 파일 병렬 접근 시 테스트 간섭 → `fileParallelism: false` 필요
- Custom Server 사용 시 `next dev` 불가 → `tsx server.ts` 사용
- Socket.IO 이벤트 타입 정의가 FE/BE 공유 필수 → `lib/types.ts`에 통합
