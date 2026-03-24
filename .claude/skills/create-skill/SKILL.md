---
name: create-skill
description: |
  새로운 Claude Code 스킬을 생성, 테스트, 개선하는 스킬.
  TRIGGER when: 새 스킬을 만들어야 할 때, "스킬 만들어", "스킬 생성", "skill 추가",
  기존 스킬을 개선하거나 평가할 때, 스킬의 description을 최적화할 때,
  "스킬 검증", "스킬 테스트", 에이전트용 도구를 추가할 때.
  DO NOT TRIGGER when: 기존 스킬을 단순 실행할 때, 에이전트 정의(.claude/agents/)를 수정할 때.
---

# 스킬 생성

Anthropic skill-creator 워크플로우 기반으로 새 스킬을 생성하고 검증한다.

## 1단계: 인텐트 캡처

스킬을 만들기 전에 아래 항목을 먼저 정의한다.

```
스킬 이름: (kebab-case)
목적: (한 문장)
트리거 상황: (이 스킬이 활성화되어야 하는 구체적 상황들)
비트리거 상황: (이 스킬이 활성화되면 안 되는 상황들)
입력: (스킬이 받는 입력)
출력: (스킬이 생산하는 결과물)
필요 도구: (Bash, Read, Write 등)
```

사용자에게 질문하여 불명확한 항목을 명확히 한다. 추측하지 않는다.

## 2단계: 워크스페이스 초기화

```bash
SKILL_NAME="<스킬-이름>"
mkdir -p ".claude/skills/${SKILL_NAME}"/{evals,scripts,references,agents}
```

## 3단계: SKILL.md 작성

아래 템플릿으로 작성한다:

```yaml
---
name: <skill-name>
description: |
  <스킬이 하는 일에 대한 한 줄 설명.>
  TRIGGER when: <구체적 트리거 상황 나열>
  DO NOT TRIGGER when: <비트리거 상황 나열>
---
```

### 본문 작성 규칙

- **500줄 이하**. 초과 시 `references/` 로 분리
- **명령형 문체** 사용 ("~한다", "~실행한다")
- **왜(why)** 중심 설명 — ALWAYS/NEVER 대문자 남용 금지
- 절차가 있으면 **번호 매기기**
- 명령어가 있으면 **실행 가능한 코드 블록**
- 출력 형식이 있으면 **정확한 템플릿**

### description 작성 핵심

description은 스킬 트리거의 **유일한 메커니즘**이다.
Claude는 과소 트리거(undertrigger) 경향이 있으므로:

- 가능한 **구체적 키워드**를 나열한다 (파일 확장자, 명령어, 동사 등)
- **동의어**를 포함한다 ("만들어", "생성", "추가")
- **약간 적극적(pushy)**으로 작성한다
- TRIGGER / DO NOT TRIGGER 를 명시하여 경계를 분명히 한다

## 4단계: 평가 셋 작성

`evals/evals.json` 에 테스트 케이스를 작성한다:

```json
{
  "skill_name": "<skill-name>",
  "evals": [
    {
      "id": "positive-1",
      "prompt": "트리거해야 하는 사용자 입력",
      "should_trigger": true,
      "expectations": [
        "기대하는 동작 1",
        "기대하는 동작 2"
      ]
    },
    {
      "id": "negative-1",
      "prompt": "트리거하지 말아야 하는 사용자 입력",
      "should_trigger": false,
      "expectations": [
        "이 스킬이 호출되지 않아야 함"
      ]
    }
  ]
}
```

### 평가 셋 기준
- 양성(should_trigger=true) 최소 3개
- 음성(should_trigger=false) 최소 2개
- 경계 케이스(애매한 상황) 1개 이상
- expectations는 검증 가능한 형태로 작성

## 5단계: 검증

```bash
# frontmatter 형식 검증
python3 .claude/skills/create-skill/scripts/quick_validate.py ".claude/skills/${SKILL_NAME}/SKILL.md"

# 트리거 정확도 평가 (선택 — claude CLI 필요)
python3 .claude/skills/create-skill/scripts/run_eval.py ".claude/skills/${SKILL_NAME}"
```

## 6단계: 반복 개선

평가 결과에서 실패한 케이스를 분석한다:

1. **과소 트리거**: description에 누락된 키워드/상황 추가
2. **과다 트리거**: DO NOT TRIGGER 조건 강화, 경계 명확화
3. **기대 불충족**: 본문의 절차/규칙 보완

최대 3회 반복한다. 반복마다:
- description 수정 → 재평가
- 본문 수정 → 재평가
- 평가 셋 보완 (새로운 엣지 케이스 발견 시)

## 7단계: 통합

1. 스킬 디렉토리가 완성되면 CLAUDE.md 에 반영 여부 확인
2. 관련 에이전트의 "사용 스킬" 목록에 추가
3. dispatch-agent.sh 에 필요한 경우 케이스 추가

## 기존 스킬 확인

새 스킬 생성 전, 기존 스킬과 중복되지 않는지 확인한다:

```bash
ls .claude/skills/
# 각 스킬의 description 확인
for skill_dir in .claude/skills/*/; do
  echo "=== $(basename "${skill_dir}") ==="
  head -10 "${skill_dir}/SKILL.md"
  echo ""
done
```

## 규칙

- 하나의 스킬은 하나의 명확한 책임을 가진다. 범위가 넓으면 분리한다.
- 평가 셋 없이 스킬을 "완성"으로 간주하지 않는다.
- 300줄 이상의 참조 자료는 `references/`로 분리하고 목차를 포함한다.
- 반복적/결정론적 작업은 `scripts/`로 분리한다.
- 기존 프레임워크 컨벤션(라벨, 브랜치, 커밋)을 준수하는 스킬을 생성한다.
