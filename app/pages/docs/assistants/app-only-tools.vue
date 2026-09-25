<script setup lang="ts">
import snapshot from '../../../../tmp/mcp-catalog-snapshot.json'

definePageMeta({ layout: 'docs' })
const modelNames = new Set(snapshot.profiles.model.descriptors.map((item) => item.name))
const operations = snapshot.profiles.app.descriptors.filter((item) => !modelNames.has(item.name))
const canonical = 'https://bitterclip.com/docs/assistants/app-only-tools'
useHead({
  title: 'App-only MCP tools · BitterClip docs',
  meta: [
    { name: 'description', content: 'The 50 BitterClip MCP tools that hosts can list outside the default model profile.' },
    { property: 'og:url', content: canonical },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})
</script>

<template>
  <div class="app-only-tools">
    <p><a href="/docs/assistants/tool-reference">Default model tool reference</a></p>
    <h1>App-only MCP tools</h1>
    <p>
      MCP hosts can list these 49 registered tools through the app profile. They are
      outside the 63-tool default model profile. Each page shows the exact app
      descriptor captured from serving Rails, with errors and examples.
    </p>
    <p class="app-only-tools__provenance">
      Product release <code>{{ snapshot.product_release }}</code><br>
      Public contract commit <code>{{ snapshot.public_contract_commit }}</code><br>
      Public contract SHA-256 <code>{{ snapshot.public_contract_digest }}</code><br>
      Descriptor SHA-256 <code>{{ snapshot.digest }}</code><br>
      Captured {{ snapshot.retrieved_at }} from
      <a :href="snapshot.source">the serving Rails descriptor catalog</a>.
    </p>
    <nav class="app-only-tools__index" aria-label="App-only tool names">
      <a v-for="operation in operations" :key="operation.name" :href="`/docs/assistants/tools/${operation.name}`">
        <code>{{ operation.name }}</code>
        <span>{{ operation.title }}</span>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.app-only-tools__provenance { border-left: 2px solid #f28f84; padding: 0.6rem 1rem; font-size: 0.82rem; overflow-wrap: anywhere; }
.app-only-tools__index { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 0.65rem 1rem; margin: 2rem 0 3rem; }
.app-only-tools__index a { display: flex; flex-direction: column; gap: 0.15rem; }
.app-only-tools__index span { font-size: 0.75rem; opacity: 0.75; }
</style>
