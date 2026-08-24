<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'

const route = useRoute()

const { data: allMatchups } = await useAsyncData('compare:matchups', () =>
  queryCollection('compare').order('competitor', 'ASC').all(),
)

// Search demand, not the alphabet. Descript and Riverside are what people
// actually type; alphabetical order buried them behind CapCut and Captions.
const PRIORITY = [
  'descript', 'riverside', 'opus-clip', 'capcut', 'submagic', 'captions',
  'veed', 'podcastle', 'kapwing', 'vizard', 'klap', 'munch',
]
const rank = (path: string) => {
  const slug = path.split('/').pop() ?? ''
  const index = PRIORITY.indexOf(slug)
  return index === -1 ? PRIORITY.length : index
}

const scoreOf = (matchup: { rows?: { edge?: string }[]; competitor?: string }) => {
  const rows = matchup.rows ?? []
  return {
    bitterclip: rows.filter((r) => r.edge === 'bitterclip').length,
    competitor: rows.filter((r) => r.edge === 'competitor').length,
    even: rows.filter((r) => r.edge === 'even').length,
  }
}

const ordered = computed(() =>
  [...(allMatchups.value ?? [])].sort((a, b) => rank(a.path) - rank(b.path)),
)
const featured = computed(() => ordered.value.slice(0, 3))
const rest = computed(() => ordered.value.slice(3))
const matchups = ordered

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

useHead({
  title: 'Compare BitterClip — honest head-to-head comparisons',
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
})
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
            <span class="bg-gradient-to-r from-[#ffd0c7] via-[#f28f84] to-[#d66f5f] bg-clip-text text-transparent block">you actually use?</span>
          </h1>
          <p class="text-zinc-300 text-lg sm:text-2xl leading-[1.55] max-w-2xl text-balance">
            Riverside connects recording to production. Descript helps you edit almost anything. OpusClip helps you make more shorts. BitterClip finishes and refines the session you already recorded — wherever you recorded it. Here is an honest read on each one, including the parts where they beat us.
          </p>
        </div>

        <dl class="space-y-5 border-l border-white/[0.09] pl-6">
          <div>
            <dt class="font-semibold text-sm text-white mb-1">Every claim is sourced</dt>
            <dd class="text-sm text-zinc-400 leading-[1.6]">Prices, limits, and terms come from the other product's own pages, linked.</dd>
          </div>
          <div>
            <dt class="font-semibold text-sm text-white mb-1">We say where we lose</dt>
            <dd class="text-sm text-zinc-400 leading-[1.6]">Every row names the tool it favours. Plenty of them aren't us.</dd>
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

    <!-- The three matchups people actually search, given real estate. -->
    <section v-if="featured.length" aria-labelledby="featured-heading" class="mx-auto max-w-6xl px-4 pt-12 sm:pt-16">
      <h2 id="featured-heading" class="telemetry-label mb-5">Most compared</h2>
      <nav aria-label="Most compared" class="grid gap-4 md:grid-cols-3">
        <NuxtLink
          v-for="matchup in featured"
          :key="matchup.path"
          :to="matchup.path"
          class="group glass-panel-accented rounded-2xl corner-ticks p-7 flex flex-col transition hover:border-[#f28f84]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
        >
          <h3 class="font-display text-2xl font-bold text-white mb-4 leading-tight">
            BitterClip <span class="text-zinc-600 font-normal">vs</span><br>{{ matchup.competitor }}
          </h3>
          <p v-if="matchup.competitorStrength" class="mb-5 text-sm text-zinc-400 leading-relaxed">
            <span class="block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600 mb-1.5">Where they win</span>
            {{ matchup.competitorStrength }}
          </p>
          <p class="mt-auto pt-4 border-t border-white/[0.07] font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            <span class="text-zinc-300">{{ scoreOf(matchup).bitterclip }}</span> us
            <span class="mx-1.5 text-zinc-700">·</span>
            <span class="text-zinc-300">{{ scoreOf(matchup).competitor }}</span> them
            <span class="mx-1.5 text-zinc-700">·</span>
            <span class="text-zinc-300">{{ scoreOf(matchup).even }}</span> tied
          </p>
        </NuxtLink>
      </nav>
    </section>

    <!-- Everything else, denser: a directory, not twelve identical hero cards. -->
    <section v-if="rest.length" aria-labelledby="rest-heading" class="mx-auto max-w-6xl px-4 pt-10 sm:pt-12">
      <h2 id="rest-heading" class="telemetry-label mb-5">Also compared</h2>
      <nav aria-label="Other comparisons" class="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-white/[0.07]">
        <NuxtLink
          v-for="matchup in rest"
          :key="matchup.path"
          :to="matchup.path"
          class="group flex items-baseline gap-3 border-b border-white/[0.07] py-4 transition hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
        >
          <span class="font-semibold text-[15px] text-zinc-200 transition group-hover:text-white">
            vs {{ matchup.competitor }}
          </span>
          <span class="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600 tabular-nums">
            {{ scoreOf(matchup).bitterclip }}–{{ scoreOf(matchup).competitor }}–{{ scoreOf(matchup).even }}
          </span>
          <span aria-hidden="true" class="text-zinc-700 transition group-hover:text-[#f28f84]">→</span>
        </NuxtLink>
      </nav>
      <p class="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
        Scores read: jobs we win — jobs they win — tied
      </p>
    </section>

    <section class="mx-auto max-w-6xl px-4 pt-20 sm:pt-24 pb-24">
      <div class="cta-glass-panel rounded-3xl corner-ticks p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div>
          <p class="telemetry-label mb-4">Try it on one recording</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white mb-3 text-balance">
            Bring a session. Leave with the finished cut.
          </h2>
          <p class="text-zinc-400 max-w-xl leading-relaxed">
            Start Creator with one recording up to two hours. The card-required trial is $0 today, includes $5 of agent work for analysis, the First Cut, and direction, and becomes $24/month after seven days unless you cancel before the displayed charge date.
          </p>
        </div>
        <a
          :href="signupUrl"
          class="btn-glow shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-[#f28f84] px-6 py-3.5 font-mono text-xs font-bold text-zinc-950 transition hover:bg-[#ffa89e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Try BitterClip
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  </main>
</template>
