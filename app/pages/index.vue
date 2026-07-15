<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'

const route = useRoute()
const signupBaseUrl = SIGNUP_BASE_URL
const demoClipUrl = 'https://app.bitterclip.com/demo/day-1-opening-watermarked.mp4'
const DEFAULT_APP_ORIGIN = 'https://app.bitterclip.com'
type HeroTheme = 'dark' | 'light'
const DEFAULT_HERO_THEME: HeroTheme = 'dark'
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
}

const demoSignupStage = ref('default')

// Paid pricing CTAs carry ?plan= so the app's signup hands off to
// /billing?plan=… after account creation; every other CTA stays plan-less.
const signupUrlFor = (plan?: string) => {
  return buildSignupUrl({
    query: route.query,
    plan,
    surface: 'homepage',
    stage: demoSignupStage.value,
    landingPath: route.path,
  })
}
const signupUrl = computed(() => signupUrlFor())
const signupUrlClip = computed(() => signupUrlFor('clip'))
const signupUrlPro = computed(() => signupUrlFor('pro'))

const resolveHeroTheme = (value: string | null): HeroTheme => (
  value === 'light' ? 'light' : DEFAULT_HERO_THEME
)

const readHeroThemeFromLocation = (): HeroTheme => {
  if (!import.meta.client) return DEFAULT_HERO_THEME

  const params = new URLSearchParams(window.location.search)
  return resolveHeroTheme(params.get('heroTheme') || params.get('theme'))
}

// FAQ: objection handling after the product and pricing. Answers must stay
// grounded in shipped behavior (mcp.md, pricing ladder) — no invented features.
const faqItems = [
  {
    q: 'What happens after I sign up?',
    a: 'Create the free account and upload a recording in your browser. Open it there, or connect Claude or a ChatGPT workspace where custom apps are enabled and ask for the strongest moment. Check the cut, trim it, export.',
  },
  {
    q: 'Do I need ChatGPT, or does Claude work too?',
    a: 'You can always use BitterClip in your browser. Claude supports custom connectors on every Claude plan. In ChatGPT, custom-app access and available actions depend on your plan and workspace policy.',
  },
  {
    q: 'Can the AI post something without me?',
    a: 'Approval is the default. Nothing posts until you connect a channel and approve the clip. If you later turn on automatic publishing for a project, ready clips can post to the channels you chose.',
  },
  {
    q: 'What can I upload?',
    a: 'Podcasts, interviews, calls, training sessions — audio or video, in files up to 4 GB (20 GB on Pro).',
  },
  {
    q: 'Do I have to learn a new editor?',
    a: 'No. Drag across the words in the transcript and the cut follows the audio. It is the same focused editor in the browser and in supported assistant hosts.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Your paid plan runs through the period you already paid for, then your account moves to Free. Your files stay downloadable, so canceling never strands your work.',
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
    description: 'A second brain for long-form audio and video. Search what was said, return to the exact source, and turn the moment into something useful.',
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
    description: 'Make long-form audio and video searchable, source-linked, and reusable in the browser or a supported AI assistant.',
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
const heroPhoneSlot = ref<HTMLElement | null>(null)
const handoffSection = ref<HTMLElement | null>(null)
const heroOrigin = ref(DEFAULT_APP_ORIGIN)
const heroReady = ref(false)
let heroLoadObserver: IntersectionObserver | null = null
let handoffLoadObserver: IntersectionObserver | null = null
let heroReadinessFallback: ReturnType<typeof setTimeout> | null = null

const syncHeroThemeFromLocation = (): HeroTheme => {
  const resolvedTheme = readHeroThemeFromLocation()
  heroTheme.value = resolvedTheme
  return resolvedTheme
}

// src is set only after the page is interactive (deferred) so the cross-origin
// widget (which loads video) doesn't compete with first paint / hurt LCP+TBT.
const heroSrc = ref('')

const loadHeroSrc = (url: string) => {
  if (!heroSrc.value) {
    heroReady.value = false
    heroSrc.value = url
  }
}

const scheduleHeroSrc = (url: string) => {
  if (window.innerWidth >= 768 || !('IntersectionObserver' in window) || !heroPhoneSlot.value) {
    loadHeroSrc(url)
    return
  }
  heroLoadObserver?.disconnect()
  heroLoadObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55)) {
      loadHeroSrc(url)
      heroLoadObserver?.disconnect()
      heroLoadObserver = null
    }
  }, { threshold: [0.55] })
  heroLoadObserver.observe(heroPhoneSlot.value)
}

// The handoff fan-out's clip card is a live instance of the clip-embed
// primitive (app.bitterclip.com/embed/clip/:id — poster + play, ~5KB page).
// Deferred like the other widgets; the static poster underneath is the
// placeholder until the iframe paints its own (near-identical) rest state.
const handoffClipSrc = ref('')

const scheduleHandoffClipSrc = (url: string) => {
  if (!('IntersectionObserver' in window) || !handoffSection.value) {
    handoffClipSrc.value = url
    return
  }
  handoffLoadObserver?.disconnect()
  handoffLoadObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      handoffClipSrc.value = url
      handoffLoadObserver?.disconnect()
      handoffLoadObserver = null
    }
  }, { rootMargin: '400px 0px', threshold: 0 })
  handoffLoadObserver.observe(handoffSection.value)
}

const resolveAppOrigin = (value: string | null): string => {
  if (!value) return DEFAULT_APP_ORIGIN
  try {
    const url = new URL(value)
    const isLocal = ['127.0.0.1', 'localhost'].includes(url.hostname)
    if (url.origin === DEFAULT_APP_ORIGIN || (isLocal && ['http:', 'https:'].includes(url.protocol))) {
      return url.origin
    }
  } catch {
    // Invalid review overrides fall back to the production app origin.
  }
  return DEFAULT_APP_ORIGIN
}

const isHeroMessage = (event: MessageEvent): boolean => {
  return Boolean(
    heroIframe.value
    && event.source === heroIframe.value.contentWindow
    && event.origin === heroOrigin.value,
  )
}

const onHeroIframeLoad = () => {
  if (heroReadinessFallback) clearTimeout(heroReadinessFallback)
  // Compatibility fallback for the production control while the coordinated app
  // branch adopts the explicit ready message. The message wins when available.
  heroReadinessFallback = setTimeout(() => {
    heroReady.value = true
  }, 2500)
}

const setDemoStage = (name: DemoEventName) => {
  const next = `hero_${name}`
  if ((demoStageRank[next] || 0) > (demoStageRank[demoSignupStage.value] || 0)) {
    demoSignupStage.value = next
  }
}

const syncDocumentSignupLinks = () => {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent('bitterclip:signup-stage', {
    detail: { stage: demoSignupStage.value, href: signupUrl.value },
  }))
}

const recordDemoEvent = (name: DemoEventName, detail: Record<string, unknown>) => {
  setDemoStage(name)
  syncDocumentSignupLinks()
  const win = window as WindowWithDemoAnalytics
  const eventPayload: Record<string, unknown> = {
    demo_surface: 'hero',
    demo_event: name,
    demo_signup_stage: demoSignupStage.value,
  }
  for (const [key, value] of Object.entries(detail)) {
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      eventPayload[`demo_${key}`] = value
    }
  }
  win.__bitterclipDemoEvents = win.__bitterclipDemoEvents || []
  win.__bitterclipDemoEvents.push({ name, surface: 'hero', detail, at: Date.now() })
  if (typeof win.gtag === 'function') {
    win.gtag('event', `bitterclip_demo_${name}`, eventPayload)
  }
}

const handleMessage = (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return
  if (!isHeroMessage(event)) return
  const data = event.data as { bitterclip_embed_ready?: unknown, bitterclip_demo_event?: unknown, detail?: unknown }
  if (data.bitterclip_embed_ready === true) {
    if (heroReadinessFallback) clearTimeout(heroReadinessFallback)
    heroReadinessFallback = null
    heroReady.value = true
    return
  }
  if (typeof data.bitterclip_demo_event === 'string' && DEMO_EVENT_ALLOWLIST.has(data.bitterclip_demo_event as DemoEventName)) {
    const detail = data.detail && typeof data.detail === 'object' && !Array.isArray(data.detail)
      ? data.detail as Record<string, unknown>
      : {}
    recordDemoEvent(data.bitterclip_demo_event as DemoEventName, detail)
  }
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

  window.addEventListener('message', handleMessage)

  // Defer loading the live cross-origin widgets until the browser is idle, so they
  // do not compete with first paint. The hero reserves its stable compact height.
  afterIdle(() => {
    const resolvedHeroTheme = syncHeroThemeFromLocation()

    const params = new URLSearchParams(window.location.search)
    const clip = params.get('clip') || demoClipUrl
    heroOrigin.value = resolveAppOrigin(params.get('appOrigin'))

    // The hero embed starts in the compact recording viewer. ?clip= gives its
    // stubbed export a real pre-rendered MP4 to reveal. The real transcript editor
    // opens after the user taps the
    // viewer's "Open in editor" control, keeping first load lighter.
    // (Only https origins pass the embed's allowlist, so on plain-http local
    // dev the export reveal is simply absent — everything else still works.)
    scheduleHeroSrc(`${heroOrigin.value}/embed/recording/src_qjxzecbketjkby2eynbi?bare=1&theme=${resolvedHeroTheme}&clip=${encodeURIComponent(clip)}`)
    scheduleHandoffClipSrc('https://app.bitterclip.com/embed/clip/clip_yf9ibrk2b7v13yzztbba')
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  heroLoadObserver?.disconnect()
  heroLoadObserver = null
  handoffLoadObserver?.disconnect()
  handoffLoadObserver = null
  if (heroReadinessFallback) clearTimeout(heroReadinessFallback)
  heroReadinessFallback = null
})
</script>

<template>
  <div class="relative w-full">
    <div class="absolute top-0 left-0 right-0 h-[680px] hero-backdrop-mask opacity-[0.08] -z-10 pointer-events-none" />

    <main class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-24 relative">

      <!-- 1. Hero -->
      <div class="grid lg:grid-cols-[1.18fr_0.82fr] gap-10 lg:gap-14 items-center mb-16 sm:mb-24">

        <!-- Left: the pitch -->
        <div class="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
          <h1 class="font-display text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.04em] text-white leading-[1.02] mb-6">
            A second brain
            <span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent block">
              for your video content.
            </span>
          </h1>

          <p class="text-zinc-400 text-lg sm:text-xl font-sans max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
            No one has time to rewatch every recording. BitterClip remembers what is inside your long-form audio and video, finds the exact moment in context, and turns it into something useful.
          </p>

          <div class="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
            <a
              :href="signupUrl"
              class="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Start with a recording</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#demo"
              class="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 px-5 py-2.5 font-mono text-xs font-bold text-zinc-300 transition duration-200 hover:border-[#f28f84]/40 hover:bg-[#f28f84]/[0.06] hover:text-white min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              See how it works
            </a>
          </div>

          <p class="text-xs text-zinc-400 font-mono mt-5">Use it in your browser, or bring the same workspace into Claude and supported ChatGPT workspaces. Free to start.</p>
        </div>

        <!-- Right: the real product, shown inside a phone (ChatGPT on mobile).
             Max-sized frame (~iPhone Pro Max) so the live widget gets room. -->
        <div id="product" class="relative mx-auto w-full max-w-[368px] lg:max-w-none lg:w-[392px] scroll-mt-28">
          <!-- handwritten callout. Text sits clear to the LEFT of the phone (no
               overlap); the arrow sweeps DOWN to the live MCP widget below — not
               the top of the conversation. -->
          <div class="hidden lg:block absolute -top-8 -left-[22.5rem] z-30 w-[340px] text-right -rotate-[5deg] pointer-events-none select-none">
            <span class="font-hand text-[25px] leading-[1.12] text-[#ffb4a8] block whitespace-nowrap">this is the real editor</span>
            <span class="font-hand text-[25px] leading-[1.12] text-[#ffb4a8]/80 block whitespace-nowrap">your assistant opens</span>
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
                    <p class="text-[13px] leading-relaxed text-left" :class="heroTheme === 'light' ? 'text-zinc-950' : 'text-zinc-900'">Find the strongest moments in episode one and cut me three clips.</p>
                  </div>
                </div>

                <!-- assistant reply: no bubble, just text -->
                <div class="px-0.5">
                  <p class="text-[13px] leading-relaxed text-left" :class="heroTheme === 'light' ? 'text-zinc-800' : 'text-zinc-100'">The strongest moment is where you explain why human-made content still matters. I found three cuts and opened that one so you can hear it in context.</p>
                </div>

                <!-- The REAL recording-card component, embedded live from the product.
                     The slot reserves its measured stable height up front (no CLS),
                     and the live iframe src is set only after the page is idle. A
                     seamless skeleton of the same height holds the space until then. -->
                <div ref="heroPhoneSlot" class="relative w-full" :style="{ height: HERO_SCREEN_HEIGHT + 'px' }">
                  <!-- skeleton placeholder: looks like the recording card loading -->
                  <div
                    v-if="!heroReady"
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
                    allow="autoplay; fullscreen"
                    allowfullscreen
                    @load="onHeroIframeLoad"
                    class="absolute inset-0 w-full h-full block rounded-2xl overflow-hidden bg-transparent transition-opacity duration-300"
                    :class="heroReady ? 'opacity-100' : 'opacity-0'"
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

      <!-- SECTION 01 — one source, carried through every result. The timeline is
           intentionally static: the hero above is the single interactive product demo. -->
      <section id="demo" aria-label="How BitterClip uses the complete recording" class="mb-24 relative scroll-mt-28">
        <div class="grid lg:grid-cols-[0.92fr_1.08fr] gap-10 lg:gap-16 items-center">
          <div class="max-w-xl">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">01 — The complete recording</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
              No one has time to rewatch every recording.
            </h2>
            <p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
              The useful part is usually somewhere in the middle: the exchange worth sharing, the detail you meant to remember, the moment a client made progress. BitterClip keeps the complete recording behind every result. Search in your own words, open the exact moment, and hear what came before and after.
            </p>

            <ol class="mt-8 border-y border-white/[0.08] divide-y divide-white/[0.08]">
              <li class="grid grid-cols-[2.25rem_1fr] gap-3 py-4">
                <span class="font-mono text-[10px] text-[#f28f84] pt-1">01</span>
                <div>
                  <h3 class="text-sm font-semibold text-white">Remember the whole recording</h3>
                  <p class="mt-1 text-sm leading-relaxed text-zinc-400">Keep the media, transcript, speakers, and surrounding context together.</p>
                </div>
              </li>
              <li class="grid grid-cols-[2.25rem_1fr] gap-3 py-4">
                <span class="font-mono text-[10px] text-[#f28f84] pt-1">02</span>
                <div>
                  <h3 class="text-sm font-semibold text-white">Find the exact moment</h3>
                  <p class="mt-1 text-sm leading-relaxed text-zinc-400">Ask in your own words and return to the source instead of a loose summary.</p>
                </div>
              </li>
              <li class="grid grid-cols-[2.25rem_1fr] gap-3 py-4">
                <span class="font-mono text-[10px] text-[#f28f84] pt-1">03</span>
                <div>
                  <h3 class="text-sm font-semibold text-white">Make it useful</h3>
                  <p class="mt-1 text-sm leading-relaxed text-zinc-400">Review the moment, make the clip, or carry the context into the next conversation.</p>
                </div>
              </li>
            </ol>

            <a
              :href="signupUrl"
              class="group mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Start with your recording</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>

          <figure class="source-context-figure rounded-3xl border border-white/[0.08] bg-black/30 p-5 sm:p-7 shadow-[0_28px_90px_-44px_rgba(0,0,0,0.9)]">
            <figcaption class="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p class="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Complete recording</p>
                <p class="mt-1 font-display text-xl font-semibold text-white">Episode one</p>
              </div>
              <span class="shrink-0 font-mono text-xs text-zinc-400">46:23</span>
            </figcaption>

            <div class="py-8 sm:py-10">
              <div class="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <span>0:00</span>
                <span>One media clock</span>
                <span>46:23</span>
              </div>
              <div class="source-context-rail" aria-label="A selected fourteen-second moment within a complete 46 minute recording">
                <span class="source-context-before">Context before</span>
                <span class="source-context-selection">Selected moment</span>
                <span class="source-context-after">Context after</span>
              </div>
              <div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center font-mono text-[10px] text-zinc-500">
                <span>02:05</span>
                <span class="rounded-full border border-[#f28f84]/35 bg-[#f28f84]/10 px-3 py-1.5 text-[#ffb4a8]">02:05–02:19 · exact source</span>
                <span class="text-right">02:19</span>
              </div>
            </div>

            <div class="flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Ready to review</p>
                <p class="mt-1 text-sm text-zinc-300">The source stays attached.</p>
              </div>
              <span class="font-mono text-xs text-zinc-300">Clip 1 of 3 · 0:14</span>
            </div>
          </figure>
        </div>
      </section>

      <!-- SECTION 02 — The moment can leave the archive without losing its source. -->
      <section ref="handoffSection" aria-label="Turn a source-backed moment into a finished clip" class="mb-24">
        <div class="max-w-2xl mb-10">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">02 — Put the moment to work</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
            The exact moment, ready to use.
          </h2>
          <p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Hear it in context, move the edges, and export when it says what you meant. Download the finished clip, publish it to a connected channel, or share a link. For Instagram, send it to your phone and post from the app. The complete recording stays in BitterClip for the next question.
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

      <!-- SECTION 03 — the concrete starting point comes before the objection list. -->
      <section id="pricing" class="relative mb-24 scroll-mt-28">
        <div class="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#f28f84]/10 to-transparent rounded-[3rem] blur-3xl -z-10 pointer-events-none" />

        <div class="max-w-2xl mx-auto text-center mb-8">
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Start with the recording you already have.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Upload it once, then search, review, and make clips without replaying the whole thing. Work in the browser or bring the same workspace into a supported assistant. Start free; upgrade when an hour a month stops being enough.
          </p>
        </div>


        <!-- the ladder: Free / Clip / Pro. Clip carries the accent + the only filled
             CTA (it's the plan we steer to; $99 Pro anchors the price). Paid CTAs
             carry ?plan= so signup hands off to /billing with the plan highlighted. -->
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
            <p class="text-zinc-400 text-xs mt-1.5 mb-5">For a weekly show or regular interviews.</p>
            <ul class="space-y-2 text-[13px] text-zinc-300 leading-snug mb-7">
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>10 hours of footage a month</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>No watermark — 150 clip exports at 1080p</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 4 GB</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Embed clips on your own site</li>
            </ul>
            <a
              :href="signupUrlClip"
              class="mt-auto bg-[#f28f84] text-zinc-950 font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:bg-[#ffa89e] active:scale-98 flex items-center justify-center gap-2 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Start clipping</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <p class="text-center text-[11px] text-zinc-500 mt-2.5">Month to month · cancel anytime</p>
          </div>

          <!-- PRO — plain panel: the $99 price anchors on its own; the accent lives
               on Clip, the plan we steer to. -->
          <div class="relative rounded-2xl glass-panel p-6 flex flex-col max-md:order-3">
            <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Pro</p>
            <p class="font-display text-3xl font-bold text-white">$99<span class="text-lg text-zinc-400 font-semibold">/month</span></p>
            <p class="text-zinc-400 text-xs mt-1.5 mb-5">When footage is your business.</p>
            <ul class="space-y-2 text-[13px] text-zinc-300 leading-snug mb-7">
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>40 hours of footage a month</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>1,000 clip exports at 1080p</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 20 GB</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Front-of-queue processing</li>
              <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 mt-1 text-[#f28f84] shrink-0" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Visual analysis workflows</li>
            </ul>
            <a
              :href="signupUrlPro"
              class="mt-auto border border-zinc-700 text-zinc-200 font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:border-[#f28f84]/60 hover:text-white active:scale-98 flex items-center justify-center gap-2 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Go Pro</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <p class="text-center text-[11px] text-zinc-500 mt-2.5">Month to month · cancel anytime</p>
          </div>

        </div>

        <p class="text-center text-xs text-zinc-400 mt-7">
          Your files stay downloadable on every plan — canceling never strands your work.
        </p>
      </section>

      <!-- SECTION 04 — grounded objections after visitors understand the product and price. -->
      <section id="faq" aria-label="Common questions" class="scroll-mt-28">
        <div class="max-w-2xl mb-10">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">04 — Common questions</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            A few things worth knowing.
          </h2>
        </div>

        <dl class="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl">
          <div v-for="item in faqItems" :key="item.q">
            <dt class="text-sm font-semibold text-white mb-1.5">{{ item.q }}</dt>
            <dd class="text-sm text-zinc-400 leading-relaxed">{{ item.a }}</dd>
          </div>
        </dl>
      </section>

    </main>
  </div>
</template>

<style scoped>
.source-context-figure {
  position: relative;
  isolation: isolate;
}

.source-context-figure::before {
  content: '';
  position: absolute;
  inset: 18% 12%;
  z-index: -1;
  border-radius: 999px;
  background: rgba(242, 143, 132, 0.08);
  filter: blur(56px);
  pointer-events: none;
}

.source-context-rail {
  display: grid;
  grid-template-columns: minmax(4rem, 1.6fr) minmax(7.5rem, 1fr) minmax(4rem, 1.8fr);
  min-height: 7rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.9rem;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.045) 0,
      rgba(255, 255, 255, 0.045) 2px,
      transparent 2px,
      transparent 13px
    ),
    rgba(0, 0, 0, 0.32);
}

.source-context-rail > span {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.source-context-before,
.source-context-after {
  color: rgba(161, 161, 170, 0.74);
}

.source-context-selection {
  position: relative;
  color: #fff4f1;
  background: rgba(242, 143, 132, 0.16);
  border-inline: 1px solid rgba(242, 143, 132, 0.58);
  box-shadow: inset 0 0 30px rgba(242, 143, 132, 0.08);
}

.source-context-selection::before {
  content: '';
  position: absolute;
  inset-block: 0.7rem;
  left: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.9);
}

@media (max-width: 420px) {
  .source-context-rail {
    grid-template-columns: minmax(3rem, 1fr) minmax(6.5rem, 1.25fr) minmax(3rem, 1fr);
  }

  .source-context-rail > span {
    padding-inline: 0.35rem;
    font-size: 0.55rem;
  }
}

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
