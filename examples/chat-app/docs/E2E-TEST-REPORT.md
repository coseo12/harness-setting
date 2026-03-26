# 채팅 앱 E2E 테스트 레포트

> **작성일**: 2026-03-26
> **검증 방법**: Playwright 헤드리스 브라우저 + curl API 테스트
> **범위**: REST API 9개 엔드포인트 + 프론트엔드 4개 페이지 + Socket.IO 실시간 통신

---

## 1. 검증 결과 요약

### API 테스트 (curl)

| # | 테스트 | 결과 |
|---|--------|------|
| 1 | GET /api/health | ✓ `{"status":"ok"}` |
| 2 | POST /api/auth/register | ✓ user + token 반환 |
| 3 | POST /api/auth/login | ✓ user + token 반환 |
| 4 | GET /api/users/me (인증) | ✓ 사용자 정보 반환 |
| 5 | GET /api/rooms (미인증) | ✓ 401 UNAUTHORIZED |
| 6 | POST /api/rooms | ✓ 방 생성, memberCount: 1 |
| 7 | GET /api/rooms | ✓ 방 목록 반환 |
| 8 | GET /api/rooms/[id] | ✓ 방 상세 + members |
| 9 | GET /api/rooms/[id]/messages | ✓ 빈 목록, nextCursor: null |
| 10 | GET /api/rooms/nonexistent | ✓ 404 NOT_FOUND |

### E2E 브라우저 테스트 (Playwright)

| # | 테스트 | 모바일 (480px) | 데스크톱 (1200px) |
|---|--------|:---:|:---:|
| 1 | 회원가입 → 채팅 리다이렉트 | ✓ | ✓ |
| 2 | 사이드바 표시 (방 미선택) | ✓ | ✓ |
| 3 | 채팅방 생성 모달 | ✓ | ✓ |
| 4 | 사이드바 숨김 (방 선택 후, 모바일만) | ✓ | N/A (항상 표시) |
| 5 | 메시지 입력 필드 표시 | ✓ | ✓ |
| 6 | **메시지 전송 + 버블 표시** | ✓ | ✓ |
| 7 | 뒤로가기 버튼 (모바일만) | ✓ | ✓ (숨겨짐) |
| 8 | 뒤로가기 → 사이드바 복원 | ✓ | N/A |
| 9 | 로그아웃 → 로그인 리다이렉트 | - | ✓ |
| 10 | Socket.IO 접속자 표시 | ✓ | ✓ |

### Vitest 단위 테스트

- **33개 전부 통과** (API 16 + 컴포넌트 14 + 소켓 3)

---

## 2. 발견된 문제 및 수정 사항

### 2-1. [수정됨] 모바일 사이드바가 채팅 영역을 가림 (P1)

**문제**: `@media (max-width: 768px)`에서 사이드바가 `position: absolute; width: 100%`로 설정되어, 채팅방 입장 후에도 사이드바가 메시지 입력/전송 버튼을 완전히 덮었음.

**원인**: CSS에 `.chat-sidebar.hidden` 규칙은 존재했지만, React 컴포넌트에서 `hidden` 클래스를 토글하는 로직이 누락됨.

**수정**:
- `app/chat/layout.tsx`: `usePathname()`으로 현재 URL을 감지, 채팅방 내부(`/chat/[roomId]`)에서는 `hidden` 클래스 추가
- `components/chat/ChatHeader.tsx`: 모바일 뒤로가기(←) 버튼 추가
- `app/globals.css`: `.btn-back` 스타일 추가 (데스크톱에서는 숨김)

**프레임워크 교훈**: **Architect가 반응형 레이아웃의 상태 전이(사이드바 토글)를 설계 문서에 명시**해야 함. 단순 CSS만으로는 React 상태 기반 UI의 동작을 보장할 수 없다.

### 2-2. [수정됨] ChatHeader에 useRouter 추가로 테스트 실패 (P1)

**문제**: 뒤로가기 버튼을 위해 `useRouter()`를 ChatHeader에 추가했으나, ChatApp 단위 테스트에서 Next.js App Router가 마운트되지 않아 `invariant expected app router to be mounted` 에러 발생.

**수정**: `__tests__/components/ChatApp.test.tsx`에 `next/navigation` mock 추가.

**프레임워크 교훈**: **QA 에이전트가 컴포넌트 수정 시 해당 컴포넌트의 테스트도 자동으로 재실행**해야 함. 현재 fix-error 스킬은 CI 실패 후 반응적으로 동작하는데, 수정 시점에서 선제적으로 테스트를 돌리는 패턴이 필요.

---

## 3. 프레임워크 개선 권고사항

### 3-1. Architect 에이전트: 반응형 상태 설계 (신규)

**현재**: Architect 설계 문서에 반응형 레이아웃의 **시각적 디자인**만 기술됨.

**개선**: 반응형 뷰에서의 **상태 전이**(사이드바 표시/숨김, 모달 토글 등)를 명시적으로 설계해야 함.

```markdown
## 반응형 상태 전이
| 뷰포트 | 경로 | 사이드바 | 뒤로가기 |
|--------|------|---------|---------|
| ≥769px | /chat | 표시 | 숨김 |
| ≥769px | /chat/[id] | 표시 | 숨김 |
| ≤768px | /chat | 표시 | 숨김 |
| ≤768px | /chat/[id] | 숨김 | 표시 |
```

### 3-2. QA 에이전트: 반응형 E2E 필수화

**현재**: QA 에이전트가 E2E 테스트를 실행할 때 단일 뷰포트만 사용.

**개선**: 모바일(480px) + 데스크톱(1200px) 두 가지 뷰포트에서 동일 시나리오를 실행하는 것을 기본으로 해야 함.

### 3-3. Developer 에이전트: useRouter 사용 시 테스트 영향도 체크

**현재**: Frontend Developer가 컴포넌트에 `useRouter`를 추가할 때, 해당 컴포넌트를 import하는 테스트 파일의 mock 업데이트를 놓침.

**개선**: Next.js 훅(`useRouter`, `usePathname`, `useSearchParams`)을 추가할 때 **테스트 mock 업데이트를 체크리스트에 포함**하는 규칙을 developer.md와 frontend-developer.md에 추가.

### 3-4. Custom Server 사용 시 개발 가이드

**발견**: `next dev`가 아닌 `tsx server.ts`로 실행해야 Socket.IO가 동작함. `package.json`의 `dev` 스크립트는 이를 반영하지만, README나 Architect 설계 문서에 이 제약이 명시되어야 함.

### 3-5. SQLite 파일 병렬 접근

**발견**: Vitest가 테스트 파일을 병렬 실행할 때 SQLite 파일 접근 경합 발생. `fileParallelism: false`로 해결했으나, 이는 테스트 속도 저하를 유발.

**장기 개선**: 테스트별 별도 DB 파일 또는 in-memory SQLite 사용.

---

## 4. 스크린샷

### 모바일 (480px) — 채팅방 목록
- 다크 테마 정상 적용
- 사이드바 전체 화면 표시
- 방 이름 첫 글자 아이콘, 멤버 수 표시

### 모바일 (480px) — 채팅방 내부
- 사이드바 숨김, ← 뒤로가기 버튼 표시
- 메시지 버블 (블루-퍼플 그라데이션)
- 접속자 목록 패널
- 메시지 입력 바 + 전송 버튼

### 데스크톱 (1200px) — 채팅방 내부
- 사이드바 + 메인 동시 표시
- 방 목록에 마지막 메시지 프리뷰
- 접속자 패널, 메시지 버블, 입력 바 정상

---

## 5. 최종 결론

| 항목 | 상태 |
|------|------|
| REST API | ✓ 10/10 엔드포인트 정상 |
| 프론트엔드 렌더링 | ✓ 4개 페이지 정상 |
| Socket.IO 실시간 통신 | ✓ 메시지 전송/수신 정상 |
| 모바일 반응형 | ✓ 수정 후 정상 |
| 단위 테스트 | ✓ 33/33 통과 |
| **발견된 버그** | **2건 (모두 수정 완료)** |
| **프레임워크 개선 권고** | **5건** |
