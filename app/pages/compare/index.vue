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
// The comparisons people ask about most, linked on the first screen.
const topMatchups = computed(() => ordered.value.slice(0, 4))

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
  title: 'Compare BitterClip with Zoom, Riverside, Descript, OpusClip and more',
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

    <!-- Route first: the answer to "which should I use?" in one line, then the
         comparisons people actually ask about, on the first screen. -->
    <section class="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
      <p class="telemetry-label mb-4">Comparisons</p>
      <h1 class="font-display text-4xl sm:text-5xl font-bold tracking-[-0.04em] text-white leading-[1.05]">
        Compare BitterClip with the tool you use now
      </h1>
      <p class="mt-5 max-w-3xl text-lg sm:text-xl leading-[1.5] text-zinc-300">
        Pick by the job. Riverside and Zoom record the call. Descript and VEED edit anything. OpusClip and Vizard turn out shorts in bulk. BitterClip records the conversation and finishes it: the episode, then the clips.
      </p>
      <nav aria-label="Most compared" class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
        <NuxtLink
          v-for="top in topMatchups"
          :key="top.path"
          :to="top.path"
          class="text-white underline decoration-white/25 underline-offset-4 transition hover:decoration-[#f28f84]"
        >BitterClip vs {{ top.competitor }}</NuxtLink>
        <span aria-hidden="true" class="text-zinc-700">·</span>
        <a
          v-for="group in groups"
          :key="group.key"
          :href="`#group-${group.key}`"
          class="text-zinc-400 underline decoration-white/15 underline-offset-4 transition hover:text-white"
        >{{ group.label }}</a>
      </nav>
    </section>

    <!-- One section per kind of tool; each card answers in a line and shows the score. -->
    <section
      v-for="group in groups"
      :key="group.key"
      :aria-labelledby="`group-${group.key}`"
      class="mx-auto max-w-6xl px-4 pt-12 sm:pt-16 scroll-mt-24"
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
          <p v-if="!matchup.chooseThemShort" class="mt-3 text-[15px] leading-relaxed text-zinc-300">{{ matchup.shortAnswer || matchup.competitorStrength }}</p>
          <dl v-if="matchup.chooseThemShort" class="mt-4 space-y-3 text-sm leading-relaxed">
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

    <p class="mx-auto max-w-6xl px-4 pt-12 text-sm leading-relaxed text-zinc-400">
      By the BitterClip team, from each tool's own pages. Every comparison names the better tool for each job, lists its sources and the date they were checked, and takes corrections as pull requests on GitHub.
    </p>

    <section class="mx-auto max-w-6xl px-4 pt-16 sm:pt-20 pb-24">
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
