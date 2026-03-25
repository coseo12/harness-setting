#!/usr/bin/env node
'use strict';

/**
 * Playwright 기반 브라우저 테스트 실행기
 *
 * 사용법:
 *   node run_playwright.js --url <URL> --steps '<JSON>' [--trace] [--browser chromium|firefox|webkit]
 *
 * steps JSON 형식:
 *   [
 *     { "action": "click", "selector": ".btn" },
 *     { "action": "fill", "selector": "input[name=title]", "value": "텍스트" },
 *     { "action": "waitForSelector", "selector": ".result" },
 *     { "action": "expect", "selector": "h1", "assertion": "toBeVisible" },
 *     { "action": "expect", "selector": ".count", "assertion": "toHaveText", "expected": "3" },
 *     { "action": "screenshot", "path": "result.png" },
 *     { "action": "waitForResponse", "urlPattern": "/api/todos", "method": "POST" },
 *     { "action": "console" }
 *   ]
 */

const { parseArgs } = require('node:util');
const path = require('node:path');

const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    steps: { type: 'string' },
    trace: { type: 'boolean', default: false },
    browser: { type: 'string', default: 'chromium' },
  },
});

if (!values.url || !values.steps) {
  console.error('사용법: node run_playwright.js --url <URL> --steps \'<JSON>\' [--trace] [--browser chromium|firefox|webkit]');
  process.exit(1);
}

let steps;
try {
  steps = JSON.parse(values.steps);
} catch (e) {
  console.error('에러: steps JSON 파싱 실패:', e.message);
  process.exit(1);
}

async function run() {
  // playwright는 프로젝트 의존성이 아니므로 동적 import
  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    console.error('에러: playwright가 설치되어 있지 않습니다.');
    console.error('설치: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  const browserType = playwright[values.browser] || playwright.chromium;
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();

  // 트레이스 녹화
  if (values.trace) {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  }

  const page = await context.newPage();
  const consoleMessages = [];
  const errors = [];

  // 콘솔/에러 수집
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => errors.push(err.message));

  console.log(`[Playwright] ${values.browser} → ${values.url}`);
  await page.goto(values.url, { waitUntil: 'networkidle' });

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepLabel = `[${i + 1}/${steps.length}] ${step.action}${step.selector ? ` "${step.selector}"` : ''}`;

    try {
      switch (step.action) {
        case 'click':
          await page.click(step.selector, { timeout: step.timeout || 10000 });
          break;

        case 'fill':
          await page.fill(step.selector, step.value || '', { timeout: step.timeout || 10000 });
          break;

        case 'press':
          await page.press(step.selector || 'body', step.key || 'Enter');
          break;

        case 'select':
          await page.selectOption(step.selector, step.value);
          break;

        case 'check':
          await page.check(step.selector);
          break;

        case 'waitForSelector':
          await page.waitForSelector(step.selector, { timeout: step.timeout || 10000 });
          break;

        case 'waitForResponse': {
          const pattern = step.urlPattern;
          const method = step.method || 'GET';
          await page.waitForResponse(
            (resp) => resp.url().includes(pattern) && resp.request().method() === method,
            { timeout: step.timeout || 10000 },
          );
          break;
        }

        case 'waitForNavigation':
          await page.waitForLoadState('networkidle');
          break;

        case 'wait':
          await page.waitForTimeout(step.ms || 1000);
          break;

        case 'expect': {
          const locator = page.locator(step.selector);
          switch (step.assertion) {
            case 'toBeVisible':
              await locator.waitFor({ state: 'visible', timeout: step.timeout || 10000 });
              break;
            case 'toHaveText':
              const text = await locator.textContent({ timeout: step.timeout || 10000 });
              if (!text?.includes(step.expected)) {
                throw new Error(`텍스트 불일치: "${text}" (기대: "${step.expected}")`);
              }
              break;
            case 'toHaveCount':
              const count = await locator.count();
              if (count !== step.expected) {
                throw new Error(`개수 불일치: ${count} (기대: ${step.expected})`);
              }
              break;
            default:
              throw new Error(`알 수 없는 assertion: ${step.assertion}`);
          }
          break;
        }

        case 'screenshot':
          await page.screenshot({
            path: step.path || `.harness/logs/playwright-screenshot-${Date.now()}.png`,
            fullPage: step.fullPage || false,
          });
          break;

        case 'console':
          console.log('  콘솔 메시지:');
          consoleMessages.forEach((m) => console.log(`    [${m.type}] ${m.text}`));
          break;

        case 'errors':
          console.log('  페이지 에러:');
          errors.forEach((e) => console.log(`    ${e}`));
          break;

        default:
          throw new Error(`알 수 없는 액션: ${step.action}`);
      }

      console.log(`  ✓ ${stepLabel}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${stepLabel} — ${err.message}`);
      failed++;

      // 실패 시 스크린샷 자동 저장
      const failPath = `.harness/logs/playwright-fail-step${i + 1}-${Date.now()}.png`;
      await page.screenshot({ path: failPath }).catch(() => {});
      console.error(`    실패 스크린샷: ${failPath}`);
      break;
    }
  }

  // 트레이스 저장
  if (values.trace) {
    const tracePath = `.harness/logs/playwright-trace-${Date.now()}.zip`;
    await context.tracing.stop({ path: tracePath });
    console.log(`\n트레이스: ${tracePath}`);
    console.log(`분석: npx playwright show-trace ${tracePath}`);
  }

  // hydration 에러 감지
  const hydrationErrors = consoleMessages.filter(
    (m) => m.type === 'error' && /hydration|text content|did not expect/i.test(m.text),
  );
  if (hydrationErrors.length > 0) {
    console.log('\n⚠️  Hydration 에러 감지:');
    hydrationErrors.forEach((m) => console.log(`  ${m.text.slice(0, 200)}`));
  }

  await browser.close();

  console.log(`\n=== 결과: ${passed} 통과, ${failed} 실패 ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('실행 에러:', err.message);
  process.exit(1);
});
