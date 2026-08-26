<script setup lang="ts">
/**
 * The homepage — promoted from /lab/iso4 (owner ruling, 2026-08-20; the
 * cut-over plan is docs/homepage-promotion-audit.md). The fold is the ISO4
 * machine; below it: proof (#demo) → proof CTA → control and trust (#how) →
 * agent portability → pricing (#pricing) → FAQ (#faq). /lab/iso4 stays as the noindexed workshop
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

// Acquisition starts with Creator. Plan keys remain the app's durable
// compatibility handles, while customer copy uses Creator and Producer.
const signupUrlFor = (plan: string, stage: string) => buildSignupUrl({
  query: route.query,
  plan,
  surface: 'homepage',
  stage,
  landingPath: route.path,
})
const signupUrlClipHero = computed(() => signupUrlFor('clip', 'hero'))
const signupUrlClipProof = computed(() => signupUrlFor('clip', 'proof'))
const signupUrlClipPricing = computed(() => signupUrlFor('clip', 'pricing'))
const signupUrlProPricing = computed(() => signupUrlFor('pro', 'pricing'))

// FAQ: objection handling right before the pricing ask. Ported from the
// pre-swap homepage (answers reviewed/signed there) plus one destinations
// answer carrying the old handoff section's facts. Answers must stay
// grounded in shipped behavior — no invented features.
const faqItems = [
  {
    q: 'What happens after I sign up?',
    a: 'Choose Creator and add a card. Checkout shows $0 due today and the scheduled $24 monthly price. Once your payment method is accepted and the trial starts, Billing shows your exact cancel-before time. Then bring one recording. Your trial includes $5 of agent work for the whole-recording analysis, First Cut, and the directions and alternatives you try during those seven days.',
  },
  {
    q: 'I have tried AI clippers. Why would this be different?',
    a: 'BitterClip works from the whole recording — who is speaking, what came before, and what came after — and commits to one coherent cut. It does not hand you a scored pile of disconnected moments. When the cut is wrong, direct the one you have instead of asking a clip generator for ten more guesses.',
  },
  {
    q: 'Can I keep changing the cut?',
    a: 'Yes. Ask questions, give another direction, try an alternative, revert, or edit the transcript by hand while agent work remains. There is no revision counter. If the balance reaches zero, playback, manual editing, your sources, and the work you already made remain available.',
  },
  {
    q: 'Do I need ChatGPT or Claude?',
    a: 'No. BitterClip has an agent built into the editor, and that is the shortest path. Claude, ChatGPT, and other MCP clients are optional peer operators of the same workbench when you would rather direct the cut from somewhere else.',
  },
  {
    q: 'Where can the finished work go?',
    a: 'Download the full episode or a portrait cut, share a review link, or prepare a connected YouTube, LinkedIn, or X destination. Publishing always stops for your final confirmation; connecting a channel never makes it automatic.',
  },
  {
    q: 'What can I upload?',
    a: 'Podcasts, interviews, calls, coaching sessions, and workshops — audio or video. The Creator trial accepts one recording up to two hours. Paid Creator supports files up to 4 GB; Producer supports files up to 20 GB. Several synchronized angles of the same session stay together as one production.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Once your payment method is accepted and the trial starts, Billing shows your exact cancel-before time. Cancel before that time and you pay $0. After a paid period begins, cancellation stops the next renewal. Your sources, edits, finished work, and any agent work you purchased stay in your Studio; new agent work waits until a trial or paid plan is active again.',
  },
]

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://company.sheetgenius.com/#organization',
    name: 'SheetGenius, Inc.',
    legalName: 'SheetGenius, Inc.',
    url: 'https://company.sheetgenius.com/',
    sameAs: [
      'https://github.com/sheetgenius',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BitterClip',
    url: 'https://bitterclip.com/',
    description: 'Footage in, episode out: BitterClip understands the whole recording, makes one coherent cut, and lets you keep directing it.',
    publisher: {
      '@id': 'https://company.sheetgenius.com/#organization',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BitterClip',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: 'https://bitterclip.com/',
    publisher: {
      '@id': 'https://company.sheetgenius.com/#organization',
    },
    description: 'A directable video workbench that understands the whole recording and turns it into a coherent episode, with a built-in agent or optional external agents over Claude, ChatGPT, and MCP.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '24',
      highPrice: '99',
      priceCurrency: 'USD',
      offerCount: 2,
      url: `${SIGNUP_BASE_URL}?plan=clip`,
      availability: 'https://schema.org/InStock',
      description: 'Creator is $24/month after a seven-day card-backed trial with $0 due today, one recording up to two hours, and $5 of included agent work. Producer is $99/month.',
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
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/index.md', title: 'BitterClip homepage Markdown' },
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
        <h1 class="hero-h1 font-display max-w-[13ch] text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl">
          Footage in<br><span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">Episode out</span>
        </h1>
        <p class="hero-pillars max-w-[42ch] text-sm leading-relaxed text-zinc-300 sm:text-base">
          BitterClip watches the whole recording, makes one cut worth sending, and lets you keep directing it.
        </p>
        <!-- One CTA, one decision. The produced product film, when it exists,
             brings back "Watch it work" with a real target. -->
        <div class="hero-cta-row">
          <a
            :href="signupUrlClipHero"
            data-bc-event="hero_cta_click"
            data-bc-placement="hero"
            data-bc-plan="creator"
            class="hero-cta inline-flex w-fit items-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.45)]"
          >Start my 7-day trial <span aria-hidden="true">→</span></a>
        </div>
        <!-- One quiet line states the charge boundary at the moment of choice. -->
        <p class="hero-fineprint font-mono text-[0.68rem] font-medium text-zinc-500">Card required · $0 today · $24/month after seven days · $5 of included agent work for analysis, First Cut, and direction.</p>
      </div>
    </div>

    <!-- ==================== BELOW THE FOLD · 1: THE PROOF =====================
         Portrait clip + conversion/quote column: the phone is a fixed column,
         the offer follows the proof without a detour, and outcome-oriented
         customer voices supply trust. -->
    <section id="demo" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">From a Zoom call</p>
      <div class="proof-head">
        <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Hours of tape. One cut.</h2>
        <p class="proof-lede">
          Michael Ruescher quit a twelve-year job to build <a href="https://bitter.sh/" target="_blank" rel="noopener">bitter.sh</a>.<br>This is the cut you'd send.
        </p>
      </div>
      <div class="proof-stage">
        <figure class="proof-player">
          <div class="proof-frame agent-card overflow-hidden rounded-2xl border">
            <DeferredVideo
              class="block aspect-[9/16] w-full bg-black"
              poster="/clips/day-1-sizzle-poster.jpg"
              src="/clips/day-1-sizzle.mp4"
              type="video/mp4"
              controls
              playsinline
              width="1080"
              height="1920"
              title="Watch: Michael Ruescher on quitting to build bitter.sh"
              data-bc-proof-video
              data-bc-placement="homepage_proof"
            />
          </div>
          <figcaption class="proof-caption">
            The rest of the hours are still on the tape.
          </figcaption>
        </figure>
        <div class="proof-cta-band" aria-label="Try BitterClip on your recording">
          <div class="agent-card flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p class="font-display text-2xl font-bold text-white sm:text-3xl">Try it on one real recording.</p>
              <p class="mt-2 text-sm leading-relaxed text-zinc-400">Seven days · $0 today · one recording up to two hours · $5 of included agent work for analysis, First Cut, and direction.</p>
            </div>
            <a
              :href="signupUrlClipProof"
              data-bc-event="proof_cta_click"
              data-bc-placement="after_proof"
              data-bc-plan="creator"
              class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.35)] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >Start my 7-day trial <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div class="proof-quotes">
          <figure class="proof-quote proof-quote-lead">
            <blockquote class="font-display">
              &ldquo;I built BitterClip for myself because I realized <span class="text-white">the most important thing about being a founder is getting anyone to know or care about your product.</span>&rdquo;
            </blockquote>
            <figcaption>
              <DeferredImage src="/images/michael_ruescher.jpg" alt="Michael Ruescher" width="48" height="48" />
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
              <DeferredImage src="/images/andrew_williams_strength_and_positions_coach.jpg" alt="Andrew Williams" width="48" height="48" />
              <div>
                <span class="proof-quote-name">Andrew Williams</span>
                <span class="proof-quote-role">Head Coach · <a href="https://www.strengthandpositions.com/coaches" target="_blank" rel="noopener">Strength &amp; Positions</a></span>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- =================== BELOW THE FOLD · 2: HOW IT WORKS ===================
         Same day-one cut as #demo, open in the actual editor. Aspirin: the
         tape is checkable. Time: cuts land on the word. The agent can still
         make the cut. The intro names the browser recorder so the page
         cannot be read as "cannot record" (qa/smoke.spec.ts). -->
    <section id="how" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <div class="substrate-head">
        <div>
          <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Control</p>
          <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Direct the cut until it is right</h2>
        </div>
        <p class="substrate-intro agent-measure text-base leading-relaxed text-zinc-400">
          Start with BitterClip's built-in agent. Ask why a moment belongs, tighten the opening, try another direction, or revert. You can also edit the transcript by hand. The result stays ordinary, controllable work.
        </p>
      </div>
      <figure class="mt-10 md:mt-14">
        <div class="agent-card overflow-hidden rounded-2xl border">
          <DeferredImage src="/images/hero/sizzle-editor-4.webp" alt="The BitterClip editor mid-direction on the Mike and John origin episode: the agent citing the strongest beat at 0:55-1:10, the player playing that exact moment, the chapter list lit on Why Mike quit, the full episode on labeled EPISODE and CAMERA tracks, and the transcript at the question that starts it all" class="block w-full" width="2560" height="1252" />
        </div>
        <figcaption class="substrate-caption mt-4 text-sm leading-relaxed text-zinc-500">
          <p>This is the same cut as above. <span class="text-zinc-300">Open it to check the tape.</span></p>
          <p>The source stays attached, every word is timestamped, and every cut can be checked against the exact moment it came from.</p>
        </figcaption>
      </figure>
    </section>

    <!-- ================ BELOW THE FOLD · 3: AGENT PORTABILITY ================
         The cockpit section. The claim (outcome-level direction, not timeline
         operation) is demonstrated by a transcript, not asserted: ask, draft
         that cut, revise that cut, then open or download after render. -->
    <section class="btf relative mx-auto max-w-6xl px-6 sm:px-8" data-bc-view-event="agent_portability_view" data-bc-placement="agent_portability">
      <div class="agent-grid grid items-center">
        <div>
          <p class="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Built in first · portable when you want it</p>
          <h2 class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Use BitterClip&rsquo;s agent—or yours</h2>
          <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
            BitterClip's agent is already inside the editor. Nothing else needs to be connected. If you prefer Claude, ChatGPT, or another MCP client, it can operate the same workbench under the same source and edit rules.
          </p>
          <p class="agent-measure mt-4 text-base leading-relaxed text-zinc-200">
            The cockpit can change. The recording, cut, history, and manual controls stay the same.
          </p>
          <figure class="proof-quote agent-portability-quote">
            <blockquote class="font-display">
              &ldquo;The friction was the whole problem with founder content &mdash; timestamps, clunky editors, the back-and-forth on every clip. <span class="text-white">Now I make the clips inside Claude, while I&rsquo;m already in there.</span>&rdquo;
            </blockquote>
            <figcaption>
              <DeferredImage src="/images/rohan_karunakaran.jpg" alt="Rohan Karunakaran" width="48" height="48" />
              <div>
                <span class="proof-quote-name">Rohan Karunakaran</span>
                <span class="proof-quote-role">Founder · <a href="https://www.frontier-studio.com/" target="_blank" rel="noopener">Frontier Studio</a></span>
              </div>
            </figcaption>
          </figure>
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

    <!-- ====================== BELOW THE FOLD · 4: PRICING =====================
         Two public plans, with Creator as the only trial entry. Durable app
         keys remain clip/pro; public language stays Creator/Producer. -->
    <section id="pricing" aria-label="Pricing" class="btf relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8" data-bc-view-event="pricing_view" data-bc-placement="pricing">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Pricing</p>
      <h2 class="font-display max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Bring one recording. Leave with the episode.</h2>
      <p class="agent-measure mt-5 text-base leading-relaxed text-zinc-400">
        Try the real workbench on one recording. Your included agent work covers the whole-recording analysis, First Cut, and the directions you give from there.
      </p>

      <div class="mt-10 grid max-w-5xl items-stretch gap-4 md:mt-14 md:grid-cols-2">

        <div class="plan-card plan-card-accent relative flex flex-col overflow-hidden rounded-2xl border p-6">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f28f84]/70 to-transparent"></div>
          <p class="absolute right-6 top-6 rounded-full border border-[#f28f84]/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[#f28f84]">Recommended</p>
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#f28f84]">Creator</p>
          <p class="font-display text-3xl font-bold text-white">7 days<span class="text-lg font-semibold text-zinc-400">, then $24/month</span></p>
          <p class="mb-4 mt-1.5 text-xs text-zinc-400">Meet your editor. Card required; $0 due today.</p>
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">During the trial</p>
          <ul class="mb-7 space-y-2 text-[13px] leading-snug text-zinc-300">
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>One recording up to 2 hours</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>$5 of agent work for analysis, First Cut, and direction</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Keep asking and revising while balance remains</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Watermarked exports during the trial</li>
          </ul>
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">After the trial</p>
          <ul class="mb-7 space-y-2 text-[13px] leading-snug text-zinc-300">
            <li>10 source-footage hours · $10 included agent work</li>
            <li>Clean exports · files up to 4 GB</li>
            <li>Top up exactly $20, $50, or $100 of agent work while active</li>
          </ul>
          <a
            :href="signupUrlClipPricing"
            data-bc-event="pricing_cta_click"
            data-bc-placement="creator_pricing"
            data-bc-plan="creator"
            class="mt-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition duration-200 hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
          >
            <span>Start my 7-day trial</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <p class="mt-2.5 text-center text-[11px] text-zinc-500">Cancel before the trial ends and pay $0</p>
        </div>

        <div class="plan-card relative flex flex-col rounded-2xl border p-6">
          <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">Producer</p>
          <p class="font-display text-3xl font-bold text-white">$99<span class="text-lg font-semibold text-zinc-400">/month</span></p>
          <p class="mb-5 mt-1.5 text-xs text-zinc-400">High-volume recurring production.</p>
          <ul class="mb-7 space-y-2 text-[13px] leading-snug text-zinc-300">
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>40 source-footage hours per billing period</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>$40 included agent work</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Clean exports · files up to 20 GB</li>
            <li class="flex items-start gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mt-1 h-3 w-3 shrink-0 text-[#f28f84]" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Priority rendering · exact $20/$50/$100 top-ups</li>
          </ul>
          <a
            :href="signupUrlProPricing"
            data-bc-event="pricing_cta_click"
            data-bc-placement="producer_pricing"
            data-bc-plan="producer"
            class="mt-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 font-mono text-xs font-bold text-zinc-200 transition duration-200 hover:border-[#f28f84]/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-98"
          >
            <span>Choose Producer</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <p class="mt-2.5 text-center text-[11px] text-zinc-500">Month to month · cancel anytime</p>
        </div>

      </div>

      <p class="mt-7 text-center text-xs text-zinc-400">
        Card required for the Creator trial: $0 today, then $24/month after seven days unless canceled first. Once your payment method is accepted and the trial starts, Billing shows your exact cancel-before time. Top-ups are available during an active trial or paid plan and never auto-activate paid Creator; early activation requires a separate explicit $24 authorization.
      </p>
    </section>

    <!-- ======================== BELOW THE FOLD · 5: FAQ =======================
         Compact objection handling after the offer. Native details keep every
         answer keyboard-accessible, server-rendered, and available to JSON-LD. -->
    <section id="faq" aria-labelledby="faq-heading" class="btf btf-last relative mx-auto max-w-6xl scroll-mt-28 px-6 sm:px-8">
      <p class="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Before you ask</p>
      <h2 id="faq-heading" class="font-display max-w-[20ch] text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">The short version</h2>
      <div class="faq-list agent-card mt-10 overflow-hidden rounded-2xl border md:mt-14">
        <details
          v-for="(item, index) in faqItems"
          :key="item.q"
          class="faq-item"
          name="homepage-faq"
          data-bc-faq
          :data-bc-faq-id="`faq_${index + 1}`"
          data-bc-placement="homepage_faq"
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
  .faq-q {
    padding: 1.25rem 1.5rem;
    font-size: 1.02rem;
  }

  .faq-a {
    padding: 0.1rem 3.5rem 1.35rem 1.5rem;
    font-size: 0.95rem;
  }
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

.proof-cta-band {
  margin-top: 3rem;
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

.agent-portability-quote {
  margin-top: 1.75rem;
  padding-left: 1rem;
  border-left: 1px solid rgb(242 143 132 / 0.28);
}

.agent-portability-quote blockquote {
  font-size: 0.95rem;
  line-height: 1.55;
}

.proof-lede a:focus-visible,
.proof-quote-role a:focus-visible {
  outline: 2px solid var(--bitter-accent-clip);
  outline-offset: 3px;
}

@media (min-width: 48rem) {
  .proof-cta-band {
    margin-top: 4rem;
  }

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
    grid-row: 1 / span 2;
  }

  .proof-caption {
    grid-column: 1;
    grid-row: 3;
    margin-top: 0;
  }

  .proof-cta-band {
    grid-column: 2;
    grid-row: 1;
    margin-top: 0;
  }

  .proof-quotes {
    grid-column: 2;
    grid-row: 2;
    justify-content: start;
    gap: 2.5rem;
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

/* Pricing cards share the agent-card chrome; Creator carries the accent. */
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
