/**
 * ISO4 — the particle-charged facing projector, descended from ISO3 and the
 * Canvas 2D study at /lab/iso. A modest-FOV perspective camera looks back
 * toward the projector's +X optical axis while a large floating dual-reel
 * mechanism stays dark behind the copy. A raw session crosses an optically
 * empty dashed threshold, becomes a suspended particle cloud, and activates the
 * threaded film three particles per 16fps frame before the three destinations
 * project toward the viewer.
 *
 * THE FILM IS ONE STATIC RIBBON WITH A LIVE TEXTURE. The ribbon's UV.u is
 * arclength along the path; every tick a small offscreen 2D canvas redraws
 * the strip IN WORLD-S SPACE — frame tones, sprocket perforations, caption
 * cells stamping in at the writer plane — so all of the study's transport
 * logic survives verbatim and the geometry never moves.
 *
 * This module is only ever loaded via dynamic import from a lab route —
 * three.js must never enter the homepage bundle.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export interface Iso4Scene {
  start(): void
  stop(): void
  still(t?: number): void
  inspect(t: number): Iso4MotionDiagnostics
  temporal(): Iso4TemporalDiagnostics
  resize(): void
  destroy(): void
}

export interface Iso4MotionDiagnostics {
  t: number
  visibleParticles: number
  suspendedParticles: number
  funnelingParticles: number
  registeringParticles: number
  transferringParticles: number
  writtenFrames: number
  fileDissolve: number
  p95SpeedPxPerFrame: number
  p95AccelerationPxPerFrame2: number
  p95JerkPxPerFrame3: number
  maxTrailPx: number
  meanHornRadiusScale: number
  hornTurnDegrees: number
  transportFramesPerSecond: number
  reelTangentFramesPerSecond: number
  reelAngleRadians: number
  apparatusYawDegrees: number
  apparatusYawSpeedDegreesPerSecond: number
  finalWriteAt: number
  projectorStrikeAt: number
}

export interface Iso4TemporalDiagnostics {
  timelineSeconds: number
  sourceVideoTimeSeconds: number
  projectionVideoTimeSeconds: number
  expectedProjectionVideoTimeSeconds: number
  sourceClockDriftMs: number
  projectionClockDriftMs: number
  presentedVideoFramesPerSecond: number
  presentedVideoFrameRevision: number
  presentedVideoMediaTimeSeconds: number
  outputTextureFramesPerSecond: number
  renderFramesPerSecond: number
  firstOutputTextureLatencyMs: number
  longestOutputHoldMs: number
  outputTextureRevision: number
  missedProjectionFrames: number
  mechanicalGateTick: number
  mechanicalGateFramesPerSecond: number
  missedMechanicalTicks: number
  sourceFramesPerSecond: number
  projectionDelaySeconds: number
  gateSourceFrame: number
  projectionSourceFrame: number
  gateProjectionPhaseErrorFrames: number
  movingMediaPlaying: boolean
  usingDeterministicFallback: boolean
}

// ---- the world, in film-widths — same numbers as the 2D study ------------
const FILM_W = 2.05
// FRAMES ARE PRINTED ACROSS THE STRIP, like real film: the image's horizontal
// axis spans the film's width between the perf rows, so a frame standing in
// the gate is upright 16:9 — the old along-strip printing rotated everything
// 90° at the climb ("the footage is sideways" — owner). Pitch is the image
// height along the strip plus the frame line.
const PERF_MARGIN = 0.24
const IMG_W = FILM_W - 2 * PERF_MARGIN // 1.57, the image width across
const IMG_H = (IMG_W * 9) / 16 // 0.883, 16:9
const PITCH = IMG_H + 0.18
const PARTICLES_PER_FRAME = 3
const FRAME_GROUPS = 36
const WRITER_TO_GATE_FRAMES = 32
const BITS_N = FRAME_GROUPS * PARTICLES_PER_FRAME
// The projector has no table or pedestal: two large reels and a narrow
// connecting spine float as a single dark machine. The strip is an already-
// threaded loop; modern footage supplies information, not a vat of material.
const TOP_REEL = { x: 12.0, y: 8.4 }
const BOTTOM_REEL = { x: 12.0, y: -0.75 }
// Solve the radius instead of accepting a fractional frame seam: two straight
// runs plus two half-circumferences equal exactly 36 frame pitches.
const REEL = {
  r: (FRAME_GROUPS * PITCH - 2 * (TOP_REEL.y - BOTTOM_REEL.y)) / (2 * Math.PI),
  w: FILM_W,
}
const machineFloorY = BOTTOM_REEL.y - REEL.r
const COIL_F = 0.58
const FILM_FPS = 16
const FILM_SPEED = PITCH * FILM_FPS
const SOURCE_FPS = 24
const SOURCE_DURATION = 108 / SOURCE_FPS
const coilR = REEL.r * COIL_F
const reelX = TOP_REEL.x
const reelY = TOP_REEL.y
// The optical line lives in the clear air between the two rims. A floating
// central spine carries both axles and cantilevers the lamp to the descending
// film. The proportions stay physically large while the finish stays dark.
const lampY = ((BOTTOM_REEL.y + REEL.r) + (TOP_REEL.y - REEL.r)) / 2
const RIG_Z = 1.545
const LAMP_CX = 13.55
const LAMP_LEN = 0.62 // half-length of the housing along x
const DROP = { x: 20.4, w: 6.9, d: 4.8 }
const STILL_T = 11.9
const EPISODE_FRAME_URLS = [
  '/clips/ep1-michael.jpg',
  '/clips/ep1-john.jpg',
  '/clips/ep1-john2.jpg',
] as const

// THE BOOT NARRATIVE: one file passes through an empty dashed boundary and
// dematerializes into suspended particles. A fixed writer on the lower reel absorbs exactly
// three particles per frame-step; its isolated clunks accelerate to 16fps,
// the charged thumbnails reach the gate, and the projector strikes.
// Fifteen physical pulls follow the stationary starter cell during the run-up.
// At the end of that 1.875s ramp the sixteenth written frame lands exactly as
// transport reaches 16fps: the owner's frame-count and speed rules agree.
const BOOT = { plane: 0.45, drop: 0.85, fall: 1.85, run: 3.8, runRamp: 1.875, proj: 7.37, beam0: 7.87, beamGap: 0.48 }
// The threshold is kinematic, not a collision. The sleeve reaches it already
// moving at its transit velocity, then keeps that velocity while its material
// representation changes from a continuous surface into particles.
const FILE_APPROACH_SECONDS = 1.25
const FILE_CONTACT_AT = BOOT.drop + FILE_APPROACH_SECONDS
const FILE_TRANSIT_SECONDS = 1.15
const FILE_CLEAR_AT = FILE_CONTACT_AT + FILE_TRANSIT_SECONDS
const minJerk = (v: number) => {
  const x = THREE.MathUtils.clamp(v, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
const transportDist = (t: number) => {
  if (t <= BOOT.run) return 0
  const u = t - BOOT.run
  return FILM_SPEED * (u < BOOT.runRamp ? (u * u) / (2 * BOOT.runRamp) : u - BOOT.runRamp / 2)
}
const transportSpeed = (t: number) => {
  if (t <= BOOT.run) return 0
  const u = t - BOOT.run
  return FILM_SPEED * (u < BOOT.runRamp ? u / BOOT.runRamp : 1)
}
const quantizedFrame = (phase: number) => Math.floor(phase + 1e-6)
const transportTimeForFrames = (frames: number) => {
  const rampFrames = (FILM_FPS * BOOT.runRamp) / 2
  return frames <= rampFrames
    ? Math.sqrt((2 * BOOT.runRamp * frames) / FILM_FPS)
    : frames / FILM_FPS + BOOT.runRamp / 2
}
// The first completed thumbnail is exposed on stationary stock. It starts the
// physical transport and both flywheels; each later write is funded by one
// completed pull. This removes the old impossible pitch of strip motion before
// the reel starter engaged.
const timeForFrame = (frame: number) => BOOT.run + transportTimeForFrames(Math.max(0, frame - 1))
const writtenFramesAt = (t: number) => (
  t < BOOT.run ? 0 : Math.min(FRAME_GROUPS, 1 + quantizedFrame(transportDist(t) / PITCH))
)

// The first written thumbnail is the starter motor. Film and both reel
// flywheels share one distance function from that instant onward, so there is
// no hidden slip, catch-up phase, or angular jump.
const FIRST_ACTIVATION_AT = timeForFrame(1)
const reelDriveDistance = (t: number) => (t < FIRST_ACTIVATION_AT ? 0 : transportDist(t))
const reelDriveSpeed = (t: number) => (t < FIRST_ACTIVATION_AT ? 0 : transportSpeed(t))


// One continuous film loop: rise on the shadow side, cross the upper crown,
// descend upright through the optical gate, then return around the lower reel.
const ASCENT_X = BOTTOM_REEL.x - REEL.r
const DESCENT_X = TOP_REEL.x + REEL.r
const HEAD_X0 = DESCENT_X - 0.22
const HEAD_X1 = DESCENT_X + 0.38
// No circular front canister: the optical face is a shallow rectangular gate
// just ahead of the film, with the hidden lamp physically behind both.
const LENS_X = DESCENT_X + 0.38
const runRise = TOP_REEL.y - BOTTOM_REEL.y
const topArc = REEL.r * Math.PI
const runDescent = TOP_REEL.y - BOTTOM_REEL.y
const bottomArc = REEL.r * Math.PI
const sAtTopReel = runRise
const sAfterTopReel = sAtTopReel + topArc
const sAfterDescent = sAfterTopReel + runDescent
const totalPath = sAfterDescent + bottomArc
// The exposed frame in the descending run stands directly between the reels.
const S_GATE = sAfterTopReel + (TOP_REEL.y - lampY)
// The writer lies on the exposed descending strip immediately before it feeds
// into the lower reel. Thirty-two frame pitches separate it from the optical
// gate around an exact 36-frame loop; four final cohorts finish the hidden
// return while the first charged frame already rests safely in the gate.
const CHARGE_S = totalPath + S_GATE - WRITER_TO_GATE_FRAMES * PITCH
const CHARGE_POINT = new THREE.Vector3(
  DESCENT_X,
  TOP_REEL.y - (CHARGE_S - sAfterTopReel),
  0,
)
// Once transport reaches its steady 16fps cadence, a written frame needs
// exactly 32 frame intervals to reach the optical gate. The digital output
// playback head follows that same source timeline at the source's native
// 24fps, delayed by the physical writer-to-gate travel. At every 16fps gate
// boundary the two representations therefore rendezvous on the same source
// frame, while the finished channel artifacts remain fluid between pulls.
const PROJECTION_DELAY_SECONDS = WRITER_TO_GATE_FRAMES / FILM_FPS

export function createIso4(canvas: HTMLCanvasElement): Iso4Scene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.18
  const scene = new THREE.Scene()
  // Opaque, matched to the page ground: the composer path can't composite
  // over the DOM, and nothing of the page pattern was visible behind the
  // stage anyway.
  const voidColor = new THREE.Color(0x08090a)
  scene.background = voidColor
  // Perspective exposes the floor's horizon, which ISO3's custom projection
  // never had to solve. Fade only the distant stage into the exact same void
  // color; the machine and foreground practical-light pools sit inside the
  // clear range, while the floor can no longer draw a horizontal seam.
  scene.fog = new THREE.Fog(voidColor, 42, 118)
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 240)
  let detailScale = 1
  let panoramicFit = 0
  let mobileLayout = false
  let updateOutputLayout: (() => void) | null = null

  // restrained bloom pulls the practicals, screens and beams into one glow
  // family — the finishing move the noir pass asked for
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.55, 0.72)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  // ---- perspective fit ---------------------------------------------------
  function layout() {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const W = Math.round(r.width)
    const H = Math.round(r.height)
    const pr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(pr)
    renderer.setSize(W, H, false)
    composer.setPixelRatio(pr)
    composer.setSize(W, H)

    const wide = W / H
    detailScale = W >= 768 ? 1.15 : 1
    camera.clearViewOffset()
    camera.aspect = wide

    if (W >= 768) {
      mobileLayout = false
      camera.fov = 35
      // Desktop is one continuous shot across tall and wide canvases. The old
      // aspect-only branches let a desktop DOM fall into a phone-like camera
      // after a one-pixel resize, shrinking the whole narrative into the
      // middle of a large black field. Interpolate into the panoramic fit so
      // scale, yaw, look target and crop remain perceptually continuous.
      const fit = minJerk(THREE.MathUtils.inverseLerp(1.2, 1.85, wide))
      panoramicFit = fit
      camera.position.set(
        THREE.MathUtils.lerp(43.5, 40, fit),
        THREE.MathUtils.lerp(12.0, 11.5, fit),
        THREE.MathUtils.lerp(10.2, 9.4, fit),
      )
      camera.lookAt(
        THREE.MathUtils.lerp(13.0, 13.2, fit),
        THREE.MathUtils.lerp(4.25, 3.8, fit),
        0,
      )
      // A constant crop made the same world-space fan drift from the middle
      // on tall desktops to the extreme right edge on 16:9. Counter-pan as
      // the canvas widens so the apparatus remains the stable hinge and the
      // outputs retain an intentional outer margin.
      const cropX = THREE.MathUtils.lerp(-0.04, 0, fit)
      camera.setViewOffset(W, H, Math.round(W * cropX), 0, W, H)
    } else {
      mobileLayout = true
      panoramicFit = 0
      camera.fov = 35
      camera.position.set(51, 13.6, 11.3)
      // The tall machine stays in the middle distance while the charging
      // event and its holographic payoff own the lower half of the phone. A
      // small additional yaw reveals the floating spine and rectangular gate;
      // the off-axis crop moves the apparatus toward the left edge.
      camera.lookAt(13.2, 5.35, -0.1)
      // Move the complete optical system farther into the left side of the
      // phone frame. This gives the output fan the full canvas rather than
      // making the apparatus and all three deliverables huddle on the right.
      camera.setViewOffset(W, H, Math.round(W * 0.15), 0, W, H)
    }
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    updateOutputLayout?.()
  }

  // ---- palette ------------------------------------------------------------
  const M = {
    steel: new THREE.MeshStandardMaterial({ color: 0x4a4a58, roughness: 0.45, metalness: 0.55 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x34343e, roughness: 0.5, metalness: 0.5 }),
    legs: new THREE.MeshStandardMaterial({ color: 0x434250, roughness: 0.52, metalness: 0.4, envMapIntensity: 1.2 }),
    flange: new THREE.MeshStandardMaterial({ color: 0x3a3a46, roughness: 0.45, metalness: 0.45, envMapIntensity: 1.0, side: THREE.DoubleSide }),
    // the window bores and rim edge: near-matte so the interior ember can't
    // mirror off a bore as it sweeps past (owner caught the flash twice)
    flangeSide: new THREE.MeshStandardMaterial({ color: 0x232329, roughness: 0.82, metalness: 0.12, envMapIntensity: 0.4, side: THREE.DoubleSide }),
    coil: new THREE.MeshStandardMaterial({ color: 0x665c48, roughness: 0.9 }),
    lap: new THREE.MeshStandardMaterial({ color: 0x77715f, roughness: 0.92 }),
    // The stage floor is honestly lit (three's light layers can't mask
    // per-object — learned the hard way): a neutral dark sweep that the
    // practicals pool on, reading as the cyc behind a stage.
    floor: new THREE.MeshStandardMaterial({ color: 0x232327, roughness: 0.97, envMapIntensity: 0 }),
  }
  // The complete mechanical body lives under one vertical pivot through its
  // spine. Coordinates inside machineRoot deliberately remain the original
  // world coordinates: the compensating negative offset keeps the solved
  // final composition identical at zero yaw, while machinePivot can reveal a
  // little more profile during the dormant/charging acts.
  const machinePivotPoint = new THREE.Vector3(
    reelX,
    (TOP_REEL.y + BOTTOM_REEL.y) / 2,
    0,
  )
  const machinePivot = new THREE.Group()
  machinePivot.position.copy(machinePivotPoint)
  const machineRoot = new THREE.Group()
  machineRoot.position.copy(machinePivotPoint).multiplyScalar(-1)
  machinePivot.add(machineRoot)
  scene.add(machinePivot)

  const alignmentStartsAt = BOOT.proj
  // The third artifact begins at beam0 + 2*gap and finishes its own 500ms
  // minimum-jerk reveal. Let the optical rig arrive with that final image.
  const alignmentEndsAt = BOOT.beam0 + BOOT.beamGap * 2 + 0.48
  const apparatusYawAt = (t: number) => {
    // Phones get the smaller reveal because the reel already sits close to
    // the copy column. Desktop has room to show a touch more flange depth.
    const profileYaw = THREE.MathUtils.degToRad(mobileLayout ? 8.5 : 11)
    const lock = minJerk((t - alignmentStartsAt) / (alignmentEndsAt - alignmentStartsAt))
    return profileYaw * (1 - lock)
  }
  const transformMachinePoint = (base: THREE.Vector3, t: number, out: THREE.Vector3) => {
    const yaw = apparatusYawAt(t)
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    const dx = base.x - machinePivotPoint.x
    const dz = base.z - machinePivotPoint.z
    out.set(
      machinePivotPoint.x + c * dx + s * dz,
      base.y,
      machinePivotPoint.z - s * dx + c * dz,
    )
    return out
  }

  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material, parent: THREE.Object3D = machineRoot) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat)
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }
  const cyl = (r: number, len: number, mat: THREE.Material, axis: 'x' | 'y' | 'z', parent: THREE.Object3D = machineRoot, seg = 40) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat)
    m.castShadow = true
    m.receiveShadow = true
    if (axis === 'x') m.rotation.z = Math.PI / 2
    if (axis === 'z') m.rotation.x = Math.PI / 2
    parent.add(m)
    return m
  }

  // ---- the stage floor ----------------------------------------------------
  {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), M.floor)
    floor.receiveShadow = true
    floor.rotation.x = -Math.PI / 2
    floor.position.y = machineFloorY - 0.48
    scene.add(floor)
  }

  let filmMatRef: THREE.MeshStandardMaterial
  // ---- the film: static ribbon, live texture ------------------------------
  const FILM_TEX_W = 1792
  const FILM_TEX_H = 112
  const filmCanvas = document.createElement('canvas')
  filmCanvas.width = FILM_TEX_W
  filmCanvas.height = FILM_TEX_H
  const fctx = filmCanvas.getContext('2d')!
  const filmTex = new THREE.CanvasTexture(filmCanvas)
  filmTex.colorSpace = THREE.SRGBColorSpace
  filmTex.anisotropy = 4
  filmTex.wrapS = THREE.RepeatWrapping

  // The public homepage already carries the real Mike & John Episode 1
  // coverage. Reuse it here instead of manufacturing look-alike faces. The
  // renderer can paint its abstract fallback immediately, then naturally
  // replaces it on the next 16fps gate tick as each small JPEG arrives.
  let episodeMediaRevision = 0
  let useMovingMedia = true
  let movingMediaPlaying = false
  let hasLiveMediaHistory = false
  let mediaPlayAttempt = 0
  let temporalMediaResetRequested = true
  let refreshBootFileLabel: (() => void) | undefined
  const episodeFrames = EPISODE_FRAME_URLS.map((src) => {
    const image = new Image()
    image.decoding = 'async'
    image.addEventListener('load', () => {
      episodeMediaRevision += 1
      refreshBootFileLabel?.()
    })
    image.src = src
    return image
  })
  const createEpisodeVideo = () => {
    const video = document.createElement('video')
    video.src = '/clips/ep1-loop.mp4'
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'auto'
    video.playbackRate = 1
    return video
  }
  // Two phase-locked playback heads serve different physical jobs. The source
  // head is sampled by the 16fps writer; the projection head is delayed by the
  // writer-to-gate travel and presents the finished digital outputs at the
  // native 24fps. Keeping separate decoders avoids seeking one video back and
  // forth on every frame, which was both expensive and temporally unstable.
  const episodeVideo = createEpisodeVideo()
  const projectionVideo = createEpisodeVideo()
  const wrapMediaTime = (seconds: number) => {
    const duration = Number.isFinite(episodeVideo.duration) && episodeVideo.duration > 0
      ? episodeVideo.duration
      : SOURCE_DURATION
    return ((seconds % duration) + duration) % duration
  }
  const mediaFrameIndex = (seconds: number) => {
    const frameCount = Math.round(SOURCE_DURATION * SOURCE_FPS)
    return ((Math.floor(wrapMediaTime(seconds) * SOURCE_FPS + 1e-4) % frameCount) + frameCount) % frameCount
  }
  const presentedMediaFrameIndex = (seconds: number) => {
    const duration = Number.isFinite(projectionVideo.duration) && projectionVideo.duration > 0
      ? projectionVideo.duration
      : SOURCE_DURATION
    const frameCount = Math.round(SOURCE_DURATION * SOURCE_FPS)
    // Some engines expose currentTime === duration for one RAF before loop
    // reset. That instant still displays the final decoded frame, not frame 0.
    if (seconds >= duration - 0.5 / SOURCE_FPS) return frameCount - 1
    return mediaFrameIndex(seconds)
  }
  const circularMediaDelta = (actual: number, expected: number) => {
    const duration = Number.isFinite(episodeVideo.duration) && episodeVideo.duration > 0
      ? episodeVideo.duration
      : SOURCE_DURATION
    let delta = actual - expected
    if (delta > duration / 2) delta -= duration
    if (delta < -duration / 2) delta += duration
    return delta
  }
  let sourceClockDrift = 0
  let projectionClockDrift = 0
  let lastMediaClockCorrection = -Infinity
  const syncMediaClocks = (t: number, force = false) => {
    let corrected = false
    const sourceExpected = wrapMediaTime(t)
    const projectionExpected = wrapMediaTime(t - PROJECTION_DELAY_SECONDS)
    if (episodeVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
      sourceClockDrift = circularMediaDelta(episodeVideo.currentTime, sourceExpected)
      if (force || (Math.abs(sourceClockDrift) > 0.09 && t - lastMediaClockCorrection > 0.5)) {
        episodeVideo.currentTime = sourceExpected
        sourceClockDrift = 0
        corrected = true
      }
    }
    if (projectionVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
      projectionClockDrift = circularMediaDelta(projectionVideo.currentTime, projectionExpected)
      if (force || (Math.abs(projectionClockDrift) > 0.09 && t - lastMediaClockCorrection > 0.5)) {
        projectionVideo.currentTime = projectionExpected
        projectionClockDrift = 0
        corrected = true
      }
    }
    if (corrected) lastMediaClockCorrection = t
  }
  episodeVideo.addEventListener('loadeddata', () => {
    episodeMediaRevision += 1
  })
  type FrameCallbackVideo = HTMLVideoElement & {
    requestVideoFrameCallback?: (callback: (now: number, metadata: { mediaTime: number }) => void) => number
    cancelVideoFrameCallback?: (handle: number) => void
  }
  const callbackProjectionVideo = projectionVideo as FrameCallbackVideo
  let projectionFrameCallback = 0
  let projectionPresentedRevision = 0
  let projectionPresentedMediaTime = 0
  const projectionPresentationTimes: number[] = []
  const scheduleProjectionFrame = () => {
    if (projectionFrameCallback || !callbackProjectionVideo.requestVideoFrameCallback) return
    projectionFrameCallback = callbackProjectionVideo.requestVideoFrameCallback((now, metadata) => {
      projectionFrameCallback = 0
      projectionPresentedRevision += 1
      projectionPresentedMediaTime = metadata.mediaTime
      projectionPresentationTimes.push(now / 1000)
      while (projectionPresentationTimes.length > 2 && now / 1000 - projectionPresentationTimes[0]! > 1.25) {
        projectionPresentationTimes.shift()
      }
      if (running) scheduleProjectionFrame()
    })
  }
  const cancelProjectionFrame = () => {
    if (projectionFrameCallback && callbackProjectionVideo.cancelVideoFrameCallback) {
      callbackProjectionVideo.cancelVideoFrameCallback(projectionFrameCallback)
    }
    projectionFrameCallback = 0
  }
  const movingMediaIsActive = () => useMovingMedia && movingMediaPlaying
  const enterDeterministicMediaFallback = () => {
    useMovingMedia = false
    movingMediaPlaying = false
    hasLiveMediaHistory = false
    temporalMediaResetRequested = true
    mediaPlayAttempt += 1
    episodeVideo.pause()
    projectionVideo.pause()
    cancelProjectionFrame()
  }
  const resumeEpisodeMedia = (t: number) => {
    const attempt = ++mediaPlayAttempt
    const resumedWithLiveHistory = hasLiveMediaHistory
    const resumeFilmFrame = quantizedFrame(transportDist(t) / PITCH)
    const resumeWrittenFrames = writtenFramesAt(t)
    movingMediaPlaying = false
    syncMediaClocks(t, true)
    void Promise.all([episodeVideo.play(), projectionVideo.play()]).then(() => {
      if (attempt !== mediaPlayAttempt || !running || !useMovingMedia) return
      if (episodeVideo.paused || projectionVideo.paused) {
        enterDeterministicMediaFallback()
        return
      }
      // If the live decoders only become available after film writing began,
      // there is no honest source snapshot for the already-written cells.
      // Never bulk-stamp that history from the decoder's current frame.
      if (elapsed >= BOOT.run && !hasLiveMediaHistory) {
        enterDeterministicMediaFallback()
        return
      }
      // RAF resumes immediately, while the two play() promises can take a
      // few hundred milliseconds to settle. If a physical pull or writer hit
      // happened in that negotiation window, no live source snapshot exists
      // for it. Preserve the old cells, but invalidate the chain rather than
      // silently returning to live playback with a fallback/stale hole.
      if (resumedWithLiveHistory) {
        const activatedFilmFrame = quantizedFrame(transportDist(elapsed) / PITCH)
        const activatedWrittenFrames = writtenFramesAt(elapsed)
        if (activatedFilmFrame !== resumeFilmFrame || activatedWrittenFrames !== resumeWrittenFrames) {
          enterDeterministicMediaFallback()
          return
        }
      }
      const firstLiveActivation = !hasLiveMediaHistory
      movingMediaPlaying = true
      hasLiveMediaHistory = true
      if (firstLiveActivation) temporalMediaResetRequested = true
      scheduleProjectionFrame()
    }).catch(() => {
      if (attempt === mediaPlayAttempt) enterDeterministicMediaFallback()
    })
  }
  for (const video of [episodeVideo, projectionVideo]) {
    video.addEventListener('loadedmetadata', () => {
      if (running && useMovingMedia) resumeEpisodeMedia(elapsed)
    })
  }
  const imageReady = (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLVideoElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => {
    const sourceWidth = image instanceof HTMLVideoElement ? image.videoWidth : image.naturalWidth
    const sourceHeight = image instanceof HTMLVideoElement ? image.videoHeight : image.naturalHeight
    const sourceAspect = sourceWidth / sourceHeight
    const targetAspect = dw / dh
    let sx = 0
    let sy = 0
    let sw = sourceWidth
    let sh = sourceHeight
    if (sourceAspect > targetAspect) {
      sw = sourceHeight * targetAspect
      sx = (sourceWidth - sw) / 2
    } else {
      sh = sourceWidth / targetAspect
      sy = (sourceHeight - sh) / 2
    }
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
  }

  // ---- the shared frame renderer -----------------------------------------
  // One function draws a frame's real Episode 1 coverage, and BOTH the
  // filmstrip and the wall screens call it, so what
  // stands in the gate and what the machine projects are visibly the same
  // picture. Landscape orientation in, callers handle rotation/tint.
  // THE SHOW IS ALWAYS THE SAME SHOW (owner: "stick with the original theme
  // — Mike and John, episode one"). Every frame is coverage of one two-person
  // session: two-shot, Mike close-up, John close-up, and the title card.
  function renderFrameContent(g2: CanvasRenderingContext2D, w: number, h: number, id: number, captioned: boolean) {
    const hsh = Math.abs(Math.imul(id | 0, 2654435761)) >>> 0
    const j1 = ((hsh >> 3) % 100) / 100
    // Deterministic stills retain the three editorial angles used throughout
    // the workshop. Live playback never substitutes JPEG holds for decoded
    // frames: doing so produced 1.25 seconds of motion followed by 3.75
    // seconds of apparent freezing, an effective four moving frames/second.
    const variant = ((Math.floor(id / 20) % 4) + 4) % 4
    const mike = episodeFrames[0]!
    const john = episodeFrames[1]!
    const johnAlt = episodeFrames[2]!
    const movingMikeReady = movingMediaIsActive()
      && episodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    const selected = movingMikeReady
      ? episodeVideo
      : variant === 0
        ? mike
        : variant === 1
          ? john
          : johnAlt
    const canDrawReal = !movingMikeReady && variant === 3
      ? imageReady(mike) && imageReady(john)
      : selected instanceof HTMLVideoElement ? movingMikeReady : imageReady(selected)
    if (canDrawReal) {
      g2.save()
      g2.imageSmoothingEnabled = true
      g2.imageSmoothingQuality = 'high'
      // A restrained archival grade seats webcam footage in the metal and
      // amber practicals without hiding that these are real people.
      g2.filter = 'sepia(0.16) saturate(0.72) contrast(1.08) brightness(0.82)'
      if (!movingMikeReady && variant === 3) {
        drawImageCover(g2, mike, 0, 0, w / 2, h)
        drawImageCover(g2, john, w / 2, 0, w / 2, h)
      } else {
        drawImageCover(g2, selected, 0, 0, w, h)
      }
      g2.filter = 'none'
      const shade = g2.createLinearGradient(0, 0, 0, h)
      shade.addColorStop(0, 'rgba(8,9,10,0.03)')
      shade.addColorStop(1, 'rgba(8,9,10,0.28)')
      g2.fillStyle = shade
      g2.fillRect(0, 0, w, h)
      g2.restore()
      if (captioned) drawCaptionBars(g2, w, h, id, 1)
      return
    }

    // First-paint fallback while the tiny Episode 1 JPEGs decode.
    const fallbackVariant = ((id % 4) + 4) % 4
    const g = g2.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, `hsl(${46 + j1 * 6} 13% ${48 + j1 * 4}%)`)
    g.addColorStop(1, `hsl(${42 + j1 * 6} 15% ${34 + j1 * 4}%)`)
    g2.fillStyle = g
    g2.fillRect(0, 0, w, h)
    const person = (cx2: number, cy2: number, r2: number) => {
      g2.beginPath()
      g2.arc(cx2, cy2, r2, 0, Math.PI * 2)
      g2.fill()
      g2.beginPath()
      g2.ellipse(cx2, cy2 + r2 * 2.3, r2 * 2.3, r2 * 1.9, 0, Math.PI, 0, true)
      g2.fill()
    }
    g2.fillStyle = 'rgba(38,34,26,0.9)'
    if (fallbackVariant === 0 || fallbackVariant === 2) {
      // the two-shot: Mike (broader) left, John (taller) right
      person(w * 0.28, h * 0.4, h * 0.13)
      person(w * 0.72, h * 0.36, h * 0.115)
    } else if (fallbackVariant === 1) {
      person(w * 0.42, h * 0.42, h * 0.19) // Mike close-up
    } else {
      // the title card
      g2.fillStyle = 'rgba(30,27,21,0.55)'
      g2.fillRect(0, 0, w, h)
      g2.fillStyle = 'rgba(252,250,244,0.94)'
      g2.font = `700 ${Math.round(h * 0.17)}px system-ui, sans-serif`
      g2.textAlign = 'center'
      g2.textBaseline = 'middle'
      g2.fillText('MIKE & JOHN', w / 2, h * 0.42)
      g2.font = `500 ${Math.round(h * 0.1)}px ui-monospace, monospace`
      g2.fillStyle = 'rgba(252,250,244,0.6)'
      g2.fillText('EPISODE 01', w / 2, h * 0.62)
      g2.textAlign = 'left'
    }
    if (captioned && fallbackVariant !== 3) {
      drawCaptionBars(g2, w, h, id, 1)
    }
  }

  const stableId = (i: number, off: number, dist: number) => Math.round((i * PITCH + off - dist) / PITCH)

  // caption bars, drawable at any inscription progress p (the laser writes
  // them left to right as the frame slides past the beam)
  function drawCaptionBars(g2: CanvasRenderingContext2D, w: number, h: number, id: number, prog: number) {
    const hsh = Math.abs(Math.imul(id | 0, 2654435761)) >>> 0
    const j2 = ((hsh >> 9) % 100) / 100
    g2.fillStyle = 'rgba(255,252,246,0.95)'
    const cw = w * (0.4 + j2 * 0.14)
    const p1 = Math.min(1, prog * 1.6)
    const p2 = Math.max(0, Math.min(1, (prog - 0.55) * 2.2))
    if (p1 > 0) g2.fillRect((w - cw) / 2, h * 0.78, cw * p1, h * 0.065)
    const cw2 = cw * 0.7
    if (p2 > 0) g2.fillRect((w - cw2) / 2, h * 0.885, cw2 * p2, h * 0.065)
  }

  // artwork cache: a frame's content is a pure function of (id, captioned) —
  // paint it once at fixed resolution, blit forever (the per-frame gradient
  // and blob path-work was a real CPU cost at 60fps)
  const artCache = new Map<string, HTMLCanvasElement>()
  function frameArt(id: number, captioned: boolean): HTMLCanvasElement {
    const key = `${episodeMediaRevision}:${movingMediaIsActive() ? 'm' : 's'}:${id}${captioned ? 'c' : 'r'}`
    let c = artCache.get(key)
    if (!c) {
      c = document.createElement('canvas')
      c.width = 240
      c.height = 136
      renderFrameContent(c.getContext('2d')!, 240, 136, id, captioned)
      artCache.set(key, c)
      if (artCache.size > 48) {
        const first = artCache.keys().next().value as string
        artCache.delete(first)
      }
    }
    return c
  }

  // The ribbon contains 36 physical cells. Keying imagery by an ever-changing
  // absolute frame id made a cell silently change content when it crossed the
  // loop seam. These slots are the actual conservation model: the writer
  // overwrites one slot, that same canvas rides the full loop, and the gate
  // reads it 32 pulls later.
  const filmSlotArt = Array.from({ length: FRAME_GROUPS }, () => {
    const c = document.createElement('canvas')
    c.width = 240
    c.height = 136
    return c
  })
  const filmSlotReady = new Array<boolean>(FRAME_GROUPS).fill(false)
  const filmSlotSourceFrames = new Int16Array(FRAME_GROUPS)
  filmSlotSourceFrames.fill(-1)
  const filmSlot = (pathCell: number, transportFrame: number) => (
    (pathCell - transportFrame) % FRAME_GROUPS + FRAME_GROUPS
  ) % FRAME_GROUPS
  const writerPathCell = Math.floor(CHARGE_S / PITCH)
  const gatePathCell = Math.floor(S_GATE / PITCH)
  const stampFilmSlot = (transportFrame: number) => {
    const slot = filmSlot(writerPathCell, transportFrame)
    const c = filmSlotArt[slot]!
    renderFrameContent(c.getContext('2d')!, c.width, c.height, writerPathCell - transportFrame, false)
    filmSlotReady[slot] = true
    filmSlotSourceFrames[slot] = episodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ? presentedMediaFrameIndex(episodeVideo.currentTime)
      : -1
    return slot
  }

  function drawFilm(dist: number, chargedDistance: number) {
    const sToPx = FILM_TEX_W / totalPath
    const off = dist % PITCH
    // stock base + frame lines
    fctx.fillStyle = '#2b2820'
    fctx.fillRect(0, 0, FILM_TEX_W, FILM_TEX_H)
    // Image field per frame, printed ACROSS the strip. Blank stock is visible
    // from the start; thumbnails appear only after their cell has passed the
    // fixed writer. The axis swap keeps the public-facing descending run
    // upright, while the return side stays deliberately buried in shadow.
    const vTop = (PERF_MARGIN / FILM_W) * FILM_TEX_H
    const vH = (IMG_W / FILM_W) * FILM_TEX_H
    for (let i = -1; i * PITCH < totalPath + PITCH; i++) {
      const s0 = i * PITCH + off
      if (s0 + PITCH <= 0 || s0 >= totalPath) continue
      const id = stableId(i, off, dist)
      const slot = filmSlot(i, Math.round(dist / PITCH))
      const u0 = (s0 + 0.09) * sToPx
      const uH = (IMG_H) * sToPx
      const frameS = (s0 + 0.09 + IMG_H / 2 + totalPath) % totalPath
      const fromWriter = (frameS - CHARGE_S + totalPath) % totalPath
      const charged = chargedDistance >= totalPath - PITCH || fromWriter <= chargedDistance
      fctx.save()
      // Rotate so image-y maps to increasing world-s. On the gate's descending
      // run, image-y and world-y now both point down; image-x maps toward the
      // viewer's screen-right rather than mirroring Mike and John.
      fctx.translate(u0, vTop + vH)
      fctx.rotate(-Math.PI / 2)
      if (charged) {
        const art = movingMediaIsActive() && filmSlotReady[slot]
          ? filmSlotArt[slot]!
          : frameArt(id, false)
        fctx.drawImage(art, 0, 0, vH, uH)
      } else {
        fctx.fillStyle = '#171713'
        fctx.fillRect(0, 0, vH, uH)
        fctx.strokeStyle = 'rgba(190,178,145,0.12)'
        fctx.lineWidth = 2
        fctx.strokeRect(2, 2, vH - 4, uH - 4)
      }
      fctx.restore()
    }
    // edge-code timecodes in the top margin — frame-accurate data texture
    fctx.fillStyle = 'rgba(220,214,198,0.5)'
    fctx.font = '600 9px ui-monospace, monospace'
    for (let i = 0; i * PITCH < totalPath + PITCH; i++) {
      const s0 = i * PITCH + off
      if (s0 < 0 || s0 >= totalPath) continue
      const id = stableId(i, off, dist)
      const tc = 'TC ' + String(14 + ((id * 7) % 45)).padStart(2, '0') + ':' + String((id * 13) % 60).padStart(2, '0') + ':' + String((id * 29) % 24).padStart(2, '0')
      fctx.fillText(tc, (s0 + 0.12) * sToPx, FILM_TEX_H * 0.052)
    }
    // perf rows over everything, both edges, four per frame
    fctx.fillStyle = '#100e0a'
    const perfPitch = PITCH / 4
    for (let sp = off % perfPitch; sp < totalPath; sp += perfPitch) {
      for (const vv of [0.075, 0.925]) {
        fctx.beginPath()
        fctx.roundRect(sp * sToPx - 3.4, vv * FILM_TEX_H - 4.4, 6.8, 8.8, 2)
        fctx.fill()
      }
    }
    // The return run is mechanically real but not public-facing. Cells rise
    // inverted there before crossing the upper crown; bury that run in the
    // machine's shadow so orientation is read only at the writer, descent,
    // gate and outputs. The fade carries a short way onto the crown rather
    // than ending as a texture seam at the tangent.
    const returnShadowEnd = (sAtTopReel + PITCH * 1.5) * sToPx
    const returnShadow = fctx.createLinearGradient(0, 0, returnShadowEnd, 0)
    returnShadow.addColorStop(0, 'rgba(8,9,10,0.82)')
    returnShadow.addColorStop((sAtTopReel * sToPx) / returnShadowEnd, 'rgba(8,9,10,0.68)')
    returnShadow.addColorStop(1, 'rgba(8,9,10,0)')
    fctx.fillStyle = returnShadow
    fctx.fillRect(0, 0, returnShadowEnd, FILM_TEX_H)
    filmTex.needsUpdate = true
  }

  {
    // One static loop; only its texture advances. The lower reel doubles as
    // the return and the fixed charging station.
    const SEGS = 144
    const pos: number[] = []
    const uv: number[] = []
    const idx: number[] = []
    const pt = (s: number): [number, number] => {
      if (s <= sAtTopReel) return [ASCENT_X, BOTTOM_REEL.y + s]
      if (s <= sAfterTopReel) {
        const p = (s - sAtTopReel) / topArc
        const a = Math.PI - p * Math.PI
        return [TOP_REEL.x + Math.cos(a) * REEL.r, TOP_REEL.y + Math.sin(a) * REEL.r]
      }
      if (s <= sAfterDescent) return [DESCENT_X, TOP_REEL.y - (s - sAfterTopReel)]
      const p = (s - sAfterDescent) / bottomArc
      const a = -p * Math.PI
      return [BOTTOM_REEL.x + Math.cos(a) * REEL.r, BOTTOM_REEL.y + Math.sin(a) * REEL.r]
    }
    for (let i = 0; i <= SEGS; i++) {
      const s = (i / SEGS) * totalPath
      const [x, y] = pt(s)
      pos.push(x, y, -FILM_W / 2, x, y, FILM_W / 2)
      uv.push(s / totalPath, 0, s / totalPath, 1)
      if (i < SEGS) {
        const a = i * 2
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    const filmMat = new THREE.MeshStandardMaterial({ map: filmTex, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    filmMatRef = filmMat
    const filmMesh = new THREE.Mesh(g, filmMat)
    filmMesh.receiveShadow = true
    machineRoot.add(filmMesh)
  }

  // ---- floating projector housing ---------------------------------------
  // A narrow spine behind the flanges carries both reel axles. It is a real
  // piece of vintage-looking machinery, but it has no feet, deck, or A-frame:
  // the whole mechanism hangs in the void as the composition's modern note.
  box(
    TOP_REEL.x - 0.68,
    TOP_REEL.x + 0.68,
    BOTTOM_REEL.y + 0.2,
    TOP_REEL.y - 0.2,
    -REEL.w / 2 - 0.44,
    -REEL.w / 2 - 0.12,
    M.steelDark,
  )
  box(
    TOP_REEL.x - 0.42,
    TOP_REEL.x + 0.42,
    BOTTOM_REEL.y + 0.42,
    TOP_REEL.y - 0.42,
    -REEL.w / 2 - 0.1,
    -REEL.w / 2 + 0.08,
    M.legs,
  )
  for (const reelY of [BOTTOM_REEL.y, TOP_REEL.y]) {
    const axle = cyl(0.17, REEL.w + 0.74, M.steelDark, 'z')
    axle.position.set(TOP_REEL.x, reelY, 0)
    const bearing = cyl(0.36, 0.2, M.steel, 'z')
    bearing.position.set(TOP_REEL.x, reelY, REEL.w / 2 + 0.02)
  }

  // Twin cantilever rails leave the spine and hold the gate and lamp between
  // the reels. Their dark edge is enough to explain the suspension without
  // rebuilding a pedestal around it.
  for (const sgn of [-1, 1]) {
    const zc = sgn * RIG_Z
    box(TOP_REEL.x - 0.08, HEAD_X1 + 0.08, lampY - 0.11, lampY + 0.11, zc - 0.09, zc + 0.09, M.legs)
    box(HEAD_X0 - 0.18, HEAD_X1 + 0.12, lampY - 0.1, lampY + 0.1, sgn * 1.3, sgn * (RIG_Z - 0.09), M.steel)
  }
  cyl(0.09, 2.6, M.steel, 'z').position.set(LAMP_CX, lampY, 0)
  {
    const housing = cyl(0.78, LAMP_LEN * 2, M.steelDark, 'x')
    housing.position.set(LAMP_CX, lampY, 0)
    const throat = cyl(0.48, HEAD_X0 - (LAMP_CX + LAMP_LEN), M.steelDark, 'x')
    throat.position.set((LAMP_CX + LAMP_LEN + HEAD_X0) / 2, lampY, 0)
  }
  let gateFrameMat: THREE.MeshBasicMaterial | null = null
  let gateFrameCtx: CanvasRenderingContext2D | null = null
  let gateFrameTex: THREE.CanvasTexture | null = null
  const gateLipMat = new THREE.MeshStandardMaterial({
    color: 0x29282d,
    roughness: 0.58,
    metalness: 0.38,
    emissive: 0xffc996,
    emissiveIntensity: 0,
  })
  const maskGateFrame = () => {
    if (!gateFrameCtx) return
    gateFrameCtx.save()
    gateFrameCtx.globalCompositeOperation = 'destination-in'
    const gx = gateFrameCtx.createLinearGradient(0, 0, 320, 0)
    gx.addColorStop(0, 'rgba(255,255,255,0)')
    gx.addColorStop(0.14, 'rgba(255,255,255,1)')
    gx.addColorStop(0.86, 'rgba(255,255,255,1)')
    gx.addColorStop(1, 'rgba(255,255,255,0)')
    gateFrameCtx.fillStyle = gx
    gateFrameCtx.fillRect(0, 0, 320, 180)
    const gy = gateFrameCtx.createLinearGradient(0, 0, 0, 180)
    gy.addColorStop(0, 'rgba(255,255,255,0)')
    gy.addColorStop(0.16, 'rgba(255,255,255,1)')
    gy.addColorStop(0.84, 'rgba(255,255,255,1)')
    gy.addColorStop(1, 'rgba(255,255,255,0)')
    gateFrameCtx.fillStyle = gy
    gateFrameCtx.fillRect(0, 0, 320, 180)
    gateFrameCtx.restore()
  }
  // THE PROJECTOR HEAD: the causal order is visible. A concealed lamp sits on
  // the machine side of the strip; the real thumbnail is held in a shallow
  // rectangular gate; the beams begin just beyond it. There is deliberately
  // no bright circular snout or exposed white bulb in front of the footage.
  {
    const cx0 = HEAD_X0
    const cx1 = HEAD_X1
    box(cx0, cx1, lampY + 0.62, lampY + 0.86, -1.32, 1.32, M.steel) // top plate
    box(cx0, cx1, lampY - 0.86, lampY - 0.62, -1.32, 1.32, M.steel) // bottom plate
    for (const sgn of [-1, 1]) {
      box(cx0, cx1, lampY - 0.86, lampY + 0.86, sgn * 1.08 + sgn * 0.0 - (sgn < 0 ? 0.24 : 0), sgn * 1.08 + (sgn > 0 ? 0.24 : 0), M.steel) // cheeks
    }
    const gateHalfW = IMG_W / 2 + 0.16
    const gateHalfH = IMG_H / 2 + 0.14
    const lipX0 = cx1 - 0.03
    const lipX1 = LENS_X + 0.06
    box(lipX0, lipX1, lampY + gateHalfH, lampY + gateHalfH + 0.15, -gateHalfW, gateHalfW, gateLipMat)
    box(lipX0, lipX1, lampY - gateHalfH - 0.15, lampY - gateHalfH, -gateHalfW, gateHalfW, gateLipMat)
    box(lipX0, lipX1, lampY - gateHalfH, lampY + gateHalfH, gateHalfW, gateHalfW + 0.15, gateLipMat)
    box(lipX0, lipX1, lampY - gateHalfH, lampY + gateHalfH, -gateHalfW - 0.15, -gateHalfW, gateLipMat)

    const gc = document.createElement('canvas')
    gc.width = 320
    gc.height = 180
    gateFrameCtx = gc.getContext('2d')!
    gateFrameCtx.fillStyle = '#171713'
    gateFrameCtx.fillRect(0, 0, gc.width, gc.height)
    gateFrameTex = new THREE.CanvasTexture(gc)
    gateFrameTex.colorSpace = THREE.SRGBColorSpace
    gateFrameMat = new THREE.MeshBasicMaterial({ map: gateFrameTex, transparent: true, opacity: 0, depthWrite: false })
    const gateFrame = new THREE.Mesh(new THREE.PlaneGeometry(IMG_W, IMG_H), gateFrameMat)
    gateFrame.rotation.y = Math.PI / 2
    gateFrame.position.set(LENS_X - 0.03, lampY, 0)
    machineRoot.add(gateFrame)
  }

  // ---- the reel: windowed flanges spinning in sync ------------------------
  const reel = new THREE.Group()
  {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, REEL.r, 0, Math.PI * 2, false)
    const hub = new THREE.Path()
    hub.absarc(0, 0, 0.7, 0, Math.PI * 2, true)
    shape.holes.push(hub)
    for (let h = 0; h < 5; h++) {
      const a = (h / 5) * Math.PI * 2
      const w = new THREE.Path()
      w.absarc(Math.cos(a) * REEL.r * 0.58, Math.sin(a) * REEL.r * 0.58, REEL.r * 0.235, 0, Math.PI * 2, true)
      shape.holes.push(w)
    }
    const fg = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false, curveSegments: 64 })
    for (const zc of [-REEL.w / 2, REEL.w / 2 - 0.16]) {
      const f = new THREE.Mesh(fg, [M.flange, M.flangeSide])
      f.position.z = zc
      f.castShadow = true
      f.receiveShadow = true
      reel.add(f)
    }
    // wound film: core + the fresh outer lap in the strip's own stock
    const coilCore = cyl(coilR * 0.9, REEL.w - 0.14, M.coil, 'z', reel)
    coilCore.name = 'film-coil-core'
    const coilLap = cyl(coilR, REEL.w - 0.2, M.lap, 'z', reel)
    coilLap.name = 'film-coil-lap'
    // the archive's depth: winding laps on the coil's near face
    for (const wr of [0.38, 0.52, 0.66, 0.8]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(coilR * wr, 0.02, 6, 64),
        new THREE.MeshStandardMaterial({ color: 0x2e2a20, roughness: 1 }),
      )
      ring.position.z = REEL.w / 2 - 0.19
      ring.name = 'film-coil-ring'
      reel.add(ring)
    }
    // one machined hub: a single disc, nothing stacked
    cyl(0.72, 0.3, M.steel, 'z', reel).position.z = REEL.w / 2 - 0.02
  }
  reel.position.set(reelX, reelY, 0)
  machineRoot.add(reel)
  // The lower return reel completes the classical vertical silhouette. It
  // shares the mechanism but sits low enough that the moving charge light
  // reveals it only in pulses rather than making it another focal point.
  const lowerReel = reel.clone(true)
  lowerReel.position.set(BOTTOM_REEL.x, BOTTOM_REEL.y, 0)
  const lowerChargeMats: THREE.MeshStandardMaterial[] = []
  lowerReel.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.name.startsWith('film-coil')) return
    const mat = (child.material as THREE.MeshStandardMaterial).clone()
    mat.emissive = new THREE.Color(0xff8f6e)
    mat.emissiveIntensity = 0
    child.material = mat
    lowerChargeMats.push(mat)
  })
  machineRoot.add(lowerReel)
  // Projection light catches only the machined outer edge and axle. These
  // payoff rims restore the classical dual-reel silhouette without filling
  // either dark flange face or competing with the output cards.
  const payoffTopRimMat = new THREE.MeshBasicMaterial({
    color: 0x687186,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const payoffLowerRimMat = payoffTopRimMat.clone()
  const addPayoffRim = (parent: THREE.Group, mat: THREE.MeshBasicMaterial) => {
    for (const radius of [REEL.r * 0.992, 0.72]) {
      const catchRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius, radius > 1 ? 0.026 : 0.018, 5, 96),
        mat,
      )
      catchRing.position.z = REEL.w / 2 + 0.018
      catchRing.renderOrder = 2
      parent.add(catchRing)
    }
  }
  addPayoffRim(reel, payoffTopRimMat)
  addPayoffRim(lowerReel, payoffLowerRimMat)

  // A shallow rectangular writer aperture hugs the descending strip. Three
  // particles register across the actual frame footprint; the completed real
  // thumbnail appears on this same plane and then advances into the reel.
  const chargeRingMat = new THREE.MeshStandardMaterial({
    color: 0x35201d,
    emissive: 0xff9d82,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    roughness: 0.5,
  })
  const writerShape = new THREE.Shape()
  const writerOuterW = IMG_W + 0.28
  const writerOuterH = IMG_H + 0.24
  writerShape.moveTo(-writerOuterW / 2, -writerOuterH / 2)
  writerShape.lineTo(writerOuterW / 2, -writerOuterH / 2)
  writerShape.lineTo(writerOuterW / 2, writerOuterH / 2)
  writerShape.lineTo(-writerOuterW / 2, writerOuterH / 2)
  writerShape.closePath()
  const writerHole = new THREE.Path()
  const writerInnerW = IMG_W + 0.07
  const writerInnerH = IMG_H + 0.05
  writerHole.moveTo(-writerInnerW / 2, -writerInnerH / 2)
  writerHole.lineTo(-writerInnerW / 2, writerInnerH / 2)
  writerHole.lineTo(writerInnerW / 2, writerInnerH / 2)
  writerHole.lineTo(writerInnerW / 2, -writerInnerH / 2)
  writerHole.closePath()
  writerShape.holes.push(writerHole)
  const chargeRing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(writerShape, { depth: 0.055, bevelEnabled: false }),
    chargeRingMat,
  )
  chargeRing.rotation.y = Math.PI / 2
  chargeRing.position.copy(CHARGE_POINT)
  machineRoot.add(chargeRing)
  const chargeThumbCanvas = document.createElement('canvas')
  chargeThumbCanvas.width = 240
  chargeThumbCanvas.height = 136
  const chargeThumbCtx = chargeThumbCanvas.getContext('2d')!
  chargeThumbCtx.fillStyle = '#171713'
  chargeThumbCtx.fillRect(0, 0, chargeThumbCanvas.width, chargeThumbCanvas.height)
  const chargeThumbTex = new THREE.CanvasTexture(chargeThumbCanvas)
  chargeThumbTex.colorSpace = THREE.SRGBColorSpace
  const chargeThumbMat = new THREE.MeshBasicMaterial({ map: chargeThumbTex, transparent: true, opacity: 0, depthWrite: false })
  const chargeThumbUniforms = {
    uWriterBuild: { value: 0 },
    uWriterImpact: { value: 0 },
    uWriterCharge: { value: 0 },
  }
  chargeThumbMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWriterBuild = chargeThumbUniforms.uWriterBuild
    shader.uniforms.uWriterImpact = chargeThumbUniforms.uWriterImpact
    shader.uniforms.uWriterCharge = chargeThumbUniforms.uWriterCharge
    shader.fragmentShader = `
      uniform float uWriterBuild;
      uniform float uWriterImpact;
      uniform float uWriterCharge;
    ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      /* glsl */ `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D(map, vMapUv);
          // Three particles fund one film cell. Their world-space registration
          // sites correspond to these three thumbnail anchors; expanding
          // reconstruction fronts make the information visibly accumulate
          // instead of letting the points disappear behind an opaque strip.
          vec2 writerUv = vec2(vMapUv.x, vMapUv.y);
          vec2 a0 = vec2(0.18, 0.56);
          vec2 a1 = vec2(0.50, 0.44);
          vec2 a2 = vec2(0.82, 0.56);
          vec2 aspect = vec2(1.0, 0.72);
          float d0 = length((writerUv - a0) * aspect);
          float d1 = length((writerUv - a1) * aspect);
          float d2 = length((writerUv - a2) * aspect);
          // The impacts are seeds, not circular windows. A short connective
          // emulsion front joins the three sites before the photographic
          // image develops outward as one coherent film cell.
          vec2 s01 = a1 - a0;
          vec2 s12 = a2 - a1;
          float t01 = clamp(dot(writerUv - a0, s01) / dot(s01, s01), 0.0, 1.0);
          float t12 = clamp(dot(writerUv - a1, s12) / dot(s12, s12), 0.0, 1.0);
          float bridgeDistance = min(
            length((writerUv - (a0 + s01 * t01)) * aspect),
            length((writerUv - (a1 + s12 * t12)) * aspect)
          );
          float grain = 0.014 * sin(writerUv.x * 31.0 + writerUv.y * 19.0)
            + 0.006 * sin(writerUv.x * 67.0 - writerUv.y * 43.0)
            + 0.003 * sin(writerUv.x * 137.0 + writerUv.y * 89.0);
          float radius = mix(0.012, 0.82, uWriterBuild);
          float bridgeRadius = mix(0.006, 0.19, smoothstep(0.04, 0.48, uWriterBuild));
          float m0 = 1.0 - smoothstep(radius - 0.06, radius + 0.06, d0 + grain);
          float m1 = 1.0 - smoothstep(radius - 0.06, radius + 0.06, d1 + grain);
          float m2 = 1.0 - smoothstep(radius - 0.06, radius + 0.06, d2 + grain);
          float bridge = (1.0 - smoothstep(bridgeRadius - 0.045, bridgeRadius + 0.045, bridgeDistance + grain))
            * smoothstep(0.03, 0.34, uWriterBuild);
          float assembled = clamp(max(bridge, max(m0, max(m1, m2))), 0.0, 1.0);
          float imageCoherence = smoothstep(0.12, 0.5, uWriterBuild);
          float imagePresence = assembled * mix(0.12, 1.0, imageCoherence);
          float front0 = 1.0 - smoothstep(0.0, 0.05, abs(d0 - radius));
          float front1 = 1.0 - smoothstep(0.0, 0.05, abs(d1 - radius));
          float front2 = 1.0 - smoothstep(0.0, 0.05, abs(d2 - radius));
          float reconstructionFront = clamp(max(front0, max(front1, front2)), 0.0, 1.0)
            * (1.0 - 0.72 * uWriterBuild);
          float anchorGlow = exp(-d0 * 18.0) + exp(-d1 * 18.0) + exp(-d2 * 18.0);
          vec3 writerWarm = vec3(1.0, 0.39, 0.24);
          sampledDiffuseColor.rgb *= 0.035 + 0.965 * imagePresence;
          sampledDiffuseColor.rgb += writerWarm * (
            reconstructionFront * 0.22
            + anchorGlow * uWriterImpact * 0.21
            + uWriterCharge * assembled * 0.032
          );
          sampledDiffuseColor.a *= 0.035 + 0.965 * imagePresence;
          diffuseColor *= sampledDiffuseColor;
        #endif
      `,
    )
  }
  chargeThumbMat.customProgramCacheKey = () => 'iso4-writer-reconstruction-v2'
  const chargeThumb = new THREE.Mesh(new THREE.PlaneGeometry(IMG_W, IMG_H), chargeThumbMat)
  chargeThumb.rotation.y = Math.PI / 2
  chargeThumb.position.copy(CHARGE_POINT).add(new THREE.Vector3(0.045, 0, 0))
  machineRoot.add(chargeThumb)

  // A local grazing catch makes the unexposed carrier physically readable
  // before the first image exists. It covers only the writer neighbourhood;
  // the upper return and copy-zone ribbon remain buried in shadow. These are
  // stock edges and perforation rims, not a second glowing strip.
  const writerStockCatchMat = new THREE.MeshBasicMaterial({
    color: 0xa0947c,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const writerStockCatchX = CHARGE_POINT.x + 0.028
  const writerStockSpan = PITCH * 2.25
  for (const edgeZ of [-FILM_W / 2 + 0.025, FILM_W / 2 - 0.025]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.028, writerStockSpan), writerStockCatchMat)
    edge.rotation.y = Math.PI / 2
    edge.position.set(writerStockCatchX, CHARGE_POINT.y, edgeZ)
    machineRoot.add(edge)
  }
  const perfOuterW = 0.105
  const perfOuterH = 0.082
  const perfShape = new THREE.Shape()
  perfShape.moveTo(-perfOuterW / 2, -perfOuterH / 2)
  perfShape.lineTo(perfOuterW / 2, -perfOuterH / 2)
  perfShape.lineTo(perfOuterW / 2, perfOuterH / 2)
  perfShape.lineTo(-perfOuterW / 2, perfOuterH / 2)
  perfShape.closePath()
  const perfHole = new THREE.Path()
  perfHole.moveTo(-perfOuterW * 0.31, -perfOuterH * 0.27)
  perfHole.lineTo(-perfOuterW * 0.31, perfOuterH * 0.27)
  perfHole.lineTo(perfOuterW * 0.31, perfOuterH * 0.27)
  perfHole.lineTo(perfOuterW * 0.31, -perfOuterH * 0.27)
  perfHole.closePath()
  perfShape.holes.push(perfHole)
  const perfCatchGeometry = new THREE.ShapeGeometry(perfShape)
  const perfZ = FILM_W / 2 - PERF_MARGIN * 0.52
  for (let i = -4; i <= 4; i++) {
    for (const z of [-perfZ, perfZ]) {
      const perf = new THREE.Mesh(perfCatchGeometry, writerStockCatchMat)
      perf.rotation.y = Math.PI / 2
      perf.position.set(writerStockCatchX + 0.002, CHARGE_POINT.y + i * PITCH / 4, z)
      machineRoot.add(perf)
    }
  }

  // ---- the throw: three holographic artifacts in open space ---------------
  // The physically large projector sits dark behind its payoff. Three different
  // silhouettes float at staggered depths instead of reading as pictures
  // attached to an invisible back wall.
  const lens = new THREE.Vector3(LENS_X, lampY, 0)
  // Three LITERAL artifacts from one session (owner): a landscape episode
  // with a small YouTube mark, a phone-framed portrait clip with big captions
  // and a LinkedIn mark, and a waveform-plus-transcript under a podcast/RSS
  // mark. Different SHAPES read at any size; small logos, top right, tasteful.
  const FAN = [
    // Rear anchor, foreground phone, middle-depth transcript: a shallow
    // triangular constellation with three clean silhouettes on a phone.
    { icon: 'yt', color: '#d63d47', x: 24.9, w: 4.05, h: 2.28, y: 4.8, z: 0.12, cone: 0.94, tilt: -0.022 },
    { icon: 'in', color: '#3d78ae', x: 27.2, w: 1.5, h: 3.06, y: 0.35, z: 3.15, cone: 0.62, tilt: -0.045 },
    { icon: 'pod', color: '#d9a25c', x: 25.9, w: 3.05, h: 1.98, y: -1.85, z: 0.25, cone: 0.82, tilt: 0.028 },
  ]

  // (There is deliberately NO wall mesh. A real plane betrayed its edges and
  // built a lit room-corner; the wall is IMPLIED — separate landing-field
  // planes carry the restrained spill and the darkness does the architecture.)
  // THEATER BEAMS (owner: "a little bit of smoke in the air, just like
  // theater lighting"). Three round volumetric shafts from the prism to the
  // destinations: open cones with a shader doing axial falloff from the
  // source, a soft silhouette via the facing angle, drifting value-noise
  // smoke inside, and a white core melting into each brand colour.
  const beamMats: THREE.ShaderMaterial[] = []
  const beamMeshes: THREE.Mesh[] = []
  const outputGlowMats: THREE.ShaderMaterial[] = []
  const outputGlowMeshes: THREE.Mesh[] = []
  {
    const vert = /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vView = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }`
    const frag = /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSeed;
      uniform float uAlpha;
      uniform float uOn;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u2 = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u2.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u2.x),
          u2.y);
      }
      void main() {
        float t = vUv.y; // 0 at the source end
        // Perspective-correct optical depth. The previous fixed +Z view
        // vector made identical shafts change density as they moved toward a
        // viewport edge. Beer-Lambert extinction keeps the cross-section soft
        // and monotone without turning the cone into a graphic wedge.
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float column = pow(smoothstep(0.02, 0.95, facing), 2.0);
        float edge = smoothstep(0.02, 0.22, facing);
        float ends = smoothstep(0.0, 0.055, t) * (1.0 - smoothstep(0.94, 1.0, t));
        float falloff = 0.24 + 0.76 / pow(1.0 + 1.55 * t, 2.0);
        float smoke = 0.82
          + 0.12 * vnoise(vec2(t * 7.0 - uTime * 0.30, vUv.x * 3.0 + uSeed * 7.31))
          + 0.06 * vnoise(vec2(t * 17.0 - uTime * 0.55, vUv.x * 6.0 + uSeed * 3.7));
        float tau = uAlpha * column * edge * ends * falloff * smoke;
        float opticalAlpha = 1.0 - exp(-tau);
        // All three throws leave one white aperture before their channel
        // colour separates, so the eye reads one lamp feeding three results.
        vec3 col = mix(vec3(1.0), uColor, smoothstep(0.08, 0.50, t));
        gl_FragColor = vec4(col, opticalAlpha * uOn);
      }`
    FAN.forEach((d, i) => {
      const target = new THREE.Vector3(d.x, lampY + d.y, d.z)
      const dir = target.clone().sub(lens)
      const len = dir.length()
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uColor: { value: new THREE.Color(d.color) },
          uTime: { value: 0 },
          uSeed: { value: i + 1 },
          // Camera-facing geometry makes the amber cone naturally strongest;
          // compensate so all three share one restrained optical root.
          // Rebalanced after the responsive fan pass: red/amber were reading
          // as opaque wedges while the steeper blue throw vanished. These
          // values compensate view-facing solid angle rather than ranking the
          // artifacts by brightness.
          // Optical-depth bases corresponding to the accepted apparent peak
          // alphas. Responsive layout applies only the one verified mobile
          // correction: a clearer red corridor to the first output.
          uAlpha: { value: [0.13, 0.06, 0.02][i] },
          uOn: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      beamMats.push(mat)
      // Unit-length shafts can be recomposed per viewport without rebuilding
      // geometry. Panoramic canvases need their own output spacing while the
      // apparatus remains the stable hinge of the shot.
      const g = new THREE.CylinderGeometry(d.cone, 0.09, 1, 28, 24, true)
      const m = new THREE.Mesh(g, mat)
      m.scale.y = len
      m.position.copy(lens.clone().add(target).multiplyScalar(0.5))
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
      beamMeshes.push(m)
      scene.add(m)
    })
  }
  // The LinkedIn throw is steep enough that its round shaft can become
  // mathematically edge-on to the camera. A second, extremely soft optical
  // veil supplies the perceptual beam without forcing the cylinder into a
  // hard laser wedge. Its ribbon is rebuilt from the live gate/phone segment
  // so it follows the projector's actualization turn and responsive fan.
  const blueBeamVeilPositions = new Float32Array(12)
  const blueBeamVeilGeometry = new THREE.BufferGeometry()
  blueBeamVeilGeometry.setAttribute('position', new THREE.BufferAttribute(blueBeamVeilPositions, 3))
  blueBeamVeilGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ], 2))
  blueBeamVeilGeometry.setIndex([0, 2, 1, 2, 3, 1])
  const blueBeamVeilMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOn: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOn;
      varying vec2 vUv;
      void main() {
        float t = vUv.y;
        float lateral = pow(max(0.0, sin(3.14159265 * vUv.x)), 2.6);
        float axial = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.78, 1.0, t));
        float breath = 0.88 + 0.07 * sin(t * 11.0 - uTime * 0.72)
          + 0.05 * sin(t * 4.7 - uTime * 0.31 + 1.4);
        vec3 color = mix(vec3(0.82, 0.9, 1.0), vec3(0.18, 0.48, 0.78), smoothstep(0.04, 0.72, t));
        gl_FragColor = vec4(color, lateral * axial * breath * 0.115 * uOn);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const blueBeamVeil = new THREE.Mesh(blueBeamVeilGeometry, blueBeamVeilMat)
  blueBeamVeil.frustumCulled = false
  scene.add(blueBeamVeil)
  // The gate is the physical 16fps sampling point. The channel artifacts use
  // the same source timeline at native 24fps, delayed by the writer-to-gate
  // travel; they agree at every pull boundary while remaining fluid between
  // those boundaries.
  const screenCtxs: { c: HTMLCanvasElement; x: CanvasRenderingContext2D; tex: THREE.CanvasTexture; d: (typeof FAN)[number] }[] = []
  const screenMats: THREE.MeshBasicMaterial[] = []
  const screenResolveUniforms: {
    uResolve: { value: number }
    uResolveTexel: { value: THREE.Vector2 }
  }[] = []
  const screenMeshes: THREE.Mesh[] = []
  const settledOutputTargets = FAN.map(() => new THREE.Vector3())
  const posedLens = new THREE.Vector3()
  const posedTarget = new THREE.Vector3()
  const posedBeamDir = new THREE.Vector3()
  const beamUp = new THREE.Vector3(0, 1, 0)
  const blueBeamView = new THREE.Vector3()
  const blueBeamSide = new THREE.Vector3()
  const blueBeamStart = new THREE.Vector3()
  const blueBeamEnd = new THREE.Vector3()
  const blueBeamPoint = new THREE.Vector3()
  let outputPoseTime = 0
  function drawScreen(
    sc: (typeof screenCtxs)[number],
    id: number,
    liveProjectionSource = false,
    mediaTimeSeconds = wrapMediaTime(id / SOURCE_FPS),
  ) {
    const { x, d, c } = sc
    const W2 = c.width
    const H2 = c.height
    x.clearRect(0, 0, W2, H2)
    // The image core stays optically clean. Spill is a separate plane behind
    // the artifact so bloom can never lift footage blacks or contaminate skin
    // tones. This canvas owns only the deliverable itself and its hairline.
    const channelBadge = (
      bx: number,
      by: number,
      bw: number,
      bh: number,
      label: string,
      fontSize: number,
    ) => {
      // The old micro-marks were decorative at phone scale. Give every output
      // one shared piece of channel chrome: recognizable icon, literal name,
      // and an edge in its beam colour. The footage stays clean beneath it.
      x.save()
      x.globalCompositeOperation = 'source-over'
      x.fillStyle = 'rgba(7,8,11,0.82)'
      x.strokeStyle = d.color
      x.lineWidth = 2.5
      x.beginPath()
      x.roundRect(bx, by, bw, bh, bh * 0.28)
      x.fill()
      x.stroke()

      const iconSize = bh - 16
      const ix = bx + 8
      const iy = by + 8
      if (d.icon === 'yt') {
        x.fillStyle = '#e4474f'
        x.beginPath()
        x.roundRect(ix, iy + iconSize * 0.14, iconSize, iconSize * 0.72, iconSize * 0.18)
        x.fill()
        x.fillStyle = '#fff'
        x.beginPath()
        x.moveTo(ix + iconSize * 0.42, iy + iconSize * 0.31)
        x.lineTo(ix + iconSize * 0.7, iy + iconSize * 0.5)
        x.lineTo(ix + iconSize * 0.42, iy + iconSize * 0.69)
        x.closePath()
        x.fill()
      } else if (d.icon === 'in') {
        x.fillStyle = '#397db8'
        x.beginPath()
        x.roundRect(ix, iy, iconSize, iconSize, iconSize * 0.16)
        x.fill()
        x.fillStyle = '#fff'
        x.font = `800 ${Math.round(iconSize * 0.58)}px system-ui, sans-serif`
        x.textAlign = 'center'
        x.textBaseline = 'middle'
        x.fillText('in', ix + iconSize * 0.5, iy + iconSize * 0.53)
      } else {
        x.fillStyle = '#e6a75d'
        x.beginPath()
        x.arc(ix + iconSize * 0.24, iy + iconSize * 0.76, iconSize * 0.1, 0, Math.PI * 2)
        x.fill()
        x.strokeStyle = '#e6a75d'
        x.lineWidth = Math.max(2.5, iconSize * 0.1)
        for (const rr of [0.38, 0.68]) {
          x.beginPath()
          x.arc(ix + iconSize * 0.2, iy + iconSize * 0.8, iconSize * rr, -Math.PI / 2, 0)
          x.stroke()
        }
      }

      x.fillStyle = 'rgba(255,255,255,0.96)'
      x.font = `750 ${fontSize}px system-ui, sans-serif`
      x.textAlign = 'left'
      x.textBaseline = 'middle'
      x.fillText(label, ix + iconSize + 12, by + bh * 0.52)
      x.restore()
    }
    if (d.icon === 'yt') {
      x.fillStyle = 'rgba(5,6,8,0.94)'
      x.fillRect(50, 36, 540, 284)
      x.strokeStyle = 'rgba(214,61,71,0.62)'
      x.lineWidth = 2
      x.strokeRect(56, 42, 528, 274)
      x.save()
      x.translate(58, 44)
      x.globalCompositeOperation = 'source-over'
      x.globalAlpha = 0.96
      if (liveProjectionSource && projectionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        drawImageCover(x, projectionVideo, 0, 0, 524, 246)
      } else {
        x.drawImage(frameArt(id, false), 0, 0, 524, 246)
      }
      x.restore()
      x.fillStyle = 'rgba(255,255,255,0.3)'
      x.fillRect(58, 306, 524, 6)
      x.fillStyle = 'rgba(255,255,255,0.9)'
      const progress = THREE.MathUtils.clamp(mediaTimeSeconds / SOURCE_DURATION, 0, 1)
      const progressX = 58 + 524 * progress
      x.fillRect(58, 306, Math.max(4, progressX - 58), 6)
      x.beginPath()
      x.arc(progressX, 309, 8, 0, Math.PI * 2)
      x.fill()
      channelBadge(76, 60, 238, 52, 'YOUTUBE', 29)
    } else if (d.icon === 'in') {
      // An actual phone outline, portrait clip inside, and a real captioned
      // editorial moment rather than generic placeholder bars.
      x.fillStyle = 'rgba(14,14,18,0.85)'
      x.beginPath()
      x.roundRect(22, 16, 296, 658, 46)
      x.fill()
      x.strokeStyle = 'rgba(160,165,180,0.5)'
      x.lineWidth = 3
      x.stroke()
      x.fillStyle = 'rgba(160,165,180,0.5)'
      x.beginPath()
      x.roundRect(140, 34, 60, 10, 5)
      x.fill()
      x.save()
      x.beginPath()
      x.roundRect(38, 58, 264, 586, 26)
      x.clip()
      x.globalCompositeOperation = 'source-over'
      x.globalAlpha = 0.96
      // A curated center crop keeps the steady-state phone from landing on a
      // wall or partial head as the shared editorial id advances. Live mode
      // still uses the real Episode 1 video; deterministic review uses its
      // matching Mike still.
      const portraitSource = liveProjectionSource && projectionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ? projectionVideo
        : episodeFrames[0]!
      if (portraitSource instanceof HTMLVideoElement || imageReady(portraitSource)) {
        drawImageCover(x, portraitSource, 38, 58, 264, 586)
      } else {
        const art = frameArt(id, false)
        x.drawImage(art, 82, 0, 76, 136, 38, 58, 264, 586)
      }
      x.restore()
      // Punched caption blocks use a real line from the Mike & John session.
      // Tight individual plates preserve legibility on the 150px-wide phone
      // without turning the whole lower third into an opaque banner.
      const captions = [
        { text: 'THE CLIP ONLY WORKS', size: 24, accent: false },
        { text: 'IF THE SOURCE IS', size: 27, accent: false },
        { text: 'STILL ATTACHED', size: 30, accent: true },
      ]
      x.save()
      x.textAlign = 'center'
      x.textBaseline = 'middle'
      captions.forEach((caption, ci) => {
        x.font = `850 ${caption.size}px system-ui, sans-serif`
        const plateW = Math.min(248, Math.ceil(x.measureText(caption.text).width + 28))
        const plateH = caption.size + 18
        const plateX = (W2 - plateW) / 2
        const plateY = 444 + ci * 50
        x.shadowColor = 'rgba(0,0,0,0.72)'
        x.shadowBlur = 12
        x.fillStyle = 'rgba(5,7,10,0.9)'
        x.strokeStyle = caption.accent ? 'rgba(242,143,132,0.58)' : 'rgba(255,255,255,0.14)'
        x.lineWidth = 1.5
        x.beginPath()
        x.roundRect(plateX, plateY, plateW, plateH, 8)
        x.fill()
        x.shadowBlur = 0
        x.stroke()
        x.fillStyle = caption.accent ? '#f69a8f' : 'rgba(255,255,255,0.98)'
        x.fillText(caption.text, W2 / 2, plateY + plateH * 0.53)
      })
      x.restore()
      channelBadge(50, 72, 240, 54, 'LINKEDIN CLIP', 27)
    } else {
      // waveform + transcript: the podcast/RSS artifact
      x.fillStyle = 'rgba(10,9,8,0.9)'
      x.strokeStyle = 'rgba(217,162,92,0.6)'
      x.lineWidth = 2
      x.beginPath()
      x.roundRect(30, 16, 580, 388, 22)
      x.fill()
      x.stroke()
      x.save()
      x.globalAlpha = 0.9
      x.fillStyle = 'rgba(255,235,205,0.85)'
      // A podcast is continuous time, not a random bar chart. Keep each bar's
      // identity stable and move one low-frequency envelope through it using
      // the same delayed media clock as the two video projections.
      for (let k = 0; k < 56; k++) {
        const seed = 0.34 + 0.66 * Math.abs(Math.sin(k * 1.913 + 0.7))
        const wave = 0.34 + 0.66 * Math.abs(Math.sin(k * 0.47 + mediaTimeSeconds * 3.4))
        const bh = 12 + seed * wave * 66
        x.fillRect(48 + k * 9.6, 108 - bh / 2, 5.5, bh)
      }
      x.restore()
      x.strokeStyle = 'rgba(255,240,220,0.25)'
      x.lineWidth = 2
      x.beginPath()
      x.moveTo(48, 186)
      x.lineTo(592, 186)
      x.stroke()
      x.font = '600 24px ui-monospace, monospace'
      x.textBaseline = 'middle'
      const line = (ly: number, who: string, frac: number) => {
        x.fillStyle = 'rgba(255,244,226,0.9)'
        x.fillText(who, 48, ly)
        x.fillStyle = 'rgba(255,244,226,0.5)'
        x.beginPath()
        x.roundRect(140, ly - 9, 452 * frac, 18, 6)
        x.fill()
      }
      line(226, 'MIKE', 0.86)
      line(272, 'JOHN', 0.62)
      line(318, 'MIKE', 0.74)
      line(364, 'JOHN', 0.4)
      channelBadge(44, 28, 286, 58, 'PODCAST / RSS', 30)
    }
    sc.tex.needsUpdate = true
  }
  FAN.forEach((d) => {
    const c = document.createElement('canvas')
    c.width = d.icon === 'in' ? 340 : 640
    c.height = d.icon === 'in' ? 690 : d.icon === 'pod' ? 420 : 360
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    const sc = { c, x: c.getContext('2d')!, tex, d }
    screenCtxs.push(sc)
    drawScreen(sc, 0)
    // Keep the artifact itself optically solid enough to read. Additive-
    // blending the whole card made overlaps bleach together and erased the
    // three silhouettes; the dedicated plane below owns spill instead.
    const smat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.NormalBlending, depthWrite: false })
    // A projection should optically acquire focus rather than materialize as
    // an already-crisp UI plane. Extend Three's own basic-material shader so
    // texture color management, tone mapping and the 24fps CanvasTexture
    // cadence stay intact; only the RAF-driven sampling footprint changes.
    // This deliberately blurs the complete deliverable (footage + chrome) for
    // a few frames, like a lens resolving, without synthesizing media frames.
    const resolveUniforms = {
      uResolve: { value: 0 },
      uResolveTexel: { value: new THREE.Vector2(1 / c.width, 1 / c.height) },
    }
    smat.onBeforeCompile = (shader) => {
      shader.uniforms.uResolve = resolveUniforms.uResolve
      shader.uniforms.uResolveTexel = resolveUniforms.uResolveTexel
      shader.fragmentShader = `
        uniform float uResolve;
        uniform vec2 uResolveTexel;
      ${shader.fragmentShader}`
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        /* glsl */ `
          #ifdef USE_MAP
            float focusRadius = 8.0 * pow(1.0 - uResolve, 2.0);
            vec2 focusOffset = uResolveTexel * focusRadius;
            vec4 focusCenter = texture2D(map, vMapUv);
            vec4 focusSoft = focusCenter * 0.40;
            focusSoft += texture2D(map, vMapUv + vec2(focusOffset.x, 0.0)) * 0.15;
            focusSoft += texture2D(map, vMapUv - vec2(focusOffset.x, 0.0)) * 0.15;
            focusSoft += texture2D(map, vMapUv + vec2(0.0, focusOffset.y)) * 0.15;
            focusSoft += texture2D(map, vMapUv - vec2(0.0, focusOffset.y)) * 0.15;
            vec4 sampledDiffuseColor = mix(focusSoft, focusCenter, uResolve);
            diffuseColor *= sampledDiffuseColor;
          #endif
        `,
      )
    }
    smat.customProgramCacheKey = () => 'iso4-output-optical-resolve-v1'
    screenResolveUniforms.push(resolveUniforms)
    screenMats.push(smat)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), smat)
    // The artifacts face down the +X optical axis, toward the viewer-facing
    // perspective camera. They are no longer wall projections seen edge-on.
    m.rotation.y = Math.PI / 2
    m.rotation.z = d.tilt
    m.position.set(d.x, lampY + d.y, d.z)
    screenMeshes.push(m)
    scene.add(m)

    // A dedicated low-resolution optical landing field sits behind the crisp
    // deliverable. Keeping it independent makes glow energy tunable without
    // sacrificing content contrast or turning every artifact into a luminous
    // slab. The core plane occludes the middle; only the soft perimeter reads.
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(d.color) },
        uOn: { value: 0 },
        uStrength: { value: d.icon === 'yt' ? 0.2 : d.icon === 'in' ? 0.15 : 0.23 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOn;
        uniform float uStrength;
        varying vec2 vUv;
        void main() {
          vec2 p = (vUv - 0.5) * vec2(1.0, 1.18);
          float radial = length(p);
          float halo = 1.0 - smoothstep(0.16, 0.72, radial);
          halo *= halo;
          gl_FragColor = vec4(uColor, halo * uStrength * uOn);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(
        d.w * (d.icon === 'pod' ? 1.22 : 1.14),
        d.h * (d.icon === 'pod' ? 1.28 : 1.18),
      ),
      glowMat,
    )
    outputGlowMats.push(glowMat)
    outputGlowMeshes.push(glow)
    scene.add(glow)
  })
  const poseOutputs = (t: number) => {
    outputPoseTime = t
    const yaw = apparatusYawAt(t)
    transformMachinePoint(lens, t, posedLens)
    FAN.forEach((d, i) => {
      transformMachinePoint(settledOutputTargets[i]!, t, posedTarget)
      const screen = screenMeshes[i]!
      screen.position.copy(posedTarget)
      // Equivalent to parenting the screen under the yawing optical rig,
      // while retaining each artifact's small authored roll.
      screen.rotation.y = Math.PI / 2 + yaw
      screen.rotation.z = d.tilt

      const glow = outputGlowMeshes[i]!
      glow.position.copy(screen.position)
      glow.quaternion.copy(screen.quaternion)
      blueBeamPoint.set(0, 0, 1).applyQuaternion(screen.quaternion)
      glow.position.addScaledVector(blueBeamPoint, -0.035)

      const beam = beamMeshes[i]!
      posedBeamDir.copy(posedTarget).sub(posedLens)
      const len = posedBeamDir.length()
      beam.position.copy(posedLens).add(posedTarget).multiplyScalar(0.5)
      beam.quaternion.setFromUnitVectors(beamUp, posedBeamDir.normalize())
      beam.scale.y = len

      if (i === 1) {
        // Camera-facing ribbon around the same physical centerline. It starts
        // just ahead of the gate, fades before the phone, and keeps enough
        // width to read as haze rather than a graphic stroke.
        const direction = posedBeamDir
        blueBeamStart.copy(posedLens).addScaledVector(direction, 0.025 * len)
        blueBeamEnd.copy(posedTarget).addScaledVector(direction, -0.035 * len)
        blueBeamView.addVectors(blueBeamStart, blueBeamEnd).multiplyScalar(0.5)
        blueBeamView.negate().add(camera.position).normalize()
        blueBeamSide.crossVectors(direction, blueBeamView).normalize()
        const writePoint = (corner: number, center: THREE.Vector3, halfWidth: number, sign: number) => {
          blueBeamPoint.copy(center).addScaledVector(blueBeamSide, halfWidth * sign)
          const o = corner * 3
          blueBeamVeilPositions[o] = blueBeamPoint.x
          blueBeamVeilPositions[o + 1] = blueBeamPoint.y
          blueBeamVeilPositions[o + 2] = blueBeamPoint.z
        }
        writePoint(0, blueBeamStart, 0.055, -1)
        writePoint(1, blueBeamStart, 0.055, 1)
        writePoint(2, blueBeamEnd, 0.44, -1)
        writePoint(3, blueBeamEnd, 0.44, 1)
        blueBeamVeilGeometry.attributes.position!.needsUpdate = true
        blueBeamVeilMat.uniforms.uTime!.value = t
      }
    })
  }
  updateOutputLayout = () => {
    FAN.forEach((d, i) => {
      // At 16:9 the r10 diagonal was compositionally right but its lower pair
      // touched the viewport floor. Lift only those two artifacts, then move
      // the complete payoff farther into the otherwise unused right field.
      // minJerk-derived panoramicFit makes both corrections disappear on the
      // already-balanced tall desktop and phone shots.
      const lowerLift = i === 0 ? 0 : 0.72 * panoramicFit
      // The lower artifacts need a real channel of negative space, not merely
      // different silhouettes. Push the portrait farther outboard/left and a
      // little higher; push Podcast/RSS outboard/right while preserving its
      // vertically safe baseline. Desktop gets the same separation at a
      // smaller amplitude, so neither breakpoint collapses into a lower clump.
      const fanZ = mobileLayout
        ? [0.22, 2.2, -0.35][i]!
        : [0, 0.55, -0.45][i]!
      const phoneRise = i === 1 ? (mobileLayout ? 0.4 : 0.34) : 0
      // Owner sketch (2026-08-20): pull the constellation into a tighter
      // triangle. YouTube steps up-left toward the beam origin, the phone
      // tucks inboard-left, and Podcast/RSS leaves the bottom-right corner
      // entirely, rising to the mid-right band between the two. Desktop
      // families only — the mobile fan was drawn separately and stays.
      const sketchZ = mobileLayout ? 0 : [0.25, 0.6, -0.15][i]!
      const sketchRise = mobileLayout ? 0 : [1.1, 0.25, 3.05][i]!
      const target = new THREE.Vector3(
        d.x,
        lampY + d.y + lowerLift + phoneRise + sketchRise,
        d.z - 0.78 * panoramicFit + fanZ + sketchZ,
      )
      settledOutputTargets[i]!.copy(target)
      beamMats[i]!.uniforms.uAlpha!.value = mobileLayout
        ? [0.18, 0.06, 0.02][i]!
        : [0.13, 0.06, 0.02][i]!
    })
    poseOutputs(outputPoseTime)
  }
  updateOutputLayout()
  // ---- one opening drop --------------------------------------------------
  // There is deliberately no receptacle. The dashed membrane is the sole
  // input affordance; after crossing it, the file exists only as information.
  const bootFileMat = new THREE.MeshStandardMaterial({
    color: 0x8f5b54,
    roughness: 0.94,
    metalness: 0.02,
    transparent: true,
    opacity: 0,
    emissive: 0xff8d78,
    emissiveIntensity: 0,
  })
  const bootSleeveUniforms = { uSleeveDissolve: { value: 0 } }
  bootFileMat.onBeforeCompile = (shader) => {
    shader.uniforms.uSleeveDissolve = bootSleeveUniforms.uSleeveDissolve
    shader.vertexShader = `varying float vSleeveY;\n${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n vSleeveY = position.y;',
    )
    shader.fragmentShader = `
      uniform float uSleeveDissolve;
      varying float vSleeveY;
    ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
        #include <color_fragment>
        float sleeveV = clamp((vSleeveY + 1.02) / 2.16, 0.0, 1.0);
        float sleeveGrain = 0.018 * sin(sleeveV * 41.0)
          + 0.008 * sin(sleeveV * 97.0 + vSleeveY * 13.0);
        float sleeveThreshold = uSleeveDissolve * 1.08 - 0.06;
        float sleeveKeep = smoothstep(
          sleeveThreshold - 0.022,
          sleeveThreshold + 0.03,
          sleeveV + sleeveGrain
        );
        // A vertical breakup naturally leaves the integrated folder tab for
        // last. Without a localized terminal erosion it briefly becomes a
        // clean salmon cap floating above the cloud. Dissolve only that upper
        // band a little earlier; the sleeve body keeps the same moving front.
        float tabBand = smoothstep(0.80, 0.91, sleeveV);
        float tabOut = 1.0 - smoothstep(0.78, 0.90, uSleeveDissolve);
        sleeveKeep *= mix(1.0, tabOut, tabBand);
        float sleeveEdge = smoothstep(0.07, 0.012, abs(sleeveV + sleeveGrain - sleeveThreshold))
          * sleeveKeep;
        diffuseColor.a *= sleeveKeep;
        diffuseColor.rgb += vec3(1.0, 0.34, 0.19) * sleeveEdge * 0.28;
        if (diffuseColor.a < 0.008) discard;
      `,
    )
  }
  bootFileMat.customProgramCacheKey = () => 'iso4-source-sleeve-dematerialize-v2'
  let bootLabelMat: THREE.ShaderMaterial | null = null
  const bootFile = new THREE.Group()
  {
    // One continuous paper-thin archival sleeve. The tab is part of the
    // silhouette instead of a second cuboid attached to a chunky box.
    const sleeveShape = new THREE.Shape()
    sleeveShape.moveTo(-0.94, -1.0)
    sleeveShape.lineTo(0.94, -1.0)
    sleeveShape.lineTo(0.94, 0.8)
    sleeveShape.lineTo(0.22, 0.8)
    sleeveShape.lineTo(0.08, 1.06)
    sleeveShape.quadraticCurveTo(0.02, 1.12, -0.1, 1.12)
    sleeveShape.lineTo(-0.68, 1.12)
    sleeveShape.quadraticCurveTo(-0.82, 1.12, -0.86, 0.98)
    sleeveShape.lineTo(-0.9, 0.8)
    sleeveShape.lineTo(-0.94, 0.8)
    sleeveShape.closePath()
    const sleeveGeometry = new THREE.ExtrudeGeometry(sleeveShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.022,
      bevelThickness: 0.01,
      curveSegments: 10,
    })
    // Stand the sleeve in the y/z plane so its face remains readable while
    // its leading lower edge passes vertically through the horizontal border.
    sleeveGeometry.rotateY(Math.PI / 2)
    sleeveGeometry.translate(0.02, 0, 0)
    const sleeve = new THREE.Mesh(sleeveGeometry, bootFileMat)
    sleeve.castShadow = true
    sleeve.receiveShadow = true
    bootFile.add(sleeve)
    const lc = document.createElement('canvas')
    lc.width = 640
    lc.height = 680
    const lx = lc.getContext('2d')!
    const drawBootFileLabel = () => {
      lx.clearRect(0, 0, lc.width, lc.height)
      // A flush, aligned contact-sheet inset. It is printed into the sleeve's
      // grid rather than reading as a separate black card laid diagonally on
      // top of it.
      lx.fillStyle = 'rgba(15,16,21,0.97)'
      lx.beginPath()
      lx.roundRect(8, 8, 624, 664, 28)
      lx.fill()
      lx.strokeStyle = 'rgba(255,255,255,0.13)'
      lx.lineWidth = 2
      lx.stroke()

      const tile = (tx: number, name: string, image: HTMLImageElement) => {
        lx.save()
        lx.beginPath()
        lx.roundRect(tx, 124, 276, 310, 13)
        lx.clip()
        lx.fillStyle = '#25262d'
        lx.fillRect(tx, 124, 276, 310)
        if (imageReady(image)) {
          lx.filter = 'sepia(0.1) saturate(0.8) brightness(0.86)'
          drawImageCover(lx, image, tx, 124, 276, 310)
          lx.filter = 'none'
          lx.fillStyle = 'rgba(8,9,10,0.12)'
          lx.fillRect(tx, 124, 276, 310)
        }
        lx.restore()
        lx.fillStyle = 'rgba(8,9,11,0.78)'
        lx.fillRect(tx, 394, 276, 40)
        lx.fillStyle = 'rgba(250,247,240,0.9)'
        lx.font = '650 23px ui-monospace, monospace'
        lx.textAlign = 'left'
        lx.textBaseline = 'middle'
        lx.fillText(name, tx + 14, 414)
      }
      tile(36, 'MIKE', episodeFrames[0]!)
      tile(328, 'JOHN', episodeFrames[1]!)

      // One primary source label and one quiet format chip.
      lx.fillStyle = '#4f8cff'
      lx.beginPath()
      lx.roundRect(34, 30, 58, 46, 12)
      lx.fill()
      lx.fillStyle = '#fff'
      lx.beginPath()
      lx.roundRect(46, 41, 26, 24, 6)
      lx.fill()
      lx.beginPath()
      lx.moveTo(72, 46)
      lx.lineTo(83, 40)
      lx.lineTo(83, 66)
      lx.lineTo(72, 60)
      lx.closePath()
      lx.fill()
      lx.fillStyle = 'rgba(250,247,240,0.96)'
      lx.font = '800 34px system-ui, sans-serif'
      lx.textAlign = 'left'
      lx.textBaseline = 'middle'
      lx.fillText('ZOOM RECORDING', 108, 54)
      lx.fillStyle = '#f28f84'
      lx.beginPath()
      lx.roundRect(526, 30, 78, 46, 12)
      lx.fill()
      lx.fillStyle = '#20100c'
      lx.font = '850 25px ui-monospace, monospace'
      lx.textAlign = 'center'
      lx.fillText('MP4', 565, 54)

      lx.fillStyle = 'rgba(250,247,240,0.96)'
      lx.font = '800 38px system-ui, sans-serif'
      lx.textAlign = 'left'
      lx.fillText('MIKE + JOHN', 36, 490)
      lx.fillStyle = 'rgba(250,247,240,0.62)'
      lx.font = '600 23px ui-monospace, monospace'
      lx.fillText('EPISODE 01 · RAW RECORDING', 36, 532)

      lx.strokeStyle = 'rgba(255,255,255,0.12)'
      lx.lineWidth = 2
      lx.beginPath()
      lx.moveTo(36, 568)
      lx.lineTo(604, 568)
      lx.stroke()

      lx.fillStyle = '#ff5b58'
      lx.beginPath()
      lx.arc(44, 616, 8, 0, Math.PI * 2)
      lx.fill()
      lx.fillStyle = 'rgba(250,247,240,0.74)'
      lx.font = '650 22px ui-monospace, monospace'
      lx.textAlign = 'left'
      lx.fillText('58:14', 64, 616)
      lx.textAlign = 'right'
      lx.fillText('episode-01.zoom.mp4', 604, 616)
    }
    drawBootFileLabel()
    const ltex = new THREE.CanvasTexture(lc)
    ltex.colorSpace = THREE.SRGBColorSpace
    refreshBootFileLabel = () => {
      drawBootFileLabel()
      ltex.needsUpdate = true
    }
    // The source remains materially present through the whole write. A quiet
    // bottom-up noise field erodes its image as particle cohorts leave, with a
    // narrow ember at the live edge rather than an all-over opacity dissolve.
    bootLabelMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: ltex },
        uDissolve: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uDissolve;
        uniform float uOpacity;
        varying vec2 vUv;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        void main() {
          vec4 texel = texture2D(uMap, vUv);
          float n = noise(vUv * vec2(7.0, 10.0)) * 0.16
                  + noise(vUv * vec2(19.0, 23.0)) * 0.06;
          float field = vUv.y * 0.82 + n;
          float threshold = uDissolve * 1.08 - 0.06;
          float keep = smoothstep(threshold - 0.018, threshold + 0.026, field);
          float ember = smoothstep(0.075, 0.012, abs(field - threshold)) * keep;
          vec3 warm = vec3(1.0, 0.34, 0.19);
          gl_FragColor = vec4(texel.rgb + warm * ember * 0.52,
                             texel.a * keep * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 1.74), bootLabelMat)
    label.rotation.y = Math.PI / 2
    label.position.set(0.11, 0, 0.07)
    label.renderOrder = 2
    bootFile.add(label)
  }
  bootFile.visible = false
  machineRoot.add(bootFile)
  // THE SCAN PLANE: only a demure dashed perimeter. Its interior is optically
  // empty; the moving breakup edge on the passing sleeve proves where the
  // transformation plane is without liquid, refraction, ripple, or impact.
  const PLANE_Y = lampY
  let planeMat: THREE.MeshBasicMaterial
  const dropFilmMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uImpact: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uImpact;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 p = position;
        float d = distance(uv, vec2(0.5));
        float impactWave = sin(d * 27.0 - uTime * 5.1) * exp(-d * 4.2) * uImpact;
        float livingWave = sin(uv.x * 10.0 + uTime * 0.32) * sin(uv.y * 8.0 - uTime * 0.26);
        vWave = impactWave + livingWave * 0.075;
        p.z += impactWave * 0.065 + livingWave * 0.011;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uImpact;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);
        float edge = smoothstep(0.72, 0.28, d);
        float ring = 0.5 + 0.5 * sin(d * 36.0 - uTime * 5.2);
        ring = pow(ring, 8.0) * uImpact * exp(-d * 3.8);
        float silk = 0.5 + 0.5 * sin((vUv.x + vUv.y) * 13.0 + uTime * 0.32 + vWave * 3.0);
        vec3 cool = vec3(0.19, 0.20, 0.27);
        vec3 warm = vec3(1.0, 0.49, 0.40);
        vec3 color = mix(cool, warm, 0.18 + ring * 0.42 + silk * 0.055);
        float alpha = uOpacity * edge * (0.048 + silk * 0.02 + ring * 0.19);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  {
    const liquid = new THREE.Mesh(new THREE.PlaneGeometry(DROP.w - 0.18, DROP.d - 0.18, 48, 36), dropFilmMat)
    liquid.rotation.x = -Math.PI / 2
    liquid.position.set(DROP.x, PLANE_Y - 0.015, 0)
    liquid.visible = false
    machineRoot.add(liquid)

    const pc = document.createElement('canvas')
    pc.width = 460
    pc.height = 340
    const px2 = pc.getContext('2d')!
    px2.strokeStyle = '#ff9d8a'
    px2.lineWidth = 7
    px2.setLineDash([26, 18])
    px2.strokeRect(10, 10, 440, 320)
    const ptex = new THREE.CanvasTexture(pc)
    ptex.colorSpace = THREE.SRGBColorSpace
    planeMat = new THREE.MeshBasicMaterial({ map: ptex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(DROP.w, DROP.d), planeMat)
    plane.rotation.x = -Math.PI / 2
    plane.position.set(DROP.x, PLANE_Y, 0)
    machineRoot.add(plane)
  }
  // Exactly three particles are assigned to every film-frame activation. Each
  // cohort has an exact mechanical arrival time but a nearly fixed, graceful
  // flight duration; acceleration increases stream density without whipping
  // any individual particle faster.
  const bitsPos = new Float32Array(BITS_N * 3)
  const bitsColor = new Float32Array(BITS_N * 3)
  const trailPos = new Float32Array(BITS_N * 6)
  const bitsSeed: {
    x: number
    y: number
    z: number
    orbit: number
    targetFrame: number
    arrivalTime: number
    startTime: number
    birthTime: number
    slot: number
  }[] = []
  for (let k = 0; k < BITS_N; k++) {
    // Fibonacci-sphere anchors give the suspended material an even, organic
    // volume without random clumps. Birth order is independent of anchor
    // height, so the dematerializing edge fills the whole cloud rather than
    // drawing a visible scan pattern through it.
    const sphereV = (((k * 47) % BITS_N) + 0.5) / BITS_N
    const sphereY = 1 - 2 * sphereV
    const sphereRadius = Math.sqrt(Math.max(0, 1 - sphereY * sphereY))
    const volumeRadius = Math.pow((((k * 73) % BITS_N) + 0.5) / BITS_N, 1 / 3)
    const phi = (k * 2.399963229728653) % (Math.PI * 2)
    const targetFrame = Math.floor(k / PARTICLES_PER_FRAME) + 1
    const arrivalTime = timeForFrame(targetFrame)
    const birthTime = FILE_CONTACT_AT + ((k + 0.5) / BITS_N) * FILE_TRANSIT_SECONDS
    const cohortRamp = minJerk((targetFrame - 1) / 15)
    const slotJourneyOffset = [0.03, 0, -0.03][k % PARTICLES_PER_FRAME]!
    const journey = THREE.MathUtils.lerp(1.42, 1.28, cohortRamp) + slotJourneyOffset
    // Early cohorts get the longest sculptural journey; flight duration then
    // falls with the same run-up that raises arrival cadence. This keeps the
    // horn occupied without turning 72 simultaneous movers into a spring, and
    // avoids whipping the lead triplet to make the starter deadline.
    const startTime = arrivalTime - journey
    bitsSeed.push({
      x: Math.cos(phi) * sphereRadius * volumeRadius,
      y: sphereY * volumeRadius,
      z: Math.sin(phi) * sphereRadius * volumeRadius,
      orbit: phi,
      targetFrame,
      arrivalTime,
      startTime,
      birthTime,
      slot: k % PARTICLES_PER_FRAME,
    })
    bitsPos[k * 3 + 1] = -999
    trailPos[k * 6 + 1] = -999
    trailPos[k * 6 + 4] = -999
  }
  for (let frame = 0; frame < FRAME_GROUPS; frame++) {
    bitsSeed
      .slice(frame * PARTICLES_PER_FRAME, (frame + 1) * PARTICLES_PER_FRAME)
      .sort((a, b) => a.z - b.z)
      .forEach((seed, slot) => { seed.slot = slot })
  }
  const bitsGeo = new THREE.BufferGeometry()
  bitsGeo.setAttribute('position', new THREE.BufferAttribute(bitsPos, 3))
  bitsGeo.setAttribute('color', new THREE.BufferAttribute(bitsColor, 3))
  const particleSprite = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 31)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.3, 'rgba(255,255,255,0.92)')
    g.addColorStop(0.72, 'rgba(255,255,255,0.22)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })()
  const bitsMat = new THREE.PointsMaterial({ map: particleSprite, color: 0xffffff, vertexColors: true, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false })
  const bits = new THREE.Points(bitsGeo, bitsMat)
  bits.frustumCulled = false
  scene.add(bits)
  const bitsHaloMat = new THREE.PointsMaterial({ map: particleSprite, color: 0xffffff, vertexColors: true, size: 0.42, sizeAttenuation: true, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false })
  const bitsHalo = new THREE.Points(bitsGeo, bitsHaloMat)
  bitsHalo.frustumCulled = false
  scene.add(bitsHalo)
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  const trails = new THREE.LineSegments(
    trailGeo,
    new THREE.LineBasicMaterial({ color: 0xffa58f, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  trails.frustumCulled = false
  scene.add(trails)

  // ---- lights: the noir rig ----------------------------------------------
  // Image-based fill so materials have a world to reflect, kept very dim —
  // the practicals carry the frame; the environment keeps darks from dying.
  {
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = new THREE.Scene()
    env.background = new THREE.Color(0x1a1c24)
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ color: 0x8890a8 }))
    panel.position.set(-4, 6, 4)
    panel.lookAt(0, 0, 0)
    env.add(panel)
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), new THREE.MeshBasicMaterial({ color: 0xffd9b8 }))
    warm.position.set(6, 3, 2)
    warm.lookAt(0, 2, 0)
    env.add(warm)
    scene.environment = pmrem.fromScene(env, 0.08).texture
    scene.environmentIntensity = 0.42
  }
  scene.add(new THREE.HemisphereLight(0x22242e, 0x0a0a0c, 0.62))
  {
    const fill = new THREE.DirectionalLight(0xb8bdd4, 0.5)
    fill.position.set(-6, 14, 9)
    scene.add(fill)
    // the rim: cool edge from behind, so the dark masses hold their silhouette
    const rim = new THREE.DirectionalLight(0x91a2cc, 0.95)
    rim.position.set(3, 11, -9)
    scene.add(rim)
  }
  // One conducted stage light follows the boot story around the machine once:
  // file → threshold/cloud → writer → lower reel → upper reel → gate → outputs. It
  // makes the active area legible without illuminating the whole apparatus.
  const actionLightTarget = new THREE.Object3D()
  scene.add(actionLightTarget)
  const actionSpot = new THREE.SpotLight(0xffd0ad, 0, 64, 0.42, 0.86, 1.35)
  actionSpot.position.set(30, 18, 8)
  actionSpot.target = actionLightTarget
  scene.add(actionSpot)
  const actionLightPath = [
    { t: 0.2, p: new THREE.Vector3(DROP.x, PLANE_Y + 5.4, 0) },
    { t: FILE_CONTACT_AT, p: new THREE.Vector3(DROP.x, PLANE_Y, 0) },
    { t: FILE_CLEAR_AT, p: new THREE.Vector3(DROP.x - 0.28, PLANE_Y - 0.93, 0.08) },
    { t: 3.46, p: new THREE.Vector3((DROP.x + CHARGE_POINT.x) / 2, (PLANE_Y - 0.93 + CHARGE_POINT.y) / 2, 0) },
    // The conducted pool reaches the blank carrier just before the starter
    // triplet. Registration therefore develops into visible emulsion rather
    // than flashing on a black, unexplained mini-screen.
    { t: FIRST_ACTIVATION_AT - 0.18, p: CHARGE_POINT.clone() },
    { t: 4.45, p: new THREE.Vector3(BOTTOM_REEL.x, BOTTOM_REEL.y, 0) },
    { t: 5.45, p: new THREE.Vector3(ASCENT_X, TOP_REEL.y - 1.1, 0) },
    { t: 6.35, p: new THREE.Vector3(TOP_REEL.x, TOP_REEL.y, 0) },
    { t: 7.37, p: new THREE.Vector3(LENS_X, lampY, 0) },
    { t: 9.0, p: new THREE.Vector3(25.8, lampY + 1.1, 1.1) },
    { t: 9.85, p: new THREE.Vector3(25.8, lampY + 1.1, 1.1) },
    { t: 10.7, p: new THREE.Vector3(25.8, lampY + 1.1, 1.1) },
  ]
  const actionPointA = new THREE.Vector3()
  const actionPointB = new THREE.Vector3()
  const updateActionLight = (t: number) => {
    let a = actionLightPath[0]!
    let b = actionLightPath[actionLightPath.length - 1]!
    for (let i = 0; i < actionLightPath.length - 1; i++) {
      const p0 = actionLightPath[i]!
      const p1 = actionLightPath[i + 1]!
      if (t <= p1.t) {
        a = p0
        b = p1
        break
      }
    }
    const u = minJerk((t - a.t) / Math.max(0.001, b.t - a.t))
    // Once the light reaches the writer, follow the yawing body rather than
    // leaving the conducted pool behind in the old world-space position.
    const writerLightAt = FIRST_ACTIVATION_AT - 0.18
    const ap = a.t >= writerLightAt ? transformMachinePoint(a.p, t, actionPointA) : a.p
    const bp = b.t >= writerLightAt ? transformMachinePoint(b.p, t, actionPointB) : b.p
    actionLightTarget.position.lerpVectors(ap, bp, u)
    const wake = THREE.MathUtils.smoothstep(t, 0.15, 0.75)
    const curtain = 1 - THREE.MathUtils.smoothstep(t, 9.85, 10.7)
    actionSpot.intensity = 38 * wake * curtain
  }
  const gateGlow = new THREE.PointLight(0xfff2dc, 5, 7)
  // Physically behind the gate thumbnail along the +X projection axis.
  gateGlow.position.set(DESCENT_X - 0.62, lampY, 0)
  gateGlow.castShadow = true
  gateGlow.shadow.mapSize.set(512, 512)
  gateGlow.shadow.bias = -0.004
  machineRoot.add(gateGlow)
  // A restrained lower-edge kiss: the ISO3 light was an enormous cool source
  // above the reel (72 intensity), exactly where ISO4's mobile copy sits. Keep
  // the archive as a dark silhouette behind the words and reveal its lower
  // mechanics only after the eye has cleared the proposition.
  const wheelKiss = new THREE.PointLight(0xa8b4d8, 4, 14)
  wheelKiss.position.set(reelX - 1.8, reelY - 0.8, 4)
  machineRoot.add(wheelKiss)
  // THE ARCHIVE IS ALIVE: a warm ember inside the drum, between the flanges —
  // the wound memory glows out through the windows as they turn
  const archiveGlow = new THREE.PointLight(0xffd9a8, 2.4, 5.8)
  archiveGlow.position.set(reelX, reelY - 1.2, 0)
  machineRoot.add(archiveGlow)
  const coilGlint = new THREE.PointLight(0xffe8cc, 1.4, 3)
  coilGlint.position.set(reelX + 0.7, reelY - 0.3, 0)
  machineRoot.add(coilGlint)
  const lowerReelEmber = new THREE.PointLight(0xb87a58, 1.6, 3.4)
  lowerReelEmber.position.set(BOTTOM_REEL.x, BOTTOM_REEL.y + 0.2, -0.5)
  machineRoot.add(lowerReelEmber)
  const chargeLight = new THREE.PointLight(0xff9d82, 0, 5.2)
  chargeLight.position.copy(CHARGE_POINT)
  machineRoot.add(chargeLight)
  // inside the head, so the housing, shaft and mast inner faces read as a
  // lamp room rather than a black pocket
  const headGlow = new THREE.PointLight(0xffe4c4, 3.5, 5.5)
  headGlow.position.set((LAMP_CX + HEAD_X0) / 2, lampY + 0.25, 0)
  machineRoot.add(headGlow)
  // ---- per-frame state ----------------------------------------------------
  let lastGateId = Number.NaN
  let lastFilmFrame = Number.NaN
  let lastWrittenFrame = Number.NaN
  let lastProjectedVideoRevision = Number.NaN
  let outputTextureRevision = 0
  let missedProjectionFrames = 0
  let missedMechanicalTicks = 0
  let lastOutputTextureAt = Number.NaN
  let firstOutputTextureLatency = Number.NaN
  let firstBeamObserved = false
  let longestOutputHold = 0
  let lastGateSourceFrame = -1
  let lastProjectionSourceFrame = -1
  let gateProjectionPhaseError = 0
  const outputTextureTimes: number[] = []
  const renderFrameTimes: number[] = []
  // A real lamp can flutter on strike, but the old 45%-depth high-frequency
  // multiplier made the projected cards themselves appear to drop frames.
  // This is a small damped optical tremor; content opacity remains monotone.
  const ignitionFlutter = (age: number, seed = 0) => {
    const decay = 1 - minJerk(age / 0.46)
    const tremor = 0.5 + 0.5 * Math.sin((age + seed) * 31.7) * Math.sin((age + seed) * 13.1)
    return 1 - decay * (0.035 + 0.095 * tremor)
  }
  const hermite = (a: number, tangentA: number, b: number, tangentB: number, u: number) => {
    const u2 = u * u
    const u3 = u2 * u
    return (2 * u3 - 3 * u2 + 1) * a
      + (u3 - 2 * u2 + u) * tangentA
      + (-2 * u3 + 3 * u2) * b
      + (u3 - u2) * tangentB
  }
  const quinticHermite = (
    a: number,
    velocityA: number,
    accelerationA: number,
    b: number,
    velocityB: number,
    accelerationB: number,
    u: number,
  ) => {
    const u2 = u * u
    const u3 = u2 * u
    const u4 = u3 * u
    const u5 = u4 * u
    const h00 = 1 - 10 * u3 + 15 * u4 - 6 * u5
    const h10 = u - 6 * u3 + 8 * u4 - 3 * u5
    const h20 = 0.5 * (u2 - 3 * u3 + 3 * u4 - u5)
    const h01 = 10 * u3 - 15 * u4 + 6 * u5
    const h11 = -4 * u3 + 7 * u4 - 3 * u5
    const h21 = 0.5 * (u3 - 2 * u4 + u5)
    return h00 * a + h10 * velocityA + h20 * accelerationA
      + h01 * b + h11 * velocityB + h21 * accelerationB
  }
  const criticallyDamped = (
    start: number,
    initialVelocity: number,
    target: number,
    omega: number,
    age: number,
  ) => {
    const delta = start - target
    return target + (delta + (initialVelocity + omega * delta) * age) * Math.exp(-omega * age)
  }
  // Source ownership -> suspended volume -> curved horn -> ordered stream.
  // Every particle is born on the invisible threshold with the sleeve's
  // downward velocity. A critically damped atmosphere removes that momentum
  // into a filled Fibonacci cloud. The writer then gathers the cloud through
  // one asymmetric, contracting volume rather than a frontal orbit around the
  // reel. A rotation-minimizing Bishop frame keeps that volume from flipping
  // or accumulating the arbitrary twist of a Frenet frame.
  const CLOUD_CENTER_X = DROP.x - 0.28
  const CLOUD_CENTER_Y = PLANE_Y - 0.93
  const CLOUD_CENTER_Z = 0.08
  const CLOUD_DAMPING = 3.25
  const PARTICLE_HORN_END = 0.84
  const PARTICLE_HORN_TURNS = 0.42
  const PARTICLE_SHUTTER_SECONDS = 0.014
  const PARTICLE_FRONT_X = CHARGE_POINT.x + 0.058
  const HORN_NECK_SCALE = 0.13
  const HORN_P0 = new THREE.Vector3(CLOUD_CENTER_X, CLOUD_CENTER_Y, CLOUD_CENTER_Z)
  // In the mobile camera this bows the centerline visibly outward before it
  // folds down and back into the writer: a J-shaped phonograph/saxophone
  // gesture, never a center-to-center arrow.
  const HORN_P1 = new THREE.Vector3(CLOUD_CENTER_X + 0.45, CLOUD_CENTER_Y - 0.75, CLOUD_CENTER_Z - 1.55)
  const HORN_P2 = new THREE.Vector3(CHARGE_POINT.x + 2.55, CHARGE_POINT.y + 1.5, -1.05)
  const HORN_P3 = new THREE.Vector3(CHARGE_POINT.x + 0.55, CHARGE_POINT.y + 0.32, -0.18)
  const HORN_FRAME_SAMPLES = 72
  const HORN_ARC_SAMPLES = 192
  const hornCenters: THREE.Vector3[] = []
  const hornTangents: THREE.Vector3[] = []
  const hornNormals: THREE.Vector3[] = []
  const hornBinormals: THREE.Vector3[] = []
  const hornArcParams: number[] = []
  const hornArcLengths: number[] = []
  const hornD10 = HORN_P1.clone().sub(HORN_P0)
  const hornD21 = HORN_P2.clone().sub(HORN_P1)
  const hornD32 = HORN_P3.clone().sub(HORN_P2)
  const hornCurvePoint = (s: number, out: THREE.Vector3) => {
    const u = THREE.MathUtils.clamp(s, 0, 1)
    const v = 1 - u
    return out.set(0, 0, 0)
      .addScaledVector(HORN_P0, v * v * v)
      .addScaledVector(HORN_P1, 3 * v * v * u)
      .addScaledVector(HORN_P2, 3 * v * u * u)
      .addScaledVector(HORN_P3, u * u * u)
  }
  const hornCurveTangent = (s: number, out: THREE.Vector3) => {
    const u = THREE.MathUtils.clamp(s, 0, 1)
    const v = 1 - u
    return out.set(0, 0, 0)
      .addScaledVector(hornD10, 3 * v * v)
      .addScaledVector(hornD21, 6 * v * u)
      .addScaledVector(hornD32, 3 * u * u)
      .normalize()
  }
  {
    const previous = new THREE.Vector3()
    const current = new THREE.Vector3()
    let total = 0
    hornCurvePoint(0, previous)
    for (let i = 0; i <= HORN_ARC_SAMPLES; i++) {
      const parameter = i / HORN_ARC_SAMPLES
      hornCurvePoint(parameter, current)
      if (i > 0) total += current.distanceTo(previous)
      hornArcParams.push(parameter)
      hornArcLengths.push(total)
      previous.copy(current)
    }
    for (let i = 0; i < hornArcLengths.length; i++) hornArcLengths[i]! /= total
  }
  const hornParameterAtArc = (arc: number) => {
    const s = THREE.MathUtils.clamp(arc, 0, 1)
    let lo = 0
    let hi = hornArcLengths.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (hornArcLengths[mid]! < s) lo = mid
      else hi = mid
    }
    const a0 = hornArcLengths[lo]!
    const a1 = hornArcLengths[hi]!
    const f = a1 > a0 ? (s - a0) / (a1 - a0) : 0
    return THREE.MathUtils.lerp(hornArcParams[lo]!, hornArcParams[hi]!, f)
  }
  {
    const tangent = new THREE.Vector3()
    const previousTangent = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const axis = new THREE.Vector3()
    const reference = new THREE.Vector3(1, 0, 0)
    const center = new THREE.Vector3()
    for (let i = 0; i <= HORN_FRAME_SAMPLES; i++) {
      const s = i / HORN_FRAME_SAMPLES
      const parameter = hornParameterAtArc(s)
      hornCurvePoint(parameter, center)
      hornCurveTangent(parameter, tangent)
      if (i === 0) {
        normal.copy(reference).addScaledVector(tangent, -reference.dot(tangent)).normalize()
      } else {
        axis.crossVectors(previousTangent, tangent)
        const sine = axis.length()
        const cosine = THREE.MathUtils.clamp(previousTangent.dot(tangent), -1, 1)
        if (sine > 1e-7) {
          axis.multiplyScalar(1 / sine)
          normal.applyAxisAngle(axis, Math.atan2(sine, cosine))
        }
        normal.addScaledVector(tangent, -normal.dot(tangent)).normalize()
      }
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize()
      hornCenters.push(center.clone())
      hornTangents.push(tangent.clone())
      hornNormals.push(normal.clone())
      hornBinormals.push(binormal)
      previousTangent.copy(tangent)
    }
  }
  const hornFrameCenter = new THREE.Vector3()
  const hornFrameTangent = new THREE.Vector3()
  const hornFrameNormal = new THREE.Vector3()
  const hornFrameBinormal = new THREE.Vector3()
  const sampleHornFrame = (s: number) => {
    const scaled = THREE.MathUtils.clamp(s, 0, 1) * HORN_FRAME_SAMPLES
    const i0 = Math.min(HORN_FRAME_SAMPLES - 1, Math.floor(scaled))
    const i1 = i0 + 1
    const f = scaled - i0
    hornFrameCenter.lerpVectors(hornCenters[i0]!, hornCenters[i1]!, f)
    hornFrameTangent.lerpVectors(hornTangents[i0]!, hornTangents[i1]!, f).normalize()
    hornFrameNormal.lerpVectors(hornNormals[i0]!, hornNormals[i1]!, f)
      .addScaledVector(hornFrameTangent, -hornFrameNormal.dot(hornFrameTangent))
      .normalize()
    hornFrameBinormal.crossVectors(hornFrameTangent, hornFrameNormal).normalize()
  }
  const hornRadiusScaleAt = (s: number) => THREE.MathUtils.lerp(
    1,
    HORN_NECK_SCALE,
    minJerk((s - 0.32) / 0.68),
  )
  const particleMachineP0 = new THREE.Vector3()
  const cloudPositionAt = (sd: (typeof bitsSeed)[number], at: number, out: Float32Array, o: number) => {
    const age = Math.max(0, at - sd.birthTime)
    const initialX = DROP.x - 0.04
    const initialY = PLANE_Y
    const initialZ = 0.1 + sd.z * 0.92 * detailScale
    const targetX = CLOUD_CENTER_X + sd.x * 0.82
    // The fastest inherited fragment can still approach its anchor
    // monotonically: targetY never sits above initialY-|v|/omega. That keeps
    // the cloud suspended without a hidden vertical rebound.
    const targetY = CLOUD_CENTER_Y + sd.y * 0.32
    const targetZ = CLOUD_CENTER_Z + sd.z * 1.08
    const inheritedVy = -(2.24 * detailScale) / FILE_TRANSIT_SECONDS
    const breathe = minJerk((age - 0.28) / 0.72)
    out[o] = criticallyDamped(initialX, 0, targetX, CLOUD_DAMPING, age)
      + breathe * 0.045 * Math.sin(age * 0.62 + sd.orbit * 1.7)
    out[o + 1] = criticallyDamped(initialY, inheritedVy, targetY, CLOUD_DAMPING, age)
      + breathe * 0.038 * Math.sin(age * 0.48 + sd.orbit * 0.8)
    out[o + 2] = criticallyDamped(initialZ, 0, targetZ, CLOUD_DAMPING, age)
      + breathe * 0.065 * Math.sin(age * 0.55 + sd.orbit * 1.25)
  }
  const cloudStartP = new Float32Array(3)
  const cloudPreviousP = new Float32Array(3)
  const cloudBeforePreviousP = new Float32Array(3)
  const hornEndP = new Float32Array(3)
  const hornBeforeEndP = new Float32Array(3)
  const hornBeforeEnd2P = new Float32Array(3)
  const particleTransferSeconds = (sd: (typeof bitsSeed)[number]) => {
    if (sd.targetFrame >= FRAME_GROUPS) return 0.12
    return Math.min(0.12, 0.86 * (timeForFrame(sd.targetFrame + 1) - sd.arrivalTime))
  }
  const hornFlowAt = (
    sd: (typeof bitsSeed)[number],
    cloudVx: number,
    cloudVy: number,
    cloudVz: number,
    cloudAx: number,
    cloudAy: number,
    cloudAz: number,
    stageDuration: number,
    u: number,
    out: Float32Array,
    o: number,
  ) => {
    // Endpoint-speed quintic: C2 at the cloud, broadly occupied through the
    // shoulder/middle, then still moving into the neck. The old 2u^3-u^4 map
    // left most cohorts parked in the bell before shooting into a bead string
    // with twice the necessary endpoint speed.
    const uu = THREE.MathUtils.clamp(u, 0, 1)
    const u2 = uu * uu
    const u3 = u2 * uu
    const u4 = u3 * uu
    const u5 = u4 * uu
    const s = minJerk(uu) + 0.45 * (-4 * u3 + 7 * u4 - 3 * u5)
    sampleHornFrame(s)
    const dx = cloudStartP[0]! - HORN_P0.x
    const dy = cloudStartP[1]! - HORN_P0.y
    const dz = cloudStartP[2]! - HORN_P0.z
    const n0 = hornNormals[0]!
    const b0 = hornBinormals[0]!
    const t0 = hornTangents[0]!
    const localN = dx * n0.x + dy * n0.y + dz * n0.z
    const localB = dx * b0.x + dy * b0.y + dz * b0.z
    const localT = dx * t0.x + dy * t0.y + dz * t0.z
    // One shared cross-section rotation creates common fate. Individual
    // particles do not independently orbit the centerline.
    const theta = Math.PI * 2 * PARTICLE_HORN_TURNS * minJerk(s)
    const cosTheta = Math.cos(theta)
    const sinTheta = Math.sin(theta)
    const rotatedN = localN * cosTheta - localB * sinTheta
    const rotatedB = localN * sinTheta + localB * cosTheta
    const radiusScale = hornRadiusScaleAt(s)
    const tangentScale = 1 - minJerk(s)
    const detailEnvelope = Math.pow(Math.sin(Math.PI * s), 2)
    // Bounded 1/f-ish detail preserves authored volume without per-frame noise
    // or a boiling velocity field.
    const detailN = detailEnvelope * (
      0.028 * Math.sin(s * Math.PI * 3 + sd.orbit)
      + 0.012 * Math.sin(s * Math.PI * 7 - sd.orbit * 1.7)
      + 0.005 * Math.sin(s * Math.PI * 13 + sd.orbit * 0.6)
    )
    const detailB = detailEnvelope * (
      0.024 * Math.sin(s * Math.PI * 4 - sd.orbit * 0.8)
      + 0.009 * Math.sin(s * Math.PI * 9 + sd.orbit * 1.3)
    )
    // Quintic Hermite carry terms reproduce the cloud's sampled velocity and
    // acceleration at departure, then vanish with zero first/second
    // derivatives. The cloud-to-field handoff is C2, not a force switch.
    const momentumCarry = (uu - 6 * u3 + 8 * u4 - 3 * u5) * stageDuration
    const accelerationCarry = 0.5 * (u2 - 3 * u3 + 3 * u4 - u5) * stageDuration * stageDuration
    const normalAmount = rotatedN * radiusScale + detailN
    const binormalAmount = rotatedB * radiusScale + detailB
    const tangentAmount = localT * tangentScale
    out[o] = hornFrameCenter.x
      + hornFrameNormal.x * normalAmount
      + hornFrameBinormal.x * binormalAmount
      + hornFrameTangent.x * tangentAmount
      + cloudVx * momentumCarry
      + cloudAx * accelerationCarry
    out[o + 1] = hornFrameCenter.y
      + hornFrameNormal.y * normalAmount
      + hornFrameBinormal.y * binormalAmount
      + hornFrameTangent.y * tangentAmount
      + cloudVy * momentumCarry
      + cloudAy * accelerationCarry
    out[o + 2] = hornFrameCenter.z
      + hornFrameNormal.z * normalAmount
      + hornFrameBinormal.z * binormalAmount
      + hornFrameTangent.z * tangentAmount
      + cloudVz * momentumCarry
      + cloudAz * accelerationCarry
  }
  const particleAt = (sd: (typeof bitsSeed)[number], at: number, out: Float32Array, o: number) => {
    if (at < sd.birthTime || at > sd.arrivalTime + particleTransferSeconds(sd)) return false
    if (at < sd.startTime) {
      cloudPositionAt(sd, at, out, o)
      transformMachinePoint(particleMachineP0.set(out[o]!, out[o + 1]!, out[o + 2]!), at, particleMachineP0)
      out[o] = particleMachineP0.x
      out[o + 1] = particleMachineP0.y
      out[o + 2] = particleMachineP0.z
      return true
    }
    const q = THREE.MathUtils.clamp((at - sd.startTime) / (sd.arrivalTime - sd.startTime), 0, 1)
    cloudPositionAt(sd, sd.startTime, cloudStartP, 0)
    cloudPositionAt(sd, sd.startTime - 0.01, cloudPreviousP, 0)
    cloudPositionAt(sd, sd.startTime - 0.02, cloudBeforePreviousP, 0)
    const cloudVx = (cloudStartP[0]! - cloudPreviousP[0]!) / 0.01
    const cloudVy = (cloudStartP[1]! - cloudPreviousP[1]!) / 0.01
    const cloudVz = (cloudStartP[2]! - cloudPreviousP[2]!) / 0.01
    const cloudAx = (cloudStartP[0]! - 2 * cloudPreviousP[0]! + cloudBeforePreviousP[0]!) / 0.0001
    const cloudAy = (cloudStartP[1]! - 2 * cloudPreviousP[1]! + cloudBeforePreviousP[1]!) / 0.0001
    const cloudAz = (cloudStartP[2]! - 2 * cloudPreviousP[2]! + cloudBeforePreviousP[2]!) / 0.0001
    // Three monotone registration sites across the 16:9 film cell. Assignment
    // follows source z order within every cohort, preventing crossing paths.
    // The x coordinate stays on the camera side of both thumbnail and strip
    // through the complete capture, so no particle can appear to pass behind
    // the film before giving its luminance to the image.
    const slot = sd.slot === 0 ? -1 : sd.slot === 2 ? 1 : 0
    const targetY = CHARGE_POINT.y + (slot === 0 ? -0.06 * IMG_H : 0.06 * IMG_H)
    const targetZ = slot * IMG_W * 0.32
    let px: number
    let py: number
    let pz: number

    const totalJourney = sd.arrivalTime - sd.startTime
    const hornDuration = totalJourney * PARTICLE_HORN_END
    if (q < PARTICLE_HORN_END) {
      const u = q / PARTICLE_HORN_END
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, hornDuration, u, hornEndP, 0)
      px = hornEndP[0]!
      py = hornEndP[1]!
      pz = hornEndP[2]!
    } else {
      // Collapse the curved horn into one of three stable registration sites
      // in one continuous C2 seat. The former neck stopped at an abstract
      // approach point, then relaunched through a 77ms front-normal jab. This
      // quintic inherits the Bishop flow's real velocity and acceleration and
      // reaches the emulsion with a small residual normal velocity. The sharp
      // loss of that last momentum is the exposure event itself.
      const registerSpan = 1 - PARTICLE_HORN_END
      const u = (q - PARTICLE_HORN_END) / registerSpan
      const epsilon = 0.0015
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, hornDuration, 1, hornEndP, 0)
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, hornDuration, 1 - epsilon, hornBeforeEndP, 0)
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, hornDuration, 1 - 2 * epsilon, hornBeforeEnd2P, 0)
      const derivativeScale = registerSpan / PARTICLE_HORN_END
      const secondDerivativeScale = derivativeScale * derivativeScale
      const endpointVelocity = (axis: number) => (
        (3 * hornEndP[axis]! - 4 * hornBeforeEndP[axis]! + hornBeforeEnd2P[axis]!)
        / (2 * epsilon)
      ) * derivativeScale
      const endpointAcceleration = (axis: number) => (
        (hornEndP[axis]! - 2 * hornBeforeEndP[axis]! + hornBeforeEnd2P[axis]!)
        / (epsilon * epsilon)
      ) * secondDerivativeScale
      const registerDuration = totalJourney * registerSpan
      const contactVelocityX = -0.5 * registerDuration
      px = quinticHermite(
        hornEndP[0]!,
        endpointVelocity(0),
        endpointAcceleration(0),
        PARTICLE_FRONT_X,
        contactVelocityX,
        0,
        u,
      )
      py = quinticHermite(
        hornEndP[1]!,
        endpointVelocity(1),
        endpointAcceleration(1),
        targetY,
        0,
        0,
        u,
      )
      pz = quinticHermite(
        hornEndP[2]!,
        endpointVelocity(2),
        endpointAcceleration(2),
        targetZ,
        0,
        0,
        u,
      )
    }

    transformMachinePoint(particleMachineP0.set(px, py, pz), at, particleMachineP0)
    out[o] = particleMachineP0.x
    out[o + 1] = particleMachineP0.y
    out[o + 2] = particleMachineP0.z
    return true
  }
  // Particles wake gradually, gain coherence as they join the common stream,
  // then give their luminance to the written film cell during one cadence-aware hold.
  // The registration point is a transfer, not a deletion.
  const particleEnergy = (sd: (typeof bitsSeed)[number], at: number) => {
    const transferSeconds = particleTransferSeconds(sd)
    if (at < sd.birthTime || at > sd.arrivalTime + transferSeconds) return 0
    const materialize = minJerk((at - sd.birthTime) / 0.2)
    if (at < sd.startTime) {
      const cloudBreath = 0.94 + 0.06 * Math.sin((at - sd.birthTime) * 0.72 + sd.orbit)
      return materialize * 0.36 * cloudBreath
    }
    const q = THREE.MathUtils.clamp((at - sd.startTime) / (sd.arrivalTime - sd.startTime), 0, 1)
    const coherence = 0.36 + 0.64 * minJerk(q / 0.8)
    const transfer = at <= sd.arrivalTime ? 1 : 1 - minJerk((at - sd.arrivalTime) / transferSeconds)
    return materialize * coherence * transfer
  }
  function update(t: number) {
    // The desktop camera sees a much larger physical stage. Preserve the
    // source's legibility and the particles' delicate cores without adding
    // particles or speeding them up; mobile retains its accepted density.
    bitsMat.size = 0.16 * detailScale
    bitsHaloMat.size = 0.42 * detailScale
    if (movingMediaIsActive() && (episodeVideo.paused || projectionVideo.paused)) {
      enterDeterministicMediaFallback()
    }
    if (temporalMediaResetRequested) {
      filmSlotReady.fill(false)
      filmSlotSourceFrames.fill(-1)
      lastFilmFrame = Number.NaN
      lastWrittenFrame = Number.NaN
      lastGateId = Number.NaN
      lastProjectedVideoRevision = Number.NaN
      temporalMediaResetRequested = false
    }
    let movingMediaActive = movingMediaIsActive()
    if (movingMediaActive) syncMediaClocks(t)
    const dist = transportDist(t)
    // A real projector holds each frame at the gate, then pulls the strip down
    // one pitch. Keep that intermittent 16fps transport distinct from the
    // continuously turning reel loop and the otherwise smooth scene.
    const filmFrame = quantizedFrame(dist / PITCH)
    const filmDist = filmFrame * PITCH
    const filmPhaseWithinFrame = dist / PITCH - filmFrame
    // A Geneva-style pull-down: hold the cell steady for most of the frame,
    // then advance it through one pitch with zero endpoint velocity. The
    // canvas is still repainted only on the exact 16fps logical tick; a UV
    // offset supplies the brief physical movement without uploading the full
    // ribbon at RAF cadence. At the next tick the redrawn texture and zeroed
    // offset are pixel-continuous with the completed pull.
    const pulldown = minJerk((filmPhaseWithinFrame - 0.58) / 0.42)
    filmTex.offset.x = -(pulldown * PITCH) / totalPath
    const off = 0
    machinePivot.rotation.y = apparatusYawAt(t)
    poseOutputs(t)
    for (const m of beamMats) m.uniforms.uTime!.value = t
    updateActionLight(t)

    // ACT 1 — the rite of indexing: an upright file passes through an empty
    // dashed boundary. Its material inherits the same downward velocity as it
    // becomes a suspended cloud, then triplets peel into the writer.
    const bx = DROP.x
    const framePhase = dist / PITCH
    const writePhase = t < BOOT.run ? 0 : Math.min(FRAME_GROUPS, 1 + framePhase)
    const chargeProgress = writePhase / FRAME_GROUPS
    let impactPulse = 0
    {
      // Materialize below the CTA band. The earlier 9.6-world-unit corridor
      // forced the readable file face through “Watch it work” on mobile.
      const y0 = PLANE_Y + 6.2
      const tau = t - BOOT.drop
      const crossAge = t - FILE_CONTACT_AT
      const transitProgress = THREE.MathUtils.clamp(crossAge / FILE_TRANSIT_SECONDS, 0, 1)
      const finalHit = timeForFrame(FRAME_GROUPS)
      // Only the perimeter exists. It calmly locates the transformation plane
      // and fades after the source has fully crossed; its empty interior never
      // splashes, refracts, ripples, or glows.
      const wake = THREE.MathUtils.smoothstep(t, BOOT.plane, BOOT.plane + 0.6)
      const borderOut = 1 - minJerk((t - (FILE_CLEAR_AT + 0.18)) / 0.72)
      planeMat.opacity = wake * borderOut * 0.24
      dropFilmMat.uniforms.uTime!.value = t
      dropFilmMat.uniforms.uImpact!.value = 0
      dropFilmMat.uniforms.uOpacity!.value = 0
      // Approach with a Hermite velocity match, then cross at one constant
      // speed. The threshold changes representation only: the sleeve and the
      // particles on its far side have the same position and momentum.
      const fileIn = minJerk(tau / 0.42)
      const dissolve = transitProgress
      if (tau > 0 && t < FILE_CLEAR_AT && dissolve < 0.9995) {
        bootFile.visible = true
        const fileHalfHeight = 1.12 * detailScale
        const contactY = PLANE_Y + fileHalfHeight
        const transitVelocity = -(2 * fileHalfHeight) / FILE_TRANSIT_SECONDS
        const approachU = THREE.MathUtils.clamp(tau / FILE_APPROACH_SECONDS, 0, 1)
        const approachY = hermite(
          y0,
          0,
          contactY,
          transitVelocity * FILE_APPROACH_SECONDS,
          approachU,
        )
        const fileY = crossAge <= 0
          ? approachY
          : contactY + transitVelocity * Math.min(FILE_TRANSIT_SECONDS, crossAge)
        bootFile.position.set(bx - 0.1, fileY, 0.1)
        bootFile.scale.setScalar(detailScale)
        bootFile.rotation.set(0, -0.1, 0)
        // The last surviving geometry used to be the integrated folder tab,
        // which briefly read as a lid hovering over the cloud. Let the shell
        // finish with the same moving breakup front instead of leaving a clean
        // container-shaped cap after the printed face is gone.
        const shellOut = 1 - minJerk((dissolve - 0.82) / 0.14)
        bootFileMat.opacity = fileIn * shellOut * 0.76
        bootFileMat.emissiveIntensity = 0.1
        bootSleeveUniforms.uSleeveDissolve.value = dissolve
        if (bootLabelMat) {
          bootLabelMat.uniforms.uOpacity!.value = fileIn
          bootLabelMat.uniforms.uDissolve!.value = dissolve
        }
      } else {
        bootFile.visible = false
      }
      // Material points are born along the crossing edge, coast into one
      // suspended volume, then leave that cloud in frame-funded triplets.
      if (t >= FILE_CONTACT_AT && t < finalHit + 0.18) {
        let visibleBits = 0
        for (let k = 0; k < BITS_N; k++) {
          const sd = bitsSeed[k]!
          const i3 = k * 3
          const i6 = k * 6
          if (!particleAt(sd, t, bitsPos, i3)) {
            bitsPos[i3 + 1] = -999
            bitsColor[i3] = 0
            bitsColor[i3 + 1] = 0
            bitsColor[i3 + 2] = 0
            trailPos[i6 + 1] = -999
            trailPos[i6 + 4] = -999
            continue
          }
          const energy = particleEnergy(sd, t)
          const tint = sd.slot === 0
            ? [1, 0.8, 0.69]
            : sd.slot === 1
              ? [0.88, 0.81, 1]
              : [1, 0.92, 0.78]
          bitsColor[i3] = energy * tint[0]!
          bitsColor[i3 + 1] = energy * tint[1]!
          bitsColor[i3 + 2] = energy * tint[2]!
          if (energy > 0.04) visibleBits += 1
          trailPos[i6] = bitsPos[i3]!
          trailPos[i6 + 1] = bitsPos[i3 + 1]!
          trailPos[i6 + 2] = bitsPos[i3 + 2]!
          const q = (t - sd.startTime) / (sd.arrivalTime - sd.startTime)
          const trailEnvelope = q < PARTICLE_HORN_END
            ? minJerk((q - 0.48) / 0.14)
              * (1 - minJerk((q - (PARTICLE_HORN_END - 0.1)) / 0.1))
            : 0
          const hasTrail = particleAt(sd, t - PARTICLE_SHUTTER_SECONDS, trailPos, i6 + 3)
          if (hasTrail && trailEnvelope > 0) {
            trailPos[i6 + 3] = THREE.MathUtils.lerp(bitsPos[i3]!, trailPos[i6 + 3]!, trailEnvelope)
            trailPos[i6 + 4] = THREE.MathUtils.lerp(bitsPos[i3 + 1]!, trailPos[i6 + 4]!, trailEnvelope)
            trailPos[i6 + 5] = THREE.MathUtils.lerp(bitsPos[i3 + 2]!, trailPos[i6 + 5]!, trailEnvelope)
          } else {
            trailPos[i6 + 3] = bitsPos[i3]!
            trailPos[i6 + 4] = bitsPos[i3 + 1]!
            trailPos[i6 + 5] = bitsPos[i3 + 2]!
          }
        }
        bitsGeo.attributes.position!.needsUpdate = true
        bitsGeo.attributes.color!.needsUpdate = true
        trailGeo.attributes.position!.needsUpdate = true
        bits.visible = visibleBits > 0
        bitsHalo.visible = visibleBits > 0
        trails.visible = visibleBits > 0
      } else {
        bits.visible = false
        bitsHalo.visible = false
        trails.visible = false
      }
    }

    // ACT 2 — the first exposed cell starts one shared transport/flywheel
    // drive. The strip keeps its honest 16fps gate cadence while both reels
    // rotate continuously at exactly the carrier's tangent speed.
    const reelDist = reelDriveDistance(t)
    // Clockwise matches the loop: film rises on the left tangents and falls
    // on the right, so flange motion and thumbnail motion agree.
    reel.rotation.z = -reelDist / coilR
    lowerReel.rotation.z = -reelDist / coilR
    const completedFrames = writtenFramesAt(t)
    const lastHitAge = completedFrames >= 1 ? Math.max(0, t - timeForFrame(completedFrames)) : 0
    for (let n = Math.max(1, completedFrames - 2); n <= completedFrames; n++) {
      const age = t - timeForFrame(n)
      if (age >= 0) impactPulse += Math.exp(-age / 0.09)
    }
    impactPulse = Math.min(0.55, impactPulse * 0.22)
    const contactFlash = completedFrames >= 1 ? Math.exp(-lastHitAge / 0.028) : 0
    const writerImpact = Math.min(1, contactFlash * 0.86 + impactPulse * 0.34)
    const finalHit = timeForFrame(FRAME_GROUPS)
    const chargingActive = completedFrames >= 1 && t <= finalHit + 0.28
    const writerEnvelope = chargingActive ? 1 - minJerk((t - finalHit) / 0.28) : 0
    const chargeRelease = 1 - minJerk((t - finalHit) / Math.max(0.1, BOOT.proj - finalHit + 0.18))
    for (const mat of lowerChargeMats) {
      mat.emissiveIntensity = 0.005 + chargeProgress * chargeRelease * 0.055 + impactPulse * 0.035
    }
    lowerReelEmber.intensity = 0.025 + chargeProgress * chargeRelease * 0.22 + impactPulse * 0.18
    chargeLight.intensity = writerEnvelope * (chargeProgress * 0.1 + writerImpact * 2.1)
    chargeRingMat.opacity = writerEnvelope * Math.min(0.28, chargeProgress * 0.03 + writerImpact * 0.22)
    chargeRingMat.emissiveIntensity = writerEnvelope * (chargeProgress * 0.065 + writerImpact * 0.82)
    chargeRing.scale.setScalar(1 + contactFlash * 0.035)
    writerStockCatchMat.opacity = 0.13 + chargeProgress * chargeRelease * 0.025 + contactFlash * 0.065
    // A frame is not already complete when its triplet arrives. Three
    // reconstruction fronts spread from the exact registration anchors over
    // 55ms—short enough to finish before the next 16fps pull—while the impact
    // pulse and cumulative charge visibly accept the particles' energy.
    const writerReveal = completedFrames >= 1 ? minJerk(lastHitAge / 0.052) : 0
    chargeThumbUniforms.uWriterBuild.value = writerReveal
    chargeThumbUniforms.uWriterImpact.value = writerImpact
    chargeThumbUniforms.uWriterCharge.value = chargeProgress
    chargeThumbMat.opacity = writerEnvelope * Math.min(
      0.66,
      0.07 + writerImpact * 0.08 + writerReveal * 0.46 + chargeProgress * 0.07,
    )
    filmMatRef.opacity = 0.2 + 0.8 * THREE.MathUtils.smoothstep(t, BOOT.run - 0.05, BOOT.run + 1.55)
    const transportChanged = filmFrame !== lastFilmFrame
    const writerChanged = completedFrames !== lastWrittenFrame
    if (transportChanged || writerChanged) {
      if (Number.isFinite(lastFilmFrame) && filmFrame > lastFilmFrame + 1) {
        missedMechanicalTicks += filmFrame - lastFilmFrame - 1
        // A live frame cannot be truthfully reconstructed after RAF skipped a
        // mechanical writer tick: every missed cell would otherwise inherit
        // the same current video snapshot. Prefer the deterministic 16fps
        // fallback to silently breaking film/gate/output phase causality.
        if (movingMediaActive) {
          enterDeterministicMediaFallback()
          movingMediaActive = false
        }
      }
      let writerSlot = -1
      if (movingMediaActive && completedFrames >= 1) {
        const firstWrite = Number.isFinite(lastWrittenFrame)
          ? Math.max(1, lastWrittenFrame + 1)
          : 1
        for (let write = firstWrite; write <= completedFrames; write++) {
          writerSlot = stampFilmSlot(write - 1)
        }
      }
      lastFilmFrame = filmFrame
      lastWrittenFrame = completedFrames
      drawFilm(filmDist, Math.min(totalPath, completedFrames * PITCH))
      if (writerSlot >= 0 && filmSlotReady[writerSlot]) {
        chargeThumbCtx.clearRect(0, 0, chargeThumbCanvas.width, chargeThumbCanvas.height)
        chargeThumbCtx.drawImage(filmSlotArt[writerSlot]!, 0, 0, chargeThumbCanvas.width, chargeThumbCanvas.height)
      } else {
        renderFrameContent(
          chargeThumbCtx,
          chargeThumbCanvas.width,
          chargeThumbCanvas.height,
          stableId(writerPathCell, off, filmDist),
          false,
        )
      }
      chargeThumbTex.needsUpdate = true
    }

    // ACT 3 — the projector strikes (a real lamp strike: flicker, then hold)
    {
      const ig = t < BOOT.proj ? 0 : Math.min(1, (t - BOOT.proj) / 0.6)
      const igf = ig * ignitionFlutter(t - BOOT.proj)
      // Let the ignition flare for a fraction of a second, then settle low
      // enough that the iris, housing and three output beams remain legible.
      const strike = ig < 1 ? 1 + (1 - ig) * 0.8 : 1
      // Once stable, two incommensurate low-frequency components give the
      // concealed vintage lamp a barely perceptible life. The modulation is
      // deliberately below flicker territory and never affects ignition.
      const lampBreath = ig >= 1
        ? 1 + 0.022 * Math.sin(Math.PI * 2 * 0.37 * t)
          + 0.01 * Math.sin(Math.PI * 2 * 0.53 * t + 1.7)
        : 1
      gateGlow.intensity = 2.3 * igf * strike * lampBreath
      headGlow.intensity = 2.15 * igf * strike * (1 + (lampBreath - 1) * 0.55)
      gateLipMat.emissiveIntensity = 0.008 + 0.034 * igf * lampBreath
      payoffTopRimMat.opacity = 0.032 * igf
      payoffLowerRimMat.opacity = 0.052 * igf
      if (gateFrameMat) gateFrameMat.opacity = 0.52 * igf * (1 + (lampBreath - 1) * 0.35)
    }

    // ACT 4 — one, two, three: each beam and its screen ignite in turn
    for (let i = 0; i < 3; i++) {
      const t0 = BOOT.beam0 + i * BOOT.beamGap
      const age = t - t0
      // Light establishes the route first, its landing field follows, and the
      // solid deliverable resolves last. All three remain monotone except the
      // shallow damped tremor in optical energy, and all settle inside the
      // existing 480ms handoff so the accepted one-two-three rhythm survives.
      const beamResolve = age < 0 ? 0 : minJerk(age / 0.3)
      const haloResolve = age < 0.04 ? 0 : minJerk((age - 0.04) / 0.44)
      const screenResolve = age < 0.08 ? 0 : minJerk((age - 0.08) / 0.4)
      const focusResolve = age < 0.06 ? 0 : minJerk((age - 0.06) / 0.42)
      const beamOn = beamResolve * ignitionFlutter(age, i * 0.17)
      beamMats[i]!.uniforms.uOn!.value = beamOn
      if (i === 1) blueBeamVeilMat.uniforms.uOn!.value = beamOn
      outputGlowMats[i]!.uniforms.uOn!.value = haloResolve * ignitionFlutter(age - 0.04, i * 0.17)
      const sm = screenMats[i]
      if (sm) sm.opacity = screenResolve
      screenResolveUniforms[i]!.uResolve.value = focusResolve
    }

    // The physical gate keeps the honest 16fps pull-down. Deterministic stills
    // use that exact held cell for every output. In motion, the finished
    // channel artifacts use the phase-locked 24fps projection head: it is
    // delayed by the same 32-frame transport and therefore agrees with the
    // gate at every mechanical boundary without inheriting its visible hold.
    {
      const occ = Math.floor((S_GATE - off) / PITCH)
      const id = stableId(occ, off, filmDist)
      if (id !== lastGateId) {
        lastGateId = id
        const slot = filmSlot(gatePathCell, filmFrame)
        const gateArt = movingMediaActive && filmSlotReady[slot]
          ? filmSlotArt[slot]!
          : frameArt(id, false)
        if (gateFrameCtx && gateFrameTex) {
          gateFrameCtx.clearRect(0, 0, 320, 180)
          gateFrameCtx.drawImage(gateArt, 0, 0, 320, 180)
          maskGateFrame()
          gateFrameTex.needsUpdate = true
        }
        lastGateSourceFrame = filmSlotReady[slot] ? filmSlotSourceFrames[slot]! : -1
        const expectedProjectionFrame = mediaFrameIndex(t - PROJECTION_DELAY_SECONDS)
        if (lastGateSourceFrame >= 0) {
          const frameCount = Math.round(SOURCE_DURATION * SOURCE_FPS)
          let frameError = lastGateSourceFrame - expectedProjectionFrame
          if (frameError > frameCount / 2) frameError -= frameCount
          if (frameError < -frameCount / 2) frameError += frameCount
          gateProjectionPhaseError = frameError
        }
        if (!movingMediaActive || projectionVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          for (const sc of screenCtxs) drawScreen(sc, id, false, wrapMediaTime(id / SOURCE_FPS))
        }
      }

      if (movingMediaActive
        && t >= BOOT.proj - 0.1
        && projectionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // currentTime is the recovery clock: it remains useful when a browser
        // deprioritizes callbacks for an off-DOM media element. rVFC still
        // measures actual decoded presentation, but it is never the sole
        // trigger for visible output updates.
        const sourceFrame = presentedMediaFrameIndex(projectionVideo.currentTime)
        if (sourceFrame !== lastProjectedVideoRevision) {
          if (Number.isFinite(lastProjectedVideoRevision)) {
            const frameCount = Math.round(SOURCE_DURATION * SOURCE_FPS)
            const advanced = (sourceFrame - lastProjectedVideoRevision + frameCount) % frameCount
            if (advanced > 1 && advanced < frameCount / 2) missedProjectionFrames += advanced - 1
          }
          lastProjectedVideoRevision = sourceFrame
          const mediaTime = projectionVideo.currentTime
          lastProjectionSourceFrame = sourceFrame
          for (const sc of screenCtxs) drawScreen(sc, sourceFrame, true, mediaTime)
          outputTextureRevision += 1
          const nowSeconds = performance.now() / 1000
          if (Number.isFinite(lastOutputTextureAt)) {
            longestOutputHold = Math.max(longestOutputHold, nowSeconds - lastOutputTextureAt)
          }
          lastOutputTextureAt = nowSeconds
          outputTextureTimes.push(nowSeconds)
          while (outputTextureTimes.length > 2 && nowSeconds - outputTextureTimes[0]! > 1.25) {
            outputTextureTimes.shift()
          }
        }
      }
      if (!firstBeamObserved && t >= BOOT.beam0) {
        firstBeamObserved = true
        if (Number.isFinite(lastOutputTextureAt)) {
          firstOutputTextureLatency = Math.abs(lastOutputTextureAt - (timelineStart + BOOT.beam0))
        }
      } else if (firstBeamObserved
        && !Number.isFinite(firstOutputTextureLatency)
        && Number.isFinite(lastOutputTextureAt)) {
        firstOutputTextureLatency = Math.max(0, lastOutputTextureAt - (timelineStart + BOOT.beam0))
      }
    }
  }

  const p95 = (values: number[]) => {
    if (!values.length) return 0
    values.sort((a, b) => a - b)
    return values[Math.min(values.length - 1, Math.floor(values.length * 0.95))]!
  }
  const inspectMotion = (t: number): Iso4MotionDiagnostics => {
    const dt = 1 / 60
    const samples = [new Float32Array(3), new Float32Array(3), new Float32Array(3), new Float32Array(3)]
    const projected = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
    const speeds: number[] = []
    const accelerations: number[] = []
    const jerks: number[] = []
    let maxTrailPx = 0
    let visibleParticles = 0
    let suspendedParticles = 0
    let funnelingParticles = 0
    let registeringParticles = 0
    let transferringParticles = 0
    let hornRadiusScaleTotal = 0
    let hornRadiusSamples = 0
    const rect = canvas.getBoundingClientRect()
    const toScreen = (source: Float32Array, target: THREE.Vector3) => {
      target.set(source[0]!, source[1]!, source[2]!).project(camera)
      target.set((target.x * 0.5 + 0.5) * rect.width, (-target.y * 0.5 + 0.5) * rect.height, 0)
    }
    for (const seed of bitsSeed) {
      const visible = samples.every((sample, i) => particleAt(seed, t - i * dt, sample, 0))
      const activeNow = particleAt(seed, t, samples[0]!, 0)
      if (activeNow && particleEnergy(seed, t) > 0.04) {
        visibleParticles += 1
        if (t < seed.startTime) {
          suspendedParticles += 1
        } else if (t <= seed.arrivalTime) {
          const q = THREE.MathUtils.clamp(
            (t - seed.startTime) / (seed.arrivalTime - seed.startTime),
            0,
            1,
          )
          if (q < PARTICLE_HORN_END) {
            funnelingParticles += 1
            const u = q / PARTICLE_HORN_END
            const u2 = u * u
            const u3 = u2 * u
            const u4 = u3 * u
            const u5 = u4 * u
            const s = minJerk(u) + 0.45 * (-4 * u3 + 7 * u4 - 3 * u5)
            hornRadiusScaleTotal += hornRadiusScaleAt(s)
            hornRadiusSamples += 1
          } else {
            registeringParticles += 1
          }
        } else {
          transferringParticles += 1
        }
      }
      if (!visible) continue
      for (let i = 0; i < 4; i++) toScreen(samples[i]!, projected[i]!)
      const p0 = projected[0]!
      const p1 = projected[1]!
      const p2 = projected[2]!
      const p3 = projected[3]!
      speeds.push(p0.distanceTo(p1))
      accelerations.push(Math.hypot(p0.x - 2 * p1.x + p2.x, p0.y - 2 * p1.y + p2.y))
      jerks.push(Math.hypot(p0.x - 3 * p1.x + 3 * p2.x - p3.x, p0.y - 3 * p1.y + 3 * p2.y - p3.y))
      const trailSample = new Float32Array(3)
      if (particleAt(seed, t - PARTICLE_SHUTTER_SECONDS, trailSample, 0)) {
        const trailPoint = new THREE.Vector3()
        toScreen(trailSample, trailPoint)
        const q = (t - seed.startTime) / (seed.arrivalTime - seed.startTime)
        const trailEnvelope = q < PARTICLE_HORN_END
          ? minJerk((q - 0.48) / 0.14)
            * (1 - minJerk((q - (PARTICLE_HORN_END - 0.1)) / 0.1))
          : 0
        maxTrailPx = Math.max(maxTrailPx, p0.distanceTo(trailPoint) * trailEnvelope)
      }
    }
    const fileDissolve = THREE.MathUtils.clamp(
      (t - FILE_CONTACT_AT) / FILE_TRANSIT_SECONDS,
      0,
      1,
    )
    const yawDegrees = THREE.MathUtils.radToDeg(apparatusYawAt(t))
    const yawSpeedDegrees = THREE.MathUtils.radToDeg(
      (apparatusYawAt(t + dt) - apparatusYawAt(t - dt)) / (2 * dt),
    )
    const tidy = (n: number) => Number(n.toFixed(3))
    return {
      t: tidy(t),
      visibleParticles,
      suspendedParticles,
      funnelingParticles,
      registeringParticles,
      transferringParticles,
      writtenFrames: writtenFramesAt(t),
      fileDissolve: tidy(fileDissolve),
      p95SpeedPxPerFrame: tidy(p95(speeds)),
      p95AccelerationPxPerFrame2: tidy(p95(accelerations)),
      p95JerkPxPerFrame3: tidy(p95(jerks)),
      maxTrailPx: tidy(maxTrailPx),
      meanHornRadiusScale: tidy(hornRadiusSamples ? hornRadiusScaleTotal / hornRadiusSamples : 0),
      hornTurnDegrees: tidy(PARTICLE_HORN_TURNS * 360),
      transportFramesPerSecond: tidy(transportSpeed(t) / PITCH),
      reelTangentFramesPerSecond: tidy(reelDriveSpeed(t) / PITCH),
      reelAngleRadians: tidy(-reelDriveDistance(t) / coilR),
      apparatusYawDegrees: tidy(yawDegrees),
      apparatusYawSpeedDegreesPerSecond: tidy(yawSpeedDegrees),
      finalWriteAt: tidy(timeForFrame(FRAME_GROUPS)),
      projectorStrikeAt: BOOT.proj,
    }
  }

  const rollingRate = (times: number[]) => {
    if (times.length < 2) return 0
    const span = times[times.length - 1]! - times[0]!
    return span > 0 ? (times.length - 1) / span : 0
  }
  const inspectTemporal = (): Iso4TemporalDiagnostics => {
    const nowSeconds = performance.now() / 1000
    const currentHold = Number.isFinite(lastOutputTextureAt) ? nowSeconds - lastOutputTextureAt : 0
    const framePhase = transportDist(elapsed) / PITCH
    const tidy = (n: number) => Number(n.toFixed(3))
    return {
      timelineSeconds: tidy(elapsed),
      sourceVideoTimeSeconds: tidy(episodeVideo.currentTime || 0),
      projectionVideoTimeSeconds: tidy(projectionVideo.currentTime || 0),
      expectedProjectionVideoTimeSeconds: tidy(wrapMediaTime(elapsed - PROJECTION_DELAY_SECONDS)),
      sourceClockDriftMs: tidy(sourceClockDrift * 1000),
      projectionClockDriftMs: tidy(projectionClockDrift * 1000),
      presentedVideoFramesPerSecond: tidy(rollingRate(projectionPresentationTimes)),
      presentedVideoFrameRevision: projectionPresentedRevision,
      presentedVideoMediaTimeSeconds: tidy(projectionPresentedMediaTime),
      outputTextureFramesPerSecond: tidy(rollingRate(outputTextureTimes)),
      renderFramesPerSecond: tidy(rollingRate(renderFrameTimes)),
      firstOutputTextureLatencyMs: Number.isFinite(firstOutputTextureLatency)
        ? tidy(firstOutputTextureLatency * 1000)
        : -1,
      longestOutputHoldMs: tidy(Math.max(longestOutputHold, currentHold) * 1000),
      outputTextureRevision,
      missedProjectionFrames,
      mechanicalGateTick: quantizedFrame(framePhase),
      mechanicalGateFramesPerSecond: tidy(transportSpeed(elapsed) / PITCH),
      missedMechanicalTicks,
      sourceFramesPerSecond: SOURCE_FPS,
      projectionDelaySeconds: PROJECTION_DELAY_SECONDS,
      gateSourceFrame: lastGateSourceFrame,
      projectionSourceFrame: lastProjectionSourceFrame,
      gateProjectionPhaseErrorFrames: gateProjectionPhaseError,
      movingMediaPlaying,
      usingDeterministicFallback: !useMovingMedia,
    }
  }

  let shadowTick = 0
  function draw(t: number) {
    update(t)
    if ((shadowTick++ & 1) === 0) renderer.shadowMap.needsUpdate = true
    composer.render()
    const nowSeconds = performance.now() / 1000
    renderFrameTimes.push(nowSeconds)
    while (renderFrameTimes.length > 2 && nowSeconds - renderFrameTimes[0]! > 1.25) {
      renderFrameTimes.shift()
    }
  }

  let raf = 0
  let running = false
  let elapsed = 0
  let timelineStart = 0
  const loop = (now: number) => {
    elapsed = now / 1000 - timelineStart
    draw(elapsed)
    raf = requestAnimationFrame(loop)
  }

  return {
    start() {
      if (running) return
      const canResumeLiveHistory = useMovingMedia
        && hasLiveMediaHistory
        && Number.isFinite(lastFilmFrame)
        && Number.isFinite(lastWrittenFrame)
      const lateWithoutLiveHistory = elapsed >= BOOT.run && !canResumeLiveHistory
      running = true
      useMovingMedia = !lateWithoutLiveHistory
      movingMediaPlaying = false
      temporalMediaResetRequested = !canResumeLiveHistory
      if (!canResumeLiveHistory && !lateWithoutLiveHistory) {
        lastFilmFrame = Number.NaN
        lastWrittenFrame = Number.NaN
        lastGateId = Number.NaN
        lastProjectedVideoRevision = Number.NaN
      }
      lastOutputTextureAt = Number.NaN
      firstOutputTextureLatency = Number.NaN
      firstBeamObserved = false
      longestOutputHold = 0
      outputTextureRevision = 0
      missedProjectionFrames = 0
      missedMechanicalTicks = 0
      projectionPresentedRevision = 0
      projectionPresentedMediaTime = 0
      projectionPresentationTimes.length = 0
      outputTextureTimes.length = 0
      renderFrameTimes.length = 0
      timelineStart = performance.now() / 1000 - elapsed
      if (lateWithoutLiveHistory) enterDeterministicMediaFallback()
      else resumeEpisodeMedia(elapsed)
      raf = requestAnimationFrame(loop)
    },
    stop() {
      if (running) elapsed = performance.now() / 1000 - timelineStart
      running = false
      movingMediaPlaying = false
      mediaPlayAttempt += 1
      episodeVideo.pause()
      projectionVideo.pause()
      cancelProjectionFrame()
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    still(t: number = STILL_T) {
      this.stop()
      useMovingMedia = false
      hasLiveMediaHistory = false
      temporalMediaResetRequested = true
      lastFilmFrame = Number.NaN
      lastWrittenFrame = Number.NaN
      lastGateId = Number.NaN
      lastProjectedVideoRevision = Number.NaN
      elapsed = t
      layout()
      draw(t)
    },
    inspect(t: number) {
      return inspectMotion(t)
    },
    temporal() {
      return inspectTemporal()
    },
    resize() {
      layout()
      if (!running) draw(elapsed)
    },
    destroy() {
      this.stop()
      episodeVideo.removeAttribute('src')
      episodeVideo.load()
      projectionVideo.removeAttribute('src')
      projectionVideo.load()
      renderer.dispose()
    },
  }
}
