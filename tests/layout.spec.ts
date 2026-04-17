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

test.describe('Accessibility basics', () => {
  test('navigation buttons have aria-labels', async ({ page }) => {
    await expect(page.locator('#navPrev')).toHaveAttribute('aria-label');
    await expect(page.locator('#navNext')).toHaveAttribute('aria-label');
    await expect(page.locator('#editPlanBtn')).toHaveAttribute('aria-label');
  });

  test('page has a heading', async ({ page }) => {
    const h1 = page.locator('h1.page-title');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Workout Tracker');
  });
});
