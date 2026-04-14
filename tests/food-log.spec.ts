import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Protein food log', () => {
  test('shows the protein log section with Add Food button', async ({ page }) => {
    await expect(page.locator('.food-log')).toBeVisible();
    await expect(page.locator('.food-add-btn')).toBeVisible();
  });

  test('opens the food search modal when Add Food is clicked', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/);
    await expect(page.locator('#manualFoodName')).toBeFocused();
  });

  test('closes modal via X button', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/);
    await page.locator('#foodModalClose').click();
    await expect(page.locator('#foodModal')).not.toHaveClass(/open/);
  });

  test('closes modal via Escape key', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/);
    await page.locator('#foodSearchInput').press('Escape');
    await expect(page.locator('#foodModal')).not.toHaveClass(/open/);
  });

  test('closes modal by clicking overlay backdrop', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/);
    await page.locator('#foodModal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#foodModal')).not.toHaveClass(/open/);
  });

  test('searches local foods and shows results', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await page.locator('#foodSearchInput').fill('chicken');
    await expect(page.locator('.modal-result').first()).toBeVisible();
    const firstResult = page.locator('.modal-result-name').first();
    await expect(firstResult).toContainText(/chicken/i);
  });

  test('manual entry add button is disabled until name and protein filled', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#manualFoodAdd')).toBeDisabled();
    await page.locator('#manualFoodName').fill('Protein bar');
    await expect(page.locator('#manualFoodAdd')).toBeDisabled();
    await page.locator('#manualFoodProtein').fill('20');
    await expect(page.locator('#manualFoodAdd')).toBeEnabled();
  });

  test('adds a food item via manual entry', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await page.locator('#manualFoodName').fill('Protein shake');
    await page.locator('#manualFoodProtein').fill('30');
    await page.locator('#manualFoodAdd').click();

    await expect(page.locator('#foodModal')).not.toHaveClass(/open/);
    await expect(page.locator('.food-entry').last()).toBeVisible();
    await expect(page.locator('.food-entry-name').last()).toHaveText('Protein shake');
    await expect(page.locator('.food-entry-protein').last()).toHaveText('30g');
  });

  test('adds a food item from search results', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await page.locator('#foodSearchInput').fill('chicken');
    await page.locator('.modal-result').first().click();

    await expect(page.locator('#foodModal')).not.toHaveClass(/open/);
    await expect(page.locator('.food-entry').last()).toBeVisible();
    await expect(page.locator('.food-entry-name').last()).toContainText(/chicken/i);
  });

  test('removes a food entry via delete button', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await page.locator('#manualFoodName').fill('DeleteMe Snack');
    await page.locator('#manualFoodProtein').fill('99');
    await page.locator('#manualFoodAdd').click();

    const entry = page.locator('.food-entry-name', { hasText: 'DeleteMe Snack' });
    await expect(entry).toBeVisible();
    await entry.locator('..').locator('.food-entry-del').click();
    await expect(entry).toHaveCount(0);
  });

  test('updates the protein total when foods are added', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await page.locator('#foodSearchInput').fill('chicken breast');
    await page.locator('.modal-result').first().click();

    const totalText = await page.locator('.food-total-num').textContent();
    expect(totalText).toMatch(/\d+g/);
    const grams = parseInt(totalText!.replace('g', ''));
    expect(grams).toBeGreaterThan(0);
  });
});

test.describe('Protein goal', () => {
  test('updates protein goal and persists across view switches', async ({ page }) => {
    const goalInput = page.locator('#proteinGoal');
    await goalInput.fill('180');
    await goalInput.dispatchEvent('change');
    await expect(page.locator('.food-total')).toBeVisible();

    await page.locator('.seg-btn[data-view="week"]').click();
    await page.locator('.seg-btn[data-view="day"]').click();
    await expect(goalInput).toHaveValue('180');
  });
});
