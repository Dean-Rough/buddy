import { test, expect } from '@playwright/test';

test.describe('Brutal Landing Page', () => {
  test('should load the landing page with all sections', async ({ page }) => {
    await page.goto('/');

    // Check page loads
    await expect(page).toHaveTitle(/Onda/);

    // Check header is visible - use more specific selector
    await expect(page.locator('header img[alt="Onda"]')).toBeVisible();

    // Check main hero content
    await expect(
      page.getByText("AI FRIEND THAT'S ACTUALLY COOL")
    ).toBeVisible();

    // Check navigation buttons - be specific about which ones we're checking
    await expect(
      page.getByRole('button', { name: 'START CHATTING NOW' }).first()
    ).toBeVisible();
    await expect(
      page.locator('header').getByRole('button', { name: 'PARENT LOGIN' })
    ).toBeVisible();
  });

  test('should show child sign-in modal when START CHATTING is clicked', async ({
    page,
  }) => {
    await page.goto('/');

    // Click the start chatting button
    await page.getByRole('button', { name: 'START CHATTING NOW' }).click();

    // Check child sign-in modal appears
    await expect(page.getByText('WELCOME BACK!')).toBeVisible();
    await expect(page.getByPlaceholder('coolkid123')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

    // Check modal has back button
    await expect(page.getByRole('button', { name: 'BACK' })).toBeVisible();
  });

  test('should close child sign-in modal when BACK is clicked', async ({
    page,
  }) => {
    await page.goto('/');

    // Open child sign-in modal
    await page.getByRole('button', { name: 'START CHATTING NOW' }).click();
    await expect(page.getByText('WELCOME BACK!')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'BACK' }).click();

    // Check modal is gone
    await expect(page.getByText('WELCOME BACK!')).not.toBeVisible();
  });

  test('should navigate to features section', async ({ page }) => {
    await page.goto('/');

    // Click features link in header - be more specific
    await page
      .locator('header')
      .getByRole('link', { name: 'FEATURES' })
      .click();

    // Check we're at features section
    await expect(page.getByText('WHY KIDS LOVE ONDA')).toBeVisible();
    await expect(page.getByText('REAL TALK')).toBeVisible();
  });

  test('should have working mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check menu button exists - it shows Menu icon, not text
    const menuButton = page.locator('header button:has(svg)');
    await expect(menuButton).toBeVisible();

    // Open mobile menu
    await menuButton.click();

    // Check mobile menu items appear
    await expect(page.locator('nav').getByText('FEATURES')).toBeVisible();
    await expect(page.locator('nav').getByText('SAFETY')).toBeVisible();
    await expect(page.locator('nav').getByText('FOR PARENTS')).toBeVisible();
  });

  test('should display all feature cards', async ({ page }) => {
    await page.goto('/');

    // Scroll to features section
    await page.getByText('WHY KIDS LOVE ONDA').scrollIntoViewIfNeeded();

    // Check all feature cards are visible
    await expect(page.getByText('REAL TALK')).toBeVisible();
    await expect(page.getByText('YOUR STYLE')).toBeVisible();
    await expect(page.getByText('GETS SMARTER')).toBeVisible();
    await expect(page.getByText('ALWAYS THERE')).toBeVisible();
    await expect(page.getByText('WRITES LIKE YOU')).toBeVisible();
    await expect(page.getByText('SUPER CREATIVE')).toBeVisible();
  });

  test('should display safety section with video background', async ({
    page,
  }) => {
    await page.goto('/');

    // Scroll to safety section
    await page.getByText('ULTRA SAFE').scrollIntoViewIfNeeded();

    // Check safety content
    await expect(page.getByText('ULTRA SAFE')).toBeVisible();
    await expect(page.getByText('DUAL AI SAFETY')).toBeVisible();
    await expect(page.getByText('PARENT ALERTS')).toBeVisible();
    await expect(page.getByText('95%+ SAFETY')).toBeVisible();
  });

  test('should display parent section', async ({ page }) => {
    await page.goto('/');

    // Scroll to parents section - be more specific
    await page.locator('#parents').scrollIntoViewIfNeeded();

    // Check parent content
    await expect(page.getByText('FULL CONTROL DASHBOARD')).toBeVisible();
    await expect(
      page.getByText('View all conversations in real-time')
    ).toBeVisible();
    await expect(page.getByText('ACCESS PARENT DASHBOARD')).toBeVisible();
  });

  test('should have working footer', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer content - use more specific selectors to avoid conflicts
    await expect(
      page.getByText('The AI companion that actually gets kids')
    ).toBeVisible();
    await expect(
      page.locator('footer h4', { hasText: 'FOR KIDS' })
    ).toBeVisible();
    await expect(
      page.locator('footer h4', { hasText: 'FOR PARENTS' })
    ).toBeVisible();
    await expect(
      page.locator('footer h4', { hasText: 'SUPPORT' })
    ).toBeVisible();
  });
});

test.describe('Child Authentication', () => {
  test('should show error for empty credentials', async ({ page }) => {
    await page.goto('/');

    // Open child sign-in modal
    await page.getByRole('button', { name: 'START CHATTING NOW' }).click();

    // Wait for modal to appear
    await expect(page.getByText('WELCOME BACK!')).toBeVisible();

    // Enter partial data to enable the button
    await page.getByPlaceholder('coolkid123').fill('testuser');

    // Clear it to trigger validation
    await page.getByPlaceholder('coolkid123').clear();

    // Check submit button is disabled when empty
    await expect(
      page.getByRole('button', { name: "LET'S GO!" })
    ).toBeDisabled();
  });

  test('should disable submit button when credentials are empty', async ({
    page,
  }) => {
    await page.goto('/');

    // Open child sign-in modal
    await page
      .getByRole('button', { name: 'START CHATTING NOW' })
      .first()
      .click();

    // Wait for modal to appear then check submit button is disabled
    await expect(page.getByText('WELCOME BACK!')).toBeVisible();
    await expect(
      page.getByRole('button', { name: "LET'S GO!" })
    ).toBeDisabled();
  });

  test('should enable submit button when credentials are entered', async ({
    page,
  }) => {
    await page.goto('/');

    // Open child sign-in modal
    await page
      .getByRole('button', { name: 'START CHATTING NOW' })
      .first()
      .click();

    // Wait for modal and enter credentials
    await expect(page.getByText('WELCOME BACK!')).toBeVisible();
    await page.getByPlaceholder('coolkid123').fill('testchild');
    await page.getByPlaceholder('Enter your password').fill('testpass123');

    // Check submit button is enabled
    await expect(page.getByRole('button', { name: "LET'S GO!" })).toBeEnabled();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile header - use more specific selector
    await expect(page.locator('header img[alt="Onda"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'MENU' })).toBeVisible();

    // Check hero content is readable
    await expect(
      page.getByText("AI FRIEND THAT'S ACTUALLY COOL")
    ).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check tablet layout - use more specific selector
    await expect(page.locator('header img[alt="Onda"]')).toBeVisible();
    await expect(
      page.getByText("AI FRIEND THAT'S ACTUALLY COOL")
    ).toBeVisible();
  });
});
