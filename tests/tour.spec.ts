import { test, expect } from '@playwright/test';
import { APP_URL, loginWithPin } from './helpers';

test.describe('First-login walkthrough tour', () => {
  test('shows tour on first login when tourDone flag is absent', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.removeItem('wt:tourDone');
    });
    await page.reload();
    await expect(page.locator('#pinOverlay')).toBeVisible();
    await loginWithPin(page);
    await expect(page.locator('#calendar')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('#tourOverlay')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#tourTitle')).toHaveText('Date Navigation');
    await expect(page.locator('#tourCounter')).toHaveText('1 / 6');
  });

  test('advances through steps and completes', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.removeItem('wt:tourDone');
    });
    await page.reload();
    await expect(page.locator('#pinOverlay')).toBeVisible();
    await loginWithPin(page);
    await expect(page.locator('#tourOverlay')).toBeVisible({ timeout: 5000 });

    await page.locator('#tourNext').click({ force: true });
    await expect(page.locator('#tourTitle')).toHaveText('Weekly Stats');

    await page.locator('#tourPrev').click({ force: true });
    await expect(page.locator('#tourTitle')).toHaveText('Date Navigation');

    // Click through all remaining steps
    for (let i = 0; i < 5; i++) {
      await page.locator('#tourNext').click({ force: true });
    }

    // Last step should say "Done"
    await expect(page.locator('#tourNext')).toHaveText('Done');
    await page.locator('#tourNext').click({ force: true });

    await expect(page.locator('#tourOverlay')).toHaveCount(0, { timeout: 3000 });

    const tourDone = await page.evaluate(() => localStorage.getItem('wt:tourDone'));
    expect(tourDone).toBe('1');
  });

  test('skip button ends tour and sets flag', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.removeItem('wt:tourDone');
    });
    await page.reload();
    await expect(page.locator('#pinOverlay')).toBeVisible();
    await loginWithPin(page);
    await expect(page.locator('#tourOverlay')).toBeVisible({ timeout: 5000 });

    await page.locator('#tourSkip').click();
    await expect(page.locator('#tourOverlay')).toHaveCount(0, { timeout: 3000 });

    const tourDone = await page.evaluate(() => localStorage.getItem('wt:tourDone'));
    expect(tourDone).toBe('1');
  });

  test('does not show tour when tourDone flag exists', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('wt:tourDone', '1');
    });
    await page.reload();
    await expect(page.locator('#pinOverlay')).toBeVisible();
    await loginWithPin(page);
    await expect(page.locator('#calendar')).toBeVisible({ timeout: 5000 });

    // Give it a moment -- tour should NOT appear
    await page.waitForTimeout(1500);
    await expect(page.locator('#tourOverlay')).toHaveCount(0);
  });
});
