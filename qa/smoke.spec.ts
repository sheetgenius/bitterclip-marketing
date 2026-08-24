import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { iso4Release, iso4ReleaseReady } from '../app/lib/hero-iso4/release'
import { buildSignupUrl } from '../app/utils/signup-attribution'

test.describe('signup URL commercial intent', () => {
  test('defaults acquisition to Creator while preserving attribution', () => {
    const url = new URL(buildSignupUrl({
      query: { utm_source: 'newsletter', utm_campaign: 'founder_series' },
      surface: 'smoke',
      stage: 'hero',
      landingPath: '/from-email',
    }))

    expect(url.searchParams.get('plan')).toBe('clip')
    expect(url.searchParams.get('utm_source')).toBe('newsletter')
    expect(url.searchParams.get('utm_campaign')).toBe('founder_series')
    expect(url.searchParams.get('bc_surface')).toBe('smoke')
    expect(url.searchParams.get('bc_stage')).toBe('hero')
    expect(url.searchParams.get('bc_landing_path')).toBe('/from-email')
  })

  test('preserves an explicit Producer choice', () => {
    const url = new URL(buildSignupUrl({
      plan: 'pro',
      surface: 'pricing',
    }))

    expect(url.searchParams.get('plan')).toBe('pro')
  })

  test('does not let inbound query parameters choose or override a plan', () => {
    const defaultUrl = new URL(buildSignupUrl({
      query: { plan: 'pro', utm_source: 'partner' },
      surface: 'homepage',
    }))
    const producerUrl = new URL(buildSignupUrl({
      query: { plan: 'clip', utm_source: 'partner' },
      plan: 'pro',
      surface: 'homepage',
    }))

    expect(defaultUrl.searchParams.get('plan')).toBe('clip')
    expect(producerUrl.searchParams.get('plan')).toBe('pro')
  })
})

test('keeps the OG source and shipped legacy card aligned with the current Creator trial', () => {
  const source = readFileSync(new URL('../app/assets/og/bitterclip-og.svg', import.meta.url), 'utf8')
  const shippedLegacyCard = readFileSync(new URL('../public/images/bitterclip-og.png', import.meta.url))

  expect(source).toContain('7-day trial · $0 today · card required')
  expect(source).not.toContain('150 exports')
  expect(createHash('sha256').update(shippedLegacyCard).digest('hex')).toBe(
    'a56cbbfd05c3b37a7b6e78ff80420d0ce0ec16bfdce89321f80ff74f2537b050',
  )
})

test('renders the footage-in episodes-out hero and the bottom funnel', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="canonical"][href="https://bitterclip.com/"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/index.md"]')).toHaveAttribute('title', 'BitterClip homepage Markdown')
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(jsonLd).toContain('SoftwareApplication')
  expect(jsonLd).toContain('FAQPage')
  const softwareApplication = (JSON.parse(jsonLd!) as Array<Record<string, any>>)
    .find((entry) => entry['@type'] === 'SoftwareApplication')
  expect(softwareApplication?.offers).toMatchObject({
    '@type': 'AggregateOffer',
    lowPrice: '24',
    highPrice: '99',
    offerCount: 2,
  })
  await expect(page.locator('meta[property="og:image"][content="https://bitterclip.com/images/bitterclip-og-iso4.png"]')).toHaveCount(1)
  await expect(page.locator('meta[name="twitter:card"][content="summary_large_image"]')).toHaveCount(1)
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)

  const iso4Prepaint = page.locator('picture.iso4__prepaint')
  await expect(iso4Prepaint).toHaveCount(1)
  if (iso4ReleaseReady) {
    const sources = iso4Release.variants.slice(0, -1)
    await expect(iso4Prepaint.locator('source')).toHaveCount(
      iso4Release.variants.length + sources.length,
    )
    for (const variant of iso4Release.variants) {
      await expect(iso4Prepaint.locator(
        `source[media="(prefers-reduced-motion: reduce) and ${variant.media}"]`,
      )).toHaveAttribute('srcset', variant.terminalPosterUrl)
    }
    for (const variant of sources) {
      await expect(iso4Prepaint.locator(`source[media="${variant.media}"]`)).toHaveAttribute('srcset', variant.openingPosterUrl)
    }
    const fallback = iso4Release.variants.at(-1)!
    await expect(iso4Prepaint.locator('img')).toHaveAttribute('src', fallback.openingPosterUrl)
    for (const variant of iso4Release.variants) {
      await expect(page.locator(
        `link[rel="preload"][as="image"][href="${variant.openingPosterUrl}"]`,
      )).toHaveCount(1)
      await expect(page.locator(
        `link[rel="preload"][as="image"][href="${variant.terminalPosterUrl}"]`,
      )).toHaveCount(1)
    }
  } else {
    await expect(iso4Prepaint.locator('source')).toHaveCount(15)
    await expect(iso4Prepaint.locator(
      'source[media="(min-width: 960px) and (min-aspect-ratio: 29/16) and (max-aspect-ratio: 2/1)"][srcset="/images/hero/iso4-prepaint-panoramic.webp"]',
    )).toHaveCount(1)
    await expect(iso4Prepaint.locator(
      'source[media="(prefers-reduced-motion: reduce) and (min-width: 960px) and (min-aspect-ratio: 29/16) and (max-aspect-ratio: 2/1)"][srcset="/images/hero/iso4-prepaint-panoramic.webp"]',
    )).toHaveCount(1)
    await expect(iso4Prepaint.locator('img')).toHaveAttribute('src', '/images/hero/iso4-prepaint-ultrawide.webp')
    await expect(page.locator('link[rel="preload"][as="image"][href*="iso4-prepaint-"]')).toHaveCount(16)
  }

  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toContainText('Footage in')
  await expect(h1).toContainText('Episode out')
  await expect(page.getByText('BitterClip watches the whole recording, makes one cut worth sending, and lets you keep directing it.')).toBeVisible()
  await expect(page.getByText('Card required · $0 today · $24/month after seven days · $5 of included agent work for analysis, First Cut, and direction.')).toBeVisible()
  const heroTrialCta = page.locator('a[href^="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start my 7-day trial' }).first()
  await expect(heroTrialCta).toBeVisible()
  await expect(heroTrialCta).toHaveAttribute('href', /[?&]plan=clip(?:&|$)/)
  const navCta = page.locator('header a[href="https://app.bitterclip.com/sign_in"]').filter({ hasText: 'Sign in' })
  await expect(navCta).toBeVisible()
  await expect(navCta).toHaveClass(/bg-\[#f28f84\]/)
  await expect(page.locator('header a[href^="https://app.bitterclip.com/sign_up"]')).toHaveCount(0)
  // The below-the-fold spine: proof → control/trust → portability → offer → FAQ.
  const btfHeadings = await page.locator('main h2').allTextContents()
  expect(btfHeadings.map((text) => text.trim())).toEqual([
    'Hours of tape. One cut.',
    'Direct the cut until it is right',
    'Use BitterClip’s agent—or yours',
    'Bring one recording. Leave with the episode.',
    'The short version',
  ])
  await expect(page.locator('#demo').getByRole('heading', { name: 'Hours of tape. One cut.' })).toBeVisible()
  const proofVideo = page.locator('#demo video[title^="Watch:"]')
  await expect(proofVideo).toHaveAttribute('data-deferred-src', /day-1-sizzle\.mp4/)
  await proofVideo.scrollIntoViewIfNeeded()
  await expect(proofVideo.locator('source')).toHaveAttribute('src', /day-1-sizzle\.mp4/)
  await expect(page.locator('#demo').getByRole('button', { name: 'v2 now' })).toHaveCount(0)
  await expect(page.locator('#demo').getByRole('button', { name: 'v1 first cut' })).toHaveCount(0)
  await expect(page.getByText('getting anyone to know or care about your product')).toBeVisible()
  await expect(page.locator('#demo').getByRole('link', { name: 'bitter.sh', exact: true })).toHaveAttribute('href', 'https://bitter.sh/')
  await expect(page.locator('#demo').getByRole('link', { name: 'Bitter.sh', exact: true })).toHaveAttribute('href', 'https://bitter.sh/')
  await expect(page.getByRole('link', { name: /Strength & Positions/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Frontier Studio' })).toBeVisible()
  const proofOrder = await page.locator('#demo .proof-stage').evaluate((stage) =>
    Array.from(stage.children).map((child) => child.classList[0]),
  )
  expect(proofOrder).toEqual(['proof-player', 'proof-cta-band', 'proof-quotes'])
  await expect(page.locator('a[data-bc-event="proof_cta_click"]')).toBeVisible()
  await expect(page.locator('a[data-bc-event="proof_cta_click"]')).toHaveAttribute('href', /bc_stage=proof/)
  await expect(page.getByText('Open it to check the tape.')).toBeVisible()
  const editorImage = page.locator('#how img')
  await expect(editorImage).toHaveAttribute('data-deferred-src', /sizzle-editor-2/)
  await editorImage.scrollIntoViewIfNeeded()
  await expect(editorImage).toHaveAttribute('src', /sizzle-editor-2/)
  await expect(page.getByText('The editor is real')).toHaveCount(0)
  await expect(page.getByText('reviews the Episode')).toHaveCount(0)
  await expect(page.getByText('Intro drags. Start on the squat.')).toBeVisible()
  await expect(page.getByText('Open in editor · Download after render')).toBeVisible()
  await expect(page.getByText('Agentic video editing')).toHaveCount(0)
  await expect(page.getByText("You'll mostly never open it")).toHaveCount(0)
  await expect(page.getByText('every speaker named')).toHaveCount(0)
  await expect(page.getByText('transcript_search')).toHaveCount(0)
  await expect(page.getByText('Start clipping')).toHaveCount(0)
  const faq = page.locator('#faq')
  await faq.getByText('Where can the finished work go?').click()
  await expect(faq.getByText('Publishing always stops for your final confirmation')).toBeVisible()
  await expect(page.getByText('30-day refund')).toHaveCount(0)
  const creatorCta = page.locator('#pricing').getByRole('link', { name: 'Start my 7-day trial' })
  await expect(creatorCta).toBeVisible()
  await expect(creatorCta).toHaveAttribute('href', /[?&]plan=clip(?:&|$)/)
  await expect(creatorCta).toHaveAttribute('href', /bc_stage=pricing/)
  const producerCta = page.locator('#pricing').getByRole('link', { name: 'Choose Producer' })
  await expect(producerCta).toBeVisible()
  await expect(producerCta).toHaveAttribute('href', /[?&]plan=pro(?:&|$)/)
  await expect(page.locator('#pricing').getByText('Free', { exact: true })).toHaveCount(0)
  await expect(page.locator('footer a[href="/llms.txt"]')).toBeVisible()
  await expect(page.locator('footer a[href="/llms-full.txt"]')).toBeVisible()
  await expect(page.locator('footer a[href="https://github.com/sheetgenius/bitterclip-marketing"]')).toBeVisible()
})

test('keeps the pre-swap homepage soaking at /classic, noindexed', async ({ page }) => {
  await page.goto('/classic')

  await expect(page.locator('meta[name="robots"][content="noindex, nofollow"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: /You record it\./ })).toBeVisible()
  const trialCta = page.getByRole('link', { name: 'Start my 7-day trial' }).last()
  await expect(trialCta).toHaveAttribute('href', /[?&]plan=clip(?:&|$)/)
  await expect(page.getByRole('link', { name: 'See current pricing' })).toHaveAttribute('href', '/#pricing')
  await expect(page.locator('main')).not.toContainText('$9/month')
  await expect(page.locator('main')).not.toContainText('150 clip exports')
  await expect(page.locator('main')).not.toContainText('moves to Free')
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
  const softwareApplication = (JSON.parse(jsonLd!) as Array<Record<string, any>>)
    .find((entry) => entry['@type'] === 'SoftwareApplication')
  expect(softwareApplication?.offers).toMatchObject({ lowPrice: '24', highPrice: '99', offerCount: 2 })
})

test('records a sitewide signup CTA event without navigating', async ({ page }) => {
  await page.goto('/?utm_source=newsletter&utm_campaign=summer_launch')

  const signupCta = page.getByRole('link', { name: /Start my 7-day trial/ }).first()
  // Seeing the client-owned campaign URL proves hydration and the analytics
  // plugin have installed before this synthetic click races the capture hook.
  await expect(signupCta).toHaveAttribute('href', /utm_source=newsletter/)

  await page.evaluate(() => {
    const anchor = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
      .find((candidate) => candidate.href.includes('/sign_up') && candidate.textContent?.includes('Start my 7-day trial'))
    if (!anchor) throw new Error('signup CTA missing')
    anchor.addEventListener('click', (event) => event.preventDefault(), { once: true })
    anchor.click()
  })

  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'signup_click' &&
      event.params.page_path === '/' &&
      event.params.marketing_surface === 'homepage' &&
      event.params.plan === 'clip',
    ),
  )
  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'hero_cta_click' &&
      event.params.placement === 'hero' &&
      event.params.plan_intent === 'creator',
    ),
  )
})

test('records the neutral homepage conversion spine without customer content', async ({ page }) => {
  await page.goto('/')

  const proofCta = page.locator('a[data-bc-event="proof_cta_click"]')
  await proofCta.scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const anchor = document.querySelector<HTMLAnchorElement>('a[data-bc-event="proof_cta_click"]')
    if (!anchor) throw new Error('proof CTA missing')
    anchor.addEventListener('click', (event) => event.preventDefault(), { once: true })
    anchor.click()
  })

  await page.locator('[data-bc-view-event="agent_portability_view"]').scrollIntoViewIfNeeded()
  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) => event.name === 'agent_portability_view'),
  )
  await page.locator('#pricing').scrollIntoViewIfNeeded()
  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) => event.name === 'pricing_view'),
  )

  const faq = page.locator('#faq details').first()
  await faq.scrollIntoViewIfNeeded()
  await faq.locator('summary').click()

  await page.evaluate(() => {
    const video = document.querySelector<HTMLVideoElement>('video[data-bc-proof-video]')
    if (!video) throw new Error('proof video missing')
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 })
    Object.defineProperty(video, 'currentTime', { configurable: true, value: 76 })
    video.dispatchEvent(new Event('play'))
    video.dispatchEvent(new Event('timeupdate'))
    video.dispatchEvent(new Event('ended'))
  })

  await page.waitForFunction(() => {
    const names = ((window as any).__bitterclipAnalyticsEvents || []).map((event: any) => event.name)
    return names.includes('proof_cta_click') && names.includes('faq_open') &&
      names.includes('proof_video_play') && names.includes('proof_video_quartile') &&
      names.includes('proof_video_complete')
  })

  const spineEvents = await page.evaluate(() =>
    ((window as any).__bitterclipAnalyticsEvents || []).filter((event: any) =>
      ['proof_cta_click', 'agent_portability_view', 'pricing_view', 'faq_open',
        'proof_video_play', 'proof_video_quartile', 'proof_video_complete'].includes(event.name),
    ),
  )
  expect(spineEvents.every((event: any) =>
    !Object.keys(event.params).some((key) => /prompt|transcript|email|account|user|media_name/.test(key)),
  )).toBe(true)
})

test('renders the developer documentation page and navigation', async ({ page }) => {
  await page.goto('/docs')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="/docs.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip docs' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Start here' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Use it from your AI assistant' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Your first clip' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Connect ChatGPT' }).first()).toBeVisible()
})

test('renders the YouTube archive import guide with its ownership and publishing boundaries', async ({ page }) => {
  await page.goto('/docs/getting-started/import-youtube-takeout')

  await expect(
    page.locator(
      'link[rel="alternate"][type="text/markdown"][href="/docs/getting-started/import-youtube-takeout.md"]',
    ),
  ).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bitterclip.com/docs/getting-started/import-youtube-takeout',
  )
  await expect(page.getByRole('heading', { level: 1, name: 'Import your YouTube archive' })).toBeVisible()
  await expect(page.getByText('This is an archive import, not a YouTube downloader')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: '2. Choose ZIP and an archive size' })).toBeVisible()
  await expect(page.locator('article')).toContainText('50 GB is recommended')
  await expect(page.locator('article')).toContainText('2 GB works too')
  await expect(page.locator('article')).toContainText('Nothing in this flow publishes to YouTube')
  await expect(page.getByRole('link', { name: 'Takeout help' })).toHaveAttribute(
    'href',
    'https://support.google.com/accounts/answer/3024190',
  )
  await expect(page.getByRole('link', { name: 'YouTube owner-download help' })).toHaveAttribute(
    'href',
    'https://support.google.com/youtube/answer/56100?hl=en',
  )
  await expect(page.getByRole('link', { name: 'Connect YouTube for publishing' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport)
  await expect(page.getByRole('button', { name: 'Toggle navigation' })).toBeVisible()
})

test('tracks docs article, section, TOC, and sidebar analytics', async ({ page }) => {
  await page.goto('/docs/getting-started/your-first-clip')

  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'docs_article_view' &&
      event.params.docs_path === '/docs/getting-started/your-first-clip',
    ),
  )

  await page.locator('.docs-prose h2').first().scrollIntoViewIfNeeded()
  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'docs_section_view' &&
      event.params.docs_path === '/docs/getting-started/your-first-clip',
    ),
  )

  await page.locator('.docs-toc a').first().click()
  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'docs_toc_click' &&
      event.params.docs_path === '/docs/getting-started/your-first-clip',
    ),
  )

  await page.locator('.docs-sidebar a[href="/docs/assistants/overview"]').first().click()
  await page.waitForURL('**/docs/assistants/overview')
  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'docs_nav_click' &&
      String(event.params.link_url).includes('/docs/assistants/overview'),
    ) &&
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'page_view' &&
      event.params.page_path === '/docs/assistants/overview',
    ),
  )
})

test('forwards docs live editor demo events to analytics', async ({ page }) => {
  await page.goto('/docs/assistants/overview')

  const editor = page.locator('iframe[title="BitterClip — the live transcript editor"]')
  await expect(editor).toHaveAttribute('src', /embed\/clip-demo/)

  await page.evaluate(() => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe[title="BitterClip — the live transcript editor"]')
    if (!frame?.contentWindow) throw new Error('docs editor iframe missing')
    window.dispatchEvent(new MessageEvent('message', {
      data: { bitterclip_demo_event: 'export_revealed', detail: { has_download_url: true } },
      source: frame.contentWindow,
    }))
  })

  await page.waitForFunction(() =>
    (window as any).__bitterclipAnalyticsEvents?.some((event: any) =>
      event.name === 'bitterclip_demo_export_revealed' &&
      event.params.demo_surface === 'docs' &&
      event.params.docs_path === '/docs/assistants/overview',
    ),
  )
})

test('renders the assistant documentation page and live editor', async ({ page }) => {
  await page.goto('/docs/assistants/overview')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="/docs/assistants/overview.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'Use BitterClip from your AI assistant' })).toBeVisible()
  await expect(page.getByText('Claude supports custom connectors on every plan')).toBeVisible()
  await expect(page.locator('article')).toContainText('custom-app access and the actions an app may take depend on your plan and workspace policy')
  await expect(page.getByRole('heading', { name: 'Try the editor right here' })).toBeVisible()
  await expect(page.locator('iframe[title="BitterClip — the live transcript editor"]')).toHaveAttribute('src', /embed\/clip-demo/)
  await expect(page.getByText('app.bitterclip.com/mcp')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What you can ask for' })).toBeVisible()
  await expect(page.getByText('not the full list')).toBeVisible()
})

test('renders the blog index and Identity Studio launch post', async ({ page }) => {
  await page.goto('/blog')

  await expect(page.locator('link[rel="canonical"][href="https://bitterclip.com/blog"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/blog.md"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"][href="https://bitterclip.com/blog/rss.xml"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip Blog' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Your show has a signature now/ })).toBeVisible()
  await expect(page.getByAltText('Signature Studio full-screen lab showing a BitterClip wordmark opener mid-animation on a dark stage.').first()).toBeVisible()
  const blogIndexTrial = page.getByRole('main').getByRole('link', { name: 'Start Creator trial' })
  await expect(blogIndexTrial).toBeVisible()
  await expect(blogIndexTrial).toHaveAttribute('href', /[?&]plan=clip(?:&|$)/)

  await page.getByRole('link', { name: /Your show has a signature now/ }).click()
  await page.waitForURL('**/blog/your-show-has-a-signature-now')

  await expect(page.locator('link[rel="canonical"][href="https://bitterclip.com/blog/your-show-has-a-signature-now"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/blog/your-show-has-a-signature-now.md"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:type"][content="article"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:image"][content="https://bitterclip.com/images/blog/identity-studio/your-show-has-a-signature-now-og.jpg"]')).toHaveCount(1)
  await expect(page.locator('meta[name="twitter:card"][content="summary_large_image"]')).toHaveCount(1)
  await expect(page.locator('meta[property="article:published_time"][content="2026-07-08T00:00:00Z"]')).toHaveCount(1)
  await expect(page.locator('meta[property="article:author"][content="Michael Ruescher"]')).toHaveCount(1)
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(jsonLd).toContain('BlogPosting')
  expect(jsonLd).toContain('Michael Ruescher')
  expect(jsonLd).toContain('BitterClip')

  await expect(page.getByRole('heading', { level: 1, name: 'Your show has a signature now' })).toBeVisible()
  await expect(page.getByText('Introducing Identity Studio: branded openers, outros, and a signature look')).toBeVisible()
  await expect(page.getByAltText('Signature Studio full-screen lab showing a BitterClip wordmark opener mid-animation on a dark stage.')).toBeVisible()
  await expect(page.getByAltText('Project FX tab showing the signature shelf with saved opener and outro effects.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Founder-Led Podcast' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Strength & Positions' })).toBeVisible()
  await expect(page.getByText('Read my mind. MVP for a podcast: 30-sec sizzle intro hook')).toBeVisible()
  await expect(page.getByText(/min read/)).toBeVisible()
  const creatorTrial = page.getByLabel('Get started with BitterClip').getByRole('link', { name: 'Start Creator trial' })
  await expect(creatorTrial).toBeVisible()
  await expect(creatorTrial).toHaveAttribute('href', /app\.bitterclip\.com\/sign_up\?plan=clip(?:&|$)/)
  await expect(page.getByRole('link', { name: 'Use it with your assistant' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible()
})

test('renders the Gemini 3.7 benchmark post and its public evidence boundaries', async ({ page }) => {
  await page.goto('/blog/gemini-3-7-multiple-witnesses')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bitterclip.com/blog/gemini-3-7-multiple-witnesses',
  )
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
    'href',
    'https://bitterclip.com/blog/gemini-3-7-multiple-witnesses.md',
  )
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Visual analysis in BitterClip just got a lot faster',
  })).toBeVisible()
  await expect(page.locator('article')).toContainText('61.1% lower')
  await expect(page.locator('article')).toContainText('24.6% lower')
  await expect(page.locator('article')).toContainText('began at 146 seconds and ended at 20.8 seconds')
  await expect(page.locator('article')).toContainText(
    'We did not find a strong semantic difference between the two models',
  )
  await expect(page.locator('article')).toContainText(
    'Gemini 3.7 is now the primary model for BitterClip’s visual analysis',
  )
  await expect(page.locator('article')).toContainText('Gemini 3.6 remains the fallback')
  await expect(page.locator('article')).toContainText('not a reconciled provider bill')
  await expect(page.getByAltText(/sanitized model response/i)).toBeVisible()
  await expect(page.getByAltText(/model-authored evidence point/i)).toBeVisible()
  await expect(page.locator('article img')).toHaveCount(3)
})

test('renders the Pi and DeepSeek Harness field report with its concrete architecture', async ({ page }) => {
  await page.goto('/blog/pi-vs-deepseek-harness')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bitterclip.com/blog/pi-vs-deepseek-harness',
  )
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
    'href',
    'https://bitterclip.com/blog/pi-vs-deepseek-harness.md',
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://bitterclip.com/images/blog/pi-vs-deepseek-harness/pi-vs-deepseek-harness-og.png',
  )
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Pi vs. DeepSeek Harness: why we chose Pi',
  })).toBeVisible()
  await expect(page.locator('article')).toContainText(
    'The model is the intelligence. The harness is everything that lets that intelligence get work done',
  )
  await expect(page.locator('article')).toContainText('DeepSeek Harness v0.1.0-rc.7')
  await expect(page.getByRole('heading', { name: 'How we embedded Pi in BitterClip' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pi is not a security boundary' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Put the agent to work on a real recording' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pi' }).first()).toHaveAttribute('href', 'https://pi.dev/')
  await expect(page.getByRole('link', { name: 'DeepSeek Harness' }).first()).toHaveAttribute(
    'href',
    'https://github.com/deepseek-ai/deepseek-harness',
  )
  await expect(page.getByAltText(/BitterClip's embedded-agent architecture/i)).toBeVisible()
})

test('renders the privacy policy page', async ({ page }) => {
  await page.goto('/privacy')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/privacy.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Privacy policy.' })).toBeVisible()
  await expect(page.getByText('Effective date:')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Information We Collect' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI, Media, And Provider Processing' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'hello@bitterclip.com' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'YouTube API Services' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'YouTube Terms of Service' })).toBeVisible()
})

test('renders the terms of service page', async ({ page }) => {
  await page.goto('/terms')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/terms.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Terms of service.' })).toBeVisible()
  await expect(page.getByText('Effective date:')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Using BitterClip' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Publishing Integrations' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'hello@bitterclip.com' }).first()).toBeVisible()
})

test('renders the data deletion page and its Markdown alternate', async ({ page }) => {
  await page.goto('/data-deletion')

  await expect(page.locator(
    'link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/data-deletion.md"]',
  )).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Delete your data.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Disconnect the integration (instant)' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Delete your whole account' })).toBeVisible()
})

test('serves crawlable markdown alternates and discovery files', async ({ request }) => {
  const markdownPages = [
    { path: '/index.md', text: 'Footage in. Episode out.' },
    { path: '/docs.md', text: 'Use it from your AI assistant' },
    { path: '/docs/assistants/overview.md', text: 'Use BitterClip from your AI assistant' },
    {
      path: '/docs/getting-started/import-youtube-takeout.md',
      text: 'This is an archive import, not a YouTube downloader',
    },
    { path: '/blog.md', text: 'Your show has a signature now' },
    { path: '/blog/your-show-has-a-signature-now.md', text: 'Know what mattered in the recording' },
    { path: '/blog/we-stopped-making-templates.md', text: 'The template wall asked you to settle' },
    { path: '/blog/a-condensed-memory-of-the-work.md', text: 'a condensed memory of the work' },
    {
      path: '/blog/gemini-3-7-multiple-witnesses.md',
      text: 'Visual analysis in BitterClip just got a lot faster',
    },
    {
      path: '/blog/pi-vs-deepseek-harness.md',
      text: 'BitterClip remembers the video',
    },
    { path: '/privacy.md', text: 'BitterClip does not sell your recordings' },
    { path: '/terms.md', text: 'You retain your rights in recordings' },
    { path: '/data-deletion.md', text: 'Disconnect the integration' },
  ]

  for (const markdownPage of markdownPages) {
    const response = await request.get(markdownPage.path)
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).toContain(markdownPage.text)
  }

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  const robotsText = await robots.text()
  expect(robotsText).toContain('Sitemap: https://bitterclip.com/sitemap.xml')
  expect(robotsText).not.toMatch(/^LLMs:/m)

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  const sitemapText = await sitemap.text()
  expect(sitemapText).toContain('https://bitterclip.com/')
  expect(sitemapText).toContain('https://bitterclip.com/docs')
  expect(sitemapText).toContain('https://bitterclip.com/docs/assistants/overview')
  expect(sitemapText).toContain('https://bitterclip.com/docs/getting-started/import-youtube-takeout')
  expect(sitemapText).toContain('https://bitterclip.com/blog')
  expect(sitemapText).toContain('https://bitterclip.com/blog/your-show-has-a-signature-now')
  expect(sitemapText).toContain('https://bitterclip.com/blog/gemini-3-7-multiple-witnesses')
  expect(sitemapText).toContain('https://bitterclip.com/blog/pi-vs-deepseek-harness')
  expect(sitemapText).toContain('https://bitterclip.com/privacy')
  expect(sitemapText).toContain('https://bitterclip.com/terms')
  expect(sitemapText).toContain('https://bitterclip.com/data-deletion')
  expect(sitemapText).toContain('https://bitterclip.com/docs/help/troubleshooting')

  const rss = await request.get('/blog/rss.xml')
  expect(rss.ok()).toBeTruthy()
  const rssText = await rss.text()
  expect(rssText).toContain('<rss version="2.0"')
  expect(rssText).toContain('<title>Your show has a signature now</title>')
  expect(rssText).toContain('https://bitterclip.com/blog/your-show-has-a-signature-now')
  expect(rssText).toContain('<title>Visual analysis in BitterClip just got a lot faster</title>')
  expect(rssText).toContain('<title>Pi vs. DeepSeek Harness: why we chose Pi</title>')

  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBeTruthy()
  const llmsText = await llms.text()
  expect(llmsText).toContain('Recording → Episode → Clip')
  expect(llmsText).toContain('Use it from your AI assistant')
  expect(llmsText).toContain('https://bitterclip.com/docs/getting-started/import-youtube-takeout')
  expect(llmsText).toContain('Import your YouTube archive')
  expect(llmsText).toContain('Your show has a signature now')
  expect(llmsText).toContain('Visual analysis in BitterClip just got a lot faster')
  expect(llmsText).toContain('Pi vs. DeepSeek Harness: why we chose Pi')

  const llmsFull = await request.get('/llms-full.txt')
  expect(llmsFull.ok()).toBeTruthy()
  const llmsFullText = await llmsFull.text()
  expect(llmsFullText).toContain('Recording → Episode → Clip')
  expect(llmsFullText).toContain('Use BitterClip from your AI assistant')
  expect(llmsFullText).toContain('Connect ChatGPT')
  expect(llmsFullText).toContain('This is an archive import, not a YouTube downloader')
  expect(llmsFullText).toContain('50 GB is recommended')
  expect(llmsFullText).toContain('Troubleshooting')
  expect(llmsFullText).toContain('Your show has a signature now')
  expect(llmsFullText).toContain('Know what mattered in the recording')
  expect(llmsFullText).toContain('Visual analysis in BitterClip just got a lot faster')
  expect(llmsFullText).toContain('BitterClip remembers the video')
  expect(llmsFullText).toContain('$5 of agent work')
  expect(llmsFullText).toContain('10 source-footage hours')
  expect(llmsFullText).toContain('$20, $50, or $100')
  expect(llmsFullText).toContain('provider-owned exact cancel-before time')
  expect(llmsFullText).toContain('never auto-activate paid Creator')
  expect(llmsFullText).toContain('separate explicit $24 authorization')
  expect(llmsFullText).toContain('files up to 4 GB')
  expect(llmsFullText).not.toContain('your exact charge date')
  expect(llmsFullText).not.toContain('displayed trial end')
  expect(llmsFullText).not.toContain('30% markup')
})
