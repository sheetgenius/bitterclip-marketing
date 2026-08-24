<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { buildSignupUrl } from '~/utils/signup-attribution'

const route = useRoute()
const demoClipUrl = 'https://app.bitterclip.com/demo/day-1-opening-watermarked.mp4'
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

// Every acquisition CTA enters through Creator unless it explicitly chooses
// Producer. The durable app keys remain clip/pro.
const signupUrlFor = (plan?: string) => {
  return buildSignupUrl({
    query: route.query,
    plan,
    surface: 'classic',
    stage: demoSignupStage.value,
    landingPath: route.path,
  })
}
const signupUrl = computed(() => signupUrlFor())

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
    a: 'Choose Creator and add a card. $0 is due today, then Creator becomes $24/month unless canceled before the trial ends. After Bitter Checkout accepts your payment method and starts the trial, Billing shows the provider-owned exact cancel-before time. Then bring one recording. The trial includes $5 of agent work for whole-recording analysis, a crafted First Cut, and continued direction while balance remains. Top up exactly $20, $50, or $100 during an active trial or paid plan without auto-activating paid Creator.',
  },
  {
    q: 'I have tried AI clippers. Why would this be different?',
    a: 'Because it is not picking moments out of a transcript search. It works from the whole session — who is speaking, what came before and after, what is on screen — and commits to a cut it can explain and show you the source for. When it is wrong, you say what is wrong and it revises that same cut instead of handing you ten more options.',
  },
  {
    q: 'Do I need ChatGPT or Claude?',
    a: 'No. The agent is built into the editor, and that is the shortest path. If you would rather work where you already are, Claude supports custom connectors on every Claude plan; in ChatGPT, custom-app access and available actions depend on your plan and workspace policy.',
  },
  {
    q: 'Can it post something without me?',
    a: 'No. Every send is bound to one exact export, one destination, one account, and a final confirmation from you. Connecting a channel does not hand over the keys.',
  },
  {
    q: 'Does BitterClip record for me?',
    a: 'It can record. It cannot have the conversation for you — that part stays yours. Every project has a recorder in the browser: camera and mic on a laptop or phone, or your screen in desktop Chrome, up to 1080p, uploading while you record so transcription starts the moment you stop. It captures one signed-in person on one device — no remote guests, no guest recording links, no separate track per person. Most people bring footage they already shot on a phone, a camera, Zoom, or Riverside, and that stays completely normal.',
  },
  {
    q: 'What can I upload?',
    a: 'Podcasts, interviews, calls, and training sessions — audio or video. The Creator trial accepts one recording up to two hours. Paid Creator supports files up to 4 GB; Producer supports files up to 20 GB. Bring several angles of the same session and BitterClip keeps them together as one production rather than charging each camera as another session.',
  },
  {
    q: 'Do I have to learn a new editor?',
    a: 'No. You edit by changing the transcript: select the words, delete them, and the video changes with them. Or say what you want changed and let the agent make the edit. Same editor in the browser and in supported assistant hosts.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'After Bitter Checkout accepts your payment method and starts the trial, Billing shows the provider-owned exact cancel-before time. Cancel before that time and the first $24 charge is prevented. After a paid period begins, cancellation stops renewal at the end of that period. Your existing sources, edits, revision history, purchased agent work, and completed Exports stay available; new processing may require an active plan.',
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
    description: 'You record it. BitterClip handles the rest — the full-length episode and the short cuts from that same edit, made by changing the transcript, with an agent that watched the whole session.',
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
    description: 'Record a session in the browser or bring footage you already shot, and BitterClip finishes it: the full-length episode and the short cuts from that same edit, made by changing the transcript, with an agent you can direct and revise.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '24',
      highPrice: '99',
      priceCurrency: 'USD',
      offerCount: 2,
      url: 'https://bitterclip.com/#pricing',
      availability: 'https://schema.org/InStock',
      description: 'Creator is $24/month after a seven-day card-backed trial with $0 due today, one recording up to two hours, and $5 of included agent work. Producer is $99/month.',
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

// /classic is the pre-ISO4 homepage, kept reachable (noindex) for a soak week
// after the 2026-08-20 swap, then deleted. It must not claim the canonical /
// or the markdown twin — those belong to the new homepage.
useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
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
const heroPhoneSlot = ref<HTMLElement | null>(null)
let heroLoadObserver: IntersectionObserver | null = null

const syncHeroThemeFromLocation = (): HeroTheme => {
  const resolvedTheme = readHeroThemeFromLocation()
  heroTheme.value = resolvedTheme
  return resolvedTheme
}

// src is set only after the page is interactive (deferred) so the cross-origin
// widget (which loads video) doesn't compete with first paint / hurt LCP+TBT.
const heroSrc = ref('')

const loadHeroSrc = (url: string) => {
  if (!heroSrc.value) heroSrc.value = url
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
    // the bare editor + an app-origin branded sample clip, so Export plays +
    // downloads without invoking a live render.
    const params = new URLSearchParams(window.location.search)
    const base = (params.get('embed') || 'https://app.bitterclip.com/embed/clip-demo').split('?')[0]
    const clip = params.get('clip') || demoClipUrl
    embedUrl.value = `${base}?bare=1&clip=${encodeURIComponent(clip)}`

    // The hero embed starts in the compact recording viewer. ?clip= gives its
    // stubbed export a real pre-rendered MP4 to reveal — same contract as the
    // clip-demo above. The real transcript editor opens after the user taps the
    // viewer's "Open in editor" control, keeping first load lighter.
    // (Only https origins pass the embed's allowlist, so on plain-http local
    // dev the export reveal is simply absent — everything else still works.)
    scheduleHeroSrc(`https://app.bitterclip.com/embed/recording/src_qjxzecbketjkby2eynbi?bare=1&theme=${resolvedHeroTheme}&clip=${encodeURIComponent(clip)}`)
    handoffClipSrc.value = 'https://app.bitterclip.com/embed/clip/clip_yf9ibrk2b7v13yzztbba'
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  heroLoadObserver?.disconnect()
  heroLoadObserver = null
})
</script>

<template>
  <div class="relative w-full">
    <!-- hero-backdrop-mask removed: the body vignette in main.css now owns the
         frame falloff, and stacking two large radial gradients was compounding
         the banding. -->

    <main class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-24 relative">

      <!-- 1. Hero -->
      <div class="grid lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-12 items-center mb-16 sm:mb-24">

        <!-- Left: the pitch -->
        <div class="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
          <h1 class="font-display text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.035em] text-white leading-[1.04] mb-6">
            You record it.
            <span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent block">
              BitterClip handles the rest.
            </span>
          </h1>

          <p class="text-zinc-400 text-lg sm:text-xl font-sans max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
            Have the real conversation and get it recorded — on your phone, on a camera, in Zoom, or with BitterClip's own browser recorder. From there it is BitterClip's job: the full-length episode with your opener and outro, captions, music, and camera changes, then the short vertical cuts from that same edit. You edit by changing the transcript, or say what's wrong and it revises that same cut instead of starting over.
          </p>

          <div class="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
            <a
              :href="signupUrl"
              class="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Bring your footage</span>
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

          <p class="text-xs text-zinc-400 font-mono mt-5">Card required · $0 today · $24/month after seven days unless canceled before the trial ends.</p>
        </div>

        <!-- Right: the real product, shown inside a phone (ChatGPT on mobile).
             Max-sized frame (~iPhone Pro Max) so the live widget gets room. -->
        <div class="relative mx-auto w-full max-w-[368px] lg:max-w-none lg:w-[392px]">
          <!-- handwritten callout. Text sits clear to the LEFT of the phone (no
               overlap); the arrow sweeps DOWN to the live MCP widget below — not
               the top of the conversation. -->
          <div class="hidden lg:block absolute -top-8 -left-[22.5rem] z-30 w-[340px] text-right -rotate-[5deg] pointer-events-none select-none">
            <span class="font-hand text-[25px] leading-[1.12] text-[#ffb4a8] block whitespace-nowrap">this is the real editor</span>
            <span class="font-hand text-[25px] leading-[1.12] text-[#ffb4a8]/80 block whitespace-nowrap">running right here</span>
          </div>
          <svg viewBox="0 0 130 210" fill="none" class="hidden lg:block absolute top-[2.8rem] -left-[6rem] w-[130px] h-[210px] z-30 text-[#ffb4a8]/85 pointer-events-none">
            <path d="M44 2 C 24 76, 30 152, 114 197" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M103 181 L114 197 L95 197" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>

          <!-- the phone, tilted in 3D for depth -->
          <div class="relative mx-auto w-full max-w-[368px] lg:[transform:perspective(1800px)_rotateY(-9deg)_rotateX(2.5deg)_rotateZ(0.6deg)] transform-gpu">
            <!-- The coral halo behind the phone is gone; the titanium frame's
                 own drop shadow separates it from the field without ringing. -->

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
                    <p class="text-[13px] leading-relaxed text-left" :class="heroTheme === 'light' ? 'text-zinc-950' : 'text-zinc-900'">Turn this session into the episode, and pull a clip from it.</p>
                  </div>
                </div>

                <!-- assistant reply: no bubble, just text -->
                <div class="px-0.5">
                  <p class="text-[13px] leading-relaxed text-left" :class="heroTheme === 'light' ? 'text-zinc-800' : 'text-zinc-100'">I watched the whole session. The cold open is where you explain why you started. Open the episode and tell me what to change.</p>
                </div>

                <!-- The REAL recording-card component, embedded live from the product.
                     The slot reserves its measured stable height up front (no CLS),
                     and the live iframe src is set only after the page is idle. A
                     seamless skeleton of the same height holds the space until then. -->
                <div ref="heroPhoneSlot" class="relative w-full" :style="{ height: HERO_SCREEN_HEIGHT + 'px' }">
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
                class="w-40 h-40 rounded-full object-cover ring-1 ring-white/10 bg-white/[0.04]"
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
                class="w-40 h-40 rounded-full object-cover ring-1 ring-white/10 bg-white/[0.04]"
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

      <!-- SECTION 01 — It watched the whole session (copy LEFT, live editor RIGHT — the centerpiece) -->
      <section id="demo" aria-label="It watched the whole session" class="mb-24 relative scroll-mt-28">
        <div class="grid lg:grid-cols-[1fr_minmax(520px,1.1fr)] gap-8 lg:gap-12 items-center">

          <!-- LEFT: the copy -->
          <div class="max-w-xl">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">01 — It watched the whole thing</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
              It watched the whole session before it cut anything.
            </h2>
            <p class="text-zinc-400 text-base sm:text-lg leading-relaxed mb-6">
              Drop in a podcast, a founder call, or a training session — or record one right in the browser. BitterClip transcribes it, separates the speakers, and looks at the picture as well as the words — confirm a name once and it recognizes that person when they return. So when it picks a moment, it can tell you why and show you exactly where it came from. Tell it what's wrong in ordinary language and it revises that same cut, with the version before it still there.
            </p>

            <!-- motif row: the delegation-with-a-veto loop — it acts, you direct,
                 it revises the SAME work. Replaces the old suggest→approve→post
                 motif, which framed the agent as a suggestion engine. -->
            <div class="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              <span class="text-[#f28f84]">it makes a real cut</span>
              <span class="text-zinc-600">&rarr;</span>
              <span class="text-[#f28f84]">you direct it</span>
              <span class="text-zinc-600">&rarr;</span>
              <span class="text-[#f28f84]">it revises the same work</span>
            </div>

            <!-- mid-page CTA: the editor alongside is the peak-interest moment —
                 give it an action so momentum doesn't die between hero and pricing. -->
            <div class="mt-8 flex items-center gap-4">
              <a
                :href="signupUrl"
                class="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span>Bring your footage</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <span class="text-[11px] text-zinc-500">7-day Creator trial · card required · $0 today</span>
            </div>

            <!-- ChatGPT/Claude, demoted out of the hero to here. Per the
                 go-to-market ruling they are optional peer cockpits over the same
                 Rails-owned work — a differentiator and a choice, never an
                 onboarding prerequisite. Eligibility detail lives in the FAQ so
                 the fold no longer walks its own headline back. -->
            <p class="mt-8 pt-6 border-t border-zinc-900 text-sm text-zinc-500 leading-relaxed">
              <span class="text-zinc-300">Prefer to work in ChatGPT or Claude?</span> Connect one and you are on the same episode, the same revisions, the same exports — the editor opens right in the conversation. It is a choice, not a setup step.
            </p>
          </div>

          <!-- RIGHT: the live editor, bare. The speaker chips straddle its top edge like
               presence indicators — the same peach/emerald the embed color-codes speakers with. -->
          <div class="relative w-full">
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
                <h3 class="font-display text-lg font-bold text-white mb-2">The same editor you work in.</h3>
                <p class="text-zinc-400 text-xs max-w-sm mb-6 leading-relaxed">
                  Edit by changing the transcript — select the words, delete them, and the video changes with them. Tap to load it.
                </p>
                <button
                  @click="activateDemo"
                  class="px-5 py-2.5 font-mono text-xs font-bold bg-[#f28f84] text-zinc-950 rounded-lg hover:bg-[#ffa89e] hover:scale-102 active:scale-98 transition duration-200 cursor-pointer min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
            The episode, and everything that comes out of it.
          </h2>
          <p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Export the full-length episode, then pull the short vertical cuts from that same edit instead of starting a second production. Publish to YouTube, X, or LinkedIn, or grab a shareable link. For Instagram, send the finished clip to your phone and post it from the Instagram app. Nothing goes out until you confirm it. Invite a client to the same session and they can pull their own cuts too — upload once, everyone works from it.
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
                  <span class="flex items-center justify-center w-10 h-10 rounded-full bg-[#f28f84]">
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

        <div class="max-w-2xl mx-auto text-center mb-8">
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Bring one recording. Leave with the episode.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Creator starts with a seven-day card-backed trial: $0 today, then $24/month unless you cancel before it ends. After Bitter Checkout accepts your payment method and starts the trial, Billing shows the provider-owned exact cancel-before time. Producer is $99/month for higher-volume work.
          </p>
        </div>

        <div class="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-7 text-center sm:p-9">
          <p class="text-sm leading-relaxed text-zinc-400">
            The canonical pricing page carries the current trial scope, source-footage allowances, included agent work, exact top-ups, Export treatment, and cancellation terms. This noindexed archive does not maintain a second feature grid.
          </p>
          <div class="flex flex-col items-center gap-3 sm:flex-row">
            <a
              :href="signupUrl"
              class="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
            >Start my 7-day trial</a>
            <NuxtLink
              to="/#pricing"
              class="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 font-mono text-xs font-bold text-zinc-200 transition duration-200 hover:border-[#f28f84]/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
            >See current pricing</NuxtLink>
          </div>
          <p class="text-xs text-zinc-500">The trial includes $5 of agent work, and trial Exports are watermarked. Clean Exports unlock after the first successful $24 payment. Top-ups never auto-activate paid Creator; early activation requires a separate explicit $24 authorization. Existing work stays available after cancellation or lapse; new processing may require an active plan.</p>
        </div>
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
