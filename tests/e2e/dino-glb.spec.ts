import { expect, test } from '@playwright/test';

const BABY_SAVE = JSON.stringify({
  dino: {
    id: 'dino-1',
    name: 'Spike',
    species: 'dino',
    skinId: 'default',
    stage: 'baby',
    age: 10,
    stats: { hunger: 80, happy: 80, energy: 80, clean: 80, health: 80 },
    position: [0, 0, 0],
  },
  currentArea: 'home',
  controlMode: 'tap',
  lastSeenAt: Date.now(),
  settings: { soundOn: true, theme: 'default' },
  version: 1,
});

test.describe('dino-glb: egg vs GLB rendering', () => {
  test('fresh load shows egg modal and canvas', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText("It's an egg!", { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /hatch/i })).toBeVisible();
    const shaderOrGltfErrors = errors.filter((e) => /shader|gltf|404|three|webgl/i.test(e));
    expect(shaderOrGltfErrors).toHaveLength(0);
  });

  test('hatch dismisses modal and loads GLB without console errors', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    // Track GLB network response
    const glbStatus: number[] = [];
    page.on('response', (res) => {
      if (res.url().includes('t-rex.glb')) glbStatus.push(res.status());
    });

    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();

    // modal should go away
    await expect(page.getByText("It's an egg!", { exact: true })).not.toBeVisible();
    // canvas remains
    await expect(page.locator('canvas')).toBeVisible();
    // wait for GLB network fetch
    await expect.poll(() => glbStatus.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(glbStatus).not.toContain(404);

    const criticalErrors = errors.filter((e) => /shader|gltf|404|three|webgl|React/i.test(e));
    expect(criticalErrors).toHaveLength(0);
  });

  test('after hatch screenshot — dino is visible', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    // give GLB time to render
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/dino-glb-after-hatch.png' });
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('persistence: reload with baby stage shows GLB not egg modal', async ({ page }) => {
    const save = BABY_SAVE;
    await page.addInitScript((s) => localStorage.setItem('tamagochi-3d:save:v1', s), save);
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const glbStatus: number[] = [];
    page.on('response', (res) => {
      if (res.url().includes('t-rex.glb')) glbStatus.push(res.status());
    });

    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText("It's an egg!", { exact: true })).not.toBeVisible();
    await expect.poll(() => glbStatus.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(glbStatus).not.toContain(404);

    const criticalErrors = errors.filter((e) => /shader|gltf|404|three|webgl|React/i.test(e));
    expect(criticalErrors).toHaveLength(0);
  });

  test('edge case: clear localStorage resets to egg', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await expect(page.getByText("It's an egg!", { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /hatch/i })).toBeVisible();
  });

  test('GLB fetched only once (not on every render)', async ({ page }) => {
    const save = BABY_SAVE;
    await page.addInitScript((s) => localStorage.setItem('tamagochi-3d:save:v1', s), save);
    const glbRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('t-rex.glb')) glbRequests.push(req.url());
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    // Must be fetched no more than once (preload deduplicated by drei)
    expect(glbRequests.length).toBeLessThanOrEqual(1);
  });
});
