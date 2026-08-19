<script setup lang="ts">
/**
 * Real-3D successor to the /lab/iso canvas study (owner pivot, 2026-08-18).
 * Deliberately NOT wired into the homepage, the nav, the sitemap or llms.txt.
 * The canvas study stays up as the reference until this reaches parity.
 *
 * Two layouts, one canvas: on desktop the machine shares the stage with the
 * type (absolute, behind); on mobile the flow is headline -> CTA -> the
 * machine as its own band -> the three spec bullets (owner, 2026-08-19).
 * A single HeroIso3 instance moves between the slots via a media query so
 * only one WebGL context ever runs.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

useHead({
  title: 'Assembly line, real 3D — workshop',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const isMobile = ref(false)
let mq: MediaQueryList | null = null
const onMq = () => {
  isMobile.value = !!mq?.matches
}
onMounted(() => {
  mq = window.matchMedia('(max-width: 767px)')
  onMq()
  mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
</script>

<template>
  <main class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#08090a] pb-16">
    <div class="relative w-full md:h-[86vh] md:min-h-[560px]">
      <div v-if="!isMobile" class="absolute inset-0">
        <HeroIso3 />
      </div>
      <!-- Placeholder only. On desktop the machine is fitted to the right of
           the stage so this column stays clear; type here is how the
           composition gets judged. -->
      <div class="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6 pt-10 sm:px-8 md:pt-0 md:-translate-y-[3.5vh]">
        <!-- the machine's warmth pooling under the words: type and stage share light -->
        <div class="pointer-events-none absolute left-0 top-1/2 hidden h-[26rem] w-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(242,143,132,0.10),transparent_70%)] blur-2xl md:block" aria-hidden="true" />
        <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Agentic video editing</p>
        <h1 class="font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in<br><span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">Episodes out</span>
        </h1>
        <p class="mt-5 max-w-[36ch] text-base leading-relaxed text-zinc-400">
          BitterClip watches your footage, remembers every frame, and cuts it clean — episodes for your channels, reels for your clients, answers from every session.
        </p>
        <div class="mt-8 flex items-center gap-5">
          <a
            href="#"
            class="inline-flex w-fit items-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.45)]"
          >Start free <span aria-hidden="true">→</span></a>
          <a href="#" class="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 hover:text-zinc-200">Watch it work <span aria-hidden="true">▶</span></a>
        </div>
        <!-- mobile: the machine runs BETWEEN the CTA and the spec bullets -->
        <div v-if="isMobile" class="relative -mx-6 mt-8 h-[52vh] min-h-[360px]">
          <HeroIso3 />
          <!-- bridge the band's edges into the page ground: seamless stage -->
          <div class="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#08090a] to-transparent" aria-hidden="true" />
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#08090a] to-transparent" aria-hidden="true" />
        </div>
        <p class="mt-6 max-w-[40ch] font-mono text-[0.66rem] leading-loose uppercase tracking-[0.18em] text-zinc-600 md:leading-relaxed">
          <span class="block whitespace-nowrap md:inline">knows who's talking</span><span class="hidden md:inline"> · </span>
          <span class="block whitespace-nowrap md:inline">finds any moment</span><span class="hidden md:inline"> · </span>
          <span class="block whitespace-nowrap md:inline">cuts you'd ship</span>
        </p>
      </div>
    </div>
  </main>
</template>
