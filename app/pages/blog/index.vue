<script setup lang="ts">
import { buildSignupUrl } from '~/utils/signup-attribution'

const siteOrigin = 'https://bitterclip.com'
const description = 'Launch notes, product updates, and field notes from BitterClip.'

const { data: posts } = await useAsyncData('blog:index', () =>
  queryCollection('blog').all(),
)
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
const route = useRoute()
const signupUrl = computed(() => buildSignupUrl({
  baseUrl: site.value?.signup_url,
  query: route.query,
  surface: 'blog_index',
  landingPath: route.path,
}))

const sortedPosts = computed(() =>
  [...(posts.value ?? [])].sort((a, b) =>
    String(b.updated ?? b.date ?? '').localeCompare(String(a.updated ?? a.date ?? '')),
  ),
)

const formatDate = (value?: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

useHead(() => {
  const latestImage = sortedPosts.value[0]?.ogImage
  const ogImage = latestImage ? `${siteOrigin}${latestImage}` : `${siteOrigin}/icon.png`
  return {
    title: 'BitterClip Blog',
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'BitterClip Blog' },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `${siteOrigin}/blog` },
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: latestImage ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: 'BitterClip Blog' },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ],
    link: [
      { rel: 'canonical', href: `${siteOrigin}/blog` },
      { rel: 'alternate', type: 'text/markdown', href: `${siteOrigin}/blog.md`, title: 'BitterClip blog Markdown' },
      { rel: 'alternate', type: 'application/rss+xml', href: `${siteOrigin}/blog/rss.xml`, title: 'BitterClip Blog RSS' },
    ],
  }
})
</script>

<template>
  <main class="relative mx-auto max-w-5xl px-4 pt-12 pb-24 sm:px-6">
    <div class="absolute top-0 left-1/4 -z-10 h-[360px] w-[360px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <header class="mb-10 border-b border-zinc-900 pb-8">
      <div class="flex items-start justify-between gap-4">
        <p class="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#f28f84]">Blog</p>
        <a
          href="/blog/rss.xml"
          class="rounded-full border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-[#f28f84]/40 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
        >
          RSS
        </a>
      </div>
      <h1 class="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        BitterClip Blog
      </h1>
      <p class="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        {{ description }}
      </p>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
        New here? BitterClip turns long recordings into source-true clips in your
        browser or a supported AI assistant.
        <a
          :href="signupUrl"
          class="text-[#f28f84] underline decoration-[#f28f84]/40 underline-offset-4 transition hover:text-[#ffa89e]"
        >It's free to start</a>.
      </p>
    </header>

    <section class="grid gap-5" aria-label="Blog posts">
      <NuxtLink
        v-for="post in sortedPosts"
        :key="post.path"
        :to="post.path"
        :aria-label="post.title"
        class="group overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/45 transition hover:border-[#f28f84]/35 hover:bg-zinc-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
      >
        <div class="flex flex-col sm:flex-row">
          <div
            v-if="post.ogImage || post.heroImage"
            class="shrink-0 overflow-hidden border-b border-zinc-900 bg-black sm:w-[44%] sm:border-b-0 sm:border-r"
          >
            <img
              :src="post.ogImage || post.heroImage"
              :alt="post.heroAlt || ''"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              width="1200"
              height="630"
              loading="lazy"
            >
          </div>
          <div class="flex flex-col justify-center p-6 sm:p-8">
            <p class="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              {{ formatDate(post.date) }}
            </p>
            <h2 class="text-xl font-bold tracking-tight text-white group-hover:text-[#ffb9af] sm:text-2xl">
              {{ post.title }}
            </h2>
            <p class="mt-3 text-sm leading-relaxed text-zinc-400">
              {{ post.description }}
            </p>
            <p class="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#f28f84]/80 transition group-hover:text-[#ffb9af]">
              Read the post →
            </p>
          </div>
        </div>
      </NuxtLink>
    </section>

    <p class="mt-10 text-sm text-zinc-500">
      Smaller ships land on the
      <NuxtLink
        to="/docs/changelog"
        class="text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-[#ffa89e] hover:decoration-[#f28f84]/50"
      >What's new</NuxtLink> page.
    </p>
  </main>
</template>
