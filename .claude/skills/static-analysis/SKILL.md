---
name: static-analysis
description: |
  코드의 정적 분석, 린트, 보안 스캔을 자동 실행하는 스킬.
  TRIGGER when: PR 생성 후 리뷰 전 품질 검증, "린트", "lint", "정적 분석",
  "보안 스캔", "코드 품질", Auditor 에이전트 작업, CI 품질 게이트.
  DO NOT TRIGGER when: 테스트 실행(QA 담당), 코드 리뷰(Reviewer 담당).
---

# 정적 분석

코드 변경 사항에 대해 린트, 보안 스캔, 복잡도 분석을 자동 실행한다.
범용 프레임워크이므로 프로젝트의 도구를 자동 감지한다.

## 도구 자동 감지

| 감지 파일 | 린트 명령 | 보안 스캔 |
|-----------|-----------|-----------|
| `package.json` | `npm run lint` 또는 `npx eslint .` | `npm audit` |
| `pyproject.toml` / `setup.py` | `flake8` 또는 `ruff check .` | `pip audit` 또는 `safety check` |
| `go.mod` | `golangci-lint run` | `govulncheck ./...` |
| `Cargo.toml` | `cargo clippy` | `cargo audit` |
| `Makefile` (lint 타겟) | `make lint` | - |

## 실행 순서

### 1. 린트/포매팅 검사
```bash
# 프로젝트 감지 후 해당 명령 실행
# 자동 수정 가능하면 --fix 적용 후 커밋
```

### 2. 시크릿 검출
```bash
# gitleaks 사용 가능 시
gitleaks detect --source . --no-banner

# 없으면 패턴 기반 수동 검색
grep -rn "(?i)(api_key|secret|password|token)\s*=\s*['\"]" --include="*.{py,js,ts,go,rs,java}" .
```

### 3. 의존성 취약점
```bash
# 감지된 패키지 매니저에 따라 실행
# npm audit / pip audit / cargo audit / govulncheck
```

### 4. 코드 복잡도 (선택)
순환 복잡도 > 15인 함수를 경고로 보고한다.

## 결과 보고 형식

```markdown
## 정적 분석 결과

### 린트
- **상태**: 통과/실패
- 에러: N건, 경고: N건
- [실패 시 상세 목록]

### 보안
- **시크릿 검출**: 없음/발견 (블로커)
- **의존성 취약점**: N건 (심각도별 분류)

### 결론
- **블로커**: [있음/없음]
- **권장 수정**: [목록]
```

## 블로커 기준

아래 항목은 반드시 수정해야 한다 (리뷰 진행 차단):
- 시크릿/API 키 하드코딩
- 심각(Critical/High) 의존성 취약점
- 컴파일 에러 수준의 린트 에러

아래 항목은 경고로 보고하되 블로커 아님:
- 스타일 경고
- 중간/낮음 취약점
- 복잡도 경고

## 규칙

- 블로커 발견 시 PR 라벨을 `status:in-progress`로 되돌린다.
- 린트 자동 수정 적용 시 별도 커밋으로 분리: `chore: lint 자동 수정`
- 도구가 설치되어 있지 않으면 해당 항목을 건너뛰고 보고한다.
