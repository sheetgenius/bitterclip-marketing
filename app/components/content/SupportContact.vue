<script setup lang="ts">
// Single-sourced support contact, read from _data/site.yml.
// Invoke: ::support-contact
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
</script>

<template>
  <p class="docs-snippet">
    Need a hand? Email us at
    <a :href="`mailto:${site?.support_email}`">{{ site?.support_email }}</a> and tell us
    what you were trying to do. A real person reads every message, and the more detail you
    share, the faster we can help.
  </p>
</template>
