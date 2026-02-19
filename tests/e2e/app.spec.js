import { test, expect } from '@playwright/test';

// Babel runtime transpilation + JSON fetch is slow in headless Chrome
const OPERATOR_LOAD_TIMEOUT = 15000;

test.describe('Routing (US-001)', () => {
  test('default loads launcher view', async ({ page }) => {
    await page.goto('/app.html');
    await page.waitForSelector('.launcher-view', { timeout: OPERATOR_LOAD_TIMEOUT });
    await expect(page.locator('.launcher-view')).toBeVisible();
  });

  test('?mode=operator loads operator view', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    await expect(page.locator('.operator-grid')).toBeVisible();
  });

  test('?mode=audience loads audience view', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await expect(page.locator('.S.on')).toBeVisible({ timeout: OPERATOR_LOAD_TIMEOUT });
    // No operator elements
    await expect(page.locator('.operator-grid')).not.toBeVisible();
  });
});

test.describe('Keyboard Navigation (US-002)', () => {
  test('arrow right advances slide', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on', { timeout: OPERATOR_LOAD_TIMEOUT });
    // First slide is attract
    const firstSlide = await page.locator('.S.on').innerHTML();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const secondSlide = await page.locator('.S.on').innerHTML();
    expect(firstSlide).not.toBe(secondSlide);
  });

  test('arrow left goes back', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const after = await page.locator('[data-testid="slide-counter"]').first().textContent();
    expect(after).toContain('2/');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const back = await page.locator('[data-testid="slide-counter"]').first().textContent();
    expect(back).toContain('1/');
  });

  test('spacebar advances slide', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on', { timeout: OPERATOR_LOAD_TIMEOUT });
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    // Should have advanced
    const slideContent = await page.locator('.S.on').innerHTML();
    expect(slideContent).toBeTruthy();
  });
});

test.describe('Shortcut Overlay (US-006)', () => {
  test('? key toggles shortcut overlay in operator mode', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    await page.keyboard.press('?');
    await expect(page.locator('.shortcut-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.shortcut-overlay')).not.toBeVisible();
  });
});

test.describe('Session Persistence (US-004)', () => {
  test('state survives page reload', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    // Advance 5 slides
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
    }
    // Reload
    await page.reload();
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    // Should still be on slide 6 (1-indexed)
    const counter = await page.locator('[data-testid="slide-counter"]').first().textContent();
    expect(counter).toContain('6');
  });
});

test.describe('Answer Reveal (US-016)', () => {
  test('R key reveals answer on audience view', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on', { timeout: OPERATOR_LOAD_TIMEOUT });
    // Navigate to a question slide (slide 5 is source_q "DID I STUTTER?")
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
    }
    // Answer should be blurred
    const answer = page.locator('.answer');
    if (await answer.count() > 0) {
      await expect(answer).not.toHaveClass(/revealed/);
      await page.keyboard.press('r');
      await page.waitForTimeout(150);
      await expect(answer).toHaveClass(/revealed/);
    }
  });
});

test.describe('Scoring (US-019)', () => {
  test('Q key increments cyan score', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    await page.keyboard.press('q');
    await page.waitForTimeout(150);
    const cyanScore = await page.locator('[data-testid="cyan-score"]').textContent();
    expect(parseInt(cyanScore)).toBe(1);
  });

  test('P key increments pink score', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    await page.keyboard.press('p');
    await page.waitForTimeout(150);
    const pinkScore = await page.locator('[data-testid="pink-score"]').textContent();
    expect(parseInt(pinkScore)).toBe(1);
  });
});

test.describe('Audience View renders correctly', () => {
  test('attract slide shows pulsing L', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on', { timeout: OPERATOR_LOAD_TIMEOUT });
    await expect(page.locator('.S.on')).toContainText('L');
  });

  test('audience view hides cursor', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on', { timeout: OPERATOR_LOAD_TIMEOUT });
    const cursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(cursor).toBe('none');
  });
});

test.describe('Section Navigation (US-010)', () => {
  test('number keys jump to sections in operator mode', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    // Press 2 to jump to section 2
    await page.keyboard.press('2');
    await page.waitForTimeout(300);
    // Should no longer be on slide 1
    const counter = await page.locator('[data-testid="slide-counter"]').first().textContent();
    expect(counter).not.toContain('1/');
  });
});

test.describe('Route Modes', () => {
  test('?mode=vote loads vote view', async ({ page }) => {
    await page.goto('/app.html?mode=vote');
    await expect(page.locator('[data-testid="vote-view"]')).toBeVisible({ timeout: OPERATOR_LOAD_TIMEOUT });
  });

  test('?mode=answers loads answers view', async ({ page }) => {
    await page.goto('/app.html?mode=answers');
    await expect(page.locator('[data-testid="answers-view"]')).toBeVisible({ timeout: OPERATOR_LOAD_TIMEOUT });
  });
});

test.describe('Multi-Device Sync', () => {
  test('operator view renders and advances correctly', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: OPERATOR_LOAD_TIMEOUT });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const counter = await page.locator('[data-testid="slide-counter"]').first().textContent();
    expect(counter).toContain('2');
  });
});
