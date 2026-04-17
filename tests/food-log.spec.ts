import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.describe.configure({ mode: 'serial' });

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

  test('manual entry add button is disabled until name and macro value filled', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#manualFoodAdd')).toBeDisabled();
    await page.locator('#manualFoodName').fill('Protein bar');
    await expect(page.locator('#manualFoodAdd')).toBeDisabled();
    await page.locator('#manualMacroInputs input').first().fill('20');
    await expect(page.locator('#manualFoodAdd')).toBeEnabled();
  });

  test('adds a food item via manual entry', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/, { timeout: 5000 });
    await page.locator('#manualFoodName').fill('Protein shake');
    await page.locator('#manualMacroInputs input').first().fill('30');
    await page.locator('#manualFoodAdd').click();

    await expect(page.locator('#foodModal')).not.toHaveClass(/open/, { timeout: 5000 });
    await expect(page.locator('.food-entry').last()).toBeVisible();
    await expect(page.locator('.food-entry-name').last()).toHaveText('Protein shake');
    await expect(page.locator('.food-entry').last().locator('.macro-pill').first()).toContainText('30');
  });

  test('adds a food item from search results', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/, { timeout: 5000 });
    await page.locator('#foodSearchInput').fill('chicken');
    await expect(page.locator('.modal-result').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.modal-result').first().click();

    await expect(page.locator('#foodModal')).not.toHaveClass(/open/, { timeout: 5000 });
    await expect(page.locator('.food-entry').last()).toBeVisible();
    await expect(page.locator('.food-entry-name').last()).toContainText(/chicken/i);
  });

  test('removes a food entry via delete button', async ({ page }) => {
    const countBefore = await page.locator('.food-entry').count();

    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/, { timeout: 5000 });
    await page.locator('#manualFoodName').fill('ZzzRemoveTest');
    await page.locator('#manualMacroInputs input').first().fill('77');
    await page.locator('#manualFoodAdd').click();
    await expect(page.locator('#foodModal')).not.toHaveClass(/open/, { timeout: 5000 });
    await expect(page.locator('.food-entry')).toHaveCount(countBefore + 1, { timeout: 5000 });

    await page.locator('.food-entry').last().locator('.food-entry-del').click();
    await expect(page.locator('.food-entry')).toHaveCount(countBefore, { timeout: 5000 });
  });

  test('updates the nutrition totals when foods are added', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/, { timeout: 5000 });
    await page.locator('#foodSearchInput').fill('chicken breast');
    await expect(page.locator('.modal-result').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.modal-result').first().click();
    await expect(page.locator('#foodModal')).not.toHaveClass(/open/, { timeout: 5000 });

    await expect(page.locator('.food-total-row .food-total-num').first()).toBeVisible({ timeout: 5000 });
    const totalText = await page.locator('.food-total-row .food-total-num').first().textContent();
    expect(totalText).toMatch(/\d+/);
    const val = parseInt(totalText!);
    expect(val).toBeGreaterThan(0);
  });
});

test.describe('Nutrition goal (via editor modal Nutrition tab)', () => {
  test('updates protein goal via Nutrition tab and persists', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    await expect(page.locator('#nutritionGoalList')).toBeVisible();

    const goalInput = page.locator('#nutritionGoalList .settings-goal-input').first();
    await goalInput.fill('180');
    await page.locator('#nutritionSaveBtn').click();

    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    const updatedInput = page.locator('#nutritionGoalList .settings-goal-input').first();
    await expect(updatedInput).toHaveValue('180');
  });
});

test.describe('Custom food library', () => {
  test('shows empty state in My Foods', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('wt:customFoods'));
    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    await expect(page.locator('.my-food-empty')).toBeVisible();
  });

  test('adds a custom food via the My Foods form', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('wt:customFoods'));
    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    await page.locator('#addMyFoodBtn').click();
    await page.locator('#myFoodNameInput').fill('My Protein Shake');
    await page.locator('#myFoodMacroInputs input').first().fill('30');
    await page.locator('#myFoodSaveItemBtn').click();

    await expect(page.locator('.my-food-card-name', { hasText: 'My Protein Shake' })).toBeVisible();
  });

  test('deletes a custom food', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wt:customFoods', JSON.stringify([
        { id: 'test1', name: 'Delete Me Food', p: 20, cal: 100, fat: 0, carb: 0, sugar: 0, fiber: 0, sodium: 0 }
      ]));
    });
    await page.locator('#editPlanBtn').click();
    await page.locator('.editor-tab[data-tab="nutrition"]').click();
    await expect(page.locator('.my-food-card-name', { hasText: 'Delete Me Food' })).toBeVisible();
    await page.locator('.my-food-card-btn.del').first().click();
    await expect(page.locator('.my-food-card-name', { hasText: 'Delete Me Food' })).toHaveCount(0);
  });

  test('custom foods appear in food search results', async ({ page }) => {
    await page.evaluate(() => {
      var existing = [];
      try { existing = JSON.parse(localStorage.getItem('wt:customFoods') || '[]'); } catch (e) { /* ignore */ }
      existing.push({ id: 'srch1', name: 'UniqueCustomShake', p: 40, cal: 200, fat: 3, carb: 5, sugar: 1, fiber: 0, sodium: 50 });
      localStorage.setItem('wt:customFoods', JSON.stringify(existing));
    });
    await page.locator('.food-add-btn').click();
    await page.locator('#foodSearchInput').fill('UniqueCustom');
    await expect(page.locator('.modal-result-name', { hasText: 'UniqueCustomShake' })).toBeVisible();
  });

  test('save-to-library prompt appears after adding a food', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await page.locator('#manualFoodName').fill('PromptTestFood');
    await page.locator('#manualMacroInputs input').first().fill('25');
    await page.locator('#manualFoodAdd').click();
    await expect(page.locator('.save-food-overlay')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.save-food-detail')).toContainText('PromptTestFood');
  });
});

test.describe('Barcode scanner UI', () => {
  test('scan button is visible in food modal on HTTPS / localhost', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#foodModal')).toHaveClass(/open/);
    const scanBtn = page.locator('#scanBarcodeBtn');
    const scanRow = page.locator('#scanRow');
    const isVisible = await scanRow.isVisible();
    if (isVisible) {
      await expect(scanBtn).toBeVisible();
      await expect(scanBtn).toContainText('Scan barcode');
    }
  });

  test('scanner viewfinder is hidden by default', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    await expect(page.locator('#scannerWrap')).not.toBeVisible();
  });

  test('cancel button stops scanner and re-shows scan button', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    const scanRow = page.locator('#scanRow');
    if (await scanRow.isVisible()) {
      await page.locator('#scanBarcodeBtn').click();
      await expect(page.locator('#scannerWrap')).toBeVisible();
      await page.locator('#scannerCancel').click();
      await expect(page.locator('#scannerWrap')).not.toBeVisible();
    }
  });

  test('closing food modal stops scanner', async ({ page }) => {
    await page.locator('.food-add-btn').click();
    const scanRow = page.locator('#scanRow');
    if (await scanRow.isVisible()) {
      await page.locator('#scanBarcodeBtn').click();
      await expect(page.locator('#scannerWrap')).toBeVisible();
    }
    await page.locator('#foodModalClose').click();
    await expect(page.locator('#scannerWrap')).not.toBeVisible();
  });

  test('lookupBarcode rejects invalid barcode format', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise<{ food: any; err: string | null }>((resolve) => {
        (window as any).WT.lookupBarcode('abc', (food: any, err: string | null) => {
          resolve({ food, err });
        });
      });
    });
    expect(result.food).toBeNull();
    expect(result.err).toBe('Invalid barcode format');
  });

  test('lookupBarcode accepts valid barcode and calls API', async ({ page }) => {
    await page.route('**/world.openfoodfacts.org/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 1,
          product: {
            product_name: 'Test Granola Bar',
            nutriments: {
              proteins_serving: 10,
              'energy-kcal_serving': 200,
              fat_serving: 8,
              carbohydrates_serving: 25,
              sugars_serving: 12,
              fiber_serving: 3,
              sodium_serving: 0.15
            },
            serving_size: '40g'
          }
        })
      });
    });

    const result = await page.evaluate(() => {
      return new Promise<{ food: any; err: string | null }>((resolve) => {
        (window as any).WT.lookupBarcode('0123456789012', (food: any, err: string | null) => {
          resolve({ food, err });
        });
      });
    });
    expect(result.err).toBeNull();
    expect(result.food).toBeTruthy();
    expect(result.food.name).toBe('Test Granola Bar');
    expect(result.food.p).toBe(10);
    expect(result.food.cal).toBe(200);
    expect(result.food.src).toBe('Open Food Facts');
  });

  test('lookupBarcode falls back to USDA when OFF has no product', async ({ page }) => {
    await page.route('**/world.openfoodfacts.org/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 0 })
      });
    });
    await page.route('**/api.nal.usda.gov/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          foods: [{
            description: 'USDA Fallback Bar',
            servingSize: 100,
            servingSizeUnit: 'g',
            foodNutrients: [
              { nutrientId: 1003, value: 15 },
              { nutrientId: 1008, value: 250 }
            ]
          }]
        })
      });
    });

    const result = await page.evaluate(() => {
      return new Promise<{ food: any; err: string | null }>((resolve) => {
        (window as any).WT.lookupBarcode('0123456789012', (food: any, err: string | null) => {
          resolve({ food, err });
        });
      });
    });
    expect(result.err).toBeNull();
    expect(result.food).toBeTruthy();
    expect(result.food.name).toBe('USDA Fallback Bar');
    expect(result.food.src).toBe('USDA');
  });
});
