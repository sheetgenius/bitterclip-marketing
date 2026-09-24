<script setup lang="ts">
import snapshot from '../../../../../tmp/mcp-catalog-snapshot.json'

definePageMeta({ layout: 'docs' })
const name = String(useRoute().params.name)
const app = snapshot.profiles.app.descriptors.find((item) => item.name === name)
if (!app) throw createError({ statusCode: 404, statusMessage: 'Unknown BitterClip MCP tool' })
const guidance = snapshot.profiles.app.guidance.find((item) => item.name === name)
const model = snapshot.profiles.model.descriptors.find((item) => item.name === name)
const liveName = name === 'workspace_open' ? 'workspace_get_link' : name
const live = snapshot.profiles.live_workspace.descriptors.find((item) => item.name === liveName)
const canonical = `https://bitterclip.com/docs/assistants/tools/${name}`
const source = `https://github.com/sheetgenius/bitterclip-marketing/blob/${snapshot.public_contract_commit}/contracts/mcp/tools/${name}.json`
useHead({
  title: `${name} · BitterClip MCP tools`,
  meta: [
    { name: 'description', content: app.description.slice(0, 155) },
    { property: 'og:url', content: canonical },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})
const format = (value: unknown) => JSON.stringify(value, null, 2)
</script>

<template>
  <article class="tool-page">
    <p><a href="/docs/assistants/tool-reference">All MCP tools</a></p>
    <h1><code>{{ name }}</code></h1>
    <h2>{{ app.title }}</h2>
    <p class="tool-page__description">{{ app.description }}</p>
    <p><strong>Surface:</strong> {{ model ? 'Default model and app' : 'App-only' }}</p>
    <p class="tool-page__provenance">
      Product release <code>{{ snapshot.product_release }}</code><br>
      Public contract commit <code>{{ snapshot.public_contract_commit }}</code><br>
      Public contract SHA-256 <code>{{ snapshot.public_contract_digest }}</code><br>
      Captured {{ snapshot.retrieved_at }}.
      <a :href="source">Review or improve this contract on GitHub</a>.
    </p>
    <p>These blocks show the complete MCP descriptors captured from serving Rails. Security schemes and resource URIs can differ by connected host.</p>
    <section v-if="model">
      <h2>Default model descriptor</h2>
      <pre><code>{{ format(model) }}</code></pre>
    </section>
    <section>
      <h2>App descriptor</h2>
      <pre><code>{{ format(app) }}</code></pre>
    </section>
    <section v-if="live">
      <h2>Live Workspace descriptor</h2>
      <pre><code>{{ format(live) }}</code></pre>
    </section>
    <section v-if="guidance">
      <h2>Errors</h2>
      <pre><code>{{ format(guidance.errors) }}</code></pre>
      <h2>Examples</h2>
      <pre><code>{{ format(guidance.examples) }}</code></pre>
    </section>
  </article>
</template>

<style scoped>
.tool-page__description { white-space: pre-wrap; }
.tool-page__provenance { border-left: 2px solid #f28f84; padding: 0.6rem 1rem; font-size: 0.82rem; overflow-wrap: anywhere; }
.tool-page pre { overflow-x: auto; white-space: pre; font-size: 0.72rem; }
.tool-page section { margin-top: 2.5rem; }
</style>
