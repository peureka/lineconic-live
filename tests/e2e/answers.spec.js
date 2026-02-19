import { test, expect } from '@playwright/test';

const LOAD_TIMEOUT = 15000;

test.describe('Answer Sheet', () => {
  test('answers page renders with header', async ({ page }) => {
    await page.goto('/app.html?mode=answers');
    await expect(page.locator('text=HOST ANSWER SHEET')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });

  test('answers page shows answer data', async ({ page }) => {
    await page.goto('/app.html?mode=answers');
    await expect(page.locator('table').first()).toBeVisible({ timeout: LOAD_TIMEOUT });
    // Should have at least one answer row
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: LOAD_TIMEOUT });
    expect(await rows.count()).toBeGreaterThan(5);
  });
});
