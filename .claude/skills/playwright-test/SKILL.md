---
name: playwright-test
description: |
  Playwright 기반 정밀 브라우저 테스트 스킬. form 제출, 동적 컴포넌트, controlled input 등
  agent-browser로 처리 불가능한 복잡한 브라우저 인터랙션을 안정적으로 수행한다.
  TRIGGER when: agent-browser에서 form submit 실패, 동적 컴포넌트 이벤트 미동작,
  controlled input fill 실패, "playwright", "정밀 테스트", "form 제출 테스트",
  크로스 브라우저 테스트, 네트워크 인터셉트, 트레이스 디버깅이 필요할 때.
  DO NOT TRIGGER when: 단순 페이지 확인/스크린샷(browser-test 담당),
  접근성 트리 스냅샷, 단위 테스트, API 테스트.
---

# Playwright 정밀 브라우저 테스트

agent-browser의 한계를 보완하는 정밀 브라우저 인터랙션 도구.
form 제출, React 동적 컴포넌트, controlled input 등에서 신뢰성 높은 테스트를 수행한다.

## agent-browser vs Playwright 역할 분담

| 상황 | 도구 | 이유 |
|------|------|------|
| 페이지 구조 파악, 요소 탐색 | **agent-browser** | 접근성 트리 스냅샷이 AI에 최적화 |
| 단순 클릭, 네비게이션 | **agent-browser** | 빠르고 간편 |
| 스크린샷, 반응형 검증 | **agent-browser** | 뷰포트 변경 + 스크린샷 한 줄 |
| **form 입력 + 제출** | **Playwright** | fill이 onChange 트리거, submit 정상 동작 |
| **동적 마운트 컴포넌트 클릭** | **Playwright** | auto-waiting으로 마운트 대기 후 클릭 |
| **React controlled input** | **Playwright** | input/change 이벤트 순차 시뮬레이션 |
| 네트워크 요청 검증 | **Playwright** | route intercept, waitForResponse |
| 크로스 브라우저 테스트 | **Playwright** | Chromium, Firefox, WebKit |
| 디버깅 (트레이스) | **Playwright** | trace.zip으로 시각적 디버깅 |

## 사전 조건

```bash
# Playwright 설치 확인
npx playwright --version || echo "미설치"

# 브라우저 설치 (처음 한 번만)
npx playwright install chromium
```

## 핵심 사용법

### 1. 인라인 스크립트 실행

간단한 테스트는 `node -e`로 직접 실행한다.

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // form 입력 + 제출
  await page.click('.add-btn');
  await page.fill('input[name=\"title\"]', '할 일 제목');
  await page.click('button:has-text(\"추가하기\")');

  // 결과 검증
  await page.waitForSelector('.todo-item');
  const count = await page.locator('.todo-item').count();
  console.log('할 일 개수:', count);

  await browser.close();
})();
"
```

### 2. 실행 스크립트 사용

복잡한 시나리오는 `scripts/run_playwright.js`를 사용한다.

```bash
# form 제출 테스트
node .claude/skills/playwright-test/scripts/run_playwright.js \
  --url http://localhost:3000 \
  --steps '[
    {"action":"click","selector":".add-btn"},
    {"action":"fill","selector":"input[name=title]","value":"Playwright 테스트"},
    {"action":"click","selector":"button:has-text(추가하기)"},
    {"action":"waitForSelector","selector":".todo-item"},
    {"action":"expect","selector":".todo-item","assertion":"toBeVisible"}
  ]'

# 트레이스 포함 실행
node .claude/skills/playwright-test/scripts/run_playwright.js \
  --url http://localhost:3000 \
  --steps '[...]' \
  --trace
```

### 3. Codegen으로 테스트 생성

사용자 조작을 녹화하여 테스트 코드를 자동 생성한다.

```bash
npx playwright codegen http://localhost:3000
```

## 폴백 전략: agent-browser → Playwright

`browser-test` 스킬에서 다음 상황이 발생하면 자동으로 `playwright-test`로 전환한다:

```
1. agent-browser fill + click 후 상태 변화 없음
   → Playwright fill + click으로 재시도

2. agent-browser에서 동적 컴포넌트 버튼 클릭 실패
   → Playwright의 auto-waiting click으로 재시도

3. form submit이 서버에 도달하지 않음
   → Playwright로 form 제출 수행
```

### 폴백 워크플로우

```
[browser-test로 시작]
       |
  agent-browser snapshot → 요소 식별
  agent-browser fill/click → 액션 수행
  agent-browser snapshot → 결과 검증
       |
  ┌─ 성공 → 완료
  └─ 실패 → [playwright-test로 전환]
                |
           Playwright fill/click → 동일 액션
           결과 검증
                |
           ┌─ 성공 → agent-browser 한계로 기록
           └─ 실패 → 앱 버그로 보고 (트레이스 첨부)
```

## Playwright가 해결하는 agent-browser 한계

### 1. 동적 마운트 컴포넌트 이벤트

```javascript
// agent-browser: 조건부 렌더링 컴포넌트의 onClick 미동작
// Playwright: auto-waiting으로 마운트 대기 후 클릭
await page.click('.add-btn'); // 폼 열기
await page.click('button:has-text("추가하기")'); // auto-wait 후 클릭
```

### 2. React controlled input

```javascript
// agent-browser fill: onChange 미트리거 → state 미갱신
// Playwright fill: input/change 이벤트 순차 발생 → state 정상 갱신
await page.fill('input[name="title"]', '새 할 일');
// React의 useState가 정상적으로 "새 할 일"로 업데이트됨
```

### 3. form submit

```javascript
// agent-browser: type="submit" 클릭 시 onSubmit 미호출
// Playwright: 정상적인 form submission 이벤트 체인 발생
await page.click('button[type="submit"]');
// 또는 Enter 키
await page.press('input[name="title"]', 'Enter');
```

### 4. 네트워크 요청 검증

```javascript
// API 호출이 실제로 발생했는지 검증
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/todos') && resp.request().method() === 'POST'),
  page.click('button:has-text("추가하기")'),
]);
console.log('POST 응답:', response.status()); // 201
```

### 5. 트레이스 디버깅

```javascript
// 트레이스 녹화 → 실패 시 시각적 디버깅
const context = await browser.newContext();
await context.tracing.start({ screenshots: true, snapshots: true });

// ... 테스트 수행 ...

await context.tracing.stop({ path: '.harness/logs/trace.zip' });
// npx playwright show-trace .harness/logs/trace.zip 로 분석
```

## 보안 규칙

- `browser-test` 스킬과 동일한 보안 규칙을 따른다
- **프로덕션 URL 직접 접근 금지**
- **인증 정보 하드코딩 금지** — 환경변수 또는 시크릿 관리 도구 사용
- 트레이스 파일에 민감 정보가 포함될 수 있으므로 `.harness/logs/`에만 저장

## 규칙

- agent-browser로 먼저 시도하고, 실패 시에만 Playwright를 사용한다 (불필요한 복잡성 방지)
- Playwright 스크립트는 가능한 짧고 단일 목적으로 작성한다
- 테스트 실패 시 반드시 트레이스를 첨부하여 디버깅을 돕는다
- 결과는 PR 코멘트 또는 이슈에 보고한다
