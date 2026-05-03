import { expect, test } from '@playwright/test';

test('tap to the right moves the dino and rotates it to face that direction', async ({ page }) => {
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
          stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
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
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Wait for React effects (window hooks, app ready) and Suspense to settle.
  await page.waitForFunction(
    () => (window as unknown as { __appReady?: boolean }).__appReady === true,
    { timeout: 5000 },
  );
  // Suspense-mounted World/Ground: poll the scene until the canvas has rendered a frame.
  await page.waitForTimeout(800);

  // Tap a bit right-and-down of canvas centre — same direction on both viewports,
  // close enough to centre to land safely inside the 30x30 ground plane. Use
  // touchscreen.tap so mobile-emulated devices (hasTouch=true) get a real touch
  // event, not just a synthetic mouse click that may not translate to pointer events.
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas has no bounding box');
  const tapX = box.x + box.width * 0.7;
  const tapY = box.y + box.height * 0.55;
  await page.touchscreen.tap(tapX, tapY);

  // Wait until dino has actually moved (movement is gradual at 2.2 u/s).
  await expect
    .poll(
      async () => {
        const pos = await page.evaluate(() => {
          const w = window as unknown as { __getDinoPosition?: () => [number, number, number] };
          return w.__getDinoPosition?.() ?? [0, 0, 0];
        });
        return Math.hypot(pos[0], pos[2]);
      },
      { timeout: 5000, intervals: [200] },
    )
    .toBeGreaterThan(0.5);

  const pos = (await page.evaluate(() => {
    const w = window as unknown as { __getDinoPosition?: () => [number, number, number] };
    return w.__getDinoPosition?.() ?? null;
  })) as [number, number, number];
  // Tap landed on +x side, so dino should have moved to +x.
  expect(pos[0]).toBeGreaterThan(0);

  // useFacing rotates the dino group toward travel direction (heading from xz delta).
  // After moving from origin into +x/-z quadrant, rotation.y must be a non-zero angle
  // close to the heading atan2(dx, -dz). Poll because lerp can lag the position read,
  // and on slow CI rotation may apply over several frames after movement ends.
  await expect
    .poll(
      async () => {
        const r = await page.evaluate(() => {
          const w = window as unknown as { __getDinoRotationY?: () => number | null };
          return w.__getDinoRotationY?.() ?? 0;
        });
        return Math.abs(r as number);
      },
      { timeout: 5000, intervals: [200] },
    )
    .toBeGreaterThan(0.05);
});
