<script setup lang="ts">
// Global application setup
const signupUrl = 'https://app.bitterclip.com/sign_up'
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
      <nav class="flex items-center justify-between px-6 py-3 rounded-full glass-panel-accented glass-reflection">
        <div class="m-0 p-0 font-display font-bold text-lg tracking-tight">
          <NuxtLink class="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded-lg" to="/">
            <!-- Telemetry Crop Indicator Logo SVG -->
            <svg class="w-6 h-6 text-[#f28f84] transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span class="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-zinc-100 transition duration-300 font-mono tracking-tight text-base uppercase">
              BitterClip
            </span>
            <span class="px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-[#f28f84]/10 text-[#f28f84] border border-[#f28f84]/20">Beta</span>
          </NuxtLink>
        </div>
        
        <div class="hidden md:flex items-center gap-7 font-sans text-sm font-medium tracking-tight text-zinc-300">
          <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition duration-200" to="/#demo">Demo</NuxtLink>
          <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition duration-200" to="/mcp">In ChatGPT</NuxtLink>
          <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition duration-200" to="/docs">How it works</NuxtLink>
        </div>
        
        <div class="flex items-center gap-4">
          <a
            class="focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:outline-none px-4 py-1.5 rounded-full text-xs font-bold bg-[#f28f84] text-zinc-950 hover:bg-[#ffa89e] hover:scale-102 active:scale-98 transition duration-200 shadow-md shadow-[#f28f84]/10 btn-glow"
            :href="signupUrl"
          >
            Start with one
          </a>
        </div>
      </nav>
    </header>

    <!-- Page Content Viewport -->
    <div class="grow w-full">
      <NuxtPage />
    </div>

    <!-- Sleek Footer -->
    <footer class="border-t border-zinc-900 bg-zinc-950/60 backdrop-blur-md py-12 text-center text-xs text-zinc-500 relative z-10 w-full mt-24">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2.5">
          <!-- Small Telemetry Crop Indicator SVG -->
          <svg class="w-4 h-4 text-[#f28f84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span class="font-mono tracking-wider text-zinc-400 uppercase text-xs">BitterClip</span>
          <span class="text-zinc-700">|</span>
          <span class="font-sans">© 2026 BitterClip Inc. All rights reserved.</span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px]">
          <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none hover:text-zinc-300 transition" href="mailto:hello@bitterclip.com?subject=BitterClip%20early%20access">Contact</a>
          <span class="text-zinc-800">•</span>
          <NuxtLink class="hover:text-zinc-300 transition" to="/privacy">Privacy</NuxtLink>
          <span class="text-zinc-800">•</span>
          <NuxtLink class="hover:text-zinc-300 transition" to="/terms">Terms</NuxtLink>
          <span class="text-zinc-800">•</span>
          <a class="hover:text-zinc-300 transition" :href="signupUrl">Clip your first recording</a>
          <span class="text-zinc-800">•</span>
          <NuxtLink class="hover:text-zinc-300 transition" to="/mcp">MCP</NuxtLink>
          <span class="text-zinc-800">•</span>
          <NuxtLink class="hover:text-zinc-300 transition" to="/docs">How it works</NuxtLink>
          <span class="text-zinc-800">•</span>
          <a class="hover:text-zinc-300 transition" href="/llms.txt">llms.txt</a>
          <span class="text-zinc-800">•</span>
          <a class="hover:text-zinc-300 transition" href="/llms-full.txt">Markdown</a>
          <span class="text-zinc-800">•</span>
          <a class="hover:text-zinc-300 transition" href="https://github.com/sheetgenius/bitterclip-marketing">GitHub</a>
          <span class="text-zinc-800">•</span>
          <a class="hover:text-zinc-300 transition" href="https://bitter.sh/">BitterSH</a>
        </div>
      </div>
    </footer>

  </div>

</template>
