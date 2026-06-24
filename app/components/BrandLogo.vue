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

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}
.brand__icon {
  width: 1.4rem;
  height: 1.4rem;
  color: #f28f84;
  transition: filter 0.3s;
}
.brand:hover .brand__icon {
  filter: drop-shadow(0 0 8px rgba(242, 143, 132, 0.55));
}
.brand__word {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #f4f4f5;
}
.brand__tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f28f84;
  border: 1px solid rgba(242, 143, 132, 0.3);
  border-radius: 9999px;
  padding: 0.1rem 0.45rem;
}
</style>
