---
name: generate-docs
description: |
  프로젝트 문서를 자동 생성하는 스킬.
  TRIGGER when: "문서 생성", "API 문서", "CHANGELOG", "README 갱신",
  "docs 업데이트", 릴리스 전 문서 정리, 설계 변경 후 문서 동기화.
  DO NOT TRIGGER when: 설계 문서 작성(Architect 담당), 코드 작성.
---

# 문서 생성

프로젝트의 문서를 자동으로 생성하고 갱신한다.

## 문서 유형

### 1. API 문서
프로젝트 기술 스택에 따라 자동 감지:

| 감지 파일 | 도구 |
|-----------|------|
| OpenAPI/Swagger spec | swagger-ui, redoc |
| JSDoc 주석 | jsdoc |
| Python docstring | sphinx, pdoc |
| Go doc 주석 | godoc |

### 2. CHANGELOG
최근 머지된 PR에서 자동 생성 (create-release 스킬과 연계).

### 3. README 갱신
프로젝트 구조 변경 시 README의 구조 섹션을 자동 갱신한다.

## 규칙

- 자동 생성된 문서에는 `<!-- 자동 생성 - 직접 수정 금지 -->` 마커를 포함한다.
- 문서 변경은 별도 커밋: `docs: <변경 설명>`
- 설계 문서와 충돌하지 않도록 Architect 산출물을 우선한다.
