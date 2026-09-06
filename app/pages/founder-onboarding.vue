<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildSignupUrl, FOUNDER_OFFER_ID } from '~/utils/signup-attribution'

const route = useRoute()
const canonicalUrl = 'https://bitterclip.com/founder-onboarding/'
const availabilityEndpoint = 'https://app.bitterclip.com/founder-availability'
const hostTimeZone = 'Asia/Hong_Kong'
const firstOfferDate = '2026-09-07'
const lastOfferDate = '2026-11-05'
const offerEndExclusiveDate = '2026-11-06'

type PreviewState = 'loading' | 'ready' | 'empty' | 'unavailable' | 'closed'
type FounderSlot = { startAt: string, endAt: string }

const previewState = ref<PreviewState>('loading')
const previewMessage = ref('Checking the live schedule now. If it does not load, contact Michael before starting.')
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
    answer: 'Yes, for eligible Founder First 100 customers while campaign capacity remains. After you verify your identity and start the card-required Creator trial, you can choose an available time in BitterClip. Starting the trial does not reserve a particular time.',
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
    answer: 'Check the live preview before starting the trial. You can begin with your own recording and use BitterClip on your own, or contact Michael before checkout if the founder session is the reason you are joining. Previewing a time does not reserve it; you confirm your time in BitterClip after the trial starts.',
  },
  {
    id: 'trial',
    question: 'What does the Creator trial cost?',
    answer: 'The seven-day trial requires a card and charges $0 today. It becomes $24/month unless you cancel before the trial ends. The trial includes one Recording up to two hours and $5 of agent work for analysis, the First Cut, and continued direction. Trial Exports are watermarked; clean Exports begin after the first successful $24 payment.',
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
  return { from, to: [addIsoDays(from, 7), offerEndExclusiveDate].sort()[0] }
}

const cleanMessage = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean ? clean.slice(0, 180) : null
}

const parseSlots = (value: unknown, range: { from: string, to: string }): FounderSlot[] => {
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
    const startDate = isoDateInZone(new Date(start), hostTimeZone)
    if (start <= Date.now() || startDate < range.from || startDate >= range.to) continue
    const key = `${start}/${end}`
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

const viewerTimeZoneLabel = computed(() => {
  try {
    const reference = previewSlots.value[0]?.startAt
      ? new Date(previewSlots.value[0].startAt)
      : new Date()
    const name = new Intl.DateTimeFormat(undefined, {
      timeZone: viewerTimeZone.value,
      timeZoneName: 'long',
    }).formatToParts(reference).find((part) => part.type === 'timeZoneName')?.value
    return name || viewerTimeZone.value.replaceAll('_', ' ')
  } catch {
    return viewerTimeZone.value.replaceAll('_', ' ')
  }
})

const loadAvailability = async () => {
  const previousController = previewController
  previewController = null
  previousController?.abort()
  if (previewTimeout) clearTimeout(previewTimeout)
  previewTimeout = null
  previewSlots.value = []
  previewState.value = 'loading'
  previewMessage.value = 'Checking the live schedule now. If it does not load, contact Michael before starting.'

  const range = previewRange()
  if (!range) {
    previewState.value = 'closed'
    previewMessage.value = 'Online founder-session times ended on November 5, 2026. Contact Michael before starting if the included session is why you are joining.'
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  previewController = controller
  previewTimeout = timeout
  try {
    const url = new URL(availabilityEndpoint)
    url.searchParams.set('from', range.from)
    url.searchParams.set('to', range.to)
    const response = await fetch(url, {
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`availability response ${response.status}`)
    const payload = await response.json() as Record<string, unknown>
    if (payload.timezone !== hostTimeZone || payload.durationMinutes !== 30 || typeof payload.available !== 'boolean') {
      throw new Error('availability contract mismatch')
    }

    if (previewController !== controller) return
    const validSlots = parseSlots(payload.slots, range).slice(0, 6)
    const hasAvailableSlots = payload.available && validSlots.length > 0
    previewSlots.value = hasAvailableSlots ? validSlots : []
    const serviceMessage = cleanMessage(payload.message)
    previewMessage.value = hasAvailableSlots
      ? `${previewSlots.value.length} live ${previewSlots.value.length === 1 ? 'time is' : 'times are'} shown below. ${serviceMessage || 'After your trial starts, choose and confirm one in BitterClip. Previewing it here does not reserve it.'}`
      : serviceMessage || 'There are no bookable times in this seven-day window. Check again later or contact Michael before starting.'
    previewState.value = hasAvailableSlots ? 'ready' : 'empty'
  } catch {
    if (previewController !== controller) return
    previewState.value = 'unavailable'
    previewMessage.value = 'We could not check live times. Try again, start with your own recording, or contact Michael before checkout if the session is essential to you.'
  } finally {
    clearTimeout(timeout)
    if (previewController === controller) previewController = null
    if (previewTimeout === timeout) previewTimeout = null
  }
}

onMounted(() => {
  viewerTimeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || hostTimeZone
  void loadAvailability()
})

onBeforeUnmount(() => {
  if (previewTimeout) clearTimeout(previewTimeout)
  const controller = previewController
  previewController = null
  controller?.abort()
})

const pageDescription = 'Start a qualifying Creator trial, then book an included 30-minute founder session with Michael Ruescher and direct a source-linked First Cut in BitterClip.'

useSeoMeta({
  title: 'Founder First 100 — direct your first cut with BitterClip',
  description: pageDescription,
  ogTitle: 'Tell me your story. I’ll make the first cut.',
  ogDescription: 'Start a qualifying Creator trial, then book an included 30-minute founder session and direct a source-linked First Cut.',
  ogUrl: canonicalUrl,
  ogType: 'website',
  ogImage: 'https://bitterclip.com/images/bitterclip-og.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tell me your story. I’ll make the first cut.',
  twitterDescription: 'Start a qualifying Creator trial, then book an included 30-minute founder session and direct a source-linked First Cut.',
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
            description: 'Eligible Founder First 100 customers can book one included 30-minute session after starting the card-required Creator trial, while campaign capacity remains.',
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
          I&rsquo;m Michael, the founder of BitterClip. Start the Creator trial, then choose an available time. We&rsquo;ll choose the story and set the direction together. Your source-linked First Cut stays editable in BitterClip; analysis or rendering may finish after our 30-minute call.
        </p>
        <div class="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            :href="heroSignupUrl"
            data-bc-event="hero_cta_click"
            data-bc-placement="founder_onboarding_hero"
            data-bc-plan="creator"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] shadow-[0_8px_40px_-6px_rgba(242,143,132,0.42)] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >Start trial, then book <span aria-hidden="true">→</span></a>
          <a class="rounded-full px-1 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]" href="#availability">
            Check upcoming times
          </a>
        </div>
        <p class="mt-5 max-w-xl text-sm leading-relaxed text-zinc-400">
          Eligible Founder First 100 customers while campaign capacity remains · Card required · $0 today · $24/month after seven days unless canceled · starting the trial does not reserve a session time
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
            Your seven-day trial starts after you complete checkout. See the next seven days here. Previewing a time doesn&rsquo;t reserve it.
          </p>
          <p class="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Online sessions run September 7 through November 5, 2026, while times and campaign capacity remain.
          </p>
        </div>

        <div class="rounded-3xl border border-white/[0.09] bg-black/25 p-6 shadow-xl shadow-black/20 sm:p-8" :data-bc-availability-state="previewState" :aria-busy="previewState === 'loading'">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="font-mono text-xs uppercase tracking-[0.18em] text-zinc-400">30-minute founder session</p>
              <h3 class="mt-2 font-display text-2xl font-semibold text-white">{{ previewHeading }}</h3>
            </div>
            <span v-if="previewState === 'ready'" class="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-emerald-200">Live preview</span>
          </div>

          <div>
            <ul v-if="previewState === 'ready'" :aria-label="`Upcoming founder session times in ${viewerTimeZoneLabel}`" class="mt-6 grid gap-3 sm:grid-cols-2">
              <li v-for="slot in previewSlots" :key="slot.startAt" class="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 font-mono text-xs leading-relaxed text-zinc-200">
                <time :datetime="slot.startAt">{{ formatSlot(slot) }}</time>
              </li>
            </ul>
            <div v-else-if="previewState === 'loading'" class="mt-6 grid gap-3 sm:grid-cols-2" aria-hidden="true">
              <div v-for="index in 4" :key="index" class="h-12 animate-pulse rounded-xl bg-white/[0.045]" />
            </div>
            <p class="mt-5 text-sm leading-relaxed text-zinc-400" role="status" aria-live="polite" aria-atomic="true" :aria-label="previewMessage">{{ previewMessage }}</p>
          </div>

          <p v-if="previewState === 'ready'" class="mt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Times use your device timezone: {{ viewerTimeZoneLabel }}. You confirm the exact time in BitterClip after your trial starts.
          </p>
          <div class="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <span v-if="previewState === 'loading'" class="min-h-11 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Live check in progress</span>
            <a
              v-else-if="previewState === 'ready'"
              :href="availabilitySignupUrl"
              data-bc-event="hero_cta_click"
              data-bc-placement="founder_onboarding_availability"
              data-bc-plan="creator"
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f28f84] px-6 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
            >Start trial, then book <span class="ml-2" aria-hidden="true">→</span></a>
            <button
              v-else-if="previewState === 'unavailable'"
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f28f84]/60 px-6 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#ffd0c7] transition hover:border-[#f28f84] hover:bg-[#f28f84]/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @click="loadAvailability"
            >Try live times again</button>
            <a
              v-if="previewState === 'empty' || previewState === 'unavailable' || previewState === 'closed'"
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
      <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-400">One source. One working edit.</p>
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
        <p class="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-zinc-400">What the trial includes</p>
        <h2 class="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">A real cut, with the terms in view.</h2>
        <p class="mt-6 text-lg leading-relaxed text-zinc-400">
          The Creator trial includes one Recording up to two hours and $5 of agent work for analysis, the First Cut, and continued direction. Processing or rendering can continue after the founder session.
        </p>
        <p class="mt-5 text-sm leading-relaxed text-zinc-400">
          Only upload media you have the right to use. Recordings and related media are processed to provide BitterClip; read the <NuxtLink class="rounded text-zinc-200 underline decoration-zinc-600 underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]" to="/privacy">Privacy Policy</NuxtLink> and <NuxtLink class="rounded text-zinc-200 underline decoration-zinc-600 underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]" to="/terms">Terms</NuxtLink> before sharing sensitive conversations.
        </p>
      </div>
      <div class="rounded-3xl border border-[#f28f84]/20 bg-[#f28f84]/[0.055] p-7 sm:p-9">
        <p class="font-display text-2xl font-semibold text-white">Your working result</p>
        <ul class="mt-6 space-y-4 text-zinc-300">
          <li class="flex gap-3"><span class="text-[#f28f84]" aria-hidden="true">●</span><span>One included 30-minute founder session if you qualify and campaign capacity remains.</span></li>
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
        <p class="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">We&rsquo;ll set its direction together. Your source-linked First Cut stays editable in BitterClip, even when analysis or rendering continues after the call.</p>
        <a
          :href="finalSignupUrl"
          data-bc-event="hero_cta_click"
          data-bc-placement="founder_onboarding_final"
          data-bc-plan="creator"
          class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f28f84] px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#20100c] transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >Start trial, then book <span aria-hidden="true">→</span></a>
        <p class="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">Up to 100 sessions while campaign capacity remains · Card required · $0 today · $24/month after seven days unless canceled · trial Exports are watermarked</p>
      </div>
    </section>
  </main>
</template>
