import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Daily view — workout tracking', () => {
  test('does not show a LIFT checkbox (auto-detected)', async ({ page }) => {
    await expect(page.locator('.day-tracking .tag-lift')).toHaveCount(0);
  });

  test('shows RUN checkbox only on days with a run in the plan', async ({ page }) => {
    const hasRun = await page.locator('.day-plan li.li-run').count();
    if (hasRun > 0) {
      await expect(page.locator('.day-tracking .tag-run')).toBeVisible();
    } else {
      await expect(page.locator('.day-tracking .tag-run')).toHaveCount(0);
    }
  });

  test('auto-detects lift completion when a set is marked done', async ({ page }) => {
    const setTables = page.locator('.set-table');
    const count = await setTables.count();
    if (count === 0) return;

    const doneBtn = setTables.first().locator('.set-done-btn').first();
    await doneBtn.click();

    await expect(async () => {
      const liftDetected = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('wt:v2:')) {
            const v = localStorage.getItem(k) || '';
            if (v.includes('"lift":true')) return true;
          }
        }
        return false;
      });
      expect(liftDetected).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('shows the workout plan for the day', async ({ page }) => {
    await expect(page.locator('.day-plan-section').first()).toBeVisible();
  });

  test('displays the day type badge', async ({ page }) => {
    await expect(page.locator('.day-type-badge')).toBeVisible();
  });
});

test.describe('Weight and reps logging', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows set table with weight and reps inputs for Lift exercises', async ({ page }) => {
    const setTables = page.locator('.set-table');
    const planItems = page.locator('.day-plan li.li-lift');
    const liftCount = await planItems.count();
    if (liftCount > 0) {
      await expect(setTables.first()).toBeVisible();
      const weightInput = setTables.first().locator('input.set-w-col').first();
      const repsInput = setTables.first().locator('input.set-r-col').first();
      await expect(weightInput).toBeVisible();
      await expect(repsInput).toBeVisible();
    }
  });

  test('saves weight and reps on change', async ({ page }) => {
    await page.locator('#navPrev').click();
    await expect(page.locator('.day-head')).toBeVisible();

    const setTables = page.locator('.set-table');
    const count = await setTables.count();
    if (count === 0) return;

    const weightInput = setTables.first().locator('input.set-w-col').first();
    const repsInput = setTables.first().locator('input.set-r-col').first();
    await weightInput.fill('185');
    await weightInput.dispatchEvent('change');
    await repsInput.fill('8');
    await repsInput.dispatchEvent('change');

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

    await page.locator('.bnav-item[data-view="week"]').click();
    await expect(page.locator('.week-grid')).toBeVisible();
    await page.locator('.bnav-item[data-view="day"]').click();
    await expect(page.locator('.set-table').first()).toBeVisible();

    const newWeightInput = page.locator('.set-table').first().locator('input.set-w-col').first();
    const newRepsInput = page.locator('.set-table').first().locator('input.set-r-col').first();
    await expect(newWeightInput).toHaveValue('185', { timeout: 10000 });
    await expect(newRepsInput).toHaveValue('8', { timeout: 10000 });
  });

  test('weight and reps persist across page reload', async ({ page }) => {
    await page.locator('#navPrev').click();
    await page.locator('#navPrev').click();
    await expect(page.locator('.day-head')).toBeVisible();

    const setTables = page.locator('.set-table');
    const count = await setTables.count();
    if (count === 0) return;

    const weightInput = setTables.first().locator('input.set-w-col').first();
    const repsInput = setTables.first().locator('input.set-r-col').first();
    await weightInput.fill('225');
    await weightInput.dispatchEvent('change');
    await repsInput.fill('5');
    await repsInput.dispatchEvent('change');

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
    await expect(page.locator('.set-table').first()).toBeVisible({ timeout: 5000 });

    const reloadedWeight = page.locator('.set-table').first().locator('input.set-w-col').first();
    const reloadedReps = page.locator('.set-table').first().locator('input.set-r-col').first();
    await expect(reloadedWeight).toHaveValue('225', { timeout: 10000 });
    await expect(reloadedReps).toHaveValue('5', { timeout: 10000 });
  });

  test('does not show set table for non-lift exercises', async ({ page }) => {
    const runItems = page.locator('.day-plan li.li-run');
    const runCount = await runItems.count();
    if (runCount > 0) {
      const nextSibling = runItems.first().locator('+ .set-table');
      await expect(nextSibling).toHaveCount(0);
    }
  });
});
