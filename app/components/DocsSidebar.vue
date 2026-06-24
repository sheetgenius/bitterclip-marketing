<script setup lang="ts">
import { computed } from 'vue'

// Left navigation tree. Built from @nuxt/content's navigation for the `docs`
// collection (queryCollectionNavigation), then reshaped into the fixed section
// order the product uses. The hub page (/docs) is pinned to the top as "Overview".
const route = useRoute()

const { data: nav } = await useAsyncData('docs-navigation', () =>
  queryCollectionNavigation('docs'),
)

interface NavItem {
  title: string
  path: string
  order: number
}
interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

// Fixed section order + display labels (mirrors content.config.ts `section` enum
// and modules/generated-surfaces.ts ordering).
const SECTION_ORDER = [
  'getting-started',
  'assistants',
  'connect',
  'publishing',
  'help',
  'changelog',
] as const
const SECTION_LABELS: Record<string, string> = {
  'getting-started': 'Getting started',
  assistants: 'Assistants',
  connect: 'Connect',
  publishing: 'Publishing',
  help: 'Help',
  changelog: 'Changelog',
}

// queryCollectionNavigation returns a tree nested by directory. Flatten every
// leaf page (those with a real `.page !== false` and a path), and bucket it by
// the first path segment after /docs. The /docs hub itself is special-cased.
function flatten(items: any[] | undefined, acc: NavItem[] = []): NavItem[] {
  if (!items) return acc
  for (const item of items) {
    // A navigable page has a path and is not hidden. Dedupe by path: a directory
    // with an index.md surfaces both as a folder node and its index child sharing
    // the same path (e.g. /docs/changelog), so keep only the first.
    if (item.path && item.page !== false && !acc.some((a) => a.path === item.path)) {
      acc.push({
        title: item.title ?? item.path,
        path: item.path,
        order: typeof item.order === 'number' ? item.order : 99,
      })
    }
    if (item.children?.length) flatten(item.children, acc)
  }
  return acc
}

const hub = computed<NavItem | null>(() => {
  const all = flatten(nav.value as any[])
  return all.find((i) => i.path === '/docs') ?? null
})

const sections = computed<NavSection[]>(() => {
  const all = flatten(nav.value as any[]).filter((i) => i.path !== '/docs')
  const buckets = new Map<string, NavItem[]>()
  for (const item of all) {
    // /docs/<section>/<page>  ->  section is segment index 2
    const seg = item.path.split('/')[2] ?? 'help'
    if (!buckets.has(seg)) buckets.set(seg, [])
    buckets.get(seg)!.push(item)
  }
  const out: NavSection[] = []
  for (const id of SECTION_ORDER) {
    const items = buckets.get(id)
    if (!items?.length) continue
    items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    out.push({ id, label: SECTION_LABELS[id] ?? id, items })
  }
  return out
})

const isActive = (path: string) => route.path === path

defineEmits<{ navigate: [] }>()
</script>

<template>
  <nav class="docs-sidebar custom-scrollbar" aria-label="Documentation">
    <NuxtLink
      v-if="hub"
      :to="hub.path"
      class="docs-sidebar__hub"
      :class="{ 'is-active': isActive(hub.path) }"
      @click="$emit('navigate')"
    >
      <svg class="docs-sidebar__hub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
      <span>Overview</span>
    </NuxtLink>

    <div v-for="section in sections" :key="section.id" class="docs-sidebar__section">
      <h2 class="docs-sidebar__heading">{{ section.label }}</h2>
      <ul class="docs-sidebar__list">
        <li v-for="item in section.items" :key="item.path">
          <NuxtLink
            :to="item.path"
            class="docs-sidebar__link"
            :class="{ 'is-active': isActive(item.path) }"
            @click="$emit('navigate')"
          >
            {{ item.title }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.docs-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.25rem 0.75rem 3rem 0;
}

.docs-sidebar__hub {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border-radius: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(244, 244, 245, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.015);
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.docs-sidebar__hub-icon {
  width: 0.95rem;
  height: 0.95rem;
  color: #f28f84;
  flex: none;
}
.docs-sidebar__hub:hover {
  color: #fff;
  border-color: rgba(242, 143, 132, 0.25);
}
.docs-sidebar__hub.is-active {
  color: #fff;
  border-color: rgba(242, 143, 132, 0.4);
  background: rgba(242, 143, 132, 0.06);
}

.docs-sidebar__heading {
  margin: 0 0 0.5rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(244, 244, 245, 0.4);
}

.docs-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.docs-sidebar__link {
  display: block;
  position: relative;
  margin-left: -1px;
  padding: 0.4rem 0.7rem;
  border-left: 1px solid transparent;
  font-size: 0.875rem;
  line-height: 1.3;
  color: rgba(244, 244, 245, 0.62);
  transition: color 0.18s, border-color 0.18s;
}
.docs-sidebar__link:hover {
  color: rgba(244, 244, 245, 0.95);
}
.docs-sidebar__link.is-active {
  color: #f28f84;
  border-left-color: #f28f84;
  font-weight: 600;
}
</style>
