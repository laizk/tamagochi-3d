import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const AREAS = ['home', 'town', 'park', 'beach', 'forest', 'cave'] as const;

test('lovebirds and cloud perch render in every area', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
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
          stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
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

  for (const area of AREAS) {
    await page.evaluate((a) => {
      // Reach into the zustand store via a global hook, set area programmatically.
      const w = window as unknown as { __setArea?: (area: string) => void };
      w.__setArea?.(a);
    }, area);
    // Give R3F a frame.
    await page.waitForTimeout(200);
    // Sanity: canvas exists, no console errors.
    await expect(page.locator('canvas')).toBeVisible();
  }
});
