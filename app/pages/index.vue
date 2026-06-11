<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const signupBaseUrl = 'https://app.bitterclip.com/sign_up'
type HeroTheme = 'dark' | 'light'
const DEFAULT_HERO_THEME: HeroTheme = 'dark'
type DemoSurface = 'hero' | 'editor'
type DemoEventName =
  | 'editor_opened'
  | 'editor_closed'
  | 'clip_created'
  | 'generate_started'
  | 'generate_completed'
  | 'export_started'
  | 'export_revealed'
  | 'download_clicked'
  | 'download_failed'
  | 'publish_status_checked'
  | 'demo_cta_clicked'
  | 'external_opened'
  | 'tool_stubbed'

type WindowWithDemoAnalytics = Window & {
  gtag?: (...args: unknown[]) => void
  __bitterclipDemoEvents?: Array<Record<string, unknown>>
}

const DEMO_EVENT_ALLOWLIST = new Set<DemoEventName>([
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

const demoStageRank: Record<string, number> = {
  default: 0,
  hero_editor_opened: 10,
  hero_clip_created: 20,
  hero_generate_started: 24,
  hero_generate_completed: 28,
  hero_export_started: 40,
  hero_export_revealed: 50,
  hero_download_failed: 54,
  hero_download_clicked: 60,
  hero_demo_cta_clicked: 70,
  editor_clip_created: 30,
  editor_export_started: 34,
  editor_export_revealed: 35,
  editor_download_clicked: 45,
}

const demoSignupStage = ref('default')

const signupUrl = computed(() => {
  const url = new URL(signupBaseUrl)
  url.searchParams.set('utm_source', 'bitterclip.com')
  url.searchParams.set('utm_medium', 'landing_page')
  url.searchParams.set('utm_campaign', 'homepage_editor_demo')
  url.searchParams.set('utm_content', demoSignupStage.value)
  url.searchParams.set('from', `landing_${demoSignupStage.value}`)
  return url.toString()
})

const resolveHeroTheme = (value: string | null): HeroTheme => (
  value === 'light' ? 'light' : DEFAULT_HERO_THEME
)

const readHeroThemeFromLocation = (): HeroTheme => {
  if (!import.meta.client) return DEFAULT_HERO_THEME

  const params = new URLSearchParams(window.location.search)
  return resolveHeroTheme(params.get('heroTheme') || params.get('theme'))
}

// FAQ: objection handling right before the pricing ask. Answers must stay
// grounded in shipped behavior (mcp.md, pricing ladder) — no invented features.
const faqItems = [
  {
    q: 'What happens after I sign up?',
    a: 'Create the free account, connect BitterClip in ChatGPT or Claude, and upload a recording. Ask for the strongest moment and the editor opens with it — check it, trim it, export.',
  },
  {
    q: 'Do I need ChatGPT, or does Claude work too?',
    a: 'Both. Enable the BitterClip app in ChatGPT, or add it as a Connector in Claude, and sign in. There’s no local setup and nothing to install.',
  },
  {
    q: 'Can the AI post something without me?',
    a: 'No. You see every clip in the editor before it’s exported, and nothing publishes without your explicit approval.',
  },
  {
    q: 'What can I upload?',
    a: 'Podcasts, interviews, calls, training sessions — audio or video, in files up to 4 GB (20 GB on Pro).',
  },
  {
    q: 'Do I have to learn a new editor?',
    a: 'The editor opens right in the chat. Drag across the words in the transcript and the cut follows the audio — if you can highlight text, you can cut a clip.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Your files stay downloadable on every plan, and everything has a 30-day refund — annual included.',
  },
]

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bitter',
    url: 'https://bitter.sh/',
    sameAs: [
      'https://github.com/sheetgenius',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BitterClip',
    url: 'https://bitterclip.com/',
    description: 'Turn long podcasts, interviews, and founder calls into short clips — right inside ChatGPT.',
    publisher: {
      '@type': 'Organization',
      name: 'Bitter',
      url: 'https://bitter.sh/',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BitterClip',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: 'https://bitterclip.com/',
    description: 'Ask ChatGPT for the best moments in a recording, trim them in a real editor, and post finished clips.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '99',
      priceCurrency: 'USD',
      offerCount: 3,
      url: signupBaseUrl,
      availability: 'https://schema.org/InStock',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
]

useHead({
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/index.md', title: 'BitterClip Markdown' },
  ],
  meta: [
    { property: 'og:url', content: 'https://bitterclip.com/' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(structuredData),
    },
  ],
})

// --- Live Editor Embed ---
// iframeHeight default (540) matches the widget's measured stable height, so the
// reserved slot doesn't shift when the real height postMessage lands.
const embedUrl = ref('')
const iframeHeight = ref(540)
const isIframeLoading = ref(true)
const demoActivated = ref(true)

// --- Live recording-card widget: the REAL product component, embedded ---
// The phone screen is FIXED so nothing ever moves the layout: not the embed
// reporting its hug height on load, not opening the in-frame editor (which
// asks for 640). Height messages from this iframe are deliberately ignored;
// content taller than the screen scrolls inside it, like a real phone.
// 488 = the widget's settled viewer height at both our widths (447 desktop /
// 441 mobile, measured 2026-06-10) plus the ~2 chat-bubble lines the terser
// assistant reply freed up — total phone height is unchanged from the 4-line
// bubble days, the screen just got roomier.
// (+20 from the full-bleed pass: the thread's old top padding became screen.)
const HERO_SCREEN_HEIGHT = 508
// Themes the phone chrome AND the embedded widget (?theme= on the embed URL).
// Production defaults to dark, while ?heroTheme=light (or ?theme=light) gives a
// stable preview path for the light-mode polish without a source edit.
const heroTheme = ref<HeroTheme>(readHeroThemeFromLocation())
const heroIframe = ref<HTMLIFrameElement | null>(null)
const editorIframe = ref<HTMLIFrameElement | null>(null)

const syncHeroThemeFromLocation = (): HeroTheme => {
  const resolvedTheme = readHeroThemeFromLocation()
  heroTheme.value = resolvedTheme
  return resolvedTheme
}

// src is set only after the page is interactive (deferred) so the cross-origin
// widget (which loads video) doesn't compete with first paint / hurt LCP+TBT.
const heroSrc = ref('')

// The handoff fan-out's clip card is a live instance of the clip-embed
// primitive (app.bitterclip.com/embed/clip/:id — poster + play, ~5KB page).
// Deferred like the other widgets; the static poster underneath is the
// placeholder until the iframe paints its own (near-identical) rest state.
const handoffClipSrc = ref('')

const onIframeLoad = () => {
  isIframeLoading.value = false
}

const activateDemo = () => {
  demoActivated.value = true
}

const sourceForMessage = (event: MessageEvent): DemoSurface | null => {
  if (heroIframe.value && event.source === heroIframe.value.contentWindow) return 'hero'
  if (editorIframe.value && event.source === editorIframe.value.contentWindow) return 'editor'
  return null
}

const setDemoStage = (surface: DemoSurface, name: DemoEventName) => {
  const next = `${surface}_${name}`
  if ((demoStageRank[next] || 0) > (demoStageRank[demoSignupStage.value] || 0)) {
    demoSignupStage.value = next
  }
}

const syncDocumentSignupLinks = () => {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent('bitterclip:signup-stage', {
    detail: { stage: demoSignupStage.value, href: signupUrl.value },
  }))
  document.querySelectorAll<HTMLAnchorElement>(`a[href="${signupBaseUrl}"], a[href^="${signupBaseUrl}?"]`).forEach((anchor) => {
    anchor.href = signupUrl.value
  })
}

const recordDemoEvent = (surface: DemoSurface, name: DemoEventName, detail: Record<string, unknown>) => {
  setDemoStage(surface, name)
  syncDocumentSignupLinks()
  const win = window as WindowWithDemoAnalytics
  const eventPayload: Record<string, unknown> = {
    demo_surface: surface,
    demo_event: name,
    demo_signup_stage: demoSignupStage.value,
  }
  for (const [key, value] of Object.entries(detail)) {
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      eventPayload[`demo_${key}`] = value
    }
  }
  win.__bitterclipDemoEvents = win.__bitterclipDemoEvents || []
  win.__bitterclipDemoEvents.push({ name, surface, detail, at: Date.now() })
  if (typeof win.gtag === 'function') {
    win.gtag('event', `bitterclip_demo_${name}`, eventPayload)
  }
}

const handleMessage = (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return
  const data = event.data as { height?: unknown, bitterclip_demo_event?: unknown, detail?: unknown }
  if (typeof data.bitterclip_demo_event === 'string' && DEMO_EVENT_ALLOWLIST.has(data.bitterclip_demo_event as DemoEventName)) {
    const surface = sourceForMessage(event)
    if (!surface) return
    const detail = data.detail && typeof data.detail === 'object' && !Array.isArray(data.detail)
      ? data.detail as Record<string, unknown>
      : {}
    recordDemoEvent(surface, data.bitterclip_demo_event as DemoEventName, detail)
    return
  }
  if (!('height' in data)) return
  const height = Number(data.height)
  if (isNaN(height) || height < 200 || height > 1500) return
  // Route by source: the hero phone's screen is FIXED (no layout movement,
  // ever) so its height reports are dropped on the floor — but they must not
  // fall through to resize the lower editor demo.
  if (heroIframe.value && event.source === heroIframe.value.contentWindow) {
    return
  }
  iframeHeight.value = height
}

// Run after the browser is idle (post first-paint), with a timeout fallback.
const afterIdle = (fn: () => void) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback
  if (typeof ric === 'function') {
    ric(fn, { timeout: 1500 })
  } else {
    setTimeout(fn, 1200)
  }
}

onMounted(() => {
  syncHeroThemeFromLocation()
  syncDocumentSignupLinks()

  // Mobile load gate: on small viewports, deactivate by default to preserve bandwidth
  if (window.innerWidth < 768) {
    demoActivated.value = false
  }

  window.addEventListener('message', handleMessage)

  // Defer loading the live cross-origin widgets until the browser is idle, so they
  // don't block first paint / hurt LCP+TBT. Both slots reserve their measured stable
  // height up front (skeleton for the hero, min-height for the editor), so swapping
  // in the real iframe causes no layout shift.
  afterIdle(() => {
    const resolvedHeroTheme = syncHeroThemeFromLocation()

    // Build the editor embed URL: base (overridable via ?embed= for local dev) +
    // the bare editor + a real demo clip the site hosts, so Export plays + downloads.
    const base = (new URLSearchParams(window.location.search).get('embed') || 'https://app.bitterclip.com/embed/clip-demo').split('?')[0]
    const clip = `${window.location.origin}/clips/day-1-opening.mp4`
    embedUrl.value = `${base}?bare=1&clip=${encodeURIComponent(clip)}`

    // The hero embed is the FULL surface: tapping "Open in editor" opens the
    // real composition editor in-frame (the embed host grants display-mode and
    // lazy-loads the transcript). ?clip= gives its stubbed export a real
    // pre-rendered MP4 to reveal — same contract as the clip-demo above.
    // (Only https origins pass the embed's allowlist, so on plain-http local
    // dev the export reveal is simply absent — everything else still works.)
    heroSrc.value = `https://app.bitterclip.com/embed/recording/src_qjxzecbketjkby2eynbi?bare=1&theme=${resolvedHeroTheme}&clip=${encodeURIComponent(clip)}`
    handoffClipSrc.value = 'https://app.bitterclip.com/embed/clip/clip_yf9ibrk2b7v13yzztbba'
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <div class="relative w-full">
    <div class="absolute top-0 left-0 right-0 h-[680px] hero-backdrop-mask opacity-[0.08] -z-10 pointer-events-none" />

    <main class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-24 relative">

      <!-- 1. Hero -->
      <div class="grid lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-12 items-center mb-16 sm:mb-24">

        <!-- Left: the pitch -->
        <div class="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
          <h1 class="font-display text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.035em] text-white leading-[1.04] mb-6">
            Cut your clips
            <span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent block">
              inside ChatGPT.
            </span>
          </h1>

          <p class="text-zinc-400 text-lg sm:text-xl font-sans max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
            Upload a podcast, interview, or founder call and just ask. ChatGPT finds the moment and opens a real editor right in the chat — trim it, hear it in context, and post a finished clip. No new app to learn.
          </p>

          <div class="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
            <a
              :href="signupUrl"
              class="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Clip your first recording</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#demo"
              class="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 px-5 py-2.5 font-mono text-xs font-bold text-zinc-300 transition duration-200 hover:border-[#f28f84]/40 hover:bg-[#f28f84]/[0.06] hover:text-white min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Try the editor
            </a>
          </div>

          <p class="text-xs text-zinc-400 font-mono mt-5">Free to start — 60 minutes of footage a month. Made for founders, podcasters, and coaches doing their own marketing.</p>
        </div>

        <!-- Right: the real product, shown inside a phone (ChatGPT on mobile).
             Max-sized frame (~iPhone Pro Max) so the live widget gets room. -->
        <div class="relative mx-auto w-full max-w-[368px] lg:max-w-none lg:w-[392px]">
          <!-- handwritten callout. Text sits clear to the LEFT of the phone (no
               overlap); the arrow sweeps DOWN to the live MCP widget below — not
               the top of the conversation. -->
          <div class="hidden lg:block absolute -top-8 -left-[22.5rem] z-30 w-[340px] text-right -rotate-[5deg] pointer-events-none select-none">
            <span class="font-hand text-[25px] leading-[1.12] text-[#ffb4a8] block whitespace-nowrap">this is the actual UI</span>
            <span class="font-hand text-[25px] leading-[1.12] text-[#ffb4a8]/80 block whitespace-nowrap">inside ChatGPT &amp; Claude</span>
          </div>
          <svg viewBox="0 0 130 210" fill="none" class="hidden lg:block absolute top-[2.8rem] -left-[6rem] w-[130px] h-[210px] z-30 text-[#ffb4a8]/85 pointer-events-none">
            <path d="M44 2 C 24 76, 30 152, 114 197" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M103 181 L114 197 L95 197" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>

          <!-- the phone, tilted in 3D for depth -->
          <div class="relative mx-auto w-full max-w-[368px] lg:[transform:perspective(1800px)_rotateY(-9deg)_rotateX(2.5deg)_rotateZ(0.6deg)] transform-gpu">
            <div class="absolute -inset-6 bg-[#f28f84]/8 rounded-[3.5rem] blur-3xl -z-10 pointer-events-none"></div>

            <!-- phone: titanium frame -->
          <div class="relative rounded-[3rem] p-[3px] bg-gradient-to-br from-zinc-500 via-zinc-700 to-zinc-800 ring-1 ring-white/20 shadow-[0_45px_90px_-25px_rgba(0,0,0,0.85)]">
            <!-- side buttons (titanium) -->
            <span class="absolute -left-[3px] top-[104px] w-[3px] h-8 rounded-l-md bg-gradient-to-b from-zinc-500 to-zinc-700"></span>
            <span class="absolute -left-[3px] top-[152px] w-[3px] h-12 rounded-l-md bg-gradient-to-b from-zinc-500 to-zinc-700"></span>
            <span class="absolute -right-[3px] top-[132px] w-[3px] h-16 rounded-r-md bg-gradient-to-b from-zinc-500 to-zinc-700"></span>

            <!-- black bezel band -->
            <div class="rounded-[2.8rem] bg-black p-[7px]">
              <!-- screen (themed: ChatGPT dark vs light chrome) -->
              <div
                data-testid="hero-phone-screen"
                class="relative rounded-[2.45rem] overflow-hidden"
                :class="heroTheme === 'light' ? 'bg-[#fdfdfc] shadow-[inset_0_0_0_1px_rgba(24,24,27,0.08)]' : 'bg-black'"
              >
                <!-- glass reflection -->
                <div
                  class="absolute inset-0 z-20 pointer-events-none"
                  :class="heroTheme === 'light' ? 'bg-gradient-to-br from-white/55 via-transparent to-zinc-950/[0.03]' : 'bg-gradient-to-br from-white/[0.10] via-transparent to-transparent'"
                ></div>
                <!-- top fade: content scrolls UNDER the floating chrome and
                     dissolves at the screen edge (the iOS frosted top), instead
                     of stopping below it. Sits above content, below the island. -->
                <div
                  class="absolute inset-x-0 top-0 h-14 z-[25] pointer-events-none"
                  :class="heroTheme === 'light' ? 'bg-gradient-to-b from-[#fdfdfc] via-[#fdfdfc]/75 to-transparent' : 'bg-gradient-to-b from-black via-black/75 to-transparent'"
                ></div>
                <!-- dynamic island -->
                <div
                  class="absolute top-2.5 left-1/2 -translate-x-1/2 w-[34%] h-[26px] bg-black rounded-full z-30 ring-1"
                  :class="heroTheme === 'light' ? 'ring-zinc-950/10' : 'ring-white/5'"
                ></div>

              <!-- conversation thread: full-bleed — the first bubble tucks up
                   under the camera pill (slightly occluded, like real content
                   mid-scroll) and the top fade sells the depth. -->
              <div class="pt-[22px] pb-7 px-3 space-y-3">
                <!-- user message bubble, right — faithful to ChatGPT per theme:
                     light mode keeps the softer native ChatGPT gray on white;
                     dark mode preserves the current approved production look. -->
                <div class="flex justify-end">
                  <div
                    class="max-w-[88%] rounded-3xl px-3.5 py-2"
                    :class="heroTheme === 'light' ? 'bg-[#f4f4f4] border border-zinc-200/80 shadow-sm' : 'bg-[#f4f4f4]'"
                  >
                    <p class="text-[13px] leading-relaxed text-left" :class="heroTheme === 'light' ? 'text-zinc-950' : 'text-zinc-900'">Pull the strongest moments from episode one and cut me clips.</p>
                  </div>
                </div>

                <!-- assistant reply: no bubble, just text -->
                <div class="px-0.5">
                  <p class="text-[13px] leading-relaxed text-left" :class="heroTheme === 'light' ? 'text-zinc-800' : 'text-zinc-100'">The strongest moment is where you explain why you started. I found three cuts — open one, tighten the range, and check it before you post.</p>
                </div>

                <!-- The REAL recording-card component, embedded live from the product.
                     The slot reserves its measured stable height up front (no CLS),
                     and the live iframe src is set only after the page is idle. A
                     seamless skeleton of the same height holds the space until then. -->
                <div class="relative w-full" :style="{ height: HERO_SCREEN_HEIGHT + 'px' }">
                  <!-- skeleton placeholder: looks like the recording card loading -->
                  <div
                    v-if="!heroSrc"
                    class="absolute inset-0 rounded-2xl border p-3 flex flex-col gap-3 overflow-hidden"
                    :class="heroTheme === 'light' ? 'bg-zinc-50 border-zinc-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]' : 'bg-zinc-900/40 border-zinc-800/60'"
                    aria-hidden="true"
                  >
                    <div class="h-24 rounded-xl animate-pulse" :class="heroTheme === 'light' ? 'bg-zinc-200/80' : 'bg-zinc-800/50'"></div>
                    <div class="h-3 w-2/3 rounded animate-pulse" :class="heroTheme === 'light' ? 'bg-zinc-200/90' : 'bg-zinc-800/50'"></div>
                    <div class="h-3 w-1/2 rounded animate-pulse" :class="heroTheme === 'light' ? 'bg-zinc-200/70' : 'bg-zinc-800/40'"></div>
                    <div class="mt-1 grid grid-cols-3 gap-2">
                      <div class="h-14 rounded-lg animate-pulse" :class="heroTheme === 'light' ? 'bg-zinc-200/70' : 'bg-zinc-800/40'"></div>
                      <div class="h-14 rounded-lg animate-pulse" :class="heroTheme === 'light' ? 'bg-zinc-200/70' : 'bg-zinc-800/40'"></div>
                      <div class="h-14 rounded-lg animate-pulse" :class="heroTheme === 'light' ? 'bg-zinc-200/70' : 'bg-zinc-800/40'"></div>
                    </div>
                  </div>
                  <iframe
                    v-if="heroSrc"
                    ref="heroIframe"
                    :src="heroSrc"
                    title="BitterClip — episode one, cut into clips"
                    loading="lazy"
                    scrolling="no"
                    class="absolute inset-0 w-full h-full block rounded-2xl overflow-hidden bg-transparent"
                    :style="{ border: 0 }"
                  ></iframe>
                </div>
              </div>

              <!-- home indicator -->
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-[36%] h-[5px] rounded-full z-30" :class="heroTheme === 'light' ? 'bg-black/25' : 'bg-white/40'"></div>
              </div>
            </div>
          </div>
          </div>
        </div>

      </div>

      <!-- TESTIMONIAL BAND — two featured customers, right beneath the hero.
           Both quotes signed off by Andrew and Rohan (2026-06-10). -->
      <section aria-label="Customer testimonials" class="mb-24">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          <figure class="flex flex-col sm:flex-row items-center text-center sm:text-left gap-7 sm:gap-9">
            <div class="shrink-0 flex flex-col items-center gap-4">
              <img
                src="/images/andrew_williams_strength_and_positions_coach.jpg"
                alt="Andrew Williams"
                width="160"
                height="160"
                loading="lazy"
                decoding="async"
                class="w-40 h-40 rounded-full object-cover ring-1 ring-white/10 bg-[#f28f84]/10 shadow-[0_0_60px_-12px_rgba(242,143,132,0.45)]"
              />
              <div class="max-w-56 font-mono text-[10px] uppercase tracking-widest text-center leading-relaxed">
                <span class="block text-zinc-200">Andrew Williams</span>
                <span class="block mt-0.5 text-zinc-500">Head Coach</span>
                <a href="https://www.strengthandpositions.com/coaches" target="_blank" rel="noopener" class="mt-1.5 inline-flex items-center justify-center gap-1.5 text-[#f28f84]/90 hover:text-[#ffa89e] transition-colors">
                  <img
                    src="/images/andrew_williams_strength_and_positions.png"
                    alt=""
                    width="14"
                    height="14"
                    loading="lazy"
                    decoding="async"
                    class="w-3.5 h-3.5 rounded-sm object-contain"
                  />
                  <span>Strength &amp; Positions</span>
                </a>
              </div>
            </div>
            <!-- muted base, white key phrase: the quote skims itself. The opening
                 mark hangs in the margin so every line starts flush. -->
            <blockquote class="font-display text-lg sm:text-xl font-medium tracking-tight leading-[1.55] text-zinc-400 text-balance sm:[text-indent:-0.5em]">
              &ldquo;Working through session footage is <span class="text-white">the worst three hours of my week &mdash; and the most important.</span> It&rsquo;s how I remember exactly what happened with a client and build on it next session.&rdquo;
            </blockquote>
          </figure>

          <figure class="flex flex-col sm:flex-row items-center text-center sm:text-left gap-7 sm:gap-9">
            <div class="shrink-0 flex flex-col items-center gap-4">
              <img
                src="/images/rohan_karunakaran.jpg"
                alt="Rohan Karunakaran"
                width="160"
                height="160"
                loading="lazy"
                decoding="async"
                class="w-40 h-40 rounded-full object-cover ring-1 ring-white/10 bg-[#f28f84]/10 shadow-[0_0_60px_-12px_rgba(242,143,132,0.45)]"
              />
              <div class="max-w-56 font-mono text-[10px] uppercase tracking-widest text-center leading-relaxed">
                <span class="block text-zinc-200">Rohan Karunakaran</span>
                <span class="block mt-0.5 text-zinc-500">Founder</span>
                <a href="https://www.frontier-studio.com/" target="_blank" rel="noopener" class="mt-1.5 inline-block text-[#f28f84]/90 hover:text-[#ffa89e] transition-colors">Frontier Studio</a>
              </div>
            </div>
            <blockquote class="font-display text-lg sm:text-xl font-medium tracking-tight leading-[1.55] text-zinc-400 text-balance sm:[text-indent:-0.5em]">
              &ldquo;The friction was the whole problem with founder content &mdash; timestamps, clunky editors, the back-and-forth on every clip. <span class="text-white">Now I make the clips inside Claude, while I&rsquo;m already in there.</span>&rdquo;
            </blockquote>
          </figure>

        </div>
      </section>

      <!-- SECTION 01 — Right in ChatGPT & Claude (copy LEFT, live editor RIGHT — the centerpiece) -->
      <section id="demo" aria-label="Right in ChatGPT and Claude" class="mb-24 relative scroll-mt-28">
        <div class="grid lg:grid-cols-[1fr_minmax(520px,1.1fr)] gap-8 lg:gap-12 items-center">

          <!-- LEFT: the copy -->
          <div class="max-w-xl">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">01 — Right in ChatGPT &amp; Claude</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
              Other clippers guess. Yours knows the whole conversation.
            </h2>
            <p class="text-zinc-400 text-base sm:text-lg leading-relaxed mb-6">
              Drop in a podcast, a founder call, or a training session. BitterClip transcribes it and labels every speaker — names and all — automatically. By the time you open ChatGPT or Claude, the whole conversation is already there: who said it, what came before and after. Ask for the sharpest exchange — the moments it picks land.
            </p>

            <!-- motif row: it suggests → you approve → you post -->
            <div class="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              <span class="text-[#f28f84]">ChatGPT suggests</span>
              <span class="text-zinc-600">&rarr;</span>
              <span class="text-[#f28f84]">you approve</span>
              <span class="text-zinc-600">&rarr;</span>
              <span class="text-[#f28f84]">you post</span>
            </div>

            <!-- mid-page CTA: the editor alongside is the peak-interest moment —
                 give it an action so momentum doesn't die between hero and pricing. -->
            <div class="mt-8 flex items-center gap-4">
              <a
                :href="signupUrl"
                class="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span>Try it with your recording</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <span class="text-[11px] text-zinc-500">Free — 60 minutes a month</span>
            </div>
          </div>

          <!-- RIGHT: the live editor, bare. The speaker chips straddle its top edge like
               presence indicators — the same peach/emerald the embed color-codes speakers with. -->
          <div class="relative w-full">
            <!-- speaker-colored atmosphere, one soft glow per speaker -->
            <div class="absolute -inset-x-10 -inset-y-12 -z-10 pointer-events-none" aria-hidden="true">
              <div class="absolute left-0 top-0 w-3/4 h-3/4 rounded-full bg-[#f28f84]/[0.06] blur-3xl"></div>
              <div class="absolute right-0 bottom-0 w-3/4 h-3/4 rounded-full bg-emerald-400/[0.05] blur-3xl"></div>
            </div>

            <!-- two little speaker bubbles — in-flow on mobile, straddling the embed's top edge from sm: up.
                 Andrew's chip uses his headshot, while Adrian's chip uses the product's no-photo fallback.
                 Speaking-share %s are placeholders until the embed points at the coaching recording. -->
            <div class="flex items-center justify-end gap-2 mb-3 z-30 sm:absolute sm:-top-3.5 sm:right-5 sm:mb-0">
              <span class="inline-flex items-center gap-1.5 rounded-full border border-[#f28f84]/30 bg-zinc-950/90 backdrop-blur-sm pl-1 pr-2.5 py-1 shadow-lg shadow-black/40">
                <img
                  src="/images/andrew_williams_strength_and_positions_coach.jpg"
                  alt="Andrew"
                  width="20"
                  height="20"
                  class="rounded-full w-5 h-5 ring-1 ring-[#f28f84]/60 object-cover shrink-0"
                />
                <span class="text-xs font-semibold text-white">Andrew</span>
                <span class="font-mono text-[10px] text-[#f28f84]">72%</span>
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-zinc-950/90 backdrop-blur-sm pl-1 pr-2.5 py-1 shadow-lg shadow-black/40">
                <span class="flex items-center justify-center rounded-full w-5 h-5 ring-1 ring-emerald-400/60 bg-emerald-400/15 font-mono text-[9px] font-bold text-emerald-400 shrink-0" aria-hidden="true">A</span>
                <span class="text-xs font-semibold text-white">Adrian</span>
                <span class="font-mono text-[10px] text-emerald-400">28%</span>
              </span>
            </div>

            <!-- the embed, bare — hairline ring and a deep soft shadow, no chrome -->
            <div class="relative rounded-2xl overflow-hidden ring-1 ring-white/[0.06] shadow-[0_24px_80px_-28px_rgba(0,0,0,0.8)] min-h-[400px]">

              <!-- Mobile Activation Gate -->
              <div v-if="!demoActivated" class="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center z-20">
                <p class="font-mono text-[8px] text-[#f28f84] uppercase tracking-widest mb-3">The real editor</p>
                <h3 class="font-display text-lg font-bold text-white mb-2">The same editor that opens in ChatGPT.</h3>
                <p class="text-zinc-400 text-xs max-w-sm mb-6 leading-relaxed">
                  Drag across the words to cut a clip, then check it against the recording. Tap to load it.
                </p>
                <button
                  @click="activateDemo"
                  class="px-5 py-2.5 font-mono text-xs font-bold bg-[#f28f84] text-zinc-950 rounded-lg shadow-lg shadow-[#f28f84]/10 hover:bg-[#ffa89e] hover:scale-102 active:scale-98 transition duration-200 cursor-pointer min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Load the editor
                </button>
              </div>

              <!-- Skeleton loader -->
              <div v-if="demoActivated && isIframeLoading" role="status" class="absolute inset-0 bg-[#060608]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none transition-opacity duration-300">
                <div class="flex flex-col items-center gap-4 text-center p-6">
                  <div class="relative w-8 h-8" aria-hidden="true">
                    <div class="absolute inset-0 rounded-full border-2 border-[#f28f84]/20"></div>
                    <div class="absolute inset-0 rounded-full border-2 border-t-[#f28f84] animate-spin"></div>
                  </div>
                  <span class="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">Loading the editor…</span>
                </div>
              </div>

              <!-- Reserve the editor's stable height up front so the panel doesn't grow
                   when the (deferred) iframe mounts. The src is only set after the page
                   is idle, so the live editor doesn't compete with first paint. -->
              <div :style="{ minHeight: `${iframeHeight}px` }">
                <iframe
                  v-if="demoActivated && embedUrl"
                  ref="editorIframe"
                  :src="embedUrl"
                  title="BitterClip — the live transcript editor"
                  loading="lazy"
                  @load="onIframeLoad"
                  @mouseenter="$event.target.contentWindow?.focus()"
                  class="w-full block transition-[height] duration-200"
                  :style="{ height: `${iframeHeight}px`, border: 0, background: 'transparent' }"
                />
              </div>

            </div>
          </div>

        </div>
      </section>

      <!-- SECTION 02 — The handoff (copy on top, clip→destinations fan-out below) -->
      <section aria-label="The handoff" class="mb-24">
        <div class="max-w-2xl mb-10">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">02 — The handoff</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
            Finished clips — out the door, your way.
          </h2>
          <p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Trim it, export, done. Post it straight to YouTube, X, Instagram, or LinkedIn, or grab a shareable link. And invite a client to the same recording so they can pull their own clips in their ChatGPT or Claude — upload once, everyone clips.
          </p>
        </div>

        <!-- Fan-out: one finished clip on the left arcs to four destinations on the right -->
        <div class="handoff-fan mt-2">
          <!-- SOURCE: the featured customer clip — Andrew coaching Adrian (Lu Xiaojun-style
               technique work) — served LIVE by the clip-embed primitive
               (/embed/clip/:id), the same surface a Pro customer projects onto
               their own site. The static poster card paints first and stays as
               the placeholder; the deferred iframe lays its near-identical rest
               state over it, and one click plays. -->
          <div class="handoff-source">
            <div class="relative w-[250px] sm:w-[280px]">
              <div class="relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
                <img
                  src="/clips/coaching-session-poster.jpg"
                  alt="Andrew Williams coaching his client Adrian through a lift at Strength & Positions"
                  width="280"
                  height="158"
                  loading="lazy"
                  decoding="async"
                  class="w-full aspect-video object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="flex items-center justify-center w-10 h-10 rounded-full bg-[#f28f84] shadow-[0_0_24px_rgba(242,143,132,0.45)]">
                    <svg viewBox="0 0 24 24" fill="#1a1a1a" class="w-4 h-4 translate-x-px" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
                <span class="absolute bottom-2 right-2.5 font-mono text-[10px] font-semibold text-white/90">1:09</span>
                <iframe
                  v-if="handoffClipSrc"
                  :src="handoffClipSrc"
                  class="absolute inset-0 w-full h-full"
                  style="border:0"
                  title="Watch: Andrew Williams coaching Adrian at Strength & Positions"
                  loading="lazy"
                  allow="fullscreen"
                  allowfullscreen
                ></iframe>
              </div>
            </div>
          </div>

          <!-- FAN: curved brand-colored lines from the clip to each destination -->
          <svg
            class="handoff-lines"
            viewBox="0 0 520 360"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M8 180 C 200 180 332 20 512 20" class="handoff-line" style="--line-color:#ff0000" />
            <path d="M8 180 C 200 180 332 99 512 99" class="handoff-line" style="--line-color:#e7e7e7" />
            <path d="M8 180 C 200 180 332 179 512 179" class="handoff-line" style="--line-color:#d62976" />
            <path d="M8 180 C 200 180 332 259 512 259" class="handoff-line" style="--line-color:#0a66c2" />
            <path d="M8 180 C 200 180 332 338 512 338" class="handoff-line" style="--line-color:#f28f84" />
          </svg>

          <!-- DESTINATIONS: four full-color logos stacked, evenly spaced -->
          <div role="list" class="handoff-destinations">
            <!-- YouTube -->
            <div role="listitem" class="handoff-dest group">
              <svg viewBox="0 0 28 20" class="w-[56px] h-auto shrink-0" aria-hidden="true">
                <rect width="28" height="20" rx="6" fill="#FF0000" />
                <path d="M11.4 5.5v9l7.2-4.5z" fill="#fff" />
              </svg>
              <span class="text-sm font-semibold text-zinc-200 tracking-tight">YouTube</span>
            </div>
            <!-- X -->
            <div role="listitem" class="handoff-dest group">
              <svg viewBox="0 0 24 24" fill="#fff" class="w-[44px] h-[44px] shrink-0" aria-hidden="true">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
              <span class="text-sm font-semibold text-zinc-200 tracking-tight">X</span>
            </div>
            <!-- Instagram -->
            <div role="listitem" class="handoff-dest group">
              <svg viewBox="0 0 24 24" class="w-[48px] h-[48px] shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id="ig-grad-dest" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#feda75" />
                    <stop offset="0.25" stop-color="#fa7e1e" />
                    <stop offset="0.5" stop-color="#d62976" />
                    <stop offset="0.75" stop-color="#962fbf" />
                    <stop offset="1" stop-color="#4f5bd5" />
                  </linearGradient>
                </defs>
                <rect width="24" height="24" rx="6" fill="url(#ig-grad-dest)" />
                <rect x="5" y="5" width="14" height="14" rx="4.4" fill="none" stroke="#fff" stroke-width="1.7" />
                <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" stroke-width="1.7" />
                <circle cx="16.7" cy="7.3" r="1.15" fill="#fff" />
              </svg>
              <span class="text-sm font-semibold text-zinc-200 tracking-tight">Instagram</span>
            </div>
            <!-- LinkedIn -->
            <div role="listitem" class="handoff-dest group">
              <svg viewBox="0 0 24 24" class="w-[48px] h-[48px] shrink-0" aria-hidden="true">
                <rect width="24" height="24" rx="5" fill="#0A66C2" />
                <path fill="#fff" d="M4.98 4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM3.5 9.2h2.96V20H3.5V9.2Zm4.74 0h2.84v1.48h.05c.4-.72 1.36-1.48 2.79-1.48 2.99 0 3.55 1.92 3.55 4.42V20h-2.96v-4.5c0-1.07-.02-2.45-1.5-2.45-1.5 0-1.73 1.16-1.73 2.37V20H8.24V9.2Z" />
              </svg>
              <span class="text-sm font-semibold text-zinc-200 tracking-tight">LinkedIn</span>
            </div>
            <!-- Shareable link -->
            <div role="listitem" class="handoff-dest group">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f28f84" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="w-[44px] h-[44px] shrink-0" aria-hidden="true">
                <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              <span class="text-sm font-semibold text-zinc-200 tracking-tight">Shareable link</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 03 — FAQ: catch bottom-funnel objections before the pricing ask.
           Every answer is grounded in documented product facts (mcp.md / pricing
           ladder) — no invented capabilities. Also emitted as FAQPage JSON-LD. -->
      <section id="faq" aria-label="Common questions" class="mb-24 scroll-mt-28">
        <div class="max-w-2xl mb-10">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">03 — Before you ask</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            The questions everyone asks first.
          </h2>
        </div>

        <dl class="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl">
          <div v-for="item in faqItems" :key="item.q">
            <dt class="text-sm font-semibold text-white mb-1.5">{{ item.q }}</dt>
            <dd class="text-sm text-zinc-400 leading-relaxed">{{ item.a }}</dd>
          </div>
        </dl>
      </section>

      <!-- 7. Close -->
      <section id="pricing" class="relative scroll-mt-28">
        <div class="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#f28f84]/10 to-transparent rounded-[3rem] blur-3xl -z-10 pointer-events-none" />

        <div class="max-w-2xl mx-auto text-center mb-8">
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Bring one recording. Leave with clips.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Upload a podcast, interview, or founder call — finished clips you've checked yourself, cut right inside ChatGPT. Start free; upgrade when an hour a month stops being enough.
          </p>
        </div>


        <!-- the ladder: Free / Clip / Pro. Clip carries the accent + the only filled
             CTA (it's the plan we steer to; $99 Pro anchors the price). Every card's
             CTA lands on the same signup — the app handles plan choice. -->
        <div class="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto items-stretch text-left">

          <!-- FREE (second in the stack on mobile — Clip leads there) -->
          <div class="relative rounded-2xl glass-panel p-6 flex flex-col max-md:order-2">
            <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Free</p>
            <p class="font-display text-3xl font-bold text-white">$0</p>
            <p class="text-zinc-400 text-xs mt-1.5 mb-5">Try it for real.</p>
            <ul class="space-y-2 text-[13px] text-zinc-300 leading-snug mb-7">
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>60 minutes of footage a month</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>10 clip exports at 1080p (watermarked)</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 4 GB</li>
            </ul>
            <a
              :href="signupUrl"
              class="mt-auto border border-zinc-700 text-zinc-200 font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:border-[#f28f84]/60 hover:text-white active:scale-98 flex items-center justify-center cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >Start free</a>
            <p class="text-center text-[11px] text-zinc-500 mt-2.5">Resets every month — not a trial</p>
          </div>

          <!-- CLIP — the recommended plan carries the accent and the only filled CTA.
               On mobile it jumps to the top of the stack so it's the first card a
               phone visitor sees. -->
          <div class="relative rounded-2xl glass-panel-accented glass-reflection corner-ticks p-6 flex flex-col overflow-hidden max-md:order-1">
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f28f84]/70 to-transparent pointer-events-none"></div>
            <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#f28f84]/[0.07] to-transparent pointer-events-none"></div>
            <p class="absolute top-6 right-6 font-mono text-[10px] uppercase tracking-widest text-[#f28f84] border border-[#f28f84]/40 rounded-full px-2.5 py-1">Recommended</p>
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-2">Clip</p>
            <p class="font-display text-3xl font-bold text-white">$9<span class="text-lg text-zinc-400 font-semibold">/month</span></p>
            <p class="text-zinc-400 text-xs mt-1.5 mb-1">or $90/year — 2 months free.</p>
            <p class="text-zinc-400 text-xs mb-5">For a weekly show or regular interviews.</p>
            <ul class="space-y-2 text-[13px] text-zinc-300 leading-snug mb-7">
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>10 hours of footage a month</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>No watermark — 150 clip exports at 1080p</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 4 GB</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Add 5 more hours for $5, anytime</li>
            </ul>
            <a
              :href="signupUrl"
              class="mt-auto bg-[#f28f84] text-zinc-950 font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:bg-[#ffa89e] active:scale-98 flex items-center justify-center gap-2 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Start clipping</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <p class="text-center text-[11px] text-zinc-500 mt-2.5">30-day refund, annual included · cancel anytime</p>
          </div>

          <!-- PRO — plain panel: the $99 price anchors on its own; the accent lives
               on Clip, the plan we steer to. -->
          <div class="relative rounded-2xl glass-panel p-6 flex flex-col max-md:order-3">
            <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Pro</p>
            <p class="font-display text-3xl font-bold text-white">$99<span class="text-lg text-zinc-400 font-semibold">/month</span></p>
            <p class="text-zinc-400 text-xs mt-1.5 mb-1">or $799/year — about 4 months free.</p>
            <p class="text-zinc-400 text-xs mb-5">When footage is your business.</p>
            <ul class="space-y-2 text-[13px] text-zinc-300 leading-snug mb-7">
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>40 hours of footage a month</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>1,000 clip exports, up to 4K</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 20 GB</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Priority processing</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Add 5 more hours for $5, anytime</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Analysis workflows included, as they ship</li>
            </ul>
            <a
              :href="signupUrl"
              class="mt-auto border border-zinc-700 text-zinc-200 font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:border-[#f28f84]/60 hover:text-white active:scale-98 flex items-center justify-center gap-2 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Go Pro</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <p class="text-center text-[11px] text-zinc-500 mt-2.5">30-day refund, annual included · cancel anytime</p>
          </div>

        </div>

        <p class="text-center text-xs text-zinc-400 mt-7">
          Your files stay downloadable on every plan — canceling never strands your work.
        </p>
      </section>

    </main>
  </div>
</template>

<style scoped>
/* SECTION 02 — fan-out syndication visual.
   One clip on the left arcs five brand-colored lines to five destinations
   stacked on the right. The SVG (preserveAspectRatio="none") stretches to the
   same box as the destinations column, so its path endpoints (y=20/99/179/259/338
   of a 360 viewBox) line up with the five logos laid out via space-between. */
.handoff-fan {
  display: grid;
  /* source + destinations hug their content so the fan lines visually run
     from the clip's edge to the logos, with no dead gap on either side.
     The whole composition is capped and centered — at full-bleed width the
     lines stretched across ~1000px of empty canvas and the section died. */
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "source fan destinations";
  align-items: stretch;
  column-gap: clamp(0.75rem, 2.5vw, 2rem);
  min-height: 340px;
  max-width: 56rem;
  margin-inline: auto;
}

.handoff-source {
  grid-area: source;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.handoff-lines {
  grid-area: fan;
  align-self: stretch;
  width: 100%;
  height: 100%;
  min-height: 340px;
  overflow: visible;
}

.handoff-line {
  fill: none;
  stroke: var(--line-color, #f28f84);
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: 0.75;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--line-color, #f28f84) 45%, transparent));
  /* Draw-in: lines trace from the clip out to each destination on mount.
     Disabled automatically by the global prefers-reduced-motion block, which
     zeroes animation-duration on every element — the dasharray resting state
     (fully drawn) is the same, so reduced-motion shows static connected lines. */
  stroke-dasharray: 760;
  stroke-dashoffset: 760;
  animation: handoff-draw 1.4s ease-out forwards;
}

.handoff-line:nth-child(2) { animation-delay: 0.12s; }
.handoff-line:nth-child(3) { animation-delay: 0.24s; }
.handoff-line:nth-child(4) { animation-delay: 0.36s; }
.handoff-line:nth-child(5) { animation-delay: 0.48s; }

.handoff-destinations {
  grid-area: destinations;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  min-height: 340px;
}

.handoff-dest {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

@media (max-width: 1023px) {
  /* Below lg: drop the fan, fall back to a clean 2x2 logo grid with the clip on top. */
  .handoff-fan {
    display: block;
    min-height: 0;
  }

  .handoff-source {
    justify-content: center;
    margin-bottom: 2.5rem;
  }

  .handoff-lines {
    display: none;
  }

  .handoff-destinations {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.5rem 1.5rem;
    min-height: 0;
  }

  .handoff-dest {
    flex-direction: column;
    justify-content: center;
    text-align: center;
    gap: 1rem;
  }
}

@keyframes handoff-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
