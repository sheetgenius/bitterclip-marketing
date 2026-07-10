import { nextTick, watch } from 'vue'

const APP_ORIGIN = 'https://app.bitterclip.com'
const EVENT_VALUE_LIMIT = 120

const DEMO_EVENT_ALLOWLIST = new Set([
  'editor_opened',
  'editor_closed',
  'clip_created',
  'generate_started',
  'generate_completed',
  'export_started',
  'export_revealed',
  'download_clicked',
  'download_failed',
  'publish_status_checked',
  'demo_cta_clicked',
  'external_opened',
  'tool_stubbed',
])

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    __bitterclipAnalyticsEvents?: Array<{
      name: string
      params: Record<string, unknown>
      at: number
    }>
  }
}

function cleanValue(value: unknown): unknown {
  if (typeof value === 'string') return value.slice(0, EVENT_VALUE_LIMIT)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return undefined
}

function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    const clean = cleanValue(value)
    if (clean !== undefined) out[key] = clean
  }
  return out
}

function sendEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const clean = cleanParams(params)
  window.__bitterclipAnalyticsEvents = window.__bitterclipAnalyticsEvents || []
  window.__bitterclipAnalyticsEvents.push({ name, params: clean, at: Date.now() })
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, clean)
  }
}

function docsSection(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts[0] === 'docs' ? (parts[1] || 'overview') : ''
}

function docsTitle() {
  return (
    document.querySelector<HTMLElement>('.docs-prose h1')?.innerText ||
    document.title.replace(/\s*·\s*BitterClip docs\s*$/, '') ||
    'BitterClip docs'
  ).trim()
}

function docsBaseParams(path: string) {
  return {
    docs_path: path,
    docs_section: docsSection(path),
    docs_title: docsTitle(),
  }
}

function normalizedUrl(anchor: HTMLAnchorElement) {
  try {
    return new URL(anchor.href, window.location.href)
  } catch {
    return null
  }
}

function linkText(anchor: HTMLAnchorElement) {
  return (anchor.innerText || anchor.getAttribute('aria-label') || anchor.title || anchor.href || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, EVENT_VALUE_LIMIT)
}

function isDocsRoute(path: string) {
  return path === '/docs' || path.startsWith('/docs/')
}

function isDocsIframeSource(source: MessageEventSource | null) {
  if (!source) return false
  return Array.from(document.querySelectorAll<HTMLIFrameElement>('.docs-prose iframe'))
    .some((frame) => frame.contentWindow === source)
}

function isHeadingVisible(heading: HTMLElement) {
  const rect = heading.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const route = useRoute()
  let lastPageViewPath = route.fullPath
  let sectionObserver: IntersectionObserver | null = null
  let articleTrackedFor = ''
  let observedPath = ''
  let seenSections = new Set<string>()

  router.afterEach((to, from) => {
    if (to.fullPath === from.fullPath || to.fullPath === lastPageViewPath) return
    lastPageViewPath = to.fullPath
    requestAnimationFrame(() => {
      sendEvent('page_view', {
        page_path: to.fullPath,
        page_location: `${window.location.origin}${to.fullPath}`,
        page_title: document.title,
      })
    })
  })

  function setupDocsSectionObserver(path: string) {
    sectionObserver?.disconnect()
    sectionObserver = null
    observedPath = path
    seenSections = new Set()
    if (!isDocsRoute(path)) return

    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('.docs-prose h2[id], .docs-prose h3[id]'),
    )
    if (!headings.length || !('IntersectionObserver' in window)) return

    function trackHeading(heading: HTMLElement) {
      const key = `${observedPath}#${heading.id}`
      if (seenSections.has(key)) return
      seenSections.add(key)
      sendEvent('docs_section_view', {
        ...docsBaseParams(observedPath),
        docs_heading_id: heading.id,
        docs_heading_text: heading.innerText.replace(/\s+/g, ' ').trim(),
        docs_heading_depth: heading.tagName.toLowerCase(),
      })
    }

    sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          trackHeading(entry.target as HTMLElement)
        }
      },
      { rootMargin: '0px 0px -65% 0px', threshold: 0 },
    )

    for (const heading of headings) sectionObserver.observe(heading)
    requestAnimationFrame(() => {
      const visibleHeading = headings.find(isHeadingVisible)
      if (visibleHeading) trackHeading(visibleHeading)
    })
  }

  async function refreshDocsTracking() {
    await nextTick()
    const path = route.path
    if (!isDocsRoute(path)) {
      sectionObserver?.disconnect()
      sectionObserver = null
      return
    }

    if (articleTrackedFor !== path) {
      articleTrackedFor = path
      sendEvent('docs_article_view', docsBaseParams(path))
    }
    setupDocsSectionObserver(path)
  }

  function handleDocsClick(event: MouseEvent) {
    if (!isDocsRoute(route.path)) return
    const target = event.target instanceof Element ? event.target : null
    const anchor = target?.closest('a')
    if (!(anchor instanceof HTMLAnchorElement)) return

    const url = normalizedUrl(anchor)
    if (!url) return
    const base = {
      ...docsBaseParams(route.path),
      link_url: url.href,
      link_text: linkText(anchor),
    }

    if (anchor.closest('.docs-toc')) {
      sendEvent('docs_toc_click', {
        ...base,
        docs_heading_id: url.hash.replace(/^#/, ''),
      })
      return
    }

    if (anchor.closest('.docs-sidebar')) {
      sendEvent('docs_nav_click', base)
      return
    }

    if (anchor.closest('.docs-md-link')) {
      sendEvent('docs_markdown_click', base)
      return
    }

    if (url.origin === APP_ORIGIN && url.pathname === '/sign_up') {
      sendEvent('docs_signup_click', base)
      return
    }

    if (url.origin === APP_ORIGIN) {
      sendEvent('docs_app_link_click', base)
      return
    }

    if (url.origin === window.location.origin && isDocsRoute(url.pathname)) {
      sendEvent('docs_internal_link_click', base)
      return
    }

    if (url.origin !== window.location.origin) {
      sendEvent('docs_outbound_click', base)
    }
  }

  function handleDocsDemoMessage(event: MessageEvent) {
    if (!isDocsRoute(route.path)) return
    const data = event.data
    if (!data || typeof data !== 'object') return
    const name = (data as { bitterclip_demo_event?: unknown }).bitterclip_demo_event
    if (typeof name !== 'string' || !DEMO_EVENT_ALLOWLIST.has(name)) return
    if (!isDocsIframeSource(event.source)) return

    const detail = (data as { detail?: unknown }).detail
    const params: Record<string, unknown> = {
      ...docsBaseParams(route.path),
      demo_surface: 'docs',
      demo_event: name,
    }
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      for (const [key, value] of Object.entries(detail as Record<string, unknown>)) {
        params[`demo_${key}`] = value
      }
    }
    sendEvent(`bitterclip_demo_${name}`, params)
  }

  document.addEventListener('click', handleDocsClick, true)
  window.addEventListener('message', handleDocsDemoMessage)
  watch(() => route.path, () => {
    requestAnimationFrame(() => { void refreshDocsTracking() })
  }, { immediate: true })
  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => { void refreshDocsTracking() })
  })

  return {
    provide: {
      trackEvent: sendEvent,
    },
  }
})
