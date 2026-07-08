<script setup lang="ts">
const siteOrigin = 'https://bitterclip.com'
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : String(route.params.slug)
const postPath = `/blog/${slug}`

const { data: post } = await useAsyncData(`blog:${postPath}`, () =>
  queryCollection('blog').path(postPath).first(),
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const absoluteUrl = (path?: string) => {
  if (!path) return `${siteOrigin}/icon.png`
  return path.startsWith('http') ? path : `${siteOrigin}${path}`
}

const formatDate = (value?: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

const authorName = computed(() =>
  String(post.value?.author ?? 'Michael Ruescher').split(',')[0].trim(),
)
const canonicalUrl = `${siteOrigin}${postPath}`
const markdownUrl = `${canonicalUrl}.md`

useHead(() => {
  const image = absoluteUrl(post.value?.ogImage)
  const published = post.value?.date ? `${post.value.date}T00:00:00Z` : undefined
  const updated = post.value?.updated ? `${post.value.updated}T00:00:00Z` : published
  const title = post.value?.title ?? 'BitterClip Blog'
  const description = post.value?.description ?? ''
  const tags = Array.isArray(post.value?.tags) ? post.value.tags : []
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: published,
    dateModified: updated,
    author: {
      '@type': 'Person',
      name: authorName.value,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BitterClip',
      logo: {
        '@type': 'ImageObject',
        url: `${siteOrigin}/icon.png`,
      },
    },
    image,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return {
    title: `${title} · BitterClip Blog`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: image },
      ...(published ? [{ property: 'article:published_time', content: published }] : []),
      ...(updated ? [{ property: 'article:modified_time', content: updated }] : []),
      { property: 'article:author', content: authorName.value },
      ...tags.map((tag) => ({ property: 'article:tag', content: tag })),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', type: 'text/markdown', href: markdownUrl, title: `${title} Markdown` },
      { rel: 'alternate', type: 'application/rss+xml', href: `${siteOrigin}/blog/rss.xml`, title: 'BitterClip Blog RSS' },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(structuredData),
      },
    ],
  }
})
</script>

<template>
  <main v-if="post" class="relative mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6">
    <div class="absolute top-0 left-1/4 -z-10 h-[420px] w-[420px] rounded-full bg-[#f28f84]/5 blur-[110px] pointer-events-none" />

    <div class="mb-8">
      <NuxtLink
        to="/blog"
        class="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500 transition hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
      >
        Blog
      </NuxtLink>
    </div>

    <article>
      <header class="mb-8 border-b border-zinc-900 pb-8">
        <p class="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#f28f84]">
          {{ formatDate(post.date) }}
        </p>
        <h1 class="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {{ post.title }}
        </h1>
        <p class="mt-5 max-w-3xl text-base italic leading-relaxed text-zinc-300 sm:text-lg">
          {{ post.description }}
        </p>
        <p class="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          {{ post.author }}
        </p>
      </header>

      <figure v-if="post.heroImage" class="mb-10">
        <img
          class="w-full rounded-lg border border-zinc-900 bg-black"
          :src="post.heroImage"
          :alt="post.heroAlt || ''"
          width="1600"
          height="1000"
        >
      </figure>

      <div class="docs-prose blog-prose mx-auto">
        <ContentRenderer :value="post" />
      </div>
    </article>
  </main>
</template>

<style scoped>
.blog-prose {
  max-width: 48rem;
}
</style>
