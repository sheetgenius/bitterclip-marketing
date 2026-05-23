import { expect, test } from '@playwright/test'

test('renders the placeholder hero', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Drop a video. Clip once. Shorts jump out.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Coming soon' })).toBeVisible()
})
