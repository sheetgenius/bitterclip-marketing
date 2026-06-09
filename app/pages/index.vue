<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const signupUrl = 'https://app.bitterclip.com/sign_up'
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
      '@type': 'Offer',
      price: '99',
      priceCurrency: 'USD',
      url: signupUrl,
      availability: 'https://schema.org/InStock',
    },
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
// 408 is the widget's measured rendered height; reserving it up front means the
// postMessage('height') it sends after load matches the slot → zero CLS. (handleMessage
// only ever grows this box, so transient shorter mid-load reports can't collapse it.)
const heroIframe = ref<HTMLIFrameElement | null>(null)
const heroWidgetHeight = ref(408)
// src is set only after the page is interactive (deferred) so the cross-origin
// widget (which loads video) doesn't compete with first paint / hurt LCP+TBT.
const heroSrc = ref('')

const onIframeLoad = () => {
  isIframeLoading.value = false
}

const activateDemo = () => {
  demoActivated.value = true
}

const handleMessage = (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object' || !('height' in event.data)) return
  const height = Number((event.data as { height: unknown }).height)
  if (isNaN(height) || height < 200 || height > 1500) return
  // Route by source: the hero recording-card iframe vs the lower editor demo.
  if (heroIframe.value && event.source === heroIframe.value.contentWindow) {
    // The hero slot reserves its stable height (408) up front. The widget posts
    // smaller *intermediate* heights mid-load before settling — honoring those would
    // collapse and re-expand the slot (CLS). Only ever GROW the reserved box, so a
    // transient short report can never shrink it.
    heroWidgetHeight.value = Math.max(heroWidgetHeight.value, height)
  } else {
    iframeHeight.value = height
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
    // Build the editor embed URL: base (overridable via ?embed= for local dev) +
    // the bare editor + a real demo clip the site hosts, so Export plays + downloads.
    const base = (new URLSearchParams(window.location.search).get('embed') || 'https://app.bitterclip.com/embed/clip-demo').split('?')[0]
    const clip = `${window.location.origin}/clips/day-1-opening.mp4`
    embedUrl.value = `${base}?bare=1&clip=${encodeURIComponent(clip)}`

    heroSrc.value = 'https://app.bitterclip.com/embed/recording/src_qjxzecbketjkby2eynbi?bare=1'
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})

// --- Output gallery: hover/focus plays one clip at a time (no autoplay) ---
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

const startClip = (target: HTMLVideoElement) => {
  document.querySelectorAll<HTMLVideoElement>('[data-clip]').forEach((v) => {
    if (v !== target) {
      v.pause()
      v.currentTime = 0
    }
  })
  target.play().catch(() => {})
}

// Hover/focus auto-plays — but reduced-motion users get NO motion on hover.
// They can still start a clip explicitly via click or keyboard (Enter/Space).
const playClip = (e: Event) => {
  if (prefersReducedMotion()) return
  startClip(e.currentTarget as HTMLVideoElement)
}

// Explicit play: click or keyboard activation. Always honored (motion is
// user-initiated here), and toggles for reduced-motion users.
const toggleClip = (e: Event) => {
  const target = e.currentTarget as HTMLVideoElement
  if (target.paused) {
    startClip(target)
  } else {
    target.pause()
    target.currentTime = 0
  }
}

const keyClip = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggleClip(e)
  }
}

const stopClip = (e: Event) => {
  // Don't yank a clip a reduced-motion user explicitly started by clicking,
  // just because focus/hover left. Only stop the hover-driven previews.
  if (prefersReducedMotion()) return
  const target = e.currentTarget as HTMLVideoElement
  target.pause()
  target.currentTime = 0
}
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

          <p class="text-xs text-zinc-400 font-mono mt-5">Made for founders doing their own marketing — and anyone running a recurring show.</p>
        </div>

        <!-- Right: the real product, shown inside a phone (ChatGPT on mobile) -->
        <div class="relative mx-auto w-full max-w-[320px] lg:max-w-none lg:w-[340px]">
          <!-- handwritten callout pointing at the phone -->
          <div class="hidden lg:block absolute -top-5 -left-[5.5rem] z-30 w-44 -rotate-[7deg] pointer-events-none select-none">
            <span class="font-hand text-[28px] leading-[1.05] text-[#ffb4a8] block">this is the actual UI</span>
            <svg viewBox="0 0 120 80" fill="none" class="w-32 h-24 mt-1 ml-9 text-[#ffb4a8]/85">
              <path d="M6 9 C 40 1, 92 17, 104 57" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M107 41 L104 57.5 L91 47" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- the phone, tilted in 3D for depth -->
          <div class="relative mx-auto w-full max-w-[320px] lg:[transform:perspective(1800px)_rotateY(-9deg)_rotateX(2.5deg)_rotateZ(0.6deg)] transform-gpu">
            <div class="absolute -inset-6 bg-[#f28f84]/8 rounded-[3.5rem] blur-3xl -z-10 pointer-events-none"></div>

            <!-- phone: titanium frame -->
          <div class="relative rounded-[3rem] p-[3px] bg-gradient-to-br from-zinc-500 via-zinc-700 to-zinc-800 ring-1 ring-white/20 shadow-[0_45px_90px_-25px_rgba(0,0,0,0.85)]">
            <!-- side buttons (titanium) -->
            <span class="absolute -left-[3px] top-[104px] w-[3px] h-8 rounded-l-md bg-gradient-to-b from-zinc-500 to-zinc-700"></span>
            <span class="absolute -left-[3px] top-[152px] w-[3px] h-12 rounded-l-md bg-gradient-to-b from-zinc-500 to-zinc-700"></span>
            <span class="absolute -right-[3px] top-[132px] w-[3px] h-16 rounded-r-md bg-gradient-to-b from-zinc-500 to-zinc-700"></span>

            <!-- black bezel band -->
            <div class="rounded-[2.8rem] bg-black p-[7px]">
              <!-- screen -->
              <div class="relative rounded-[2.45rem] overflow-hidden bg-black">
                <!-- glass reflection -->
                <div class="absolute inset-0 z-20 pointer-events-none bg-gradient-to-br from-white/[0.10] via-transparent to-transparent"></div>
                <!-- dynamic island -->
                <div class="absolute top-2.5 left-1/2 -translate-x-1/2 w-[34%] h-[26px] bg-black rounded-full z-30 ring-1 ring-white/5"></div>

              <!-- conversation thread -->
              <div class="pt-11 pb-7 px-3 space-y-3">
                <!-- user message: light bubble, right (faithful to ChatGPT) -->
                <div class="flex justify-end">
                  <div class="max-w-[88%] rounded-3xl bg-[#f4f4f4] px-3.5 py-2">
                    <p class="text-[13px] text-zinc-900 leading-relaxed text-left">Pull the strongest moments from episode one and cut me clips.</p>
                  </div>
                </div>

                <!-- assistant reply: no bubble, just text -->
                <div class="px-0.5">
                  <p class="text-[13px] text-zinc-100 leading-relaxed text-left">The strongest moment isn't the loudest — it's the one that says why you started. Here are three from the founding conversation, opened in the editor so you can check each one before you post.</p>
                </div>

                <!-- The REAL recording-card component, embedded live from the product.
                     The slot reserves its measured stable height up front (no CLS),
                     and the live iframe src is set only after the page is idle. A
                     seamless skeleton of the same height holds the space until then. -->
                <div class="relative w-full" :style="{ height: heroWidgetHeight + 'px' }">
                  <!-- skeleton placeholder: looks like the recording card loading -->
                  <div
                    v-if="!heroSrc"
                    class="absolute inset-0 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-3 flex flex-col gap-3 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div class="h-24 rounded-xl bg-zinc-800/50 animate-pulse"></div>
                    <div class="h-3 w-2/3 rounded bg-zinc-800/50 animate-pulse"></div>
                    <div class="h-3 w-1/2 rounded bg-zinc-800/40 animate-pulse"></div>
                    <div class="mt-1 grid grid-cols-3 gap-2">
                      <div class="h-14 rounded-lg bg-zinc-800/40 animate-pulse"></div>
                      <div class="h-14 rounded-lg bg-zinc-800/40 animate-pulse"></div>
                      <div class="h-14 rounded-lg bg-zinc-800/40 animate-pulse"></div>
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
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-[36%] h-[5px] rounded-full bg-white/40 z-30"></div>
              </div>
            </div>
          </div>
          </div>
        </div>

      </div>

      <section aria-label="Product loop" class="mb-24">
        <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-6 text-center">The loop · upload to posted</p>
        <div class="relative">
          <!-- connecting rail with a traveling pulse (desktop only) -->
          <div class="hidden md:block absolute top-[34px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-[#f28f84]/30 to-transparent pointer-events-none">
            <span class="loop-pulse" aria-hidden="true"></span>
          </div>

          <ol class="grid grid-cols-2 md:grid-cols-5 gap-3 relative">
            <li class="group glass-panel-accented glass-reflection corner-ticks rounded-xl p-4 transition-colors hover:border-[#f28f84]/35">
              <div class="flex items-center justify-between mb-3">
                <span class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84]" aria-hidden="true">01</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-[18px] h-[18px] text-[#f28f84]/55 group-hover:text-[#f28f84] transition-colors" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 7.5 12 3m0 0L7.5 7.5M12 3v13.5" /></svg>
              </div>
              <p class="font-display text-sm font-bold text-white">Upload</p>
              <p class="text-xs text-zinc-300/90 mt-1.5 leading-relaxed">Add your podcast, interview, or call.</p>
            </li>
            <li class="group glass-panel-accented glass-reflection corner-ticks rounded-xl p-4 transition-colors hover:border-[#f28f84]/35">
              <div class="flex items-center justify-between mb-3">
                <span class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84]" aria-hidden="true">02</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-[18px] h-[18px] text-[#f28f84]/55 group-hover:text-[#f28f84] transition-colors" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              </div>
              <p class="font-display text-sm font-bold text-white">Who's talking</p>
              <p class="text-xs text-zinc-300/90 mt-1.5 leading-relaxed">Every voice gets a name.</p>
            </li>
            <li class="group glass-panel-accented glass-reflection corner-ticks rounded-xl p-4 transition-colors hover:border-[#f28f84]/35">
              <div class="flex items-center justify-between mb-3">
                <span class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84]" aria-hidden="true">03</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-[18px] h-[18px] text-[#f28f84]/55 group-hover:text-[#f28f84] transition-colors" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
              </div>
              <p class="font-display text-sm font-bold text-white">Find the moment</p>
              <p class="text-xs text-zinc-300/90 mt-1.5 leading-relaxed">Ask ChatGPT for the best parts.</p>
            </li>
            <li class="group glass-panel-accented glass-reflection corner-ticks rounded-xl p-4 transition-colors hover:border-[#f28f84]/35">
              <div class="flex items-center justify-between mb-3">
                <span class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84]" aria-hidden="true">04</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-[18px] h-[18px] text-[#f28f84]/55 group-hover:text-[#f28f84] transition-colors" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
              </div>
              <p class="font-display text-sm font-bold text-white">Check it</p>
              <p class="text-xs text-zinc-300/90 mt-1.5 leading-relaxed">Trim it and hear it in context.</p>
            </li>
            <li class="group glass-panel-accented glass-reflection corner-ticks rounded-xl p-4 col-span-2 md:col-span-1 transition-colors hover:border-[#f28f84]/35">
              <div class="flex items-center justify-between mb-3">
                <span class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84]" aria-hidden="true">05</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-[18px] h-[18px] text-[#f28f84]/55 group-hover:text-[#f28f84] transition-colors" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
              </div>
              <p class="font-display text-sm font-bold text-white">Post it</p>
              <p class="text-xs text-zinc-300/90 mt-1.5 leading-relaxed">Download it or publish to YouTube.</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 2. The actual editor -->
      <section id="demo" class="mb-24 relative scroll-mt-28">
        <div class="absolute inset-0 bg-[#f28f84]/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />

        <div class="max-w-2xl mb-8 relative">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">The real editor</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">The same editor opens right inside ChatGPT.</h2>
          <p class="text-zinc-400 text-sm mt-2 font-sans">Drag across the words to pick your clip. Play it back. Export.</p>
        </div>

        <!-- gesture strip -->
        <div class="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-4">
          <span class="text-[#f28f84]">drag the words</span>
          <span class="text-zinc-600">&rarr;</span>
          <span class="text-[#f28f84]">check the source</span>
          <span class="text-zinc-600">&rarr;</span>
          <span class="text-[#f28f84]">export</span>
        </div>

        <div class="glass-panel-accented glass-reflection rounded-3xl overflow-hidden corner-ticks relative min-h-[400px]">

          <!-- Window header -->
          <div class="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 relative z-10">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#f28f84]/70"></span>
              <span class="w-3 h-3 rounded-full bg-[#d66f5f]/60"></span>
              <span class="w-3 h-3 rounded-full bg-zinc-700"></span>
              <span class="text-xs font-mono text-zinc-400 ml-4 hidden sm:inline">day-1 · founder interview</span>
            </div>

            <div class="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-mono text-[10px] font-bold text-zinc-400 tracking-wide">Live</span>
            </div>
          </div>

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
              :src="embedUrl"
              title="BitterClip — the live transcript editor"
              loading="lazy"
              @load="onIframeLoad"
              @mouseenter="$event.target.contentWindow?.focus()"
              class="w-full block transition-[height] duration-200"
              :style="{ height: `${iframeHeight}px`, border: 0, background: 'transparent' }"
            />
          </div>

          <!-- Status bar -->
          <div class="px-6 py-3 bg-zinc-950/60 backdrop-blur-md flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 border-t border-zinc-800/80">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live demo · nothing saved
          </div>

        </div>

        <div class="mt-7">
          <a
            :href="signupUrl"
            class="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span>Clip your own recording</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </a>
          <p class="text-xs text-zinc-400 font-mono mt-3">This demo is read-only. Upload your own to start cutting.</p>
        </div>
      </section>

      <!-- 3. Speaker-aware proof (merged: why-it-works + speaker example + comparison) -->
      <section aria-label="Speaker-aware proof" class="mb-24">
        <div class="max-w-2xl mb-8">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">Knows who said what</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            A good clip needs more than a good quote.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            It matters who said it and where it came from. BitterClip names every voice and keeps every clip pinned to the exact spot in your recording — so "grab John's best bit" just works.
          </p>
          <p class="text-zinc-400 text-xs font-mono mt-3">Not a black-box clipper — every pick is something you can open and check.</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-5 items-stretch">
          <!-- LEFT: two real founder frames, labeled automatically -->
          <div class="glass-panel-accented glass-reflection corner-ticks rounded-2xl p-5 flex flex-col">
            <div class="grid grid-cols-2 gap-3">
              <figure class="clip-watermark-mask relative rounded-xl overflow-hidden border border-zinc-800">
                <img src="/clips/ep1-john.jpg" alt="John, automatically labeled as a speaker in the recording" width="640" height="360" loading="lazy" decoding="async" class="w-full aspect-video object-cover" />
                <figcaption class="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2 py-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#f28f84]"></span>
                  <span class="font-mono text-[10px] text-zinc-200 tracking-wide">John</span>
                </figcaption>
              </figure>
              <figure class="clip-watermark-mask relative rounded-xl overflow-hidden border border-zinc-800">
                <img src="/clips/ep1-michael.jpg" alt="Michael, automatically labeled as a speaker in the recording" width="640" height="360" loading="lazy" decoding="async" class="w-full aspect-video object-cover" />
                <figcaption class="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2 py-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#f28f84]"></span>
                  <span class="font-mono text-[10px] text-zinc-200 tracking-wide">Michael</span>
                </figcaption>
              </figure>
            </div>
            <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mt-6">Same recording, two speakers — labeled automatically.</p>
          </div>

          <!-- RIGHT: the speaker-attributed transcript exchange -->
          <div class="glass-panel-accented glass-reflection rounded-2xl overflow-hidden corner-ticks flex flex-col">
            <div class="px-4 py-3 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between">
              <span class="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Selected moment</span>
              <span class="font-mono text-[10px] text-[#f28f84]">00:12:04 - 00:12:31</span>
            </div>
            <div class="p-5 space-y-4 flex-1">
              <div class="flex gap-3">
                <img src="/clips/ep1-michael.jpg" alt="" width="36" height="36" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0" />
                <div>
                  <p class="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Michael</p>
                  <p class="text-sm text-zinc-300 leading-relaxed">We kept thinking the product was the picker.</p>
                </div>
              </div>
              <div class="flex gap-3 rounded-xl border-l-4 border-[#f28f84] bg-[#f28f84]/10 p-3 pl-4">
                <img src="/clips/ep1-john.jpg" alt="" width="36" height="36" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-[#f28f84]/30 shrink-0" />
                <div>
                  <p class="font-mono text-[10px] text-[#f28f84] uppercase tracking-widest mb-1">John</p>
                  <p class="text-sm text-zinc-100 leading-relaxed">But the actual value is trust, right? You know who said it, where it happened, and why the clip works.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <img src="/clips/ep1-michael.jpg" alt="" width="36" height="36" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0" />
                <div>
                  <p class="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Michael</p>
                  <p class="text-sm text-zinc-300 leading-relaxed">Exactly. The clip only works if the source is still attached.</p>
                </div>
              </div>
            </div>
            <div class="px-5 pt-1 pb-5">
              <div class="telemetry-ruler rounded-sm"></div>
              <p class="font-mono text-[10px] text-zinc-400 tracking-wide mt-2.5">&#8627; pinned to source</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Output gallery -->
      <section aria-label="Output gallery" class="mb-24">
        <div class="max-w-2xl mb-8">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">What you walk away with</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Finished, captioned clips — not a list of timestamps.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Real clips cut from one founder conversation. Hover to play.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <figure class="group relative aspect-video rounded-2xl overflow-hidden glass-panel-accented corner-ticks">
            <video
              data-clip
              src="/clips/day-1-opening.mp4"
              poster="/clips/day-1-opening-poster.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              @click="toggleClip"
              @keydown="keyClip"
              tabindex="0"
              role="button"
              aria-label="Play clip: Why we started, 27 seconds, cut from the founder conversation"
            ></video>
            <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,6,8,0.97)_0,rgba(6,6,8,0.97)_15%,rgba(0,0,0,0.45)_30%,transparent_55%)]"></div>
            <div class="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
              <span class="grid place-items-center w-11 h-11 rounded-full bg-[#f28f84] text-zinc-950 shadow-lg shadow-[#f28f84]/25">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            <figcaption class="absolute bottom-2 left-2 z-10 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              Why we started &middot; 0:27
            </figcaption>
          </figure>

          <figure class="group relative aspect-video rounded-2xl overflow-hidden glass-panel-accented corner-ticks">
            <video
              data-clip
              src="/clips/day-1-loop.mp4"
              poster="/clips/ep1-michael.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              @click="toggleClip"
              @keydown="keyClip"
              tabindex="0"
              role="button"
              aria-label="Play clip: The hard part, 14 seconds, cut from the founder conversation"
            ></video>
            <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,6,8,0.97)_0,rgba(6,6,8,0.97)_15%,rgba(0,0,0,0.45)_30%,transparent_55%)]"></div>
            <div class="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
              <span class="grid place-items-center w-11 h-11 rounded-full bg-[#f28f84] text-zinc-950 shadow-lg shadow-[#f28f84]/25">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            <figcaption class="absolute bottom-2 left-2 z-10 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              The hard part &middot; 0:14
            </figcaption>
          </figure>

          <figure class="group relative aspect-video rounded-2xl overflow-hidden glass-panel-accented corner-ticks">
            <video
              data-clip
              src="/clips/day-1-models.mp4"
              poster="/clips/ep1-john.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              @click="toggleClip"
              @keydown="keyClip"
              tabindex="0"
              role="button"
              aria-label="Play clip: The bet, 11 seconds, cut from the founder conversation"
            ></video>
            <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,6,8,0.97)_0,rgba(6,6,8,0.97)_15%,rgba(0,0,0,0.45)_30%,transparent_55%)]"></div>
            <div class="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
              <span class="grid place-items-center w-11 h-11 rounded-full bg-[#f28f84] text-zinc-950 shadow-lg shadow-[#f28f84]/25">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            <figcaption class="absolute bottom-2 left-2 z-10 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              The bet &middot; 0:11
            </figcaption>
          </figure>

          <figure class="group relative aspect-video rounded-2xl overflow-hidden glass-panel-accented corner-ticks">
            <video
              data-clip
              src="/clips/ep1-loop.mp4"
              poster="/clips/ep1-john2.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              @click="toggleClip"
              @keydown="keyClip"
              tabindex="0"
              role="button"
              aria-label="Play clip: Episode one, 19 seconds, cut from the founder conversation"
            ></video>
            <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,6,8,0.97)_0,rgba(6,6,8,0.97)_15%,rgba(0,0,0,0.45)_30%,transparent_55%)]"></div>
            <div class="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
              <span class="grid place-items-center w-11 h-11 rounded-full bg-[#f28f84] text-zinc-950 shadow-lg shadow-[#f28f84]/25">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            <figcaption class="absolute bottom-2 left-2 z-10 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              Episode one &middot; 0:19
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- 5. Agent cockpit + use cases (merged band) -->
      <section aria-label="Cockpit and use cases" class="mb-24">
        <div class="grid lg:grid-cols-2 gap-5 items-stretch">
          <!-- LEFT: the cockpit panel -->
          <div class="glass-panel-accented glass-reflection rounded-2xl p-6 corner-ticks flex flex-col">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">Works with ChatGPT &amp; Claude</p>
            <h3 class="font-display text-2xl font-bold tracking-tight text-white mb-4">
              ChatGPT finds the moment. You finish it.
            </h3>
            <p class="text-sm text-zinc-400 leading-relaxed mb-6">
              Ask ChatGPT for the strongest moment in a recording. BitterClip opens the transcript, the speakers, and a ready clip right there in the chat — so you finish and post without ever leaving the conversation.
            </p>

            <!-- non-interactive numbered sequence (1 → 2 → 3) -->
            <ol class="mt-auto space-y-3">
              <li class="flex items-start gap-3">
                <span class="grid place-items-center w-6 h-6 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] shrink-0 mt-px">1</span>
                <span class="text-sm text-zinc-300 leading-relaxed"><span class="text-zinc-200 font-semibold">ChatGPT suggests</span> the strongest moments from your recording.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="grid place-items-center w-6 h-6 rounded-full border border-[#f28f84]/40 bg-[#f28f84]/15 font-mono text-[10px] text-[#f28f84] shrink-0 mt-px">2</span>
                <span class="text-sm text-zinc-300 leading-relaxed"><span class="text-[#f28f84] font-semibold">You approve</span> — trim it and hear it in context before anything ships.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="grid place-items-center w-6 h-6 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] shrink-0 mt-px">3</span>
                <span class="text-sm text-zinc-300 leading-relaxed"><span class="text-zinc-200 font-semibold">You post</span> the finished clip, or publish straight to YouTube.</span>
              </li>
            </ol>
          </div>

          <!-- RIGHT: the use cases -->
          <div class="flex flex-col lg:pt-6">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">Built for real conversations</p>
            <h3 class="font-display text-2xl font-bold tracking-tight text-white mb-4">
              Founder calls, interviews, podcasts, and recurring shows.
            </h3>
            <div class="grid sm:grid-cols-2 gap-3 flex-1">
              <div class="glass-panel-accented rounded-xl p-4 hover:border-[#f28f84]/30 transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-[#f28f84] mb-3"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                <p class="text-sm text-zinc-300 leading-relaxed"><span class="text-zinc-100 font-semibold">Turn founder calls</span> into clips that explain what you're building.</p>
              </div>
              <div class="glass-panel-accented rounded-xl p-4 hover:border-[#f28f84]/30 transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-[#f28f84] mb-3"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v4" /></svg>
                <p class="text-sm text-zinc-300 leading-relaxed"><span class="text-zinc-100 font-semibold">Pull the best exchanges</span> out of podcasts and interviews.</p>
              </div>
              <div class="glass-panel-accented rounded-xl p-4 hover:border-[#f28f84]/30 transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-[#f28f84] mb-3"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" opacity="0" /><polyline points="20 6 9 17 4 12" /></svg>
                <p class="text-sm text-zinc-300 leading-relaxed"><span class="text-zinc-100 font-semibold">Cut clips for clients fast</span>, without losing control of the edit.</p>
              </div>
              <div class="glass-panel-accented rounded-xl p-4 hover:border-[#f28f84]/30 transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-[#f28f84] mb-3"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                <p class="text-sm text-zinc-300 leading-relaxed"><span class="text-zinc-100 font-semibold">Build a memory of your show</span> — its people, topics, and past clips.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. Close -->
      <section id="join" class="relative">
        <div class="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#f28f84]/10 to-transparent rounded-[3rem] blur-3xl -z-10 pointer-events-none" />

        <div class="max-w-2xl mx-auto text-center mb-9">
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Bring one recording. Leave with clips.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Upload a podcast, interview, or founder call. Walk away with finished clips you've checked yourself — cut right inside ChatGPT.
          </p>
        </div>

        <!-- one focused pricing card, peach-tinted top edge instead of a double frame -->
        <div class="relative max-w-[620px] mx-auto rounded-2xl glass-panel-accented glass-reflection corner-ticks p-7 sm:p-9 overflow-hidden">
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f28f84]/70 to-transparent pointer-events-none"></div>
          <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#f28f84]/[0.07] to-transparent pointer-events-none"></div>

          <div class="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div class="flex-1 text-left">
              <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-2">Launch plan</p>
              <p class="font-display text-3xl font-bold text-white">$99<span class="text-lg text-zinc-400 font-semibold">/month</span></p>
              <p class="text-zinc-400 text-xs mt-3 leading-relaxed">100 clips a month, the in-chat editor, ChatGPT and Claude connectors, and one-click YouTube publishing.</p>
            </div>
            <a
              :href="signupUrl"
              class="group bg-[#f28f84] text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:bg-[#ffa89e] active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black font-mono text-xs"
            >
              <span>Clip your first recording</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>
