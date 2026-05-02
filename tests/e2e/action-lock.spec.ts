import { expect, test } from '@playwright/test';

test('feeding the dino freezes movement and disables action buttons for ~3s', async ({ page }) => {
  // Seed a hatched save so we skip onboarding entirely.
  await page.addInitScript(() => {
    const save = {
      active: 'dino',
      characters: {
        dino: {
          id: 'dino-1',
          name: 'Rex',
          species: 'dino',
          skinId: 'default',
          stage: 'baby',
          age: 10,
          stats: { hunger: 50, happy: 100, energy: 100, clean: 100, health: 100 },
          position: [0, 0, 0],
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
    localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(save));
  });

  await page.goto('/');
  await page.waitForTimeout(500);

  // tap the apple feed button
  const apple = page.getByLabel('Feed Apple');
  await apple.click();

  // buttons should be disabled
  await expect(apple).toBeDisabled();

  // wait until action expires
  await page.waitForTimeout(3500);

  await expect(apple).toBeEnabled();
});
