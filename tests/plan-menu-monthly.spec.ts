import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Editor modal (multi-tab: Workout Plan / Nutrition)', () => {
  test('opens the editor modal via FAB on Workout Plan tab', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await expect(page.locator('#editorModal')).toHaveClass(/open/);
    await expect(page.locator('#editorTabPlan')).toBeVisible();
  });

  test('shows plan grid with day columns', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    const dayCols = page.locator('.plan-day');
    const count = await dayCols.count();
    expect(count).toBe(7);
  });

  test('switches to Nutrition tab and shows macro checkboxes', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    await expect(page.locator('#editorTabNutrition')).toBeVisible();
    await expect(page.locator('#editorTabPlan')).not.toBeVisible();
    await expect(page.locator('#nutritionMacroList .settings-macro-row').first()).toBeVisible();
  });

  test('switches back to Workout Plan tab', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    await page.locator('.editor-tab[data-tab="plan"]').click();
    await expect(page.locator('#editorTabPlan')).toBeVisible();
    await expect(page.locator('#editorTabNutrition')).not.toBeVisible();
  });

  test('can reset plan to default', async ({ page }) => {
    await page.locator('#editPlanBtn').click();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#resetPlanBtn').click();
    const items = page.locator('.plan-exercise-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('closes the modal', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await expect(page.locator('#editorModal')).toHaveClass(/open/);
    await page.locator('#editorModalClose').click();
    await expect(page.locator('#editorModal')).not.toHaveClass(/open/);
  });
});

test.describe('Settings actions', () => {
  test('opens settings from bottom nav', async ({ page }) => {
    await page.locator('#bottomNav #settingsBtn').click();
    await expect(page.locator('#settingsModal')).toHaveClass(/open/);
  });

  test('clear period shows a confirmation dialog', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('#bottomNav #settingsBtn').click();
    await page.locator('#clearBtn').click();
    expect(dialogMessage).toBeTruthy();
  });

  test('logout button is visible in header', async ({ page }) => {
    await expect(page.locator('#lockBtn')).toBeVisible();
  });
});

test.describe('Monthly view', () => {
  test('renders day cells for the current month', async ({ page }) => {
    await page.locator('.bnav-item[data-view="month"]').click();
    await expect(page.locator('.month-cell').first()).toBeVisible();
    const cells = page.locator('.month-cell');
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(28);
    expect(count).toBeLessThanOrEqual(42);
  });

  test('clicking a day cell navigates to day view', async ({ page }) => {
    await page.locator('.bnav-item[data-view="month"]').click();
    await expect(page.locator('.month-cell').first()).toBeVisible();

    const inMonthCell = page.locator('.month-cell:not(.out)').first();
    const dayNum = await inMonthCell.locator('.day-num').textContent();
    await inMonthCell.click();

    await expect(page.locator('.bnav-item.active')).toHaveText('Day');
    await expect(page.locator('.day-head')).toBeVisible();
    await expect(page.locator('.day-head')).toContainText(dayNum!.trim());
  });
});
