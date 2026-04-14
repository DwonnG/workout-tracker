import { test, expect } from '@playwright/test';
import {
  TEST_PIN, CREATE_PIN, CREATE_NAME, FIREBASE_URL, CREATE_PIN_HASH, INVITE_CODE,
  enterPin, loginWithPin, createAccount, logoutFromApp, clearAndReload, freshLogin
} from './helpers';

test.afterAll(async () => {
  try {
    await fetch(`${FIREBASE_URL}/tracker/${CREATE_PIN_HASH}.json`, { method: 'DELETE' });
  } catch { /* cleanup is best-effort */ }
});

test.beforeEach(async ({ page }) => {
  await freshLogin(page);
});

test.describe('PIN Lock Screen', () => {
  test('defaults to login mode on first load', async ({ page }) => {
    await clearAndReload(page);
    await expect(page.locator('#pinSubtitle')).toHaveText('Enter your 6-digit PIN');
    await expect(page.locator('#pinToggle')).toContainText('New here?');
  });

  test('can switch to invite code screen', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await expect(page.locator('#pinSubtitle')).toHaveText('Enter your invite code');
    await expect(page.locator('#pinInviteWrap')).toBeVisible();
  });

  test('renders scrambled numpad with digits 0-9', async ({ page }) => {
    await clearAndReload(page);
    const buttons = page.locator('#numPad .num-btn:not(.action)');
    const count = await buttons.count();
    expect(count).toBe(10);
    const digits = new Set<string>();
    for (let i = 0; i < count; i++) {
      digits.add((await buttons.nth(i).textContent()) || '');
    }
    for (let d = 0; d <= 9; d++) {
      expect(digits.has(String(d))).toBe(true);
    }
  });

  test('fills pin dots as digits are entered', async ({ page }) => {
    await clearAndReload(page);
    await expect(page.locator('.pin-dot.filled')).toHaveCount(0);
    await page.locator('#numPad .num-btn:not(.action):text-is("1")').click();
    await expect(page.locator('.pin-dot.filled')).toHaveCount(1);
    await page.locator('#numPad .num-btn:not(.action):text-is("2")').click();
    await expect(page.locator('.pin-dot.filled')).toHaveCount(2);
  });

  test('backspace removes last dot', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#numPad .num-btn:not(.action):text-is("5")').click();
    await page.locator('#numPad .num-btn:not(.action):text-is("3")').click();
    await expect(page.locator('.pin-dot.filled')).toHaveCount(2);
    await page.locator('#numPad .num-btn.action').last().click();
    await expect(page.locator('.pin-dot.filled')).toHaveCount(1);
  });

  test('clear button resets all dots', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#numPad .num-btn:not(.action):text-is("7")').click();
    await page.locator('#numPad .num-btn:not(.action):text-is("8")').click();
    await expect(page.locator('.pin-dot.filled')).toHaveCount(2);
    await page.locator('#numPad .num-btn.action.clear').click();
    await expect(page.locator('.pin-dot.filled')).toHaveCount(0);
  });

  test('create account requires PIN confirmation', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await page.locator('#pinInviteInput').fill(INVITE_CODE);
    await page.locator('#pinInviteBtn').click();
    await expect(page.locator('#pinSubtitle')).toHaveText('Choose a 6-digit PIN', { timeout: 5000 });
    await enterPin(page, CREATE_PIN);
    await expect(page.locator('#pinSubtitle')).toHaveText('Confirm your PIN', { timeout: 5000 });
  });

  test('create account rejects mismatched confirmation', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await page.locator('#pinInviteInput').fill(INVITE_CODE);
    await page.locator('#pinInviteBtn').click();
    await expect(page.locator('#pinSubtitle')).toHaveText('Choose a 6-digit PIN', { timeout: 5000 });
    await enterPin(page, '111111');
    await expect(page.locator('#pinSubtitle')).toHaveText('Confirm your PIN', { timeout: 5000 });
    await enterPin(page, '222222');
    await expect(page.locator('#pinError')).toHaveText("PINs don't match. Try again.", { timeout: 5000 });
  });

  test('create account unlocks on matching confirmation', async ({ page }) => {
    await clearAndReload(page);
    await createAccount(page);
    await expect(page.locator('#appWrap')).toBeVisible();
    await expect(page.locator('#pinOverlay')).toHaveClass(/hidden/);
  });

  test('login rejects unknown PIN', async ({ page }) => {
    await logoutFromApp(page);
    await expect(page.locator('#pinSubtitle')).toHaveText('Enter your 6-digit PIN');
    await enterPin(page, '999999');
    await expect(page.locator('#pinError')).toHaveText('PIN not recognized.', { timeout: 10000 });
  });

  test('login accepts known PIN', async ({ page }) => {
    await logoutFromApp(page);
    await loginWithPin(page);
    await expect(page.locator('#appWrap')).toBeVisible();
  });

  test('persists PIN hash and skips PIN screen on reload', async ({ page }) => {
    const hash = await page.evaluate(() => localStorage.getItem('wt:pinHash'));
    expect(hash).toBeTruthy();
    await page.reload();
    await expect(page.locator('#pinOverlay')).toHaveClass(/hidden/, { timeout: 5000 });
  });

  test('rejects invalid invite code', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await expect(page.locator('#pinInviteWrap')).toBeVisible({ timeout: 5000 });
    await page.locator('#pinInviteInput').fill('wrongcode');
    await page.locator('#pinInviteBtn').click();
    await expect(page.locator('#pinError')).toHaveText('Invalid invite code.', { timeout: 5000 });
  });

  test('valid invite code advances to PIN creation', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await expect(page.locator('#pinInviteWrap')).toBeVisible({ timeout: 5000 });
    await page.locator('#pinInviteInput').fill(INVITE_CODE);
    await page.locator('#pinInviteBtn').click();
    await expect(page.locator('#pinSubtitle')).toHaveText('Choose a 6-digit PIN', { timeout: 5000 });
    await expect(page.locator('#pinInviteWrap')).toBeHidden();
    await expect(page.locator('#numPad')).toBeVisible();
  });

  test('create flow shows name input after PIN confirmation', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await page.locator('#pinInviteInput').fill(INVITE_CODE);
    await page.locator('#pinInviteBtn').click();
    await expect(page.locator('#pinSubtitle')).toHaveText('Choose a 6-digit PIN', { timeout: 5000 });
    await enterPin(page, CREATE_PIN);
    await expect(page.locator('#pinSubtitle')).toHaveText('Confirm your PIN', { timeout: 5000 });
    await enterPin(page, CREATE_PIN);
    await expect(page.locator('#pinNameWrap')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#pinSubtitle')).toHaveText("What's your name?");
    await expect(page.locator('#numPad')).toBeHidden();
  });

  test('name input is required to finish create', async ({ page }) => {
    await clearAndReload(page);
    await page.locator('#pinToggleLink').click();
    await page.locator('#pinInviteInput').fill(INVITE_CODE);
    await page.locator('#pinInviteBtn').click();
    await expect(page.locator('#pinSubtitle')).toHaveText('Choose a 6-digit PIN', { timeout: 5000 });
    await enterPin(page, CREATE_PIN);
    await expect(page.locator('#pinSubtitle')).toHaveText('Confirm your PIN', { timeout: 5000 });
    await enterPin(page, CREATE_PIN);
    await expect(page.locator('#pinNameWrap')).toBeVisible({ timeout: 5000 });
    await page.locator('#pinNameBtn').click();
    await expect(page.locator('#pinOverlay')).toBeVisible();
  });

  test('header shows greeting after login', async ({ page }) => {
    await expect(page.locator('#userGreeting')).toHaveText('Hi, Test Test');
  });

  test('logout re-shows PIN screen in login mode', async ({ page }) => {
    await logoutFromApp(page);
    await expect(page.locator('#appWrap')).toBeHidden();
    await expect(page.locator('#pinSubtitle')).toHaveText('Enter your 6-digit PIN');
  });

  test('logout then re-login reinitializes app (appInited reset)', async ({ page }) => {
    await expect(page.locator('#calendar')).toBeVisible();
    await logoutFromApp(page);
    await loginWithPin(page);
    await expect(page.locator('#calendar')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#userGreeting')).toHaveText('Hi, Test Test');
  });

  test('logout and login as different user shows different greeting', async ({ page }) => {
    await logoutFromApp(page);
    await createAccount(page);
    await expect(page.locator('#userGreeting')).toHaveText(`Hi, ${CREATE_NAME}`);

    await page.locator('#lockBtn').evaluate(el => el.click());
    await expect(page.locator('#pinOverlay')).toBeVisible();

    await loginWithPin(page, TEST_PIN);
    await expect(page.locator('#userGreeting')).toHaveText('Hi, Test Test');
  });
});
