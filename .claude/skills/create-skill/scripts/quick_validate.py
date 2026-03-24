#!/usr/bin/env python3
"""SKILL.md frontmatter 유효성 검증 스크립트."""

import re
import sys
from pathlib import Path


def parse_frontmatter(content: str):
    """YAML frontmatter를 파싱한다."""
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not match:
        return None

    frontmatter = {}
    current_key = None
    current_value_lines = []

    for line in match.group(1).split("\n"):
        # 새 키 시작
        key_match = re.match(r"^(\w+):\s*(.*)", line)
        if key_match:
            # 이전 키 저장
            if current_key:
                frontmatter[current_key] = "\n".join(current_value_lines).strip()
            current_key = key_match.group(1)
            value = key_match.group(2)
            # 멀티라인 (|) 처리
            if value == "|":
                current_value_lines = []
            else:
                current_value_lines = [value]
        elif current_key and line.startswith("  "):
            current_value_lines.append(line.strip())

    # 마지막 키 저장
    if current_key:
        frontmatter[current_key] = "\n".join(current_value_lines).strip()

    return frontmatter


def validate(skill_path: str):
    """SKILL.md를 검증하고 문제 목록을 반환한다."""
    path = Path(skill_path)
    errors = []
    warnings = []

    # 파일 존재 확인
    if not path.exists():
        return [f"에러: 파일이 존재하지 않음: {path}"]

    content = path.read_text(encoding="utf-8")
    lines = content.split("\n")

    # 1. frontmatter 존재 확인
    frontmatter = parse_frontmatter(content)
    if frontmatter is None:
        errors.append("에러: YAML frontmatter가 없음 (--- 로 시작/종료)")
        return errors

    # 2. name 필드 확인
    name = frontmatter.get("name", "")
    if not name:
        errors.append("에러: 'name' 필드가 없음")
    elif not re.match(r"^[a-z][a-z0-9-]*$", name):
        errors.append(f"에러: name이 kebab-case가 아님: '{name}'")

    # 디렉토리명과 일치하는지 확인
    parent_dir = path.parent.name
    if name and name != parent_dir:
        warnings.append(f"경고: name '{name}'이 디렉토리명 '{parent_dir}'과 불일치")

    # 3. description 필드 확인
    desc = frontmatter.get("description", "")
    if not desc:
        errors.append("에러: 'description' 필드가 없음")
    else:
        desc_words = len(desc.split())
        if desc_words < 10:
            warnings.append(f"경고: description이 너무 짧음 ({desc_words}단어). 트리거 조건을 명시해야 함")
        if "TRIGGER when" not in desc and "TRIGGER" not in desc:
            warnings.append("경고: description에 'TRIGGER when' 패턴이 없음")
        if "DO NOT TRIGGER" not in desc:
            warnings.append("경고: description에 'DO NOT TRIGGER when' 패턴이 없음")

    # 4. 본문 줄 수 확인
    # frontmatter 이후의 본문
    body_match = re.search(r"^---\s*\n.*?\n---\s*\n(.*)$", content, re.DOTALL)
    if body_match:
        body_lines = body_match.group(1).split("\n")
        body_line_count = len(body_lines)
        if body_line_count > 500:
            warnings.append(
                f"경고: 본문이 {body_line_count}줄. 500줄 이하 권장. "
                "references/로 분리를 고려"
            )

    # 5. 전체 줄 수
    total_lines = len(lines)

    # 결과 출력
    print(f"\n=== SKILL.md 검증: {path} ===\n")
    print(f"  name: {name or '(없음)'}")
    print(f"  description: {desc[:80] + '...' if len(desc) > 80 else desc or '(없음)'}")
    print(f"  전체 줄 수: {total_lines}")

    if errors:
        print(f"\n  에러: {len(errors)}건")
        for e in errors:
            print(f"    - {e}")

    if warnings:
        print(f"\n  경고: {len(warnings)}건")
        for w in warnings:
            print(f"    - {w}")

    if not errors and not warnings:
        print("\n  결과: 모든 검증 통과")

    return errors


def main():
    if len(sys.argv) < 2:
        print("사용법: python3 quick_validate.py <SKILL.md 경로>")
        print("  예: python3 quick_validate.py .claude/skills/my-skill/SKILL.md")
        sys.exit(1)

    skill_path = sys.argv[1]
    errors = validate(skill_path)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
