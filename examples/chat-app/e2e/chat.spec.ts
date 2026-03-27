import { test, expect } from '@playwright/test';

test.describe('ChatApp E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // === Level 1: 정적 확인 ===

  test('페이지가 정상 로드된다', async ({ page }) => {
    await expect(page).toHaveTitle(/Todo|Chat/i);
  });

  test('깨진 이미지가 없다', async ({ page }) => {
    const brokenImages = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src)
    );
    expect(brokenImages).toHaveLength(0);
  });

  test('프로필과 메뉴가 표시된다', async ({ page }) => {
    // 사이드바 프로필
    await expect(page.locator('text=내 프로필')).toBeVisible();
    // 메뉴
    await expect(page.locator('text=Chats')).toBeVisible();
    await expect(page.locator('text=Marketplace')).toBeVisible();
  });

  test('대화 목록이 표시된다', async ({ page }) => {
    await expect(page.locator('text=김민준').first()).toBeVisible();
  });

  test('온라인 아바타가 표시된다', async ({ page }) => {
    // 온라인 사용자의 아바타가 가로 스크롤 바에 표시
    const avatars = page.locator('img[alt]');
    await expect(avatars.first()).toBeVisible();
  });

  // === Level 2: 인터랙션 확인 ===

  test('대화를 클릭하면 메시지가 표시된다', async ({ page }) => {
    await page.locator('text=내일 회의 시간').first().click();
    await page.waitForTimeout(500);

    // 메시지가 표시되는지 확인
    await expect(page.locator('text=안녕하세요')).toBeVisible();
    // 메시지 입력 필드가 존재하는지
    await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible();
  });

  test('메시지를 전송할 수 있다', async ({ page }) => {
    // 대화 선택
    await page.locator('text=내일 회의 시간').first().click();
    await page.waitForTimeout(500);

    // 메시지 입력 + Enter
    const input = page.locator('input[placeholder*="메시지"]');
    await input.fill('E2E 테스트 메시지');
    await input.press('Enter');
    await page.waitForTimeout(300);

    // 전송된 메시지가 화면에 표시되는지
    await expect(page.locator('text=E2E 테스트 메시지')).toBeVisible();
  });

  test('카테고리 필터가 동작한다', async ({ page }) => {
    // Marketplace 클릭
    await page.locator('text=Marketplace').click();
    await page.waitForTimeout(300);

    // Marketplace 뷰가 표시
    await expect(page.locator('text=중고 거래')).toBeVisible();

    // Chats로 복귀
    await page.locator('text=Chats').first().click();
    await page.waitForTimeout(300);

    // 대화 목록 복귀
    await expect(page.locator('text=김민준').first()).toBeVisible();
  });

  test('새 채팅방을 만들 수 있다', async ({ page }) => {
    // 새 채팅방 버튼
    await page.locator('text=새 채팅방').click();
    await page.waitForTimeout(300);

    // 모달 표시
    await expect(page.locator('text=채팅방 이름')).toBeVisible();

    // 이름 입력 + 만들기
    await page.locator('input[placeholder*="채팅방"]').fill('E2E 테스트 방');
    await page.locator('button:text("만들기")').click();
    await page.waitForTimeout(300);

    // 채팅 뷰로 전환
    await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible();
  });

  test('장식 버튼 클릭 시 토스트가 표시된다', async ({ page }) => {
    // 대화 선택
    await page.locator('text=내일 회의 시간').first().click();
    await page.waitForTimeout(500);

    // 이모지 버튼 클릭 (SVG path로 찾기)
    const emojiBtn = page.locator('button').filter({
      has: page.locator('svg path[d*="14.828 14.828"]'),
    });
    await emojiBtn.click();
    await page.waitForTimeout(300);

    // 토스트 표시
    await expect(page.locator('text=준비 중')).toBeVisible();
  });

  // === Level 3: 흐름 확인 ===

  test('온라인 아바타 클릭 → DM 열기 → 메시지 전송 흐름', async ({
    page,
  }) => {
    // 온라인 아바타 클릭 (첫 번째)
    const avatarBtn = page.locator('button').filter({ has: page.locator('img') }).first();
    await avatarBtn.click();
    await page.waitForTimeout(500);

    // 채팅 뷰 열림
    await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible();

    // 메시지 전송
    const input = page.locator('input[placeholder*="메시지"]');
    await input.fill('아바타 클릭 DM 테스트');
    await input.press('Enter');
    await page.waitForTimeout(300);

    await expect(page.locator('text=아바타 클릭 DM 테스트')).toBeVisible();
  });

  test('대화 선택 → 뒤로가기 → 다른 메뉴 → 복귀 흐름', async ({
    page,
  }) => {
    // 대화 선택
    await page.locator('text=내일 회의 시간').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=안녕하세요')).toBeVisible();

    // 뒤로가기
    await page.locator('button').first().click();
    await page.waitForTimeout(300);

    // Archive 메뉴
    await page.locator('text=Archive').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=보관함')).toBeVisible();

    // Chats 복귀
    await page.locator('text=Chats').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=김민준').first()).toBeVisible();
  });
});
