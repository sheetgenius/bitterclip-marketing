<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'

// Default marketing chrome — the rounded glass nav pill + the full footer.
// This is the homepage / legal-page shell. Docs use layouts/docs.vue instead.
const route = useRoute()
const signupBaseUrl = SIGNUP_BASE_URL
const signupStage = ref('default')

// Full-bleed 100svh heroes (homepage + the iso4 workshop mirror) need the
// site bar pinned over the canvas. Occupying flow on those pages paints a
// body-colored band above the stage, which is what made / look unlike /docs.
const overlayNav = computed(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  return path === '/' || path === '/lab/iso4'
})

const signupUrl = computed(() => {
  return buildSignupUrl({
    baseUrl: signupBaseUrl,
    query: route.query,
    surface: 'footer',
    stage: signupStage.value,
    landingPath: route.path,
  })
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
  <!-- No background colour here on purpose. This wrapper covers every page, so
       painting it opaque (it was #303030) hides the body's #0d0d0d field and its
       vignette entirely. The page background has one owner: body, in main.css. -->
  <div class="relative min-h-screen selection:bg-[#f28f84]/25 text-zinc-100 flex flex-col justify-between">

    <!-- The coordinate-grid and scrolling-line backdrops that used to sit here
         read as engineering telemetry. Cinema texture is the body's vignette
         plus film grain, both in main.css. -->

    <!-- Two large warm glow blobs used to sit here (one of them pulsing). They
         were invisible against the old #303030 wrapper, but on a near-black
         field a 5%-opacity 600px blur reads as a blotchy halo and bands into
         rings on 8-bit displays. Atmosphere now comes from the body vignette
         and film grain, which don't blotch. -->

    <!-- Global Header — the same bar the docs shell mounts. Overlay on the
         full-bleed heroes so the pill floats over the canvas instead of
         sitting in a band above it. -->
    <SiteHeader :overlay="overlayNav" />

    <!-- Page Content Viewport. Overflow clip lives here, not on the wrapper
         above, so the homepage's position:fixed site bar is not clipped
         away on scroll. -->
    <div class="grow w-full overflow-x-hidden">
      <slot />
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
              Footage in, episode out. A recorded session becomes the finished episode, and the short cuts from that same edit.
            </p>
            <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded font-mono text-[#f28f84]/90 hover:text-[#f28f84] transition" href="mailto:hello@bitterclip.com?subject=BitterClip">hello@bitterclip.com</a>
          </div>

          <!-- Link columns -->
          <nav aria-label="Footer" class="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:gap-x-16">
            <div class="flex flex-col gap-3">
              <h2 class="font-mono uppercase text-[10px] tracking-[0.2em] text-zinc-500">Product</h2>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/docs">Docs</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/blog">Blog</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/docs/assistants/overview">Assistants</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/compare">Compare tools</NuxtLink>
              <NuxtLink class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" to="/#pricing">Pricing</NuxtLink>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" href="https://company.sheetgenius.com/bitterclip/support/">Support</a>
              <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-100 transition" :href="signupUrl">Start Creator trial</a>
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
        <!-- One parent, named once. "A Bitter project." used to sit opposite this
             line, which left the reader to work out how Bitter and SheetGenius
             relate; Bitter is infrastructure and keeps its Developers-column link. -->
        <div class="mt-12 pt-6 border-t border-zinc-900/80 text-[11px] text-zinc-600 text-center sm:text-left">
          <p class="font-sans">BitterClip is a product of <a class="focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none rounded hover:text-zinc-300 transition" href="https://company.sheetgenius.com">SheetGenius, Inc.</a> <span aria-hidden="true" class="text-zinc-700">·</span> © 2026</p>
        </div>
      </div>
    </footer>

  </div>
</template>
