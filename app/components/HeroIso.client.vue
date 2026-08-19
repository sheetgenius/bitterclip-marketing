<script setup lang="ts">
/**
 * Mounts the isometric blocking study. Client-only because it needs a canvas.
 *
 * Nuxt wraps *.client.vue in createClientOnly, whose own onMounted runs before
 * this one, so the template ref can still be null on the first tick. Wait for
 * it rather than bailing — bailing leaves the canvas unsized and nothing draws.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { createIsoRenderer, type IsoRenderer } from '~/lib/hero-iso/renderer'

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let renderer: IsoRenderer | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let calm: MediaQueryList | null = null

onMounted(async () => {
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return

  renderer = createIsoRenderer(cv)
  renderer.resize()
  // Workshop hook: lets a screenshot harness freeze the machine at an exact t,
  // so two builds can be compared at the same instant. Harmless in prod.
  ;(window as unknown as { __iso?: IsoRenderer }).__iso = renderer

  // Reduced motion gets ONE frame and no loop — not a slower loop. The canvas
  // is the whole animation here, so honouring the preference in CSS alone (as
  // the beacon does) would leave the largest moving thing on the page moving.
  calm = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (calm.matches) renderer.still(2.35)
  else renderer.start()

  ro = new ResizeObserver(() => renderer?.resize())
  ro.observe(el)
  io = new IntersectionObserver(
    (entries) => {
      if (calm?.matches) return
      entries.some((e) => e.isIntersecting) ? renderer?.start() : renderer?.stop()
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
  <div ref="host" class="iso" aria-hidden="true">
    <canvas ref="canvas" class="iso__gl" />
  </div>
</template>

<style scoped>
.iso,
.iso__gl {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
