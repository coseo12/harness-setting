# Harness Engineering Framework

## 개요
이 저장소는 AI 에이전트 기반 자동화 개발 프레임워크의 템플릿이다.
새 프로젝트 시작 시 이 템플릿을 복사하여 사용한다.

---

## 에이전트 역할 체계

| 역할 | 파일 | 책임 |
|------|------|------|
| Orchestrator | `.claude/agents/orchestrator.md` | 전체 워크플로우 조율, 에이전트 간 동기화 |
| Planner | `.claude/agents/planner.md` | 주제/스펙 → 기획서 작성, 요구사항 보충 |
| PM | `.claude/agents/pm.md` | 요구사항 분석, 이슈 분해, 우선순위 결정 |
| Architect | `.claude/agents/architect.md` | 기술 설계, 구조 결정, 인터페이스 정의 |
| Frontend Developer | `.claude/agents/frontend-developer.md` | UI 구현, 컴포넌트, 스타일, 접근성 |
| Backend Developer | `.claude/agents/backend-developer.md` | API 구현, DB, 비즈니스 로직, 인프라 |
| Developer (Fullstack) | `.claude/agents/developer.md` | 풀스택 구현 (scope:fullstack 이슈) |
| Reviewer | `.claude/agents/reviewer.md` | 코드 리뷰, 품질 검증, 승인/반려 |
| QA | `.claude/agents/qa.md` | 테스트 작성, 실행, 검증 |
| Auditor | `.claude/agents/auditor.md` | 정적 분석, 린트, 보안 스캔 |
| Skill Creator | `.claude/agents/skill-creator.md` | 스킬 생성, 평가, 개선, 패키징 |
| Cross Validator | `.claude/agents/cross-validator.md` | Gemini CLI 활용 교차검증 |
| Integrator | `.claude/agents/integrator.md` | 문서/설정 정합성 검증, 메타데이터 동기화 |
| DevOps | `.claude/agents/devops.md` | CI/CD 관리, 관측 가능성, 에러 복구, 보안 |
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
- `agent:planner`, `agent:pm`, `agent:architect`, `agent:frontend-developer`, `agent:backend-developer`, `agent:developer`, `agent:reviewer`, `agent:qa`, `agent:auditor`, `agent:skill-creator`, `agent:cross-validator`, `agent:integrator`, `agent:devops`, `agent:releaser`
- `scope:frontend`, `scope:backend`, `scope:fullstack`
- `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- `size:s`, `size:m`, `size:l`, `size:xl`
- `status:todo`, `status:in-progress`, `status:review`, `status:reviewing`, `status:audit-passed`, `status:qa`, `status:testing`, `status:qa-passed`, `status:done`, `status:blocked`, `status:stalled`, `status:agent-failed`
- `needs:re-review`
- `type:feature`, `type:bug`, `type:refactor`, `type:infra`

### 파이프라인
```
Planner → PM → Architect(설계+테스트시나리오) → FE Dev + BE Dev (시나리오→테스트→구현, 병렬) → Auditor(+과적합검증) → Reviewer(+테스트충분성) → QA(+E2E듀얼뷰포트) → Integrator → Merge
```

### 테스트 전략: Specification-Driven Testing
- **Architect**: 설계 문서에 테스트 시나리오 목록(자연어)을 포함한다
- **Developer**: 시나리오를 테스트 코드로 변환 → 구현 → 통과 (테스트 우선)
- **Auditor**: 테스트 과적합(하드코딩/편법) 검증
- **Reviewer**: Architect 시나리오 대비 테스트 충분성 확인
- **QA**: 모바일(480px) + 데스크톱(1200px) E2E 필수

### 에이전트 간 통신 규칙
1. **기본**: GitHub Issues/PR 코멘트를 통해 소통
2. **폴백**: 오케스트레이터가 `.harness/state.json`을 통해 상태 동기화
3. **긴급**: 오케스트레이터가 직접 에이전트를 호출하여 조율

### 금지 사항
- main 브랜치 직접 수정 금지
- 다른 에이전트의 활성 브랜치에 직접 푸시 금지
- 리뷰 없이 머지 금지
- 테스트 없이 PR 생성 금지
