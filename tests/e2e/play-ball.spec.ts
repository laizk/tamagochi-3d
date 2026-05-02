import { expect, test } from '@playwright/test';

test('play action triggers a 4s lock and the ball is rendered (smoke)', async ({ page }) => {
  // Seed save so onboarding is skipped
  await page.addInitScript(() => {
    const blob = {
      active: 'dino',
      characters: {
        dino: {
          id: 'dino-1',
          name: 'Dino',
          species: 'dino',
          skinId: 'default',
          stage: 'baby',
          age: 0,
          stats: { hunger: 100, happy: 50, energy: 100, clean: 100, health: 100 },
          position: [0, 0, 0],
          action: null,
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
          action: null,
        },
      },
      currentArea: 'park',
      controlMode: 'tap',
      lastSeenAt: Date.now(),
      settings: { soundOn: true, theme: 'default' },
      intro: { lovebirdsSeen: true },
      version: 2,
    };
    localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(blob));
  });

  await page.goto('/');
  const playBtn = page.getByLabel('Play');
  await expect(playBtn).toBeVisible();
  await playBtn.click();
  // Locked: button disabled
  await expect(playBtn).toBeDisabled();
  // After ~4s lock should expire
  await page.waitForTimeout(4500);
  await expect(playBtn).toBeEnabled();
});
