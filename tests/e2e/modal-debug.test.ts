import { test } from '@playwright/test';

test('Debug modal state and JavaScript errors', async ({ page }) => {
  const consoleMessages: any[] = [];
  const jsErrors: any[] = [];

  // Capture ALL console output and errors
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
    });
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Take screenshot before click
  await page.screenshot({ path: 'debug-before.png', fullPage: true });

  console.log('=== INITIAL STATE ===');
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());

  // Check for showChildSignIn state by checking if the modal is NOT visible initially
  const modalBeforeClick = page.locator(
    'text=Enter your username and secret PIN'
  );
  const isModalInitiallyVisible = await modalBeforeClick
    .isVisible()
    .catch(() => false);
  console.log('Modal initially visible:', isModalInitiallyVisible);

  // Find and click the header START CHAT button specifically
  const headerButton = page
    .locator('header')
    .locator('button:has-text("START CHAT")');
  console.log('Header button visible:', await headerButton.isVisible());

  console.log('=== CLICKING BUTTON ===');
  await headerButton.click();

  // Wait a bit for React state to update
  await page.waitForTimeout(1000);

  // Take screenshot after click
  await page.screenshot({ path: 'debug-after.png', fullPage: true });

  // Check if modal appeared with correct text
  const modalAfterClick = page.locator(
    'text=Enter your username and secret PIN'
  );
  const isModalNowVisible = await modalAfterClick
    .isVisible()
    .catch(() => false);
  console.log('Modal now visible:', isModalNowVisible);

  // Check for the actual modal content that should be there
  const welcomeText = page.locator('text=WELCOME BACK!');
  const isWelcomeVisible = await welcomeText.isVisible().catch(() => false);
  console.log('Welcome text visible:', isWelcomeVisible);

  // Check for the full modal container
  const modalContainer = page.locator(
    'div.fixed.inset-0.bg-black.bg-opacity-80'
  );
  const isModalContainerVisible = await modalContainer
    .isVisible()
    .catch(() => false);
  console.log('Modal container visible:', isModalContainerVisible);

  // Log the page HTML to see what's actually rendered
  console.log('=== PAGE CONTENT AFTER CLICK ===');
  const bodyText = await page.locator('body').textContent();
  console.log(
    'Body contains "WELCOME BACK!":',
    bodyText?.includes('WELCOME BACK!')
  );
  console.log('Body contains "username":', bodyText?.includes('username'));

  // Log any JavaScript errors
  console.log('=== JAVASCRIPT ERRORS ===');
  console.log('JS Errors:', jsErrors);

  // Log relevant console messages
  console.log('=== CONSOLE MESSAGES ===');
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
  console.log('Console Errors:', errorMessages);
  console.log('Console Warnings:', warningMessages);

  // Try clicking other buttons to verify the click handlers work
  console.log('=== TESTING OTHER BUTTONS ===');

  // Test navigation button to verify click handlers work in general
  const getStartedButton = page.locator('button:has-text("GET STARTED")');
  console.log(
    'GET STARTED button visible:',
    await getStartedButton.isVisible()
  );

  if (await getStartedButton.isVisible()) {
    await getStartedButton.click();
    await page.waitForTimeout(500);
    console.log('URL after GET STARTED click:', page.url());

    // Go back to test more
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
  }

  // Final state check
  console.log('=== FINAL STATE ===');
  console.log('Final URL:', page.url());
  console.log('Total console messages:', consoleMessages.length);
});
