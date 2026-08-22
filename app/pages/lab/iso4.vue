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
  title: 'BitterClip — Footage in, Episode out',
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
      <div class="iso4-copy relative mx-auto flex h-full max-w-6xl flex-col px-6 sm:px-8">
        <!-- the machine's warmth pooling under the words: type and stage share light -->
        <div class="pointer-events-none absolute left-0 top-1/2 hidden h-[26rem] w-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(242,143,132,0.10),transparent_70%)] blur-2xl md:block" aria-hidden="true" />
        <!-- Once the charged strip reaches the upper run, real face cells pass
             behind the proposition. This soft copy-zone attenuation keeps the
             giant machine present without allowing footage contrast to fight
             the words; it fades before the transformation stage begins. -->
        <div class="mobile-copy-shroud pointer-events-none absolute" aria-hidden="true" />
        <h1 class="hero-h1 font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in<br><span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">Episode out</span>
        </h1>
        <!-- Two named beats under the H1. The third (programmable / our agent
             or yours) lives in Bring your agent — it never shared this cadence. -->
        <!-- a size smaller and a step dimmer than a subhead (owner: the fold
             felt crammed at full weight) — a spec block, not three subheads.
             Speaker/moment specifics live in the how section. -->
        <div class="hero-pillars max-w-[40ch] space-y-3.5 text-sm leading-relaxed text-zinc-400">
          <p><span class="font-semibold text-zinc-100">Deep Video Intelligence</span> — knows your content.</p>
          <p><span class="font-semibold text-zinc-100">Precision Edits</span> — the good parts, finished.</p>
        </div>
        <!-- One CTA, one decision. "Watch it work" was cut (owner, 2026-08-20):
             it pointed at the old homepage's demo section, and the machine
             beside it already performs what the button promised. If a real
             product film ever exists, it returns with a real target. -->
        <div class="hero-cta-row">
          <a
            :href="signupUrl"
            class="hero-cta inline-flex w-fit items-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.45)]"
          >Start free <span aria-hidden="true">→</span></a>
        </div>
        <!-- deliverables strip: outputs, not features (owner draft 2026-08-20).
             Closes the copy column directly under the CTAs — both outside eyes
             ruled a bottom-anchored credits line "never finds a home" (30%+
             stranding void on desktop, leftover pocket on mobile). One labeled
             line on desktop; a tight three-line labeled readout on mobile. The
             machine owns everything below. -->
      </div>
    </div>

    <!-- ==================== BELOW THE FOLD · 1: THE PROOF =====================
         Workshop mirror of homepage #demo: phone column + quote stack that
         fills its height. Header band matches the how section. -->
    <section id="demo" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">From a Zoom call</p>
      <div class="proof-head">
        <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Find the Hidden Gems</h2>
        <p class="proof-lede">
          Michael Ruescher quit a twelve-year job to build <a href="https://bitter.sh/" target="_blank" rel="noopener">bitter.sh</a>.<br>This is the cut you'd send.
        </p>
      </div>
      <div class="proof-stage">
        <figure class="proof-player">
          <div class="proof-frame agent-card overflow-hidden rounded-2xl border">
            <video
              class="block aspect-[9/16] w-full bg-black"
              poster="/clips/day-1-sizzle-poster.jpg"
              controls
              playsinline
              preload="metadata"
              width="1080"
              height="1920"
              title="Watch: Michael Ruescher on quitting to build bitter.sh"
            >
              <source src="/clips/day-1-sizzle.mp4" type="video/mp4">
            </video>
          </div>
          <figcaption class="proof-caption">
            The rest of the hours are still on the tape.
          </figcaption>
        </figure>
        <div class="proof-quotes">
          <figure class="proof-quote proof-quote-lead">
            <blockquote class="font-display">
              &ldquo;I built BitterClip for myself because I realized <span class="text-white">the most important thing about being a founder is getting anyone to know or care about your product.</span>&rdquo;
            </blockquote>
            <figcaption>
              <img src="/images/michael_ruescher.jpg" alt="Michael Ruescher" width="48" height="48" loading="lazy">
              <div>
                <span class="proof-quote-name">Michael Ruescher</span>
                <span class="proof-quote-role">Founder · <a href="https://bitter.sh/" target="_blank" rel="noopener">Bitter.sh</a></span>
              </div>
            </figcaption>
          </figure>
          <figure class="proof-quote">
            <blockquote class="font-display">
              &ldquo;Working through session footage is <span class="text-white">the worst three hours of my week &mdash; and the most important.</span> It&rsquo;s how I remember exactly what happened with a client and build on it next session.&rdquo;
            </blockquote>
            <figcaption>
              <img src="/images/andrew_williams_strength_and_positions_coach.jpg" alt="Andrew Williams" width="48" height="48" loading="lazy">
              <div>
                <span class="proof-quote-name">Andrew Williams</span>
                <span class="proof-quote-role">Head Coach · Strength &amp; Positions</span>
              </div>
            </figcaption>
          </figure>
          <figure class="proof-quote">
            <blockquote class="font-display">
              &ldquo;The friction was the whole problem with founder content &mdash; timestamps, clunky editors, the back-and-forth on every clip. <span class="text-white">Now I make the clips inside Claude, while I&rsquo;m already in there.</span>&rdquo;
            </blockquote>
            <figcaption>
              <img src="/images/rohan_karunakaran.jpg" alt="Rohan Karunakaran" width="48" height="48" loading="lazy">
              <div>
                <span class="proof-quote-name">Rohan Karunakaran</span>
                <span class="proof-quote-role">Founder · Frontier Studio</span>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- =================== BELOW THE FOLD · 2: HOW IT WORKS ===================
         Same day-one cut as #demo, open in the actual editor. Aspirin: the
         tape is checkable. Time: cuts land on the word. The intro names the
         browser recorder so the page cannot be read as "cannot record." -->
    <section id="how" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <!-- Full-width bands, not left-hugging clumps (owner, 2026-08-20): the
           H2 and intro share a two-column header band above the card, and the
           caption splits into two halves spanning the card's width below it. -->
      <div class="substrate-head">
        <div>
          <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">How it works</p>
          <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">First, the session is in view</h2>
        </div>
        <p class="substrate-intro agent-measure text-base leading-relaxed text-zinc-400">
          That clip is still attached to the Zoom it came from. Shoot on a phone, in Zoom, or with BitterClip's own browser recorder, and BitterClip transcribes it, timestamps every word, and splits the voices. Cuts land on the word.
        </p>
      </div>
      <figure class="mt-10 md:mt-14">
        <div class="agent-card overflow-hidden rounded-2xl border">
          <img src="/images/hero/sizzle-editor.webp" alt="The BitterClip editor open on the same day-one cut as the clip above: Mike on camera, the takes on the filmstrip, and the transcript of him quitting his job" class="block w-full" loading="lazy" width="2720" height="1480">
        </div>
        <figcaption class="substrate-caption mt-4 text-sm leading-relaxed text-zinc-500">
          <p>This is the same cut as above. <span class="text-zinc-300">Open it to check the tape.</span></p>
          <p>The agent can still make the cut. You ask for what you want; any cut is checkable against the exact moment it came from.</p>
        </figcaption>
      </figure>
    </section>

    <!-- ================= BELOW THE FOLD · 3: BRING YOUR AGENT =================
         The cockpit section. Ask, draft that cut, revise that cut, then
         open or download after render. No fake tool chrome. -->
    <section class="btf btf-last relative mx-auto max-w-6xl px-6 sm:px-8">
      <div class="agent-grid grid items-center">
        <div>
          <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Works with Claude · ChatGPT · MCP</p>
          <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Bring your agent</h2>
          <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
            BitterClip ships with its agent built in — but it also plugs into Claude, ChatGPT, or anything that speaks MCP. Your agent shows up to footage that's already in view: every word timestamped, voices split, cuts addressable.
          </p>
          <p class="agent-measure mt-4 text-base leading-relaxed text-zinc-200">
            You don't operate a timeline. You ask for the finished cut — and when it's wrong, you say so and it revises that same cut.
          </p>
          <a href="/docs" class="mt-7 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 hover:text-zinc-200">Connect your agent <span aria-hidden="true">→</span></a>
        </div>
        <figure class="agent-card rounded-2xl border p-5 sm:p-6">
          <figcaption class="mb-5 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-zinc-500">
            <span class="agent-dot inline-block h-1.5 w-1.5 rounded-full" aria-hidden="true" /> Claude · connected to BitterClip
          </figcaption>
          <div class="space-y-4 text-sm leading-relaxed">
            <p class="agent-bubble ml-auto w-fit max-w-[36ch] rounded-2xl rounded-br-md px-4 py-2.5 text-zinc-200">
              Cut Tuesday's session with Sarah. Under a minute, captions on.
            </p>
            <div class="max-w-[46ch] text-zinc-400">
              <p>Drafted that cut. Fifty-eight seconds, captions on. It opens on the deadlift.</p>
            </div>
            <div class="agent-artifact flex items-center gap-3.5 rounded-xl border px-4 py-3">
              <span class="text-[#f28f84]" aria-hidden="true">▶</span>
              <div>
                <p class="font-mono text-xs text-zinc-200">sarah-highlights</p>
                <p class="mt-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-zinc-500">0:58 · captions · draft</p>
              </div>
            </div>
            <p class="agent-bubble ml-auto w-fit max-w-[36ch] rounded-2xl rounded-br-md px-4 py-2.5 text-zinc-200">
              Intro drags. Start on the squat.
            </p>
            <p class="max-w-[46ch] text-zinc-400">Revised that cut. It opens on the squat now.</p>
            <p class="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-zinc-500">Open in editor · Download after render</p>
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
  top: 0;
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

/* Fold rhythm — scoped CSS, not utilities: the dev Tailwind watcher has
   twice dropped newly-introduced classes (see .btf). Scale steps 16/24/36
   so headline→pillars→CTA group instead of stacking evenly. */
.iso4-copy {
  /* Clear the floating site bar (top-4 + ~54px pill). pt-8 used to piggyback
     on the bar's in-flow height; with overlay the canvas starts at y=0. */
  padding-top: 5.75rem;
}

.hero-pillars {
  margin-top: 1.5rem;
}

.hero-cta-row {
  margin-top: 2.25rem;
}

@media (min-width: 80rem) {
  .hero-h1 {
    font-size: 4.5rem;
  }
}

.hero-cta {
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.hero-cta:hover {
  background-color: #f6a094;
  transform: translateY(-1px);
  box-shadow: 0 12px 48px -8px rgb(242 143 132 / 0.55);
}

.hero-cta:active {
  transform: translateY(0);
}

.hero-cta:focus-visible {
  outline: 2px solid #f28f84;
  outline-offset: 4px;
}

.agent-measure {
  max-width: 44ch;
}

/* Substrate section bands — scoped (Tailwind-watcher strike avoidance).
   Desktop: H2 and intro share one baseline-aligned header row; the caption's
   two halves sit at opposite edges under the card. Mobile: normal stack. */
.substrate-intro {
  margin-top: 1.25rem;
}

@media (min-width: 80rem) {
  .substrate-head {
    display: grid;
    grid-template-columns: auto minmax(22rem, 1fr);
    column-gap: 3.25rem;
    align-items: end;
  }

  .substrate-intro {
    margin-top: 0;
    max-width: 34rem;
  }
}

.substrate-caption p {
  max-width: 44ch;
}

.substrate-caption p + p {
  margin-top: 0.5rem;
}

@media (min-width: 48rem) {
  .substrate-caption {
    display: flex;
    justify-content: space-between;
    gap: 3rem;
  }

  .substrate-caption p + p {
    margin-top: 0;
  }
}

.agent-grid {
  gap: 3.5rem;
}

.proof-lede {
  margin-top: 1.25rem;
  max-width: 36em;
  color: #a1a1aa;
  font-size: 1rem;
  line-height: 1.7;
  text-wrap: pretty;
}

.proof-lede a {
  color: #d4d4d8;
  text-decoration: underline;
  text-decoration-color: rgb(242 143 132 / 0.4);
  text-underline-offset: 0.18em;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.proof-lede a:hover {
  color: #ffa89e;
  text-decoration-color: #ffa89e;
}

.proof-stage {
  display: grid;
  gap: 2.25rem;
  margin-top: 2.5rem;
}

.proof-player {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 22rem;
  margin-inline: auto;
}

.proof-caption {
  margin-top: 0.9rem;
  color: #a1a1aa;
  font-size: 0.875rem;
  line-height: 1.55;
}

.proof-quotes {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.proof-quote {
  margin: 0;
}

.proof-quote blockquote {
  margin: 0;
  color: #a1a1aa;
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.018em;
  line-height: 1.55;
  text-wrap: pretty;
}

.proof-quote-lead blockquote {
  color: #c4c4cc;
}

.proof-quote figcaption {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-top: 0.9rem;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.55;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.proof-quote figcaption img {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  object-fit: cover;
}

.proof-quote-name {
  display: block;
  color: #e4e4e7;
}

.proof-quote-role {
  display: block;
  color: #71717a;
}

.proof-quote-role a {
  color: var(--bitter-accent-clip);
  transition: color 160ms ease;
}

.proof-quote-role a:hover {
  color: #ffa89e;
}

.proof-lede a:focus-visible,
.proof-quote-role a:focus-visible {
  outline: 2px solid var(--bitter-accent-clip);
  outline-offset: 3px;
}

@media (min-width: 48rem) {
  .proof-stage {
    margin-top: 3.5rem;
  }

  .proof-quotes {
    max-width: 42rem;
    margin-inline: auto;
  }
}

@media (min-width: 64rem) {
  .proof-stage {
    grid-template-columns: 22.5rem minmax(0, 1fr);
    grid-template-rows: auto auto;
    column-gap: 4rem;
    row-gap: 0.9rem;
    align-items: stretch;
    margin-top: 3.5rem;
  }

  .proof-player {
    display: contents;
  }

  .proof-frame {
    grid-column: 1;
    grid-row: 1;
  }

  .proof-caption {
    grid-column: 1;
    grid-row: 2;
    margin-top: 0;
  }

  .proof-quotes {
    grid-column: 2;
    grid-row: 1;
    justify-content: space-between;
    gap: 1.75rem;
    min-height: 100%;
    max-width: 36rem;
    margin-inline: 0;
  }

  .proof-quote-lead blockquote {
    font-size: 1.25rem;
    line-height: 1.5;
  }
}

@media (min-width: 80rem) {
  .proof-head {
    display: grid;
    grid-template-columns: auto minmax(22rem, 1fr);
    column-gap: 3.25rem;
    align-items: end;
  }

  .proof-lede {
    margin-top: 0;
    max-width: 34rem;
  }

  .proof-stage {
    grid-template-columns: 24rem minmax(0, 1fr);
    column-gap: 4.5rem;
  }
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
