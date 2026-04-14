import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Daily view — workout tracking', () => {
  test('shows lift and run checkboxes', async ({ page }) => {
    await expect(page.locator('.day-tracking .tag-lift')).toBeVisible();
    await expect(page.locator('.day-tracking .tag-run')).toBeVisible();
  });

  test('can check lift and run boxes', async ({ page }) => {
    const liftBox = page.locator('.day-tracking .check-row').first().locator('input[type="checkbox"]');
    await liftBox.check();
    await expect(liftBox).toBeChecked();
  });

  test('shows the workout plan for the day', async ({ page }) => {
    await expect(page.locator('.day-plan-section')).toBeVisible();
  });

  test('displays the day type badge', async ({ page }) => {
    await expect(page.locator('.day-type-badge')).toBeVisible();
  });
});

test.describe('Weight and reps logging', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows weight and reps inputs for Lift exercises', async ({ page }) => {
    const liftLogs = page.locator('.lift-log');
    const planItems = page.locator('.day-plan li.li-lift');
    const liftCount = await planItems.count();
    if (liftCount > 0) {
      await expect(liftLogs.first()).toBeVisible();
      const weightInput = liftLogs.first().locator('input[type="number"]');
      const repsInput = liftLogs.first().locator('input.reps-input');
      await expect(weightInput).toBeVisible();
      await expect(repsInput).toBeVisible();
    }
  });

  test('saves weight and reps on blur', async ({ page }) => {
    await page.locator('#navPrev').click();
    await expect(page.locator('.day-head')).toBeVisible();

    const liftLogs = page.locator('.lift-log');
    const count = await liftLogs.count();
    if (count === 0) return;

    const weightInput = liftLogs.first().locator('input[type="number"]');
    const repsInput = liftLogs.first().locator('input.reps-input');
    await weightInput.fill('185');
    await repsInput.fill('8,8,7,6');
    await repsInput.press('Tab');

    await expect(async () => {
      const stored = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('wt:v2:')) {
            const v = localStorage.getItem(k) || '';
            if (v.includes('"w":185')) return true;
          }
        }
        return false;
      });
      expect(stored).toBe(true);
    }).toPass({ timeout: 5000 });

    await page.locator('.seg-btn[data-view="week"]').click();
    await expect(page.locator('.week-grid')).toBeVisible();
    await page.locator('.seg-btn[data-view="day"]').click();
    await expect(page.locator('.lift-log').first()).toBeVisible();

    const newWeightInput = page.locator('.lift-log').first().locator('input[type="number"]');
    const newRepsInput = page.locator('.lift-log').first().locator('input.reps-input');
    await expect(newWeightInput).toHaveValue('185', { timeout: 10000 });
    await expect(newRepsInput).toHaveValue('8,8,7,6', { timeout: 10000 });
  });

  test('weight and reps persist across page reload', async ({ page }) => {
    await page.locator('#navPrev').click();
    await page.locator('#navPrev').click();
    await expect(page.locator('.day-head')).toBeVisible();

    const liftLogs = page.locator('.lift-log');
    const count = await liftLogs.count();
    if (count === 0) return;

    const weightInput = liftLogs.first().locator('input[type="number"]');
    const repsInput = liftLogs.first().locator('input.reps-input');
    await weightInput.fill('225');
    await repsInput.fill('5,5,4');
    await repsInput.press('Tab');

    await expect(async () => {
      const stored = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('wt:v2:')) {
            const v = localStorage.getItem(k) || '';
            if (v.includes('"w":225')) return true;
          }
        }
        return false;
      });
      expect(stored).toBe(true);
    }).toPass({ timeout: 5000 });

    await page.reload();
    await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.lift-log').first()).toBeVisible({ timeout: 5000 });

    const reloadedWeight = page.locator('.lift-log').first().locator('input[type="number"]');
    const reloadedReps = page.locator('.lift-log').first().locator('input.reps-input');
    await expect(reloadedWeight).toHaveValue('225', { timeout: 10000 });
    await expect(reloadedReps).toHaveValue('5,5,4', { timeout: 10000 });
  });

  test('does not show weight inputs for non-lift exercises', async ({ page }) => {
    const runItems = page.locator('.day-plan li.li-run');
    const runCount = await runItems.count();
    if (runCount > 0) {
      const nextSibling = runItems.first().locator('+ .lift-log');
      await expect(nextSibling).toHaveCount(0);
    }
  });
});
