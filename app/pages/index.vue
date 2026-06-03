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
    <!-- Cinematic Smoked Backdrop -->
    <div class="absolute top-0 left-0 right-0 h-[680px] hero-backdrop-mask opacity-[0.25] -z-10 pointer-events-none" />

    <main class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-24 relative">

      <!-- 1 · HERO -->
      <div class="text-center max-w-4xl mx-auto mb-14 sm:mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800/80 bg-zinc-950/80 text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-6 animate-float corner-ticks shadow-lg shadow-black/40">
          <span class="w-1.5 h-1.5 rounded-full bg-[#ff9a8f] animate-pulse"></span>
          <span>Opens inside ChatGPT and Claude</span>
        </div>

        <h2 class="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
          Ask for the moment.
          <span class="bg-gradient-to-r from-[#ff9a8f] via-[#ffaa9f] to-amber-300 bg-clip-text text-transparent block sm:inline">
            Cut it by words.
          </span>
        </h2>

        <p class="text-zinc-400 text-lg sm:text-xl font-sans max-w-2xl mx-auto leading-relaxed mb-8">
          Tell ChatGPT or Claude what you want clipped. BitterClip opens the transcript editor in the conversation, you drag over the words, and the export stays tied to the real audio.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            :href="signupUrl"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff9a8f] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-white active:scale-98 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9a8f] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span>Start signup - $99/mo</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="#demo"
            class="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 px-5 py-2.5 font-mono text-xs font-bold text-zinc-300 transition duration-200 hover:border-zinc-600 hover:text-white min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Try the editor below
          </a>
        </div>

        <p class="text-xs text-zinc-600 font-mono mt-5">Free to try here. Checkout unlocks your own uploads, renders, and publishing.</p>
      </div>

      <!-- 2 · THE EDITOR (the proof) -->
      <section id="demo" class="mb-24 relative">
        <div class="absolute inset-0 bg-[#ff9a8f]/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />

        <div class="text-center max-w-2xl mx-auto mb-8 relative">
          <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">This is the editor that opens in the chat.</h2>
          <p class="text-zinc-400 text-sm mt-2 font-sans">Drag across words. The cut follows the audio.</p>
        </div>

        <div class="glass-panel-accented glass-reflection rounded-3xl overflow-hidden corner-ticks relative min-h-[400px]">

          <!-- Window header -->
          <div class="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 relative z-10">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#ff9a8f]/60"></span>
              <span class="w-3 h-3 rounded-full bg-amber-400/60"></span>
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
            <p class="font-mono text-[8px] text-[#ff9a8f] uppercase tracking-widest mb-3">Live editor</p>
            <h4 class="font-display text-lg font-bold text-white mb-2">Same editor. Same chat surface.</h4>
            <p class="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
              This is the editor ChatGPT and Claude open for review. Drag across the words to cut a clip. Tap to load it.
            </p>
            <button
              @click="activateDemo"
              class="px-5 py-2.5 font-mono text-xs font-bold bg-[#ff9a8f] text-zinc-950 rounded-xl shadow-lg shadow-[#ff9a8f]/10 hover:bg-white hover:scale-102 active:scale-98 transition duration-200 cursor-pointer min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9a8f] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Load the editor
            </button>
          </div>

          <!-- Skeleton loader -->
          <div v-if="demoActivated && isIframeLoading" class="absolute inset-0 bg-[#060608]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none transition-opacity duration-300">
            <div class="flex flex-col items-center gap-4 text-center p-6">
              <div class="relative w-8 h-8">
                <div class="absolute inset-0 rounded-full border-2 border-[#ff9a8f]/20"></div>
                <div class="absolute inset-0 rounded-full border-2 border-t-[#ff9a8f] animate-spin"></div>
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
          <a :href="signupUrl" class="inline-flex items-center gap-1.5 font-sans text-sm text-zinc-400 hover:text-[#ff9a8f] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9a8f] rounded">
            Upload your own recordings with the Launch plan.
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </section>

      <!-- 3 · CLOSE -->
      <section id="join" class="relative max-w-4xl mx-auto">
        <div class="absolute inset-0 bg-gradient-to-r from-[#ff9a8f]/10 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />

        <div class="cta-glass-panel glass-reflection p-7 sm:p-9 rounded-2xl relative overflow-hidden corner-ticks">
          <div class="absolute inset-0 -z-10 cta-backdrop-mask opacity-[0.2] pointer-events-none" />

          <div class="max-w-2xl mx-auto text-center mb-7">
            <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Ready to clip your own recordings?
            </h2>
            <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
              The demo above is free to try. Signup starts checkout, then your workspace can upload recordings, render clips, and publish after approval.
            </p>
          </div>

          <div class="max-w-2xl mx-auto">
            <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div class="flex-1 text-left">
                <p class="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Launch plan</p>
                <p class="font-display text-2xl font-bold text-white">$99/month</p>
                <p class="text-zinc-500 text-xs mt-2 leading-relaxed">100 clip exports a month, the transcript editor, the ChatGPT + Claude connector, and YouTube publishing.</p>
              </div>
              <a
                :href="signupUrl"
                class="bg-[#ff9a8f] text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition duration-200 hover:bg-white active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9a8f] focus-visible:ring-offset-2 focus-visible:ring-offset-black font-mono text-xs"
              >
                <span>Start signup</span>
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
