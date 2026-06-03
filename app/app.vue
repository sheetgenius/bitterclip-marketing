<script setup lang="ts">
// Global application setup
const signupUrl = 'https://app.bitterclip.com/sign_up'
</script>

<template>
  <div class="relative min-h-screen bg-[#060608] selection:bg-[#ff9a8f]/30 text-zinc-100 overflow-hidden bg-grid-pattern flex flex-col justify-between">
    
    <!-- Cinematic Data Flow Backdrops -->
    <div class="absolute inset-0 -z-20 bg-grid-pattern-dense opacity-[0.8] pointer-events-none" />
    <div class="absolute inset-0 -z-20 animate-flow-horizon opacity-[0.6] pointer-events-none" />
    
    <!-- Top Decorative Glow Dots -->
    <div class="absolute top-[-10%] left-[20%] -z-10 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-rose-500/5 via-[#ff9a8f]/5 to-amber-500/3 blur-[120px] animate-pulse-slow pointer-events-none" />
    <div class="absolute top-[20%] right-[-10%] -z-10 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-indigo-500/3 via-violet-500/5 to-[#ff9a8f]/3 blur-[100px] pointer-events-none" />
    
    <!-- Global Header -->
    <header class="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4">
      <nav class="flex items-center justify-between px-6 py-3 rounded-full glass-panel-accented glass-reflection shadow-2xl">
        <h1 class="m-0 p-0 font-display font-bold text-lg tracking-tight">
          <NuxtLink class="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#ff9a8f] focus-visible:outline-none rounded-lg" to="/">
            <!-- Telemetry Crop Indicator Logo SVG -->
            <svg class="w-6 h-6 text-[#ff9a8f] transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span class="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-zinc-100 transition duration-300 font-mono tracking-tight text-base uppercase">
              BitterClip
            </span>
            <span class="px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-zinc-900 text-[#ff9a8f] border border-zinc-800/80">Beta</span>
          </NuxtLink>
        </h1>
        
        <div class="hidden md:flex items-center gap-8 font-sans text-xs uppercase tracking-wider text-zinc-400">
          <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#ff9a8f] focus-visible:outline-none rounded hover:text-zinc-100 transition duration-200" to="/#demo">Demo</NuxtLink>
          <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#ff9a8f] focus-visible:outline-none rounded hover:text-zinc-100 transition duration-200" to="/mcp">MCP</NuxtLink>
          <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#ff9a8f] focus-visible:outline-none rounded hover:text-zinc-100 transition duration-200" to="/docs">How it works</NuxtLink>
        </div>
        
        <div class="flex items-center gap-4">
          <a 
            class="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[#ff9a8f] focus-visible:ring-2 focus-visible:ring-[#ff9a8f] focus-visible:outline-none rounded-lg transition"
            :href="signupUrl"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            $99/mo launch
          </a>
          <a
            class="focus-visible:ring-2 focus-visible:ring-[#ff9a8f] focus-visible:outline-none px-4 py-1.5 rounded-full text-xs font-bold bg-[#ff9a8f] text-zinc-950 hover:bg-white hover:scale-102 active:scale-98 transition duration-200 shadow-md shadow-[#ff9a8f]/10 btn-glow"
            :href="signupUrl"
          >
            Start signup
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
          <svg class="w-4 h-4 text-[#ff9a8f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span class="font-mono tracking-wider text-zinc-400 uppercase text-xs">BitterClip</span>
          <span class="text-zinc-700">|</span>
          <span class="font-sans">© 2026 BitterClip Inc. All rights reserved.</span>
        </div>
        <div class="flex items-center gap-6 font-mono text-[10px]">
          <a class="focus-visible:ring-1 focus-visible:ring-[#ff9a8f] focus-visible:outline-none hover:text-zinc-300 transition" href="mailto:hello@bitterclip.com?subject=BitterClip%20early%20access">Contact</a>
          <span class="text-zinc-800">•</span>
          <a class="hover:text-zinc-300 transition" :href="signupUrl">Start signup</a>
          <span class="text-zinc-800">•</span>
          <NuxtLink class="hover:text-zinc-300 transition" to="/mcp">MCP</NuxtLink>
          <span class="text-zinc-800">•</span>
          <NuxtLink class="hover:text-zinc-300 transition" to="/docs">How it works</NuxtLink>
        </div>
      </div>
    </footer>

  </div>

</template>
