---
name: resolve-conflict
description: |
  Git 머지 충돌을 감지하고 해결하는 스킬.
  TRIGGER when: git push/rebase/merge 시 충돌 발생, "conflict", "충돌 해결",
  "머지 실패", "rebase 실패", 병렬 개발 중 동일 파일 수정 감지.
  DO NOT TRIGGER when: 일반 git 작업, 충돌 없는 머지.
---

# 충돌 해결

Git 머지 충돌을 감지, 분석, 해결한다.

## 충돌 감지

```bash
# develop 브랜치와의 충돌 사전 확인
git fetch origin develop
git merge-tree $(git merge-base HEAD origin/develop) HEAD origin/develop | grep -c "changed in both"

# rebase 시도
git rebase origin/develop
# 충돌 발생 시 exit code != 0
```

## 파일 잠금 (사전 예방)

병렬 작업 시 파일 잠금으로 충돌을 사전 방지한다.

```bash
# 잠금 획득
./scripts/lock-file.sh acquire <파일경로>

# 작업 수행...

# 잠금 해제
./scripts/lock-file.sh release <파일경로>

# 잠금 상태 확인
./scripts/lock-file.sh status
```

## 충돌 해결 절차

### 1. 충돌 파일 식별
```bash
git diff --name-only --diff-filter=U
```

### 2. 충돌 내용 분석
각 충돌 파일에서 충돌 마커를 파싱한다:
- `<<<<<<< HEAD` — 현재 브랜치의 변경
- `=======` — 구분선
- `>>>>>>> branch` — 상대 브랜치의 변경

### 3. 해결 전략 결정

| 상황 | 전략 |
|------|------|
| 서로 다른 부분을 수정 | 양쪽 모두 수용 |
| 같은 로직을 다르게 수정 | 설계 문서 기준으로 판단 |
| import/의존성 충돌 | 양쪽 모두 포함 + 중복 제거 |
| 설정 파일 충돌 | 병합 후 유효성 검증 |

### 4. 해결 및 검증
```bash
# 충돌 해결 후
git add <해결된_파일>
git rebase --continue  # 또는 git merge --continue

# 테스트 실행으로 해결 결과 검증
```

## 규칙

- 충돌 해결 시 양쪽 의도를 모두 보존하는 것이 원칙이다.
- 판단이 어려운 충돌은 관련 Developer에게 질문한다.
- 충돌 해결 후 반드시 테스트를 실행한다.
- 설계 인터페이스 관련 충돌은 Architect에게 에스컬레이션한다.
