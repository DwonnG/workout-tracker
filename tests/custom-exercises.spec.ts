import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
  await page.evaluate(() => {
    localStorage.removeItem('wt:customExercises');
    if ((window as any).WT) (window as any).WT._searchIndex = null;
  });
});

async function openPickerViaUI(page: import('@playwright/test').Page) {
  await page.locator('#editPlanBtn').click();
  await expect(page.locator('#editorModal')).toHaveClass(/open/);
  const planFields = page.locator('#planFields');
  await planFields.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(300);
  const addBtn = planFields.locator('.plan-add-exercise-btn').last();
  await addBtn.click({ force: true });
  await expect(page.locator('#exercisePickerModal')).toHaveClass(/open/, { timeout: 5000 });
}

test.describe('Custom exercise library', () => {
  test('typing a custom name and clicking Add opens the custom exercise form', async ({ page }) => {
    await openPickerViaUI(page);

    await page.locator('#exercisePickerCustom').fill('C25K Run');
    await page.locator('#exercisePickerCustomAdd').click();

    await expect(page.locator('.custom-ex-overlay')).toBeVisible();
    await expect(page.locator('.custom-ex-name')).toContainText('C25K Run');
  });

  test('"Save & Add" saves the exercise to the library', async ({ page }) => {
    await openPickerViaUI(page);

    await page.locator('#exercisePickerCustom').fill('Tempo Squats');
    await page.locator('#exercisePickerCustomAdd').click();
    await expect(page.locator('.custom-ex-overlay')).toBeVisible();

    await page.locator('.custom-ex-select').selectOption('lift');
    await page.locator('.custom-ex-muscle-chip:text("Quads")').click();
    await page.locator('.custom-ex-save').click();

    await expect(page.locator('.custom-ex-overlay')).not.toBeVisible();

    await expect(async () => {
      const stored = await page.evaluate(() => localStorage.getItem('wt:customExercises'));
      expect(stored).toBeTruthy();
      expect(stored!.toLowerCase()).toContain('tempo squats');
    }).toPass({ timeout: 5000 });
  });

  test('"Just Add Once" does not save to library', async ({ page }) => {
    await openPickerViaUI(page);

    await page.locator('#exercisePickerCustom').fill('One-Time Drill');
    await page.locator('#exercisePickerCustomAdd').click();
    await expect(page.locator('.custom-ex-overlay')).toBeVisible();

    await page.locator('.custom-ex-cancel').click();
    await expect(page.locator('.custom-ex-overlay')).not.toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('wt:customExercises'));
    const hasIt = stored ? stored.toLowerCase().includes('one-time drill') : false;
    expect(hasIt).toBe(false);
  });

  test('saved custom exercise shows "custom" tag and appears under My Exercises', async ({ page }) => {
    await openPickerViaUI(page);

    await page.locator('#exercisePickerCustom').fill('My Tagged Run');
    await page.locator('#exercisePickerCustomAdd').click();
    await expect(page.locator('.custom-ex-overlay')).toBeVisible();
    await page.locator('.custom-ex-select').selectOption('cardio');
    await page.locator('.custom-ex-save').click();
    await expect(page.locator('.custom-ex-overlay')).not.toBeVisible();

    await page.locator('.ep-filter:text("My Exercises")').click();
    const customRow = page.locator('.ep-row.ep-custom').filter({ hasText: /my tagged run/i });
    await expect(customRow).toBeVisible({ timeout: 5000 });
    await expect(customRow.locator('.ep-custom-tag')).toBeVisible();
  });

  test('delete button removes a custom exercise', async ({ page }) => {
    await openPickerViaUI(page);

    await page.locator('#exercisePickerCustom').fill('Delete Me Exercise');
    await page.locator('#exercisePickerCustomAdd').click();
    await expect(page.locator('.custom-ex-overlay')).toBeVisible();
    await page.locator('.custom-ex-save').click();
    await expect(page.locator('.custom-ex-overlay')).not.toBeVisible();

    await page.locator('.ep-filter:text("My Exercises")').click();
    const row = page.locator('.ep-row').filter({ hasText: /delete me exercise/i });
    await expect(row).toBeVisible();

    await row.locator('.ep-row-del').click();
    await expect(row).not.toBeVisible();

    await expect(async () => {
      const stored = await page.evaluate(() => localStorage.getItem('wt:customExercises'));
      const list: any[] = stored ? JSON.parse(stored) : [];
      const hasDeleted = list.some((e: any) => e.name.toLowerCase().includes('delete me'));
      expect(hasDeleted).toBe(false);
    }).toPass({ timeout: 5000 });
  });

  test('custom exercises persist in localStorage', async ({ page }) => {
    await openPickerViaUI(page);

    await page.locator('#exercisePickerCustom').fill('Persistent Exercise');
    await page.locator('#exercisePickerCustomAdd').click();
    await expect(page.locator('.custom-ex-overlay')).toBeVisible();
    await page.locator('.custom-ex-select').selectOption('cardio');
    await page.locator('.custom-ex-save').click();
    await expect(page.locator('.custom-ex-overlay')).not.toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('wt:customExercises'));
    expect(stored).toBeTruthy();
    expect(stored!.toLowerCase()).toContain('persistent exercise');
  });
});
