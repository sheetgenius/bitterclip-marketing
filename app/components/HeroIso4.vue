<script setup lang="ts">
/**
 * ISO4 has one authoring scene and one delivery shell.
 *
 * Development keeps the real Three.js scene and its deterministic diagnostics.
 * Production never imports that scene: it SSRs an immediate opening poster,
 * plays one selected immutable Artifact variant once, then releases the decoder
 * behind the exact terminal poster.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import manropeLatinUrl from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url'
import type { Iso4Scene } from '~/lib/hero-iso4/scene'
import { iso4Release, iso4ReleaseReady } from '~/lib/hero-iso4/release'

interface PosterVariant {
  key: string
  media: string
  width: number
  height: number
  openingPosterUrl: string
  terminalPosterUrl: string
  mp4Url: string
}

type DeliveryPhase = 'opening' | 'handoff' | 'playing' | 'terminal' | 'terminal-video'

const PREPAINT_VARIANTS: PosterVariant[] = [
  { key: 'mobile', media: '(max-width: 599px)', width: 440, height: 956, openingPosterUrl: '/images/hero/iso4-prepaint-mobile.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-mobile.webp', mp4Url: '' },
  { key: 'tablet', media: '(min-width: 600px) and (max-width: 959px)', width: 768, height: 900, openingPosterUrl: '/images/hero/iso4-prepaint-tablet.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-tablet.webp', mp4Url: '' },
  { key: 'tall', media: '(min-width: 960px) and (max-aspect-ratio: 4/3)', width: 1817, height: 1454, openingPosterUrl: '/images/hero/iso4-prepaint-tall.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-tall.webp', mp4Url: '' },
  { key: 'classic', media: '(min-width: 960px) and (min-aspect-ratio: 4/3) and (max-aspect-ratio: 3/2)', width: 1400, height: 1000, openingPosterUrl: '/images/hero/iso4-prepaint-classic.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-classic.webp', mp4Url: '' },
  { key: 'standard', media: '(min-width: 960px) and (min-aspect-ratio: 3/2) and (max-aspect-ratio: 17/10)', width: 1600, height: 1000, openingPosterUrl: '/images/hero/iso4-prepaint-standard.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-standard.webp', mp4Url: '' },
  { key: 'wide', media: '(min-width: 960px) and (min-aspect-ratio: 17/10) and (max-aspect-ratio: 29/16)', width: 1600, height: 900, openingPosterUrl: '/images/hero/iso4-prepaint-wide.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-wide.webp', mp4Url: '' },
  { key: 'panoramic', media: '(min-width: 960px) and (min-aspect-ratio: 29/16) and (max-aspect-ratio: 2/1)', width: 1728, height: 936, openingPosterUrl: '/images/hero/iso4-prepaint-panoramic.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-panoramic.webp', mp4Url: '' },
  { key: 'ultrawide', media: '(min-width: 960px) and (min-aspect-ratio: 2/1)', width: 1920, height: 900, openingPosterUrl: '/images/hero/iso4-prepaint-ultrawide.webp', terminalPosterUrl: '/images/hero/iso4-prepaint-ultrawide.webp', mp4Url: '' },
]

const route = useRoute()
// The query is deliberately development-only. Production cannot opt back into
// shaders or workshop controls, even if the same query string is present.
const liveAuthoring = import.meta.dev && route.query.iso4Delivery !== 'video'
const diagnosticParam = (key: string) => {
  if (!import.meta.dev || liveAuthoring) return ''
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}
const diagnosticDimension = (key: string, fallback: number) => {
  const value = Number(diagnosticParam(key))
  return Number.isFinite(value) && value >= 1 ? Math.round(value) : fallback
}
const diagnosticVariant = computed<PosterVariant | null>(() => {
  const mp4Url = diagnosticParam('iso4Video')
  const openingPosterUrl = diagnosticParam('iso4Opening')
  const terminalPosterUrl = diagnosticParam('iso4Terminal')
  if (!(mp4Url && openingPosterUrl && terminalPosterUrl)) return null
  return {
    key: 'diagnostic',
    media: '(min-width: 0px)',
    width: diagnosticDimension('iso4Width', 1600),
    height: diagnosticDimension('iso4Height', 900),
    mp4Url,
    openingPosterUrl,
    terminalPosterUrl,
  }
})
const releaseVariants = computed<PosterVariant[]>(() => (
  diagnosticVariant.value
    ? [diagnosticVariant.value]
    : iso4ReleaseReady
      ? iso4Release.variants
      : PREPAINT_VARIANTS
))
const deliveryReady = computed(() => Boolean(diagnosticVariant.value || iso4ReleaseReady))
const fallbackVariant = computed(() => releaseVariants.value.at(-1)!)
const activePosterVariant = computed(() => selectedVariant.value ?? fallbackVariant.value)
// Keep the SSR picture topology stable through hydration. The browser chooses
// one matching image candidate; removing the sources after JS selects that
// same candidate needlessly reparses the picture and can cause a visible
// poster handoff on cold load.
const openingSourceVariants = computed(() => releaseVariants.value.slice(0, -1))

useHead(() => ({
  link: [
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: manropeLatinUrl,
      crossorigin: 'anonymous',
    },
    ...releaseVariants.value.map((variant) => ({
      rel: 'preload',
      as: 'image',
      href: variant.openingPosterUrl,
      media: variant.media,
      fetchpriority: 'high',
    })),
  ],
}))

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const prepaintImage = ref<HTMLImageElement | null>(null)
const deliveryVideo = ref<HTMLVideoElement | null>(null)
const painted = ref(false)
const phase = ref<DeliveryPhase>('opening')
const videoSrc = ref('')
const selectedVariant = ref<PosterVariant | null>(null)
const terminalPosterReady = ref(false)
let sceneCtl: Iso4Scene | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let calm: MediaQueryList | null = null
let completed = false
let finishing = false
let preparingVideo = false
let heroVisible = true
let decoderReleaseTimer = 0
const TAKEOVER_MS = 180
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const mark = (name: string) => performance.mark(`iso4:${name}`)

const selectReleaseVariant = () => (
  releaseVariants.value.find((variant) => window.matchMedia(variant.media).matches)
  ?? fallbackVariant.value
)

const waitForPresentedFrame = async (video: HTMLVideoElement) => {
  type VideoWithFrameCallback = HTMLVideoElement & {
    requestVideoFrameCallback?: (callback: () => void) => number
    cancelVideoFrameCallback?: (handle: number) => void
  }
  const callbackVideo = video as VideoWithFrameCallback
  if (callbackVideo.requestVideoFrameCallback) {
    return await new Promise<boolean>((resolve) => {
      let settled = false
      const finish = (presented: boolean) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        if (!presented) callbackVideo.cancelVideoFrameCallback?.(handle)
        resolve(presented)
      }
      const handle = callbackVideo.requestVideoFrameCallback?.(() => finish(true)) ?? 0
      const timeout = window.setTimeout(() => finish(false), 750)
    })
  }
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    await nextFrame()
    return true
  }
  return await Promise.race([
    new Promise<boolean>((resolve) => video.addEventListener('loadeddata', () => resolve(true), { once: true })),
    wait(500).then(() => false),
  ])
}

const releaseDecoder = () => {
  const video = deliveryVideo.value
  if (!video) return
  video.pause()
  video.removeAttribute('src')
  video.load()
  videoSrc.value = ''
}

const prepareTerminalPoster = async () => {
  if (terminalPosterReady.value) return true
  const terminal = selectedVariant.value?.terminalPosterUrl
  if (!terminal) return false
  const image = new Image()
  image.decoding = 'async'
  image.src = terminal
  try {
    await image.decode()
    terminalPosterReady.value = true
    await nextTick()
    return true
  } catch {
    return false
  }
}

const finishDelivery = async () => {
  if (completed || finishing) return
  finishing = true
  if (!await prepareTerminalPoster()) {
    // The video element already owns the exact terminal frame at `ended`.
    // If the matching poster cannot decode, retain that motionless frame and
    // its decoder instead of flashing all the way back to the opening image.
    completed = true
    deliveryVideo.value?.pause()
    phase.value = 'terminal-video'
    finishing = false
    return
  }
  completed = true
  phase.value = 'terminal'
  decoderReleaseTimer = window.setTimeout(releaseDecoder, TAKEOVER_MS + 80)
  finishing = false
}

const handleDeliveryError = () => {
  if (completed) return
  phase.value = 'opening'
  releaseDecoder()
}

const beginVideoDelivery = async () => {
  const video = deliveryVideo.value
  if (!video || preparingVideo || completed || phase.value !== 'opening') return
  preparingVideo = true
  video.muted = true
  video.pause()
  try {
    video.currentTime = 0
    const play = video.play()
    const [, presented] = await Promise.all([play, waitForPresentedFrame(video)])
    if (!presented) throw new Error('video first-frame presentation timed out')
    video.pause()
    phase.value = 'handoff'
    await wait(TAKEOVER_MS)
    if (completed || calm?.matches) return
    if (!heroVisible || document.hidden) {
      phase.value = 'playing'
      return
    }
    await video.play()
    phase.value = 'playing'
  } catch {
    // Autoplay denial or decode failure preserves the already-painted opening
    // poster. Never flash black and never substitute the live scene.
    handleDeliveryError()
  } finally {
    preparingVideo = false
  }
}

const syncDeliveryPlayback = () => {
  const video = deliveryVideo.value
  if (!video || completed || phase.value !== 'playing') return
  if (!heroVisible || document.hidden) video.pause()
  else void video.play().catch(() => {})
}

const mountDelivery = async () => {
  calm = window.matchMedia('(prefers-reduced-motion: reduce)')
  selectedVariant.value = selectReleaseVariant()
  if (calm.matches) {
    if (await prepareTerminalPoster()) phase.value = 'terminal'
    return
  }
  if (!deliveryReady.value || !selectedVariant.value.mp4Url) return

  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean }
  }).connection
  if (connection?.saveData) return

  // Let the high-priority SSR poster reach paint before beginning the larger
  // media request. Decoding and painting the poster is the useful LCP event;
  // an idle callback (with a short bound) then starts the cinematic promptly.
  try {
    await prepaintImage.value?.decode()
  } catch {
    // A decode failure leaves the browser's normal image fallback visible.
  }
  await nextFrame()
  await new Promise<void>((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 180 })
    } else {
      window.setTimeout(resolve, 80)
    }
  })
  videoSrc.value = selectedVariant.value.mp4Url
  await nextTick()
  const video = deliveryVideo.value
  if (!video) return
  video.load()
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) void beginVideoDelivery()

  io = new IntersectionObserver((entries) => {
    heroVisible = entries.some((entry) => entry.isIntersecting)
    syncDeliveryPlayback()
  }, { threshold: 0.02 })
  if (host.value) io.observe(host.value)
  document.addEventListener('visibilitychange', syncDeliveryPlayback)
}

const mountLiveScene = async () => {
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return
  try { await prepaintImage.value?.decode() } catch {}
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
  ;(window as unknown as { __iso?: Iso4Scene }).__iso = sceneCtl

  ro = new ResizeObserver(() => sceneCtl?.resize())
  ro.observe(el)
  io = new IntersectionObserver((entries) => {
    if (calm?.matches) return
    entries.some((entry) => entry.isIntersecting) ? sceneCtl?.start() : sceneCtl?.stop()
  }, { threshold: 0.02 })
  io.observe(el)
}

onMounted(() => {
  if (liveAuthoring) void mountLiveScene()
  else void mountDelivery()
})

onBeforeUnmount(() => {
  window.clearTimeout(decoderReleaseTimer)
  document.removeEventListener('visibilitychange', syncDeliveryPlayback)
  ro?.disconnect()
  io?.disconnect()
  releaseDecoder()
  sceneCtl?.destroy()
})
</script>

<template>
  <div
    ref="host"
    class="iso4"
    :class="{
      'iso4--painted': painted,
      'iso4--handoff': phase === 'handoff',
      'iso4--playing': phase === 'playing',
      'iso4--terminal': phase === 'terminal',
      'iso4--terminal-video': phase === 'terminal-video',
    }"
    :data-iso4-mode="liveAuthoring ? 'live' : 'video'"
    :data-iso4-phase="liveAuthoring ? (painted ? 'live' : 'opening') : phase"
    :data-iso4-generation="diagnosticVariant ? 'diagnostic' : (iso4Release.generation ?? 'unpublished')"
    aria-hidden="true"
  >
    <picture class="iso4__poster iso4__poster--opening iso4__prepaint">
      <source
        v-for="variant in openingSourceVariants"
        :key="`opening-${variant.key}`"
        :media="variant.media"
        :srcset="variant.openingPosterUrl"
      >
      <img
        ref="prepaintImage"
        :src="fallbackVariant.openingPosterUrl"
        alt=""
        :width="fallbackVariant.width"
        :height="fallbackVariant.height"
        loading="eager"
        fetchpriority="high"
        decoding="async"
      >
    </picture>

    <canvas v-if="liveAuthoring" ref="canvas" class="iso4__gl" />

    <template v-else>
      <video
        v-if="videoSrc"
        ref="deliveryVideo"
        class="iso4__video"
        :src="videoSrc"
        autoplay
        muted
        playsinline
        preload="auto"
        disablepictureinpicture
        @loadeddata="beginVideoDelivery"
        @ended="finishDelivery"
        @error="handleDeliveryError"
      />
      <picture v-if="terminalPosterReady" class="iso4__poster iso4__poster--terminal">
        <img
          :src="activePosterVariant.terminalPosterUrl"
          alt=""
          :width="activePosterVariant.width"
          :height="activePosterVariant.height"
          loading="eager"
          decoding="async"
        >
      </picture>
    </template>
  </div>
</template>
