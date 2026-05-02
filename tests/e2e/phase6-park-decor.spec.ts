import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const HATCHED_SAVE = {
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

test.describe('phase 6: park decor', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((save) => {
      localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(save));
    }, HATCHED_SAVE);
  });

  test('golden path: park renders without runtime errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');

    // Navigate to park via __setArea debug hook.
    await page.evaluate(() => {
      const w = window as unknown as { __setArea?: (area: string) => void };
      w.__setArea?.('park');
    });

    // Allow R3F to render a few frames.
    await page.waitForTimeout(500);

    // Canvas must be visible and no runtime errors thrown.
    await expect(page.locator('canvas')).toBeVisible();
    expect(consoleErrors.filter((e) => !e.includes('Not implemented'))).toHaveLength(0);

    // AreaName HUD should show "Park".
    await expect(page.getByText('Park')).toBeVisible();
  });

  test('park area stays rendered across several animation frames', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const w = window as unknown as { __setArea?: (area: string) => void };
      w.__setArea?.('park');
    });

    // Wait longer to let animated components run (TreesAnimated, Clouds, Butterflies, Bunny, etc.).
    await page.waitForTimeout(1500);

    await expect(page.locator('canvas')).toBeVisible();
  });

  test('edge case: switching from park back to town leaves canvas stable', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');

    await page.evaluate(() => {
      const w = window as unknown as { __setArea?: (area: string) => void };
      w.__setArea?.('park');
    });
    await page.waitForTimeout(400);

    // Switch away from park to town — all park useFrame hooks should clean up.
    await page.evaluate(() => {
      const w = window as unknown as { __setArea?: (area: string) => void };
      w.__setArea?.('town');
    });
    await page.waitForTimeout(300);

    await expect(page.locator('canvas')).toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });

  test('edge case: rapid area switching in/out of park does not crash', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');

    const areas = ['park', 'town', 'park', 'home', 'park'];
    for (const area of areas) {
      await page.evaluate((a) => {
        const w = window as unknown as { __setArea?: (area: string) => void };
        w.__setArea?.(a);
      }, area);
      await page.waitForTimeout(150);
    }

    await expect(page.locator('canvas')).toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });
});
