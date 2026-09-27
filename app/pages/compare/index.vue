<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'
import { BITTERCLIP_TRIAL, compareRank, fillCompareTokens } from '~/utils/compare-plans'

const route = useRoute()

const { data: allMatchups } = await useAsyncData('compare:matchups', () =>
  queryCollection('compare').order('competitor', 'ASC').all(),
{ transform: fillCompareTokens })

// Search demand, not the alphabet (shared with each page's related links).
const rank = compareRank

const ordered = computed(() =>
  [...(allMatchups.value ?? [])].sort((a, b) => rank(a.path) - rank(b.path)),
)
const matchups = ordered

// Readers arrive knowing their job, not our taxonomy: group by the kind of
// tool they're weighing, most-searched first within each group.
const GROUPS = [
  { key: 'recording', label: 'Recording tools', lede: 'You record calls, interviews, or podcasts with guests.' },
  { key: 'editing', label: 'Editors', lede: 'You edit many kinds of video in one app.' },
  { key: 'clipping', label: 'Clip generators', lede: 'You turn long videos into a stack of shorts.' },
] as const
const groups = computed(() => {
  const all = ordered.value
  const grouped = GROUPS.map((g) => ({ ...g, matchups: all.filter((m) => m.category === g.key) }))
  const ungrouped = all.filter((m) => !GROUPS.some((g) => g.key === m.category))
  if (ungrouped.length) grouped.push({ key: 'other', label: 'Other tools', lede: '', matchups: ungrouped } as never)
  return grouped.filter((g) => g.matchups.length)
})

const signupUrl = computed(() => buildSignupUrl({
  baseUrl: SIGNUP_BASE_URL,
  query: route.query,
  plan: 'clip',
  surface: 'comparison',
  landingPath: route.path,
}))

const lastReviewed = computed(() => {
  const dates = (matchups.value ?? []).map((m) => m.reviewed).filter(Boolean).sort()
  return dates[dates.length - 1] ?? ''
})

const formatDate = (value?: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

// Every comparison as a list, with its one-line answer, for crawlers.
const itemListStructuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'BitterClip comparisons',
  itemListElement: groups.value.flatMap((g) => g.matchups).map((m, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: `BitterClip vs ${m.competitor}`,
    url: `https://bitterclip.com${m.path}`,
    description: m.shortAnswer ?? m.description,
  })),
}))

useHead(() => ({
  title: 'Compare BitterClip — head to head with Descript, Riverside, OpusClip and more',
  meta: [
    {
      name: 'description',
      content: 'BitterClip compared with Descript, OpusClip, Riverside, CapCut and more. What each tool is actually for, where they beat us, and the fine print from their own terms.',
    },
    { property: 'og:title', content: 'Compare BitterClip' },
    {
      property: 'og:description',
      content: 'Head-to-head comparisons with every tool people weigh against BitterClip — including where each one wins.',
    },
    { property: 'og:url', content: 'https://bitterclip.com/compare' },
    { name: 'twitter:title', content: 'Compare BitterClip' },
    {
      name: 'twitter:description',
      content: 'Head-to-head comparisons with every tool people weigh against BitterClip.',
    },
  ],
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/compare' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/compare.md', title: 'BitterClip comparison Markdown' },
  ],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(itemListStructuredData.value) },
  ],
}))
</script>

<template>
  <main class="relative">

    <!-- Hero carries the method on the right rather than leaving 40% of the
         fold empty and deferring trust to a band further down. -->
    <section class="mx-auto max-w-6xl px-4 pt-12 sm:pt-20">
      <div class="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16 lg:items-end">
        <div>
          <p class="telemetry-label mb-5">Comparisons</p>
          <h1 class="font-display text-5xl sm:text-7xl font-bold tracking-[-0.04em] text-white leading-[0.98] mb-7">
            Which one should
            <span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent block">you use?</span>
          </h1>
          <p class="text-zinc-300 text-lg sm:text-2xl leading-[1.55] max-w-2xl text-balance">
            Pick by the job. Riverside and Zoom record the call. Descript and VEED edit anything. OpusClip and Vizard turn out shorts in bulk. BitterClip records the conversation and finishes it: the episode, then the clips.
          </p>
          <a
            :href="signupUrl"
            class="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f28f84] px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >Try it on one recording <span aria-hidden="true">→</span></a>
        </div>

        <dl class="space-y-5 border-l border-white/[0.09] pl-6">
          <div>
            <dt class="font-semibold text-sm text-white mb-1">Every claim is sourced</dt>
            <dd class="text-sm text-zinc-400 leading-[1.6]">Prices, limits, and terms come from the other product's own pages, linked.</dd>
          </div>
          <div>
            <dt class="font-semibold text-sm text-white mb-1">We say where we lose</dt>
            <dd class="text-sm text-zinc-400 leading-[1.6]">Every row names the better tool, and each page says plainly who should pick the other one.</dd>
          </div>
          <div>
            <dt class="font-semibold text-sm text-white mb-1">They carry a date</dt>
            <dd class="text-sm text-zinc-400 leading-[1.6]">
              Software changes weekly.{{ lastReviewed ? ` Last checked ${formatDate(lastReviewed)}.` : '' }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="telemetry-ruler mt-14" aria-hidden="true" />
    </section>

    <!-- One section per kind of tool; each card answers in a line and shows the score. -->
    <section
      v-for="group in groups"
      :key="group.key"
      :aria-labelledby="`group-${group.key}`"
      class="mx-auto max-w-6xl px-4 pt-12 sm:pt-16"
    >
      <div class="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 :id="`group-${group.key}`" class="font-display text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white">{{ group.label }}</h2>
        <p v-if="group.lede" class="text-zinc-400">{{ group.lede }}</p>
      </div>
      <nav :aria-label="group.label" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="matchup in group.matchups"
          :key="matchup.path"
          :to="matchup.path"
          class="group flex flex-col rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6 transition hover:border-[#f28f84]/35 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
        >
          <h3 class="font-display text-xl font-bold leading-tight text-white">
            BitterClip <span class="font-normal text-zinc-500">vs</span> {{ matchup.competitor }}
          </h3>
          <p class="mt-3 text-[15px] leading-relaxed text-zinc-300">{{ matchup.shortAnswer || matchup.competitorStrength }}</p>
          <dl v-if="matchup.chooseThemShort" class="mt-auto space-y-2 pt-5 text-[13px] leading-snug">
            <div>
              <dt class="font-semibold text-zinc-200">Pick {{ matchup.competitor }} if</dt>
              <dd class="text-zinc-400">{{ matchup.chooseThemShort }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-[#f28f84]">Pick BitterClip if</dt>
              <dd class="text-zinc-400">{{ matchup.chooseUsShort }}</dd>
            </div>
          </dl>
        </NuxtLink>
      </nav>
    </section>

    <section class="mx-auto max-w-6xl px-4 pt-20 sm:pt-24 pb-24">
      <div class="cta-glass-panel rounded-3xl corner-ticks p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
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
  </main>
</template>
