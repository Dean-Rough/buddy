import { test, expect } from '@playwright/test';

test.describe('Button Functionality Tests', () => {
  test('all SIGN UP and SIGN IN buttons should work', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test 1: Header SIGN UP button (desktop)
    const headerSignUpButton = page.locator(
      'header button:has-text("SIGN UP")'
    );
    await expect(headerSignUpButton).toBeVisible();
    await headerSignUpButton.click();

    // Should navigate to onboarding
    await expect(page).toHaveURL('/onboarding');
    await page.goBack();

    // Test 2: Header SIGN IN button (desktop)
    const headerSignInButton = page.locator(
      'header button:has-text("SIGN IN")'
    );
    await expect(headerSignInButton).toBeVisible();
    await headerSignInButton.click();

    await expect(page).toHaveURL('/sign-in');
    await page.goBack();

    // Test 3: Hero section SIGN UP button
    const heroSignUpButton = page.locator('button:has-text("SIGN UP")').first();
    await expect(heroSignUpButton).toBeVisible();
    await heroSignUpButton.click();

    await expect(page).toHaveURL('/onboarding');
    await page.goBack();

    // Test 4: Mobile menu (if available)
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    const mobileMenuButton = page.locator('header button[class*="md:hidden"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();

      // Wait for menu to open
      await page.waitForTimeout(500);

      const mobileSignUp = page.locator('nav button:has-text("SIGN UP")');
      if (await mobileSignUp.isVisible()) {
        await mobileSignUp.click();
        await expect(page).toHaveURL('/onboarding');
      }
    }

    // Check for any console errors
    expect(consoleErrors).toEqual([]);
  });

  test('SIGN IN button should navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signInButton = page.locator('button:has-text("SIGN IN")').first();
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Should navigate to sign-in page
    await expect(page).toHaveURL('/sign-in');
  });

  test('navigation buttons should work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test SIGN UP button
    const signUpButton = page.locator('button:has-text("SIGN UP")').first();
    await expect(signUpButton).toBeVisible();
    await signUpButton.click();

    await expect(page).toHaveURL('/onboarding');
  });
});
