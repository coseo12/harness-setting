# Harness Engineering Framework

## 개요
이 저장소는 AI 에이전트 기반 자동화 개발 프레임워크의 템플릿이다.
새 프로젝트 시작 시 이 템플릿을 복사하여 사용한다.

---

## 에이전트 역할 체계

| 역할 | 파일 | 책임 |
|------|------|------|
| Orchestrator | `.claude/agents/orchestrator.md` | 전체 워크플로우 조율, 에이전트 간 동기화, 교착 감지 |
| Planner | `.claude/agents/planner.md` | 주제/스펙 → 기획서 작성, 요구사항 보충 |
| PM | `.claude/agents/pm.md` | 요구사항 분석, 이슈 분해, 우선순위 결정 |
| Architect | `.claude/agents/architect.md` | 기술 설계, 구조 결정, 인터페이스 정의, 테스트 시나리오 |
| Frontend Developer | `.claude/agents/frontend-developer.md` | UI 구현, 컴포넌트, 스타일, 접근성 |
| Backend Developer | `.claude/agents/backend-developer.md` | API 구현, DB, 비즈니스 로직, 인프라 |
| Developer (Fullstack) | `.claude/agents/developer.md` | 풀스택 구현 (scope:fullstack 이슈) |
| Evaluator | `.claude/agents/evaluator.md` | 정적 분석 + 코드 리뷰 + 품질 검증, 승인/반려 |
| QA | `.claude/agents/qa.md` | 테스트 작성, 실행, E2E 듀얼 뷰포트 검증 |

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
- `agent:planner`, `agent:pm`, `agent:architect`, `agent:frontend-developer`, `agent:backend-developer`, `agent:developer`, `agent:evaluator`, `agent:qa`
- `scope:frontend`, `scope:backend`, `scope:fullstack`
- `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- `size:s`, `size:m`, `size:l`, `size:xl`
- `status:todo`, `status:in-progress`, `status:evaluating`, `status:qa`, `status:done`, `status:blocked`, `status:stalled`, `status:agent-failed`
- `needs:re-review`
- `type:feature`, `type:bug`, `type:refactor`, `type:infra`

### 파이프라인
```
Planner → PM → Architect(설계+테스트시나리오) → Developer(적응형) → Evaluator(정적분석+코드리뷰) → QA(+E2E듀얼뷰포트) → Merge
```

### 적응형 파이프라인 (이슈 크기별)
| 이슈 크기 | 개발 에이전트 | 파이프라인 |
|----------|------------|----------|
| `size:s` | Developer (Fullstack) | Architect → Developer → Evaluator → Merge |
| `size:m` | Developer (Fullstack) | PM → Architect → Developer → Evaluator → QA → Merge |
| `size:l` | FE Dev + BE Dev (병렬) | 전체 파이프라인 |
| `size:xl` | FE Dev + BE Dev (병렬) | 전체 파이프라인 + Cross Validate 스킬 |

### 테스트 전략: Specification-Driven Testing
- **Architect**: 설계 문서에 테스트 시나리오 목록(자연어)을 포함한다
- **Developer**: 시나리오를 테스트 코드로 변환 → 구현 → 통과 (테스트 우선)
- **Evaluator**: 테스트 과적합(하드코딩/편법) 검증 + Architect 시나리오 대비 테스트 충분성 확인
- **QA**: 모바일(480px) + 데스크톱(1200px) E2E 필수

### 검증 전략: 하이브리드 (SSR + CSR)

UI 프로젝트의 검증은 두 계층으로 나누어 수행한다:

| 계층 | 도구 | 대상 | 단계 |
|------|------|------|------|
| **SSR 검증** | curl + grep | SEO 메타태그, 서버 렌더링 데이터, API 응답 | Evaluator |
| **CSR 검증** | Playwright | 클라이언트 렌더링 콘텐츠, CSS 스타일, 이미지 로드, 반응형 | QA |

- curl은 "존재 여부", Playwright는 "동작 여부"를 검증한다
- `"use client"` 컴포넌트의 내용은 SSR HTML에 포함되지 않으므로 Playwright로만 확인 가능
- CSS 변수(`var(--color-*)`)로 적용된 디자인 토큰은 `getComputedStyle`로 검증
- SSR HTML에서 "404" 검색 시 Next.js RSC payload의 fallback 데이터를 제외할 것

### 에이전트 간 통신 규칙
1. **기본**: GitHub Issues/PR 코멘트를 통해 소통
2. **폴백**: 오케스트레이터가 `.harness/state.json`을 통해 상태 동기화
3. **긴급**: 오케스트레이터가 직접 에이전트를 호출하여 조율

### 원칙 우선순위

```
사용자 명시적 지시 > 프레임워크 기본 원칙
```

- 사용자가 "레퍼런스 기반으로 변경하라"고 지시하면 프레임워크의 "기존 코드 보존" 원칙보다 사용자 지시가 우선한다
- **예외**: 보안 취약점, 데이터 손실, 핵심 기능 마비가 예상될 때만 프레임워크 원칙이 우선 (거부가 아닌 경고 후 사용자 확인)

### 모호한 지시 대응 원칙

"리뉴얼", "개선", "수정" 등 범위가 넓은 지시를 받으면 **작업 전에 해석한 범위를 사용자에게 제시하고 확인**받는다.

```
모호한 지시 수신 → 범위 해석 → 사용자에게 제시 → 확인 후 작업
```

- "리뉴얼" ≠ "색상만 변경". 레퍼런스가 있으면 **레이아웃 구조 변경** 포함으로 해석
- **보수적 해석 편향 금지**: "최소한의 변경"이 기본값이 아님
- **기존 코드 보존 관성 금지**: 기존 코드를 패치하는 것보다 처음부터 재구축이 나은 경우를 판단
- 확신이 없으면 3번 재작업하는 것보다 **1번 질문**하는 것이 낫다
- 서브에이전트에게 위임 시에도 동일 원칙 적용: 변경 허용/금지 범위를 명시적으로 분리

### "수정 금지" 범위의 동적 결정

| 요청 유형 | 변경 허용 | 변경 금지 |
|----------|----------|----------|
| UI 리뉴얼/레퍼런스 | 레이아웃, 컴포넌트 구조, UX 흐름, CSS | 백엔드 API 계약, DB 스키마, 서버 로직 |
| 기능 추가 | 새 코드 추가, 인터페이스 확장 | 기존 기능 핵심 로직 |
| 버그 수정 | 버그 코드 블록만 | 무관한 영역 전체 |

- 서브에이전트에게 작업을 위임할 때 "변경 허용 범위"와 "변경 금지 범위"를 **명시적으로 분리**하여 전달한다
- "기존 로직 수정 금지"라는 포괄적 표현 대신 구체적으로 어떤 파일/로직을 보존할지 나열한다

### 금지 사항
- main 브랜치 직접 수정 금지
- 다른 에이전트의 활성 브랜치에 직접 푸시 금지
- 리뷰 없이 머지 금지
- 테스트 없이 PR 생성 금지
