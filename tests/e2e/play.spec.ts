import { expect, test } from '@playwright/test';

test.describe('core play loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test('onboarding → hatch → stats render', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    // Dismiss WelcomeBirds if it appears after hatch.
    await page
      .getByRole('button', { name: 'OK!' })
      .click()
      .catch(() => {});
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByLabel(/hunger \d+ percent/i)).toBeVisible();
  });

  test('feed raises hunger bar', async ({ page }) => {
    // Seed save via addInitScript so it survives the initial page load
    // (beforeEach clears localStorage, then this script writes it back before app boots)
    await page.addInitScript(() => {
      const blob = {
        active: 'dino',
        characters: {
          dino: {
            id: 'dino-1',
            name: 'Spike',
            species: 'dino',
            skinId: 'default',
            stage: 'baby',
            age: 10,
            stats: { hunger: 30, happy: 80, energy: 80, clean: 80, health: 80 },
            // Seed near the dining-table waypoint so the feed → consume
            // round-trip happens within the poll window.
            position: [-1.5, 0, 0.95],
          },
          lovebirds: {
            id: 'lovebirds-1',
            name: 'Lovebirds',
            species: 'lovebirds',
            skinId: 'default',
            stage: 'baby',
            age: 0,
            stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
            position: [0, 0, 0],
          },
        },
        currentArea: 'home',
        controlMode: 'tap',
        lastSeenAt: Date.now(),
        settings: { soundOn: false, theme: 'default' },
        intro: { lovebirdsSeen: true },
        version: 2,
      };
      localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(blob));
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
    // Dismiss WelcomeBirds after hatch.
    await page
      .getByRole('button', { name: 'OK!' })
      .click()
      .catch(() => {});
    await page.getByLabel('Map').click();
    await page.getByRole('button', { name: /town square/i }).click();
    await expect(page.getByText('Town Square')).toBeVisible();
  });
});
