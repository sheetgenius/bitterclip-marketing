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
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-tall.webp', media: '(min-width: 960px) and (max-aspect-ratio: 4/3)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-classic.webp', media: '(min-width: 960px) and (min-aspect-ratio: 4/3) and (max-aspect-ratio: 3/2)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-standard.webp', media: '(min-width: 960px) and (min-aspect-ratio: 3/2) and (max-aspect-ratio: 17/10)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-wide.webp', media: '(min-width: 960px) and (min-aspect-ratio: 17/10) and (max-aspect-ratio: 39/20)' },
    { rel: 'preload', as: 'image', href: '/images/hero/iso4-prepaint-ultrawide.webp', media: '(min-width: 960px) and (min-aspect-ratio: 39/20)' },
  ],
})

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const prepaintImage = ref<HTMLImageElement | null>(null)
const painted = ref(false)
let sceneCtl: Iso4Scene | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let calm: MediaQueryList | null = null
const TAKEOVER_MS = 180
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const mark = (name: string) => performance.mark(`iso4:${name}`)

onMounted(async () => {
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return

  // Guarantee one complete, correctly sized SSR frame before three.js parsing
  // or scene construction can occupy the main thread. A failed decode leaves
  // the browser's normal image fallback intact; it must never block the hero.
  try {
    await prepaintImage.value?.decode()
  } catch {}
  await nextFrame()
  mark('prepaint-ready')

  mark('import-start')
  const { createIso4 } = await import('~/lib/hero-iso4/scene')
  mark('import-end')
  performance.measure('iso4:import', 'iso4:import-start', 'iso4:import-end')
  mark('create-start')
  sceneCtl = createIso4(cv)
  mark('create-end')
  performance.measure('iso4:create', 'iso4:create-start', 'iso4:create-end')
  await nextFrame()

  calm = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Size the renderer and precompute the deterministic field while the exact
  // prepaint owns the pixels. Yielding after construction keeps those costs
  // out of the first hidden WebGL render's task.
  mark('prepare-start')
  await sceneCtl.prepare()
  mark('prepare-end')
  performance.measure('iso4:prepare', 'iso4:prepare-start', 'iso4:prepare-end')
  await nextFrame()

  mark('first-frame-start')
  if (calm.matches) sceneCtl.still()
  else sceneCtl.still(0)
  mark('first-frame-end')
  performance.measure('iso4:first-frame', 'iso4:first-frame-start', 'iso4:first-frame-end')
  await nextFrame()

  // Both layers use the same duration and curve, so their alphas sum to one.
  // Keep the scene clock at zero until the matched-frame dissolve has ended;
  // motion can never leak into the poster-to-canvas handoff.
  mark('takeover-start')
  painted.value = true
  await nextTick()
  await nextFrame()
  await new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      cv.removeEventListener('transitionend', finish)
      resolve()
    }
    cv.addEventListener('transitionend', finish, { once: true })
    window.setTimeout(finish, TAKEOVER_MS + 80)
  })
  mark('takeover-end')
  performance.measure('iso4:takeover', 'iso4:takeover-start', 'iso4:takeover-end')
  if (!calm.matches) {
    sceneCtl.start()
    mark('timeline-start')
  }
  // Same hook name as the 2D study. Expose it only after mount has settled so
  // deterministic QA seeks cannot race the poster-to-canvas handoff.
  ;(window as unknown as { __iso?: Iso4Scene }).__iso = sceneCtl

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
      <source media="(max-aspect-ratio: 4/3)" srcset="/images/hero/iso4-prepaint-tall.webp">
      <source media="(max-aspect-ratio: 3/2)" srcset="/images/hero/iso4-prepaint-classic.webp">
      <source media="(max-aspect-ratio: 17/10)" srcset="/images/hero/iso4-prepaint-standard.webp">
      <source media="(max-aspect-ratio: 39/20)" srcset="/images/hero/iso4-prepaint-wide.webp">
      <img
        ref="prepaintImage"
        src="/images/hero/iso4-prepaint-ultrawide.webp"
        alt=""
        width="1920"
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
  transition: opacity 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

.iso4__prepaint img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.iso4__gl {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 180ms cubic-bezier(0.4, 0, 0.2, 1);
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
