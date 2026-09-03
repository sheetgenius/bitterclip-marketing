<script setup lang="ts">
import { computed } from 'vue'

// Canonical link into the Zoom import section of the signed-in product.
// Invoke: ::zoom-import-settings-link
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
const settingsUrl = computed(() => `${site.value?.app_origin ?? ''}/settings#zoom-import`)
</script>

<template>
  <p class="docs-snippet docs-cta">
    Already signed in?
    <a :href="settingsUrl">Open Zoom import settings</a>.
  </p>
</template>
