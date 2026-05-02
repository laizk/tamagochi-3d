import { expect, test } from '@playwright/test';

test('switching from lovebirds to dino leaves birds wandering, not orbiting cloud', async ({
  page,
}) => {
  // Register error capture before navigation so we don't miss early page errors.
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // Seed a hatched save to skip onboarding.
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
      currentArea: 'park',
      controlMode: 'tap',
      lastSeenAt: Date.now(),
      settings: { soundOn: false, theme: 'default' },
      intro: { lovebirdsSeen: true },
      version: 2,
    };
    localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(save));
  });

  await page.goto('/');
  await page.waitForFunction(
    () => (window as unknown as { __appReady?: boolean }).__appReady === true,
  );

  // Switch to lovebirds, let them wander a moment, then switch back to dino.
  await page.getByRole('button', { name: 'Switch to lovebirds' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Switch to dino' }).click();
  await page.waitForTimeout(800);

  // No page errors during the switch.
  expect(errors).toEqual([]);

  const lovebirdsPos = await page.evaluate(() => {
    const w = window as unknown as {
      __getCharacters?: () => Record<string, { position: [number, number, number] }>;
    };
    return w.__getCharacters?.().lovebirds.position ?? null;
  });
  expect(lovebirdsPos).not.toBeNull();
  const [x, , z] = lovebirdsPos as [number, number, number];
  // cloud perch is at [3, ?, -2] — birds should NOT be parked there
  expect(Math.hypot(x - 3, z - -2)).toBeGreaterThan(1);
});
