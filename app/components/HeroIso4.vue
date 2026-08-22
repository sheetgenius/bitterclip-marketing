<script setup lang="ts">
/**
 * Mounts the real-3D ISO4 scene. A server-rendered apparatus prepaint protects
 * the homepage composition while the browser loads three.js and compiles the
 * first WebGL frame; the live canvas replaces it only after an actual paint.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Iso4Scene } from '~/lib/hero-iso4/scene'

useHead({
  link: [
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-mobile.webp', media: '(max-width: 599px)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-tablet.webp', media: '(min-width: 600px) and (max-width: 959px)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-tall.webp', media: '(min-width: 960px) and (max-aspect-ratio: 1.399)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-wide.webp', media: '(min-width: 960px) and (min-aspect-ratio: 1.4)' },
  ],
})

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const painted = ref(false)
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
  // Same hook name as the 2D study so the homepage QA harness can seek the
  // canonical product surface deterministically.
  ;(window as unknown as { __iso?: Iso4Scene }).__iso = sceneCtl

  calm = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (calm.matches) sceneCtl.still()
  else sceneCtl.still(0)

  // Do not remove the prepaint merely because the scene object exists. Wait
  // for its first composed canvas frame, then crossfade and start the clock.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  painted.value = true
  if (!calm.matches) sceneCtl.start()

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
  <div ref="host" class="iso4" :class="{ 'iso4--painted': painted }" aria-hidden="true">
    <picture class="iso4__prepaint">
      <source media="(max-width: 599px)" srcset="/images/hero/iso4-prepaint-mobile.webp">
      <source media="(max-width: 959px)" srcset="/images/hero/iso4-prepaint-tablet.webp">
      <source media="(max-aspect-ratio: 1.399)" srcset="/images/hero/iso4-prepaint-tall.webp">
      <img
        src="/images/hero/iso4-prepaint-wide.webp"
        alt=""
        width="1600"
        height="900"
        loading="eager"
        fetchpriority="high"
        decoding="async"
      >
    </picture>
    <canvas ref="canvas" class="iso4__gl" />
  </div>
</template>

<style scoped>
.iso4 {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #08090a;
}

.iso4__prepaint {
  position: absolute;
  inset: 0;
  opacity: 1;
  transition: opacity 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

.iso4__prepaint img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.iso4__gl {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.iso4--painted .iso4__prepaint {
  opacity: 0;
}

.iso4--painted .iso4__gl {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .iso4__prepaint,
  .iso4__gl {
    transition: none;
  }
}
</style>
