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
      <!-- ease the canvas→CSS handoff at the stage foot: tone mapping never
           color-matches page black exactly (nit-ledger), so fade the last
           stretch of canvas into the page ground -->
      <div class="stage-foot-fade pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true" />
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
        <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Agentic video editing</p>
        <h1 class="font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in<br><span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">Episodes out</span>
        </h1>
        <p class="mt-5 max-w-[36ch] text-base leading-relaxed text-zinc-400">
          <span class="font-semibold text-zinc-100">Deep Video Intelligence</span> — it watches everything, remembers every session, and edits with classical craft.
        </p>
        <div class="mt-7 flex items-center gap-5">
          <a
            :href="signupUrl"
            class="inline-flex w-fit items-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.45)]"
          >Start free <span aria-hidden="true">→</span></a>
          <a href="/#demo" class="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 hover:text-zinc-200">Watch it work <span aria-hidden="true">▶</span></a>
        </div>
        <!-- deliverables strip: outputs, not features (owner draft 2026-08-20).
             Closes the copy column directly under the CTAs — both outside eyes
             ruled a bottom-anchored credits line "never finds a home" (30%+
             stranding void on desktop, leftover pocket on mobile). One labeled
             line on desktop; a tight three-line labeled readout on mobile. The
             machine owns everything below. -->
        <!-- No deliverables list: it failed in every placement (owner call,
             2026-08-20 — "does this really make sense?"). The CTAs close the
             column; the machine's constellation IS the output list; deep
             video Q&A lives below in the agent transcript, demonstrated. -->
      </div>
    </div>

    <!-- ============== BELOW THE FOLD · 1: AGENT-NATIVE SUBSTRATE ==============
         Owner directive 2026-08-20: explain how BitterClip makes video
         tractable for agents, and introduce the editor with a REAL screenshot
         (captured from the live clip-demo embed) framed as the surface you
         typically DON'T use — that's the point of the substrate. -->
    <section class="btf relative mx-auto max-w-6xl px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">How it works</p>
      <h2 class="font-display max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Turns video into agent-native substrate</h2>
      <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
        Raw video is opaque to software — a wall of pixels and a waveform. BitterClip decomposes it into material an agent can hold: every word timestamped, every speaker named, every moment indexed, every cut addressable.
      </p>
      <figure class="mt-10 md:mt-14">
        <div class="agent-card overflow-hidden rounded-2xl border">
          <img src="/images/hero/transcript-editor.png" alt="The BitterClip transcript editor: each speaker's words laid over the audio waveform, with a clip selection dragged across the transcript" class="block w-full" loading="lazy" width="2880" height="880">
        </div>
        <figcaption class="agent-measure mt-4 text-sm leading-relaxed text-zinc-500">
          The editor is real — transcript-driven, frame-accurate. <span class="text-zinc-300">You'll mostly never open it.</span> That's the point: you ask for what you want, with whatever agent you prefer, and the substrate makes the answer computable.
        </figcaption>
      </figure>
    </section>

    <!-- ================= BELOW THE FOLD · 2: BRING YOUR AGENT =================
         The cockpit section. The claim (outcome-level direction, not timeline
         operation) is demonstrated by a transcript, not asserted: one complete
         instruction in, understanding shown, finished artifact back. This is
         also where the Andrew/client story lives now that the fold is dead
         simple — trainer world here, podcast world in the machine above. -->
    <section class="btf btf-last relative mx-auto max-w-6xl px-6 sm:px-8">
      <div class="agent-grid grid items-center">
        <div>
          <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Works with Claude · ChatGPT · MCP</p>
          <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Bring your agent</h2>
          <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
            BitterClip ships with its agent built in — but it also plugs into Claude, ChatGPT, or anything that speaks MCP. Your agent shows up to footage that's already understood: every speaker named, every moment findable.
          </p>
          <p class="agent-measure mt-4 text-base leading-relaxed text-zinc-200">
            You don't operate a timeline. You ask for the finished cut.
          </p>
          <a href="/docs" class="mt-7 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 hover:text-zinc-200">Connect your agent <span aria-hidden="true">→</span></a>
        </div>
        <figure class="agent-card rounded-2xl border p-5 sm:p-6">
          <figcaption class="mb-5 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-zinc-500">
            <span class="agent-dot inline-block h-1.5 w-1.5 rounded-full" aria-hidden="true" /> Claude · connected to BitterClip
          </figcaption>
          <div class="space-y-4 text-sm leading-relaxed">
            <p class="agent-bubble ml-auto w-fit max-w-[36ch] rounded-2xl rounded-br-md px-4 py-2.5 text-zinc-200">
              Can you cut Tuesday's session with Sarah into a highlight reel? Best lifts, under a minute, captions on.
            </p>
            <p class="font-mono text-[0.66rem] tracking-[0.08em] text-zinc-500">▸ transcript_search · speaker: sarah · range: tuesday</p>
            <div class="max-w-[46ch] text-zinc-400">
              <p>Found it — Tuesday, 47 minutes, you and Sarah. Her strongest moments:</p>
              <p class="mt-2 font-mono text-[0.72rem] leading-loose text-zinc-400">
                12:40 · deadlift — "that's a PR"<br>31:22 · squat — "best depth all month"<br>44:05 · sled finisher
              </p>
            </div>
            <p class="font-mono text-[0.66rem] tracking-[0.08em] text-zinc-500">▸ render · 9:16 · captions burned</p>
            <div class="agent-artifact flex items-center gap-3.5 rounded-xl border px-4 py-3">
              <span class="text-[#f28f84]" aria-hidden="true">▶</span>
              <div>
                <p class="font-mono text-xs text-zinc-200">sarah-highlights.mp4</p>
                <p class="mt-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-zinc-500">0:58 · captions · ready</p>
              </div>
            </div>
            <p class="max-w-[46ch] text-zinc-400">Want the same cut for Thursday's clients?</p>
          </div>
        </figure>
      </div>
    </section>
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

.agent-measure {
  max-width: 44ch;
}

.agent-grid {
  gap: 3.5rem;
}

/* Below-the-fold section rhythm in scoped CSS — the dev Tailwind watcher
   drops new pt-/pb- splits (pt-24 etc.), which crashed sections together. */
.btf {
  padding-top: 6rem;
}

.btf-last {
  padding-bottom: 4rem;
}

@media (min-width: 48rem) {
  .btf {
    padding-top: 9rem;
  }

  .btf-last {
    padding-bottom: 6rem;
  }
}

/* Warm, dim card chrome — the machine's light, not a wireframe. Scoped CSS
   because the dev server's Tailwind watcher misses new arbitrary classes. */
.agent-card {
  border-color: rgb(255 214 205 / 0.12);
  background: #0e1013;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    0 18px 50px -24px rgb(0 0 0 / 0.9);
}

/* "connected" follows status convention (green), not brand coral — coral on a
   status dot reads as recording/error */
.agent-dot {
  background: rgb(134 186 130 / 0.9);
}

.agent-artifact {
  border-color: rgb(242 143 132 / 0.28);
  background: rgb(242 143 132 / 0.06);
  box-shadow: 0 0 28px -8px rgb(242 143 132 / 0.28);
}

.agent-bubble {
  background: rgb(255 255 255 / 0.13);
}

.stage-foot-fade {
  height: 7rem;
  background: linear-gradient(180deg, rgb(8 9 10 / 0) 0%, rgb(8 9 10 / 0.85) 72%, #08090a 100%);
}

@media (min-width: 48rem) {
  .agent-grid {
    grid-template-columns: 1fr 1.05fr;
    gap: 5rem;
  }

  .iso4-stage {
    height: calc(100svh - 3.375rem);
    min-height: 35rem;
  }

  .iso4-copy {
    justify-content: flex-start;
    /* 20vh (was 18) — on tall viewports the machine cascades low-right, so
       the copy block rides a touch lower to hold the diagonal balance */
    padding-top: clamp(7rem, 20vh, 15rem);
  }

  .mobile-copy-shroud {
    display: none !important;
  }
}
</style>
