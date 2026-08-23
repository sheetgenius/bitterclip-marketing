<script setup lang="ts">
// Root shell. Per-route chrome lives in layouts/ (default = marketing chrome,
// docs = the three-pane documentation shell). Pages opt in via definePageMeta.
// This tiny SSR-inline shell owns the first product paint once HTML arrives.
// Mobile Safari can otherwise repaint its default white canvas before the
// external Nuxt stylesheet loads, which is especially conspicuous beside
// ISO4's noir prepaint and makes a cold page load feel broken.
useHead({
  style: [
    {
      innerHTML: 'html,body,#__nuxt{margin:0;min-height:100%;background:#08090a;color-scheme:dark}',
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
