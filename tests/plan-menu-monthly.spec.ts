import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Workout plan editor', () => {
  test('expands the plan editor', async ({ page }) => {
    await page.locator('#planEditor summary').click();
    await expect(page.locator('#planFields')).toBeVisible();
  });

  test('shows plan fields with day labels', async ({ page }) => {
    await page.locator('#planEditor summary').click();
    const fields = page.locator('#planFields textarea');
    const count = await fields.count();
    expect(count).toBe(7);
  });

  test('can reset plan to default', async ({ page }) => {
    await page.locator('#planEditor summary').click();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#resetPlanBtn').click();
    const fields = page.locator('#planFields textarea');
    const firstField = await fields.first().inputValue();
    expect(firstField.length).toBeGreaterThan(0);
  });
});

test.describe('Overflow menu', () => {
  test('opens and closes the menu', async ({ page }) => {
    await page.locator('#menuBtn').click();
    await expect(page.locator('#menuWrap')).toHaveClass(/open/);

    await page.locator('body').click({ position: { x: 10, y: 300 } });
    await expect(page.locator('#menuWrap')).not.toHaveClass(/open/);
  });

  test('clear period shows a confirmation dialog', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('#menuBtn').click();
    await page.locator('#clearBtn').click();
    expect(dialogMessage).toBeTruthy();
  });

  test('logout button is visible in menu', async ({ page }) => {
    await page.locator('#menuBtn').click();
    await expect(page.locator('#lockBtn')).toBeVisible();
    await expect(page.locator('#lockBtn')).toContainText('Logout');
  });
});

test.describe('Monthly view', () => {
  test('renders day cells for the current month', async ({ page }) => {
    await page.locator('.seg-btn[data-view="month"]').click();
    await expect(page.locator('.month-cell').first()).toBeVisible();
    const cells = page.locator('.month-cell');
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(28);
    expect(count).toBeLessThanOrEqual(42);
  });

  test('clicking a day cell navigates to day view', async ({ page }) => {
    await page.locator('.seg-btn[data-view="month"]').click();
    await expect(page.locator('.month-cell').first()).toBeVisible();

    const inMonthCell = page.locator('.month-cell:not(.out)').first();
    const dayNum = await inMonthCell.locator('.day-num').textContent();
    await inMonthCell.click();

    await expect(page.locator('.seg-btn.active')).toHaveText('Daily');
    await expect(page.locator('.day-head')).toBeVisible();
    await expect(page.locator('.day-head')).toContainText(dayNum!.trim());
  });
});
