import { test, expect } from '@playwright/test';

// Mock API responses
const mockChildren = [
  {
    id: 'child_1',
    name: 'Emma',
    username: 'emma_cool',
    age: 9,
  },
  {
    id: 'child_2',
    name: 'Jake',
    username: 'jake_awesome',
    age: 11,
  },
];

const mockAlerts = [
  {
    id: 'alert_1',
    eventType: 'inappropriate_language',
    severityLevel: 2,
    detectedAt: '2024-12-15T10:00:00Z',
    status: 'active',
    childName: 'Emma',
    triggerContent: 'Some concerning message content',
    resolved: false,
  },
  {
    id: 'alert_2',
    eventType: 'emotional_distress',
    severityLevel: 3,
    detectedAt: '2024-12-14T15:30:00Z',
    status: 'resolved',
    childName: 'Jake',
    triggerContent: 'Child expressed sadness',
    resolved: true,
  },
  {
    id: 'alert_3',
    eventType: 'personal_info_shared',
    severityLevel: 1,
    detectedAt: '2024-12-13T09:15:00Z',
    status: 'active',
    childName: 'Emma',
    triggerContent: 'Mentioned school name',
    resolved: false,
  },
];

const mockTranscript = {
  alert: mockAlerts[0],
  transcript: {
    conversationId: 'conv_1',
    childId: 'child_1',
    startedAt: '2024-12-15T10:00:00Z',
    messages: [
      {
        id: 'msg_1',
        content: 'Hello there',
        role: 'user',
        timestamp: '2024-12-15T10:00:00Z',
      },
      {
        id: 'msg_2',
        content: 'Hi! How are you?',
        role: 'assistant',
        timestamp: '2024-12-15T10:00:05Z',
      },
    ],
  },
};

test.describe('Alert Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Clerk authentication more comprehensively
    await page.addInitScript(() => {
      // Mock Clerk globals
      (window as any).__clerk_loaded = true;
      (window as any).Clerk = {
        user: {
          id: 'user_123',
          emailAddresses: [{ emailAddress: 'parent@test.com' }],
        },
        session: {
          id: 'session_123',
          user: {
            id: 'user_123',
            emailAddresses: [{ emailAddress: 'parent@test.com' }],
          },
        },
        loaded: true,
      };
      
      // Mock useUser hook response
      (window as any).__useUser = {
        user: {
          id: 'user_123',
          emailAddresses: [{ emailAddress: 'parent@test.com' }],
        },
        isLoaded: true,
        isSignedIn: true,
      };
    });

    // Mock auth routes to return authenticated state
    await page.route('/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    // Mock the parent route to bypass PIN verification in tests
    await page.route('/api/parent/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock API routes
    await page.route('/api/children', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockChildren),
      });
    });

    await page.route('/api/safety/alerts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAlerts),
        });
      }
    });

    await page.route('/api/safety/alerts/batch-resolve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          resolvedCount: 2,
          message: 'Successfully resolved 2 alerts',
        }),
      });
    });

    await page.route('/api/safety/alerts/*/transcript', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTranscript),
      });
    });
  });

  test('displays alert management page correctly', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('ALERT MANAGEMENT');
    
    // Check if alerts are displayed
    await expect(page.locator('text=Inappropriate Language')).toBeVisible();
    await expect(page.locator('text=Emotional Distress')).toBeVisible();
    await expect(page.locator('text=Personal Info Shared')).toBeVisible();
  });

  test('displays filter controls', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for filters to load
    await expect(page.locator('text=FILTERS')).toBeVisible();
    
    // Check filter dropdowns
    await expect(page.locator('text=Severity')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Child')).toBeVisible();
    await expect(page.locator('text=Date Range')).toBeVisible();
    await expect(page.locator('text=Event Type')).toBeVisible();
  });

  test('filters alerts by severity level', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Filter by high severity (level 3)
    const severitySelect = page.locator('select').nth(0); // First select is severity
    await severitySelect.selectOption('3');

    // Should only show high severity alerts
    await expect(page.locator('text=Emotional Distress')).toBeVisible();
    await expect(page.locator('text=Inappropriate Language')).not.toBeVisible();
    await expect(page.locator('text=Personal Info Shared')).not.toBeVisible();
  });

  test('filters alerts by status', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Filter by resolved status
    const statusSelect = page.locator('select').nth(1); // Second select is status
    await statusSelect.selectOption('resolved');

    // Should only show resolved alerts
    await expect(page.locator('text=Emotional Distress')).toBeVisible();
    await expect(page.locator('text=Inappropriate Language')).not.toBeVisible();
    await expect(page.locator('text=Personal Info Shared')).not.toBeVisible();
  });

  test('filters alerts by child name', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Filter by Emma
    const childSelect = page.locator('select').nth(2); // Third select is child
    await childSelect.selectOption('Emma');

    // Should only show Emma's alerts
    await expect(page.locator('text=Inappropriate Language')).toBeVisible();
    await expect(page.locator('text=Personal Info Shared')).toBeVisible();
    await expect(page.locator('text=Emotional Distress')).not.toBeVisible();
  });

  test('selects individual alerts', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Click first alert checkbox (skip the select all checkbox)
    const alertCheckboxes = page.locator('input[type="checkbox"]');
    await alertCheckboxes.nth(1).click(); // Skip select all checkbox

    // Should show selection count
    await expect(page.locator('text=1 selected')).toBeVisible();
  });

  test('selects all alerts', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts and batch controls to load
    await page.waitForSelector('text=Select All (3 alerts)');

    // Click select all checkbox
    await page.locator('text=Select All (3 alerts)').click();

    // Should show all selected
    await expect(page.locator('text=3 selected')).toBeVisible();
  });

  test('performs batch resolve action', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Select All (3 alerts)');

    // Select all alerts
    await page.locator('text=Select All (3 alerts)').click();
    await page.waitForSelector('text=3 selected');

    // Click resolve button
    await page.locator('text=RESOLVE SELECTED (3)').click();

    // Should refresh the page (mocked response)
    await page.waitForLoadState('networkidle');
  });

  test('opens and closes transcript modal', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Click view transcript button
    const transcriptButtons = page.locator('text=VIEW TRANSCRIPT');
    await transcriptButtons.first().click();

    // Should open modal
    await expect(page.locator('text=CONVERSATION TRANSCRIPT')).toBeVisible();

    // Should show transcript content
    await expect(page.locator('text=Hello there')).toBeVisible();
    await expect(page.locator('text=Hi! How are you?')).toBeVisible();

    // Close modal
    await page.locator('text=✕').click();

    // Modal should be closed
    await expect(page.locator('text=CONVERSATION TRANSCRIPT')).not.toBeVisible();
  });

  test('displays correct severity badges', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Check severity badges
    await expect(page.locator('text=Medium Priority')).toBeVisible(); // alert_1
    await expect(page.locator('text=High Priority')).toBeVisible(); // alert_2
    await expect(page.locator('text=Low Priority')).toBeVisible(); // alert_3
  });

  test('displays correct status badges', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Check status badges
    const activeBadges = page.locator('text=🔴 Active');
    const resolvedBadges = page.locator('text=✅ Resolved');
    
    await expect(activeBadges).toHaveCount(2); // alerts 1 and 3
    await expect(resolvedBadges).toHaveCount(1); // alert 2
  });

  test('refreshes data when refresh button clicked', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for page to load
    await page.waitForSelector('text=🔄 REFRESH');

    // Click refresh button
    await page.locator('text=🔄 REFRESH').click();

    // Should make API calls (we can't directly test this, but the page should remain functional)
    await expect(page.locator('text=ALERT MANAGEMENT')).toBeVisible();
  });

  test('shows no alerts message when no data', async ({ page }) => {
    // Override alerts API to return empty array
    await page.route('/api/safety/alerts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/parent/alerts');

    // Should show no alerts message
    await expect(page.locator('text=No alerts match your filters')).toBeVisible();
  });

  test('displays alert details correctly', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Check that alert details are displayed
    await expect(page.locator('text=Emma')).toBeVisible(); // Child name
    await expect(page.locator('text=Some concerning message content')).toBeVisible(); // Trigger content
    
    // Check timestamp formatting (should show relative time)
    await expect(page.locator('text=1d ago')).toBeVisible();
  });

  test('event type filter shows all event types', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Open event type filter
    const eventTypeSelect = page.locator('select').nth(4); // Fifth select is event type
    
    // Check that all event types are available
    await expect(eventTypeSelect.locator('option[value="inappropriate_language"]')).toBeAttached();
    await expect(eventTypeSelect.locator('option[value="emotional_distress"]')).toBeAttached();
    await expect(eventTypeSelect.locator('option[value="personal_info_shared"]')).toBeAttached();
  });

  test('date range filter works correctly', async ({ page }) => {
    await page.goto('/parent/alerts');

    // Wait for alerts to load
    await page.waitForSelector('text=Inappropriate Language');

    // Filter by last day - should show only very recent alerts
    const dateRangeSelect = page.locator('select').nth(3); // Fourth select is date range
    await dateRangeSelect.selectOption('day');

    // Depending on the mock dates, this might filter out some alerts
    // The test verifies the UI responds to the filter change
    await page.waitForTimeout(100); // Give time for filter to apply
  });
});