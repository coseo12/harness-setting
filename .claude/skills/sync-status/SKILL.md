---
name: sync-status
description: |
  에이전트 간 작업 상태를 동기화하는 스킬. GitHub Issues/PR 기반 + 로컬 폴백.
  TRIGGER when: 에이전트가 작업 상태를 확인하거나 변경해야 할 때, "상태 확인",
  "동기화", "status", "현재 진행 상황", 다른 에이전트의 작업 완료 여부를 확인할 때,
  이슈/PR 라벨을 상태 전이 규칙에 따라 변경할 때.
  DO NOT TRIGGER when: 단순히 이슈 목록을 조회만 할 때.
---

# 상태 동기화

에이전트 간 작업 상태를 동기화한다.
GitHub를 우선 사용하고, 접근 불가 시 로컬 상태 파일로 폴백한다.

## 상태 전이 규칙

```
todo → in-progress → evaluating → qa → done
          ↑                          │
          └──────────────────────────┘ (반려 시)
```

각 전이는 라벨 교체로 표현한다:
- `status:todo` → `status:in-progress` : Developer가 작업 시작
- `status:in-progress` → `status:evaluating` : PR 생성 → Evaluator 평가 시작
- `status:evaluating` → `status:qa` : Evaluator 승인
- `status:qa` → `status:done` : QA 테스트 통과
- `status:evaluating` → `status:in-progress` : Evaluator 블로커 발견 또는 변경 요청
- `status:qa` → `status:in-progress` : QA 실패

## 방법 1: GitHub 기반 (기본)

```bash
# 상태별 이슈 조회
gh issue list --label "status:todo" --json number,title,labels
gh issue list --label "status:in-progress" --json number,title,labels
gh issue list --label "status:review" --json number,title,labels

# 상태별 PR 조회
gh pr list --label "status:review" --json number,title,labels
gh pr list --label "status:qa" --json number,title,labels

# 상태 전이 (라벨 교체)
gh issue edit <번호> --remove-label "status:todo" --add-label "status:in-progress"

# 블로커 표시
gh issue edit <번호> --add-label "status:blocked"
gh issue comment <번호> --body "블로커: [사유]. 선행 이슈: #번호"
```

## 방법 2: 로컬 상태 파일 (폴백)

GitHub API 접근 불가 시 `.harness/state.json`을 사용한다.

```bash
# 상태 확인
cat .harness/state.json | jq '.agents'

# 에이전트 상태 업데이트
jq '.agents.developer.status = "working" | .agents.developer.current_task = 5' \
  .harness/state.json > .harness/state.json.tmp \
  && mv .harness/state.json.tmp .harness/state.json
```

## 방법 3: 오케스트레이터 경유

오케스트레이터가 활성 상태면 직접 조율을 위임한다.

```bash
./scripts/orchestrator.sh status
```

## 방법 선택 로직

1. `gh auth status` 로 GitHub 접근 가능 여부 확인
2. 가능하면 → 방법 1
3. 불가능하면 → `.harness/state.json` 존재 확인 → 방법 2
4. 오케스트레이터 프로세스 확인 → 방법 3

## 규칙

- 상태 변경 시 `.harness/logs/`에 타임스탬프와 함께 기록한다.
- 역방향 전이(done → in-progress 등)는 사유를 반드시 기록한다.
- `status:blocked`는 다른 상태와 중복 부여 가능하다.
- 동기화 충돌 시 GitHub 상태를 우선(source of truth)한다.
