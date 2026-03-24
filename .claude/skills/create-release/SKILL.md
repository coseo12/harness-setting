---
name: create-release
description: |
  Semantic Versioning 기반 릴리스를 생성하는 스킬.
  TRIGGER when: 릴리스 생성, "릴리스", "release", "배포", "버전 올려",
  "태그 생성", CHANGELOG 갱신, main 브랜치 머지 후 버전 관리.
  DO NOT TRIGGER when: 개발 중인 feature 브랜치 작업, PR 생성.
---

# 릴리스 생성

Semantic Versioning 규칙에 따라 버전을 결정하고, CHANGELOG를 갱신하고, GitHub Release를 생성한다.

## 버전 결정 규칙

최근 릴리스 이후 머지된 PR 라벨을 분석한다:

| PR 라벨 | 버전 변경 | 예시 |
|---------|-----------|------|
| `type:feature` | **Minor** (0.X.0) | 새 기능 추가 |
| `type:bug` | **Patch** (0.0.X) | 버그 수정 |
| `type:refactor` | **Patch** (0.0.X) | 리팩토링 |
| `type:infra` | **Patch** (0.0.X) | 인프라 변경 |
| `priority:critical` + `type:feature` | **Major** (X.0.0) | 브레이킹 체인지 |

## 절차

### 1. 현재 버전 확인
```bash
# 최신 태그에서 현재 버전 추출
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
```

### 2. 변경 사항 수집
```bash
# 최근 릴리스 이후 머지된 PR 목록
gh pr list --state merged --base main --search "merged:>${LAST_RELEASE_DATE}" \
  --json number,title,labels
```

### 3. 버전 결정
PR 라벨 기반으로 Major/Minor/Patch 결정.

### 4. CHANGELOG 갱신
```markdown
# Changelog

## [vX.Y.Z] - YYYY-MM-DD

### 추가
- [#이슈] 기능 설명 (#PR)

### 수정
- [#이슈] 버그 설명 (#PR)

### 변경
- [#이슈] 변경 설명 (#PR)
```

### 5. 릴리스 생성
```bash
NEW_VERSION="vX.Y.Z"

# 태그 생성
git tag -a "${NEW_VERSION}" -m "Release ${NEW_VERSION}"
git push origin "${NEW_VERSION}"

# GitHub Release 생성
gh release create "${NEW_VERSION}" \
  --title "${NEW_VERSION}" \
  --notes-file CHANGELOG_LATEST.md
```

## 규칙

- 릴리스는 main 브랜치에서만 생성한다.
- CHANGELOG는 자동 생성 후 사용자 검토를 받는다.
- 브레이킹 체인지가 있으면 반드시 Major 버전을 올린다.
