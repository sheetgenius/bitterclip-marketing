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
    BitterClip turns a recorded conversation into a finished episode and the clips from it.
    You bring the recording; it transcribes every word tied to the moment it was spoken and
    reads the whole session. Its built-in agent makes the cut, and you keep directing it in
    plain words or by editing the transcript. Every cut stays linked to the exact moment it
    came from, so nothing is a guess. If you prefer, ChatGPT or Claude can operate the same
    workbench. It runs in your browser at {{ appHost }}.
  </p>
</template>
