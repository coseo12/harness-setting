# 배포 및 마이그레이션 가이드

## 1. 설치

### 방법 A: npx (권장)
```bash
npx @seo/harness-setting init ./my-project
cd my-project
```

### 방법 B: git clone
```bash
git clone https://github.com/coseo12/harness-setting.git ./my-project
cd my-project
npm install
```

## 2. 초기 설정

### 2-1. 필수 의존성 확인
```bash
# Claude Code CLI
command -v claude || echo "설치 필요: https://docs.anthropic.com/en/docs/claude-code"

# GitHub CLI
command -v gh || echo "설치 필요: https://cli.github.com/"

# GitHub 인증
gh auth status
```

### 2-2. GitHub 라벨 생성
```bash
./scripts/setup-labels.sh
```

에이전트 라벨 8개, 상태 라벨 8개, 범위/우선순위/크기/타입 라벨이 생성됩니다.

### 2-3. 환경 검증
```bash
./scripts/validate-setup.sh
```

### 2-4. 정합성 검증
```bash
./scripts/validate-integrity.sh
```

## 3. 에이전트 구조 (9개)

| 역할 | 파일 | 책임 |
|------|------|------|
| Orchestrator | orchestrator.md | 워크플로우 조율, 적응형 라우팅, 교착 감지 |
| Planner | planner.md | 주제/스펙 → 기획서 |
| PM | pm.md | 요구사항 → 이슈 분해 |
| Architect | architect.md | 기술 설계, 테스트 시나리오 |
| Frontend Dev | frontend-developer.md | UI 구현 |
| Backend Dev | backend-developer.md | API/비즈니스 로직 |
| Developer | developer.md | 풀스택 구현 |
| Evaluator | evaluator.md | 정적 분석 + 코드 리뷰 |
| QA | qa.md | 테스트, E2E 검증 |

## 4. 파이프라인 실행

### 단일 에이전트 실행
```bash
./scripts/dispatch-agent.sh planner          # 기획
./scripts/dispatch-agent.sh pm 5             # 이슈 #5 분해
./scripts/dispatch-agent.sh architect 5      # 이슈 #5 설계
./scripts/dispatch-agent.sh developer 5      # 이슈 #5 구현
./scripts/dispatch-agent.sh evaluator 12     # PR #12 평가
./scripts/dispatch-agent.sh qa 12            # PR #12 QA
```

### 자동 파이프라인
```bash
./scripts/orchestrator.sh start              # 이벤트 루프 시작
./scripts/orchestrator.sh status             # 칸반 보드
./scripts/orchestrator.sh pipeline 5         # 이슈 #5 파이프라인
./scripts/orchestrator.sh full 5             # Planner부터 전체
```

### 적응형 파이프라인

| 이슈 크기 | 파이프라인 |
|----------|----------|
| size:s | Architect → Developer → Evaluator → Merge |
| size:m | PM → Architect → Developer → Evaluator → QA → Merge |
| size:l/xl | 전체 (FE/BE 병렬) |

## 5. 마이그레이션 가이드 (15→9 에이전트)

### 5-1. 변경 매핑

| 기존 (15개) | 신규 (9개) | 변경 |
|------------|----------|------|
| Orchestrator | Orchestrator | 유지 (교착 감지 추가) |
| Planner | Planner | 유지 |
| PM | PM | 유지 |
| Architect | Architect | 유지 (테스트 시나리오 강화) |
| Frontend Dev | Frontend Dev | 유지 (3단계 검증 추가) |
| Backend Dev | Backend Dev | 유지 |
| Developer | Developer | 유지 (브라우저 검증 추가) |
| **Auditor** | **→ Evaluator** | 통합 |
| **Reviewer** | **→ Evaluator** | 통합 |
| QA | QA | 유지 (비주얼 QA 게이트 추가) |
| ~~Integrator~~ | 제거 | `validate-integrity.sh`로 대체 |
| ~~DevOps~~ | 제거 | Orchestrator에 흡수 |
| ~~Releaser~~ | 제거 | `create-release` 스킬로 대체 |
| ~~Cross Validator~~ | 제거 | `cross-validate` 스킬로 대체 |
| ~~Skill Creator~~ | 제거 | `create-skill` 스킬로 대체 |

### 5-2. 마이그레이션 단계

```bash
# 1. 백업
cp -r .claude/agents/ .claude/agents.backup/

# 2. 제거할 에이전트 삭제
rm .claude/agents/{auditor,reviewer,integrator,devops,releaser,cross-validator,skill-creator}.md

# 3. Evaluator 생성 (Auditor + Reviewer 통합)
# evaluator.md를 프레임워크에서 복사

# 4. 라벨 업데이트
./scripts/setup-labels.sh

# 5. 정합성 검증
./scripts/validate-integrity.sh

# 6. 상태 라벨 정리 (GitHub에서)
# 제거: status:review, status:reviewing, status:audit-passed, status:testing, status:qa-passed
# 추가: status:evaluating
```

### 5-3. 상태 전이 변경

```
기존: todo → in-progress → review → audit-passed → qa → qa-passed → done
신규: todo → in-progress → evaluating → qa → done
```

### 5-4. 롤백

문제 발생 시:
```bash
rm -r .claude/agents/
mv .claude/agents.backup/ .claude/agents/
```

## 6. 환경별 설정 (참고)

아래 항목은 프로젝트 환경에 따라 설정이 달라집니다:

| 항목 | 예시 |
|------|------|
| CI/CD | GitHub Actions, GitLab CI, Jenkins |
| 테스트 | Vitest, Jest, Playwright |
| 배포 | Vercel, AWS, GCP |
| 시크릿 관리 | .env, AWS Secrets Manager, Vault |
| 모니터링 | Grafana, Datadog, CloudWatch |

프로젝트에 맞는 CI/CD 워크플로우 설정은 DevOps 스킬 또는 직접 구성이 필요합니다.
