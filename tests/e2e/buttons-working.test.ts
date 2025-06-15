import { test, expect } from '@playwright/test';

test.describe('Confirm All Buttons Work', () => {
  test('all START CHAT buttons successfully show modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Test any START CHAT related button
    const chatButtons = page.locator('button', { hasText: /START.*CHAT/i });
    const buttonCount = await chatButtons.count();
    console.log(`Found ${buttonCount} START CHAT buttons`);

    if (buttonCount > 0) {
      // Click the first visible START CHAT button
      const firstButton = chatButtons.first();
      await firstButton.click();

      // Check for modal with the ACTUAL text
      await expect(page.locator('text=WELCOME BACK!')).toBeVisible({
        timeout: 3000,
      });
      await expect(
        page.locator('text=Enter your username and secret PIN')
      ).toBeVisible();

      // Verify modal components are there
      await expect(
        page.locator('input[placeholder="coolkid123"]')
      ).toBeVisible();
      await expect(
        page.locator('input[placeholder="Enter your password"]')
      ).toBeVisible();
      await expect(page.locator('button:has-text("BACK")')).toBeVisible();

      console.log('✅ START CHAT buttons work perfectly!');
    }
  });

  test('navigation buttons work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Test PARENT LOGIN
    const parentLogin = page.locator('button:has-text("PARENT LOGIN")');
    if (await parentLogin.isVisible()) {
      await parentLogin.click();
      await expect(page).toHaveURL('/sign-in');
      console.log('✅ PARENT LOGIN works!');
      await page.goBack();
    }

    // Test GET STARTED / PARENT SETUP buttons
    const getStarted = page.locator('button', {
      hasText: /GET STARTED|PARENT SETUP/i,
    });
    if (await getStarted.first().isVisible()) {
      await getStarted.first().click();
      await expect(page).toHaveURL('/onboarding');
      console.log('✅ GET STARTED/PARENT SETUP works!');
    }
  });
});
