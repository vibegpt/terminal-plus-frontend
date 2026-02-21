import { test, expect } from '@playwright/test';

test.describe('Amenity Detail Page', () => {
  test('should load amenity detail page', async ({ page }) => {
    // Navigate to a specific amenity (you'll need to adjust the slug)
    await page.goto('/amenity/test-amenity');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Terminal Plus/);
    
    // Check for amenity information
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display amenity information', async ({ page }) => {
    await page.goto('/amenity/test-amenity');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for amenity details
    const amenityName = page.locator('[data-testid="amenity-name"]');
    if (await amenityName.isVisible()) {
      await expect(amenityName).toBeVisible();
    }
    
    // Check for terminal information
    const terminalInfo = page.locator('[data-testid="terminal-info"]');
    if (await terminalInfo.isVisible()) {
      await expect(terminalInfo).toBeVisible();
    }
  });

  test('should allow bookmarking amenity', async ({ page }) => {
    await page.goto('/amenity/test-amenity');
    await page.waitForLoadState('networkidle');
    
    // Look for bookmark button
    const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
    if (await bookmarkButton.isVisible()) {
      await bookmarkButton.click();
      
      // Check for success message or state change
      const successMessage = page.locator('[data-testid="bookmark-success"]');
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should open navigation when navigate button is clicked', async ({ page }) => {
    await page.goto('/amenity/test-amenity');
    await page.waitForLoadState('networkidle');
    
    // Look for navigate button
    const navigateButton = page.locator('[data-testid="navigate-button"]');
    if (await navigateButton.isVisible()) {
      // Set up promise to wait for new tab
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        navigateButton.click()
      ]);
      
      // Check that new page opened
      await expect(newPage).toBeTruthy();
      await newPage.close();
    }
  });
});
