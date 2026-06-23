<script setup lang="ts">
// The "Next steps" link list at the foot of each page, for consistent cross-linking.
// Pass a `links` array of { to, label }. In MDC, bind it with a YAML block:
//   ::next-steps
//   ---
//   links:
//     - to: /docs/getting-started/your-first-clip
//       label: Your first clip
//   ---
//   ::
defineProps<{
  links?: { to: string; label: string }[]
}>()
</script>

<template>
  <nav
    v-if="links?.length"
    class="docs-snippet docs-next-steps"
    aria-label="Next steps"
  >
    <p class="docs-next-steps__label">Next steps</p>
    <ul>
      <li v-for="link in links" :key="link.to">
        <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
      </li>
    </ul>
  </nav>
</template>
