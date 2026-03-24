# Harness Engineering Framework

## 개요
이 저장소는 AI 에이전트 기반 자동화 개발 프레임워크의 템플릿이다.
새 프로젝트 시작 시 이 템플릿을 복사하여 사용한다.

---

## 에이전트 역할 체계

| 역할 | 파일 | 책임 |
|------|------|------|
| Orchestrator | `.claude/agents/orchestrator.md` | 전체 워크플로우 조율, 에이전트 간 동기화 |
| PM | `.claude/agents/pm.md` | 요구사항 분석, 이슈 분해, 우선순위 결정 |
| Architect | `.claude/agents/architect.md` | 기술 설계, 구조 결정, 인터페이스 정의 |
| Developer | `.claude/agents/developer.md` | 기능 구현, 브랜치 작업, PR 생성 |
| Reviewer | `.claude/agents/reviewer.md` | 코드 리뷰, 품질 검증, 승인/반려 |
| QA | `.claude/agents/qa.md` | 테스트 작성, 실행, 검증 |
| Auditor | `.claude/agents/auditor.md` | 정적 분석, 린트, 보안 스캔 |
| Skill Creator | `.claude/agents/skill-creator.md` | 스킬 생성, 평가, 개선, 패키징 |
| Cross Validator | `.claude/agents/cross-validator.md` | Gemini CLI 활용 교차검증 |
| Releaser | `.claude/agents/releaser.md` | 릴리스 생성, 버전 관리, CHANGELOG |

---

## 전역 규칙

### 브랜치 전략
- `main`: 안정 브랜치, 직접 푸시 금지
- `develop`: 통합 브랜치, PR을 통해서만 머지
- `feature/<이슈번호>-<설명>`: 기능 브랜치
- `fix/<이슈번호>-<설명>`: 버그 수정 브랜치

### 커밋 컨벤션
```
<type>(<scope>): <description>

[body]

[footer]
```
- type: feat, fix, refactor, test, docs, chore
- scope: 변경 대상 모듈/컴포넌트
- description: 변경 사항 요약 (한국어 가능)

### PR 규칙
- 모든 PR은 최소 1명의 리뷰어 승인 필요
- QA 에이전트의 테스트 통과 필수
- PR 제목은 이슈 번호를 포함: `[#이슈번호] 설명`
- PR 본문에 변경 사항, 테스트 계획, 영향 범위 명시

### 이슈 라벨
- `agent:pm`, `agent:architect`, `agent:developer`, `agent:reviewer`, `agent:qa`
- `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- `status:todo`, `status:in-progress`, `status:review`, `status:done`
- `type:feature`, `type:bug`, `type:refactor`, `type:infra`

### 에이전트 간 통신 규칙
1. **기본**: GitHub Issues/PR 코멘트를 통해 소통
2. **폴백**: 오케스트레이터가 `.harness/state.json`을 통해 상태 동기화
3. **긴급**: 오케스트레이터가 직접 에이전트를 호출하여 조율

### 금지 사항
- main 브랜치 직접 수정 금지
- 다른 에이전트의 활성 브랜치에 직접 푸시 금지
- 리뷰 없이 머지 금지
- 테스트 없이 PR 생성 금지
