<script setup lang="ts">
/**
 * Mounts the real-3D iso scene. The scene module (and three.js with it) loads
 * via dynamic import so it lives in a lazy chunk owned by this lab route —
 * three.js must never enter the homepage bundle.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Iso3Scene } from '~/lib/hero-iso3/scene'

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let sceneCtl: Iso3Scene | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let calm: MediaQueryList | null = null

onMounted(async () => {
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return

  const { createIso3 } = await import('~/lib/hero-iso3/scene')
  sceneCtl = createIso3(cv)
  sceneCtl.resize()
  // Same hook name as the 2D study so qa/iso-shot.mjs works on both routes.
  ;(window as unknown as { __iso?: Iso3Scene }).__iso = sceneCtl

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
  <div ref="host" class="iso3" aria-hidden="true">
    <canvas ref="canvas" class="iso3__gl" />
  </div>
</template>

<style scoped>
.iso3,
.iso3__gl {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
