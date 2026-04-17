import { test, expect } from '@playwright/test';
import { freshLogin } from './helpers';

const PLAN_KEY = 'wt:plan:v2';

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('Warm Up / Cool Down sections', () => {
  test('day view has Warm Up, Today\'s Plan, and Cool Down sections', async ({ page }) => {
    const warmup = page.locator('.day-section-warmup');
    const cooldown = page.locator('.day-section-cooldown');
    const todayPlan = page.locator('.day-plan-section').filter({ hasText: "Today's Plan" });

    await expect(warmup).toBeVisible();
    await expect(cooldown).toBeVisible();
    await expect(todayPlan).toBeVisible();
  });

  test('each section has its own Add Exercise button', async ({ page }) => {
    const warmupBtn = page.locator('.day-section-warmup .plan-add-exercise-btn');
    const cooldownBtn = page.locator('.day-section-cooldown .plan-add-exercise-btn');

    await expect(warmupBtn).toBeVisible();
    await expect(cooldownBtn).toBeVisible();
  });

  test('warm up add-exercise opens picker without category filter', async ({ page }) => {
    const warmupBtn = page.locator('.day-section-warmup .plan-add-exercise-btn');
    await warmupBtn.click();
    await expect(page.locator('#exercisePickerModal')).toHaveClass(/open/, { timeout: 5000 });

    const activeFilter = page.locator('.ep-filter.active');
    await expect(activeFilter).toHaveText('All');
  });

  test('exercise added from warm up section gets Warm Up prefix', async ({ page }) => {
    const warmupBtn = page.locator('.day-section-warmup .plan-add-exercise-btn');
    await warmupBtn.click();
    await expect(page.locator('#exercisePickerModal')).toHaveClass(/open/, { timeout: 5000 });

    const firstRow = page.locator('.ep-row').first();
    await firstRow.locator('.ep-row-add').click();

    await expect(async () => {
      const plan = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, PLAN_KEY);
      expect(plan).toBeTruthy();
      const today = new Date().getDay();
      const dayLines: string[] = plan[String(today)] || [];
      const hasWarmUpLine = dayLines.some((l: string) => l.startsWith('Warm Up:'));
      expect(hasWarmUpLine).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('exercise added from cool down section gets Cool Down prefix', async ({ page }) => {
    const cooldownBtn = page.locator('.day-section-cooldown .plan-add-exercise-btn');
    await cooldownBtn.click();
    await expect(page.locator('#exercisePickerModal')).toHaveClass(/open/, { timeout: 5000 });

    const firstRow = page.locator('.ep-row').first();
    await firstRow.locator('.ep-row-add').click();

    await expect(async () => {
      const plan = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, PLAN_KEY);
      expect(plan).toBeTruthy();
      const today = new Date().getDay();
      const dayLines: string[] = plan[String(today)] || [];
      const hasCoolDownLine = dayLines.some((l: string) => l.startsWith('Cool Down:'));
      expect(hasCoolDownLine).toBe(true);
    }).toPass({ timeout: 5000 });
  });
});

test.describe('No warmup/cooldown exercise categories', () => {
  test('exercise picker filter chips do not include Warm Up or Cool Down', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await expect(page.locator('#editorModal')).toHaveClass(/open/);
    const planFields = page.locator('#planFields');
    await planFields.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);
    const addBtn = planFields.locator('.plan-add-exercise-btn').last();
    await addBtn.click({ force: true });
    await expect(page.locator('#exercisePickerModal')).toHaveClass(/open/, { timeout: 5000 });

    const filters = page.locator('.ep-filter');
    const filterTexts = await filters.allTextContents();
    expect(filterTexts).not.toContain('Warm Up');
    expect(filterTexts).not.toContain('Cool Down');
    expect(filterTexts).toContain('Run');
    expect(filterTexts).toContain('Cardio');
    expect(filterTexts).toContain('Conditioning');
  });

  test('custom exercise form category dropdown lacks warmup/cooldown', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await expect(page.locator('#editorModal')).toHaveClass(/open/);
    const planFields = page.locator('#planFields');
    await planFields.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);
    const addBtn = planFields.locator('.plan-add-exercise-btn').last();
    await addBtn.click({ force: true });
    await expect(page.locator('#exercisePickerModal')).toHaveClass(/open/, { timeout: 5000 });

    await page.locator('#exercisePickerCustom').fill('Test Exercise XYZ');
    await page.locator('#exercisePickerCustomAdd').click();
    await expect(page.locator('.custom-ex-overlay')).toBeVisible();

    const options = await page.locator('.custom-ex-select option').allTextContents();
    expect(options).not.toContain('Warm Up');
    expect(options).not.toContain('Cool Down');
    expect(options).toContain('Lift');
    expect(options).toContain('Run');
    expect(options).toContain('Cardio');
    expect(options).toContain('Core');
    expect(options).toContain('Conditioning');
  });
});

test.describe('Title case display', () => {
  test('plan editor shows exercise names in title case', async ({ page }) => {
    await page.locator('#editPlanBtn').click();
    await expect(page.locator('#editorModal')).toHaveClass(/open/);

    const exerciseTexts = page.locator('.plan-ex-text');
    const count = await exerciseTexts.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await exerciseTexts.nth(i).textContent();
      if (!text) continue;
      const parts = text.split(/:\s*/);
      const name = parts.length > 1 ? parts[1] : parts[0];
      const firstWord = name.trim().split(/\s+/)[0];
      if (!firstWord || /^\d/.test(firstWord)) continue;
      expect(firstWord[0]).toBe(firstWord[0].toUpperCase());
    }
  });

  test('day view shows exercise names in title case', async ({ page }) => {
    const dayPlanItems = page.locator('.day-plan li');
    const count = await dayPlanItems.count();
    if (count === 0) return;

    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await dayPlanItems.nth(i).textContent();
      if (!text) continue;
      const parts = text.split(/:\s*/);
      const name = parts.length > 1 ? parts[1] : parts[0];
      const firstWord = name.trim().split(/\s+/)[0];
      if (!firstWord || /^\d/.test(firstWord)) continue;
      expect(firstWord[0]).toBe(firstWord[0].toUpperCase());
    }
  });
});

test.describe('Plan line normalization', () => {
  test('old warm-up: prefix gets normalized to Warm Up:', async ({ page }) => {
    await page.evaluate((key) => {
      const plan = {
        '0': [], '1': ['warm-up: jump rope 2min', 'Lift: Bench Press 4\u00d78'],
        '2': [], '3': [], '4': [], '5': [], '6': []
      };
      localStorage.setItem(key, JSON.stringify(plan));
    }, PLAN_KEY);
    await page.reload();
    await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });

    await expect(async () => {
      const plan = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, PLAN_KEY);
      expect(plan).toBeTruthy();
      const day1: string[] = plan['1'] || [];
      const normalized = day1.some((l: string) => l.startsWith('Warm Up:'));
      expect(normalized).toBe(true);
      const hasOld = day1.some((l: string) => l.startsWith('warm-up:'));
      expect(hasOld).toBe(false);
    }).toPass({ timeout: 5000 });
  });

  test('old finisher: prefix gets normalized to Conditioning:', async ({ page }) => {
    await page.evaluate((key) => {
      const plan = {
        '0': [], '1': ['Finisher: battle ropes 6 rounds', 'Lift: Bench Press 4\u00d78'],
        '2': [], '3': [], '4': [], '5': [], '6': []
      };
      localStorage.setItem(key, JSON.stringify(plan));
    }, PLAN_KEY);
    await page.reload();
    await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });

    await expect(async () => {
      const plan = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, PLAN_KEY);
      expect(plan).toBeTruthy();
      const day1: string[] = plan['1'] || [];
      const normalized = day1.some((l: string) => l.startsWith('Conditioning:'));
      expect(normalized).toBe(true);
      const hasOld = day1.some((l: string) => /^finisher:/i.test(l));
      expect(hasOld).toBe(false);
    }).toPass({ timeout: 5000 });
  });

  test('old cool-down: prefix gets normalized to Cool Down:', async ({ page }) => {
    await page.evaluate((key) => {
      const plan = {
        '0': [], '1': ['cool-down: foam roll 5min'],
        '2': [], '3': [], '4': [], '5': [], '6': []
      };
      localStorage.setItem(key, JSON.stringify(plan));
    }, PLAN_KEY);
    await page.reload();
    await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });

    await expect(async () => {
      const plan = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, PLAN_KEY);
      expect(plan).toBeTruthy();
      const day1: string[] = plan['1'] || [];
      const normalized = day1.some((l: string) => l.startsWith('Cool Down:'));
      expect(normalized).toBe(true);
    }).toPass({ timeout: 5000 });
  });
});
