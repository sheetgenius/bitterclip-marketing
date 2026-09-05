<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildSignupUrl, FOUNDER_OFFER_ID } from '~/utils/signup-attribution'

const route = useRoute()
const canonicalUrl = 'https://bitterclip.com/founder-onboarding/'
const availabilityEndpoint = 'https://app.bitterclip.com/founder-availability'
const hostTimeZone = 'Asia/Hong_Kong'
const firstOfferDate = '2026-09-07'
const lastOfferDate = '2026-11-05'

type PreviewState = 'loading' | 'ready' | 'empty' | 'unavailable' | 'closed'
type FounderSlot = { startAt: string, endAt: string }

const previewState = ref<PreviewState>('loading')
const previewMessage = ref('Live times will appear here when the scheduling service responds.')
const previewSlots = ref<FounderSlot[]>([])
const viewerTimeZone = ref(hostTimeZone)
let previewController: AbortController | null = null
let previewTimeout: ReturnType<typeof setTimeout> | null = null

const signupUrlFor = (stage: string, offer = FOUNDER_OFFER_ID) => buildSignupUrl({
  query: route.query,
  plan: 'clip',
  offer,
  surface: 'founder_onboarding',
  stage,
  landingPath: route.path,
})

const heroSignupUrl = computed(() => signupUrlFor('hero'))
const availabilitySignupUrl = computed(() => signupUrlFor('availability'))
const finalSignupUrl = computed(() => signupUrlFor('final'))
const selfServeSignupUrl = computed(() => signupUrlFor('self_serve', ''))

const questions = [
  {
    id: 'included',
    question: 'Is the 30-minute session really included?',
    answer: 'Yes, for eligible Founder First 100 customers while campaign capacity remains. After your identity is verified and the card-backed Creator trial is accepted, you can choose an available time in BitterClip. Starting the trial does not reserve a particular time.',
  },
  {
    id: 'recording',
    question: 'Do I need to bring a recording?',
    answer: 'Bring a podcast appearance, interview, demo, webinar, customer conversation, or other recording when you have one. If the founder session will become your source, Michael will agree the recording and consent details with you before it begins.',
  },
  {
    id: 'session',
    question: 'What happens during the session?',
    answer: 'You and Michael choose the clearest story, review the source, and set the direction for the First Cut. Analysis or rendering may continue after the 30-minute call; the editable result stays in your BitterClip workspace.',
  },
  {
    id: 'availability',
    question: 'What if none of the available times work?',
    answer: 'Check the live preview before starting the trial. You can begin with your own recording and use BitterClip self-serve, or contact Michael before checkout if the founder session is the reason you are joining. No previewed time is held until you confirm it after enrollment.',
  },
  {
    id: 'trial',
    question: 'What does the Creator trial cost?',
    answer: 'The seven-day trial requires a card and charges $0 today. It becomes $24/month unless you cancel before the trial ends. It accepts one Recording up to two hours and includes $5 of agent work for analysis, the First Cut, and continued direction. Trial Exports are watermarked; clean Exports begin after the first successful $24 payment.',
  },
]

const previewHeading = computed(() => {
  if (previewState.value === 'ready') return 'Upcoming times, in your timezone'
  if (previewState.value === 'empty') return 'No open time in the next seven days'
  if (previewState.value === 'closed') return 'The current founder-session window has ended'
  if (previewState.value === 'unavailable') return 'Live availability is temporarily unavailable'
  return 'Checking the next seven days'
})

const isoDateInZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

const addIsoDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

const previewRange = (): { from: string, to: string } | null => {
  const today = isoDateInZone(new Date(), hostTimeZone)
  const from = today < firstOfferDate ? firstOfferDate : today
  if (from > lastOfferDate) return null
  return { from, to: [addIsoDays(from, 6), lastOfferDate].sort()[0] }
}

const cleanMessage = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean ? clean.slice(0, 180) : null
}

const parseSlots = (value: unknown): FounderSlot[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const slots: FounderSlot[] = []
  for (const candidate of value.slice(0, 48)) {
    if (!candidate || typeof candidate !== 'object') continue
    const startAt = (candidate as Record<string, unknown>).startAt
    const endAt = (candidate as Record<string, unknown>).endAt
    if (typeof startAt !== 'string' || typeof endAt !== 'string') continue
    const start = Date.parse(startAt)
    const end = Date.parse(endAt)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start !== 30 * 60 * 1000) continue
    const key = `${startAt}/${endAt}`
    if (seen.has(key)) continue
    seen.add(key)
    slots.push({ startAt, endAt })
  }
  return slots.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
}

const formatSlot = (slot: FounderSlot): string => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: viewerTimeZone.value,
    timeZoneName: 'short',
  })
  const start = new Date(slot.startAt)
  const end = new Date(slot.endAt)
  return typeof formatter.formatRange === 'function'
    ? formatter.formatRange(start, end)
    : `${formatter.format(start)} – ${formatter.format(end)}`
}

const loadAvailability = async () => {
  const range = previewRange()
  if (!range) {
    previewState.value = 'closed'
    previewMessage.value = 'Online times for this fixed campaign window ran through November 5, 2026. Contact Michael before starting if the included session is why you are joining.'
    return
  }

  previewController = new AbortController()
  previewTimeout = setTimeout(() => previewController?.abort(), 6000)
  try {
    const url = new URL(availabilityEndpoint)
    url.searchParams.set('from', range.from)
    url.searchParams.set('to', range.to)
    const response = await fetch(url, {
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal: previewController.signal,
    })
    if (!response.ok) throw new Error(`availability response ${response.status}`)
    const payload = await response.json() as Record<string, unknown>
    if (payload.timezone !== hostTimeZone || payload.durationMinutes !== 30 || typeof payload.available !== 'boolean') {
      throw new Error('availability contract mismatch')
    }

    previewSlots.value = parseSlots(payload.slots).slice(0, 6)
    const hasAvailableSlots = payload.available && previewSlots.value.length > 0
    previewMessage.value = cleanMessage(payload.message) || (
      hasAvailableSlots
        ? 'These are live previews. You choose and confirm one after your trial is accepted.'
        : 'There are no bookable times in this seven-day window. Check again later or contact Michael before starting.'
    )
    previewState.value = hasAvailableSlots ? 'ready' : 'empty'
  } catch {
    previewState.value = 'unavailable'
    previewMessage.value = 'We could not verify live times. You can start with your own recording, or contact Michael before checkout if the session is essential to you.'
  } finally {
    if (previewTimeout) clearTimeout(previewTimeout)
    previewTimeout = null
  }
}

onMounted(() => {
  viewerTimeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || hostTimeZone
  void loadAvailability()
})

onBeforeUnmount(() => {
  if (previewTimeout) clearTimeout(previewTimeout)
  previewController?.abort()
})

const pageDescription = 'Start a qualifying Creator trial, then book an included 30-minute founder session with Michael Ruescher and direct a source-linked First Cut in BitterClip.'

useSeoMeta({
  title: 'Founder First 100 — direct your first cut with BitterClip',
  description: pageDescription,
  ogTitle: 'Tell me your story. I’ll make the first cut.',
  ogDescription: 'An included 30-minute founder session and a source-linked First Cut you can keep directing in BitterClip.',
  ogUrl: canonicalUrl,
  ogType: 'website',
  ogImage: 'https://bitterclip.com/images/bitterclip-og.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tell me your story. I’ll make the first cut.',
  twitterDescription: 'An included 30-minute founder session and a source-linked First Cut you can keep directing in BitterClip.',
  twitterImage: 'https://bitterclip.com/images/bitterclip-og.png',
})

useHead({
  meta: [
    { name: 'bitterclip:offer', content: FOUNDER_OFFER_ID },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/founder-onboarding.md', title: 'BitterClip founder onboarding Markdown' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Founder First 100 with BitterClip',
        url: canonicalUrl,
        description: pageDescription,
        mainEntity: {
          '@type': 'Service',
          name: 'BitterClip founder onboarding session',
          serviceType: 'Video editing onboarding',
          provider: {
            '@type': 'Organization',
            name: 'SheetGenius, Inc.',
            url: 'https://company.sheetgenius.com/',
          },
          performer: {
            '@type': 'Person',
            name: 'Michael Ruescher',
          },
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/LimitedAvailability',
            description: 'One 30-minute session is included for an eligible Founder First 100 customer after a verified, accepted Creator trial while campaign capacity remains.',
          },
        },
      }),
    },
  ],
})
</script>

<template>
  <main class="relative">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden" aria-hidden="true">
      <div class="absolute left-1/2 top-[-18rem] h-[34rem] w-[62rem] -translate-x-1/2 rounded-full bg-[#f28f84]/[0.09] blur-[110px]" />
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    </div>

    <section class="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-20 lg:pb-28">
      <div>
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#f28f84]">
          Founder First 100 · one included 30-minute session
        </p>
        <h1 class="mt-6 max-w-[12ch] font-display text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl">
          Tell me your story.
          <span class="mt-2 block bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">I&rsquo;ll make the first cut.</span>
        </h1>
        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
          I&rsquo;m Michael, the founder of BitterClip. Start the Creator trial, then choose an available time to work with me on the story and direction. Your First Cut stays linked to the source, editable, and ready for more direction after our call.
        </p>
        <div class="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            :href="heroSignupUrl"
            data-bc-event="hero_cta_click"
            data-bc-placement="founder_onboarding_hero"
            data-bc-plan="creator"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.42)] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >Start trial + get my session <span aria-hidden="true">→</span></a>
          <a class="rounded-full px-1 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]" href="#availability">
            Check upcoming times
          </a>
        </div>
        <p class="mt-5 max-w-xl font-mono text-[0.68rem] leading-relaxed text-zinc-500">
          Card required · $0 today · $24/month after seven days unless canceled · starting the trial does not hold a session time
        </p>
      </div>

      <aside class="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="Meet Michael Ruescher">
        <div class="absolute -inset-8 rounded-full bg-[#f28f84]/10 blur-3xl" aria-hidden="true" />
        <div class="relative overflow-hidden rounded-[2rem] border border-white/[0.1] bg-zinc-950/85 p-3 shadow-2xl shadow-black/50">
          <DeferredImage
            class="aspect-square w-full rounded-[1.45rem] object-cover object-top"
            src="/images/founder-onboarding-michael.webp"
            alt="Michael Ruescher, founder of BitterClip"
            width="720"
            height="720"
          />
          <div class="grid gap-4 px-4 pb-4 pt-5 sm:grid-cols-[1fr_auto] sm:items-end sm:px-5">
            <div>
              <p class="font-display text-xl font-semibold text-white">Michael Ruescher</p>
              <p class="mt-1 text-sm text-zinc-400">Founder of BitterClip · your editing partner</p>
            </div>
            <div class="w-fit rounded-full border border-[#f28f84]/25 bg-[#f28f84]/10 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#ffd0c7]">
              30 minutes
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section id="availability" aria-labelledby="availability-title" class="border-y border-white/[0.07] bg-white/[0.018] scroll-mt-24">
      <div class="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.76fr_1.24fr] lg:items-start lg:gap-16">
        <div>
          <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#f28f84]">Before you start the clock</p>
          <h2 id="availability-title" class="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">See whether the timing works.</h2>
          <p class="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
            The trial begins only after secure checkout accepts it. Preview the next seven days here; no anonymous hold or booking is created.
          </p>
        </div>

        <div class="rounded-3xl border border-white/[0.09] bg-black/25 p-6 shadow-xl shadow-black/20 sm:p-8" :data-bc-availability-state="previewState">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-zinc-500">30-minute founder session</p>
              <h3 class="mt-2 font-display text-2xl font-semibold text-white">{{ previewHeading }}</h3>
            </div>
            <span v-if="previewState === 'ready'" class="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-emerald-200">Live preview</span>
          </div>

          <div role="status" aria-live="polite" aria-atomic="true">
            <ul v-if="previewState === 'ready'" class="mt-6 grid gap-3 sm:grid-cols-2">
              <li v-for="slot in previewSlots" :key="slot.startAt" class="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 font-mono text-xs leading-relaxed text-zinc-200">
                <time :datetime="slot.startAt">{{ formatSlot(slot) }}</time>
              </li>
            </ul>
            <div v-else-if="previewState === 'loading'" class="mt-6 grid gap-3 sm:grid-cols-2" aria-hidden="true">
              <div v-for="index in 4" :key="index" class="h-12 animate-pulse rounded-xl bg-white/[0.045]" />
            </div>
            <p class="mt-5 text-sm leading-relaxed text-zinc-400">{{ previewMessage }}</p>
          </div>

          <p v-if="previewState === 'ready'" class="mt-3 font-mono text-[0.66rem] leading-relaxed text-zinc-500">
            Shown in {{ viewerTimeZone }}. You confirm the exact time in BitterClip after enrollment.
          </p>
          <div class="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              v-if="previewState === 'ready'"
              :href="availabilitySignupUrl"
              data-bc-event="hero_cta_click"
              data-bc-placement="founder_onboarding_availability"
              data-bc-plan="creator"
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f28f84] px-6 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
            >Start trial + choose later <span class="ml-2" aria-hidden="true">→</span></a>
            <a
              v-else
              :href="selfServeSignupUrl"
              data-bc-offer-mode="none"
              data-bc-event="hero_cta_click"
              data-bc-placement="founder_onboarding_self_serve"
              data-bc-plan="creator"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-white/[0.14] px-6 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-zinc-100 transition hover:border-white/30 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
            >Start with my own recording <span class="ml-2" aria-hidden="true">→</span></a>
            <a class="rounded px-1 py-2 text-sm text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]" href="mailto:hello@bitterclip.com?subject=Founder%20session%20availability">Ask about timing</a>
          </div>
        </div>
      </div>
    </section>

    <section aria-labelledby="how-it-works" class="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-24">
      <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">One source. One working edit.</p>
      <h2 id="how-it-works" class="mt-4 max-w-3xl font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">
        Start with the strongest recording you have.
      </h2>
      <div class="mt-12 grid gap-5 md:grid-cols-3">
        <article class="rounded-2xl border border-white/[0.08] bg-black/20 p-7">
          <p class="font-mono text-xs font-bold text-[#f28f84]">01 · SOURCE</p>
          <h3 class="mt-5 font-display text-2xl font-semibold text-white">Bring the real story</h3>
          <p class="mt-3 leading-relaxed text-zinc-400">Use an interview, demo, customer conversation, webinar, or another Recording you have the right to share. If the session will be recorded, you agree that first.</p>
        </article>
        <article class="rounded-2xl border border-white/[0.08] bg-black/20 p-7">
          <p class="font-mono text-xs font-bold text-[#f28f84]">02 · DIRECTION</p>
          <h3 class="mt-5 font-display text-2xl font-semibold text-white">Find the point together</h3>
          <p class="mt-3 leading-relaxed text-zinc-400">Michael helps identify the moment that carries the story, then you set the opening, ending, and tone for the First Cut.</p>
        </article>
        <article class="rounded-2xl border border-white/[0.08] bg-black/20 p-7">
          <p class="font-mono text-xs font-bold text-[#f28f84]">03 · FIRST CUT</p>
          <h3 class="mt-5 font-display text-2xl font-semibold text-white">Keep directing the same cut</h3>
          <p class="mt-3 leading-relaxed text-zinc-400">The result stays linked to the full source in BitterClip. Review it, give another direction, and keep the edit history instead of sorting through random clips.</p>
        </article>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-12 px-6 pb-20 sm:px-8 sm:pb-24 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-20">
      <div>
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">What the trial includes</p>
        <h2 class="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">A real cut, with the terms in view.</h2>
        <p class="mt-6 text-lg leading-relaxed text-zinc-400">
          Creator accepts one Recording up to two hours and includes $5 of agent work for analysis, the First Cut, and continued direction. Processing or rendering can continue after the founder session.
        </p>
        <p class="mt-5 text-sm leading-relaxed text-zinc-500">
          Only upload media you have the right to use. Recordings and related media are processed to provide BitterClip; read the <NuxtLink class="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-white" to="/privacy">Privacy Policy</NuxtLink> and <NuxtLink class="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-white" to="/terms">Terms</NuxtLink> before sharing sensitive conversations.
        </p>
      </div>
      <div class="rounded-3xl border border-[#f28f84]/20 bg-[#f28f84]/[0.055] p-7 sm:p-9">
        <p class="font-display text-2xl font-semibold text-white">Your working result</p>
        <ul class="mt-6 space-y-4 text-zinc-300">
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>One included 30-minute founder session for this qualifying campaign offer.</span></li>
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>A source-grounded editorial point of view and First Cut in BitterClip.</span></li>
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>A watermarked trial Export you can review; clean Exports begin after the first successful payment.</span></li>
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>The editable cut and its history, so you can keep directing it after the session.</span></li>
        </ul>
      </div>
    </section>

    <section aria-labelledby="founder-faq" class="mx-auto max-w-4xl px-6 pb-20 sm:px-8 sm:pb-24">
      <h2 id="founder-faq" class="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">A few practical questions</h2>
      <div class="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        <details
          v-for="item in questions"
          :key="item.id"
          class="group py-6"
          data-bc-faq
          data-bc-placement="founder_onboarding_faq"
          :data-bc-faq-id="item.id"
        >
          <summary class="flex cursor-pointer list-none items-center justify-between gap-6 rounded font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]">
            {{ item.question }}
            <span class="text-[#f28f84] transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p class="mt-4 max-w-3xl leading-relaxed text-zinc-400">{{ item.answer }}</p>
        </details>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 pb-10 sm:px-8">
      <div class="rounded-[2rem] border border-[#f28f84]/25 bg-[radial-gradient(circle_at_top_right,rgba(242,143,132,0.16),transparent_45%),rgba(255,255,255,0.025)] p-8 sm:p-12">
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#f28f84]">Founder First 100</p>
        <h2 class="mt-4 max-w-3xl font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">Bring the company you can&rsquo;t stop talking about.</h2>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">We&rsquo;ll turn that energy into a source-linked First Cut—then the edit stays in your hands.</p>
        <a
          :href="finalSignupUrl"
          data-bc-event="hero_cta_click"
          data-bc-placement="founder_onboarding_final"
          data-bc-plan="creator"
          class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >Start trial + get my session <span aria-hidden="true">→</span></a>
        <p class="mt-4 max-w-3xl font-mono text-[0.68rem] leading-relaxed text-zinc-500">Up to 100 sessions while campaign capacity remains · Card required · $0 today · $24/month after seven days unless canceled · trial Exports are watermarked</p>
      </div>
    </section>
  </main>
</template>
