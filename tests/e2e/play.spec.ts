import { expect, test } from '@playwright/test';

test.describe('core play loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test('onboarding → hatch → stats render', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByLabel(/hunger \d+ percent/i)).toBeVisible();
  });

  test('feed raises hunger bar', async ({ page }) => {
    // Seed save via addInitScript so it survives the initial page load
    // (beforeEach clears localStorage, then this script writes it back before app boots)
    await page.addInitScript(() => {
      const blob = {
        dino: {
          id: 'dino-1',
          name: 'Spike',
          species: 'dino',
          skinId: 'default',
          stage: 'baby',
          age: 10,
          stats: { hunger: 30, happy: 80, energy: 80, clean: 80, health: 80 },
          position: [0, 0, 0],
        },
        currentArea: 'home',
        controlMode: 'tap',
        lastSeenAt: Date.now(),
        settings: { soundOn: true, theme: 'default' },
        version: 1,
      };
      localStorage.setItem('tamagochi-3d:save:v1', JSON.stringify(blob));
    });
    await page.goto('/');
    const before = await page.getByLabel(/hunger \d+ percent/i).getAttribute('aria-label');
    await page.getByRole('button', { name: /feed apple/i }).click();
    await expect
      .poll(async () => await page.getByLabel(/hunger \d+ percent/i).getAttribute('aria-label'))
      .not.toBe(before);
  });

  test('travel to town via portal works', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    await page.getByLabel('Map').click();
    await page.getByRole('button', { name: /town square/i }).click();
    await expect(page.getByText('Town Square')).toBeVisible();
  });
});
