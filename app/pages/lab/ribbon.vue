<script setup lang="ts">
/**
 * Throwaway prototype route for the film-ribbon hero concept. Deliberately NOT
 * wired into the real homepage, the nav, the sitemap, or llms.txt — this exists
 * so the idea can be judged in motion before anything is committed to.
 *
 * The ribbon is full-bleed on purpose: it is not an illustration sitting in a
 * card, it is the surface the headline is written on top of.
 */
useHead({
  title: 'Film ribbon — prototype',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <main>
    <!-- Full-bleed stage. The strip runs off both edges; the headline lives in
         the space the sweep leaves at the top left. -->
    <section class="relative w-full h-[min(92vh,860px)] min-h-[520px] overflow-hidden">
      <div class="absolute inset-0">
        <FilmRibbon />
      </div>

      <div class="relative h-full mx-auto max-w-6xl px-6 sm:px-8 pt-14 sm:pt-20 pointer-events-none">
        <p class="telemetry-label mb-5">Prototype · not linked</p>
        <h1
          class="font-display text-[2.7rem] leading-[0.98] sm:text-6xl lg:text-7xl font-bold tracking-[-0.04em] text-white max-w-[15ch]"
        >
          You record it.
          <span class="block text-[#f28f84]">BitterClip cuts it.</span>
        </h1>
        <p class="mt-6 max-w-[34ch] text-zinc-300/90 text-base sm:text-lg leading-relaxed">
          One take, running past. The strip shows its own audio down the edge — and
          where that flatlines, the frames come out and the film closes over the hole.
        </p>
      </div>
    </section>

    <div class="mx-auto max-w-6xl px-6 sm:px-8 pb-24">
      <dl class="grid gap-8 sm:grid-cols-3 text-sm border-t border-white/[0.08] pt-10">
        <div>
          <dt class="font-semibold text-white mb-1.5">It is one take, not a montage</dt>
          <dd class="text-zinc-400 leading-relaxed">
            38 consecutive frames at 6&nbsp;fps from the park session,
            00:01:57.00&nbsp;→&nbsp;00:02:03.16. Adjacent cells are nearly identical, which is
            the only reason a strip reads as time rather than as a carousel.
          </dd>
        </div>
        <div>
          <dt class="font-semibold text-white mb-1.5">The cut has a measured reason</dt>
          <dd class="text-zinc-400 leading-relaxed">
            The waveform down the film edge is that take's own audio. The removed run is
            the 1.323&nbsp;s that sits below −30&nbsp;dB — you can see it flatten before
            anything is taken out. Nothing is quoted and nothing is attributed.
          </dd>
        </div>
        <div>
          <dt class="font-semibold text-white mb-1.5">It costs nothing until it is seen</dt>
          <dd class="text-zinc-400 leading-relaxed">
            three.js loads on demand and stays out of the site bundle. The strip is painted
            once and scrolled on the GPU; nothing repaints. Off screen it stops, and under
            reduced motion it is a single still frame.
          </dd>
        </div>
      </dl>
    </div>
  </main>
</template>
