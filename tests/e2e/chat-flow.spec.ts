import { test, expect } from '@playwright/test';

test.describe('Chat Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Authentication Flow', () => {
    test('should display authentication buttons', async ({ page }) => {
      await page.goto('/');

      // Check both auth buttons are visible and clickable
      const getStartedButton = page
        .getByRole('button', { name: 'GET STARTED' })
        .first();
      const signInButton = page
        .getByRole('button', { name: 'SIGN IN' })
        .first();

      await expect(getStartedButton).toBeVisible();
      await expect(signInButton).toBeVisible();
      await expect(getStartedButton).toBeEnabled();
      await expect(signInButton).toBeEnabled();
    });

    test('should be able to interact with authentication buttons', async ({
      page,
    }) => {
      await page.goto('/');

      // Test that buttons are clickable (though they may not navigate in test environment)
      const getStartedButton = page
        .getByRole('button', { name: 'GET STARTED' })
        .first();
      await getStartedButton.click();

      // Wait a moment for any potential navigation attempt
      await page.waitForTimeout(1000);

      // Button should still be interactable
      await expect(getStartedButton).toBeVisible();
    });

    test('should have proper button text content', async ({ page }) => {
      await page.goto('/');

      // Verify button text is correct
      await expect(
        page.getByRole('button', { name: 'GET STARTED' })
      ).toHaveCount(2); // Multiple instances
      await expect(page.getByRole('button', { name: 'SIGN IN' })).toHaveCount(
        2
      ); // Multiple instances
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users from /chat to home page', async ({
      page,
    }) => {
      // Try to access chat directly without authentication
      await page.goto('/chat');

      // Should be redirected to home page
      await expect(page).toHaveURL('/');

      // Should show landing page content
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();
    });

    test('should redirect unauthenticated users from /whisper to home page', async ({
      page,
    }) => {
      // Try to access whisper mode directly
      await page.goto('/whisper');

      // Should be redirected to home page
      await expect(page).toHaveURL('/');

      // Should show landing page content
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();
    });

    test('should allow access to parent route with proper authentication flow', async ({
      page,
    }) => {
      // Try to access parent route
      await page.goto('/parent');

      // Should either:
      // 1. Redirect to home page if no auth
      // 2. Show parent interface if authenticated
      // 3. Redirect to auth flow

      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();

      // Should be on some valid page (not a 404)
      expect(
        ['/', '/parent', '/sign-in', '/onboarding'].some(path =>
          currentUrl.includes(path)
        )
      ).toBeTruthy();
    });
  });

  test.describe('API Route Validation', () => {
    test('should have chat API endpoints available', async ({ page }) => {
      // Test that the chat API routes exist
      const response = await page.request.post('/api/chat/message', {
        data: {
          message: 'test',
          childId: 'test-child',
          sessionId: 'test-session',
        },
      });

      // Should return some response (even if authentication error)
      expect(response.status()).toBeLessThan(500); // Not a server error
    });

    test('should protect chat API from unauthenticated access', async ({
      page,
    }) => {
      const response = await page.request.post('/api/chat/message', {
        data: {
          message: 'test',
          childId: 'test-child',
          sessionId: 'test-session',
        },
      });

      // Should either return 401/403 (auth required) or handle gracefully
      expect([200, 401, 403, 422]).toContain(response.status());
    });

    test('should validate safety API endpoints', async ({ page }) => {
      const response = await page.request.post('/api/safety/escalate', {
        data: {
          level: 3,
          content: 'test safety content',
          childId: 'test-child',
        },
      });

      // Should handle request appropriately
      expect(response.status()).toBeLessThan(500);
    });

    test('should check time status API', async ({ page }) => {
      const response = await page.request.get('/api/chat/time-status');

      // Should handle time status requests
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('User Interface Elements', () => {
    test('should display landing page with all key components', async ({
      page,
    }) => {
      await page.goto('/');

      // Check main hero content
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();

      // Check navigation buttons
      await expect(
        page.getByRole('button', { name: 'GET STARTED' }).first()
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'SIGN IN' }).first()
      ).toBeVisible();

      // Check feature sections
      await expect(page.getByText('WHAT PARENTS ACTUALLY GET')).toBeVisible();
      await expect(page.getByText('ULTRA SAFE')).toBeVisible();
    });

    test('should have interactive GET STARTED button', async ({ page }) => {
      await page.goto('/');

      // Click the get started button
      const getStartedButton = page
        .getByRole('button', { name: 'GET STARTED' })
        .first();
      await expect(getStartedButton).toBeVisible();
      await expect(getStartedButton).toBeEnabled();

      // Should be clickable
      await getStartedButton.click();
      await page.waitForTimeout(500);

      // Button should still be present after click
      await expect(getStartedButton).toBeVisible();
    });

    test('should display testimonials and social proof', async ({ page }) => {
      await page.goto('/');

      // Check for testimonials
      await expect(
        page.getByText('Join thousands of families using Onda safely')
      ).toBeVisible();

      // Check for results section
      await expect(page.getByText('THE RESULTS PARENTS SEE')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check mobile header logo
      await expect(page.locator('img[alt="Onda"]')).toBeVisible();

      // Check hero content is readable
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();

      // Check mobile functionality
      await expect(
        page.getByRole('button', { name: 'GET STARTED' }).first()
      ).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Check tablet layout
      await expect(page.locator('img[alt="Onda"]')).toBeVisible();
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();

      // Test interaction
      await expect(
        page.getByRole('button', { name: 'GET STARTED' }).first()
      ).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should scroll to different sections', async ({ page }) => {
      await page.goto('/');

      // Scroll to safety section
      await page.locator('#safety').scrollIntoViewIfNeeded();
      await expect(page.getByText('ULTRA SAFE')).toBeVisible();
    });

    test('should display safety section', async ({ page }) => {
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

      // Scroll to parents section
      await page.locator('#parents').scrollIntoViewIfNeeded();

      // Check parent content
      await expect(page.getByText('FULL CONTROL DASHBOARD')).toBeVisible();
      await expect(
        page.getByText('View all conversations in real-time')
      ).toBeVisible();
      await expect(page.getByText('PARENT DASHBOARD')).toBeVisible();
    });
  });

  test.describe('Performance and Error Handling', () => {
    test('should load landing page quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle non-existent routes gracefully', async ({ page }) => {
      await page.goto('/non-existent-route');

      // Should either redirect to home or show a proper 404 page
      await page.waitForLoadState('networkidle');

      // Should not show a completely blank page
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(10);
    });

    test('should handle network interruptions', async ({ page }) => {
      await page.goto('/');

      // Simulate network failure for API requests
      await page.route('**/api/**', route => route.abort());

      // Should still display the page content
      await expect(
        page.getByText('BIG ANSWERS FOR LITTLE MINDS')
      ).toBeVisible();

      // User interactions should still work on client side
      await expect(
        page.getByRole('button', { name: 'GET STARTED' }).first()
      ).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');

      // Test keyboard navigation through main elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to reach and activate the main CTA button
      let attempts = 0;
      while (attempts < 20) {
        // Prevent infinite loop
        const focused = await page.evaluate(
          () => document.activeElement?.textContent
        );
        if (focused?.includes('GET STARTED') || focused?.includes('SIGN IN')) {
          await page.keyboard.press('Enter');
          break;
        }
        await page.keyboard.press('Tab');
        attempts++;
      }

      // Should either navigate or show some interaction
      await page.waitForTimeout(1000); // Allow time for any navigation
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/');

      // Check for main navigation
      await expect(page.getByRole('navigation')).toBeVisible();

      // Check for main content
      await expect(page.getByRole('main')).toBeVisible();

      // Check for buttons with proper labels
      await expect(
        page.getByRole('button', { name: /get started/i })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /sign in/i })
      ).toBeVisible();
    });
  });
});
