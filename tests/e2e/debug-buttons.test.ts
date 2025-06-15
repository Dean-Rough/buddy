import { test, expect } from '@playwright/test';

test('Debug button interactions and console errors', async ({ page }) => {
  // Listen for console messages and errors
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  // Navigate to the page
  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot before interaction
  await page.screenshot({ path: 'debug-before-click.png', fullPage: true });

  // Find and examine the START CHAT button
  const startChatButton = page.getByRole('button', { name: 'START CHAT' });
  await expect(startChatButton).toBeVisible();

  // Get button properties
  const buttonBox = await startChatButton.boundingBox();
  const isEnabled = await startChatButton.isEnabled();
  const buttonText = await startChatButton.textContent();

  console.log('Button properties:', {
    text: buttonText,
    enabled: isEnabled,
    boundingBox: buttonBox,
    visible: await startChatButton.isVisible(),
  });

  // Try to click the button
  await startChatButton.click();

  // Wait a bit to see if anything happens
  await page.waitForTimeout(2000);

  // Take a screenshot after click
  await page.screenshot({ path: 'debug-after-click.png', fullPage: true });

  // Check if modal appeared
  const modal = page.locator('[data-testid="child-signin-modal"]');
  const isModalVisible = await modal.isVisible().catch(() => false);

  // Also check for common modal selectors
  const dialogModal = page.locator('dialog, [role="dialog"], .modal');
  const isAnyModalVisible = await dialogModal
    .first()
    .isVisible()
    .catch(() => false);

  console.log('After click state:', {
    modalVisible: isModalVisible,
    anyModalVisible: isAnyModalVisible,
    consoleMessages: consoleMessages.slice(-10), // Last 10 messages
    consoleErrors,
  });

  // Print all console messages for debugging
  console.log('All console messages:', consoleMessages);
  console.log('All console errors:', consoleErrors);

  // Try clicking PARENT LOGIN too
  const parentLoginButton = page.getByRole('button', { name: 'PARENT LOGIN' });
  await parentLoginButton.click();
  await page.waitForTimeout(1000);

  console.log('Current URL after parent login click:', page.url());
});
