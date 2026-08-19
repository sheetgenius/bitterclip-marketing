<script setup lang="ts">
/**
 * Isometric massing study. Deliberately NOT wired into the homepage, the nav,
 * the sitemap or llms.txt. The perspective (/lab/line) and three.js
 * (/lab/ribbon) studies it beat were retired 2026-08-18; this is the keeper.
 */
useHead({
  title: 'Assembly line, isometric — workshop',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <main class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-16">
    <p class="telemetry-label px-6 pt-6">Workshop study · geometry, story, light</p>
    <div class="relative h-[78vh] min-h-[520px] w-full">
      <div class="absolute inset-0">
        <HeroIso />
      </div>
      <!-- Placeholder only. The machine is fitted to the right of the stage so
           this column stays clear; type here is how the composition gets judged. -->
      <div class="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6 sm:px-8">
        <!-- The whole argument in four words (owner, 2026-08-18 — replaced
             "You still gotta record" + subline). The picture and the line now
             say the same thing, so there is no subline to carry. -->
        <h1 class="font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in, <span class="text-[#f28f84]">episodes out</span>
        </h1>
        <a
          href="#"
          class="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-[#f28f84]/60 px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#ffd0c7]"
        >Get started <span aria-hidden="true">→</span></a>

        <!-- The beacon: the one thing still being asked of you, sitting where
             the files come from. It is the source the machine is fed by. -->
        <p class="mt-9 flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-zinc-500">
          <span class="beacon" aria-hidden="true" />
          Recording
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* A hard dot that blinks. No glow — this site does not have any. */
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
