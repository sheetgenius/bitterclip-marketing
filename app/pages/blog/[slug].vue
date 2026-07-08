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

// Word count over the rendered body (handles both minimark arrays and
// object-shaped AST nodes) → honest reading time for the byline.
const countWords = (node: unknown): number => {
  if (!node) return 0
  if (typeof node === 'string') return node.trim().split(/\s+/).filter(Boolean).length
  if (Array.isArray(node)) {
    const [tag, props, ...kids] = node
    if (typeof tag === 'string' && props && typeof props === 'object' && !Array.isArray(props)) {
      return kids.reduce<number>((n, child) => n + countWords(child), 0)
    }
    return node.reduce<number>((n, child) => n + countWords(child), 0)
  }
  if (typeof node === 'object') {
    const record = node as Record<string, unknown>
    return countWords(record.children) + countWords(record.value)
  }
  return 0
}
const readingMinutes = computed(() => Math.max(1, Math.round(countWords(post.value?.body) / 220)))

const authorName = computed(() =>
  String(post.value?.author ?? 'Michael Ruescher').split(',')[0].trim(),
)
const canonicalUrl = `${siteOrigin}${postPath}`
const markdownUrl = `${canonicalUrl}.md`

const shareOnX = computed(() =>
  `https://x.com/intent/post?text=${encodeURIComponent(post.value?.title ?? '')}&url=${encodeURIComponent(canonicalUrl)}`,
)
const shareOnLinkedIn = computed(() =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`,
)
const copied = ref(false)
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(canonicalUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard unavailable (permissions/older browser) — leave the label as-is.
  }
}

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

    <div class="mx-auto mb-8 max-w-3xl">
      <NuxtLink
        to="/blog"
        class="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500 transition hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
      >
        ← Blog
      </NuxtLink>
    </div>

    <article>
      <header class="mx-auto mb-8 max-w-3xl border-b border-zinc-900 pb-8">
        <p class="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#f28f84]">
          {{ formatDate(post.date) }}
        </p>
        <h1 class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {{ post.title }}
        </h1>
        <p class="mt-5 max-w-3xl text-base italic leading-relaxed text-zinc-300 sm:text-lg">
          {{ post.description }}
        </p>
        <p class="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400">
          {{ post.author }} <span class="mx-2 text-zinc-700">·</span> {{ readingMinutes }} min read
        </p>
      </header>

      <figure v-if="post.heroImage" class="mx-auto mb-10 max-w-4xl">
        <img
          class="w-full rounded-lg border border-zinc-900 bg-black"
          :src="post.heroImage"
          :alt="post.heroAlt || ''"
          width="1600"
          height="1000"
          fetchpriority="high"
        >
      </figure>

      <div class="docs-prose blog-prose mx-auto">
        <ContentRenderer :value="post" />
      </div>

      <div class="mx-auto max-w-3xl">
        <BlogPostCta />

        <footer class="mt-10 flex flex-col gap-5 border-t border-zinc-900 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <NuxtLink
            to="/blog"
            class="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500 transition hover:text-[#f28f84] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
          >
            ← All posts
          </NuxtLink>
          <div class="flex flex-wrap items-center gap-2">
            <span class="mr-1 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">Share</span>
            <a
              :href="shareOnX"
              target="_blank"
              rel="noopener"
              class="rounded-full border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-[#f28f84]/40 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
            >
              X
            </a>
            <a
              :href="shareOnLinkedIn"
              target="_blank"
              rel="noopener"
              class="rounded-full border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-[#f28f84]/40 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
            >
              LinkedIn
            </a>
            <button
              type="button"
              class="rounded-full border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-[#f28f84]/40 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
              @click="copyLink"
            >
              {{ copied ? 'Copied ✓' : 'Copy link' }}
            </button>
            <a
              href="/blog/rss.xml"
              class="rounded-full border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-[#f28f84]/40 hover:text-[#ffb9af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f28f84]"
            >
              RSS
            </a>
          </div>
        </footer>
      </div>
    </article>
  </main>
</template>

<style scoped>
.blog-prose {
  max-width: 48rem;
}

/* Long-form body reads a step brighter than docs reference text. */
.blog-prose :deep(p) {
  color: rgb(203 207 216);
}

/* Opening paragraph reads as a lede. (Only the first top-level paragraph
   matches; the blockquote reset below keeps quoted text at body size.) */
.blog-prose :deep(p:first-of-type) {
  font-size: 1.125rem;
  line-height: 1.85;
  color: rgb(212 212 216);
}

/* Quotes in posts are usually speech — render them as a quiet message
   bubble instead of an italic rule. */
.blog-prose :deep(blockquote) {
  margin: 1.7rem 0;
  max-width: 34rem;
  border-left: none;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 1.25rem;
  border-bottom-left-radius: 0.4rem;
  background: rgba(39, 39, 42, 0.72);
  padding: 1rem 1.3rem;
  color: rgb(228 228 231);
  font-style: normal;
}
.blog-prose :deep(blockquote p) {
  font-size: 1rem;
  line-height: 1.75;
  color: rgb(228 228 231);
}
</style>
