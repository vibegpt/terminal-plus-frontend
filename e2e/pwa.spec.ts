import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Be robust if multiple manifest tags exist: grab the first one.
    const manifestLink = page.locator('link[rel="manifest"]').first();

    // Ensure the href points to a manifest file at the root.
    await expect(manifestLink).toHaveAttribute('href', /\/manifest\.webmanifest$/);

    // Verify the manifest is reachable and valid JSON
    const res = await page.request.get('/manifest.webmanifest');
    expect(res.ok()).toBeTruthy();

    const ct = (res.headers()['content-type'] || '').toLowerCase();
    expect(ct).toMatch(/application\/(manifest\+)?json/);

    const manifest = await res.json();
    // Minimal sanity checks — tweak as you like
    expect(typeof manifest.name).toBe('string');
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display ?? 'standalone').toBeDefined();
    expect(Array.isArray(manifest.icons ?? [])).toBeTruthy();
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    // If your app registers on window "load", make sure we wait for that:
    await page.waitForLoadState('load');

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;

      try {
        // Already registered & active?
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing && (existing.active || existing.waiting)) return true;

        // Otherwise wait until ready (installed + activated)
        await navigator.serviceWorker.ready;
        return true;
      } catch {
        return false;
      }
    });

    expect(swRegistered).toBeTruthy();
  });
});
