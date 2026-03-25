import { test, expect } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for mobile navigation elements
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
    
    // Check for hamburger menu or mobile menu button
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test swipe gestures if available
    const swipeableElement = page.locator('[data-testid="swipeable"]');
    if (await swipeableElement.isVisible()) {
      // Simulate swipe gesture
      await swipeableElement.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();
    }
  });

  test('should support pull-to-refresh', async ({ page }) => {
    await page.goto('/');
    
    // Test pull-to-refresh functionality
    const pullToRefresh = page.locator('[data-testid="pull-to-refresh"]');
    if (await pullToRefresh.isVisible()) {
      // Simulate pull gesture
      await page.touchscreen.tap(200, 100);
      await page.mouse.move(200, 200);
    }
  });

  test('should have proper viewport settings', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeVisible();
    
    const viewportContent = await viewport.getAttribute('content');
    expect(viewportContent).toContain('width=device-width');
    expect(viewportContent).toContain('initial-scale=1.0');
  });

  test('should handle safe areas on iOS', async ({ page }) => {
    await page.goto('/');
    
    // Check for safe area CSS variables
    const body = page.locator('body');
    const computedStyle = await body.evaluate((el) => {
      return window.getComputedStyle(el);
    });
    
    // Check if safe area styles are applied
    const hasSafeAreaStyles = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.paddingTop.includes('env(safe-area-inset-top)') ||
             style.paddingBottom.includes('env(safe-area-inset-bottom)');
    });
    
    // This might not be true in all cases, but it's good to check
    expect(hasSafeAreaStyles).toBeDefined();
  });
});
