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
    BitterClip turns a long video or audio recording into short clips you can trust.
    You bring the recording; it writes out a transcript with every word tied to the moment
    it was spoken. Then you, or an AI assistant like ChatGPT or Claude, pick the strongest
    moments, and BitterClip cuts the exact clip straight from the audio. No timeline to
    drag, no timestamps to guess. It runs in your browser at {{ appHost }}.
  </p>
</template>
