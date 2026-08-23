<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl, SIGNUP_BASE_URL } from '~/utils/signup-attribution'

const siteOrigin = 'https://bitterclip.com'
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : String(route.params.slug)
const pagePath = `/compare/${slug}`

const { data: page } = await useAsyncData(`compare:${pagePath}`, () =>
  queryCollection('compare').path(pagePath).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Comparison not found', fatal: true })
}

// Sibling matchups for the "keep comparing" rail at the foot of the page.
const { data: siblings } = await useAsyncData(`compare:siblings:${pagePath}`, () =>
  queryCollection('compare').order('competitor', 'ASC').all(),
)
const otherMatchups = computed(() =>
  (siblings.value ?? []).filter((m) => m.path !== pagePath).slice(0, 6),
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

// Per-row verdict. Two redundant cues carry it: a chip naming the winner, and
// accent styling on the winning CELL. Styling by outcome (not by brand) is the
// point — the old version made our column brighter on every row, which silently
// claimed a win we hadn't earned.
const edgeLabel = (edge: string, competitor: string) => {
  if (edge === 'bitterclip') return 'BitterClip'
  if (edge === 'competitor') return competitor
  return 'Tie'
}

const wins = (row: { edge?: string }, side: 'bitterclip' | 'competitor') => row.edge === side
const tied = (row: { edge?: string }) => row.edge === 'even'

const cellClass = (row: { edge?: string }, side: 'bitterclip' | 'competitor') => {
  if (tied(row)) return 'compare-cell--tie'
  return wins(row, side) ? `compare-cell--win compare-cell--win-${side}` : 'compare-cell--lose'
}

// Running score, so the shape of the answer is readable before any row is.
const tally = computed(() => {
  const rows = page.value?.rows ?? []
  return {
    total: rows.length,
    bitterclip: rows.filter((r) => r.edge === 'bitterclip').length,
    competitor: rows.filter((r) => r.edge === 'competitor').length,
    even: rows.filter((r) => r.edge === 'even').length,
  }
})

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

const SESSION_FOOTAGE_MATCHUPS = new Set(['descript', 'riverside', 'podcastle', 'captions', 'veed', 'kapwing'])
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
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
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
      { type: 'application/ld+json', innerHTML: JSON.stringify(faqStructuredData) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbStructuredData) },
    ],
  }
})
</script>

<template>
  <main v-if="page" class="relative">

    <!-- ============================ HERO ============================ -->
    <section class="mx-auto max-w-6xl px-4 pt-10 sm:pt-16">
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

    <!-- ======================= THE SHORT ANSWER ======================= -->
    <section aria-label="The short answer" class="mx-auto max-w-6xl px-4 pt-14 sm:pt-20">
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
    <section id="comparison" aria-labelledby="comparison-heading" class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28 scroll-mt-24">
      <div class="max-w-2xl mb-7">
        <p class="telemetry-label mb-4">The comparison</p>
        <h2 id="comparison-heading" class="font-display text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.05]">
          Job by job.
        </h2>
      </div>

      <!-- One semantic table; CSS reflows it into cards below md so a phone
           never side-scrolls the thing the page exists to compare. The score
           strip is attached to the table so the two read as one object. -->
      <div class="compare-table-wrap rounded-2xl md:overflow-hidden md:border md:border-white/[0.09] md:bg-white/[0.022] md:shadow-2xl md:shadow-black/50">
        <!-- The score, before any row is read. Doubles as the legend: a green
             check means "better here", whichever product it sits on. -->
        <div class="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2.5 md:mb-0 md:border-b md:border-white/[0.07] md:bg-white/[0.03] md:px-5 md:py-3.5">
          <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Across {{ tally.total }} jobs
          </span>
          <span class="flex items-center gap-1.5 text-sm">
            <span aria-hidden="true" class="compare-check">✓</span>
            <span class="text-zinc-400">BitterClip better on <span class="font-semibold text-zinc-100 tabular-nums">{{ tally.bitterclip }}</span></span>
          </span>
          <span class="flex items-center gap-1.5 text-sm">
            <span aria-hidden="true" class="compare-check">✓</span>
            <span class="text-zinc-400">{{ page.competitor }} better on <span class="font-semibold text-zinc-100 tabular-nums">{{ tally.competitor }}</span></span>
          </span>
          <span class="flex items-center gap-1.5 text-sm">
            <span aria-hidden="true" class="text-zinc-600">—</span>
            <span class="text-zinc-500">Tie on <span class="font-semibold text-zinc-300 tabular-nums">{{ tally.even }}</span></span>
          </span>
        </div>

        <table class="compare-table w-full border-collapse text-left">
          <caption class="sr-only">Comparison of BitterClip and {{ page.competitor }}</caption>
          <thead>
            <tr>
              <th scope="col" class="w-[26%] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-normal">What you're comparing</th>
              <th scope="col" class="compare-col-ours w-[37%] px-5 py-3.5 text-[13px] font-semibold tracking-wide text-[#f28f84] border-l border-white/[0.09]">BitterClip</th>
              <th scope="col" class="w-[37%] px-5 py-3.5 text-[13px] font-semibold tracking-wide text-zinc-200 border-l border-white/[0.09]">{{ page.competitor }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in page.rows" :key="row.axis" class="compare-row border-t border-white/[0.05] align-top">
              <th scope="row" class="px-5 py-4">
                <span class="block font-semibold text-[15px] text-zinc-100 leading-snug">{{ row.axis }}</span>
                <span
                  v-if="tied(row)"
                  class="mt-2 inline-block rounded-full border border-dashed border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500"
                >Tie</span>
              </th>
              <td :data-label="'BitterClip'" class="compare-cell compare-col-ours px-5 py-4 border-l border-white/[0.09]" :class="cellClass(row, 'bitterclip')">
                <span class="compare-lead font-semibold text-[15px] leading-snug">
                  <span aria-hidden="true" class="compare-check-slot">
                    <span v-if="wins(row, 'bitterclip')" class="compare-check">✓</span>
                  </span>
                  <span>{{ row.bitterclip.lead }}</span>
                  <span v-if="wins(row, 'bitterclip')" class="sr-only"> — better for {{ row.axis }}</span>
                </span>
                <span class="compare-detail text-sm">{{ row.bitterclip.detail }}</span>
              </td>
              <td :data-label="page.competitor" class="compare-cell px-5 py-4 border-l border-white/[0.09]" :class="cellClass(row, 'competitor')">
                <span class="compare-lead font-semibold text-[15px] leading-snug">
                  <span aria-hidden="true" class="compare-check-slot">
                    <span v-if="wins(row, 'competitor')" class="compare-check">✓</span>
                  </span>
                  <span>{{ row.competitor.lead }}</span>
                  <span v-if="wins(row, 'competitor')" class="sr-only"> — better for {{ row.axis }}</span>
                </span>
                <span class="compare-detail text-sm">{{ row.competitor.detail }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ======================== CHOOSE WHICH ======================== -->
    <section aria-labelledby="choose-heading" class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28">
      <h2 id="choose-heading" class="sr-only">Which product should you choose?</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-[#f28f84]/25 bg-[#f28f84]/[0.05] p-7 sm:p-8">
          <h3 class="font-display text-2xl font-bold text-white mb-6">Choose BitterClip when…</h3>
          <ul class="space-y-4">
            <li v-for="item in page.chooseUs" :key="item" class="flex gap-3.5 text-[15px] text-zinc-300 leading-[1.6]">
              <span aria-hidden="true" class="text-[#f28f84] shrink-0 mt-1 text-xs">◆</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>
        <article class="rounded-2xl border border-white/[0.08] bg-black/25 p-7 sm:p-8">
          <h3 class="font-display text-2xl font-bold text-white mb-6">Choose {{ page.competitor }} when…</h3>
          <ul class="space-y-4">
            <li v-for="item in page.chooseThem" :key="item" class="flex gap-3.5 text-[15px] text-zinc-400 leading-[1.6]">
              <span aria-hidden="true" class="text-zinc-600 shrink-0 mt-1 text-xs">◆</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- ========================= TESTIMONIAL =========================
         The only human face on the page, placed between the analytical read
         and the evidence file. Quotes run verbatim, as on the homepage. -->
    <section aria-label="Customer" class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28">
      <figure class="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:text-left sm:gap-10">
        <div class="shrink-0 flex flex-col items-center gap-3">
          <img
            :src="testimonial.photo"
            :alt="testimonial.name"
            width="120"
            height="120"
            loading="lazy"
            decoding="async"
            class="w-28 h-28 rounded-full object-cover ring-1 ring-white/10 bg-white/[0.04]"
          >
          <figcaption class="font-mono text-[10px] uppercase tracking-widest leading-relaxed text-center">
            <span class="block text-zinc-200">{{ testimonial.name }}</span>
            <span class="block mt-0.5 text-zinc-500">{{ testimonial.role }}</span>
            <a
              :href="testimonial.orgUrl"
              target="_blank"
              rel="noopener"
              class="mt-1 inline-block text-[#f28f84]/90 transition-colors hover:text-[#ffa89e]"
            >{{ testimonial.org }}</a>
          </figcaption>
        </div>
        <blockquote class="font-display text-xl sm:text-2xl font-medium tracking-tight leading-[1.55] text-zinc-500 text-balance">
          &ldquo;{{ testimonial.before }}<span class="text-white">{{ testimonial.key }}</span>{{ testimonial.after }}&rdquo;
        </blockquote>
      </figure>
    </section>

    <!-- ========================= FINE PRINT =========================
         The evidence file: every claim below is quoted from the competitor's
         own pricing or terms pages and stamped with where it came from. -->
    <section
      v-if="page.gotchas && page.gotchas.length"
      id="fine-print"
      aria-labelledby="fine-print-heading"
      class="relative mt-20 sm:mt-28 py-16 sm:py-24 border-y border-white/[0.07] bg-black/60 scroll-mt-24"
    >
      <div class="mx-auto max-w-6xl px-4">
        <div class="max-w-2xl mb-10">
          <p class="telemetry-label mb-4">The fine print</p>
          <h2 id="fine-print-heading" class="font-display text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.05] mb-5">
            Worth reading before you commit.
          </h2>
          <p class="text-zinc-400 leading-relaxed">
            Every line below comes from {{ page.competitor }}'s own pricing, help, or terms pages. Follow the link and check us.
          </p>
        </div>

        <ol class="grid gap-4 md:grid-cols-2">
          <li
            v-for="(gotcha, index) in page.gotchas"
            :key="gotcha.title"
            class="group relative rounded-2xl border border-white/[0.09] bg-white/[0.03] p-7 corner-ticks transition hover:border-[#f28f84]/25"
          >
            <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600 tabular-nums">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <h3 class="mt-3 font-display text-xl font-bold text-white leading-snug">{{ gotcha.title }}</h3>
            <p class="mt-3 text-sm text-zinc-400 leading-[1.7]">{{ gotcha.body }}</p>
            <a
              :href="gotcha.sourceUrl"
              rel="noopener nofollow"
              target="_blank"
              class="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition group-hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
            >
              <span aria-hidden="true">↗</span>
              {{ gotcha.sourceLabel }}
            </a>
          </li>
        </ol>
      </div>
    </section>

    <!-- ========================== THE PROSE ========================== -->
    <section class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28">
      <div class="docs-prose compare-prose">
        <ContentRenderer :value="page" />
      </div>
    </section>

    <!-- ============================= FAQ ============================= -->
    <section v-if="page.faq && page.faq.length" id="faq" aria-labelledby="faq-heading" class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28 scroll-mt-24">
      <div class="max-w-3xl">
        <p class="telemetry-label mb-4">FAQ</p>
        <h2 id="faq-heading" class="font-display text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.05] mb-10">
          Questions people actually ask.
        </h2>
        <dl>
          <div
            v-for="item in page.faq"
            :key="item.q"
            class="border-t border-white/[0.07] py-7 first:border-t-0 first:pt-0"
          >
            <dt class="font-display text-xl sm:text-2xl font-bold text-white leading-snug mb-3">{{ item.q }}</dt>
            <dd class="text-[15px] sm:text-base text-zinc-400 leading-[1.75]">{{ item.a }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ============================= CTA ============================= -->
    <section class="mx-auto max-w-6xl px-4 pt-20 sm:pt-28">
      <div class="cta-glass-panel rounded-3xl corner-ticks p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div>
          <p class="telemetry-label mb-4">Try it on one recording</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white mb-3 text-balance">
            Bring a session. Leave with the finished cut.
          </h2>
          <p class="text-zinc-400 max-w-xl leading-relaxed">
            Start Creator with one recording. The card-required trial is $0 today, lasts exactly seven days, and becomes $24/month unless you cancel before the displayed end.
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

    <!-- ====================== KEEP COMPARING ====================== -->
    <section v-if="otherMatchups.length" aria-labelledby="siblings-heading" class="mx-auto max-w-6xl px-4 pt-20 sm:pt-24">
      <h2 id="siblings-heading" class="telemetry-label mb-5">Keep comparing</h2>
      <nav aria-label="Other comparisons" class="flex flex-wrap gap-2.5">
        <NuxtLink
          v-for="matchup in otherMatchups"
          :key="matchup.path"
          :to="matchup.path"
          class="rounded-full border border-white/[0.09] bg-white/[0.02] px-4 py-2 text-sm text-zinc-400 transition hover:border-[#f28f84]/35 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
        >
          BitterClip vs {{ matchup.competitor }}
        </NuxtLink>
      </nav>
    </section>

    <!-- =========================== SOURCES =========================== -->
    <footer class="mx-auto max-w-6xl px-4 mt-16 pb-24">
      <div class="pt-7 border-t border-white/[0.07]">
        <p class="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600 mb-4">
          Sources · {{ page.competitor }} facts checked {{ formatDate(page.reviewed) }}
        </p>
        <ul class="flex flex-wrap gap-x-5 gap-y-2">
          <li v-for="source in page.sources" :key="source.url">
            <a
              class="text-xs text-zinc-500 hover:text-[#f28f84] transition"
              :href="source.url"
              rel="noopener nofollow"
              target="_blank"
            >{{ source.label }} ↗</a>
          </li>
        </ul>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.compare-prose {
  max-width: 44rem;
}

/* Outcome styling. No cell backgrounds: a green check plus brightness carries
   the verdict. Green means "better here" whichever product it lands on, which
   frees coral to mean BitterClip's brand and nothing else. */
.compare-check {
  color: #5fd39b;
  font-weight: 700;
}

/* The check gutter is reserved in EVERY cell, winner or not, so lead text and
   detail text share one left edge down the whole table. Without it the winning
   rows sit indented and the columns read ragged. */
.compare-lead {
  display: grid;
  grid-template-columns: 1.35rem 1fr;
  margin-bottom: 0.3rem;
}
.compare-check-slot {
  display: block;
}
.compare-detail {
  display: block;
  padding-left: 1.35rem;
  line-height: 1.55;
}

/* The product whose site this is keeps a quiet, neutral column identity —
   never a colour that would read as winning. */
.compare-col-ours {
  background-color: rgba(255, 255, 255, 0.018);
}

.compare-cell--win .compare-lead {
  color: #ffffff;
}
.compare-cell--win .compare-detail {
  color: rgb(203 203 210);
}

/* Recessive, still comfortably readable — dimmer than this reads as disabled. */
.compare-cell--lose .compare-lead {
  color: rgb(180 180 190);
}
.compare-cell--lose .compare-detail {
  color: rgb(142 142 152);
}

.compare-cell--tie .compare-lead {
  color: rgb(228 228 231);
}
.compare-cell--tie .compare-detail {
  color: rgb(160 160 170);
}

/* Desktop: keep the column headers in view while reading a ten-row table.
   The header sits a step ABOVE the rows in value, not below — it is the anchor
   for the two product names, so it must not read as a black void. */
@media (min-width: 768px) {
  .compare-table thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(14px);
    background: rgba(30, 30, 34, 0.96);
  }

  /* Banding gives the eye a rail to track along when scanning left to right
     across a tall row. Kept far below the header's value. */
  .compare-row:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.012);
  }

  .compare-row {
    transition: background-color 0.2s ease;
  }

  .compare-row:hover {
    background-color: rgba(255, 255, 255, 0.028);
  }
}

/* Mobile: the table stops being a table. Each row becomes a card with the two
   products stacked and labelled, so nothing truncates and nothing side-scrolls. */
@media (max-width: 767px) {
  .compare-table,
  .compare-table tbody,
  .compare-table tr,
  .compare-table th,
  .compare-table td {
    display: block;
    width: 100%;
  }

  .compare-table thead {
    display: none;
  }

  .compare-table tr {
    margin-bottom: 0.85rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.28);
    overflow: hidden;
  }

  .compare-table tr > th[scope='row'] {
    padding: 1.1rem 1.15rem 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.025);
  }

  .compare-cell {
    position: relative;
    padding: 1.05rem 1.15rem;
    border-left: 0 !important;
  }

  .compare-cell + .compare-cell {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* The product name each block belongs to — without it, stacked cells are
     ambiguous once the column headers are gone. */
  .compare-cell::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 0.5rem;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
  }

  .compare-cell[data-label='BitterClip']::before {
    color: rgba(242, 143, 132, 0.85);
  }
}
</style>
