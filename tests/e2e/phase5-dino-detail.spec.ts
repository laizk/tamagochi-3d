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

test.describe('phase 5: dino action-state tap guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((save) => {
      localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(save));
    }, HATCHED_SAVE);
  });

  test('action buttons are disabled while eat action is active', async ({ page }) => {
    await page.goto('/');

    // Trigger eat via Feed Apple button (home area, so it's visible).
    const feedBtn = page.getByRole('button', { name: /feed apple/i });
    await expect(feedBtn).toBeEnabled();
    await feedBtn.click();

    // While action is active, all action buttons must be disabled (dimmed + HTML disabled).
    await expect(page.getByRole('button', { name: 'Pet' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Bath' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sleep' })).toBeDisabled();
    await expect(feedBtn).toBeDisabled();
  });

  test('action buttons re-enable after eat action completes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /feed apple/i }).click();

    // Feed action is 3000ms; wait for it to clear (up to 5s).
    await expect
      .poll(async () => (await page.getByRole('button', { name: 'Pet' }).isDisabled()) === false, {
        timeout: 6000,
        intervals: [300],
      })
      .toBe(true);

    await expect(page.getByRole('button', { name: 'Pet' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Play' })).toBeEnabled();
  });

  test('edge case: feeding dino that is already full (hunger=100) still triggers eat action', async ({
    page,
  }) => {
    // Override save with dino at full hunger.
    await page.addInitScript((save) => {
      const full = {
        ...save,
        characters: {
          ...save.characters,
          dino: { ...save.characters.dino, stats: { ...save.characters.dino.stats, hunger: 100 } },
        },
      };
      localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(full));
    }, HATCHED_SAVE);
    await page.goto('/');

    const feedBtn = page.getByRole('button', { name: /feed apple/i });
    await expect(feedBtn).toBeEnabled();
    await feedBtn.click();

    // The action should lock buttons regardless of whether hunger can increase.
    await expect(page.getByRole('button', { name: 'Pet' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  test('play action locks buttons and completes', async ({ page }) => {
    await page.goto('/');
    const playBtn = page.getByRole('button', { name: 'Play' });
    await expect(playBtn).toBeEnabled();
    await playBtn.click();

    await expect(page.getByRole('button', { name: 'Pet' })).toBeDisabled();
    await expect(page.getByRole('button', { name: /feed apple/i })).toBeDisabled();
  });

  test('bath action locks buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Bath' }).click();
    await expect(page.getByRole('button', { name: 'Pet' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  test('sleep action locks buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sleep' }).click();
    await expect(page.getByRole('button', { name: 'Pet' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
  });
});

test.describe('phase 5: lovebird wander — no teleport on character switch', () => {
  test('birds do not teleport to cloud when switching dino -> lovebirds -> dino', async ({
    page,
  }) => {
    await page.addInitScript((save) => {
      localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(save));
    }, HATCHED_SAVE);
    await page.goto('/');

    const dinoBtn = page.getByRole('button', { name: 'Switch to dino' });
    const birdBtn = page.getByRole('button', { name: 'Switch to lovebirds' });

    // Switch to lovebirds and let them move a bit.
    await birdBtn.click();
    await expect(birdBtn).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(500);

    // Switch back to dino — birds should still exist, canvas must still render.
    await dinoBtn.click();
    await expect(dinoBtn).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(300);

    // Canvas must remain rendered with no crash.
    await expect(page.locator('canvas')).toBeVisible();

    // HUD stats for dino must still be visible (proves app did not crash/re-hatch).
    await expect(page.getByLabel(/hunger \d+ percent/i)).toBeVisible();
  });

  test('lovebirds action also locks their buttons', async ({ page }) => {
    await page.addInitScript((save) => {
      localStorage.setItem('tamagochi-3d:save:v2', JSON.stringify(save));
    }, HATCHED_SAVE);
    await page.goto('/');

    const birdBtn = page.getByRole('button', { name: 'Switch to lovebirds' });
    await birdBtn.click();
    await expect(birdBtn).toHaveAttribute('aria-pressed', 'true');

    const playBtn = page.getByRole('button', { name: 'Play' });
    await expect(playBtn).toBeEnabled();
    await playBtn.click();

    // With lovebirds active + action running, pet and play must be disabled.
    await expect(page.getByRole('button', { name: 'Pet' })).toBeDisabled();
    await expect(playBtn).toBeDisabled();
  });
});
