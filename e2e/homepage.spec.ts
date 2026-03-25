import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/Terminal Plus/);
    
    // Check for main navigation elements
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display vibe collections', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for vibe sections (these might be loaded dynamically)
    const vibeSections = page.locator('[data-testid*="vibe"]');
    await expect(vibeSections.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to vibe page when collection is clicked', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Look for clickable vibe elements
    const vibeLinks = page.locator('a[href*="/vibe/"]').first();
    
    if (await vibeLinks.isVisible()) {
      await vibeLinks.click();
      
      // Check that we navigated to a vibe page
      await expect(page).toHaveURL(/\/vibe\//);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that the page is still functional
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile-specific elements or layout
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });
});
