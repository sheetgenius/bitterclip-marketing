<script setup lang="ts">
// The one BitterClip logo (icon + wordmark), shared by the marketing chrome and
// the docs shell so they never drift. Pass `tag` to append a pill (e.g. "Docs").
defineProps<{ tag?: string }>()
</script>

<template>
  <NuxtLink to="/" class="brand group" aria-label="BitterClip home">
    <svg class="brand__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
    <span class="brand__word">BitterClip</span>
    <span v-if="tag" class="brand__tag">{{ tag }}</span>
  </NuxtLink>
</template>
