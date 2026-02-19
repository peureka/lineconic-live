import { test, expect } from '@playwright/test';

const LOAD_TIMEOUT = 15000;

test.describe('Vote Page (US-038)', () => {
  test('vote page shows waiting state', async ({ page }) => {
    await page.goto('/app.html?mode=vote');
    await expect(page.locator('text=WAITING FOR HOST')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });

  test('vote page has DEAD and ALIVE buttons', async ({ page }) => {
    await page.goto('/app.html?mode=vote');
    await expect(page.locator('button:has-text("DEAD")')).toBeVisible({ timeout: LOAD_TIMEOUT });
    await expect(page.locator('button:has-text("ALIVE")')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });
});
