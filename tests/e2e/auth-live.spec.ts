import { test, expect } from '@playwright/test'

test.describe('Live Authentication Flow', () => {
  test('should complete full parent onboarding flow', async ({ page }) => {
    await page.goto('/')
    
    // Click "GET STARTED" to begin onboarding
    await page.getByRole('button', { name: 'GET STARTED' }).click()
    
    // Should navigate to onboarding page
    await expect(page).toHaveURL('/onboarding')
    await expect(page.getByText('CREATE PARENT ACCOUNT')).toBeVisible()
    
    // Click "SIGN UP" to go to Clerk
    await page.getByRole('button', { name: 'SIGN UP' }).click()
    
    // Should see Clerk sign up form
    await expect(page.getByText('Create your account')).toBeVisible()
    
    // This is where we would test with real Clerk account creation
    // but for now, we'll just verify the flow navigation works
  })

  test('should show child sign-in modal and validate form', async ({ page }) => {
    await page.goto('/')
    
    // Click "START CHATTING NOW" to open child sign-in
    await page.getByRole('button', { name: 'START CHATTING NOW' }).click()
    
    // Should show child sign-in modal
    await expect(page.getByText('WELCOME BACK!')).toBeVisible()
    await expect(page.getByPlaceholder('coolkid123')).toBeVisible()
    await expect(page.getByPlaceholder('••••')).toBeVisible()
    
    // Submit button should be disabled initially
    await expect(page.getByRole('button', { name: "LET'S GO!" })).toBeDisabled()
    
    // Enter username only
    await page.getByPlaceholder('coolkid123').fill('testuser')
    await expect(page.getByRole('button', { name: "LET'S GO!" })).toBeDisabled()
    
    // Enter PIN too
    await page.getByPlaceholder('••••').fill('1234')
    await expect(page.getByRole('button', { name: "LET'S GO!" })).toBeEnabled()
    
    // Clear username to test validation
    await page.getByPlaceholder('coolkid123').clear()
    await expect(page.getByRole('button', { name: "LET'S GO!" })).toBeDisabled()
  })

  test('should navigate to parent sign-in', async ({ page }) => {
    await page.goto('/')
    
    // Click "PARENT LOGIN" in header
    await page.locator('header').getByRole('button', { name: 'PARENT LOGIN' }).click()
    
    // Should navigate to sign-in page
    await expect(page).toHaveURL('/sign-in')
    await expect(page.getByText('PARENT ACCESS')).toBeVisible()
    
    // Should have Clerk sign-in component
    await expect(page.getByText('Sign in')).toBeVisible()
  })

  test('should handle child sign-in modal close', async ({ page }) => {
    await page.goto('/')
    
    // Open child sign-in modal
    await page.getByRole('button', { name: 'START CHATTING NOW' }).click()
    await expect(page.getByText('WELCOME BACK!')).toBeVisible()
    
    // Close modal with BACK button
    await page.getByRole('button', { name: 'BACK' }).click()
    
    // Modal should be gone
    await expect(page.getByText('WELCOME BACK!')).not.toBeVisible()
    
    // Should be back on landing page
    await expect(page.getByText('AI FRIEND THAT\'S ACTUALLY COOL')).toBeVisible()
  })

  test('should complete onboarding success flow', async ({ page }) => {
    // Navigate directly to success page to test completion flow
    await page.goto('/onboarding/success')
    
    // Should show success message
    await expect(page.getByText('SETUP COMPLETE!')).toBeVisible()
    await expect(page.getByText('Your child\'s Buddy account is ready!')).toBeVisible()
    
    // Should have navigation buttons
    await expect(page.getByRole('button', { name: 'GO TO PARENT DASHBOARD' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'BACK TO HOME' })).toBeVisible()
    
    // Test navigation back to home
    await page.getByRole('button', { name: 'BACK TO HOME' }).click()
    await expect(page).toHaveURL('/')
  })
})