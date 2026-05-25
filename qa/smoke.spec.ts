import { expect, test } from '@playwright/test'

test('renders the collaborative clip workbench hero', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip' })).toBeVisible()
  await expect(page.getByText('Turn recordings and agent-found moments into clips')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Request early access' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Use your cockpit for context. Use BitterClip for the media work.' })).toBeVisible()
})
