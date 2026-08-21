<script setup lang="ts">
/**
 * The homepage — promoted from /lab/iso4 (owner ruling, 2026-08-20; the
 * cut-over plan is docs/homepage-promotion-audit.md). The fold is the ISO4
 * machine; below it: substrate → bring-your-agent → proof (#demo) → FAQ
 * (#faq) → pricing (#pricing). /lab/iso4 stays as the noindexed workshop
 * mirror; the pre-swap homepage soaks at /classic (noindex) before deletion.
 *
 * ONE full-bleed canvas at every size — a canvas band always shows a seam
 * against CSS color (tone mapping owns the void), so mobile overlays the
 * same stage as desktop: text anchored top, spec bullets anchored bottom,
 * and the portrait camera fit frames the machine into the space between.
 * three.js stays a lazy chunk (HeroIso4.client.vue dynamic-imports the
 * scene); it must never enter the main bundle.
 */
import { computed } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'

const route = useRoute()

// Paid pricing CTAs carry ?plan= so the app's signup hands off to
// /billing?plan=… after account creation; every other CTA stays plan-less.
const signupUrlFor = (plan?: string) => buildSignupUrl({
  query: route.query,
  plan,
  surface: 'homepage',
  landingPath: route.path,
})
const signupUrl = computed(() => signupUrlFor())
const signupUrlClip = computed(() => signupUrlFor('clip'))
const signupUrlPro = computed(() => signupUrlFor('pro'))

// FAQ: objection handling right before the pricing ask. Ported from the
// pre-swap homepage (answers reviewed/signed there) plus one destinations
// answer carrying the old handoff section's facts. Answers must stay
// grounded in shipped behavior — no invented features.
const faqItems = [
  {
    q: 'What happens after I sign up?',
    a: 'Create the free account, then upload a recording or record one in the browser. BitterClip transcribes it, separates the speakers, and opens the editor with the agent already in it. Ask for what you want, check it against the recording, adjust it, export.',
  },
  {
    q: 'I have tried AI clippers. Why would this be different?',
    a: 'Because it is not picking moments out of a transcript search. It works from the whole session — who is speaking, what came before and after, what is on screen — and commits to a cut it can explain and show you the source for. When it is wrong, you say what is wrong and it revises that same cut instead of handing you ten more options.',
  },
  {
    q: 'Do I need ChatGPT or Claude?',
    a: 'No. The agent is built into the editor, and that is the shortest path. If you would rather work where you already are, Claude supports custom connectors on every Claude plan; in ChatGPT, custom-app access and available actions depend on your plan and workspace policy.',
  },
  {
    q: 'Can it post something without me?',
    a: 'No. Every send is bound to one exact export, one destination, one account, and a final confirmation from you. Connecting a channel does not hand over the keys.',
  },
  {
    q: 'Where can the finished work go?',
    a: 'Export the full-length episode, then pull the short vertical cuts from that same edit instead of starting a second production. Publish to YouTube, X, or LinkedIn, or grab a shareable link. For Instagram, send the finished clip to your phone and post it from the Instagram app. Nothing goes out until you confirm it. Invite a client to the same session and they can pull their own cuts too — upload once, everyone works from it.',
  },
  {
    q: 'Does BitterClip record for me?',
    a: 'It can record. It cannot have the conversation for you — that part stays yours. Every project has a recorder in the browser: camera and mic on a laptop or phone, or your screen in desktop Chrome, up to 1080p, uploading while you record so transcription starts the moment you stop. It captures one signed-in person on one device — no remote guests, no guest recording links, no separate track per person. Most people bring footage they already shot on a phone, a camera, Zoom, or Riverside, and that stays completely normal.',
  },
  {
    q: 'What can I upload?',
    a: 'Podcasts, interviews, calls, training sessions — audio or video, in files up to 4 GB (20 GB on Pro). Bring several angles of the same session and BitterClip keeps them in sync; the picture can cut between up to five at a time while the audio stays whole.',
  },
  {
    q: 'Do I have to learn a new editor?',
    a: 'No. You edit by changing the transcript: select the words, delete them, and the video changes with them. Or say what you want changed and let the agent make the edit. Same editor in the browser and in supported assistant hosts.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Your paid plan runs through the period you already paid for, then your account moves to Free. Your files stay downloadable, so canceling never strands your work.',
  },
]

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bitter',
    url: 'https://bitter.sh/',
    sameAs: [
      'https://github.com/sheetgenius',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BitterClip',
    url: 'https://bitterclip.com/',
    description: 'Footage in, episodes out: BitterClip turns raw session footage into the finished episode and the short cuts from that same edit — an agent that watched the whole session, directed and revised by you.',
    publisher: {
      '@type': 'Organization',
      name: 'Bitter',
      url: 'https://bitter.sh/',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BitterClip',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: 'https://bitterclip.com/',
    description: 'Agentic video editing: record in the browser or bring footage you already shot, and BitterClip cuts it into the finished episode, portrait clips, and transcripts — with its built-in agent, or yours over Claude, ChatGPT, and MCP.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '99',
      priceCurrency: 'USD',
      offerCount: 3,
      url: SIGNUP_BASE_URL,
      availability: 'https://schema.org/InStock',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
]

useHead({
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/index.md', title: 'BitterClip Markdown' },
  ],
  meta: [
    { property: 'og:url', content: 'https://bitterclip.com/' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(structuredData),
    },
  ],
})
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
      <div class="iso4-copy relative mx-auto flex h-full max-w-6xl flex-col px-6 sm:px-8">
        <!-- the machine's warmth pooling under the words: type and stage share light -->
        <div class="pointer-events-none absolute left-0 top-1/2 hidden h-[26rem] w-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(242,143,132,0.10),transparent_70%)] blur-2xl md:block" aria-hidden="true" />
        <!-- Once the charged strip reaches the upper run, real face cells pass
             behind the proposition. This soft copy-zone attenuation keeps the
             giant machine present without allowing footage contrast to fight
             the words; it fades before the transformation stage begins. -->
        <div class="mobile-copy-shroud pointer-events-none absolute" aria-hidden="true" />
        <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Agentic video editing</p>
        <h1 class="hero-h1 font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in<br><span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">Episodes out</span>
        </h1>
        <!-- Two named beats under the H1. The third (programmable / our agent
             or yours) lives in Bring your agent — it never shared this cadence. -->
        <div class="hero-pillars max-w-[40ch] space-y-3.5 text-sm leading-relaxed text-zinc-400">
          <p><span class="font-semibold text-zinc-100">Deep Video Intelligence</span> — remembers every session.</p>
          <p><span class="font-semibold text-zinc-100">Classical editing excellence</span> — cuts, not video gen.</p>
        </div>
        <!-- One CTA, one decision. The produced product film, when it exists,
             brings back "Watch it work" with a real target. -->
        <div class="hero-cta-row">
          <a
            :href="signupUrl"
            class="hero-cta inline-flex w-fit items-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.45)]"
          >Start free <span aria-hidden="true">→</span></a>
        </div>
        <!-- one quiet line answering "what does free mean" at the moment of
             the click (the fold's only salvage from the old hero fine print) -->
        <p class="hero-fineprint font-mono text-[0.68rem] font-medium text-zinc-500">Free to start — 60 minutes of footage a month. Everything runs in your browser.</p>
        <!-- Wayfinding whisper: the 100svh stage gives no hint the sections
             below exist; this rides the permanently dead lower-left corner,
             desktop-and-tall only so it can never crowd the CTA or the
             mobile machine. -->
        <a href="#how" class="hero-scroll font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-zinc-600 hover:text-zinc-300">How it works <span aria-hidden="true">↓</span></a>
      </div>
    </div>

    <!-- ============== BELOW THE FOLD · 1: AGENT-NATIVE SUBSTRATE ==============
         How BitterClip makes video tractable for agents, with the editor as a
         REAL screenshot framed as the surface you typically DON'T use —
         that's the point of the substrate. The intro carries the recorder
         fact: the site must never be readable as "BitterClip cannot record"
         (guarded in qa/smoke.spec.ts). -->
    <section id="how" class="btf relative mx-auto max-w-6xl px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">How it works</p>
      <div class="substrate-head">
        <h2 class="font-display max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Turns video into agent-native substrate</h2>
        <p class="substrate-intro agent-measure text-base leading-relaxed text-zinc-400">
          Raw video is opaque to software — a wall of pixels and a waveform. Shoot on a phone, in Zoom, or with BitterClip's own browser recorder, and BitterClip decomposes it into material an agent can hold: every word timestamped, every speaker named, every moment indexed, every cut addressable.
        </p>
      </div>
      <figure class="mt-10 md:mt-14">
        <div class="agent-card overflow-hidden rounded-2xl border">
          <img src="/images/hero/transcript-editor.png" alt="The BitterClip transcript editor: each speaker's words laid over the audio waveform, with a clip selection dragged across the transcript" class="block w-full" loading="lazy" width="2880" height="880">
        </div>
        <figcaption class="substrate-caption mt-4 text-sm leading-relaxed text-zinc-500">
          <p>The editor is real — transcript-driven, frame-accurate. <span class="text-zinc-300">You'll mostly never open it.</span></p>
          <p>That's the point: you ask for what you want, with whatever agent you prefer, and the substrate makes the answer computable — any cut checkable against the exact moment it came from.</p>
        </figcaption>
      </figure>
    </section>

    <!-- ================= BELOW THE FOLD · 2: BRING YOUR AGENT =================
         The cockpit section. The claim (outcome-level direction, not timeline
         operation) is demonstrated by a transcript, not asserted: one complete
         instruction in, understanding shown, finished artifact back. -->
    <section class="btf relative mx-auto max-w-6xl px-6 sm:px-8">
      <div class="agent-grid grid items-center">
        <div>
          <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Works with Claude · ChatGPT · MCP</p>
          <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Bring your agent</h2>
          <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
            BitterClip ships with its agent built in — but it also plugs into Claude, ChatGPT, or anything that speaks MCP. Your agent shows up to footage that's already understood: every speaker named, every moment findable. Confirm a name once and it recognizes that person when they return.
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

    <!-- ==================== BELOW THE FOLD · 3: THE PROOF =====================
         Real material only: both quotes signed off by Andrew and Rohan
         (2026-06-10), and the clip is a REAL client reel served live by the
         clip-embed primitive — the same surface a Pro customer projects onto
         their own site. id="demo" keeps the nav anchor honest: this is the
         one live thing on the page you can touch. -->
    <section id="demo" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">In the field</p>
      <h2 class="font-display max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Real sessions, real cuts</h2>
      <div class="proof-grid mt-10 grid items-start md:mt-14">
        <figure>
          <div class="agent-card relative overflow-hidden rounded-2xl border">
            <img
              src="/clips/park-session-poster.jpg"
              alt="The same park moment from two synchronized cameras side by side: Mike kneeling into a coached hip stretch by the tree, and the overhead view of the stretch pad"
              width="280"
              height="158"
              loading="lazy"
              class="block aspect-video w-full object-cover"
            >
            <iframe
              src="https://app.bitterclip.com/embed/clip/clip_ikmni9p7hairtsqoeepw"
              class="absolute inset-0 h-full w-full"
              style="border: 0"
              title="Watch: Andrew coaching Mike through a hip stretch at the park"
              loading="lazy"
              allow="fullscreen"
              allowfullscreen
            />
          </div>
          <!-- Multicam claims are grounded: 24 recordings / 15 bursts, 9 placed
               synced angles in the session episode; the export (verified by
               frame inspection) is a two-up of the side angle and the overhead
               camera rendered simultaneously. -->
          <figcaption class="mt-4 max-w-[44ch] text-sm leading-relaxed text-zinc-500">
            A real session — Andrew working on Mike's hip at the park. Phones, an iPad, and Meta glasses ran loose; BitterClip synchronized all two dozen recordings, and this cut plays <span class="text-zinc-300">the same moment from two cameras, side by side, frame-locked</span> — served live by the same machine, through the embed his clients see.
          </figcaption>
        </figure>
        <div class="space-y-12">
          <figure>
            <blockquote class="font-display text-lg font-medium leading-[1.55] tracking-tight text-zinc-400">
              &ldquo;Working through session footage is <span class="text-white">the worst three hours of my week &mdash; and the most important.</span> It&rsquo;s how I remember exactly what happened with a client and build on it next session.&rdquo;
            </blockquote>
            <figcaption class="mt-4 flex items-center gap-3.5">
              <img src="/images/andrew_williams_strength_and_positions_coach.jpg" alt="Andrew Williams" width="48" height="48" loading="lazy" class="h-12 w-12 rounded-full object-cover">
              <div class="font-mono text-[10px] uppercase leading-relaxed tracking-widest">
                <span class="block text-zinc-200">Andrew Williams</span>
                <span class="block text-zinc-500">Head Coach · <a href="https://www.strengthandpositions.com/coaches" target="_blank" rel="noopener" class="text-[#f28f84]/90 transition-colors hover:text-[#ffa89e]">Strength &amp; Positions</a></span>
              </div>
            </figcaption>
          </figure>
          <figure>
            <blockquote class="font-display text-lg font-medium leading-[1.55] tracking-tight text-zinc-400">
              &ldquo;The friction was the whole problem with founder content &mdash; timestamps, clunky editors, the back-and-forth on every clip. <span class="text-white">Now I make the clips inside Claude, while I&rsquo;m already in there.</span>&rdquo;
            </blockquote>
            <figcaption class="mt-4 flex items-center gap-3.5">
              <img src="/images/rohan_karunakaran.jpg" alt="Rohan Karunakaran" width="48" height="48" loading="lazy" class="h-12 w-12 rounded-full object-cover">
              <div class="font-mono text-[10px] uppercase leading-relaxed tracking-widest">
                <span class="block text-zinc-200">Rohan Karunakaran</span>
                <span class="block text-zinc-500">Founder · <a href="https://www.frontier-studio.com/" target="_blank" rel="noopener" class="text-[#f28f84]/90 transition-colors hover:text-[#ffa89e]">Frontier Studio</a></span>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ======================= BELOW THE FOLD · 4: FAQ ========================
         Bottom-funnel objection handling, staged before the pricing ask.
         Native <details> accordion (same name = exclusive) so it works without
         JS, stays keyboard-accessible, and keeps answers in the HTML for
         FAQPage JSON-LD. Also emitted as FAQPage JSON-LD. -->
    <section id="faq" aria-labelledby="faq-heading" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Before you ask</p>
      <h2 id="faq-heading" class="font-display max-w-[20ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">The questions everyone asks first</h2>
      <div class="faq-list agent-card mt-10 overflow-hidden rounded-2xl border md:mt-14">
        <details
          v-for="item in faqItems"
          :key="item.q"
          class="faq-item"
          name="homepage-faq"
        >
          <summary class="faq-q">
            <span class="faq-q-text">{{ item.q }}</span>
            <svg class="faq-plus" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </summary>
          <p class="faq-a">{{ item.a }}</p>
        </details>
      </div>
    </section>

    <!-- ====================== BELOW THE FOLD · 5: PRICING =====================
         The ladder ports verbatim from the pre-swap homepage (owner-ruled
         2026-06-09): Free / Clip (recommended, the only filled CTA) / Pro as
         the anchor. Card chrome restyled to the machine's warm-card language;
         the claims are the old claims. Paid CTAs carry ?plan= so signup hands
         off to /billing with the plan highlighted. -->
    <section id="pricing" aria-label="Pricing" class="btf btf-last relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Pricing</p>
      <h2 class="font-display max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Bring one recording. Leave with the episode.</h2>
      <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
        Upload a podcast, interview, or session and work it into something you would actually publish — with the agent in the editor, or from ChatGPT or Claude if you would rather. Start free; upgrade when an hour a month stops being enough.
      </p>

      <div class="mt-10 grid max-w-5xl items-stretch gap-4 md:mt-14 md:grid-cols-3">

        <!-- FREE (second in the stack on mobile — Clip leads there) -->
        <div class="plan-card relative flex flex-col rounded-2xl border p-6 max-md:order-2">
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">Free</p>
          <p class="font-display text-3xl font-bold text-white">$0</p>
          <p class="mb-5 mt-1.5 text-xs text-zinc-400">Try it for real.</p>
          <ul class="mb-7 space-y-2 text-[13px] leading-snug text-zinc-300">
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>60 minutes of footage a month</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>10 clip exports at 1080p (watermarked)</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 4 GB</li>
          </ul>
          <a
            :href="signupUrl"
            class="mt-auto flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 font-mono text-xs font-bold text-zinc-200 transition duration-200 hover:border-[#f28f84]/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
          >Start free</a>
          <p class="mt-2.5 text-center text-[11px] text-zinc-500">Resets every month — not a trial</p>
        </div>

        <!-- CLIP — the recommended plan carries the accent and the only filled
             CTA. On mobile it jumps to the top of the stack. -->
        <div class="plan-card plan-card-accent relative flex flex-col overflow-hidden rounded-2xl border p-6 max-md:order-1">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f28f84]/70 to-transparent"></div>
          <p class="absolute right-6 top-6 rounded-full border border-[#f28f84]/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[#f28f84]">Recommended</p>
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#f28f84]">Clip</p>
          <p class="font-display text-3xl font-bold text-white">$9<span class="text-lg font-semibold text-zinc-400">/month</span></p>
          <p class="mb-5 mt-1.5 text-xs text-zinc-400">For a weekly show or regular interviews.</p>
          <ul class="mb-7 space-y-2 text-[13px] leading-snug text-zinc-300">
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>10 hours of footage a month</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>No watermark — 150 clip exports at 1080p</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 4 GB</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Embed clips on your own site</li>
          </ul>
          <a
            :href="signupUrlClip"
            class="mt-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
          >
            <span>Start clipping</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <p class="mt-2.5 text-center text-[11px] text-zinc-500">Month to month · cancel anytime</p>
        </div>

        <!-- PRO — plain panel: the $99 price anchors on its own; the accent
             lives on Clip, the plan we steer to. -->
        <div class="plan-card relative flex flex-col rounded-2xl border p-6 max-md:order-3">
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">Pro</p>
          <p class="font-display text-3xl font-bold text-white">$99<span class="text-lg font-semibold text-zinc-400">/month</span></p>
          <p class="mb-5 mt-1.5 text-xs text-zinc-400">When footage is your business.</p>
          <ul class="mb-7 space-y-2 text-[13px] leading-snug text-zinc-300">
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>40 hours of footage a month</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>1,000 clip exports at 1080p</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Upload files up to 20 GB</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Front-of-queue processing</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Visual analysis workflows</li>
          </ul>
          <a
            :href="signupUrlPro"
            class="mt-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 font-mono text-xs font-bold text-zinc-200 transition duration-200 hover:border-[#f28f84]/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
          >
            <span>Go Pro</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <p class="mt-2.5 text-center text-[11px] text-zinc-500">Month to month · cancel anytime</p>
        </div>

      </div>

      <p class="mt-7 text-center text-xs text-zinc-400">
        Your files stay downloadable on every plan — canceling never strands your work.
      </p>
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
   so eyebrow→headline→pillars→CTA group instead of stacking evenly. */
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

.hero-fineprint {
  margin-top: 0.9rem;
  max-width: 40ch;
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

/* Wayfinding whisper at the stage foot. mt-auto anchors it to the bottom of
   the copy flex column; hidden below md and on short viewports where the
   column would push it into the CTA or off the stage. */
.hero-scroll {
  display: none;
}

@media (min-width: 48rem) and (min-height: 46rem) {
  .hero-scroll {
    display: block;
    margin-top: auto;
    padding-bottom: 1.75rem;
    transition: color 160ms ease;
  }
}

.agent-measure {
  max-width: 44ch;
}

.faq-list {
  max-width: 42rem;
}

.faq-item + .faq-item {
  border-top: 1px solid rgb(255 214 205 / 0.1);
}

.faq-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin: 0;
  padding: 1.15rem 1.25rem;
  list-style: none;
  cursor: pointer;
  color: #f4f4f5;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.018em;
  line-height: 1.35;
  transition: background-color 180ms ease, color 180ms ease;
}

.faq-q::-webkit-details-marker {
  display: none;
}

.faq-q::marker {
  content: '';
}

.faq-q:hover {
  background: rgb(255 255 255 / 0.025);
}

.faq-q:focus {
  outline: none;
}

.faq-q:focus-visible {
  outline: 2px solid #f28f84;
  outline-offset: -2px;
}

.faq-q-text {
  min-width: 0;
}

.faq-plus {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: rgb(161 161 170);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease;
}

.faq-item[open] {
  background: rgb(242 143 132 / 0.035);
}

.faq-item[open] > .faq-q {
  color: #fff;
}

.faq-item[open] > .faq-q .faq-plus {
  color: #f28f84;
  transform: rotate(45deg);
}

.faq-a {
  margin: 0;
  padding: 0.1rem 3.25rem 1.35rem 1.25rem;
  max-width: 62ch;
  color: #a1a1aa;
  font-size: 0.9rem;
  line-height: 1.7;
}

.faq-item[open] > .faq-a {
  animation: faq-in 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes faq-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-plus,
  .faq-item[open] > .faq-a {
    transition: none;
    animation: none;
  }
}

/* Substrate section bands — scoped (Tailwind-watcher strike avoidance).
   Desktop: H2 and intro share one baseline-aligned header row; the caption's
   two halves sit at opposite edges under the card. Mobile: normal stack. */
.substrate-intro {
  margin-top: 1.25rem;
}

@media (min-width: 64rem) {
  .substrate-head {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    column-gap: 4rem;
    align-items: end;
  }

  .substrate-intro {
    margin-top: 0;
  }

  .faq-q {
    padding: 1.25rem 1.5rem;
    font-size: 1.02rem;
  }

  .faq-a {
    padding: 0.1rem 3.5rem 1.35rem 1.5rem;
    font-size: 0.95rem;
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

.proof-grid {
  gap: 3.5rem;
}

@media (min-width: 48rem) {
  .proof-grid {
    grid-template-columns: 1.05fr 1fr;
    gap: 5rem;
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

/* Pricing cards share the agent-card chrome; Clip carries the accent. */
.plan-card {
  border-color: rgb(255 214 205 / 0.12);
  background: #0e1013;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    0 18px 50px -24px rgb(0 0 0 / 0.9);
}

.plan-card-accent {
  border-color: rgb(242 143 132 / 0.32);
  background: linear-gradient(180deg, rgb(242 143 132 / 0.05), rgb(242 143 132 / 0.015)), #0e1013;
  box-shadow:
    inset 0 1px 0 rgb(255 214 205 / 0.08),
    0 0 44px -12px rgb(242 143 132 / 0.22),
    0 18px 50px -24px rgb(0 0 0 / 0.9);
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
