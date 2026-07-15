<script setup lang="ts">
// The single elevator description of BitterClip. Reads app_origin from _data/site.yml
// so the app URL is single-sourced (never hard-coded in prose).
// Invoke: ::what-is-bitter-clip  (or :WhatIsBitterClip)
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
const appHost = computed(() =>
  (site.value?.app_origin ?? '').replace(/^https?:\/\//, ''),
)
</script>

<template>
  <p class="docs-snippet">
    BitterClip turns a long video or audio recording into a record you can search and use.
    Every word stays tied to the moment it was spoken, so you or an AI assistant like
    ChatGPT or Claude can ask in plain language, return to the exact source, and make a
    clip without guessing at timestamps. It runs in your browser at {{ appHost }}.
  </p>
</template>
