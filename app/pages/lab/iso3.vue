<script setup lang="ts">
/**
 * Real-3D successor to the /lab/iso canvas study (owner pivot, 2026-08-18).
 * Deliberately NOT wired into the homepage, the nav, the sitemap or llms.txt.
 * The canvas study stays up as the reference until this reaches parity.
 */
useHead({
  title: 'Assembly line, real 3D — workshop',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <main class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-16">
    <div class="relative h-[86vh] min-h-[560px] w-full">
      <div class="absolute inset-0">
        <HeroIso3 />
      </div>
      <!-- Placeholder only. The machine is fitted to the right of the stage so
           this column stays clear; type here is how the composition gets judged. -->
      <div class="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6 sm:px-8">
        <!-- the machine's warmth pooling under the words: type and stage share light -->
        <div class="pointer-events-none absolute left-0 top-1/2 h-[26rem] w-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(242,143,132,0.10),transparent_70%)] blur-2xl" aria-hidden="true" />
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
        <p class="mt-6 max-w-[40ch] font-mono text-[0.66rem] leading-relaxed uppercase tracking-[0.18em] text-zinc-600">
          <span class="whitespace-nowrap">knows who's talking</span> · <span class="whitespace-nowrap">finds any moment</span> · <span class="whitespace-nowrap">cuts you'd ship</span>
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* A hard dot that blinks. No glow on UI chrome — the stage does the glowing. */
.beacon {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #f28f84;
  animation: beacon 1.9s steps(1, end) infinite;
}
@keyframes beacon {
  0%, 55% { opacity: 1; }
  56%, 100% { opacity: 0.18; }
}
@media (prefers-reduced-motion: reduce) {
  .beacon { animation: none; }
}
</style>
