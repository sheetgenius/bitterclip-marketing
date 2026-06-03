<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const signupUrl = 'https://app.bitterclip.com/sign_up'

// --- Live Editor Embed ---
const embedUrl = ref('https://app.bitterclip.com/embed/clip-demo?bare=1')
const iframeHeight = ref(540)
const isIframeLoading = ref(true)
const demoActivated = ref(true)

const onIframeLoad = () => {
  isIframeLoading.value = false
}

const activateDemo = () => {
  demoActivated.value = true
}

const handleMessage = (event: MessageEvent) => {
  if (event.data && typeof event.data === 'object' && 'height' in event.data) {
    const height = Number(event.data.height)
    if (!isNaN(height) && height > 200 && height < 1500) {
      iframeHeight.value = height
    }
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
</script>

<template>
  <div class="relative w-full">
    <div class="absolute top-0 left-0 right-0 h-[680px] hero-backdrop-mask opacity-[0.25] -z-10 pointer-events-none" />

    <main class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-24 relative">

      <!-- 1. Hero -->
      <div class="text-center max-w-4xl mx-auto mb-14 sm:mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-zinc-950/80 text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-6 animate-float corner-ticks shadow-lg shadow-black/40">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Speaker-aware clipping for ChatGPT and Claude</span>
        </div>

        <h2 class="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
          Cut clips where
          <span class="bg-gradient-to-r from-amber-300 via-orange-300 to-orange-500 bg-clip-text text-transparent block sm:inline">
            your context lives.
          </span>
        </h2>

        <p class="text-zinc-400 text-lg sm:text-xl font-sans max-w-3xl mx-auto leading-relaxed mb-8">
          BitterClip turns podcasts, interviews, founder calls, demos, and recurring shows into speaker-aware clips your AI can find, you can verify, and export ready to post.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            :href="signupUrl"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-amber-300 active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span>Start with one recording</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="#demo"
            class="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 px-5 py-2.5 font-mono text-xs font-bold text-zinc-300 transition duration-200 hover:border-zinc-600 hover:text-white min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Watch demo
          </a>
        </div>

        <p class="text-xs text-zinc-600 font-mono mt-5">Built for recurring shows, interviews, founder-led marketing, and expert conversations.</p>
      </div>

      <section aria-label="Product loop" class="mb-20">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="border border-zinc-900 bg-zinc-950/50 rounded-xl p-4">
            <p class="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2">01</p>
            <h3 class="font-display text-sm font-bold text-white">Recording</h3>
            <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Upload the source.</p>
          </div>
          <div class="border border-zinc-900 bg-zinc-950/50 rounded-xl p-4">
            <p class="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2">02</p>
            <h3 class="font-display text-sm font-bold text-white">Speakers</h3>
            <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Know who said what.</p>
          </div>
          <div class="border border-zinc-900 bg-zinc-950/50 rounded-xl p-4">
            <p class="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2">03</p>
            <h3 class="font-display text-sm font-bold text-white">Moments</h3>
            <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Ask AI to find the best parts.</p>
          </div>
          <div class="border border-zinc-900 bg-zinc-950/50 rounded-xl p-4">
            <p class="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2">04</p>
            <h3 class="font-display text-sm font-bold text-white">Verify</h3>
            <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Check source context.</p>
          </div>
          <div class="border border-zinc-900 bg-zinc-950/50 rounded-xl p-4 col-span-2 md:col-span-1">
            <p class="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2">05</p>
            <h3 class="font-display text-sm font-bold text-white">Export</h3>
            <p class="text-xs text-zinc-500 mt-1 leading-relaxed">Post a finished MP4.</p>
          </div>
        </div>
      </section>

      <!-- 2. The actual editor -->
      <section id="demo" class="mb-24 relative scroll-mt-28">
        <div class="absolute inset-0 bg-amber-400/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />

        <div class="text-center max-w-2xl mx-auto mb-8 relative">
          <p class="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-3">Live product surface</p>
          <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">This is the editor your AI opens.</h2>
          <p class="text-zinc-400 text-sm mt-2 font-sans">Drag across words. Check the source. The cut follows the audio.</p>
        </div>

        <div class="glass-panel-accented glass-reflection rounded-3xl overflow-hidden corner-ticks relative min-h-[400px]">

          <!-- Window header -->
          <div class="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 relative z-10">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-amber-400/70"></span>
              <span class="w-3 h-3 rounded-full bg-orange-500/60"></span>
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
            <p class="font-mono text-[8px] text-amber-400 uppercase tracking-widest mb-3">Live editor</p>
            <h4 class="font-display text-lg font-bold text-white mb-2">Same editor. Same chat surface.</h4>
            <p class="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
              This is the editor ChatGPT and Claude open for review. Drag across the words to cut a clip. Tap to load it.
            </p>
            <button
              @click="activateDemo"
              class="px-5 py-2.5 font-mono text-xs font-bold bg-amber-400 text-zinc-950 rounded-xl shadow-lg shadow-amber-400/10 hover:bg-amber-300 hover:scale-102 active:scale-98 transition duration-200 cursor-pointer min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Load the editor
            </button>
          </div>

          <!-- Skeleton loader -->
          <div v-if="demoActivated && isIframeLoading" class="absolute inset-0 bg-[#060608]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none transition-opacity duration-300">
            <div class="flex flex-col items-center gap-4 text-center p-6">
              <div class="relative w-8 h-8">
                <div class="absolute inset-0 rounded-full border-2 border-amber-400/20"></div>
                <div class="absolute inset-0 rounded-full border-2 border-t-amber-400 animate-spin"></div>
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

        <div class="text-center mt-6">
          <a :href="signupUrl" class="inline-flex items-center gap-1.5 font-sans text-sm text-zinc-400 hover:text-amber-400 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded">
            Upload your own recordings with the Launch plan.
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </section>

      <!-- 3. Workbench positioning -->
      <section class="mb-24 border-y border-zinc-900 py-14">
        <div class="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-start">
          <div>
            <p class="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-3">Why it works</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              BitterClip structures the conversation.
            </h2>
            <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Good clips depend on more than interesting words. They depend on who said them, what came before, what came after, and whether the moment stands on its own.
            </p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="glass-panel-accented glass-reflection rounded-2xl p-5 corner-ticks">
              <h3 class="font-display text-base font-bold text-white mb-2">Speaker-aware transcript</h3>
              <p class="text-sm text-zinc-400 leading-relaxed">Named speaker turns, identity review, and readable transcript context.</p>
            </div>
            <div class="glass-panel-accented glass-reflection rounded-2xl p-5 corner-ticks">
              <h3 class="font-display text-base font-bold text-white mb-2">Source-linked moments</h3>
              <p class="text-sm text-zinc-400 leading-relaxed">Every candidate opens against the exact recording range.</p>
            </div>
            <div class="glass-panel-accented glass-reflection rounded-2xl p-5 corner-ticks">
              <h3 class="font-display text-base font-bold text-white mb-2">Human verification</h3>
              <p class="text-sm text-zinc-400 leading-relaxed">Check the span, adjust boundaries, and avoid misleading cuts.</p>
            </div>
            <div class="glass-panel-accented glass-reflection rounded-2xl p-5 corner-ticks">
              <h3 class="font-display text-base font-bold text-white mb-2">Recurring memory</h3>
              <p class="text-sm text-zinc-400 leading-relaxed">Reuse confirmed speakers, prior clips, and show context over time.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Speaker example -->
      <section class="mb-24">
        <div class="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p class="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-3">Speaker-aware clipping</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              The best clips depend on knowing who said what.
            </h2>
            <p class="text-zinc-400 text-sm sm:text-base leading-relaxed mb-5">
              Ask for the sharpest exchange, the clearest explanation, the strongest validation, or the moment with the best setup and payoff. BitterClip works from the shape of the conversation, not a flat transcript blob.
            </p>
            <p class="text-zinc-500 text-xs font-mono">AI suggests. You verify. BitterClip exports.</p>
          </div>

          <div class="glass-panel-accented glass-reflection rounded-2xl overflow-hidden corner-ticks">
            <div class="px-4 py-3 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between">
              <span class="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Selected moment</span>
              <span class="font-mono text-[10px] text-amber-400">00:12:04 - 00:12:31</span>
            </div>
            <div class="p-5 space-y-4">
              <div class="flex gap-3">
                <div class="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 shrink-0"></div>
                <div>
                  <p class="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Michael</p>
                  <p class="text-sm text-zinc-300 leading-relaxed">We kept thinking the product was the picker.</p>
                </div>
              </div>
              <div class="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                <div class="w-9 h-9 rounded-full bg-zinc-800 border border-amber-400/30 shrink-0"></div>
                <div>
                  <p class="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-1">John</p>
                  <p class="text-sm text-zinc-100 leading-relaxed">But the actual value is trust, right? You know who said it, where it happened, and why the clip works.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 shrink-0"></div>
                <div>
                  <p class="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Michael</p>
                  <p class="text-sm text-zinc-300 leading-relaxed">Exactly. The clip only works if the source is still attached.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Comparison -->
      <section class="mb-24">
        <div class="max-w-2xl mb-8">
          <p class="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-3">Different by design</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Not another pile of AI suggestions.
          </h2>
          <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
            BitterClip is built for operators who care about quality, context, and repeatability.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div class="border border-zinc-900 bg-zinc-950/40 rounded-2xl p-6">
            <h3 class="font-display text-lg font-bold text-zinc-300 mb-4">Generic AI clipper</h3>
            <ul class="space-y-3 text-sm text-zinc-500">
              <li>Opaque suggestions</li>
              <li>Flat transcript</li>
              <li>Weak speaker memory</li>
              <li>Hard to verify context</li>
            </ul>
          </div>
          <div class="border border-amber-400/20 bg-amber-400/5 rounded-2xl p-6 corner-ticks">
            <h3 class="font-display text-lg font-bold text-white mb-4">BitterClip</h3>
            <ul class="space-y-3 text-sm text-zinc-300">
              <li>Source-linked moments</li>
              <li>Speaker-aware transcript</li>
              <li>Confirmed recurring speakers</li>
              <li>Transcript + media verification</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 6. Use cases + AI context -->
      <section class="mb-24">
        <div class="grid lg:grid-cols-[1.05fr_0.95fr] gap-10">
          <div>
            <p class="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-3">Built for real conversations</p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
              Founder calls, interviews, podcasts, demos, and recurring shows.
            </h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <p class="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4 text-sm text-zinc-400 leading-relaxed">Turn founder-led conversations into clips that explain what you are building.</p>
              <p class="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4 text-sm text-zinc-400 leading-relaxed">Find strong exchanges in podcasts and expert interviews.</p>
              <p class="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4 text-sm text-zinc-400 leading-relaxed">Give agencies and editors faster discovery with human control.</p>
              <p class="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4 text-sm text-zinc-400 leading-relaxed">Build show memory from speakers, topics, and prior clips.</p>
            </div>
          </div>

          <div class="glass-panel-accented glass-reflection rounded-2xl p-6 corner-ticks">
            <p class="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-3">AI cockpit</p>
            <h3 class="font-display text-2xl font-bold tracking-tight text-white mb-4">
              Your AI can find the moment. BitterClip helps finish it.
            </h3>
            <p class="text-sm text-zinc-400 leading-relaxed mb-5">
              Ask ChatGPT or Claude for the strongest moment from a recording. BitterClip exposes the transcript, speakers, and candidate clip, then brings you into a focused workspace to verify and export.
            </p>
            <div class="grid grid-cols-3 gap-2 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span class="rounded-lg border border-zinc-800 bg-zinc-950/70 py-2">Agent proposes</span>
              <span class="rounded-lg border border-amber-400/20 bg-amber-400/10 py-2 text-amber-400">You verify</span>
              <span class="rounded-lg border border-zinc-800 bg-zinc-950/70 py-2">Export</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. Close -->
      <section id="join" class="relative max-w-4xl mx-auto">
        <div class="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

        <div class="cta-glass-panel glass-reflection p-7 sm:p-9 rounded-2xl relative overflow-hidden corner-ticks">
          <div class="absolute inset-0 -z-10 cta-backdrop-mask opacity-[0.2] pointer-events-none" />

          <div class="max-w-2xl mx-auto text-center mb-7">
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Start with one recording.
            </h2>
            <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Bring a podcast, interview, founder call, demo, or recurring show. Leave with clips you can verify and post.
            </p>
          </div>

          <div class="max-w-2xl mx-auto">
            <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div class="flex-1 text-left">
                <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Launch plan</p>
                <p class="font-display text-2xl font-bold text-white">$99/month</p>
                <p class="text-zinc-500 text-xs mt-2 leading-relaxed">100 clip exports a month, speaker-aware transcript workspace, ChatGPT + Claude connector, and YouTube publishing.</p>
              </div>
              <a
                :href="signupUrl"
                class="bg-amber-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:bg-amber-300 active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black font-mono text-xs"
              >
                <span>Start with one recording</span>
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
