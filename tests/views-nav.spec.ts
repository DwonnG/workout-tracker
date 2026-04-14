import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('View switching', () => {
  test('defaults to Daily view', async ({ page }) => {
    await expect(page.locator('.seg-btn.active')).toHaveText('Daily');
  });

  test('switches to Weekly view', async ({ page }) => {
    await page.locator('.seg-btn[data-view="week"]').click();
    await expect(page.locator('.seg-btn[data-view="week"]')).toHaveClass(/active/);
    await expect(page.locator('#viewTitle')).not.toBeEmpty();
  });

  test('switches to Monthly view', async ({ page }) => {
    await page.locator('.seg-btn[data-view="month"]').click();
    await expect(page.locator('.seg-btn[data-view="month"]')).toHaveClass(/active/);
  });

  test('navigates forward and backward', async ({ page }) => {
    const titleBefore = await page.locator('#viewTitle').textContent();
    await page.locator('#navPrev').click();
    const titleAfter = await page.locator('#viewTitle').textContent();
    expect(titleAfter).not.toBe(titleBefore);

    await page.locator('#navNext').click();
    const titleRestored = await page.locator('#viewTitle').textContent();
    expect(titleRestored).toBe(titleBefore);
  });

  test('Today button returns to current day', async ({ page }) => {
    await page.locator('#navPrev').click();
    await page.locator('#navPrev').click();
    const titleAway = await page.locator('#viewTitle').textContent();

    await page.locator('#navToday').click();
    const titleToday = await page.locator('#viewTitle').textContent();
    expect(titleToday).not.toBe(titleAway);
    const today = new Date();
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];
    expect(titleToday).toContain(dayName);
  });
});
