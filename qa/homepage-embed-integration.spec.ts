import { expect, test, type Frame, type Page } from '@playwright/test'

const appOrigin = process.env.BITTERCLIP_APP_ORIGIN

test.skip(!appOrigin, 'Set BITTERCLIP_APP_ORIGIN to exercise the real Rails homepage embed.')

const widgetFrame = (page: Page): Frame | undefined => (
  page.frames().find((frame: Frame) => frame.url().includes('/mcp_widgets/workspace'))
)

test('the real homepage viewer retrieves, plays, centers, and opens clips for review', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto(`/?appOrigin=${encodeURIComponent(String(appOrigin))}`)

  const hero = page.locator('iframe[title="BitterClip — episode one, cut into clips"]')
  await expect(hero).toHaveClass(/pointer-events-auto/, { timeout: 15_000 })
  await expect(hero).toHaveAttribute('tabindex', '0')
  await expect(hero).not.toHaveAttribute('aria-hidden', 'true')

  const phoneFrame = page.getByTestId('hero-phone-frame')
  const compactPhoneBox = await phoneFrame.boundingBox()
  if (!compactPhoneBox) throw new Error('phone frame is not laid out')
  expect(Math.abs((compactPhoneBox.width / compactPhoneBox.height) - (393 / 852))).toBeLessThan(0.02)

  await page.waitForFunction(() => window.frames.length >= 1)
  await expect.poll(() => Boolean(widgetFrame(page)), { timeout: 15_000 }).toBe(true)
  const widget = widgetFrame(page)
  if (!widget) throw new Error('workspace widget frame did not load')

  await widget.waitForFunction(() => {
    const view = document.querySelector('#view') as HTMLElement & { shadowRoot: ShadowRoot }
    const editor = view?.shadowRoot?.querySelector('bitterclip-composition-editor') as HTMLElement & { shadowRoot: ShadowRoot }
    return Boolean(editor?.shadowRoot?.querySelector('bitterclip-composition-inline-viewer'))
  })

  const swatches = widget.locator('button.swatch')
  const activeTitle = widget.locator('.viewer-title')
  const activePosition = widget.locator('.viewer-position')
  await expect(swatches).toHaveCount(3)
  await expect(swatches.nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(activePosition).toHaveText('Clip 2 of 3')
  await expect(activeTitle).toHaveText('The Human Part Is Precious')
  await expect(widget.getByText(/Review speakers/)).toHaveCount(0)
  const boundedLayout = await widget.evaluate(() => {
    const view = document.querySelector('#view') as HTMLElement & { shadowRoot: ShadowRoot }
    const editor = view?.shadowRoot?.querySelector('bitterclip-composition-editor') as HTMLElement & { shadowRoot: ShadowRoot }
    const viewer = editor?.shadowRoot?.querySelector('bitterclip-composition-inline-viewer') as HTMLElement & { shadowRoot: ShadowRoot }
    const actions = viewer?.shadowRoot?.querySelector('.viewer-actions')
    const editorRect = editor?.getBoundingClientRect()
    const viewerRect = viewer?.getBoundingClientRect()
    const actionsRect = actions?.getBoundingClientRect()
    return {
      bounded: editor?.hasAttribute('data-bounded-viewport') && viewer?.hasAttribute('bounded'),
      editorHeight: editorRect?.height || 0,
      viewerHeight: viewerRect?.height || 0,
      actionBottomGap: viewerRect && actionsRect ? viewerRect.bottom - actionsRect.bottom : Number.POSITIVE_INFINITY,
    }
  })
  expect(boundedLayout.bounded).toBe(true)
  expect(Math.abs(boundedLayout.editorHeight - 600)).toBeLessThanOrEqual(1)
  expect(Math.abs(boundedLayout.viewerHeight - 600)).toBeLessThanOrEqual(1)
  expect(boundedLayout.actionBottomGap).toBeGreaterThanOrEqual(0)
  expect(boundedLayout.actionBottomGap).toBeLessThanOrEqual(16)

  const expected = [
    ['My Own Marketing Asset', 'Clip 1 of 3'],
    ['The Human Part Is Precious', 'Clip 2 of 3'],
    ['The Bitter Lesson', 'Clip 3 of 3'],
  ]
  for (let index = 0; index < expected.length; index += 1) {
    await swatches.nth(index).click()
    await expect(activeTitle).toHaveText(expected[index][0])
    await expect(activePosition).toHaveText(expected[index][1])
    await expect.poll(() => widget.evaluate(() => {
      const view = document.querySelector('#view') as HTMLElement & { shadowRoot: ShadowRoot }
      const editor = view.shadowRoot.querySelector('bitterclip-composition-editor') as HTMLElement & {
        shadowRoot: ShadowRoot
        _episodeTransport?: {
          view: () => { isMainEpisodePlaybackActive?: boolean; displaySeconds?: number }
        }
      }
      const inline = editor.shadowRoot.querySelector('bitterclip-composition-inline-viewer') as HTMLElement & {
        state?: { active?: { startSeconds?: number; endSeconds?: number } }
      }
      const active = inline?.state?.active
      const transport = editor?._episodeTransport?.view?.()
      return Boolean(
        transport?.isMainEpisodePlaybackActive && active &&
        Number(transport.displaySeconds) >= Number(active.startSeconds) &&
        Number(transport.displaySeconds) < Number(active.endSeconds) + 1,
      )
    }), { timeout: 12_000 }).toBe(true)
    if (index === 1) {
      const captionTrack = widget.locator('.viewer-caption-track')
      await expect(captionTrack).toContainText('human content is so valuable now.')
      await expect(captionTrack).toHaveCSS('height', '42px')
      expect(await captionTrack.evaluate((caption) => caption.closest('.vstage') === null)).toBe(true)
    }
  }

  await swatches.nth(1).click()
  await expect(activePosition).toHaveText('Clip 2 of 3')
  const carouselGeometry = () => swatches.nth(1).evaluate((selected) => {
    const strip = selected.closest('.viewer-strip')
    const clips = strip ? Array.from(strip.querySelectorAll('button.swatch')) : []
    const stripRect = strip?.getBoundingClientRect()
    const selectedRect = selected.getBoundingClientRect()
    const thirdRect = clips[2]?.getBoundingClientRect()
    return {
      centerDelta: stripRect
        ? Math.abs((selectedRect.left + selectedRect.width / 2) - (stripRect.left + stripRect.width / 2))
        : Number.POSITIVE_INFINITY,
      thirdVisible: Boolean(stripRect && thirdRect && thirdRect.left < stripRect.right && thirdRect.right > stripRect.left),
    }
  })
  await expect.poll(async () => (await carouselGeometry()).centerDelta).toBeLessThanOrEqual(3)
  await expect.poll(async () => (await carouselGeometry()).thirdVisible).toBe(true)

  await swatches.nth(1).focus()
  await swatches.nth(1).press('End')
  await expect(swatches.nth(2)).toBeFocused()
  await expect(widget.locator('button.swatch[tabindex="0"]')).toHaveCount(1)

  await swatches.nth(1).scrollIntoViewIfNeeded()
  const swatchBox = await swatches.nth(1).boundingBox()
  if (!swatchBox) throw new Error('selected clip is not laid out')
  await page.mouse.move(swatchBox.x + swatchBox.width / 2, swatchBox.y + swatchBox.height / 2)
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 360)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore)

  await swatches.nth(1).click()
  await widget.getByRole('button', { name: /Open in editor/ }).click()
  await expect(page.locator('[data-display-mode="fullscreen"]')).toBeVisible()
  const editorPhoneBox = await phoneFrame.boundingBox()
  if (!editorPhoneBox) throw new Error('expanded phone frame is not laid out')
  expect(Math.abs(editorPhoneBox.height - compactPhoneBox.height)).toBeLessThanOrEqual(1)
  expect(Math.abs((editorPhoneBox.width / editorPhoneBox.height) - (393 / 852))).toBeLessThan(0.02)
  await expect.poll(() => page.evaluate(() => {
    const header = document.querySelector('header')?.getBoundingClientRect()
    const editor = document.querySelector('[data-display-mode="fullscreen"]')?.getBoundingClientRect()
    return header && editor ? Math.round(editor.top - header.bottom) : -1
  }), { timeout: 3_000 }).toBeGreaterThanOrEqual(8)
  await expect.poll(async () => {
    return widget.evaluate(() => {
      const view = document.querySelector('#view') as HTMLElement & { shadowRoot: ShadowRoot }
      const editor = view.shadowRoot.querySelector('bitterclip-composition-editor') as HTMLElement & { shadowRoot: ShadowRoot }
      return editor?.shadowRoot?.textContent?.includes('Draft range') === true
    })
  }).toBe(false)

  const editorBack = widget.locator('button.back')
  await editorBack.click()
  await expect.poll(() => widget.evaluate(() => {
    const view = document.querySelector('#view') as HTMLElement & { shadowRoot: ShadowRoot }
    const editor = view.shadowRoot.querySelector('bitterclip-composition-editor') as unknown as { _focusedMomentId?: string }
    return editor?._focusedMomentId || ''
  })).toBe('')
  await editorBack.click()
  await expect(page.locator('[data-display-mode="inline"]')).toHaveCSS('height', '600px')
})

test('the marketing shell and real clip rail honor reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto(`/?appOrigin=${encodeURIComponent(String(appOrigin))}`)

  const hero = page.locator('iframe[title="BitterClip — episode one, cut into clips"]')
  await expect(hero).toHaveClass(/pointer-events-auto/, { timeout: 15_000 })
  const transitionDuration = await page.locator('[data-display-mode="inline"]').evaluate((element) => (
    Number.parseFloat(getComputedStyle(element).transitionDuration)
  ))
  expect(transitionDuration).toBeLessThanOrEqual(0.001)

  await expect.poll(() => Boolean(widgetFrame(page)), { timeout: 15_000 }).toBe(true)
  const widget = widgetFrame(page)
  if (!widget) throw new Error('workspace widget frame did not load')
  await expect.poll(() => widget.evaluate(() => {
    const view = document.querySelector('#view') as HTMLElement & { shadowRoot: ShadowRoot }
    const editor = view?.shadowRoot?.querySelector('bitterclip-composition-editor') as HTMLElement & { shadowRoot: ShadowRoot }
    const inline = editor?.shadowRoot?.querySelector('bitterclip-composition-inline-viewer') as HTMLElement & { shadowRoot: ShadowRoot }
    const strip = inline?.shadowRoot?.querySelector('bitterclip-composition-viewer-strip') as unknown as {
      _prefersReducedMotion?: () => boolean
    }
    return strip?._prefersReducedMotion?.() === true
  })).toBe(true)
})
