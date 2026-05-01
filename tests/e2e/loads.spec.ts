import { expect, test } from '@playwright/test';

test('home page loads with dino title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /dino friend/i })).toBeVisible();
});
