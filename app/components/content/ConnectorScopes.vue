<script setup lang="ts">
// Renders "what permissions this grants" per connector in PLAIN ENGLISH only,
// from _data/connector-scopes.yml. The raw OAuth `scope` string is stored for
// cross-checking but is NEVER rendered. Required `connector` prop.
// Invoke: ::connector-scopes{connector="youtube"}
const props = defineProps<{ connector: string }>()

const { data: scopes } = await useAsyncData(
  () => `connector-scopes-${props.connector}`,
  async () => {
    const doc = await queryCollection('connectorScopes').first()
    return (doc?.scopes ?? []).filter((s) => s.connector === props.connector)
  },
  { watch: [() => props.connector] },
)
</script>

<template>
  <div class="docs-snippet docs-connector-scopes">
    <!-- STUB: only plain_label is rendered — raw scopes stay internal. -->
    <p>This connection lets BitterClip:</p>
    <ul>
      <li v-for="scope in scopes" :key="scope.scope">
        {{ scope.plain_label }}
        <span v-if="!scope.required"> (optional)</span>
      </li>
    </ul>
  </div>
</template>
