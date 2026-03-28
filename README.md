# Claude Code 워크플로우 템플릿

1인 개발자-AI 페어 프로그래밍에 최적화된 Claude Code 워크플로우 템플릿.
실전 프로젝트(portfolio-26, simple-shop 등) 경험에서 추출한 규칙과 교훈을 포함한다.

## 구조

```
CLAUDE.md                          # 워크플로우 규칙 + 실전 교훈
.claude/
  agents/
    developer.md                   # 풀스택 구현 에이전트
  skills/
    cross-validate/                # Gemini CLI 교차검증
    browser-test/                  # agent-browser 기반 E2E/시각적 검증
    create-issue/                  # GitHub 이슈 생성
    create-pr/                     # GitHub PR 생성
    run-tests/                     # 테스트 자동 감지 및 실행
```

## 워크플로우

```
사용자 → Developer → 검증(CI + browser-test) → PR → Merge
                       ↑
              cross-validate (선택, Gemini 교차검증)
```

## 시작하기

### 방법 1. npx 설치 (파일 복사)

```bash
npx @seo/harness-setting init ./my-project
```

### 방법 2. 플러그인으로 사용 (파일 복사 없이)

```bash
git clone https://github.com/coseo12/harness-setting.git .harness-plugin
claude --plugin-dir ./.harness-plugin
```

## 사전 요구사항

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub CLI (gh)](https://cli.github.com/)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (교차검증용, 선택)
- [agent-browser](https://github.com/vercel-labs/agent-browser) (브라우저 테스트용, 선택)

## 핵심 가치

이 템플릿이 제공하는 것:

1. **실전 교훈 기반 규칙** — "빌드 성공 ≠ 동작하는 앱", "HTTP 200 ≠ 올바른 리소스" 등
2. **스프린트 계약** — 구현 전 검증 가능한 완료 기준 합의 ([Anthropic 하네스 설계](docs/anthropic-harness-design.md) 기반)
3. **교차검증** — Gemini의 독립적 시각으로 설계/코드 의사결정 검증
4. **3단계 브라우저 검증** — 정적 → 인터랙션 → 흐름 (display-only 버그 방지)
5. **디자인 품질 루브릭** — Design Quality / Originality / Craft / Functionality 4축 평가
6. **자가 평가 경고** — AI의 과도한 긍정 평가 편향 방지

## 커스터마이징

- **규칙 수정**: `CLAUDE.md` 편집
- **에이전트 수정**: `.claude/agents/developer.md` 편집
- **스킬 추가**: `.claude/skills/<스킬명>/SKILL.md` 형식으로 추가

> 플러그인 방식 사용 시: 프로젝트 `.claude/agents/`에 동일 이름 파일을 생성하면 플러그인 에이전트를 오버라이드할 수 있다.
