<script setup lang="ts">
import snapshot from '../../../../tmp/mcp-catalog-snapshot.json'

definePageMeta({ layout: 'docs' })

const operations = snapshot.operations
const canonical = 'https://bitterclip.com/docs/assistants/tool-reference'
useHead({
  title: 'BitterClip tool reference · BitterClip docs',
  meta: [
    { name: 'description', content: 'The complete BitterClip MCP tool catalog, captured from the deployed product at site build time.' },
    { property: 'og:url', content: canonical },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

function schema(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <div class="tool-reference">
    <h1>BitterClip tool reference</h1>
    <p>
      These are the {{ operations.length }} tools in the deployed Rails
      <code>mcp_model_visible</code> catalog. Names, titles, descriptions, and schemas
      below come directly from that catalog. A host may show fewer tools or adapt
      their presentation according to its capabilities and your permissions.
      The model-only result profile omits output schemas; Live Workspace may
      rename its workspace-opening tool. Errors and examples below are catalog
      guidance, not extra fields in MCP <code>tools/list</code>.
    </p>
    <p class="tool-reference__provenance">
      Product release <code>{{ snapshot.product_release }}</code><br>
      Catalog SHA-256 <code>{{ snapshot.digest }}</code><br>
      Captured {{ snapshot.retrieved_at }} from
      <a :href="snapshot.source">the deployed catalog</a>.
    </p>
    <nav class="tool-reference__index" aria-label="Tool names">
      <a v-for="operation in operations" :key="operation.name" :href="`#${operation.name}`">
        {{ operation.name }}
      </a>
    </nav>
    <section v-for="operation in operations" :id="operation.name" :key="operation.name" class="tool-reference__tool">
      <h2><code>{{ operation.name }}</code></h2>
      <h3>{{ operation.title }}</h3>
      <p class="tool-reference__description">{{ operation.description }}</p>
      <h4>Input schema</h4>
      <pre><code>{{ schema(operation.input_schema) }}</code></pre>
      <template v-if="operation.output_schema">
        <h4>Output schema</h4>
        <pre><code>{{ schema(operation.output_schema) }}</code></pre>
      </template>
      <template v-if="operation.annotations">
        <h4>Annotations</h4>
        <pre><code>{{ schema(operation.annotations) }}</code></pre>
      </template>
      <template v-if="operation.errors?.length">
        <h4>Errors</h4>
        <pre><code>{{ schema(operation.errors) }}</code></pre>
      </template>
      <template v-if="operation.examples?.length">
        <h4>Examples</h4>
        <pre><code>{{ schema(operation.examples) }}</code></pre>
      </template>
    </section>
  </div>
</template>

<style scoped>
.tool-reference__provenance {
  border-left: 2px solid #f28f84;
  padding: 0.6rem 1rem;
  font-size: 0.82rem;
  overflow-wrap: anywhere;
}
.tool-reference__index {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.5rem 1rem;
  margin: 2rem 0 3rem;
  font-family: var(--font-mono);
  font-size: 0.76rem;
}
.tool-reference__tool {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 1.5rem;
  margin-top: 2rem;
  scroll-margin-top: 6rem;
}
.tool-reference__description { white-space: pre-wrap; }
.tool-reference pre {
  overflow-x: auto;
  white-space: pre;
  font-size: 0.72rem;
}
</style>
