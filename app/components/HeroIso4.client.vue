<script setup lang="ts">
/**
 * Mounts the real-3D iso scene. The scene module (and three.js with it) loads
 * via dynamic import so it lives in a lazy chunk owned by this lab route —
 * three.js must never enter the homepage bundle.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Iso4Scene } from '~/lib/hero-iso4/scene'

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let sceneCtl: Iso4Scene | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let calm: MediaQueryList | null = null

onMounted(async () => {
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return

  const { createIso4 } = await import('~/lib/hero-iso4/scene')
  sceneCtl = createIso4(cv)
  sceneCtl.resize()
  // Same hook name as the 2D study so qa/iso-shot.mjs works on both routes.
  ;(window as unknown as { __iso?: Iso4Scene }).__iso = sceneCtl

  calm = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (calm.matches) sceneCtl.still()
  else sceneCtl.start()

  ro = new ResizeObserver(() => sceneCtl?.resize())
  ro.observe(el)
  io = new IntersectionObserver(
    (entries) => {
      if (calm?.matches) return
      entries.some((e) => e.isIntersecting) ? sceneCtl?.start() : sceneCtl?.stop()
    },
    { threshold: 0.02 },
  )
  io.observe(el)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  io?.disconnect()
  sceneCtl?.destroy()
})
</script>

<template>
  <div ref="host" class="iso4" aria-hidden="true">
    <canvas ref="canvas" class="iso4__gl" />
  </div>
</template>

<style scoped>
.iso4,
.iso4__gl {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

