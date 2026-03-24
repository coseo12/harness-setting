#!/usr/bin/env python3
"""평가 결과를 기반으로 스킬 description을 개선하는 스크립트.

실패한 eval 케이스를 분석하여 description 개선안을 생성한다.
"""

import json
import re
import subprocess
import sys
from pathlib import Path


def load_skill_md(skill_dir: str) -> str:
    """SKILL.md 전체 내용을 로드한다."""
    path = Path(skill_dir) / "SKILL.md"
    return path.read_text(encoding="utf-8")


def load_results(skill_dir: str) -> dict:
    """evals/results.json을 로드한다."""
    path = Path(skill_dir) / "evals" / "results.json"
    if not path.exists():
        print("에러: evals/results.json이 없음. 먼저 run_eval.py를 실행하세요.")
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def improve(skill_dir: str) -> None:
    """description 개선을 실행한다."""
    skill_md = load_skill_md(skill_dir)
    results = load_results(skill_dir)

    failures = [r for r in results["results"] if not r["correct"]]

    if not failures:
        print("모든 eval이 통과했습니다. 개선이 필요하지 않습니다.")
        return

    # 실패 케이스 분석 프롬프트
    failure_details = json.dumps(failures, ensure_ascii=False, indent=2)

    prompt = f"""아래 스킬의 description을 개선해야 한다.

현재 SKILL.md:
```
{skill_md[:2000]}
```

실패한 eval 케이스:
```json
{failure_details}
```

실패 원인을 분석하고, description 부분만 개선해줘.

규칙:
- TRIGGER when / DO NOT TRIGGER when 패턴을 유지한다
- 과소 트리거가 원인이면 누락된 키워드/상황을 추가한다
- 과다 트리거가 원인이면 DO NOT TRIGGER 조건을 강화한다
- description은 ~100단어 이내로 유지한다

개선된 description만 YAML frontmatter 형식으로 출력해줘:
```yaml
description: |
  ...
```"""

    print("Claude에게 개선 요청 중...")
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True,
        text=True,
        timeout=60,
    )

    output = result.stdout.strip()
    print("\n=== 개선 제안 ===\n")
    print(output)

    # description 추출
    desc_match = re.search(
        r"```yaml\s*\n(description:.*?)```", output, re.DOTALL
    )
    if desc_match:
        new_desc = desc_match.group(1).strip()
        print(f"\n추출된 description:\n{new_desc}")
        print("\nSKILL.md에 적용하려면 수동으로 교체하세요.")
        print("적용 후 run_eval.py를 다시 실행하여 개선 효과를 확인하세요.")


def main():
    if len(sys.argv) < 2:
        print("사용법: python3 improve_description.py <스킬 디렉토리>")
        sys.exit(1)

    improve(sys.argv[1])


if __name__ == "__main__":
    main()
