# ChatApp — 실시간 채팅 애플리케이션

Harness Engineering Framework 파이프라인 검증용 두 번째 예제 프로젝트.
FE/BE 병렬 개발, DB 마이그레이션, 인증, 실시간 통신을 검증한다.

## 기술 스택

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Next.js Route Handlers + Socket.IO
- **Database**: SQLite + Prisma ORM
- **Authentication**: JWT (jose) + bcryptjs
- **Test**: Vitest + @testing-library/react

## 시작하기

```bash
# 의존성 설치
npm install

# DB 스키마 적용
npx prisma db push

# 개발 서버 실행 (Socket.IO 포함)
npm run dev
# → http://localhost:3000
```

## 기능

- 회원가입 / 로그인 (JWT 인증)
- 채팅방 생성 / 목록
- 실시간 메시지 송수신 (Socket.IO)
- 접속자 목록
- 이전 대화 로딩 (커서 기반 페이지네이션)

## 구조

```
app/api/         → BE Developer 영역 (Route Handlers)
components/      → FE Developer 영역 (React 컴포넌트)
lib/             → 공유 로직 (types, validation, auth, db)
server.ts        → Custom Server (Socket.IO 통합)
prisma/          → DB 스키마
__tests__/       → 33개 테스트 (API 16 + 컴포넌트 14 + 소켓 3)
```

## 테스트

```bash
npm test          # 전체 테스트 실행
npm run test:watch  # 감시 모드
```

## 프레임워크 검증 포인트

| 검증 항목 | To-Do 앱 | 채팅 앱 |
|----------|---------|--------|
| FE/BE 병렬 개발 | ✗ fullstack | ✓ 분리 |
| DB 마이그레이션 | ✗ 파일 DB | ✓ Prisma |
| 인증 | ✗ | ✓ JWT |
| 실시간 통신 | ✗ | ✓ Socket.IO |
| 다중 리소스 관계 | ✗ Todo 단일 | ✓ User↔Room↔Message |
