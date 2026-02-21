// e2e/airport-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Airport Journey Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
  });

  test('complete journey from landing to amenity', async ({ page }) => {
    // Wait for and select terminal
    await page.waitForSelector('[data-testid="terminal-select"]', {
      timeout: 10000
    });
    await page.selectOption('[data-testid="terminal-select"]', 'SIN-T3');
    
    // Enter boarding time
    await page.fill('[data-testid="boarding-time"]', '14:30');
    
    // Wait for vibes to load
    await page.waitForSelector('[data-testid="vibe-refuel"]', {
      timeout: 10000
    });
    
    // Select a vibe
    await page.click('[data-testid="vibe-refuel"]');
    
    // Wait for navigation to vibe page
    await page.waitForURL('**/vibe/refuel');
    
    // Wait for amenities to load
    await page.waitForSelector('[data-testid^="amenity-card-"]', {
      timeout: 10000
    });
    
    // Choose first amenity
    const firstAmenity = page.locator('[data-testid^="amenity-card-"]').first();
    await firstAmenity.click();
    
    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/amenity\/.+/);
    
    // Bookmark amenity
    await page.click('[data-testid="bookmark-button"]');
    await expect(page.locator('[data-testid="bookmark-button"]')).toContainText('Saved');
  });

  test('offline mode works', async ({ page, context }) => {
    // Load page normally first
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Refresh page
    await page.reload();
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
    
    // Cached data should still work
    await expect(page.locator('[data-testid="vibe-collection"]')).toHaveCount(7);
  });
});
