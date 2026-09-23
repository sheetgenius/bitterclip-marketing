<script setup lang="ts">
// One-click Claude setup: opens Claude's "Add custom connector" window with
// BitterClip's name and address filled in. Reads claude_connector_add_url from
// _data/site.yml. Invoke: ::add-to-claude
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
</script>

<template>
  <p class="docs-snippet docs-cta">
    <a :href="site?.claude_connector_add_url" target="_blank" rel="noopener">Add BitterClip to Claude</a>.
    Claude opens its <strong>Add custom connector</strong> window with BitterClip's name and
    address already filled in. Check that the address is
    <code>{{ site?.mcp_resource_url }}</code>, click <strong>Continue</strong>, then sign in to
    BitterClip. Claude warns that the connector came from an external link; that is expected
    while BitterClip is not yet listed in Claude's directory.
  </p>
</template>
