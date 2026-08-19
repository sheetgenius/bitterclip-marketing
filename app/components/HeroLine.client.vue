<script setup lang="ts">
/**
 * Mounts the assembly-line renderer. Client-only because it needs a canvas.
 *
 * Nuxt wraps *.client.vue in createClientOnly, whose own onMounted runs before
 * this one, so the template ref can still be null on the first tick. Wait for
 * it rather than bailing — bailing leaves the canvas unsized and nothing draws.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { createHeroLineRenderer, type HeroLineRenderer } from '~/lib/hero-line/renderer'

const props = withDefaults(defineProps<{ direction?: 'ltr' | 'rtl'; fixedTimeMs?: number | null }>(), {
  direction: 'ltr',
  fixedTimeMs: null,
})

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let renderer: HeroLineRenderer | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null

onMounted(async () => {
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return

  // The prop is captured once, here. On a statically prerendered page the route
  // query is not resolved at this point, so read the URL directly as the
  // authority and let the prop act as an override for programmatic use.
  const q = new URLSearchParams(window.location.search)
  const qT = q.get('t')
  const qDir = q.get('dir') === 'rtl' ? 'rtl' : null

  renderer = createHeroLineRenderer(cv, {
    direction: qDir ?? props.direction,
    fixedTimeMs: props.fixedTimeMs ?? (qT !== null ? Number(qT) : null),
  })
  renderer.resize()
  renderer.start()

  ro = new ResizeObserver(() => renderer?.resize())
  ro.observe(el)

  // A line that keeps running after the reader scrolls past is pure battery.
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) renderer?.start()
      else renderer?.stop()
    },
    { threshold: 0.02 },
  )
  io.observe(el)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  io?.disconnect()
  renderer?.destroy()
})
</script>

<template>
  <div ref="host" class="line" aria-hidden="true">
    <canvas ref="canvas" class="line__gl" />
  </div>
</template>

<style scoped>
.line,
.line__gl {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
