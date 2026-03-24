---
name: run-tests
description: |
  프로젝트의 테스트를 자동 감지하고 실행하는 스킬. 범용 — 특정 언어/프레임워크에 비종속.
  TRIGGER when: 테스트를 실행해야 할 때, "테스트 돌려", "테스트 실행", "test 해줘",
  PR 생성 전 검증, QA 에이전트 작업, CI 실패 디버깅.
  DO NOT TRIGGER when: 테스트를 작성만 하고 실행하지 않을 때.
---

# 테스트 실행

프로젝트의 테스트 도구를 자동 감지하고 테스트를 실행한다.
범용 프레임워크이므로 특정 기술 스택에 의존하지 않는다.

## 감지 순서

아래 순서로 프로젝트의 테스트 환경을 감지한다. 첫 번째로 매칭되는 것을 사용한다.

| 감지 파일 | 실행 명령 |
|-----------|-----------|
| `package.json` (scripts.test 존재) | `npm test` 또는 `yarn test` |
| `Makefile` (test 타겟 존재) | `make test` |
| `pyproject.toml` 또는 `setup.py` | `pytest` 또는 `python -m pytest` |
| `go.mod` | `go test ./...` |
| `Cargo.toml` | `cargo test` |
| `build.gradle` 또는 `build.gradle.kts` | `./gradlew test` |
| `pom.xml` | `mvn test` |

감지되지 않으면 사용자에게 테스트 실행 방법을 질문한다.

## 실행 절차

1. 프로젝트 루트에서 위 테이블 순서로 파일을 확인한다.
2. 감지된 도구로 전체 테스트를 실행한다.
3. 실패가 있으면 원인을 분석한다.
4. 결과를 아래 형식으로 보고한다.

## 결과 보고 형식

```markdown
## 테스트 결과

- **도구**: [감지된 테스트 도구]
- **통과**: N개
- **실패**: N개
- **건너뜀**: N개

### 실패 상세 (있는 경우)
| 테스트 | 에러 메시지 | 원인 분석 |
|--------|-------------|-----------|
| test_name | error message | 분석 내용 |

### 결론
[통과/실패 — 실패 시 조치 방안 제시]
```

## 부분 실행

특정 범위만 테스트할 때:

```bash
# 변경된 파일 관련 테스트만 실행 (git diff 기반)
git diff --name-only develop | grep -E '\.(test|spec)\.'

# 특정 파일/디렉토리만 실행 (도구별)
# Node: npx jest path/to/test
# Python: pytest path/to/test
# Go: go test ./path/to/...
```

## 규칙

- 테스트 실행 전 의존성이 설치되어 있는지 확인한다.
- 전체 테스트 실행이 너무 오래 걸리면 변경 관련 테스트만 먼저 실행한다.
- 환경 변수가 필요한 테스트는 `.env.example` 등을 참고하여 설정한다.
- flaky 테스트는 3회 재시도 후에도 실패하면 보고한다.
