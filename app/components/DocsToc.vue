<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Right-rail "On this page" table of contents. Fed the page's `body.toc.links`
// from @nuxt/content. Adds a lightweight scroll-spy that highlights the heading
// currently in view via IntersectionObserver.
interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

const props = defineProps<{
  links: TocLink[]
}>()

// Flatten the (possibly nested) toc to depth<=3 for a calm two-level rail.
const flat = computed<TocLink[]>(() => {
  const out: TocLink[] = []
  const walk = (items: TocLink[] | undefined) => {
    if (!items) return
    for (const l of items) {
      if (l.depth <= 3) out.push(l)
      walk(l.children)
    }
  }
  walk(props.links)
  return out
})

const activeId = ref<string>('')
let observer: IntersectionObserver | null = null

function setup() {
  if (observer) observer.disconnect()
  if (!flat.value.length || typeof window === 'undefined') return
  const headings = flat.value
    .map((l) => document.getElementById(l.id))
    .filter((el): el is HTMLElement => !!el)
  if (!headings.length) return

  observer = new IntersectionObserver(
    (entries) => {
      // Pick the topmost heading that is intersecting; fall back to last passed.
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) {
        activeId.value = visible[0].target.id
      }
    },
    { rootMargin: '0px 0px -70% 0px', threshold: 0 },
  )
  for (const h of headings) observer.observe(h)
  if (!activeId.value) activeId.value = flat.value[0]?.id ?? ''
}

onMounted(setup)
watch(flat, setup)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav v-if="flat.length" class="docs-toc" aria-label="On this page">
    <p class="docs-toc__title">On this page</p>
    <ul class="docs-toc__list">
      <li v-for="link in flat" :key="link.id" :data-depth="link.depth">
        <a
          :href="`#${link.id}`"
          class="docs-toc__link"
          :class="{ 'is-active': activeId === link.id }"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.docs-toc {
  position: sticky;
  top: 6.5rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}
.docs-toc__title {
  margin: 0 0 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(244, 244, 245, 0.4);
}
.docs-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}
.docs-toc__link {
  display: block;
  margin-left: -1px;
  padding: 0.3rem 0.85rem;
  border-left: 1px solid transparent;
  font-size: 0.8rem;
  line-height: 1.35;
  color: rgba(244, 244, 245, 0.5);
  transition: color 0.18s, border-color 0.18s;
}
.docs-toc__link:hover {
  color: rgba(244, 244, 245, 0.9);
}
.docs-toc__link.is-active {
  color: #f28f84;
  border-left-color: #f28f84;
}
li[data-depth='3'] .docs-toc__link {
  padding-left: 1.6rem;
  font-size: 0.76rem;
}
</style>
