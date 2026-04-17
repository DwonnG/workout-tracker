import { Page, expect } from '@playwright/test';

export const APP_URL = '/month-workout-protein-tracker.html';
export const TEST_PIN = '000000';
export const CREATE_PIN = '111222';
export const CREATE_NAME = 'Created Test_User';
export const FIREBASE_URL = 'https://workout-tracker-d6805-default-rtdb.firebaseio.com';
export const CREATE_PIN_HASH = '92c7d71b95dc6540fc58e891dbe649fe72ae5e93b5f42fd7fbdeefe6cef3e51d';
export const INVITE_CODE = 'FamilyGym2026';

export async function enterPin(page: Page, pin = TEST_PIN) {
  for (const digit of pin) {
    await page.locator(`#numPad .num-btn:not(.action):text-is("${digit}")`).click();
  }
}

export async function loginWithPin(page: Page, pin = TEST_PIN) {
  await enterPin(page, pin);
  await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });
}

export async function createAccount(page: Page, pin = CREATE_PIN, name = CREATE_NAME) {
  await page.locator('#pinToggleLink').click();
  await expect(page.locator('#pinInviteWrap')).toBeVisible({ timeout: 5000 });
  await page.locator('#pinInviteInput').fill(INVITE_CODE);
  await page.locator('#pinInviteBtn').click();
  await expect(page.locator('#pinSubtitle')).toHaveText('Choose a 6-digit PIN', { timeout: 5000 });
  await enterPin(page, pin);
  await expect(page.locator('#pinSubtitle')).toHaveText('Confirm your PIN', { timeout: 5000 });
  await enterPin(page, pin);
  await expect(page.locator('#pinNameWrap')).toBeVisible({ timeout: 5000 });
  await page.locator('#pinNameInput').fill(name);
  await page.locator('#pinNameBtn').click();
  await expect(page.locator('#appWrap')).toBeVisible({ timeout: 10000 });
}

export async function logoutFromApp(page: Page) {
  await page.locator('#lockBtn').click({ force: true });
  await expect(page.locator('#pinOverlay')).toBeVisible();
}

export async function clearAndReload(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#pinOverlay')).toBeVisible();
}

export async function freshLogin(page: Page) {
  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#pinOverlay')).toBeVisible();
  // Suppress walkthrough tour for non-tour tests
  await page.evaluate(() => localStorage.setItem('wt:tourDone', '1'));
  await loginWithPin(page);
  await expect(page.locator('#calendar')).toBeVisible({ timeout: 5000 });
}
