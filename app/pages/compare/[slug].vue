<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'
import { compareMethodology, compareTally } from '~/utils/compare-methodology'
import { BITTERCLIP_BUSINESS, BITTERCLIP_CATCH, BITTERCLIP_PLANS, BITTERCLIP_TRIAL, COMPARE_CATEGORIES, compareRank, fillCompareTokens, PROOF_NOTE_DEFAULT, PROOF_STEPS } from '~/utils/compare-plans'

const siteOrigin = 'https://bitterclip.com'
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : String(route.params.slug)
const pagePath = `/compare/${slug}`

const { data: page } = await useAsyncData(`compare:${pagePath}`, () =>
  queryCollection('compare').path(pagePath).first(),
{ transform: fillCompareTokens })

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Comparison not found', fatal: true })
}

// Related matchups: the same kind of tool first, so a Riverside reader is
// offered Zoom and Podcastle, not whatever sorts first alphabetically.
const { data: siblings } = await useAsyncData(`compare:siblings:${pagePath}`, () =>
  queryCollection('compare').order('competitor', 'ASC').all(),
{ transform: fillCompareTokens })
const otherMatchups = computed(() => {
  const others = (siblings.value ?? []).filter((m) => m.path !== pagePath)
  const byDemand = [...others].sort((a, b) => compareRank(a.path) - compareRank(b.path))
  const sameKind = byDemand.filter((m) => page.value?.category && m.category === page.value.category)
  return [...sameKind, ...byDemand.filter((m) => !sameKind.includes(m))].slice(0, 6)
})
const categoryLabel = computed(() =>
  page.value?.category ? COMPARE_CATEGORIES[page.value.category as keyof typeof COMPARE_CATEGORIES] : '',
)

const signupUrl = computed(() => buildSignupUrl({
  baseUrl: SIGNUP_BASE_URL,
  query: route.query,
  plan: 'clip',
  surface: 'comparison',
  landingPath: route.path,
}))

const formatDate = (value?: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

// Per-row verdict, said in words under the job; the winning cell also gets a
// check in its margin. Green means "better here" whichever product it lands
// on, which leaves coral to mean BitterClip's brand and nothing else.
const edgeLabel = (edge: string, competitor: string) => {
  if (edge === 'bitterclip') return 'BitterClip'
  if (edge === 'competitor') return competitor
  return 'Tie'
}

const wins = (row: { edge?: string }, side: 'bitterclip' | 'competitor') => row.edge === side
const verdictTone = (edge?: string) => edge === 'bitterclip' ? 'ours' : edge === 'competitor' ? 'theirs' : 'tie'

// Running score, so the shape of the answer is readable before any row is.
const tally = computed(() => compareTally(page.value?.rows ?? []))

// The table groups rows by stage when the page says which stage each row is,
// and can hide ties so only the real differences remain.
const GROUPS = [
  { key: 'record', label: 'Recording' },
  { key: 'edit', label: 'Editing' },
  { key: 'deliver', label: 'Publishing' },
  { key: 'price', label: 'Price' },
] as const
const onlyDifferences = ref(false)
// Phones show each row's two verdicts side by side; details open on request.
const showDetails = ref(false)
const tableGroups = computed(() => {
  const rows = (page.value?.rows ?? []).filter((r) => !onlyDifferences.value || r.edge !== 'even')
  if (!rows.some((r) => r.group)) return [{ key: 'all', label: '', rows }]
  const known: string[] = GROUPS.map((g) => g.key)
  return [
    ...GROUPS.map((g) => ({ key: g.key, label: g.label, rows: rows.filter((r) => r.group === g.key) })),
    { key: 'other', label: 'Other', rows: rows.filter((r) => !r.group || !known.includes(r.group)) },
  ].filter((g) => g.rows.length)
})
const winnerName = (edge?: string) => edgeLabel(edge ?? 'even', page.value?.competitor ?? '')

// The hero's price row: both products' entry prices, or, where no plan price
// is verified, the table's own price verdict for the competitor.
const glancePlans = [
  { name: 'Creator', price: BITTERCLIP_TRIAL },
  ...BITTERCLIP_PLANS.slice(1).map((plan) => ({ name: plan.name, price: `${plan.price}/month` })),
]
const priceRow = computed(() => page.value?.rows?.find((r) => r.group === 'price'))
// The short "choose" lines finish a sentence ("Choose Zoom if …"); in the
// table they stand alone.
const sentence = (text?: string) => text ? text.charAt(0).toUpperCase() + text.slice(1) : ''

const favorsLabel = (favors: string) => {
  if (favors === 'bitterclip') return 'Where BitterClip wins'
  if (favors === 'competitor') return `Where ${page.value?.competitor} wins`
  return 'Even'
}

// Mobile keeps one way in on screen once the hero's button has scrolled away.
const heroCta = ref<HTMLElement | null>(null)
const showStickyCta = ref(false)
let ctaObserver: IntersectionObserver | undefined
onMounted(() => {
  if (!heroCta.value || typeof IntersectionObserver === 'undefined') return
  ctaObserver = new IntersectionObserver(([entry]) => {
    showStickyCta.value = !entry.isIntersecting && entry.boundingClientRect.top < 0
  })
  ctaObserver.observe(heroCta.value)
})
onBeforeUnmount(() => ctaObserver?.disconnect())

// The table's header row only gets a background once it is stuck under the
// site header; at rest it is type on the page like everything else.
const tableTop = ref<HTMLElement | null>(null)
const headStuck = ref(false)
let headObserver: IntersectionObserver | undefined
onMounted(() => {
  if (!tableTop.value || typeof IntersectionObserver === 'undefined') return
  headObserver = new IntersectionObserver(([entry]) => {
    headStuck.value = !entry.isIntersecting && entry.boundingClientRect.top < 100
  }, { rootMargin: '-72px 0px 0px 0px' })
  headObserver.observe(tableTop.value)
})
onBeforeUnmount(() => headObserver?.disconnect())

const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
// How the page was made, stated with this page's own numbers. The Markdown
// twin renders the same items (modules/generated-surfaces.ts).
const sourceFileUrl = computed(() => site.value ? `${site.value.source_repo}/blob/main/content/compare/${slug}.md` : '')
const methodology = computed(() => page.value && site.value
  ? compareMethodology(page.value, sourceFileUrl.value)
  : [])

// The two customer quotes already running on the homepage (signed off
// 2026-06-10), verbatim. Andrew speaks for long client-session footage; Rohan
// for the clip-friction that sends people to auto-clippers. Pick by matchup.
const TESTIMONIALS = {
  andrew: {
    name: 'Andrew Williams',
    role: 'Head Coach',
    org: 'Strength & Positions',
    orgUrl: 'https://www.strengthandpositions.com/coaches',
    photo: '/images/andrew_williams_strength_and_positions_coach.jpg',
    before: 'Working through session footage is ',
    key: 'the worst three hours of my week — and the most important.',
    after: ' It’s how I remember exactly what happened with a client and build on it next session.',
  },
  rohan: {
    name: 'Rohan Karunakaran',
    role: 'Founder',
    org: 'Frontier Studio',
    orgUrl: 'https://www.frontier-studio.com/',
    photo: '/images/rohan_karunakaran.jpg',
    before: 'The friction was the whole problem with founder content — timestamps, clunky editors, the back-and-forth on every clip. ',
    key: 'Now I make the clips inside Claude, while I’m already in there.',
    after: '',
  },
} as const

const SESSION_FOOTAGE_MATCHUPS = new Set(['descript', 'riverside', 'zoom', 'podcastle', 'captions', 'veed', 'kapwing'])
const testimonial = computed(() =>
  SESSION_FOOTAGE_MATCHUPS.has(slug) ? TESTIMONIALS.andrew : TESTIMONIALS.rohan,
)

const canonicalUrl = `${siteOrigin}${pagePath}`
const markdownUrl = `${canonicalUrl}.md`

useHead(() => {
  const title = page.value?.title ?? 'BitterClip comparison'
  const description = page.value?.description ?? ''
  const faq = Array.isArray(page.value?.faq) ? page.value.faq : []
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
  // What the page is about, when it was checked, and what it rests on, for
  // crawlers that read schema.org rather than the prose.
  const pageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#page`,
    url: canonicalUrl,
    name: title,
    description,
    abstract: page.value?.shortAnswer,
    dateModified: page.value?.updated ?? page.value?.reviewed,
    lastReviewed: page.value?.reviewed,
    breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      '@id': 'https://company.sheetgenius.com/#organization',
      name: 'SheetGenius, Inc.',
      url: 'https://company.sheetgenius.com',
    },
    about: [
      {
        '@type': 'SoftwareApplication',
        name: 'BitterClip',
        url: `${siteOrigin}/`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: BITTERCLIP_PLANS.map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          price: plan.price.replace('$', ''),
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: plan.price.replace('$', ''),
            priceCurrency: 'USD',
            unitText: 'month',
          },
          description: plan.name === 'Creator'
            ? `${BITTERCLIP_TRIAL}. ${plan.includes.join('; ')}. ${BITTERCLIP_CATCH}`
            : plan.includes.join('; '),
        })),
      },
      {
        '@type': 'SoftwareApplication',
        name: page.value?.competitor,
        url: page.value?.competitorUrl,
      },
    ],
    citation: (page.value?.sources ?? []).map((source) => ({
      '@type': 'CreativeWork',
      name: source.label,
      url: source.url,
    })),
  }
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Compare', item: `${siteOrigin}/compare` },
      { '@type': 'ListItem', position: 2, name: `BitterClip vs ${page.value?.competitor ?? ''}`, item: canonicalUrl },
    ],
  }

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', type: 'text/markdown', href: markdownUrl, title: `${title} Markdown` },
    ],
    script: [
      { type: 'application/ld+json', innerHTML: JSON.stringify(pageStructuredData) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(faqStructuredData) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbStructuredData) },
    ],
  }
})
</script>

<template>
  <main v-if="page" class="relative">

    <!-- ============================ HERO ============================ -->
    <!-- Answer first, in words and one small table: most readers of this page
         are search crawlers and other people's agents, which read the text in
         order and quote the first self-contained facts they find. Pages
         without a short answer keep the long-form hero below. -->
    <section v-if="page.shortAnswer" class="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
      <div class="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-400">
        <NuxtLink
          to="/compare"
          class="transition hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
        >← All comparisons</NuxtLink>
        <span aria-hidden="true" class="hidden text-zinc-700 sm:inline">·</span>
        <a href="#method" class="transition hover:text-white">Checked <time :datetime="page.reviewed">{{ formatDate(page.reviewed) }}</time> against {{ page.sources?.length ?? 0 }} public sources</a>
      </div>

      <h1 class="font-display text-[2.6rem] sm:text-6xl font-bold tracking-[-0.04em] text-white leading-[1.02]">
        BitterClip <span class="text-zinc-600 font-normal">vs</span>{{ ' ' }}<span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent">{{ page.competitor }}</span>
      </h1>
      <p class="mt-5 max-w-3xl text-lg sm:text-2xl text-zinc-200 leading-[1.45] text-balance">{{ page.shortAnswer }}</p>

      <table class="compare-glance mt-9 w-full border-collapse text-left">
        <caption class="sr-only">BitterClip and {{ page.competitor }} at a glance</caption>
        <thead>
          <tr>
            <td class="w-[18%]" />
            <th scope="col" class="w-[41%] pb-3 text-[13px] font-semibold tracking-wide text-[#f28f84]">BitterClip</th>
            <th scope="col" class="w-[41%] pb-3 text-[13px] font-semibold tracking-wide text-zinc-200">{{ page.competitor }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Choose it if</th>
            <td><span class="cell-label cell-label--ours" aria-hidden="true">BitterClip<span class="sr-only">: </span></span>{{ sentence(page.chooseUsShort) }}</td>
            <td><span class="cell-label" aria-hidden="true">{{ page.competitor }}<span class="sr-only">: </span></span>{{ sentence(page.chooseThemShort) }}</td>
          </tr>
          <tr>
            <th scope="row">Price</th>
            <td>
              <span class="cell-label cell-label--ours" aria-hidden="true">BitterClip<span class="sr-only">: </span></span>
              <span v-for="plan in glancePlans" :key="plan.name" class="block">
                <span class="text-zinc-400">{{ plan.name }}</span> {{ plan.price }}
              </span>
            </td>
            <td>
              <span class="cell-label" aria-hidden="true">{{ page.competitor }}<span class="sr-only">: </span></span>
              <span v-if="page.freePlan" class="block"><span class="text-zinc-400">Free</span> {{ page.freePlan }}</span>
              <template v-if="page.pricing">
                <span class="block"><span class="text-zinc-400">{{ page.pricing.plan }}</span> {{ page.pricing.price }}</span>
                <span v-if="page.pricing.note" class="block text-zinc-400">{{ page.pricing.note }}</span>
              </template>
              <template v-else-if="priceRow">
                <span class="block">{{ priceRow.competitor.lead }}</span>
                <span class="block text-zinc-400">{{ priceRow.competitor.detail }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <div ref="heroCta" class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          :href="signupUrl"
          class="btn-glow inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Try it on one recording
          <span aria-hidden="true">→</span>
        </a>
        <a
          href="#pricing"
          class="text-sm text-zinc-300 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
        >What each plan includes</a>
      </div>
    </section>

    <section v-else class="mx-auto max-w-6xl px-4 pt-10 sm:pt-16">
      <NuxtLink
        to="/compare"
        class="inline-block mb-8 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 transition hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
      >
        ← All comparisons
      </NuxtLink>

      <div class="max-w-3xl">
        <p class="telemetry-label mb-5">
          Comparison
          <span class="mx-2 text-zinc-700">/</span>
          <span class="text-zinc-500">Checked {{ formatDate(page.reviewed) }}</span>
        </p>

        <h1 class="font-display text-5xl sm:text-7xl font-bold tracking-[-0.04em] text-white leading-[0.98] mb-7">
          BitterClip
          <span class="text-zinc-600 font-normal">vs</span>
          <span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent block">{{ page.competitor }}</span>
        </h1>

        <p class="text-zinc-300 text-lg sm:text-2xl leading-[1.55] max-w-2xl text-balance">{{ page.heroLede }}</p>

        <p v-if="page.competitorStrength" class="mt-7 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-sm">
          <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Where {{ page.competitor }} wins</span>
          <span class="text-zinc-300">{{ page.competitorStrength }}</span>
        </p>

        <nav aria-label="On this page" class="mt-9 flex flex-wrap gap-2">
          <a
            v-for="link in [
              { href: '#comparison', label: 'The comparison' },
              { href: '#fine-print', label: 'Fine print' },
              { href: '#faq', label: 'FAQ' },
              { href: '#method', label: 'How we compared' },
            ]"
            :key="link.href"
            :href="link.href"
            class="rounded-full border border-white/[0.09] bg-white/[0.02] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-[#f28f84]/35 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
          >{{ link.label }}</a>
        </nav>
      </div>

      <div class="telemetry-ruler mt-12 sm:mt-16" aria-hidden="true" />
    </section>

    <aside
      v-if="page.statusNote"
      class="mx-auto max-w-6xl px-4 mt-10"
    >
      <p class="max-w-3xl rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5 text-sm text-amber-100/90 leading-relaxed">
        {{ page.statusNote }}
      </p>
    </aside>

    <!-- ===================== WHAT ACTUALLY DIFFERS ===================== -->
    <section v-if="page.keyDifferences?.length" aria-labelledby="differs-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24">
      <h2 id="differs-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
        What differs
      </h2>
      <div class="mt-7 grid gap-x-10 gap-y-9 md:grid-cols-3">
        <article
          v-for="diff in page.keyDifferences"
          :key="diff.title"
          class="border-t-2 pt-5"
          :class="diff.favors === 'bitterclip' ? 'border-[#f28f84]/60' : 'border-white/25'"
        >
          <p
            class="text-[12px] font-semibold uppercase tracking-[0.12em]"
            :class="diff.favors === 'bitterclip' ? 'text-[#f28f84]' : 'text-zinc-300'"
          >{{ favorsLabel(diff.favors) }}</p>
          <h3 class="mt-2 font-display text-xl font-bold leading-snug text-white">{{ diff.title }}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-zinc-300">{{ diff.body }}</p>
        </article>
      </div>
    </section>

    <!-- Long-form verdicts, for pages that have not moved to the answer-first hero. -->
    <section v-if="!page.shortAnswer" aria-label="The short answer" class="mx-auto max-w-6xl px-4 pt-14 sm:pt-20">
      <div class="grid gap-4 md:grid-cols-2">
        <article class="glass-panel-accented rounded-2xl corner-ticks p-7 sm:p-8">
          <p class="font-mono text-[10px] uppercase tracking-[0.18em] text-[#f28f84] mb-4">Pick BitterClip</p>
          <p class="text-[15px] sm:text-base text-zinc-200 leading-[1.7]">{{ page.verdictBitterclip }}</p>
        </article>
        <article class="glass-panel rounded-2xl p-7 sm:p-8">
          <p class="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 mb-4">Pick {{ page.competitor }}</p>
          <p class="text-[15px] sm:text-base text-zinc-400 leading-[1.7]">{{ page.verdictCompetitor }}</p>
        </article>
      </div>
    </section>

    <!-- ========================= COMPARISON ========================= -->
    <section id="comparison" aria-labelledby="comparison-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 scroll-mt-24">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="comparison-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
            Job by job
          </h2>
          <p class="mt-2 text-sm text-zinc-300">
            BitterClip better on <strong class="text-white tabular-nums">{{ tally.bitterclip }}</strong>,
            {{ page.competitor }} better on <strong class="text-white tabular-nums">{{ tally.competitor }}</strong>,
            tie on <strong class="text-white tabular-nums">{{ tally.even }}</strong>.
            <a href="#method" class="text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-white">How we score</a>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Rows to show" class="inline-flex rounded-lg border border-white/[0.1] bg-white/[0.02] p-1 text-sm">
            <button
              type="button"
              role="radio"
              class="compare-toggle rounded-md px-3 py-1.5 transition"
              :class="!onlyDifferences ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-white'"
              :aria-checked="!onlyDifferences"
              @click="onlyDifferences = false"
            >All {{ tally.total }}</button>
            <button
              type="button"
              role="radio"
              class="compare-toggle rounded-md px-3 py-1.5 transition"
              :class="onlyDifferences ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-white'"
              :aria-checked="onlyDifferences"
              @click="onlyDifferences = true"
            >Only differences ({{ tally.bitterclip + tally.competitor }})</button>
          </div>
          <button
            type="button"
            class="compare-toggle rounded-lg border border-white/[0.1] px-3 py-2 text-sm text-zinc-300 md:hidden"
            :aria-pressed="showDetails"
            @click="showDetails = !showDetails"
          >{{ showDetails ? 'Hide details' : 'Show details' }}</button>
        </div>
      </div>

      <!-- Set like a table in a book: hairlines between rows, section headings
           in type, no boxes and no column rules. The verdict is said once, in
           words, under each job; a check hangs in the margin of the winning
           cell; both columns stay equally readable. Below md the rows reflow so
           a phone never side-scrolls. -->
      <div ref="tableTop" aria-hidden="true" class="h-px" />
      <div :class="{ 'show-details': showDetails, 'head-stuck': headStuck }" class="compare-table-wrap">
        <table class="compare-table w-full border-collapse text-left">
          <caption class="sr-only">Comparison of BitterClip and {{ page.competitor }}, job by job</caption>
          <colgroup>
            <col class="w-[24%]">
            <col class="w-[38%]">
            <col class="w-[38%]">
          </colgroup>
          <thead>
            <tr>
              <th scope="col" class="compare-head text-zinc-500">The job</th>
              <th scope="col" class="compare-head compare-head--product text-[#f28f84]">BitterClip</th>
              <th scope="col" class="compare-head compare-head--product text-white">{{ page.competitor }}</th>
            </tr>
          </thead>
          <tbody v-for="group in tableGroups" :key="group.key">
            <tr v-if="group.label" class="compare-group">
              <th colspan="3" scope="rowgroup" class="font-display">{{ group.label }}</th>
            </tr>
            <tr v-for="row in group.rows" :key="row.axis" class="compare-row">
              <th scope="row">
                <span class="compare-job">{{ row.axis }}</span>
                <span class="compare-verdict" :class="`compare-verdict--${verdictTone(row.edge)}`">{{ row.edge === 'even' ? 'Tie' : `${winnerName(row.edge)} better` }}</span>
              </th>
              <td class="compare-cell" :class="{ 'compare-cell--win': wins(row, 'bitterclip') }">
                <span class="cell-label cell-label--ours" aria-hidden="true">BitterClip<span class="sr-only">: </span></span>
                <span class="compare-lead">{{ row.bitterclip.lead }}</span>
                <span class="compare-detail">{{ row.bitterclip.detail }}</span>
              </td>
              <td class="compare-cell" :class="{ 'compare-cell--win': wins(row, 'competitor') }">
                <span class="cell-label" aria-hidden="true">{{ page.competitor }}<span class="sr-only">: </span></span>
                <span class="compare-lead">{{ row.competitor.lead }}</span>
                <span class="compare-detail">{{ row.competitor.detail }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =========================== PRICING =========================== -->
    <section id="pricing" aria-labelledby="pricing-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 scroll-mt-24">
      <h2 id="pricing-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
        What you'd pay
      </h2>
      <div class="mt-7 grid gap-4" :class="page.pricing ? 'md:grid-cols-2' : ''">
        <article class="flex flex-col rounded-2xl border border-[#f28f84]/25 bg-[#f28f84]/[0.04] p-6 sm:p-7">
          <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#f28f84]">BitterClip</p>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div v-for="plan in BITTERCLIP_PLANS" :key="plan.name">
              <p class="text-sm text-zinc-300">{{ plan.name }}</p>
              <p class="mt-1 font-display text-3xl font-bold text-white">{{ plan.price }}<span class="text-base font-medium text-zinc-400">/month</span></p>
              <ul class="mt-3 space-y-1.5 text-sm text-zinc-300">
                <li v-for="item in plan.includes" :key="item" class="flex gap-2"><span aria-hidden="true" class="text-[#f28f84]">·</span>{{ item }}</li>
              </ul>
            </div>
          </div>
          <p class="mt-5 text-sm leading-relaxed text-zinc-300">
            <span class="font-semibold text-white">The catch:</span> {{ BITTERCLIP_CATCH }}
          </p>
          <div class="mt-auto pt-6">
            <a
              :href="signupUrl"
              class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f28f84] px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >Start Creator: {{ BITTERCLIP_TRIAL }} <span aria-hidden="true">→</span></a>
          </div>
        </article>
        <article v-if="page.pricing" class="flex flex-col rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6 sm:p-7">
          <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-300">{{ page.competitor }}</p>
          <p class="mt-4 text-sm text-zinc-300">{{ page.pricing.plan }}</p>
          <p class="mt-1 font-display text-3xl font-bold text-white">{{ page.pricing.price }}</p>
          <p v-if="page.pricing.note" class="mt-1 text-sm text-zinc-400">{{ page.pricing.note }}</p>
          <ul class="mt-3 space-y-1.5 text-sm text-zinc-300">
            <li v-for="item in page.pricing.includes" :key="item" class="flex gap-2"><span aria-hidden="true" class="text-zinc-500">·</span>{{ item }}</li>
          </ul>
          <p class="mt-auto pt-6 text-sm leading-relaxed text-zinc-300">
            <span class="font-semibold text-white">The catch:</span> {{ page.pricing.catch }}
            <a :href="page.pricing.sourceUrl" rel="noopener nofollow" target="_blank" class="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white">Source</a>
          </p>
        </article>
      </div>
      <div class="mt-7 max-w-3xl">
        <h3 class="text-[15px] font-semibold text-white">How we make money</h3>
        <p class="mt-1.5 text-[15px] leading-relaxed text-zinc-300">{{ BITTERCLIP_BUSINESS }}</p>
      </div>
    </section>

    <!-- ========================== SWITCHING ========================== -->
    <section v-if="page.switching?.length" aria-labelledby="switching-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24">
      <h2 id="switching-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
        Coming from {{ page.competitor }}
      </h2>
      <ol class="mt-7 grid gap-4 md:grid-cols-3">
        <li v-for="(step, index) in page.switching" :key="step" class="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6">
          <span class="font-display text-2xl font-bold text-[#f28f84] tabular-nums">{{ index + 1 }}</span>
          <p class="mt-2 text-[15px] leading-relaxed text-zinc-200">{{ step }}</p>
        </li>
      </ol>
      <a
        v-if="page.switchingLink"
        :href="page.switchingLink.url"
        class="mt-5 inline-block text-sm text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white"
      >{{ page.switchingLink.label }} →</a>
    </section>

    <!-- ============================ PROOF ============================
         The same product the table describes, shown: a real cut, made from a
         recorded Zoom conversation. -->
    <section v-if="page.shortAnswer" id="proof" aria-labelledby="proof-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 scroll-mt-24">
      <div class="grid items-center gap-8 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-14">
        <figure class="mx-auto w-full max-w-[290px] overflow-hidden rounded-2xl border border-white/[0.1] bg-black shadow-2xl shadow-black/60">
          <DeferredVideo
            class="block aspect-[9/16] w-full bg-black"
            poster="/clips/day-1-sizzle-poster.jpg"
            src="/clips/day-1-sizzle.mp4"
            type="video/mp4"
            controls
            playsinline
            width="1080"
            height="1920"
            title="A one-minute cut BitterClip made from a recorded Zoom conversation"
            data-bc-proof-video
            data-bc-placement="comparison_proof"
          />
        </figure>
        <div>
          <h2 id="proof-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">One conversation. The cut you'd send.</h2>
          <p class="mt-4 max-w-xl text-lg leading-relaxed text-zinc-300">
            {{ page.proofNote || PROOF_NOTE_DEFAULT }}
          </p>
          <ol class="mt-6 max-w-xl space-y-3 text-[15px] text-zinc-300">
            <li v-for="(step, index) in PROOF_STEPS" :key="step" class="flex gap-3"><span class="text-[#f28f84] tabular-nums">{{ index + 1 }}</span>{{ step }}</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ========================= TESTIMONIAL ========================= -->
    <section aria-label="Customer" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24">
      <figure class="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:text-left sm:gap-10">
        <div class="shrink-0 flex flex-col items-center gap-3">
          <img
            :src="testimonial.photo"
            :alt="testimonial.name"
            width="120"
            height="120"
            loading="lazy"
            decoding="async"
            class="w-24 h-24 rounded-full object-cover ring-1 ring-white/10 bg-white/[0.04]"
          >
          <figcaption class="text-center text-[12px] leading-relaxed">
            <span class="block font-semibold text-zinc-200">{{ testimonial.name }}</span>
            <span class="block text-zinc-400">{{ testimonial.role }},
              <a :href="testimonial.orgUrl" target="_blank" rel="noopener" class="text-[#f28f84]/90 transition-colors hover:text-[#ffa89e]">{{ testimonial.org }}</a>
            </span>
          </figcaption>
        </div>
        <blockquote class="font-display text-xl sm:text-2xl font-medium tracking-tight leading-[1.55] text-zinc-400 text-balance">
          &ldquo;{{ testimonial.before }}<span class="text-white">{{ testimonial.key }}</span>{{ testimonial.after }}&rdquo;
        </blockquote>
      </figure>
    </section>

    <!-- ========================= FINE PRINT =========================
         Quoted from the competitor's own pricing, help, or terms pages, each
         stamped with where it came from. -->
    <section
      v-if="page.gotchas && page.gotchas.length"
      id="fine-print"
      aria-labelledby="fine-print-heading"
      class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 scroll-mt-24"
    >
      <h2 id="fine-print-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
        Before you pay for {{ page.competitor }}
      </h2>
      <p class="mt-3 max-w-2xl text-zinc-400">From {{ page.competitor }}'s own pricing, help, and terms pages.</p>
      <ol class="mt-7 grid gap-4 md:grid-cols-2">
        <li
          v-for="gotcha in page.gotchas.slice(0, 2)"
          :key="gotcha.title"
          class="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-6"
        >
          <h3 class="font-display text-lg font-bold leading-snug text-white">{{ gotcha.title }}</h3>
          <p class="mt-2 text-sm leading-[1.7] text-zinc-300">{{ gotcha.body }}</p>
          <a
            :href="gotcha.sourceUrl"
            rel="noopener nofollow"
            target="_blank"
            class="mt-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 transition hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
          >
            <span aria-hidden="true">↗</span>
            {{ gotcha.sourceLabel }}
          </a>
        </li>
      </ol>
      <details v-if="page.gotchas.length > 2" class="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <summary class="cursor-pointer px-6 py-4 text-[15px] font-semibold text-white">
          {{ page.gotchas.length - 2 }} more from {{ page.competitor }}'s terms
        </summary>
        <ul class="grid gap-4 px-6 pb-6 md:grid-cols-2">
          <li v-for="gotcha in page.gotchas.slice(2)" :key="gotcha.title">
            <h3 class="font-semibold text-white">{{ gotcha.title }}</h3>
            <p class="mt-1.5 text-sm leading-[1.7] text-zinc-300">{{ gotcha.body }}</p>
            <a :href="gotcha.sourceUrl" rel="noopener nofollow" target="_blank" class="mt-2 inline-block text-[13px] text-zinc-400 hover:text-[#f28f84]">↗ {{ gotcha.sourceLabel }}</a>
          </li>
        </ul>
      </details>
    </section>

    <!-- ============================= FAQ ============================= -->
    <section v-if="page.faq && page.faq.length" id="faq" aria-labelledby="faq-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 scroll-mt-24">
      <div class="max-w-3xl">
        <h2 id="faq-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
          Questions
        </h2>
        <div class="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
          <details v-for="item in page.faq" :key="item.q" class="compare-faq group py-1">
            <summary class="flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-left text-[17px] font-semibold text-white">
              <span>{{ item.q }}</span>
              <span aria-hidden="true" class="mt-0.5 text-zinc-500 transition group-open:rotate-45">+</span>
            </summary>
            <p class="pb-5 text-[15px] leading-[1.75] text-zinc-300">{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ========================= THE LONG VERSION ========================= -->
    <section v-if="page.shortAnswer" class="mx-auto max-w-6xl px-4 pt-10">
      <details class="compare-long max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <summary class="cursor-pointer list-none px-6 py-5 text-[15px] font-semibold text-white">
          Read the full comparison <span aria-hidden="true" class="text-zinc-500">↓</span>
        </summary>
        <div class="px-6 pb-6">
          <div class="grid gap-6 border-b border-white/[0.07] pb-8 md:grid-cols-2">
            <div>
              <h3 class="font-semibold text-white">Choose BitterClip when</h3>
              <ul class="mt-3 space-y-2.5 text-[15px] leading-relaxed text-zinc-300">
                <li v-for="item in page.chooseUs" :key="item" class="flex gap-2.5"><span aria-hidden="true" class="text-[#f28f84]">·</span>{{ item }}</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-white">Choose {{ page.competitor }} when</h3>
              <ul class="mt-3 space-y-2.5 text-[15px] leading-relaxed text-zinc-300">
                <li v-for="item in page.chooseThem" :key="item" class="flex gap-2.5"><span aria-hidden="true" class="text-zinc-500">·</span>{{ item }}</li>
              </ul>
            </div>
          </div>
          <div class="mt-8 space-y-4 text-[15px] leading-relaxed text-zinc-300">
            <p><strong class="text-white">BitterClip.</strong> {{ page.verdictBitterclip }}</p>
            <p><strong class="text-white">{{ page.competitor }}.</strong> {{ page.verdictCompetitor }}</p>
          </div>
          <div class="docs-prose compare-prose mt-8">
            <ContentRenderer :value="page" />
          </div>
        </div>
      </details>
    </section>
    <section v-else class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28">
      <div class="docs-prose compare-prose">
        <ContentRenderer :value="page" />
      </div>
    </section>

    <!-- ======================== HOW WE COMPARED ======================== -->
    <section id="method" aria-labelledby="method-heading" class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24 scroll-mt-24">
      <div class="max-w-3xl">
        <h2 id="method-heading" class="font-display text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
          How we compared
        </h2>
        <dl class="mt-6 space-y-4">
          <div v-for="item in methodology" :key="item.term">
            <dt class="text-[15px] font-semibold text-white">{{ item.term }}</dt>
            <dd class="mt-1 text-[15px] leading-[1.7] text-zinc-300">
              {{ item.detail }}
              <a
                v-if="item.link"
                :href="item.link.url"
                rel="noopener"
                target="_blank"
                class="text-zinc-200 underline decoration-white/25 underline-offset-4 hover:text-white hover:decoration-[#f28f84]"
              >{{ item.link.label }} ↗</a>
            </dd>
          </div>
        </dl>
        <details class="mt-6">
          <summary class="cursor-pointer text-sm text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white">
            All {{ page.sources?.length ?? 0 }} sources, checked {{ formatDate(page.reviewed) }}
          </summary>
          <ul class="mt-4 space-y-2">
            <li v-for="source in page.sources" :key="source.url">
              <a
                class="text-sm text-zinc-400 transition hover:text-[#f28f84]"
                :href="source.url"
                rel="noopener nofollow"
                target="_blank"
              >{{ source.label }} ↗</a>
            </li>
          </ul>
        </details>
      </div>
    </section>

    <!-- ============================= CTA ============================= -->
    <section class="mx-auto max-w-6xl px-4 pt-16 sm:pt-24">
      <div class="cta-glass-panel rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white mb-3 text-balance">
            Bring one session. Leave with the finished cut.
          </h2>
          <p class="text-zinc-300 max-w-xl leading-relaxed">
            {{ BITTERCLIP_TRIAL }}, cancel anytime. The trial takes one recording up to two hours with $5 of AI agent use; trial exports are watermarked.
          </p>
        </div>
        <a
          :href="signupUrl"
          class="btn-glow shrink-0 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-6 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Try it on one recording
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <!-- ====================== RELATED COMPARISONS ====================== -->
    <section v-if="otherMatchups.length" aria-labelledby="siblings-heading" class="mx-auto max-w-6xl px-4 pt-16 pb-24">
      <h2 id="siblings-heading" class="text-[13px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        {{ categoryLabel ? `More comparisons, starting with ${categoryLabel.toLowerCase()}` : 'More comparisons' }}
      </h2>
      <nav aria-label="Other comparisons" class="mt-4 flex flex-wrap gap-2.5">
        <NuxtLink
          v-for="matchup in otherMatchups"
          :key="matchup.path"
          :to="matchup.path"
          class="rounded-full border border-white/[0.09] bg-white/[0.02] px-4 py-2 text-sm text-zinc-300 transition hover:border-[#f28f84]/35 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
        >
          BitterClip vs {{ matchup.competitor }}
        </NuxtLink>
      </nav>
    </section>

    <!-- Mobile: a way in stays on screen after the hero's button scrolls away. -->
    <div
      v-if="page.shortAnswer"
      class="compare-sticky-cta fixed inset-x-3 bottom-3 z-40 md:hidden"
      :class="showStickyCta ? 'is-visible' : ''"
      :aria-hidden="!showStickyCta"
    >
      <a
        :href="signupUrl"
        :tabindex="showStickyCta ? 0 : -1"
        class="flex min-h-12 items-center justify-between rounded-xl bg-[#f28f84] px-5 text-sm font-semibold text-zinc-950 shadow-2xl shadow-black/60"
      >
        <span>Try it on one recording</span>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </main>
</template>

<style scoped>
.compare-prose {
  max-width: 44rem;
}

/* Each cell names its product in real text, so a table flattened by a crawler
   or an agent still says which product a fact belongs to. On desktop the
   column header shows it, so the label is visually hidden; phones show it. */
.cell-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* The job-by-job table, set in type. Base rules are the desktop table; the
   phone layout below overrides them. */
.compare-head {
  padding: 0 0 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  vertical-align: bottom;
}
.compare-head--product {
  padding-left: 1.75rem;
  font-size: 14px;
  letter-spacing: 0.01em;
  text-transform: none;
}

.compare-group th {
  padding: 2.4rem 0 0.8rem;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #fff;
}
.compare-table tbody:first-of-type .compare-group th {
  padding-top: 1.6rem;
}

.compare-row > th,
.compare-row > td {
  padding: 1.2rem 0 1.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: top;
}
.compare-row > td {
  padding-left: 1.75rem;
}

.compare-job {
  display: block;
  padding-right: 1.25rem;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(244 244 245);
}
.compare-verdict {
  display: block;
  margin-top: 0.4rem;
  font-size: 13px;
  font-weight: 500;
}
.compare-verdict--ours {
  color: #f28f84;
}
.compare-verdict--theirs {
  color: rgb(228 228 231);
}
.compare-verdict--tie {
  color: rgb(125 125 135);
}

.compare-lead {
  position: relative;
  display: block;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: rgb(212 212 216);
}
.compare-detail {
  display: block;
  margin-top: 0.35rem;
  font-size: 15px;
  line-height: 1.55;
  color: rgb(161 161 170);
}
.compare-cell--win .compare-lead {
  color: #fff;
}
.compare-cell--win .compare-detail {
  color: rgb(196 196 204);
}
/* Hung in the gutter, so every lead in a column starts on the same edge. */
.compare-cell--win .compare-lead::before {
  content: '✓';
  position: absolute;
  left: -1.3rem;
  color: #5fd39b;
  font-weight: 700;
}

/* Desktop: the product names stay in view down a ten-row table. */
@media (min-width: 768px) {
  .compare-table thead th {
    position: sticky;
    /* Clear the floating site header. */
    top: 4.5rem;
    z-index: 10;
    padding-top: 0.85rem;
    transition: background-color 0.15s ease;
  }
  .head-stuck .compare-table thead th {
    background: rgba(13, 13, 13, 0.95);
    backdrop-filter: blur(12px);
  }
}

.compare-toggle:focus-visible {
  outline: 2px solid #f28f84;
  outline-offset: 2px;
}

.compare-faq summary::-webkit-details-marker,
.compare-long summary::-webkit-details-marker {
  display: none;
}

/* The hero table is set like text, not like a widget: hairline rules, no
   boxes, the row label in small caps. */
.compare-glance tbody th,
.compare-glance tbody td {
  padding: 0.95rem 1.25rem 0.95rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  vertical-align: top;
}
.compare-glance tbody tr:last-child th,
.compare-glance tbody tr:last-child td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.compare-glance tbody th {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(161 161 170);
  padding-top: 1.15rem;
}
.compare-glance tbody td {
  font-size: 16px;
  line-height: 1.5;
  color: rgb(228 228 231);
}

.compare-sticky-cta {
  opacity: 0;
  transform: translateY(1rem);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.compare-sticky-cta.is-visible {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

/* Mobile: the table stops being a table. Each row becomes a card with the two
   products stacked and labelled, so nothing truncates and nothing side-scrolls. */
@media (max-width: 767px) {
  .compare-glance thead {
    display: none;
  }
  .compare-glance,
  .compare-glance tbody {
    display: block;
  }
  .compare-glance tr {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.9rem 0;
  }
  .compare-glance tbody tr:last-child {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .compare-glance tbody th,
  .compare-glance tbody td {
    border: 0 !important;
    padding: 0;
  }
  .compare-glance tbody th {
    grid-column: 1 / -1;
    margin-bottom: 0.6rem;
  }
  .compare-glance tbody td {
    font-size: 15px;
  }


  /* The job table: each row is the job across the top with its verdict, then
     the two products side by side. Details open on request. */
  .compare-table,
  .compare-table tbody,
  .compare-table tr,
  .compare-table th,
  .compare-table td {
    display: block;
    width: 100%;
  }
  .compare-table thead,
  .compare-table colgroup {
    display: none;
  }
  .compare-group th {
    padding: 1.9rem 0 0.55rem;
    font-size: 1.15rem;
  }
  .compare-table tr.compare-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
    padding: 0.95rem 0 1.1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .compare-row > th,
  .compare-row > td {
    padding: 0;
    border: 0;
  }
  .compare-row > th {
    grid-column: 1 / -1;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  .compare-job {
    padding-right: 0;
    font-size: 15px;
  }
  .compare-verdict {
    flex-shrink: 0;
    margin-top: 0;
    font-size: 12px;
  }
  .compare-lead {
    font-size: 15px;
  }
  .compare-cell--win .compare-lead::before {
    position: static;
    margin-right: 0.3rem;
  }
  .compare-detail {
    font-size: 14px;
  }
  .compare-table-wrap:not(.show-details) .compare-detail {
    display: none;
  }
  /* Which product each block is, now that the column headers are gone. */
  .cell-label {
    position: static;
    display: block;
    width: auto;
    height: auto;
    margin-bottom: 0.3rem;
    overflow: visible;
    clip: auto;
    white-space: normal;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .cell-label--ours {
    color: rgba(242, 143, 132, 0.85);
  }
}
</style>
