import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Workout type labels in plan editor', () => {
  test('each plan day shows a workout type dropdown', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await expect(page.locator('#editorModal')).toHaveClass(/open/);
    const selects = page.locator('.plan-type-select');
    await expect(selects).toHaveCount(7);
  });

  test('workout type dropdown has expected options', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    const firstSelect = page.locator('.plan-type-select').first();
    const options = firstSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(10);

    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push(await options.nth(i).getAttribute('value') || '');
    }
    expect(values).toContain('Push');
    expect(values).toContain('Pull');
    expect(values).toContain('Legs');
    expect(values).toContain('Rest');
    expect(values).toContain('Upper');
    expect(values).toContain('Lower');
    expect(values).toContain('Full Body');
    expect(values).toContain('Cardio');
  });

  test('changing workout type persists after save', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    const firstSelect = page.locator('.plan-type-select').first();
    const originalValue = await firstSelect.inputValue();

    const newValue = originalValue === 'Upper' ? 'Lower' : 'Upper';
    await firstSelect.selectOption(newValue);

    await page.locator('#savePlanBtn').click();
    await expect(page.locator('#editorModal')).not.toHaveClass(/open/);

    const stored = await page.evaluate(() => localStorage.getItem('wt:dayLabels'));
    expect(stored).toBeTruthy();
    expect(stored).toContain(newValue);
  });

  test('day type badge reflects the configured label', async ({ page }) => {
    await page.evaluate(() => {
      const labels = { 0: 'Rest', 1: 'Upper', 2: 'Lower', 3: 'Legs', 4: 'Upper', 5: 'Lower', 6: 'Cardio' };
      localStorage.setItem('wt:dayLabels', JSON.stringify(labels));
    });
    await page.reload();
    await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });

    const badge = page.locator('.day-type-badge');
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    const dow = new Date().getDay();
    const expected: Record<number, string> = { 0: 'Rest', 1: 'Upper', 2: 'Lower', 3: 'Legs', 4: 'Upper', 5: 'Lower', 6: 'Cardio' };
    expect(text).toBe(expected[dow]);
  });
});
