import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.describe('Idle auto-lock', () => {
  test('locks the app after idle timeout', async ({ page }) => {
    await freshLogin(page);

    // Override the idle timeout to 2 seconds for test speed
    await page.evaluate(() => {
      (window as any).WT.stopIdleTimer();
      let timer: ReturnType<typeof setTimeout> | null = null;
      const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
      function onActivity() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if ((window as any).WT.appInited && (window as any).WT.lockApp) {
            (window as any).WT.lockApp();
          }
        }, 2000);
      }
      events.forEach(evt => document.addEventListener(evt, onActivity, { passive: true }));
      onActivity();
    });

    // Wait for the 2-second idle timeout to fire
    await page.waitForTimeout(3000);
    await expect(page.locator('#pinOverlay')).toBeVisible({ timeout: 5000 });
  });

  test('resets timer on user activity', async ({ page }) => {
    await freshLogin(page);

    await page.evaluate(() => {
      (window as any)._idleLockFired = false;
      (window as any).WT.stopIdleTimer();
      let timer: ReturnType<typeof setTimeout> | null = null;
      const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
      function onActivity() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          (window as any)._idleLockFired = true;
        }, 2000);
      }
      events.forEach(evt => document.addEventListener(evt, onActivity, { passive: true }));
      onActivity();
    });

    // Simulate activity before the 2s timeout
    await page.waitForTimeout(1000);
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1500);

    const fired = await page.evaluate(() => (window as any)._idleLockFired);
    expect(fired).toBe(false);
  });
});
