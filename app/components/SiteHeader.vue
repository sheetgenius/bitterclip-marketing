<script setup lang="ts">
import { computed } from 'vue'
import ibmPlexMonoLatinUrl from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2?url'

// The one top bar for the whole site — marketing pages and the docs shell both
// mount this, so the pill, the type, the glass, and the link set cannot drift.
// Docs-only extras (the "Docs" badge, the wider measure, the sidebar toggle)
// are props, never a second copy of the bar.

// Sign-in is a bare app URL on purpose: it is not a signup CTA, so it carries no
// campaign attribution. buildSignupUrl() belongs on the signup links (footer,
// pricing, in-page CTAs), and a header a[href^=".../sign_up"] would be counted
// as a signup_click by plugins/analytics.client.ts.
const SIGN_IN_URL = 'https://app.bitterclip.com/sign_in'

// The canonical nav. A link added here appears in every header on the site.
const NAV_LINKS = [
  { label: 'Demo', to: '/#demo' },
  { label: 'Assistants', to: '/docs/assistants/overview' },
  { label: 'Docs', to: '/docs' },
  { label: 'Compare', to: '/compare' },
  { label: 'Blog', to: '/blog' },
  { label: 'Pricing', to: '/#pricing' },
]

defineProps<{
  /** Pill appended to the wordmark, e.g. "Docs". */
  brandTag?: string
  /** Match the docs three-pane measure (90rem) instead of the marketing 72rem. */
  wide?: boolean
  /** Render the mobile drawer toggle (docs only — nothing else has a sidebar). */
  menuToggle?: boolean
  /** id of the element the toggle opens, for aria-controls. */
  menuControls?: string
  /**
   * Pin over a full-bleed hero instead of occupying document flow. Used on
   * the homepage (and its /lab/iso4 workshop mirror) so the 100svh canvas
   * is not shoved down by a body-colored band the height of this bar.
   */
  overlay?: boolean
}>()

const menuOpen = defineModel<boolean>('menuOpen', { default: false })

const route = useRoute()
const currentPath = computed(() => route.path.replace(/\/+$/, '') || '/')

useHead({
  link: [{
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href: ibmPlexMonoLatinUrl,
    crossorigin: 'anonymous',
  }],
})

// Match on the path only, and never on '/'. vue-router marks /#demo and
// /#pricing active together on every homepage visit, which would light up two
// links at once; the wordmark is the home affordance instead.
const isActive = (to: string) => {
  const path = to.split('#')[0]?.replace(/\/+$/, '') ?? ''
  if (!path) return false
  return currentPath.value === path || currentPath.value.startsWith(`${path}/`)
}
</script>

<template>
  <header
    class="z-50 mx-auto w-full px-4"
    :class="[
      wide ? 'max-w-[90rem]' : 'max-w-6xl',
      overlay ? 'fixed inset-x-0 top-4' : 'sticky top-4',
    ]"
  >
    <nav aria-label="Primary" class="flex items-center justify-between gap-3 px-5 py-2.5 rounded-full nav-glass">
      <div class="flex items-center gap-3 font-bold text-lg tracking-tight">
        <!-- 821px is docs.vue's drawer breakpoint (max-width: 820px) plus one:
             the toggle has to appear on exactly the widths where the sidebar has
             become a drawer, and disappear where it is a column again. -->
        <button
          v-if="menuToggle"
          type="button"
          class="hidden max-[821px]:inline-flex items-center justify-center w-7 h-7 rounded-[0.55rem] border border-white/[0.08] bg-white/[0.02] text-zinc-100 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none"
          :aria-expanded="menuOpen"
          :aria-controls="menuControls"
          aria-label="Toggle navigation"
          @click="menuOpen = !menuOpen"
        >
          <svg v-if="!menuOpen" class="w-[1.15rem] h-[1.15rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-[1.15rem] h-[1.15rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <BrandLogo :tag="brandTag" />
      </div>

      <!-- One breakpoint for the whole site, set where the widest version of the
           bar still fits on one line: docs also carries the "Docs" badge and the
           drawer toggle, and below this the row wraps and overflows the pill. -->
      <div class="hidden min-[821px]:flex items-center gap-1 font-sans text-sm font-medium tracking-tight text-zinc-300">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          class="px-3 py-1.5 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[#f28f84] focus-visible:outline-none"
          :class="{ 'text-[#f28f84]': isActive(link.to) }"
          :to="link.to"
        >{{ link.label }}</NuxtLink>
      </div>

      <div class="flex items-center">
        <a
          class="focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:outline-none px-4 py-1.5 rounded-full text-xs font-bold bg-[#f28f84] text-zinc-950 hover:bg-[#ffa89e] active:scale-[0.97] transition duration-200 shadow-lg shadow-[#f28f84]/20 hover:shadow-[#f28f84]/40"
          :href="SIGN_IN_URL"
        >
          Sign in
        </a>
      </div>
    </nav>
  </header>
</template>
