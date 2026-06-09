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

      <!-- SECTION 01 — It preps itself (copy LEFT, speaker-ID panel RIGHT) -->
      <section aria-label="It preps itself" class="mb-24">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          <!-- LEFT: the copy -->
          <div class="max-w-xl">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">01 — It preps itself</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
              Upload a recording. It does the boring part.
            </h2>
            <p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
              Drop in a podcast, interview, or founder call. BitterClip transcribes it and labels every speaker — names and all — automatically. No cleanup. By the time you open it, it's ready to clip.
            </p>
          </div>

          <!-- RIGHT: the prep proof — a transcript with speakers identified -->
          <div class="glass-panel-accented glass-reflection corner-ticks rounded-2xl p-5 sm:p-6">
            <!-- header row -->
            <div class="flex items-center justify-between mb-5">
              <span class="font-mono text-[10px] text-zinc-400 tracking-wide">day-1 · founder interview</span>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/10 px-2.5 py-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span class="font-mono text-[10px] font-bold text-[#f28f84] tracking-wide">Transcribed</span>
              </span>
            </div>

            <!-- speaker rows with speaking-time % -->
            <div class="space-y-3 mb-4">
              <div class="flex items-center gap-3">
                <img src="/clips/ep1-michael.jpg" alt="Mike, automatically identified as a speaker" width="32" height="32" loading="lazy" decoding="async" class="object-cover rounded-full w-8 h-8 border border-zinc-700 shrink-0" />
                <span class="text-sm font-semibold text-white flex-1">Mike</span>
                <span class="font-mono text-[11px] text-zinc-400">54%</span>
              </div>
              <div class="flex items-center gap-3">
                <img src="/clips/ep1-john.jpg" alt="John, automatically identified as a speaker" width="32" height="32" loading="lazy" decoding="async" class="object-cover rounded-full w-8 h-8 border border-zinc-700 shrink-0" />
                <span class="text-sm font-semibold text-white flex-1">John</span>
                <span class="font-mono text-[11px] text-zinc-400">46%</span>
              </div>
            </div>

            <!-- thin split bar: 54 Mike (peach) / 46 John (emerald) -->
            <div class="flex h-1.5 rounded-full overflow-hidden mb-6" aria-hidden="true">
              <span class="bg-[#f28f84]" style="width: 54%"></span>
              <span class="bg-emerald-400" style="width: 46%"></span>
            </div>

            <!-- speaker-attributed transcript lines -->
            <div class="space-y-2.5 mb-5">
              <p class="text-sm text-zinc-300 leading-relaxed">
                <span class="font-semibold text-[#f28f84]">Mike:</span> We kept thinking the product was the picker.
              </p>
              <p class="text-sm text-zinc-300 leading-relaxed">
                <span class="font-semibold text-emerald-400">John:</span> But the actual value is trust — you know who said it and why the clip works.
              </p>
              <p class="text-sm text-zinc-300 leading-relaxed">
                <span class="font-semibold text-[#f28f84]">Mike:</span> Exactly. The clip only works if the source is still attached.
              </p>
            </div>

            <div class="telemetry-ruler rounded-sm"></div>
            <p class="font-mono text-[10px] text-zinc-400 tracking-wide mt-3">Transcribed and split by speaker — automatically.</p>
          </div>

        </div>
      </section>

      <!-- SECTION 02 — Right in ChatGPT & Claude (editor LEFT, copy RIGHT — the centerpiece) -->
      <section id="demo" class="mb-24 relative scroll-mt-28">
        <div class="absolute inset-0 bg-[#f28f84]/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />

        <div class="grid lg:grid-cols-[minmax(520px,1fr)_1fr] gap-8 lg:gap-12 items-center">

          <!-- LEFT: the live editor, at ~half width -->
          <div class="relative">
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
          </div>

          <!-- RIGHT: the copy, vertically centered -->
          <div class="max-w-xl">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">02 — Right in ChatGPT &amp; Claude</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
              Other clippers guess. Yours knows the whole conversation.
            </h2>
            <p class="text-zinc-400 text-base sm:text-lg leading-relaxed mb-6">
              Your recording is right there in the chat you already use. Ask for the sharpest exchange or the clearest explanation — and because ChatGPT and Claude have the whole conversation (who said it, what came before and after), the moments they pick land. Drag across the words, check it against the source, export.
            </p>

            <!-- motif row: it suggests → you approve → you post -->
            <div class="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              <span class="text-[#f28f84]">it suggests</span>
              <span class="text-zinc-600">&rarr;</span>
              <span class="text-[#f28f84]">you approve</span>
              <span class="text-zinc-600">&rarr;</span>
              <span class="text-[#f28f84]">you post</span>
            </div>
          </div>

        </div>
      </section>

      <!-- SECTION 03 — The handoff (copy LEFT, gallery + deliver RIGHT) -->
      <section aria-label="The handoff" class="mb-24">
        <div class="max-w-2xl mb-10">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-4">03 — The handoff</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-5">
            Finished clips — out the door, your way.
          </h2>
          <p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Trim it, export, done. Post it straight to YouTube, X, or LinkedIn, or grab a shareable link. And invite a client to the same recording so they can pull their own clips in their ChatGPT or Claude — index once, everyone clips.
          </p>
        </div>

        <!-- The four destinations, featured big -->
        <div role="list" class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12 mt-2">
          <!-- YouTube -->
          <div role="listitem" class="group flex flex-col items-center justify-center gap-4">
            <svg viewBox="0 0 28 20" class="w-[74px] h-auto" aria-hidden="true">
              <rect width="28" height="20" rx="6" fill="#FF0000" />
              <path d="M11.4 5.5v9l7.2-4.5z" fill="#fff" />
            </svg>
            <span class="text-sm font-semibold text-zinc-200 tracking-tight">YouTube</span>
          </div>
          <!-- X -->
          <div role="listitem" class="group flex flex-col items-center justify-center gap-4">
            <svg viewBox="0 0 24 24" fill="#fff" class="w-[52px] h-[52px]" aria-hidden="true">
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
            <span class="text-sm font-semibold text-zinc-200 tracking-tight">X</span>
          </div>
          <!-- LinkedIn -->
          <div role="listitem" class="group flex flex-col items-center justify-center gap-4">
            <svg viewBox="0 0 24 24" class="w-[58px] h-[58px]" aria-hidden="true">
              <rect width="24" height="24" rx="5" fill="#0A66C2" />
              <path fill="#fff" d="M4.98 4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM3.5 9.2h2.96V20H3.5V9.2Zm4.74 0h2.84v1.48h.05c.4-.72 1.36-1.48 2.79-1.48 2.99 0 3.55 1.92 3.55 4.42V20h-2.96v-4.5c0-1.07-.02-2.45-1.5-2.45-1.5 0-1.73 1.16-1.73 2.37V20H8.24V9.2Z" />
            </svg>
            <span class="text-sm font-semibold text-zinc-200 tracking-tight">LinkedIn</span>
          </div>
          <!-- Shareable link -->
          <div role="listitem" class="group flex flex-col items-center justify-center gap-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f28f84" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="w-[50px] h-[50px]" aria-hidden="true">
              <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <span class="text-sm font-semibold text-zinc-200 tracking-tight">Shareable link</span>
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
