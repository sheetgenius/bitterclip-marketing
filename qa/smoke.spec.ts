import { expect, test } from '@playwright/test'

test('renders the collaborative clip workbench hero', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip' })).toBeVisible()
  await expect(page.getByText('Opens inside ChatGPT and Claude')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Ask for the moment/ })).toBeVisible()
  await expect(page.getByText('Tell ChatGPT or Claude what you want clipped.')).toBeVisible()
  await expect(page.getByText('$99/month').first()).toBeVisible()
  await expect(page.locator('a[href="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start signup' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'This is the editor that opens in the chat.' })).toBeVisible()
})

test('renders the developer documentation page and navigation', async ({ page }) => {
  await page.goto('/docs')

  await expect(page.getByRole('heading', { level: 2, name: 'How a clip gets made.' })).toBeVisible()
  await expect(page.locator('strong').filter({ hasText: /Recording.*Moment.*Clip/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recording', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Moment', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Clip', exact: true })).toBeVisible()
})

test('renders the MCP specification page and handles tab switches', async ({ page }) => {
  await page.goto('/mcp')

  await expect(page.getByRole('heading', { level: 2, name: 'How ChatGPT and Claude open the editor.' })).toBeVisible()
  await expect(page.locator('a[href="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start signup' }).first()).toBeVisible()
  
  // Verify tabs are available
  await expect(page.getByRole('button', { name: 'Endpoint & methods' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tools' })).toBeVisible()

  // Switch to catalog tab
  await page.getByRole('button', { name: 'Tools' }).click()
  await expect(page.getByRole('cell', { name: 'clips_render_candidate_editor' })).toBeVisible()

  // Switch to bridge tab
  await page.getByRole('button', { name: 'The bridge' }).click()
  await expect(page.getByText('One contract')).toBeVisible()
})
