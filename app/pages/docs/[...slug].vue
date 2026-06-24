<script setup lang="ts">
// Catch-all docs render path. Matches /docs and /docs/<section>/<page>.
// Page content paths are prefixed with /docs in content.config.ts, so the
// route path maps 1:1 to the collection path. The three-pane chrome lives in
// layouts/docs.vue (sidebar + on-this-page + sticky header).
definePageMeta({ layout: 'docs' })

const route = useRoute()

const { data: page } = await useAsyncData(`docs:${route.path}`, () =>
  queryCollection('docs').path(route.path).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Doc not found', fatal: true })
}

useHead(() => ({
  title: page.value?.title ? `${page.value.title} · BitterClip docs` : 'BitterClip docs',
  meta: page.value?.description
    ? [{ name: 'description', content: page.value.description }]
    : [],
}))
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
