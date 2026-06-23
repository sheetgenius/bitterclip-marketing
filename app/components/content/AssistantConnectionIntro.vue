<script setup lang="ts">
// Shared intro for the assistant pages: hosted remote MCP endpoint, no local setup.
// Reads mcp_resource_url from _data/site.yml. Invoke: ::assistant-connection-intro
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
</script>

<template>
  <div class="docs-snippet">
    <p>
      There's nothing to install and nothing to run on your computer. You point your
      assistant at <code>{{ site?.mcp_resource_url }}</code>, and it opens a normal browser
      window so you can sign in to BitterClip. You do that once. After that your assistant
      can reach your recordings whenever you ask, and your account stays on BitterClip's own
      site.
    </p>
  </div>
</template>
