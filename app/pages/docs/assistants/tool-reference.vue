<script setup lang="ts">
import snapshot from '../../../../tmp/mcp-catalog-snapshot.json'

definePageMeta({ layout: 'docs' })
const operations = snapshot.profiles.model.descriptors
const canonical = 'https://bitterclip.com/docs/assistants/tool-reference'
useHead({
  title: 'BitterClip MCP tool reference · BitterClip docs',
  meta: [
    { name: 'description', content: 'The 63 BitterClip MCP tools exposed to the default model, captured from the serving product.' },
    { property: 'og:url', content: canonical },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})
</script>

<template>
  <div class="tool-reference">
    <h1>BitterClip MCP tool reference</h1>
    <p>
      These 63 tools are exposed to the default model. Each tool page shows the full
      descriptor Rails served for the default model, app, and Live Workspace profiles.
      Connected hosts can vary security schemes and resource URIs.
    </p>
    <p>
      MCP hosts can also list 50 <a href="/docs/assistants/app-only-tools">app-only tools</a>
      that are outside the default model profile.
    </p>
    <p class="tool-reference__provenance">
      Product release <code>{{ snapshot.product_release }}</code><br>
      Public contract commit <code>{{ snapshot.public_contract_commit }}</code><br>
      Public contract SHA-256 <code>{{ snapshot.public_contract_digest }}</code><br>
      Descriptor SHA-256 <code>{{ snapshot.digest }}</code><br>
      Captured {{ snapshot.retrieved_at }} from
      <a :href="snapshot.source">the serving Rails descriptor catalog</a>.
    </p>
    <nav class="tool-reference__index" aria-label="Default model tool names">
      <a v-for="operation in operations" :key="operation.name" :href="`/docs/assistants/tools/${operation.name}`">
        <code>{{ operation.name }}</code>
        <span>{{ operation.title }}</span>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.tool-reference__provenance { border-left: 2px solid #f28f84; padding: 0.6rem 1rem; font-size: 0.82rem; overflow-wrap: anywhere; }
.tool-reference__index { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 0.65rem 1rem; margin: 2rem 0 3rem; }
.tool-reference__index a { display: flex; flex-direction: column; gap: 0.15rem; }
.tool-reference__index span { font-size: 0.75rem; opacity: 0.75; }
</style>
