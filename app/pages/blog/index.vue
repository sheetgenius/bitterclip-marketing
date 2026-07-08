<script setup lang="ts">
const siteOrigin = 'https://bitterclip.com'
const description = 'Launch notes, product updates, and field notes from BitterClip.'

const { data: posts } = await useAsyncData('blog:index', () =>
  queryCollection('blog').all(),
)

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

useHead({
  title: 'BitterClip Blog',
  meta: [
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'BitterClip Blog' },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${siteOrigin}/blog` },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'BitterClip Blog' },
    { name: 'twitter:description', content: description },
  ],
  link: [
    { rel: 'canonical', href: `${siteOrigin}/blog` },
    { rel: 'alternate', type: 'text/markdown', href: `${siteOrigin}/blog.md`, title: 'BitterClip blog Markdown' },
    { rel: 'alternate', type: 'application/rss+xml', href: `${siteOrigin}/blog/rss.xml`, title: 'BitterClip Blog RSS' },
  ],
})
</script>

<template>
  <main class="relative mx-auto max-w-5xl px-4 pt-12 pb-24 sm:px-6">
    <div class="absolute top-0 left-1/4 -z-10 h-[360px] w-[360px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <header class="mb-10 border-b border-zinc-900 pb-8">
      <p class="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#f28f84]">Blog</p>
      <h1 class="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        BitterClip Blog
      </h1>
      <p class="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        {{ description }}
      </p>
    </header>

    <section class="grid gap-4" aria-label="Blog posts">
      <NuxtLink
        v-for="post in sortedPosts"
        :key="post.path"
        :to="post.path"
        class="group rounded-lg border border-zinc-900 bg-zinc-950/45 p-5 transition hover:border-[#f28f84]/35 hover:bg-zinc-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84]"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="max-w-2xl">
            <p class="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              {{ formatDate(post.date) }}
            </p>
            <h2 class="text-xl font-bold tracking-tight text-white group-hover:text-[#ffb9af]">
              {{ post.title }}
            </h2>
            <p class="mt-3 text-sm leading-relaxed text-zinc-400">
              {{ post.description }}
            </p>
          </div>
          <span class="shrink-0 rounded-full border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 group-hover:border-[#f28f84]/40 group-hover:text-[#ffb9af]">
            Read
          </span>
        </div>
      </NuxtLink>
    </section>
  </main>
</template>
