<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl } from '~/utils/signup-attribution'

const route = useRoute()

const signupUrlFor = (stage: string) => buildSignupUrl({
  query: route.query,
  plan: 'clip',
  surface: 'founder_onboarding',
  stage,
  landingPath: route.path,
})

const heroSignupUrl = computed(() => signupUrlFor('hero'))
const finalSignupUrl = computed(() => signupUrlFor('final'))

const questions = [
  {
    question: 'Is the 30-minute session really included?',
    answer: 'Yes. Michael is personally offering up to 100 founder-onboarding sessions while capacity remains. Start the Creator trial and he will contact you to schedule the call.',
  },
  {
    question: 'Do I need to bring a recording?',
    answer: 'No. The onboarding call can become the source recording. If you already have a podcast appearance, interview, demo, webinar, or customer conversation, bring that instead and work from the stronger source.',
  },
  {
    question: 'What happens during the session?',
    answer: 'You tell the real story behind what you are building. Michael helps find the moment worth sharing, makes the first cut in BitterClip, and shows you how to keep directing and revising it afterward.',
  },
  {
    question: 'What does the Creator trial cost?',
    answer: 'The seven-day trial requires a card and charges $0 today. It becomes $24/month unless you cancel before the trial ends. It accepts one recording up to two hours and includes $5 of agent work for analysis, the First Cut, and direction.',
  },
]

useSeoMeta({
  title: 'Founder onboarding — make your first founder video with BitterClip',
  description: 'Join Michael Ruescher for a 30-minute recorded founder conversation and make the first cut together in BitterClip. Up to 100 onboarding sessions.',
  ogTitle: 'Tell me your story. I’ll make the first cut.',
  ogDescription: 'A 30-minute recorded founder conversation, shaped into your first BitterClip cut with Michael Ruescher.',
  ogUrl: 'https://bitterclip.com/founder-onboarding',
  ogImage: 'https://bitterclip.com/images/bitterclip-og.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tell me your story. I’ll make the first cut.',
  twitterDescription: 'A 30-minute recorded founder conversation, shaped into your first BitterClip cut with Michael Ruescher.',
  twitterImage: 'https://bitterclip.com/images/bitterclip-og.png',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/founder-onboarding' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/founder-onboarding.md', title: 'BitterClip founder onboarding Markdown' },
  ],
})
</script>

<template>
  <main class="relative">
    <section class="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-20 lg:pb-28">
      <div>
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#f28f84]">
          Founder-led onboarding · up to 100 sessions
        </p>
        <h1 class="mt-6 max-w-[12ch] font-display text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl">
          Tell me your story.
          <span class="mt-2 block bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">I&rsquo;ll make the first cut.</span>
        </h1>
        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
          I&rsquo;m Michael, the founder of BitterClip. Join me for a 30-minute recorded conversation about what you&rsquo;re building. We&rsquo;ll find the part worth sharing, shape your first founder video together, and leave you with a cut you can keep directing.
        </p>
        <div class="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            :href="heroSignupUrl"
            data-bc-event="hero_cta_click"
            data-bc-placement="founder_onboarding_hero"
            data-bc-plan="creator"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.42)] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >Make my first founder video <span aria-hidden="true">→</span></a>
          <p class="font-mono text-[0.68rem] leading-relaxed text-zinc-500">
            Card required · $0 today<br>$24/month after seven days
          </p>
        </div>
      </div>

      <aside class="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="Meet Michael Ruescher">
        <div class="absolute -inset-8 rounded-full bg-[#f28f84]/10 blur-3xl" aria-hidden="true" />
        <div class="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-zinc-950/80 p-3 shadow-2xl shadow-black/50">
          <DeferredImage
            class="aspect-square w-full rounded-[1.45rem] object-cover object-top"
            src="/images/founder-onboarding-michael.webp"
            alt="Michael Ruescher, founder of BitterClip"
            width="720"
            height="720"
          />
          <div class="px-4 pb-4 pt-5 sm:px-5">
            <p class="font-display text-xl font-semibold text-white">Michael Ruescher</p>
            <p class="mt-1 text-sm text-zinc-400">Founder of BitterClip · your first editing partner</p>
          </div>
        </div>
      </aside>
    </section>

    <section aria-labelledby="how-it-works" class="border-y border-white/[0.07] bg-white/[0.018]">
      <div class="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-24">
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">One call. One real result.</p>
        <h2 id="how-it-works" class="mt-4 max-w-3xl font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">
          The conversation becomes the footage.
        </h2>
        <div class="mt-12 grid gap-5 md:grid-cols-3">
          <article class="rounded-2xl border border-white/[0.08] bg-black/20 p-7">
            <p class="font-mono text-xs font-bold text-[#f28f84]">01</p>
            <h3 class="mt-5 font-display text-2xl font-semibold text-white">Tell the real story</h3>
            <p class="mt-3 leading-relaxed text-zinc-400">We record a focused 30-minute conversation about the problem, the turning point, and why your company needs to exist.</p>
          </article>
          <article class="rounded-2xl border border-white/[0.08] bg-black/20 p-7">
            <p class="font-mono text-xs font-bold text-[#f28f84]">02</p>
            <h3 class="mt-5 font-display text-2xl font-semibold text-white">Find the moment</h3>
            <p class="mt-3 leading-relaxed text-zinc-400">BitterClip watches the whole conversation. Together, we choose the part that makes someone understand why they should care.</p>
          </article>
          <article class="rounded-2xl border border-white/[0.08] bg-black/20 p-7">
            <p class="font-mono text-xs font-bold text-[#f28f84]">03</p>
            <h3 class="mt-5 font-display text-2xl font-semibold text-white">Direct the first cut</h3>
            <p class="mt-3 leading-relaxed text-zinc-400">We shape the opening and ending, then you see how to keep revising the same cut instead of sorting through another pile of guesses.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div>
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">Bring footage—or just show up</p>
        <h2 class="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">Your story is probably already on tape.</h2>
        <p class="mt-6 text-lg leading-relaxed text-zinc-400">
          A podcast appearance, customer call, investor conversation, demo, webinar, or launch recording can all be the source. If none of those captures the story, our onboarding call will.
        </p>
      </div>
      <div class="rounded-3xl border border-[#f28f84]/20 bg-[#f28f84]/[0.055] p-7 sm:p-9">
        <p class="font-display text-2xl font-semibold text-white">What you leave with</p>
        <ul class="mt-6 space-y-4 text-zinc-300">
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>A recorded founder conversation with a clear editorial point of view.</span></li>
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>Your first cut in BitterClip, linked back to the full source.</span></li>
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>A review link you can share and a cut you can keep directing.</span></li>
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>A repeatable way to turn future conversations into publishable work.</span></li>
        </ul>
      </div>
    </section>

    <section aria-labelledby="founder-faq" class="mx-auto max-w-4xl px-6 pb-20 sm:px-8 sm:pb-24">
      <h2 id="founder-faq" class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">A few practical questions</h2>
      <div class="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        <details v-for="item in questions" :key="item.question" class="group py-6">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]">
            {{ item.question }}
            <span class="text-[#f28f84] transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p class="mt-4 max-w-3xl leading-relaxed text-zinc-400">{{ item.answer }}</p>
        </details>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 pb-10 sm:px-8">
      <div class="rounded-[2rem] border border-[#f28f84]/25 bg-[radial-gradient(circle_at_top_right,rgba(242,143,132,0.16),transparent_45%),rgba(255,255,255,0.025)] p-8 sm:p-12">
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#f28f84]">Founder-led onboarding</p>
        <h2 class="mt-4 max-w-3xl font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">Bring the company you can&rsquo;t stop talking about.</h2>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">We&rsquo;ll turn that energy into the first cut—then BitterClip stays with you for every recording after it.</p>
        <a
          :href="finalSignupUrl"
          data-bc-event="hero_cta_click"
          data-bc-placement="founder_onboarding_final"
          data-bc-plan="creator"
          class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >Make my first founder video <span aria-hidden="true">→</span></a>
        <p class="mt-4 font-mono text-[0.68rem] text-zinc-500">Up to 100 sessions while onboarding capacity remains · Card required · $0 today · $24/month after seven days</p>
      </div>
    </section>
  </main>
</template>
