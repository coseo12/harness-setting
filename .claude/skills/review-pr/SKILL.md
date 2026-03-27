---
name: review-pr
description: |
  GitHub PR을 리뷰하고 승인 또는 변경 요청을 수행하는 스킬.
  TRIGGER when: PR 리뷰가 필요할 때, "리뷰해줘", "PR 확인", "코드 리뷰",
  Evaluator 에이전트가 작업을 수행할 때, PR에 status:evaluating 라벨이 있을 때.
  DO NOT TRIGGER when: PR을 생성하거나 테스트만 실행할 때.
---

# PR 리뷰

PR의 변경 사항을 체크리스트 기반으로 리뷰하고, 승인 또는 변경 요청을 수행한다.

## 절차

1. PR 정보와 변경 내용을 파악한다.
2. 관련 설계 문서를 확인한다.
3. 체크리스트에 따라 검증한다.
4. 결과를 제출한다.

## PR 정보 수집

```bash
# PR 상세 정보
gh pr view <PR번호>

# 변경 파일 목록
gh pr diff <PR번호> --name-only

# 전체 diff
gh pr diff <PR번호>

# 기존 코멘트 확인
gh api repos/{owner}/{repo}/pulls/<PR번호>/comments
```

## 체크리스트

### 필수 — 하나라도 실패 시 변경 요청
- 이슈의 완료 조건 충족 여부
- 설계 문서 인터페이스 준수 여부
- 보안 취약점 (인젝션, XSS, 하드코딩된 시크릿, 경로 순회 등)
- 기존 테스트 깨짐 여부
- 새 기능에 대한 테스트 포함 여부

### 권장 — 코멘트로 제안, 블로커 아님
- 코드 가독성, 네이밍
- 중복 코드
- 에러 처리 적절성
- 성능 고려

## 리뷰 제출

```bash
# 승인
gh pr review <PR번호> --approve --body "$(cat <<'EOF'
## 리뷰 결과: 승인

### 확인 항목
- [x] 완료 조건 충족
- [x] 설계 인터페이스 준수
- [x] 보안 취약점 없음
- [x] 테스트 포함

LGTM
EOF
)"

# 라벨 전환: evaluating → qa
gh pr edit <PR번호> --remove-label "status:evaluating" --add-label "status:qa"
```

```bash
# 변경 요청
gh pr review <PR번호> --request-changes --body "$(cat <<'EOF'
## 리뷰 결과: 변경 요청

### 필수 수정
1. **파일:라인** — 설명
   제안: ...

### 제안 (선택)
1. **파일:라인** — 설명
EOF
)"

# 라벨 전환: evaluating → in-progress
gh issue edit <이슈번호> --remove-label "status:evaluating" --add-label "status:in-progress"
```

## 규칙

- 객관적 기준으로 리뷰한다. 개인 스타일 취향은 강요하지 않는다.
- 변경 요청 시 반드시 해결 방법을 함께 제안한다.
- PR 범위 밖의 개선 사항은 별도 이슈로 생성한다.
- 보안 취약점은 심각도와 관계없이 반드시 블로커로 처리한다.
