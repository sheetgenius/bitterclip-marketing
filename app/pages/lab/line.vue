<script setup lang="ts">
/**
 * Assembly-line hero prototype. Deliberately NOT wired into the real homepage,
 * the nav, the sitemap, or llms.txt.
 *
 * `?dir=rtl` flips the flow, and `?t=<ms>` freezes a deterministic frame, which
 * is what the screenshot loop uses so captures are exact rather than timing
 * dependent.
 */
const route = useRoute()
const direction = computed(() => (route.query.dir === 'rtl' ? 'rtl' : 'ltr'))
const fixedTimeMs = computed(() => (route.query.t ? Number(route.query.t) : null))

useHead({
  title: 'Assembly line — prototype',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <main class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-16">
    <div class="h-[62vh] min-h-[420px] w-full">
      <HeroLine :direction="direction" :fixed-time-ms="fixedTimeMs" />
    </div>

    <div class="mt-4 flex flex-col items-center gap-7 px-6">
      <h1 class="font-display text-center text-4xl font-bold uppercase tracking-[-0.02em] text-white sm:text-6xl">
        Let BitterClip Ship
      </h1>
      <a
        href="https://app.bitterclip.com/sign_up"
        class="inline-flex items-center gap-2 rounded-full border border-[#f28f84]/60 px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#ffd0c7] transition hover:border-[#f28f84] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        Get started
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </main>
</template>
