<script setup lang="ts">
// Catch-all docs render path. Matches /docs and /docs/<section>/<page>.
// Page content paths are prefixed with /docs in content.config.ts, so the
// route path maps 1:1 to the collection path.
const route = useRoute()

const { data: page } = await useAsyncData(`docs:${route.path}`, () =>
  queryCollection('docs').path(route.path).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Doc not found', fatal: true })
}

// Minimal SEO; full meta/og wiring is a later phase.
useHead(() => ({
  title: page.value?.title,
  meta: page.value?.description
    ? [{ name: 'description', content: page.value.description }]
    : [],
}))
</script>

<template>
  <!-- MINIMAL readable container. Sidebar / TOC / search styling is a later phase. -->
  <main class="docs-page">
    <article v-if="page" class="docs-prose">
      <ContentRenderer :value="page" />
    </article>
  </main>
</template>

<style scoped>
/* STUB layout: just a centered, readable column. */
.docs-page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
</style>
