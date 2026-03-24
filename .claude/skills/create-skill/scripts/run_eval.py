#!/usr/bin/env python3
"""스킬 트리거 정확도 평가 스크립트.

claude CLI를 사용하여 각 eval 케이스에 대해
스킬이 올바르게 트리거되는지 평가한다.
"""

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def load_evals(skill_dir: str) -> dict:
    """evals/evals.json을 로드한다."""
    evals_path = Path(skill_dir) / "evals" / "evals.json"
    if not evals_path.exists():
        print(f"에러: {evals_path}가 존재하지 않음")
        sys.exit(1)

    with open(evals_path, encoding="utf-8") as f:
        return json.load(f)


def load_skill_description(skill_dir: str) -> str:
    """SKILL.md에서 description을 추출한다."""
    import re

    skill_path = Path(skill_dir) / "SKILL.md"
    content = skill_path.read_text(encoding="utf-8")

    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return ""

    # description 추출 (간이 파싱)
    desc_match = re.search(
        r"description:\s*\|?\s*\n((?:\s{2,}.*\n)*)", match.group(1)
    )
    if desc_match:
        return desc_match.group(1).strip()

    desc_match = re.search(r"description:\s*(.+)", match.group(1))
    return desc_match.group(1).strip() if desc_match else ""


def run_single_eval(
    eval_case: dict, skill_name: str, skill_description: str
) -> dict:
    """단일 eval 케이스를 실행한다."""
    prompt = eval_case["prompt"]
    should_trigger = eval_case["should_trigger"]

    # claude에게 description을 보고 트리거 여부를 판단하도록 요청
    check_prompt = f"""다음 스킬 description을 읽고, 아래 사용자 입력이 이 스킬을 트리거해야 하는지 판단해줘.

스킬 이름: {skill_name}
스킬 description:
{skill_description}

사용자 입력: "{prompt}"

JSON으로만 답변해줘:
{{"should_trigger": true/false, "reasoning": "판단 근거"}}"""

    try:
        result = subprocess.run(
            ["claude", "-p", check_prompt],
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout.strip()

        # JSON 추출
        json_match = None
        # 코드 블록 안에 있을 수 있음
        import re

        code_block = re.search(r"```(?:json)?\s*\n(.*?)\n```", output, re.DOTALL)
        if code_block:
            json_match = code_block.group(1)
        else:
            # 직접 JSON 찾기
            json_match_re = re.search(r"\{.*\}", output, re.DOTALL)
            if json_match_re:
                json_match = json_match_re.group(0)

        if json_match:
            parsed = json.loads(json_match)
            predicted_trigger = parsed.get("should_trigger", False)
            reasoning = parsed.get("reasoning", "")

            correct = predicted_trigger == should_trigger

            return {
                "eval_id": eval_case["id"],
                "correct": correct,
                "expected_trigger": should_trigger,
                "predicted_trigger": predicted_trigger,
                "reasoning": reasoning,
            }

    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
        return {
            "eval_id": eval_case["id"],
            "correct": False,
            "expected_trigger": should_trigger,
            "predicted_trigger": None,
            "reasoning": f"실행 에러: {e}",
        }

    return {
        "eval_id": eval_case["id"],
        "correct": False,
        "expected_trigger": should_trigger,
        "predicted_trigger": None,
        "reasoning": "응답 파싱 실패",
    }


def run_evals(skill_dir: str) -> None:
    """전체 평가를 실행한다."""
    evals_data = load_evals(skill_dir)
    skill_name = evals_data["skill_name"]
    description = load_skill_description(skill_dir)

    if not description:
        print("에러: SKILL.md에서 description을 추출할 수 없음")
        sys.exit(1)

    evals = evals_data["evals"]
    results = []

    print(f"\n=== 스킬 평가: {skill_name} ===")
    print(f"평가 케이스: {len(evals)}개\n")

    for i, eval_case in enumerate(evals, 1):
        print(
            f"[{i}/{len(evals)}] {eval_case['id']} "
            f"(should_trigger={eval_case['should_trigger']})...",
            end=" ",
            flush=True,
        )
        result = run_single_eval(eval_case, skill_name, description)
        results.append(result)
        status = "PASS" if result["correct"] else "FAIL"
        print(status)

    # 결과 집계
    total = len(results)
    correct = sum(1 for r in results if r["correct"])
    positive = [r for r in results if r["expected_trigger"]]
    negative = [r for r in results if not r["expected_trigger"]]
    pos_correct = sum(1 for r in positive if r["correct"])
    neg_correct = sum(1 for r in negative if r["correct"])

    print(f"\n=== 결과 ===")
    print(f"전체 정확도: {correct}/{total} ({correct / total * 100:.0f}%)")
    if positive:
        print(
            f"양성 정확도: {pos_correct}/{len(positive)} "
            f"({pos_correct / len(positive) * 100:.0f}%)"
        )
    if negative:
        print(
            f"음성 정확도: {neg_correct}/{len(negative)} "
            f"({neg_correct / len(negative) * 100:.0f}%)"
        )

    # 실패 케이스 상세
    failures = [r for r in results if not r["correct"]]
    if failures:
        print(f"\n실패 케이스:")
        for f in failures:
            print(f"  - {f['eval_id']}: {f['reasoning']}")

    # 결과 저장
    output_path = Path(skill_dir) / "evals" / "results.json"
    output_data = {
        "skill_name": skill_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "accuracy": correct / total if total > 0 else 0,
            "positive_rate": (
                pos_correct / len(positive) if positive else 0
            ),
            "negative_rate": (
                neg_correct / len(negative) if negative else 0
            ),
        },
        "results": results,
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: {output_path}")


def main():
    if len(sys.argv) < 2:
        print("사용법: python3 run_eval.py <스킬 디렉토리>")
        print("  예: python3 run_eval.py .claude/skills/create-issue")
        sys.exit(1)

    run_evals(sys.argv[1])


if __name__ == "__main__":
    main()
