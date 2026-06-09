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
const embedUrl = ref('https://app.bitterclip.com/embed/clip-demo?bare=1')
const iframeHeight = ref(540)
const isIframeLoading = ref(true)
const demoActivated = ref(true)

// --- Live recording-card widget: the REAL product component, embedded ---
const heroIframe = ref<HTMLIFrameElement | null>(null)
const heroWidgetHeight = ref(560)

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
    heroWidgetHeight.value = height
  } else {
    iframeHeight.value = height
  }
}

onMounted(() => {
  // Build the embed URL: base (overridable via ?embed= for local dev) + the
  // bare editor + a real demo clip the site hosts, so Export plays + downloads it.
  const base = (new URLSearchParams(window.location.search).get('embed') || 'https://app.bitterclip.com/embed/clip-demo').split('?')[0]
  const clip = `${window.location.origin}/clips/day-1-opening.mp4`
  embedUrl.value = `${base}?bare=1&clip=${encodeURIComponent(clip)}`

  // Mobile load gate: on small viewports, deactivate by default to preserve bandwidth
  if (window.innerWidth < 768) {
    demoActivated.value = false
  }

  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})

// --- Output gallery: hover/focus plays one clip at a time (no autoplay) ---
const playClip = (e: Event) => {
  const target = e.currentTarget as HTMLVideoElement
  document.querySelectorAll<HTMLVideoElement>('[data-clip]').forEach((v) => {
    if (v !== target) {
      v.pause()
      v.currentTime = 0
    }
  })
  target.play().catch(() => {})
}

const stopClip = (e: Event) => {
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
          <h1 class="font-display text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.035em] text-white leading-[1.0] mb-6">
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
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span>Clip your first recording</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#demo"
              class="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 px-5 py-2.5 font-mono text-xs font-bold text-zinc-300 transition duration-200 hover:border-zinc-600 hover:text-white min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
            <svg viewBox="0 0 130 90" fill="none" class="w-28 h-20 mt-0.5 ml-12 text-[#ffb4a8]/80">
              <path d="M10 12 C 50 6, 96 22, 112 66" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <path d="M99 58 L113 67 L102 79" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
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

                <!-- The REAL recording-card component, embedded live from the product -->
                <iframe
                  ref="heroIframe"
                  src="https://app.bitterclip.com/embed/recording/src_qjxzecbketjkby2eynbi?bare=1"
                  title="BitterClip — episode one, cut into clips"
                  loading="lazy"
                  scrolling="no"
                  class="w-full block rounded-2xl overflow-hidden bg-transparent"
                  :style="{ height: heroWidgetHeight + 'px', border: 0 }"
                ></iframe>
              </div>

              <!-- home indicator -->
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-[36%] h-[5px] rounded-full bg-white/40 z-30"></div>
              </div>
            </div>
          </div>
          </div>
        </div>

      </div>

      <section aria-label="Product loop" class="mb-20">
        <div class="relative">
          <!-- faint connecting rail behind the steps (desktop only) -->
          <div class="hidden md:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#f28f84]/35 to-transparent pointer-events-none -z-0"></div>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-3 relative">
            <div class="glass-panel-accented glass-reflection corner-ticks rounded-xl p-4">
              <div class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] mb-3">01</div>
              <h3 class="font-display text-sm font-bold text-white">Upload</h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Add your podcast, interview, or call.</p>
            </div>
            <div class="glass-panel-accented glass-reflection corner-ticks rounded-xl p-4">
              <div class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] mb-3">02</div>
              <h3 class="font-display text-sm font-bold text-white">Who's talking</h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Every voice gets a name.</p>
            </div>
            <div class="glass-panel-accented glass-reflection corner-ticks rounded-xl p-4">
              <div class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] mb-3">03</div>
              <h3 class="font-display text-sm font-bold text-white">Find the moment</h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Ask ChatGPT for the best parts.</p>
            </div>
            <div class="glass-panel-accented glass-reflection corner-ticks rounded-xl p-4">
              <div class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] mb-3">04</div>
              <h3 class="font-display text-sm font-bold text-white">Check it</h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Trim it and hear it in context.</p>
            </div>
            <div class="glass-panel-accented glass-reflection corner-ticks rounded-xl p-4 col-span-2 md:col-span-1">
              <div class="grid place-items-center w-7 h-7 rounded-full border border-[#f28f84]/30 bg-[#f28f84]/5 font-mono text-[10px] text-[#f28f84] mb-3">05</div>
              <h3 class="font-display text-sm font-bold text-white">Post it</h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Download it or publish to YouTube.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. The actual editor -->
      <section id="demo" class="mb-24 relative scroll-mt-28">
        <div class="absolute inset-0 bg-[#f28f84]/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />

        <div class="text-center max-w-2xl mx-auto mb-8 relative">
          <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">The real editor</p>
          <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">The same editor opens right inside ChatGPT.</h2>
          <p class="text-zinc-400 text-sm mt-2 font-sans">Drag across the words to pick your clip. Play it back. Export.</p>
        </div>

        <!-- gesture strip -->
        <div class="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
          <span class="text-[#f28f84]">drag the words</span>
          <span class="text-zinc-700">&rarr;</span>
          <span class="text-[#f28f84]">check the source</span>
          <span class="text-zinc-700">&rarr;</span>
          <span class="text-[#f28f84]">export</span>
        </div>

        <div class="glass-panel-accented glass-reflection rounded-3xl overflow-hidden corner-ticks relative min-h-[400px]">

          <!-- Window header -->
          <div class="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 relative z-10">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#f28f84]/70"></span>
              <span class="w-3 h-3 rounded-full bg-[#d66f5f]/60"></span>
              <span class="w-3 h-3 rounded-full bg-zinc-700"></span>
              <span class="text-xs font-mono text-zinc-500 ml-4 hidden sm:inline">day-1 · founder interview</span>
            </div>

            <div class="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-mono text-[10px] font-bold text-zinc-400 tracking-wide">Live</span>
            </div>
          </div>

          <!-- Mobile Activation Gate -->
          <div v-if="!demoActivated" class="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center z-20">
            <p class="font-mono text-[8px] text-[#f28f84] uppercase tracking-widest mb-3">The real editor</p>
            <h4 class="font-display text-lg font-bold text-white mb-2">The same editor that opens in ChatGPT.</h4>
            <p class="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
              Drag across the words to cut a clip, then check it against the recording. Tap to load it.
            </p>
            <button
              @click="activateDemo"
              class="px-5 py-2.5 font-mono text-xs font-bold bg-[#f28f84] text-zinc-950 rounded-xl shadow-lg shadow-[#f28f84]/10 hover:bg-[#ffa89e] hover:scale-102 active:scale-98 transition duration-200 cursor-pointer min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Load the editor
            </button>
          </div>

          <!-- Skeleton loader -->
          <div v-if="demoActivated && isIframeLoading" class="absolute inset-0 bg-[#060608]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none transition-opacity duration-300">
            <div class="flex flex-col items-center gap-4 text-center p-6">
              <div class="relative w-8 h-8">
                <div class="absolute inset-0 rounded-full border-2 border-[#f28f84]/20"></div>
                <div class="absolute inset-0 rounded-full border-2 border-t-[#f28f84] animate-spin"></div>
              </div>
              <span class="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Loading the editor…</span>
            </div>
          </div>

          <iframe
            v-if="demoActivated"
            :src="embedUrl"
            title="BitterClip — the live transcript editor"
            loading="lazy"
            @load="onIframeLoad"
            @mouseenter="$event.target.contentWindow?.focus()"
            class="w-full block transition-[height] duration-200"
            :style="{ height: `${iframeHeight}px`, border: 0, background: 'transparent' }"
          />

          <!-- Status bar -->
          <div class="px-6 py-3 bg-zinc-950/60 backdrop-blur-md flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-800/80">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live demo · nothing saved
          </div>

        </div>

        <div class="text-center mt-7">
          <a
            :href="signupUrl"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span>Clip your own recording</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </a>
          <p class="text-xs text-zinc-600 font-mono mt-3">This demo is read-only. Upload your own to start cutting.</p>
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
          <p class="text-zinc-500 text-xs font-mono mt-3">Not a black-box clipper — every pick is something you can open and check.</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-5 items-stretch">
          <!-- LEFT: two real founder frames, labeled automatically -->
          <div class="glass-panel-accented glass-reflection corner-ticks rounded-2xl p-5 flex flex-col">
            <div class="grid grid-cols-2 gap-3">
              <figure class="relative rounded-xl overflow-hidden border border-zinc-800">
                <img src="/clips/ep1-john.jpg" alt="Founder webcam frame — John" loading="lazy" decoding="async" class="w-full aspect-video object-cover" />
                <figcaption class="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2 py-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#f28f84]"></span>
                  <span class="font-mono text-[10px] text-zinc-200 tracking-wide">John</span>
                </figcaption>
              </figure>
              <figure class="relative rounded-xl overflow-hidden border border-zinc-800">
                <img src="/clips/ep1-michael.jpg" alt="Founder webcam frame — Michael" loading="lazy" decoding="async" class="w-full aspect-video object-cover" />
                <figcaption class="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2 py-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#f28f84]"></span>
                  <span class="font-mono text-[10px] text-zinc-200 tracking-wide">Michael</span>
                </figcaption>
              </figure>
            </div>
            <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mt-4">Same recording, two speakers — labeled automatically.</p>
          </div>

          <!-- RIGHT: the speaker-attributed transcript exchange -->
          <div class="glass-panel-accented glass-reflection rounded-2xl overflow-hidden corner-ticks flex flex-col">
            <div class="px-4 py-3 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between">
              <span class="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Selected moment</span>
              <span class="font-mono text-[10px] text-[#f28f84]">00:12:04 - 00:12:31</span>
            </div>
            <div class="p-5 space-y-4 flex-1">
              <div class="flex gap-3">
                <img src="/clips/ep1-michael.jpg" alt="" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0" />
                <div>
                  <p class="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Michael</p>
                  <p class="text-sm text-zinc-300 leading-relaxed">We kept thinking the product was the picker.</p>
                </div>
              </div>
              <div class="flex gap-3 rounded-xl border border-[#f28f84]/20 bg-[#f28f84]/5 p-3">
                <img src="/clips/ep1-john.jpg" alt="" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-[#f28f84]/30 shrink-0" />
                <div>
                  <p class="font-mono text-[10px] text-[#f28f84] uppercase tracking-widest mb-1">John</p>
                  <p class="text-sm text-zinc-100 leading-relaxed">But the actual value is trust, right? You know who said it, where it happened, and why the clip works.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <img src="/clips/ep1-michael.jpg" alt="" loading="lazy" decoding="async" class="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0" />
                <div>
                  <p class="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Michael</p>
                  <p class="text-sm text-zinc-300 leading-relaxed">Exactly. The clip only works if the source is still attached.</p>
                </div>
              </div>
            </div>
            <div class="px-5 pb-4">
              <div class="telemetry-ruler rounded-sm"></div>
              <p class="font-mono text-[10px] text-zinc-500 tracking-wide mt-2">&#8627; pinned to source</p>
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

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:auto-rows-fr">
          <!-- FEATURE clip, spans 2x2 -->
          <figure class="group relative col-span-2 row-span-2 rounded-2xl overflow-hidden glass-panel-accented glass-reflection corner-ticks">
            <video
              data-clip
              src="/clips/day-1-opening.mp4"
              poster="/clips/day-1-opening-poster.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover aspect-video md:aspect-auto"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              tabindex="0"
            ></video>
            <figcaption class="absolute bottom-2 left-2 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              Why we started &middot; 0:27
            </figcaption>
          </figure>

          <figure class="group relative rounded-2xl overflow-hidden glass-panel-accented glass-reflection corner-ticks">
            <video
              data-clip
              src="/clips/day-1-loop.mp4"
              poster="/clips/ep1-michael.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover aspect-video"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              tabindex="0"
            ></video>
            <figcaption class="absolute bottom-2 left-2 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              The hard part &middot; 0:14
            </figcaption>
          </figure>

          <figure class="group relative rounded-2xl overflow-hidden glass-panel-accented glass-reflection corner-ticks">
            <video
              data-clip
              src="/clips/day-1-models.mp4"
              poster="/clips/ep1-john.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover aspect-video"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              tabindex="0"
            ></video>
            <figcaption class="absolute bottom-2 left-2 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
              The bet &middot; 0:11
            </figcaption>
          </figure>

          <figure class="group relative col-span-2 md:col-span-2 rounded-2xl overflow-hidden glass-panel-accented glass-reflection corner-ticks">
            <video
              data-clip
              src="/clips/ep1-loop.mp4"
              poster="/clips/ep1-john2.jpg"
              muted
              loop
              playsinline
              preload="none"
              class="w-full h-full object-cover aspect-video"
              @mouseenter="playClip"
              @mouseleave="stopClip"
              @focus="playClip"
              @blur="stopClip"
              tabindex="0"
            ></video>
            <figcaption class="absolute bottom-2 left-2 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] text-zinc-200 tracking-wide">
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
            <p class="text-sm text-zinc-400 leading-relaxed mb-5">
              Ask ChatGPT for the strongest moment in a recording. BitterClip opens the transcript, the speakers, and a ready clip right there in the chat — so you finish and post without ever leaving the conversation.
            </p>
            <div class="grid grid-cols-3 gap-2 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500 mt-auto">
              <span class="rounded-lg border border-zinc-800 bg-zinc-950/70 py-2">ChatGPT suggests</span>
              <span class="rounded-lg border border-[#f28f84]/20 bg-[#f28f84]/10 py-2 text-[#f28f84]">You approve</span>
              <span class="rounded-lg border border-zinc-800 bg-zinc-950/70 py-2">You post</span>
            </div>
          </div>

          <!-- RIGHT: the use cases -->
          <div class="flex flex-col">
            <p class="font-mono text-[10px] uppercase tracking-widest text-[#f28f84] mb-3">Built for real conversations</p>
            <h3 class="font-display text-2xl font-bold tracking-tight text-white mb-4">
              Founder calls, interviews, podcasts, and recurring shows.
            </h3>
            <div class="grid sm:grid-cols-2 gap-3">
              <p class="glass-panel-accented rounded-xl p-4 text-sm text-zinc-400 leading-relaxed">Turn founder calls into clips that explain what you're building.</p>
              <p class="glass-panel-accented rounded-xl p-4 text-sm text-zinc-400 leading-relaxed">Pull the best exchanges out of podcasts and interviews.</p>
              <p class="glass-panel-accented rounded-xl p-4 text-sm text-zinc-400 leading-relaxed">Cut clips for clients fast, without losing control of the edit.</p>
              <p class="glass-panel-accented rounded-xl p-4 text-sm text-zinc-400 leading-relaxed">Build a memory of your show — its people, topics, and past clips.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. Close -->
      <section id="join" class="relative max-w-4xl mx-auto">
        <div class="absolute inset-0 bg-gradient-to-r from-[#f28f84]/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

        <div class="cta-glass-panel glass-reflection p-7 sm:p-9 rounded-2xl relative overflow-hidden corner-ticks">
          <div class="absolute inset-0 -z-10 cta-backdrop-mask opacity-[0.2] pointer-events-none" />

          <div class="max-w-2xl mx-auto text-center mb-7">
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Bring one recording. Leave with clips.
            </h2>
            <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Upload a podcast, interview, or founder call. Walk away with finished clips you've checked yourself — cut right inside ChatGPT.
            </p>
          </div>

          <div class="max-w-2xl mx-auto">
            <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div class="flex-1 text-left">
                <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Launch plan</p>
                <p class="font-display text-2xl font-bold text-white">$99/month</p>
                <p class="text-zinc-500 text-xs mt-2 leading-relaxed">100 clips a month, the in-chat editor, ChatGPT and Claude connectors, and one-click YouTube publishing.</p>
              </div>
              <a
                :href="signupUrl"
                class="bg-[#f28f84] text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:bg-[#ffa89e] active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black font-mono text-xs"
              >
                <span>Clip your first recording</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>
