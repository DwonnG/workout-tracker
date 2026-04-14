import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Page load and layout', () => {
  test('renders the page title and header', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('Workout Tracker');
  });

  test('shows the sync indicator', async ({ page }) => {
    await expect(page.locator('#syncDot')).toBeVisible();
  });

  test('displays the protein goal input', async ({ page }) => {
    const goalInput = page.locator('#proteinGoal');
    await expect(goalInput).toBeVisible();
    const val = await goalInput.inputValue();
    expect(Number(val)).toBeGreaterThan(0);
  });

  test('renders the calendar container', async ({ page }) => {
    await expect(page.locator('#calendar')).toBeVisible();
  });

  test('shows the stats row', async ({ page }) => {
    await expect(page.locator('#statsRow')).toBeVisible();
  });

  test('shows the Today button', async ({ page }) => {
    await expect(page.locator('#navToday')).toBeVisible();
    await expect(page.locator('#navToday')).toHaveText('Today');
  });
});

test.describe('Number input spinners hidden', () => {
  test('protein goal input has no visible spinners', async ({ page }) => {
    const goalInput = page.locator('#proteinGoal');
    const appearance = await goalInput.evaluate(
      (el) => window.getComputedStyle(el).getPropertyValue('appearance')
    );
    expect(appearance).toBe('textfield');
  });
});

test.describe('Accessibility basics', () => {
  test('navigation buttons have aria-labels', async ({ page }) => {
    await expect(page.locator('#navPrev')).toHaveAttribute('aria-label');
    await expect(page.locator('#navNext')).toHaveAttribute('aria-label');
    await expect(page.locator('#menuBtn')).toHaveAttribute('aria-label');
  });

  test('page has a heading', async ({ page }) => {
    const h1 = page.locator('h1.page-title');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Workout Tracker');
  });
});
