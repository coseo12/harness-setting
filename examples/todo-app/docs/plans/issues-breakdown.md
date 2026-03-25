# PM 이슈 분해 결과

> **작성자**: PM Agent
> **작성일**: 2026-03-26

## 생성할 이슈 목록

### Issue #1: BE - To-Do REST API 구현
- **라벨**: `agent:backend-developer`, `scope:backend`, `priority:high`, `type:feature`, `status:todo`
- **내용**: CRUD 엔드포인트 4개 (GET /todos, POST /todos, PATCH /todos/:id, DELETE /todos/:id)
- **인수 조건**: 각 엔드포인트가 정상 동작, JSON 파일 영속성 확인

### Issue #2: FE - To-Do UI 컴포넌트 구현
- **라벨**: `agent:frontend-developer`, `scope:frontend`, `priority:high`, `type:feature`, `status:todo`
- **내용**: 할 일 목록, 추가 폼, 토글, 삭제 UI 구현
- **인수 조건**: Mock API로 독립 동작, 필터 기능 포함

### Issue #3: 통합 - FE+BE 연동 및 E2E 테스트
- **라벨**: `agent:developer`, `scope:fullstack`, `priority:medium`, `type:feature`, `status:todo`
- **선행**: #1, #2 완료 후
- **내용**: Mock API를 실제 API로 교체, 통합 테스트 작성

---

## 파이프라인 시뮬레이션 중 발견된 문제

### [문제 A] create-issue 스킬 라벨 불완전
PM이 Issue #1에 `agent:backend-developer` 라벨을 할당하려 했으나,
create-issue 스킬의 라벨 가이드에 이 라벨이 없어 올바른 라벨 선택이 어려움.
→ **교차검증 문제 #4 확인됨**

### [문제 B] setup-labels.sh에 라벨 미존재
`agent:backend-developer`, `agent:frontend-developer` 라벨이 GitHub에 생성되어 있지 않음.
이슈 생성 시 `gh issue create --label` 명령이 경고 없이 실패하거나 라벨 없이 생성됨.
→ **교차검증 문제 #10 확인됨**
