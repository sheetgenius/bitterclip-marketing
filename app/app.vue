<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Global application setup
const signupBaseUrl = 'https://app.bitterclip.com/sign_up'
const signupStage = ref('default')

const signupUrl = computed(() => {
  const url = new URL(signupBaseUrl)
  url.searchParams.set('utm_source', 'bitterclip.com')
  url.searchParams.set('utm_medium', 'landing_page')
  url.searchParams.set('utm_campaign', 'homepage_editor_demo')
  url.searchParams.set('utm_content', signupStage.value)
  url.searchParams.set('from', `landing_${signupStage.value}`)
  return url.toString()
})

const updateSignupStage = (event: Event) => {
  const stage = (event as CustomEvent<{ stage?: unknown }>).detail?.stage
  if (typeof stage === 'string' && /^[a-z0-9_]+$/.test(stage)) {
    signupStage.value = stage
  }
}

onMounted(() => {
  window.addEventListener('bitterclip:signup-stage', updateSignupStage)
})

onBeforeUnmount(() => {
  window.removeEventListener('bitterclip:signup-stage', updateSignupStage)
})
</script>

<template>
  <div class="relative min-h-screen bg-[#303030] selection:bg-[#f28f84]/25 text-zinc-100 overflow-hidden bg-grid-pattern flex flex-col justify-between">
    
    <!-- Cinematic Data Flow Backdrops -->
    <div class="absolute inset-0 -z-20 bg-grid-pattern-dense opacity-[0.10] pointer-events-none" />
    <div class="absolute inset-0 -z-20 animate-flow-horizon opacity-[0.12] pointer-events-none" />
    
    <!-- Top Decorative Glow Dots -->
    <div class="absolute top-[-10%] left-[20%] -z-10 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#f28f84]/5 via-[#f8b36a]/5 to-[#d66f5f]/5 blur-[120px] animate-pulse-slow pointer-events-none" />
    <div class="absolute top-[20%] right-[-10%] -z-10 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-[#d66f5f]/5 via-[#f28f84]/5 to-[#f28f84]/5 blur-[100px] pointer-events-none" />
    
    <!-- Global Header -->
    <header class="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4">
      <nav aria-label="Primary" class="flex items-center justify-between px-5 py-2.5 rounded-full nav-glass">
        <div class="m-0 p-0 font-display font-bold text-lg tracking-tight">
          <NuxtLink class="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded-lg" to="/">
            <!-- Telemetry Crop Indicator Logo SVG -->
            <svg class="w-6 h-6 text-[#f28f84] transition duration-300 group-hover:drop-shadow-[0_0_8px_rgba(242,143,132,0.55)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span class="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-zinc-100 transition duration-300 font-mono tracking-tight text-base uppercase">
              BitterClip
            </span>
            <span class="px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-[#f28f84]/10 text-[#f28f84] border border-[#f28f84]/20">Beta</span>
          </NuxtLink>
        </div>

        <div class="hidden md:flex items-center gap-1 font-sans text-sm font-medium tracking-tight text-zinc-300">
          <NuxtLink class="px-3 py-1.5 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none" to="/#demo">Demo</NuxtLink>
          <NuxtLink class="px-3 py-1.5 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none" to="/mcp">In ChatGPT</NuxtLink>
          <NuxtLink class="px-3 py-1.5 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none" to="/docs">How it works</NuxtLink>
          <NuxtLink class="px-3 py-1.5 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none" to="/#pricing">Pricing</NuxtLink>
        </div>

        <div class="flex items-center gap-4">
          <a
            class="focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:outline-none px-4 py-1.5 rounded-full text-xs font-bold bg-[#f28f84] text-zinc-950 hover:bg-[#ffa89e] active:scale-[0.97] transition duration-200 shadow-lg shadow-[#f28f84]/20 hover:shadow-[#f28f84]/40"
            :href="signupUrl"
          >
            Start free
          </a>
        </div>
      </nav>
    </header>

    <!-- Page Content Viewport -->
    <div class="grow w-full">
      <NuxtPage />
    </div>

    <!-- Sleek Footer -->
    <footer class="border-t border-zinc-900 bg-zinc-950/60 backdrop-blur-md pt-14 pb-10 text-xs text-zinc-400 relative z-10 w-full mt-24">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex flex-col gap-12 lg:flex-row lg:justify-between">

          <!-- Brand block -->
          <div class="flex flex-col items-start gap-4 lg:max-w-xs">
            <div class="flex items-center gap-2.5">
              <!-- Small Telemetry Crop Indicator SVG -->
              <svg class="w-5 h-5 text-[#f28f84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span class="font-mono tracking-wider text-zinc-200 uppercase text-sm">BitterClip</span>
            </div>
            <p class="font-sans text-zinc-500 leading-relaxed max-w-[16rem]">
              Turn long podcasts, interviews, and founder calls into short clips — right inside ChatGPT.
            </p>
            <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded font-mono text-[#f28f84]/90 hover:text-[#f28f84] transition" href="mailto:hello@bitterclip.com?subject=BitterClip%20early%20access">hello@bitterclip.com</a>
          </div>

          <!-- Link columns -->
          <nav aria-label="Footer" class="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:gap-x-16">
            <div class="flex flex-col gap-3">
              <h2 class="font-mono uppercase text-[10px] tracking-[0.2em] text-zinc-500">Product</h2>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/docs">How it works</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/mcp">In ChatGPT</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/#pricing">Pricing</NuxtLink>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" :href="signupUrl">Start clipping</a>
            </div>
            <div class="flex flex-col gap-3">
              <h2 class="font-mono uppercase text-[10px] tracking-[0.2em] text-zinc-500">Legal</h2>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/privacy">Privacy</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/terms">Terms</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/data-deletion">Data deletion</NuxtLink>
            </div>
            <div class="flex flex-col gap-3">
              <h2 class="font-mono uppercase text-[10px] tracking-[0.2em] text-zinc-500">Developers</h2>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" href="/llms.txt">llms.txt</a>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" href="/llms-full.txt">Markdown</a>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" href="https://github.com/sheetgenius/bitterclip-marketing">GitHub</a>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" href="https://bitter.sh/">BitterSH</a>
            </div>
          </nav>
        </div>

        <!-- Bottom bar -->
        <div class="mt-12 pt-6 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-600">
          <span class="font-sans">© 2026 BitterClip Inc. All rights reserved.</span>
          <span class="font-mono tracking-wide">A Bitter project.</span>
        </div>
      </div>
    </footer>

  </div>

</template>
