# 채팅 앱 아키텍처

## 시스템 구조

```
┌─────────────────────────────────────────────────┐
│                  Browser (Client)                │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ React Pages │  │ Socket.IO    │              │
│  │ (Next.js)   │  │ Client       │              │
│  └──────┬──────┘  └──────┬───────┘              │
│         │ fetch          │ ws                    │
└─────────┼────────────────┼───────────────────────┘
          │                │
┌─────────┼────────────────┼───────────────────────┐
│         ▼                ▼        Server          │
│  ┌──────────────┐ ┌──────────────┐               │
│  │ Route        │ │ Socket.IO    │               │
│  │ Handlers     │ │ Server       │               │
│  │ (REST API)   │ │ (WebSocket)  │               │
│  └──────┬───────┘ └──────┬───────┘               │
│         │                │                        │
│         ▼                ▼                        │
│  ┌──────────────────────────────┐                │
│  │     Prisma ORM               │                │
│  │     SQLite (dev.db)          │                │
│  └──────────────────────────────┘                │
└──────────────────────────────────────────────────┘
```

## DB 스키마

```
User ──< RoomMember >── Room
  │                       │
  └─── Message ──────────┘
```

| 모델 | 필드 | 설명 |
|------|------|------|
| User | id, email, password, nickname, avatar, createdAt | 사용자 |
| Room | id, name, createdAt | 채팅방 |
| RoomMember | id, userId, roomId, joinedAt | 방 멤버십 |
| Message | id, content, userId, roomId, createdAt | 메시지 |

## API 계약

### REST API

| 엔드포인트 | 메서드 | 인증 | 설명 |
|-----------|--------|------|------|
| /api/health | GET | ✗ | 헬스체크 |
| /api/auth/register | POST | ✗ | 회원가입 |
| /api/auth/login | POST | ✗ | 로그인 |
| /api/users/me | GET | ✓ | 현재 사용자 |
| /api/rooms | GET | ✓ | 방 목록 |
| /api/rooms | POST | ✓ | 방 생성 |
| /api/rooms/[id] | GET | ✓ | 방 상세 |
| /api/rooms/[id]/messages | GET | ✓ | 메시지 목록 |

### Socket.IO 이벤트

| 이벤트 | 방향 | 데이터 | 설명 |
|--------|------|--------|------|
| join-room | C→S | { roomId } | 방 입장 |
| leave-room | C→S | { roomId } | 방 퇴장 |
| send-message | C→S | { roomId, content } | 메시지 전송 |
| new-message | S→C | Message | 새 메시지 |
| user-joined | S→C | { user, roomId } | 사용자 입장 |
| user-left | S→C | { userId, roomId } | 사용자 퇴장 |
| online-users | S→C | { roomId, users[] } | 접속자 목록 |

## 인증 흐름

```
1. POST /api/auth/register → { user, token }
2. localStorage에 token 저장
3. API 호출 시 Authorization: Bearer <token>
4. Socket.IO 연결 시 auth: { token }
```
