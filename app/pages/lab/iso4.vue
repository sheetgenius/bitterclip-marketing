<script setup lang="ts">
/**
 * Real-3D successor to the /lab/iso canvas study (owner pivot, 2026-08-18).
 * Deliberately NOT wired into the homepage, the nav, the sitemap or llms.txt.
 *
 * ONE full-bleed canvas at every size — a canvas band always shows a seam
 * against CSS color (tone mapping owns the void), so mobile overlays the
 * same stage as desktop: text anchored top, spec bullets anchored bottom,
 * and the portrait camera fit frames the machine into the space between
 * (owner, 2026-08-19: machine between the CTA and the bullets, seamless).
 */
import { buildSignupUrl } from '~/utils/signup-attribution'

// Still a lab route: real title, but noindex stays until this replaces the
// homepage hero (flip robots + add OG/meta at promotion time).
useHead({
  title: 'BitterClip — Footage in, Episodes out',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const signupUrl = computed(() => buildSignupUrl({
  query: route.query,
  surface: 'lab_iso4',
  landingPath: route.path,
}))
</script>

<template>
  <main class="iso4-shell relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#08090a]">
    <div class="iso4-stage relative h-[100svh] min-h-[640px] w-full">
      <div class="absolute inset-0">
        <HeroIso4 />
      </div>
      <!-- Placeholder only. On desktop the machine is fitted to the right of
           the stage so this column stays clear; type here is how the
           composition gets judged. -->
      <div class="iso4-copy relative mx-auto flex h-full max-w-6xl flex-col px-6 pt-8 sm:px-8">
        <!-- the machine's warmth pooling under the words: type and stage share light -->
        <div class="pointer-events-none absolute left-0 top-1/2 hidden h-[26rem] w-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(242,143,132,0.10),transparent_70%)] blur-2xl md:block" aria-hidden="true" />
        <!-- Once the charged strip reaches the upper run, real face cells pass
             behind the proposition. This soft copy-zone attenuation keeps the
             giant machine present without allowing footage contrast to fight
             the words; it fades before the transformation stage begins. -->
        <div class="mobile-copy-shroud pointer-events-none absolute" aria-hidden="true" />
        <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Agentic video editing</p>
        <h1 class="font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in<br><span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">Episodes out</span>
        </h1>
        <p class="mt-5 max-w-[36ch] text-base leading-relaxed text-zinc-400">
          Deep video intelligence — a second brain built from your footage. BitterClip remembers every session, preps your next one, and cuts what's worth sending: progress reels for your clients, episodes for your channels.
        </p>
        <div class="mt-7 flex items-center gap-5">
          <a
            :href="signupUrl"
            class="inline-flex w-fit items-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.45)]"
          >Start free <span aria-hidden="true">→</span></a>
          <a href="/#demo" class="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 hover:text-zinc-200">Watch it work <span aria-hidden="true">▶</span></a>
        </div>
        <!-- mobile: the machine (full-bleed behind) owns this gap -->
        <p class="mt-auto max-w-[40ch] pb-4 font-mono text-[0.66rem] leading-loose uppercase tracking-[0.18em] text-zinc-600 md:mt-6 md:pb-0 md:leading-relaxed">
          <span class="block whitespace-nowrap md:inline">knows who's talking</span><span class="hidden md:inline"> · </span>
          <span class="block whitespace-nowrap md:inline">finds any moment</span><span class="hidden md:inline"> · </span>
          <span class="block whitespace-nowrap md:inline">cuts you'd ship</span>
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.iso4-shell,
.iso4-stage {
  background: #08090a;
}

.mobile-copy-shroud {
  display: block;
  z-index: 0;
  left: -1.5rem;
  right: -1.5rem;
  top: -3.5rem;
  height: 30rem;
  background: linear-gradient(
    180deg,
    rgba(8, 9, 10, 0.995) 0%,
    rgba(8, 9, 10, 0.99) 64%,
    rgba(8, 9, 10, 0.975) 70%,
    rgba(8, 9, 10, 0.92) 76%,
    rgba(8, 9, 10, 0.78) 82%,
    rgba(8, 9, 10, 0.56) 88%,
    rgba(8, 9, 10, 0.3) 94%,
    rgba(8, 9, 10, 0.12) 97%,
    rgba(8, 9, 10, 0) 100%
  );
}

.mobile-copy-shroud ~ * {
  position: relative;
  z-index: 1;
}

@media (min-width: 48rem) {
  .iso4-stage {
    height: calc(100svh - 3.375rem);
    min-height: 35rem;
  }

  .iso4-copy {
    justify-content: flex-start;
    padding-top: clamp(7rem, 18vh, 14rem);
  }

  .mobile-copy-shroud {
    display: none !important;
  }
}
</style>
