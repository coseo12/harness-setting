# 스킬 스키마 참조

## 목차
1. [SKILL.md frontmatter](#skillmd-frontmatter)
2. [evals.json](#evalsjson)
3. [grading.json](#gradingjson)
4. [benchmark.json](#benchmarkjson)

---

## SKILL.md frontmatter

```yaml
---
name: string          # 필수. kebab-case. 디렉토리명과 동일
description: string   # 필수. 트리거 메커니즘. 멀티라인 가능 (|)
---
```

### name 규칙
- kebab-case (예: `create-issue`, `run-tests`)
- 영문 소문자 + 하이픈만 사용
- 동사-명사 형태 권장 (예: `review-pr`, `sync-status`)

### description 규칙
- 첫 문장: 스킬이 하는 일 한 줄 설명
- `TRIGGER when:` 블록: 트리거해야 하는 구체적 상황
- `DO NOT TRIGGER when:` 블록: 트리거하면 안 되는 상황
- 동의어, 키워드, 파일 확장자 등 구체적 매칭 조건 나열
- ~100단어 이내 권장 (메타데이터로 항상 로드됨)

---

## evals.json

스킬의 트리거 정확도와 품질을 평가하기 위한 테스트 케이스.

```json
{
  "skill_name": "string",
  "evals": [
    {
      "id": "string",
      "prompt": "string",
      "should_trigger": "boolean",
      "expectations": ["string"],
      "tags": ["string"]
    }
  ]
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `skill_name` | string | Y | 대상 스킬 이름 |
| `evals[].id` | string | Y | 고유 식별자 (예: positive-1, negative-1, edge-1) |
| `evals[].prompt` | string | Y | 사용자 입력 시뮬레이션 |
| `evals[].should_trigger` | boolean | Y | 이 프롬프트에서 스킬이 트리거되어야 하는지 |
| `evals[].expectations` | string[] | Y | 기대하는 동작/결과 목록 |
| `evals[].tags` | string[] | N | 분류 태그 (예: "trigger", "quality", "edge-case") |

### 최소 요구사항
- 양성 케이스 (should_trigger=true): 3개 이상
- 음성 케이스 (should_trigger=false): 2개 이상
- 경계 케이스: 1개 이상

---

## grading.json

grader 서브에이전트의 채점 결과.

```json
{
  "eval_id": "string",
  "skill_name": "string",
  "timestamp": "ISO-8601",
  "results": [
    {
      "expectation": "string",
      "grade": "pass | fail | partial",
      "reasoning": "string"
    }
  ],
  "overall": "pass | fail | partial",
  "notes": "string"
}
```

---

## benchmark.json

반복 개선 과정의 정량적 비교 데이터.

```json
{
  "skill_name": "string",
  "runs": [
    {
      "run_id": "string",
      "timestamp": "ISO-8601",
      "description_version": "number",
      "metrics": {
        "trigger_accuracy": {
          "positive_rate": "number (0-1)",
          "negative_rate": "number (0-1)"
        },
        "quality_score": "number (0-1)",
        "pass_rate": "number (0-1)"
      }
    }
  ],
  "best_run": "string"
}
```
