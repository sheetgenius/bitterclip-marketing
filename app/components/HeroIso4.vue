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

// The canonical picture/video queries deliberately retain their broadly
// compatible inclusive bounds. A picture selects the first matching source,
// but independent preload links would fetch both neighbors at an exact aspect
// boundary. These stricter MQ4 ranges are progressive-enhancement hints only:
// an older browser may skip the preload and still choose the correct picture
// and video through the canonical queries below.
const PRELOAD_MEDIA_BY_KEY: Readonly<Record<string, string>> = Object.freeze({
  mobile: '(max-width: 599px)',
  tablet: '(min-width: 600px) and (max-width: 959px)',
  tall: '(min-width: 960px) and (aspect-ratio <= 4/3)',
  classic: '(min-width: 960px) and (aspect-ratio > 4/3) and (aspect-ratio <= 3/2)',
  standard: '(min-width: 960px) and (aspect-ratio > 3/2) and (aspect-ratio <= 17/10)',
  wide: '(min-width: 960px) and (aspect-ratio > 17/10) and (aspect-ratio <= 29/16)',
  panoramic: '(min-width: 960px) and (aspect-ratio > 29/16) and (aspect-ratio <= 2/1)',
  ultrawide: '(min-width: 960px) and (aspect-ratio > 2/1)',
  'wide-band': '(min-width: 960px) and (aspect-ratio > 17/10)',
})

const motionMedia = (
  variant: PosterVariant,
  preference: 'no-preference' | 'reduce',
) => `(prefers-reduced-motion: ${preference}) and ${PRELOAD_MEDIA_BY_KEY[variant.key] ?? variant.media}`

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
    : liveAuthoring
      ? PREPAINT_VARIANTS
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
const reducedMotionSourceVariants = computed(() => releaseVariants.value)

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
      media: motionMedia(variant, 'no-preference'),
      fetchpriority: 'high',
    })),
    ...releaseVariants.value.map((variant) => ({
      rel: 'preload',
      as: 'image',
      href: variant.terminalPosterUrl,
      media: motionMedia(variant, 'reduce'),
      fetchpriority: 'high',
    })),
  ],
}))

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const prepaintImage = ref<HTMLImageElement | null>(null)
const terminalPosterImage = ref<HTMLImageElement | null>(null)
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
let reducedMotionPromise: Promise<void> | null = null
const TAKEOVER_MS = 180
const FRAME_ZERO_EPSILON_SECONDS = 1 / 120
const PRESENTATION_TIMEOUT_MS = 1_200
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const mark = (name: string) => performance.mark(`iso4:${name}`)

const selectReleaseVariant = () => (
  releaseVariants.value.find((variant) => window.matchMedia(variant.media).matches)
  ?? fallbackVariant.value
)

interface PresentedFrame {
  compositor: boolean
  mediaTime: number
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: { mediaTime: number }) => void,
  ) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

const waitForMediaEvent = (
  video: HTMLVideoElement,
  event: 'loadeddata' | 'seeked',
  timeoutMs: number,
) => new Promise<boolean>((resolve) => {
  let settled = false
  const finish = (received: boolean) => {
    if (settled) return
    settled = true
    window.clearTimeout(timeout)
    video.removeEventListener(event, receivedEvent)
    resolve(received)
  }
  const receivedEvent = () => finish(true)
  const timeout = window.setTimeout(() => finish(false), timeoutMs)
  video.addEventListener(event, receivedEvent, { once: true })
})

const waitForPresentedFrame = async (
  video: HTMLVideoElement,
  timeoutMs = PRESENTATION_TIMEOUT_MS,
): Promise<PresentedFrame | null> => {
  const callbackVideo = video as VideoWithFrameCallback
  if (callbackVideo.requestVideoFrameCallback) {
    return await new Promise<PresentedFrame | null>((resolve) => {
      let settled = false
      const finish = (presented: PresentedFrame | null) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        if (!presented) callbackVideo.cancelVideoFrameCallback?.(handle)
        resolve(presented)
      }
      const handle = callbackVideo.requestVideoFrameCallback?.((_now, metadata) => finish({
        compositor: true,
        mediaTime: metadata.mediaTime,
      })) ?? 0
      const timeout = window.setTimeout(() => finish(null), timeoutMs)
    })
  }
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    && !await waitForMediaEvent(video, 'loadeddata', timeoutMs)) {
    return null
  }
  // `seeked` guarantees the media position in older Safari. Two paints then
  // give its compositor a bounded opportunity to adopt that decoded frame.
  await nextFrame()
  await nextFrame()
  return { compositor: false, mediaTime: video.currentTime }
}

const rewindToPresentedFrameZero = async (
  video: HTMLVideoElement,
  primed: PresentedFrame,
) => {
  video.pause()
  if (Math.abs(video.currentTime) <= FRAME_ZERO_EPSILON_SECONDS
    && Math.abs(primed.mediaTime) <= FRAME_ZERO_EPSILON_SECONDS) {
    return true
  }

  const callbackVideo = video as VideoWithFrameCallback
  const presentedFrame = callbackVideo.requestVideoFrameCallback
    ? waitForPresentedFrame(video)
    : null
  const seeked = waitForMediaEvent(video, 'seeked', PRESENTATION_TIMEOUT_MS)
  video.currentTime = 0
  if (video.seeking && !await seeked) return false

  const presented = presentedFrame
    ? await presentedFrame
    : await waitForPresentedFrame(video)
  return Boolean(presented
    && Math.abs(video.currentTime) <= FRAME_ZERO_EPSILON_SECONDS
    && Math.abs(presented.mediaTime) <= FRAME_ZERO_EPSILON_SECONDS)
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
  const paintedImage = prepaintImage.value
  const terminalUrl = new URL(terminal, document.baseURI).href
  const image = paintedImage?.currentSrc === terminalUrl ? paintedImage : new Image()
  if (image !== paintedImage) {
    image.decoding = 'async'
    image.src = terminal
  }
  try {
    await image.decode()
    terminalPosterReady.value = true
    await nextTick()
    // The preloader and the visible terminal layer are separate image
    // elements. Decode the element that will actually own the pixels before
    // beginning the terminal crossfade; cache warmth alone is not a paint
    // guarantee on Safari or under decoder pressure.
    const terminalImage = terminalPosterImage.value
    if (!terminalImage) throw new Error('terminal poster layer did not mount')
    await terminalImage.decode()
    if (!terminalImage.complete || terminalImage.naturalWidth < 1 || terminalImage.naturalHeight < 1) {
      throw new Error('terminal poster layer did not decode')
    }
    return true
  } catch {
    terminalPosterReady.value = false
    await nextTick()
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

const enterReducedMotion = () => {
  if (liveAuthoring) {
    sceneCtl?.stop()
    sceneCtl?.still()
    return Promise.resolve()
  }
  if (completed) return reducedMotionPromise ?? Promise.resolve()
  if (reducedMotionPromise) return reducedMotionPromise

  // Reduced motion is a one-way decision for this visit. If the preference
  // changes while the hidden decoder is priming or while the movie is playing,
  // stop immediately and transfer ownership to the exact terminal still.
  // Falling back to the responsive opening picture is safe here because its
  // reduced-motion <source> is itself the exact terminal poster.
  completed = true
  deliveryVideo.value?.pause()
  reducedMotionPromise = (async () => {
    if (await prepareTerminalPoster()) {
      phase.value = 'terminal'
      decoderReleaseTimer = window.setTimeout(releaseDecoder, TAKEOVER_MS + 80)
    } else {
      phase.value = 'opening'
      releaseDecoder()
    }
  })()
  return reducedMotionPromise
}

const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
  if (event.matches) void enterReducedMotion()
}

const beginVideoDelivery = async () => {
  const video = deliveryVideo.value
  if (!video || preparingVideo || completed || phase.value !== 'opening') return
  preparingVideo = true
  video.muted = true
  video.pause()
  try {
    video.currentTime = 0
    // Register before `play()` so CPU pressure cannot let the hidden decoder
    // advance past the first composited frame before we observe it.
    const [presented] = await Promise.all([waitForPresentedFrame(video), video.play()])
    if (!presented) throw new Error('video first-frame presentation timed out')
    if (!await rewindToPresentedFrameZero(video, presented)) {
      throw new Error('video could not rewind to presented frame zero')
    }
    phase.value = 'handoff'
    await wait(TAKEOVER_MS)
    if (calm?.matches) {
      await enterReducedMotion()
      return
    }
    if (completed) return
    if (!heroVisible || document.hidden) {
      phase.value = 'playing'
      return
    }
    await video.play()
    phase.value = 'playing'
  } catch (error) {
    if (import.meta.dev) console.warn('[iso4] video delivery failed', error)
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
  calm.addEventListener('change', handleMotionPreferenceChange)
  selectedVariant.value = selectReleaseVariant()
  if (calm.matches) {
    await enterReducedMotion()
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
  calm?.removeEventListener('change', handleMotionPreferenceChange)
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
        v-for="variant in reducedMotionSourceVariants"
        :key="`terminal-reduced-${variant.key}`"
        :media="`(prefers-reduced-motion: reduce) and ${variant.media}`"
        :srcset="variant.terminalPosterUrl"
      >
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
          ref="terminalPosterImage"
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
