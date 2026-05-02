import { expect, test } from '@playwright/test';

const makeSave = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    dino: {
      id: 'dino-1',
      name: 'Spike',
      species: 'dino',
      skinId: 'default',
      stage: 'baby',
      age: 10,
      stats: { hunger: 100, happy: 80, energy: 80, clean: 80, health: 80 },
      position: [0, 0, 0],
      ...overrides,
    },
    currentArea: 'home',
    controlMode: 'tap',
    lastSeenAt: Date.now(),
    settings: { soundOn: true, theme: 'default' },
    version: 1,
  });

test.describe('dino interactions edge cases', () => {
  test('edge case: feeding when hunger is already 100 stays at 100 (no overflow)', async ({
    page,
  }) => {
    await page.addInitScript(
      (s) => localStorage.setItem('tamagochi-3d:save:v1', s),
      makeSave({ stats: { hunger: 100, happy: 80, energy: 80, clean: 80, health: 80 } }),
    );
    await page.goto('/');
    // Confirm starting value
    await expect(page.getByLabel('hunger 100 percent')).toBeVisible();
    await page.getByRole('button', { name: /feed apple/i }).click();
    // After feeding, hunger must still be 100 — not above
    await expect(page.getByLabel('hunger 100 percent')).toBeVisible();
    const label = await page.getByLabel(/hunger \d+ percent/i).getAttribute('aria-valuenow');
    expect(Number(label)).toBeLessThanOrEqual(100);
  });

  test('pet button raises happy stat', async ({ page }) => {
    await page.addInitScript(
      (s) => localStorage.setItem('tamagochi-3d:save:v1', s),
      makeSave({ stats: { hunger: 80, happy: 50, energy: 80, clean: 80, health: 80 } }),
    );
    await page.goto('/');
    const before = await page.getByLabel(/happy \d+ percent/i).getAttribute('aria-valuenow');
    await page.getByRole('button', { name: /pet/i }).click();
    await expect
      .poll(async () =>
        Number(await page.getByLabel(/happy \d+ percent/i).getAttribute('aria-valuenow')),
      )
      .toBeGreaterThan(Number(before));
  });
});
