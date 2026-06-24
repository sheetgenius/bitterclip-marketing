<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Three-pane documentation shell (sidebar · content · on-this-page), with a
// sticky top bar and a mobile drawer for the sidebar. The center content is the
// page itself (rendered by pages/docs/[...slug].vue through the <slot/>).
const route = useRoute()
const signInUrl = 'https://app.bitterclip.com/sign_in'

// The page is also queried in the catch-all page component under this exact key,
// so useAsyncData dedupes — this read is free and gives us the TOC + title.
const { data: page } = await useAsyncData(`docs:${route.path}`, () =>
  queryCollection('docs').path(route.path).first(),
)

const tocLinks = computed(() => (page.value as any)?.body?.toc?.links ?? [])

// Mobile sidebar drawer.
const drawerOpen = ref(false)
watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  },
)
</script>

<template>
  <div class="docs-root">
    <!-- Cinematic backdrops (match the marketing shell, dialed down). -->
    <div class="docs-bg" aria-hidden="true">
      <div class="absolute inset-0 bg-grid-pattern-dense opacity-[0.08]" />
      <div class="docs-bg__glow" />
    </div>

    <!-- Sticky docs header -->
    <header class="docs-header nav-glass">
      <div class="docs-header__inner">
        <div class="docs-header__left">
          <button
            type="button"
            class="docs-header__menu"
            :aria-expanded="drawerOpen"
            aria-label="Toggle navigation"
            @click="drawerOpen = !drawerOpen"
          >
            <svg v-if="!drawerOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <NuxtLink to="/" class="docs-header__brand group">
            <svg class="docs-header__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span class="docs-header__wordmark">BitterClip</span>
            <span class="docs-header__docs-tag">Docs</span>
          </NuxtLink>
        </div>

        <nav class="docs-header__nav" aria-label="Site">
          <NuxtLink to="/docs" class="docs-header__navlink">Docs</NuxtLink>
          <NuxtLink to="/docs/assistants/overview" class="docs-header__navlink">In ChatGPT</NuxtLink>
          <NuxtLink to="/#pricing" class="docs-header__navlink">Pricing</NuxtLink>
          <NuxtLink to="/" class="docs-header__navlink">Main site →</NuxtLink>
        </nav>

        <a class="docs-header__cta" :href="signInUrl">Sign in</a>
      </div>
    </header>

    <!-- Mobile drawer scrim -->
    <div v-if="drawerOpen" class="docs-scrim" @click="drawerOpen = false" />

    <div class="docs-grid">
      <!-- Left sidebar (becomes a drawer under the lg breakpoint) -->
      <aside class="docs-aside" :class="{ 'is-open': drawerOpen }">
        <div class="docs-aside__inner">
          <DocsSidebar @navigate="drawerOpen = false" />
        </div>
      </aside>

      <!-- Center content -->
      <main class="docs-main">
        <article class="docs-prose">
          <slot />
        </article>
      </main>

      <!-- Right rail: on this page -->
      <aside class="docs-rail">
        <DocsToc :links="tocLinks" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.docs-root {
  position: relative;
  min-height: 100vh;
  background-color: #080909;
  color: #f4f4f5;
}

.docs-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.docs-bg__glow {
  position: absolute;
  top: -12%;
  left: 12%;
  width: 620px;
  height: 620px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(242, 143, 132, 0.05), transparent 70%);
  filter: blur(120px);
}

/* ---- Sticky header ---- */
.docs-header {
  position: sticky;
  top: 0;
  z-index: 40;
  border-left: none;
  border-right: none;
  border-top: none;
}
.docs-header__inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 90rem;
  margin: 0 auto;
  padding: 0.7rem 1.25rem;
}
.docs-header__left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-right: auto;
}
.docs-header__menu {
  display: none;
  width: 2.1rem;
  height: 2.1rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: #f4f4f5;
  cursor: pointer;
}
.docs-header__menu svg {
  width: 1.15rem;
  height: 1.15rem;
}
.docs-header__brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.docs-header__logo {
  width: 1.35rem;
  height: 1.35rem;
  color: #f28f84;
  transition: filter 0.3s;
}
.docs-header__brand:hover .docs-header__logo {
  filter: drop-shadow(0 0 8px rgba(242, 143, 132, 0.55));
}
.docs-header__wordmark {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #f4f4f5;
}
.docs-header__docs-tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f28f84;
  border: 1px solid rgba(242, 143, 132, 0.3);
  border-radius: 9999px;
  padding: 0.1rem 0.45rem;
}

.docs-header__nav {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.docs-header__navlink {
  padding: 0.4rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(244, 244, 245, 0.72);
  transition: color 0.18s, background 0.18s;
}
.docs-header__navlink:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.docs-header__navlink.router-link-active {
  color: #f28f84;
}

.docs-header__cta {
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: #f28f84;
  color: #0a0a0a;
  box-shadow: 0 4px 16px rgba(242, 143, 132, 0.18);
  transition: background 0.2s, box-shadow 0.2s;
}
.docs-header__cta:hover {
  background: #ffa89e;
  box-shadow: 0 8px 24px rgba(242, 143, 132, 0.32);
}

/* ---- Three-pane grid ---- */
.docs-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr) 15rem;
  gap: 2.5rem;
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  align-items: start;
}

.docs-aside {
  position: sticky;
  top: 4.2rem;
  height: calc(100vh - 4.2rem);
  overflow-y: auto;
  padding-top: 2rem;
}
.docs-aside__inner {
  min-height: 100%;
}

.docs-main {
  min-width: 0;
  padding: 2.5rem 0 5rem;
}

.docs-rail {
  padding-top: 2.5rem;
}

.docs-scrim {
  display: none;
}

/* ---- Responsive ---- */
@media (max-width: 1100px) {
  .docs-grid {
    grid-template-columns: 15rem minmax(0, 1fr);
  }
  .docs-rail {
    display: none;
  }
}

@media (max-width: 820px) {
  .docs-header__nav {
    display: none;
  }
  .docs-header__menu {
    display: inline-flex;
  }
  .docs-grid {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 1.25rem;
  }
  .docs-aside {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: 18rem;
    max-width: 85vw;
    height: 100vh;
    padding: 5rem 1.25rem 2rem;
    background: rgba(8, 9, 9, 0.97);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    transform: translateX(-105%);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .docs-aside.is-open {
    transform: translateX(0);
  }
  .docs-scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .docs-aside {
    transition: none !important;
  }
}
</style>
