<script setup lang="ts">
// Renders a CURATED, creator-facing subset of MCP tools from _data/mcp-tools.yml.
// MUST be labeled as a subset (the live server has ~80 operations).
// Optional `group` prop filters to one group. Invoke: ::mcp-tools  or  ::mcp-tools{group="clip"}
const props = defineProps<{ group?: string }>()

// Shape mirrors the mcpTools zod schema in content.config.ts. Typing the rows
// means a renamed field is caught at build, not silently rendered as empty.
interface McpTool {
  name: string
  ask: string
  group: string
  plain_purpose: string
  primary: boolean
  creator_facing: boolean
}

const { data: tools } = await useAsyncData('mcp-tools', async () => {
  const doc = await queryCollection('mcpTools').first()
  return (doc?.tools ?? []) as McpTool[]
})

const visible = computed(() =>
  (tools.value ?? [])
    .filter((t) => t.creator_facing)
    .filter((t) => !props.group || t.group === props.group),
)
</script>

<template>
  <div class="docs-snippet docs-mcp-tools">
    <!-- STUB styling; the subset label is load-bearing and must stay. -->
    <p class="docs-mcp-tools__caption">
      A few of the things you can ask your assistant to do. It knows plenty more; this is a short, friendly tour, not the full list.
    </p>
    <table>
      <thead>
        <tr>
          <th>What you can ask for</th>
          <th>What happens</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tool in visible" :key="tool.name" :data-primary="tool.primary">
          <td>
            {{ tool.ask }}
            <span v-if="tool.primary" class="docs-mcp-tools__primary"> (the main one)</span>
          </td>
          <td>{{ tool.plain_purpose }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
