# 스킬 사용 가이드

## 스킬 목록

| 스킬 | 용도 | 사용 에이전트 |
|------|------|---------------|
| `create-issue` | 이슈 생성 + 라벨 | PM, Architect, Reviewer, QA |
| `create-pr` | PR 생성 + 리뷰 요청 | Developer |
| `review-pr` | PR 리뷰 + 승인/반려 | Reviewer |
| `run-tests` | 테스트 자동 감지 + 실행 | Developer, QA |
| `sync-status` | 에이전트 간 상태 동기화 | 전체 |
| `create-skill` | 새 스킬 생성 + 평가 | Skill Creator |
| `cross-validate` | Gemini 교차검증 | Cross Validator |
| `fix-error` | CI/QA 실패 수정 | Developer |
| `resolve-conflict` | 머지 충돌 해결 | Developer |
| `static-analysis` | 린트/보안 스캔 | Auditor |
| `create-release` | 릴리스 생성 | Releaser |
| `generate-docs` | 문서 자동 생성 | Releaser |

## 자주 묻는 질문

### 이슈 생성 시 라벨을 빠뜨렸어요
```bash
gh issue edit <번호> --add-label "status:todo,agent:developer,priority:medium"
```

### PR 제목에 이슈 번호를 빠뜨렸어요
```bash
gh pr edit <번호> --title "[#이슈번호] 변경 설명"
```

### 에이전트가 멈췄어요
1. `./scripts/orchestrator.sh status` 로 상태 확인
2. `.harness/logs/` 에서 해당 에이전트 로그 확인
3. 필요 시 프로세스 종료 후 재디스패치

### 병렬 작업 중 충돌이 났어요
```bash
./scripts/lock-file.sh status    # 잠금 상태 확인
./scripts/lock-file.sh cleanup   # 좀비 잠금 정리
```

### 새 스킬을 추가하고 싶어요
```bash
./scripts/dispatch-agent.sh skill-creator
# 또는 수동으로:
# 1. mkdir -p .claude/skills/<스킬명>
# 2. SKILL.md 작성 (frontmatter: name, description)
# 3. python3 .claude/skills/create-skill/scripts/quick_validate.py 로 검증
```

## 일반적 함정

- **PR 범위 초과**: PR당 변경 파일 10개 이하 유지. 넘으면 분할.
- **의존성 순환**: 이슈 간 의존성이 순환하면 오케스트레이터가 영원히 대기.
- **라벨 불일치**: `status:review`인데 실제론 작업 중인 상태 → `sync-status` 스킬 실행.
- **타임아웃**: 에이전트 기본 30분 타임아웃. 큰 작업은 이슈를 분해.
