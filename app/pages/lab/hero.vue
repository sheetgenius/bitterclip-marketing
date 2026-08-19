<script setup lang="ts">
/**
 * Flat hero prototype — no WebGL, no 3D. Deliberately NOT wired into the real
 * homepage, the nav, the sitemap, or llms.txt.
 *
 * The illustration carries the argument, so the page holds one line and one
 * action, squared together beneath it.
 */
useHead({
  title: 'Hero flow — prototype',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <main class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-20">
    <div class="mx-auto w-full max-w-[1500px] px-4 pt-6">
      <HeroFlow />
    </div>

    <div class="mt-2 flex flex-col items-center gap-7 px-6">
      <h1 class="font-display text-center text-4xl font-bold uppercase tracking-[-0.02em] text-white sm:text-6xl">
        Let BitterClip Ship
      </h1>

      <a
        href="https://app.bitterclip.com/sign_up"
        class="inline-flex items-center gap-2 rounded-full border border-[#f28f84]/60 bg-transparent px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#ffd0c7] transition hover:border-[#f28f84] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        Get started
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </main>
</template>
