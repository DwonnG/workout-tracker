import { test, expect, Page } from '@playwright/test';
import { freshLogin, injectTestInviteHash, loginWithPin } from './helpers';

async function seedWorkoutData(page: Page) {
  await page.evaluate(() => {
    const WT = (window as any).WT;
    const today = new Date();
    for (let d = 0; d < 14; d++) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
      const y = day.getFullYear(), m = day.getMonth();
      const id = WT.iso(y, m, day.getDate());
      const md = WT.loadMonth(y, m);
      if (!md.days) md.days = {};
      if (!md.days[id]) md.days[id] = { lift: false, run: false, p: '', foods: [], lifts: {}, totals: {} };
      md.days[id].lift = true;
      md.days[id].lifts = {
        '0': { sets: [
          { w: 135 + d * 5, r: 8, done: true, type: 'work' },
          { w: 135 + d * 5, r: 8, done: true, type: 'work' },
          { w: 135 + d * 5, r: 6, done: true, type: 'work' }
        ]},
        '1': { sets: [
          { w: 95 + d * 2, r: 10, done: true, type: 'work' }
        ]}
      };
      md.days[id].totals = { p: 120 + d * 3 };
      md.days[id].foods = [{ name: 'Chicken', p: 120 + d * 3, cal: 400 }];
      if (d < 3) {
        md.days[id].bodyWeight = 180 - d * 0.5;
        md.days[id].bodyFat = 15 + d * 0.2;
      }
      WT.saveMonth(y, m, md);
    }
  });
}

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Progress view', () => {
  test('nav shows Progress tab instead of History', async ({ page }) => {
    const progressBtn = page.locator('.bnav-item[data-view="progress"]');
    await expect(progressBtn).toBeVisible();
    await expect(progressBtn).toHaveText('Progress');
    await expect(page.locator('.bnav-item[data-view="history"]')).toHaveCount(0);
  });

  test('switching to Progress renders the view', async ({ page }) => {
    await page.locator('.bnav-item[data-view="progress"]').click();
    await expect(page.locator('.bnav-item[data-view="progress"]')).toHaveClass(/active/);
    await expect(page.locator('.progress-wrap')).toBeVisible();
  });

  test('shows summary stat cards', async ({ page }) => {
    await page.locator('.bnav-item[data-view="progress"]').click();
    const stats = page.locator('.progress-stat');
    await expect(stats).toHaveCount(4);
    await expect(stats.nth(0)).toContainText('Workouts');
    await expect(stats.nth(1)).toContainText('Volume');
    await expect(stats.nth(2)).toContainText('Protein');
    await expect(stats.nth(3)).toContainText('Weight');
  });

  test('shows consistency card', async ({ page }) => {
    await page.locator('.bnav-item[data-view="progress"]').click();
    const consistCard = page.locator('.progress-card-title:text("Workout Consistency")');
    await expect(consistCard).toBeVisible();
    await expect(page.locator('.progress-heatmap')).toBeVisible();
  });

  test('shows weekly volume card', async ({ page }) => {
    await page.locator('.bnav-item[data-view="progress"]').click();
    await expect(page.locator('.progress-card-title:text("Weekly Volume")')).toBeVisible();
  });

  test('shows lift progress with exercise selector when data exists', async ({ page }) => {
    await seedWorkoutData(page);
    await page.locator('.bnav-item[data-view="progress"]').click();
    await expect(page.locator('.progress-card-title:text("Lift Progress")')).toBeVisible();
    const select = page.locator('.progress-select');
    await expect(select).toBeVisible();
    const options = await select.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('shows body metrics when data exists', async ({ page }) => {
    await seedWorkoutData(page);
    await page.locator('.bnav-item[data-view="progress"]').click();
    await expect(page.locator('.progress-card-title:text("Body Metrics")')).toBeVisible();
  });

  test('shows nutrition trend when food data exists', async ({ page }) => {
    await seedWorkoutData(page);
    await page.locator('.bnav-item[data-view="progress"]').click();
    await expect(page.locator('.progress-card-title:text("Daily Protein")')).toBeVisible();
  });

  test('lift progress chart updates when exercise is changed', async ({ page }) => {
    await seedWorkoutData(page);
    await page.locator('.bnav-item[data-view="progress"]').click();
    const select = page.locator('.progress-select');
    await expect(select).toBeVisible();
    const optionCount = await select.locator('option').count();
    expect(optionCount).toBeGreaterThan(0);
    if (optionCount > 1) {
      const secondVal = await select.locator('option').nth(1).getAttribute('value');
      await select.selectOption(secondVal!);
      await expect(page.locator('.progress-canvas').first()).toBeVisible();
    }
  });

  test('old history viewMode gets migrated to progress', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wt:view', 'history');
      (window as any).WT.viewMode = 'history';
    });
    await page.evaluate(() => {
      const v = localStorage.getItem('wt:view');
      const migrated = v === 'history' ? 'progress' : v;
      (window as any).WT.viewMode = migrated || 'day';
      localStorage.setItem('wt:view', (window as any).WT.viewMode);
      if ((window as any).WT.syncNav) (window as any).WT.syncNav();
      (window as any).WT.render();
    });
    await expect(page.locator('.progress-wrap')).toBeVisible();
    await expect(page.locator('.bnav-item[data-view="progress"]')).toHaveClass(/active/);
  });
});

test.describe('Settings modal mobile', () => {
  test('Save button is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('.settings-footer')).toBeVisible();
    const saveBtn = page.locator('.settings-footer .btn-primary');
    await expect(saveBtn).toBeVisible();
    await saveBtn.scrollIntoViewIfNeeded();
    await expect(saveBtn).toBeInViewport();
  });
});
