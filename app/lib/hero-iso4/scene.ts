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
 * This module is loaded through the client-only hero wrapper. The wrapper is
 * used by the homepage and may also be mounted by the diagnostic lab route;
 * keeping the dynamic import preserves a lazy client chunk in both contexts.
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
  configure(options: Partial<Iso4WorkshopOptions>): void
  sourceReady(): boolean
  inspect(t: number): Iso4MotionDiagnostics
  temporal(): Iso4TemporalDiagnostics
  resize(): void
  destroy(): void
}

export type Iso4ColorScript = 'archival-warm' | 'spectral-pearl' | 'bichromatic-field'
export type Iso4SamplingStrategy = 'uniform' | 'importance' | 'hybrid'

export interface Iso4WorkshopOptions {
  fragmentsPerPacket: 3 | 6 | 9
  colorScript: Iso4ColorScript
  samplingStrategy: Iso4SamplingStrategy
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
  p50SpeedPxPerFrame: number
  p95SpeedPxPerFrame: number
  p50AccelerationPxPerFrame2: number
  p95AccelerationPxPerFrame2: number
  p50JerkPxPerFrame3: number
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
  logicalPackets: number
  configuredVisibleFragments: number
  visibleMicrofragments: number
  fragmentsPerPacket: number
  fragmentsPerFilmCell: number
  colorScript: Iso4ColorScript
  samplingStrategy: Iso4SamplingStrategy
  sourceColorCoverage: number
  sourceToCloudOklabDistance: number
  projectedAreaVsSleeve: number
  integratedLuminanceVsSleeve: number
  cloudHollowCenterRatio: number
  screenDensityP50: number
  screenDensityP95: number
  packetCohesionPx: number
  packetCohesionAtHorn55Px: number
  packetCohesionAtHorn90Px: number
  registrationArrivalSpreadMs: number
  particleEnergy: number
  thumbnailEnergy: number
  energyBalanceError: number
  impactToDevelopmentMs: number
  terminalOutputs: number
  copyCollisions: number
  ctaCollisions: number
  viewportCollisions: number
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
  gateProjectionPhaseContractActive: boolean
  freshGateExpectedTimelineErrorFrames: number
  maxFreshGateExpectedTimelineErrorFrames: number
  freshGatePresentedFrameErrorFrames: number
  maxFreshGatePresentedFrameErrorFrames: number
  // Observational only after a developed physical cell begins recirculating.
  // A 36-cell/16fps loop and a 108-frame/24fps source have different periods.
  gateProjectionPhaseErrorFrames: number
  movingMediaPlaying: boolean
  terminalMediaPaused: boolean
  settledOutputTextures: number
  usingDeterministicFallback: boolean
  updateWallTimeP50Ms: number
  updateWallTimeP95Ms: number
  renderWallTimeP50Ms: number
  renderWallTimeP95Ms: number
  filmTexturePrepP95Ms: number
  outputTexturePrepP95Ms: number
  qualityFallbackActive: boolean
  rendererDprCap: number
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
const LOGICAL_PACKETS = FRAME_GROUPS * PARTICLES_PER_FRAME
const MAX_FRAGMENTS_PER_PACKET = 9
const MAX_VISIBLE_FRAGMENTS = LOGICAL_PACKETS * MAX_FRAGMENTS_PER_PACKET
const DEFAULT_WORKSHOP_OPTIONS: Iso4WorkshopOptions = {
  fragmentsPerPacket: 6,
  colorScript: 'spectral-pearl',
  samplingStrategy: 'hybrid',
}
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
const SOURCE_DURATION = 288 / SOURCE_FPS
// When live decoding is unavailable, keep the physical carrier honest without
// turning its tiny frames into a 16fps edit-point strobe. Four-cell takes make
// the actual Mike & John coverage change at the same accelerating transport
// cadence while remaining readable at the gate (up to 4 editorial changes/s).
const FALLBACK_TAKE_CELLS = 4
// Clip-local word clock. The Episode 1 excerpt is played at 0.70x and phased
// so "I am my own marketing asset" begins after the LinkedIn portrait has
// resolved into focus.
const LINKEDIN_CAPTION_LINES: ReadonlyArray<ReadonlyArray<{
  text: string
  start: number
}>> = [
  [
    { text: 'I', start: 7 },
    { text: 'AM', start: 7.137 },
  ],
  [
    { text: 'MY', start: 7.573 },
    { text: 'OWN', start: 7.801 },
  ],
  [
    { text: 'MARKETING', start: 8.489 },
  ],
  [
    { text: 'ASSET', start: 9.176 },
  ],
]
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
const STILL_T = 13.9
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
// The digital artifacts receive one readable passage, then resolve in the same
// one-two-three grammar as their arrival. Put the third artifact materially
// into its dissolve before the 12-second projection head can wrap: the
// homepage should end on proof, not expose a podcast-waveform loop seam.
const OUTPUT_TERMINAL_BASE = BOOT.beam0 + 4.4
const OUTPUT_TERMINAL_GAP = 0.3
const OUTPUT_TERMINAL_DURATION = 0.76
const OUTPUT_TERMINAL_COMPLETE = OUTPUT_TERMINAL_BASE
  + OUTPUT_TERMINAL_GAP * 2
  + OUTPUT_TERMINAL_DURATION
// The third receipt starts at 12.87s. Give the projector a perceptible coast
// after that final result appears, then stop the shared film/reel drive on an
// exact 16fps cell boundary. With the accepted ramp, 13.00s -> 13.85s carries
// frame phase 132.2 -> 139.0: the last pull finishes cleanly with no snap.
const TERMINAL_COAST_START = OUTPUT_TERMINAL_BASE + OUTPUT_TERMINAL_GAP * 2 + 0.13
const TERMINAL_COAST_DURATION = 0.85
const TERMINAL_STOP_AT = TERMINAL_COAST_START + TERMINAL_COAST_DURATION
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
const outputTerminalProgressAt = (t: number, index: number) => minJerk(
  (t - (OUTPUT_TERMINAL_BASE + index * OUTPUT_TERMINAL_GAP)) / OUTPUT_TERMINAL_DURATION,
)
const outputTerminalSmokeAt = (t: number, index: number) => {
  const q = THREE.MathUtils.clamp(
    (t - (OUTPUT_TERMINAL_BASE + index * OUTPUT_TERMINAL_GAP)) / OUTPUT_TERMINAL_DURATION,
    0,
    1,
  )
  return Math.pow(Math.sin(Math.PI * q), 1.35)
}
const uncoastedTransportDist = (t: number) => {
  if (t <= BOOT.run) return 0
  const u = t - BOOT.run
  return FILM_SPEED * (u < BOOT.runRamp ? (u * u) / (2 * BOOT.runRamp) : u - BOOT.runRamp / 2)
}
const terminalCoastDistance = (q: number) => {
  const x = THREE.MathUtils.clamp(q, 0, 1)
  // Integral of 1 - minJerk(x). It reaches exactly 0.5 at x=1.
  return x - (2.5 * x ** 4 - 3 * x ** 5 + x ** 6)
}
const transportDist = (t: number) => {
  if (t <= TERMINAL_COAST_START) return uncoastedTransportDist(t)
  const q = (t - TERMINAL_COAST_START) / TERMINAL_COAST_DURATION
  return uncoastedTransportDist(TERMINAL_COAST_START)
    + FILM_SPEED * TERMINAL_COAST_DURATION * terminalCoastDistance(q)
}
const transportSpeed = (t: number) => {
  if (t <= BOOT.run) return 0
  const u = t - BOOT.run
  const runningSpeed = FILM_SPEED * (u < BOOT.runRamp ? u / BOOT.runRamp : 1)
  if (t <= TERMINAL_COAST_START) return runningSpeed
  return runningSpeed * (1 - minJerk((t - TERMINAL_COAST_START) / TERMINAL_COAST_DURATION))
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
// 24fps, delayed by the physical writer-to-gate travel. Freshly written cells
// rendezvous with it on their first gate pass during the projection payoff;
// after that, the finite physical loop recirculates while the finished digital
// artifacts remain fluid on their longer source clock.
const PROJECTION_DELAY_SECONDS = WRITER_TO_GATE_FRAMES / FILM_FPS
// The decoded projection frame reaches requestVideoFrameCallback one native
// frame after currentTime is assigned on cold Chrome/Metal starts. Prime that
// presentation latency once, after both play() promises settle, so the frame
// actually shown—not merely the media clock property—retains the 2s physical
// writer-to-gate phase contract.
const PROJECTION_PRESENTATION_LEAD_SECONDS = 1 / SOURCE_FPS

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
  const gl = renderer.getContext()
  const debugRendererInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const rendererIdentity = String(debugRendererInfo
    ? gl.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER))
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(rendererIdentity)
  const rendererDprCap = softwareRenderer ? 1 : 2
  let detailScale = 1
  let panoramicFit = 0
  let mobileLayout = false
  let workshopOptions: Iso4WorkshopOptions = {
    ...DEFAULT_WORKSHOP_OPTIONS,
    fragmentsPerPacket: softwareRenderer ? 3 : DEFAULT_WORKSHOP_OPTIONS.fragmentsPerPacket,
  }
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
    const pr = Math.min(window.devicePixelRatio || 1, rendererDprCap)
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
  filmTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  filmTex.wrapS = THREE.RepeatWrapping

  // The public homepage already carries the real Mike & John Episode 1
  // coverage. Reuse it here instead of manufacturing look-alike faces. The
  // renderer can paint its abstract fallback immediately, then naturally
  // replaces it on the next 16fps gate tick as each small JPEG arrives.
  let episodeMediaRevision = 0
  let useMovingMedia = true
  let movingMediaPlaying = false
  let hasLiveMediaHistory = false
  let terminalMediaPaused = false
  let mediaPlayAttempt = 0
  let temporalMediaResetRequested = true
  let refreshBootFileLabel: (() => void) | undefined
  let refreshStaticOutput: (() => void) | undefined
  const episodeFrames = EPISODE_FRAME_URLS.map((src) => {
    const image = new Image()
    image.decoding = 'async'
    image.addEventListener('load', () => {
      episodeMediaRevision += 1
      refreshBootFileLabel?.()
      refreshStaticOutput?.()
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
  const captionWords = LINKEDIN_CAPTION_LINES.flat()
  // Preserve the source clock while giving very short function words enough
  // screen time for the 160ms Active Word settle to register. This only
  // affects adjacent hits closer than 200ms; later source starts rejoin their
  // exact timing instead of accumulating editorial drift.
  const CAPTION_MIN_ACTIVE_SECONDS = 0.2
  const captionHighlightStarts: number[] = []
  captionWords.forEach((word, index) => {
    const previous = index > 0 ? captionHighlightStarts[index - 1]! : Number.NEGATIVE_INFINITY
    captionHighlightStarts.push(Math.max(word.start, previous + CAPTION_MIN_ACTIVE_SECONDS))
  })
  const captionReleaseAt = Math.max(
    captionWords.at(-1)!.start + 0.72,
    captionHighlightStarts.at(-1)! + 0.56,
  )
  const activeCaptionWordIndex = (mediaTimeSeconds: number) => {
    const time = wrapMediaTime(mediaTimeSeconds)
    if (time < captionHighlightStarts[0]! || time >= captionReleaseAt) return -1
    let index = 0
    for (let i = 1; i < captionHighlightStarts.length; i++) {
      if (time >= captionHighlightStarts[i]!) index = i
    }
    return index
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
    terminalMediaPaused = false
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
      // play() negotiation advances each decoder independently. Re-anchor
      // both heads to this same settled timeline instant before exposing live
      // media to the writer; otherwise a cold start can preserve roughly two
      // frames of relative startup skew even though both promises resolved.
      syncMediaClocks(elapsed, true)
      projectionVideo.currentTime = wrapMediaTime(
        elapsed - PROJECTION_DELAY_SECONDS + PROJECTION_PRESENTATION_LEAD_SECONDS,
      )
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
      if (running && useMovingMedia && !terminalMediaPaused) resumeEpisodeMedia(elapsed)
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
    const variant = ((Math.floor(id / FALLBACK_TAKE_CELLS) % 4) + 4) % 4
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
      // Keep the photographic cell distinct from the neutral carrier. A very
      // small archival bias still seats the webcam source in the mechanism,
      // but the previous sepia/desaturation made every exposed frame inherit
      // the stock's ochre edge and cost the real footage useful colour detail.
      g2.filter = 'sepia(0.06) saturate(0.84) contrast(1.12) brightness(0.84)'
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
  const filmSlotWriteOrdinals = new Int16Array(FRAME_GROUPS)
  filmSlotWriteOrdinals.fill(-1)
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
    filmSlotWriteOrdinals[slot] = transportFrame
    filmSlotSourceFrames[slot] = episodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ? presentedMediaFrameIndex(episodeVideo.currentTime)
      : -1
    return slot
  }

  function drawFilm(dist: number, chargedDistance: number) {
    const sToPx = FILM_TEX_W / totalPath
    const off = dist % PITCH
    // Neutral graphite carrier keeps the physical strip crisp and lets the
    // developed source image, not a mustard base coat, own the chroma.
    fctx.fillStyle = '#191b1d'
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
        // Decoder activity controls new sampling, never ownership of a cell
        // that has already been physically exposed. Terminal media pause must
        // not repaint persistent live slots with deterministic fallback art.
        const art = filmSlotReady[slot]
          ? filmSlotArt[slot]!
          : frameArt(id, false)
        fctx.drawImage(art, 0, 0, vH, uH)
      } else {
        fctx.fillStyle = '#101214'
        fctx.fillRect(0, 0, vH, uH)
      }
      fctx.strokeStyle = 'rgba(190,202,212,0.13)'
      fctx.lineWidth = 1.5
      fctx.strokeRect(2, 2, vH - 4, uH - 4)
      fctx.restore()
    }
    // One continuous neutral edge catch makes the stock read as the same
    // material before, through, and after the writer. Local writer light can
    // now sit on top without creating a hard yellow-edged section.
    const stockEdge = fctx.createLinearGradient(0, 0, 0, FILM_TEX_H)
    stockEdge.addColorStop(0, 'rgba(190,201,211,0.28)')
    stockEdge.addColorStop(0.055, 'rgba(155,166,176,0.105)')
    stockEdge.addColorStop(0.15, 'rgba(155,166,176,0)')
    stockEdge.addColorStop(0.85, 'rgba(155,166,176,0)')
    stockEdge.addColorStop(0.945, 'rgba(155,166,176,0.105)')
    stockEdge.addColorStop(1, 'rgba(190,201,211,0.28)')
    fctx.fillStyle = stockEdge
    fctx.fillRect(0, 0, FILM_TEX_W, FILM_TEX_H)
    // Edge codes stay frame-accurate, but recede like photographic metadata
    // rather than becoming a yellow decorative rail.
    fctx.fillStyle = 'rgba(190,200,208,0.28)'
    fctx.font = '600 9px ui-monospace, monospace'
    for (let i = 0; i * PITCH < totalPath + PITCH; i++) {
      const s0 = i * PITCH + off
      if (s0 < 0 || s0 >= totalPath) continue
      const id = stableId(i, off, dist)
      const tc = 'TC ' + String(14 + ((id * 7) % 45)).padStart(2, '0') + ':' + String((id * 13) % 60).padStart(2, '0') + ':' + String((id * 29) % 24).padStart(2, '0')
      fctx.fillText(tc, (s0 + 0.12) * sToPx, FILM_TEX_H * 0.052)
    }
    // perf rows over everything, both edges, four per frame
    fctx.fillStyle = '#080a0c'
    fctx.strokeStyle = 'rgba(177,188,198,0.14)'
    fctx.lineWidth = 0.85
    const perfPitch = PITCH / 4
    for (let sp = off % perfPitch; sp < totalPath; sp += perfPitch) {
      for (const vv of [0.075, 0.925]) {
        fctx.beginPath()
        fctx.roundRect(sp * sToPx - 3.4, vv * FILM_TEX_H - 4.4, 6.8, 8.8, 2)
        fctx.fill()
        fctx.stroke()
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
    const filmMat = new THREE.MeshStandardMaterial({
      map: filmTex,
      roughness: 0.74,
      metalness: 0.025,
      envMapIntensity: 0.42,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
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
    // The decoded image belongs to the physical cell held in the descending
    // carrier. The old lens-plane placement sat 0.35 world units in front of
    // the stock; under the homepage camera that parallax read as a horizontal
    // strip protruding beyond the reel. A hairline optical offset prevents
    // z-fighting while keeping the picture registered inside the film edges.
    gateFrame.position.set(DESCENT_X + 0.018, lampY, 0)
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
    color: 0x25282c,
    emissive: 0xbcc7d2,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    roughness: 0.38,
    metalness: 0.24,
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
    uWriterContactColor: { value: new THREE.Color(1, 0.39, 0.24) },
  }
  chargeThumbMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWriterBuild = chargeThumbUniforms.uWriterBuild
    shader.uniforms.uWriterImpact = chargeThumbUniforms.uWriterImpact
    shader.uniforms.uWriterCharge = chargeThumbUniforms.uWriterCharge
    shader.uniforms.uWriterContactColor = chargeThumbUniforms.uWriterContactColor
    shader.fragmentShader = `
      uniform float uWriterBuild;
      uniform float uWriterImpact;
      uniform float uWriterCharge;
      uniform vec3 uWriterContactColor;
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
          vec3 writerWarm = mix(vec3(1.0, 0.43, 0.32), uWriterContactColor, 0.52);
          sampledDiffuseColor.rgb *= 0.035 + 0.965 * imagePresence;
          sampledDiffuseColor.rgb += writerWarm * (
            reconstructionFront * 0.16
            + anchorGlow * uWriterImpact * 0.20
            + uWriterCharge * assembled * 0.018
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
  const writerCatchAlphaCanvas = document.createElement('canvas')
  writerCatchAlphaCanvas.width = 4
  writerCatchAlphaCanvas.height = 128
  const writerCatchAlphaCtx = writerCatchAlphaCanvas.getContext('2d')!
  const writerCatchAlphaGradient = writerCatchAlphaCtx.createLinearGradient(0, 0, 0, 128)
  writerCatchAlphaGradient.addColorStop(0, '#000')
  writerCatchAlphaGradient.addColorStop(0.18, '#5b5b5b')
  writerCatchAlphaGradient.addColorStop(0.5, '#fff')
  writerCatchAlphaGradient.addColorStop(0.82, '#5b5b5b')
  writerCatchAlphaGradient.addColorStop(1, '#000')
  writerCatchAlphaCtx.fillStyle = writerCatchAlphaGradient
  writerCatchAlphaCtx.fillRect(0, 0, 4, 128)
  const writerCatchAlpha = new THREE.CanvasTexture(writerCatchAlphaCanvas)
  const writerStockCatchMat = new THREE.MeshBasicMaterial({
    color: 0xb5bec7,
    alphaMap: writerCatchAlpha,
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const writerPerfCatchMats: THREE.MeshBasicMaterial[] = []
  const writerStockCatchX = CHARGE_POINT.x + 0.028
  const writerStockSpan = PITCH * 4.5
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
  for (let i = -9; i <= 9; i++) {
    const taper = Math.pow(Math.max(0, 1 - Math.abs(i) / 10), 1.7)
    const perfMat = writerStockCatchMat.clone()
    perfMat.alphaMap = null
    perfMat.opacity = 0.018 + taper * 0.045
    writerPerfCatchMats.push(perfMat)
    for (const z of [-perfZ, perfZ]) {
      const perf = new THREE.Mesh(perfCatchGeometry, perfMat)
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
  // mark. `sequence` is deliberately independent of array/spatial order: the
  // eye travels clockwise from the high YouTube card to the right-hand
  // transcript and then the lower-left LinkedIn portrait, without moving any
  // artifact or breaking its array-owned optical treatment.
  const FAN = [
    // Rear anchor, foreground phone, middle-depth transcript: a shallow
    // triangular constellation with three clean silhouettes on a phone.
    { icon: 'yt', sequence: 0, color: '#d63d47', x: 24.9, w: 4.05, h: 2.28, y: 4.8, z: 0.12, cone: 0.94, tilt: -0.022 },
    { icon: 'in', sequence: 2, color: '#3d78ae', x: 27.2, w: 1.5, h: 3.06, y: 0.35, z: 3.15, cone: 0.62, tilt: -0.045 },
    { icon: 'pod', sequence: 1, color: '#d9a25c', x: 25.9, w: 3.05, h: 1.98, y: -1.85, z: 0.25, cone: 0.82, tilt: 0.028 },
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
  // travel. A fresh cell agrees on its first gate pass during the payoff;
  // later physical recirculation does not seek the finished export backward.
  const screenCtxs: {
    c: HTMLCanvasElement
    x: CanvasRenderingContext2D
    tex: THREE.CanvasTexture
    d: (typeof FAN)[number]
    rasterScale: number
    terminalSettled: boolean
  }[] = []
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
  const drawTrackedText = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    text: string,
    y: number,
    font: string,
    tracking: number,
    color: string,
    alpha: number,
    underprint?: { color: string, width: number },
  ) => {
    ctx.save()
    ctx.font = font
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.globalAlpha = alpha
    const glyphs = [...text]
    const widths = glyphs.map((glyph) => ctx.measureText(glyph).width)
    const total = widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, glyphs.length - 1)
    let cursor = (canvasWidth - total) / 2
    glyphs.forEach((glyph, index) => {
      if (underprint) {
        ctx.strokeStyle = underprint.color
        ctx.lineWidth = underprint.width
        ctx.lineJoin = 'round'
        ctx.strokeText(glyph, cursor, y)
      }
      ctx.fillText(glyph, cursor, y)
      cursor += widths[index]! + tracking
    })
    ctx.restore()
  }
  const drawPlatformMark = (
    ctx: CanvasRenderingContext2D,
    icon: (typeof FAN)[number]['icon'],
    cx: number,
    cy: number,
    size: number,
    alpha: number,
  ) => {
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = alpha
    if (icon === 'yt') {
      const w = size * 1.5
      const h = size
      ctx.fillStyle = '#d94a52'
      ctx.beginPath()
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.24)
      ctx.fill()
      ctx.fillStyle = '#ecece7'
      ctx.beginPath()
      ctx.moveTo(cx - size * 0.1, cy - size * 0.25)
      ctx.lineTo(cx + size * 0.25, cy)
      ctx.lineTo(cx - size * 0.1, cy + size * 0.25)
      ctx.closePath()
      ctx.fill()
    } else if (icon === 'in') {
      const side = size * 1.04
      ctx.fillStyle = '#397db8'
      ctx.beginPath()
      ctx.roundRect(cx - side / 2, cy - side / 2, side, side, side * 0.14)
      ctx.fill()
      ctx.fillStyle = '#ecece7'
      ctx.font = `800 ${Math.round(size * 0.62)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('in', cx, cy + size * 0.035)
    } else {
      // An open RSS glyph reads more crisply than a tiny microphone and names
      // the actual terminal deliverable without inventing a podcast platform.
      const ox = cx - size * 0.28
      const oy = cy + size * 0.28
      ctx.fillStyle = '#d9a25c'
      ctx.beginPath()
      ctx.arc(ox, oy, size * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#d9a25c'
      ctx.lineCap = 'round'
      ctx.lineWidth = Math.max(2, size * 0.1)
      for (const radius of [size * 0.34, size * 0.62]) {
        ctx.beginPath()
        ctx.arc(ox, oy, radius, -Math.PI / 2, 0)
        ctx.stroke()
      }
    }
    ctx.restore()
  }
  const drawNoirReceipt = (
    sc: (typeof screenCtxs)[number],
    terminalProgress: number,
  ) => {
    if (terminalProgress <= 0) return
    const { x, d, c, rasterScale } = sc
    const W2 = c.width / rasterScale
    const H2 = c.height / rasterScale
    const p = THREE.MathUtils.clamp(terminalProgress, 0, 1)
    const receipt = minJerk((p - 0.18) / 0.82)
    const compact = d.icon === 'in'
    // The portrait card is the smallest and most steeply foreshortened print.
    // Develop its identifying logo and primary outcome before the secondary
    // copy so the card never passes through a dark, semantically inverted
    // state. This is a denser silver layer, not a glow: it remains crisp and
    // motionless once the print settles.
    const primaryReceipt = compact ? minJerk((p - 0.04) / 0.64) : receipt
    const plate = d.icon === 'yt'
      ? { number: '01', lead: 'PUBLISHED', name: 'TO YOUTUBE', detail: 'FULL EPISODE' }
      : d.icon === 'in'
        ? { number: '02', lead: 'PUBLISHED', name: 'TO LINKEDIN', detail: 'PORTRAIT CLIP' }
        : { number: '03', lead: 'TRANSCRIPT', name: 'READY', detail: 'PODCAST / RSS' }

    x.save()
    x.globalCompositeOperation = 'source-over'
    // Retain a photographic trace under the title card. The final print sits
    // above the page black at a silver-gelatin D-min rather than collapsing
    // into it: separation comes from the material plane, not inflated type or
    // a reintroduced projector halo.
    x.fillStyle = `rgba(24,27,32,${0.985 * p})`
    x.fillRect(0, 0, W2, H2)
    const printSheen = x.createLinearGradient(0, 0, W2, H2)
    printSheen.addColorStop(0, `rgba(82,85,88,${0.17 * receipt})`)
    printSheen.addColorStop(0.42, `rgba(38,42,46,${0.1 * receipt})`)
    printSheen.addColorStop(1, `rgba(2,3,5,${0.18 * receipt})`)
    x.fillStyle = printSheen
    x.fillRect(0, 0, W2, H2)
    const vignette = x.createRadialGradient(W2 * 0.46, H2 * 0.43, 0, W2 * 0.5, H2 * 0.5, Math.max(W2, H2) * 0.74)
    vignette.addColorStop(0, `rgba(30,32,34,${0.1 * receipt})`)
    vignette.addColorStop(0.68, `rgba(6,8,10,${0.08 * receipt})`)
    vignette.addColorStop(1, `rgba(0,0,0,${0.26 * receipt})`)
    x.fillStyle = vignette
    x.fillRect(0, 0, W2, H2)

    // One sub-pixel print edge is enough to disclose the object under reduced
    // brightness. It is neutral and continuous, avoiding the harsh channel-
    // colored activation edge that made the live film transition feel cut.
    x.globalAlpha = 0.19 * receipt
    x.strokeStyle = 'rgb(157,162,164)'
    x.lineWidth = compact ? 0.8 : 1
    x.strokeRect(0.5, 0.5, W2 - 1, H2 - 1)

    const inset = compact ? 22 : 24
    // Four open corners suggest a crop/registration frame without enclosing
    // the result inside another UI card.
    const corner = (cx: number, cy: number, sx: number, sy: number) => {
      const length = compact ? 12 : 18
      x.beginPath()
      x.moveTo(cx, cy + sy * length)
      x.lineTo(cx, cy)
      x.lineTo(cx + sx * length, cy)
      x.stroke()
    }
    x.globalAlpha = 0.28 * receipt
    x.strokeStyle = 'rgb(196,199,195)'
    x.lineWidth = compact ? 1 : 1.15
    corner(inset, inset, 1, 1)
    corner(W2 - inset, inset, -1, 1)
    corner(inset, H2 - inset, 1, -1)
    corner(W2 - inset, H2 - inset, -1, -1)
    x.globalAlpha = 0.62 * receipt
    x.strokeStyle = d.color
    x.lineWidth = compact ? 2 : 2.5
    x.beginPath()
    x.moveTo(inset, inset)
    x.lineTo(inset + (compact ? 42 : 72), inset)
    x.stroke()

    // Restrained registration crosses make the state feel optically printed,
    // while staying far away from a modern toast/checkmark vocabulary.
    const cross = (cx: number, cy: number, size: number) => {
      x.beginPath()
      x.moveTo(cx - size, cy)
      x.lineTo(cx + size, cy)
      x.moveTo(cx, cy - size)
      x.lineTo(cx, cy + size)
      x.stroke()
    }
    x.globalAlpha = 0.32 * receipt
    x.strokeStyle = 'rgb(204,205,201)'
    x.lineWidth = 1
    cross(inset, H2 - inset, compact ? 5 : 7)
    cross(W2 - inset, inset, compact ? 5 : 7)

    // A static, deterministic silver-grain field gives the arrested frame a
    // contact-print surface without introducing continuing sparkle or motion.
    x.fillStyle = 'rgb(220,220,214)'
    for (let grain = 0; grain < 54; grain++) {
      const gx = ((grain * 73 + plate.number.charCodeAt(0) * 19) % 997) / 997 * W2
      const gy = ((grain * 151 + plate.number.charCodeAt(1) * 31) % 991) / 991 * H2
      x.globalAlpha = (0.012 + (grain % 5) * 0.004) * receipt
      const grainSize = grain % 7 === 0 ? 1.3 : 0.7
      x.fillRect(gx, gy, grainSize, grainSize)
    }

    drawPlatformMark(
      x,
      d.icon,
      W2 / 2,
      H2 * (compact ? 0.31 : 0.3),
      compact ? 28 : 34,
      0.94 * primaryReceipt,
    )

    const leadY = H2 * (compact ? 0.455 : 0.48)
    const nameY = H2 * (compact ? 0.555 : 0.64)
    drawTrackedText(
      x,
      W2,
      plate.lead,
      leadY,
      `${compact ? 900 : 850} ${compact ? 38 : 50}px "Arial Narrow", "Helvetica Neue", sans-serif`,
      compact ? 0.7 : 1.8,
      compact ? 'rgb(238,238,232)' : 'rgb(216,216,211)',
      primaryReceipt,
      compact ? { color: 'rgba(244,244,238,0.34)', width: 0.9 } : undefined,
    )
    drawTrackedText(
      x,
      W2,
      plate.name,
      nameY,
      `700 ${compact ? 21 : 27}px ui-monospace, monospace`,
      compact ? 1.6 : 2.5,
      'rgb(194,197,194)',
      0.9 * receipt,
    )
    drawTrackedText(
      x,
      W2,
      plate.detail,
      H2 * (compact ? 0.66 : 0.77),
      `650 ${compact ? 16 : 18}px ui-monospace, monospace`,
      compact ? 1.3 : 1.9,
      'rgb(178,181,178)',
      0.82 * receipt,
    )
    x.font = `600 ${compact ? 12 : 14}px ui-monospace, monospace`
    x.textAlign = 'left'
    x.textBaseline = 'alphabetic'
    x.fillStyle = 'rgb(151,154,153)'
    x.globalAlpha = 0.62 * receipt
    x.fillText(`RELEASE PRINT ${plate.number}`, inset + (compact ? 12 : 16), H2 - inset - (compact ? 11 : 13))
    x.textAlign = 'right'
    x.fillText('END', W2 - inset - (compact ? 12 : 16), H2 - inset - (compact ? 11 : 13))
    x.restore()
  }
  function drawScreen(
    sc: (typeof screenCtxs)[number],
    id: number,
    liveProjectionSource = false,
    mediaTimeSeconds = wrapMediaTime(id / SOURCE_FPS),
    terminalProgress = 0,
  ) {
    if (terminalProgress >= 0.999 && sc.terminalSettled) return false
    sc.terminalSettled = terminalProgress >= 0.999
    const { x, d, c, rasterScale } = sc
    const W2 = c.width / rasterScale
    const H2 = c.height / rasterScale
    // The portrait output is supersampled before Three downsizes and
    // perspective-filters it. Clear in device pixels, then author in the same
    // stable logical coordinates as the other channel artifacts.
    x.setTransform(1, 0, 0, 1, 0, 0)
    x.clearRect(0, 0, c.width, c.height)
    x.setTransform(rasterScale, 0, 0, rasterScale, 0, 0)
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
      // A restrained phone silhouette carries a real portrait deliverable.
      // Caption timing follows BitterClip's Active Word contract: the full
      // phrase remains stable while exactly one spoken word is highlighted.
      x.fillStyle = 'rgba(8,10,13,0.94)'
      x.beginPath()
      x.roundRect(22, 16, 296, 658, 46)
      x.fill()
      x.strokeStyle = 'rgba(174,188,201,0.34)'
      x.lineWidth = 2
      x.stroke()
      x.fillStyle = 'rgba(174,188,201,0.32)'
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
      const captionShade = x.createLinearGradient(0, 392, 0, 632)
      captionShade.addColorStop(0, 'rgba(4,6,8,0)')
      captionShade.addColorStop(0.48, 'rgba(4,6,8,0.18)')
      captionShade.addColorStop(1, 'rgba(4,6,8,0.74)')
      x.fillStyle = captionShade
      x.fillRect(38, 392, 264, 252)
      // Mike, episode 1: "I am my own marketing asset." Karaoke follows the
      // source word clock. One lime word at a time, with a short settling pop.
      const captionLines = LINKEDIN_CAPTION_LINES
      const activeWord = activeCaptionWordIndex(mediaTimeSeconds)
      let wordIndex = 0
      x.save()
      x.font = '900 31px system-ui, sans-serif'
      x.textAlign = 'left'
      x.textBaseline = 'middle'
      x.lineJoin = 'round'
      // A restrained hard outline survives footage without turning the glyph
      // edge into the soft white caterpillar seen in the one-times raster.
      x.lineWidth = 3.5
      x.strokeStyle = 'rgba(5,6,8,0.96)'
      x.shadowColor = 'rgba(0,0,0,0.38)'
      x.shadowBlur = 2
      captionLines.forEach((line, lineIndex) => {
        const gap = 9
        const widths = line.map((word) => x.measureText(word.text).width)
        const lineWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (line.length - 1)
        let cursor = W2 / 2 - lineWidth / 2
        line.forEach((word, lineWordIndex) => {
          const active = wordIndex === activeWord
          const activeAge = Math.max(0, mediaTimeSeconds - captionHighlightStarts[wordIndex]!)
          const activeSettle = minJerk(activeAge / 0.16)
          const activeScale = active ? 1.085 - 0.045 * activeSettle : 1
          const centerX = cursor + widths[lineWordIndex]! / 2
          const y = 438 + lineIndex * 42
          x.save()
          x.translate(centerX, y)
          x.scale(activeScale, activeScale)
          x.strokeText(word.text, -widths[lineWordIndex]! / 2, 0)
          // Inactive whites stay under the bloom threshold. Only the current
          // source word receives the product lime; persistent keyword color
          // made the karaoke state unreadable at homepage scale.
          x.fillStyle = active ? '#ccff36' : 'rgba(216,216,211,0.99)'
          x.fillText(word.text, -widths[lineWordIndex]! / 2, 0)
          x.restore()
          cursor += widths[lineWordIndex]! + gap
          wordIndex += 1
        })
      })
      x.restore()
      channelBadge(58, 74, 210, 48, 'LINKEDIN', 25)
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
      channelBadge(44, 28, 238, 54, 'PODCAST', 29)
    }
    drawNoirReceipt(sc, terminalProgress)
    sc.tex.needsUpdate = true
    return true
  }
  FAN.forEach((d) => {
    const c = document.createElement('canvas')
    const rasterScale = d.icon === 'in' ? 2 : 1
    c.width = (d.icon === 'in' ? 340 : 640) * rasterScale
    c.height = (d.icon === 'in' ? 690 : d.icon === 'pod' ? 420 : 360) * rasterScale
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    const sc = { c, x: c.getContext('2d')!, tex, d, rasterScale, terminalSettled: false }
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
    const glowScaleX = d.icon === 'pod' ? 1.58 : 1.5
    const glowScaleY = d.icon === 'pod' ? 1.62 : 1.56
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(d.color) },
        uOn: { value: 0 },
        uStrength: { value: d.icon === 'yt' ? 0.12 : d.icon === 'in' ? 0.085 : 0.17 },
        uTime: { value: 0 },
        uSmoke: { value: 0 },
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
        uniform float uTime;
        uniform float uSmoke;
        varying vec2 vUv;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }
        void main() {
          // Two slightly offset Gaussian-like lobes feel like scattered light
          // in haze, not a stroked replica of the card. The larger mesh gives
          // the field room to decay; the independent edge guard guarantees
          // zero alpha before every plane boundary under steep perspective.
          vec2 p = (vUv - 0.5) * 2.0;
          vec2 tightP = p * vec2(0.78, 1.0);
          vec2 airP = (p - vec2(-0.035, 0.045)) * vec2(0.62, 0.84);
          float tight = exp(-4.8 * dot(tightP, tightP));
          float atmosphere = exp(-3.5 * dot(airP, airP));
          float halo = tight * 0.62 + atmosphere * 0.38;
          vec2 edgeIn = smoothstep(vec2(0.0), vec2(0.12), vUv);
          vec2 edgeOut = smoothstep(vec2(0.0), vec2(0.12), 1.0 - vUv);
          float edgeGuard = edgeIn.x * edgeIn.y * edgeOut.x * edgeOut.y;
          edgeGuard *= edgeGuard;
          float radius = length(p * vec2(0.78, 0.96));
          // The terminal breath lives well inside the landing plane. The v1
          // annulus reached too close to the mesh boundary and rebuilt the
          // exact clipped rectangle the edge-safe halo had removed.
          float smokeRing = smoothstep(0.38, 0.5, radius) * (1.0 - smoothstep(0.58, 0.76, radius));
          float smokeNoise = vnoise(vec2(p.x * 2.3 + uTime * 0.16, p.y * 3.1 - uTime * 0.24));
          float smoke = smokeRing * smoothstep(0.36, 0.82, smokeNoise) * edgeGuard * uSmoke;
          float landing = halo * edgeGuard * uStrength * uOn;
          vec3 terminalSmoke = vec3(0.52, 0.535, 0.535);
          vec3 color = mix(uColor, terminalSmoke, min(1.0, uSmoke));
          gl_FragColor = vec4(color, landing + smoke * 0.026);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(
        d.w * glowScaleX,
        d.h * glowScaleY,
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
      // On the real 440px homepage the YouTube card previously started inside
      // the free-tier footnote. Drop the complete mobile fan as one optical
      // constellation, preserving its internal triangle and beam causality.
      const mobileCopyClearance = mobileLayout ? -0.62 : 0
      const target = new THREE.Vector3(
        d.x,
        lampY + d.y + lowerLift + phoneRise + sketchRise + mobileCopyClearance,
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
  let bootLabelCanvas: HTMLCanvasElement | null = null
  let bootLabelCtx: CanvasRenderingContext2D | null = null
  let bootLabelRevision = 0
  const canvasPixelCache = new WeakMap<HTMLCanvasElement, ImageData>()
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
    const lx = lc.getContext('2d', { willReadFrequently: true })!
    bootLabelCanvas = lc
    bootLabelCtx = lx
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
      canvasPixelCache.delete(lc)
      bootLabelRevision += 1
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
  // The film economy remains exactly 108 logical information packets: three
  // logical packets expose one of 36 physical cells. A logical packet may now
  // render as 3, 6, or 9 source-colored microfragments. They share one path
  // family and reconvene around one registration anchor; visible density no
  // longer changes the mechanical clock.
  type ParticleSeed = {
    index: number
    packetIndex: number
    microIndex: number
    x: number
    y: number
    z: number
    volumeRadius: number
    orbit: number
    microAngle: number
    microRadius: number
    targetFrame: number
    arrivalTime: number
    startTime: number
    birthTime: number
    slot: number
    sourceU: number
    sourceV: number
    sampledRevision: number
    sourceRgb: [number, number, number]
    sourceLab: [number, number, number]
    targetRgb: [number, number, number]
    targetLab: [number, number, number]
    sizeFamily: number
  }
  const fract = (value: number) => value - Math.floor(value)
  const srgbToLinear = (value: number) => {
    const x = THREE.MathUtils.clamp(value, 0, 1)
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  const linearToSrgb = (value: number) => {
    const x = Math.max(0, value)
    return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }
  const rgbToOklab = (rgb: [number, number, number]): [number, number, number] => {
    const r = srgbToLinear(rgb[0])
    const g = srgbToLinear(rgb[1])
    const b = srgbToLinear(rgb[2])
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ]
  }
  const oklabToRgb = (lab: [number, number, number]): [number, number, number] => {
    const l0 = lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2]
    const m0 = lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2]
    const s0 = lab[0] - 0.0894841775 * lab[1] - 1.291485548 * lab[2]
    const l = l0 * l0 * l0
    const m = m0 * m0 * m0
    const s = s0 * s0 * s0
    return [
      THREE.MathUtils.clamp(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 1),
      THREE.MathUtils.clamp(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 1),
      THREE.MathUtils.clamp(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), 0, 1),
    ]
  }
  const mixLab = (
    a: [number, number, number],
    b: [number, number, number],
    amount: number,
  ): [number, number, number] => [
    THREE.MathUtils.lerp(a[0], b[0], amount),
    THREE.MathUtils.lerp(a[1], b[1], amount),
    THREE.MathUtils.lerp(a[2], b[2], amount),
  ]
  const rgbLuminance = (rgb: [number, number, number]) => (
    0.2126 * srgbToLinear(rgb[0])
    + 0.7152 * srgbToLinear(rgb[1])
    + 0.0722 * srgbToLinear(rgb[2])
  )
  const sampleCanvasRgb = (
    source: HTMLCanvasElement | null,
    ctx: CanvasRenderingContext2D | null,
    u: number,
    v: number,
  ): [number, number, number] => {
    if (!source || !ctx) return [0.2, 0.16, 0.15]
    const x = Math.round(THREE.MathUtils.clamp(u, 0, 1) * (source.width - 1))
    const y = Math.round(THREE.MathUtils.clamp(v, 0, 1) * (source.height - 1))
    let imageData = canvasPixelCache.get(source)
    if (!imageData || imageData.width !== source.width || imageData.height !== source.height) {
      imageData = ctx.getImageData(0, 0, source.width, source.height)
      canvasPixelCache.set(source, imageData)
    }
    const offset = (y * imageData.width + x) * 4
    const pixel = imageData.data
    let rgb: [number, number, number] = [pixel[offset]! / 255, pixel[offset + 1]! / 255, pixel[offset + 2]! / 255]
    // Black source pixels are still information. Lift them into perceptible
    // blue-black/graphite/brown material without mistaking luminance for mass.
    const luminance = rgbLuminance(rgb)
    if (luminance < 0.035) {
      const graphite: [number, number, number] = u < 0.52
        ? [0.085, 0.105, 0.135]
        : [0.12, 0.095, 0.08]
      const lift = 1 - THREE.MathUtils.clamp(luminance / 0.035, 0, 1)
      rgb = [
        THREE.MathUtils.lerp(rgb[0], graphite[0], 0.72 * lift),
        THREE.MathUtils.lerp(rgb[1], graphite[1], 0.72 * lift),
        THREE.MathUtils.lerp(rgb[2], graphite[2], 0.72 * lift),
      ]
    }
    return rgb
  }
  const sourceFaceCoordinates = (u: number, v: number) => {
    const localY = THREE.MathUtils.lerp(1.12, -1, v)
    const localZ = 0.02 - (u - 0.5) * 1.88
    const labelU = 0.5 + (0.07 - localZ) / 1.64
    const labelV = 0.5 - localY / 1.74
    return {
      localY,
      localZ,
      labelU,
      labelV,
      onLabel: labelU >= 0 && labelU <= 1 && labelV >= 0 && labelV <= 1,
    }
  }
  const sampleSourceFaceRgb = (u: number, v: number): [number, number, number] => {
    const face = sourceFaceCoordinates(u, v)
    if (face.onLabel) return sampleCanvasRgb(bootLabelCanvas, bootLabelCtx, face.labelU, face.labelV)
    // The exact printed inset is surrounded by a substantial salmon archival
    // sleeve. Treat that carrier as source information too; otherwise the
    // dematerialized palette falsely claims the black contact sheet was the
    // whole object.
    const edgeShade = 0.94 + 0.06 * Math.sin((u * 17.3 + v * 11.9) * Math.PI)
    return [0.56 * edgeShade, 0.36 * edgeShade, 0.33 * edgeShade]
  }
  const sourceImportanceAt = (u: number, v: number) => {
    let importance = 0.45
    if (v > 0.17 && v < 0.66) importance += 0.42 // real Mike + John tiles
    if (v < 0.14 && u < 0.7) importance += 0.32 // blue Zoom mark + title
    if (v < 0.14 && u > 0.78) importance += 0.48 // salmon MP4 chip
    if (v > 0.68) importance += 0.24 // filename, episode, duration typography
    if (bootLabelCanvas && bootLabelCtx) {
      const dx = 2 / bootLabelCanvas.width
      const dy = 2 / bootLabelCanvas.height
      const c = sampleSourceFaceRgb(u, v)
      const cx = sampleSourceFaceRgb(u + dx, v)
      const cy = sampleSourceFaceRgb(u, v + dy)
      const luminance = rgbLuminance(c)
      const chroma = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])
      importance += Math.min(0.8,
        Math.abs(rgbLuminance(c) - rgbLuminance(cx)) * 5
        + Math.abs(rgbLuminance(c) - rgbLuminance(cy)) * 5,
      )
      importance += Math.min(0.34, chroma * 1.8)
      if (luminance < 0.12) importance += 0.26
      if (luminance > 0.72) importance -= 0.34
    }
    return importance
  }
  // CPU twin of the boot-label breakup shader. Source pixels become matter
  // when this exact scalar field meets the moving dissolve threshold; using
  // the same field for birth prevents colored fragments from appearing beside
  // an unrelated generic edge.
  const dissolveHash = (x: number, y: number) => fract(
    Math.sin(x * 127.1 + y * 311.7) * 43758.5453123,
  )
  const dissolveNoise = (x: number, y: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = fract(x)
    const fy = fract(y)
    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)
    const a = THREE.MathUtils.lerp(dissolveHash(ix, iy), dissolveHash(ix + 1, iy), ux)
    const b = THREE.MathUtils.lerp(dissolveHash(ix, iy + 1), dissolveHash(ix + 1, iy + 1), ux)
    return THREE.MathUtils.lerp(a, b, uy)
  }
  const sourceBirthFraction = (u: number, canvasV: number) => {
    const face = sourceFaceCoordinates(u, canvasV)
    // The contact-sheet inset and the salmon carrier have separate shaders.
    // Solve the matching field for the physical source location.
    const shaderU = face.onLabel ? face.labelU : u
    const shaderV = face.onLabel
      ? 1 - face.labelV
      : THREE.MathUtils.clamp((face.localY + 1.02) / 2.16, 0, 1)
    const noise = face.onLabel
      ? dissolveNoise(shaderU * 7, shaderV * 10) * 0.16
        + dissolveNoise(shaderU * 19, shaderV * 23) * 0.06
      : 0.018 * Math.sin(shaderV * 41)
        + 0.008 * Math.sin(shaderV * 97 + face.localY * 13)
    const field = face.onLabel ? shaderV * 0.82 + noise : shaderV + noise
    return THREE.MathUtils.clamp((field + 0.06) / 1.08, 0, 1)
  }

  const packetBases = Array.from({ length: LOGICAL_PACKETS }, (_, packetIndex) => {
    const sphereV = (((packetIndex * 47) % LOGICAL_PACKETS) + 0.5) / LOGICAL_PACKETS
    const sphereY = 1 - 2 * sphereV
    const sphereRadius = Math.sqrt(Math.max(0, 1 - sphereY * sphereY))
    const volumeRadius = Math.pow(
      (((packetIndex * 73) % LOGICAL_PACKETS) + 0.5) / LOGICAL_PACKETS,
      1 / 3,
    )
    const phi = (packetIndex * 2.399963229728653) % (Math.PI * 2)
    return {
      x: Math.cos(phi) * sphereRadius * volumeRadius,
      y: sphereY * volumeRadius,
      z: Math.sin(phi) * sphereRadius * volumeRadius,
      phi,
      volumeRadius,
      slot: packetIndex % PARTICLES_PER_FRAME,
    }
  })
  for (let frame = 0; frame < FRAME_GROUPS; frame++) {
    packetBases
      .slice(frame * PARTICLES_PER_FRAME, (frame + 1) * PARTICLES_PER_FRAME)
      .sort((a, b) => a.z - b.z)
      .forEach((packet, slot) => { packet.slot = slot })
  }

  const bitsPos = new Float32Array(MAX_VISIBLE_FRAGMENTS * 3)
  const bitsColor = new Float32Array(MAX_VISIBLE_FRAGMENTS * 3)
  const bitsSize = new Float32Array(MAX_VISIBLE_FRAGMENTS)
  const bitsAlpha = new Float32Array(MAX_VISIBLE_FRAGMENTS)
  const bitsHaloAlpha = new Float32Array(MAX_VISIBLE_FRAGMENTS)
  const bitsShape = new Float32Array(MAX_VISIBLE_FRAGMENTS)
  const trailPos = new Float32Array(MAX_VISIBLE_FRAGMENTS * 6)
  const trailColor = new Float32Array(MAX_VISIBLE_FRAGMENTS * 6)
  const bitsSeed: ParticleSeed[] = []
  for (let packetIndex = 0; packetIndex < LOGICAL_PACKETS; packetIndex++) {
    const packet = packetBases[packetIndex]!
    const targetFrame = Math.floor(packetIndex / PARTICLES_PER_FRAME) + 1
    const arrivalTime = timeForFrame(targetFrame)
    const cohortRamp = minJerk((targetFrame - 1) / 15)
    const slotJourneyOffset = [0.03, 0, -0.03][packet.slot]!
    const journey = THREE.MathUtils.lerp(1.42, 1.28, cohortRamp) + slotJourneyOffset
    const startTime = arrivalTime - journey
    for (let microIndex = 0; microIndex < MAX_FRAGMENTS_PER_PACKET; microIndex++) {
      const index = packetIndex * MAX_FRAGMENTS_PER_PACKET + microIndex
      const microRing = Math.floor(microIndex / 3)
      // 3/6/9 are nested zero-centroid triples. Density comparisons therefore
      // add surface around the immutable packet path instead of displacing it.
      const microAngle = packet.phi
        + (microIndex % 3) * (Math.PI * 2 / 3)
        + microRing * (Math.PI / 9)
      // Keep each six-fragment family visibly related. The earlier .40/.65
      // rings enlarged individual scatter without producing more union area;
      // at the writer that read as eighteen unrelated flakes. These nested
      // zero-centroid rings preserve every parent path while making the sixes
      // clump before the three packet anchors become distinct.
      const microRadius = [0.25, 0.42, 0.58][microRing]!
      bitsSeed.push({
        index,
        packetIndex,
        microIndex,
        x: packet.x + Math.cos(microAngle) * microRadius,
        y: packet.y + Math.sin(microAngle) * microRadius * 0.72,
        z: packet.z + Math.sin(microAngle) * microRadius,
        volumeRadius: packet.volumeRadius,
        orbit: packet.phi,
        microAngle,
        microRadius,
        targetFrame,
        arrivalTime,
        startTime,
        birthTime: FILE_CONTACT_AT,
        slot: packet.slot,
        sourceU: 0.5,
        sourceV: 0.5,
        sampledRevision: -1,
        sourceRgb: [0.2, 0.16, 0.15],
        sourceLab: rgbToOklab([0.2, 0.16, 0.15]),
        targetRgb: [0.54, 0.42, 0.34],
        targetLab: rgbToOklab([0.54, 0.42, 0.34]),
        sizeFamily: [0.82, 0.94, 1.06, 0.88, 1.12, 0.98, 0.9, 1.04, 0.86][microIndex]!,
      })
      bitsShape[index] = (microIndex + packetIndex * 0.61803398875) % 3
      bitsPos[index * 3 + 1] = -999
      trailPos[index * 6 + 1] = -999
      trailPos[index * 6 + 4] = -999
    }
  }
  let sourceMappingRevision = -1
  let sourceMappingStrategy: Iso4SamplingStrategy | null = null
  const assignSourceMappings = (force = false) => {
    if (!force
      && sourceMappingRevision === bootLabelRevision
      && sourceMappingStrategy === workshopOptions.samplingStrategy) return
    for (let packetIndex = 0; packetIndex < LOGICAL_PACKETS; packetIndex++) {
      const uniformU = fract(0.5 + (packetIndex + 1) * 0.7548776662466927)
      // Packets are emitted bottom-to-top with a small low-discrepancy jitter.
      // Their horizontal identity is never a rectangular grid.
      const uniformV = THREE.MathUtils.clamp(
        0.96 - (packetIndex + 0.5) / LOGICAL_PACKETS
          + 0.0028 * Math.sin(packetIndex * 2.399963229728653),
        0.035,
        0.965,
      )
      let importantU = uniformU
      let importantV = uniformV
      let bestImportance = -Infinity
      // Preserve 75% low-discrepancy coverage. The remaining quarter may
      // search the complete source in two dimensions, but only among pixels
      // that break up before the packet's locked gathering clock. This makes
      // the importance variant honest without sacrificing the 108 deadlines.
      const allowGlobalImportance = packetIndex % 4 === 3
      for (let candidate = 0; candidate < 16; candidate++) {
        const u = fract(uniformU + (candidate - 5.5) * 0.071 + packetIndex * 0.013)
        const v = allowGlobalImportance
          ? THREE.MathUtils.clamp(fract((packetIndex + 1) * 0.5698402909980532 + candidate * 0.3819660112501051), 0.02, 0.98)
          : THREE.MathUtils.clamp(uniformV + (candidate - 7.5) * 0.0042, 0.02, 0.98)
        const candidateBirth = FILE_CONTACT_AT + sourceBirthFraction(u, v) * FILE_TRANSIT_SECONDS
        if (candidateBirth > bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET]!.startTime - 0.06) continue
        const score = sourceImportanceAt(u, v)
        if (score > bestImportance) {
          bestImportance = score
          importantU = u
          importantV = v
        }
      }
      const centerU = workshopOptions.samplingStrategy === 'uniform'
        ? uniformU
        : workshopOptions.samplingStrategy === 'importance'
          ? importantU
          : fract(uniformU + 0.38 * (((importantU - uniformU + 1.5) % 1) - 0.5))
      const centerV = workshopOptions.samplingStrategy === 'uniform'
        ? uniformV
        : workshopOptions.samplingStrategy === 'importance'
          ? importantV
          : THREE.MathUtils.lerp(uniformV, importantV, 0.38)
      for (let microIndex = 0; microIndex < MAX_FRAGMENTS_PER_PACKET; microIndex++) {
        const seed = bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET + microIndex]!
        if (!force && seed.sampledRevision >= 0) continue
        const radius = 0.012 + 0.025 * Math.sqrt((microIndex + 0.5) / MAX_FRAGMENTS_PER_PACKET)
        const angle = seed.microAngle + packetIndex * 0.37
        seed.sourceU = fract(centerU + Math.cos(angle) * radius)
        // A packet keeps a small recognizable source neighborhood. Vertical
        // spread stays narrow so siblings leave within a few milliseconds.
        seed.sourceV = THREE.MathUtils.clamp(centerV + Math.sin(angle) * 0.0036, 0.02, 0.98)
        seed.birthTime = FILE_CONTACT_AT
          + sourceBirthFraction(seed.sourceU, seed.sourceV) * FILE_TRANSIT_SECONDS
        if (force) seed.sampledRevision = -1
      }
    }
    sourceMappingRevision = bootLabelRevision
    sourceMappingStrategy = workshopOptions.samplingStrategy
  }
  const freezeSourceIdentity = (seed: ParticleSeed) => {
    if (seed.sampledRevision >= 0) return
    seed.sourceRgb = sampleSourceFaceRgb(seed.sourceU, seed.sourceV)
    seed.sourceLab = rgbToOklab(seed.sourceRgb)
    // Compress only the photographic extremes. Dark panels retain tinted
    // graphite substance on OLED black, while white type cannot become the
    // handful of stars that visually dominates the whole source palette.
    seed.sourceLab[0] = THREE.MathUtils.clamp(seed.sourceLab[0], 0.22, 0.82)
    seed.sourceRgb = oklabToRgb(seed.sourceLab)
    const target = frameArt(seed.targetFrame, false)
    const targetCtx = target.getContext('2d', { willReadFrequently: true })!
    seed.targetRgb = sampleCanvasRgb(target, targetCtx, seed.sourceU, seed.sourceV)
    seed.targetLab = rgbToOklab(seed.targetRgb)
    seed.sampledRevision = bootLabelRevision
  }
  assignSourceMappings(true)

  const bitsGeo = new THREE.BufferGeometry()
  bitsGeo.setAttribute('position', new THREE.BufferAttribute(bitsPos, 3))
  bitsGeo.setAttribute('color', new THREE.BufferAttribute(bitsColor, 3))
  bitsGeo.setAttribute('aSize', new THREE.BufferAttribute(bitsSize, 1))
  bitsGeo.setAttribute('aAlpha', new THREE.BufferAttribute(bitsAlpha, 1))
  bitsGeo.setAttribute('aHaloAlpha', new THREE.BufferAttribute(bitsHaloAlpha, 1))
  bitsGeo.setAttribute('aShape', new THREE.BufferAttribute(bitsShape, 1))
  const particleVertex = /* glsl */ `
    attribute float aSize;
    attribute float aAlpha;
    attribute float aHaloAlpha;
    attribute float aShape;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vHaloAlpha;
    varying float vShape;
    uniform float uPointScale;
    uniform float uSizeScale;
    void main() {
      vColor = color;
      vAlpha = aAlpha;
      vHaloAlpha = aHaloAlpha;
      vShape = aShape;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = max(1.0, aSize * uSizeScale * uPointScale / max(1.0, -mvPosition.z));
      gl_Position = projectionMatrix * mvPosition;
    }
  `
  const coreUniforms = {
    uPointScale: { value: 1 },
    uSizeScale: { value: 1 },
  }
  const bitsMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: particleVertex,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vShape;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float angle = vShape * 1.0472 + 0.34;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        p = rotation * p;
        float aspect = 0.58 + 0.12 * mod(vShape, 3.0);
        p.x /= aspect;
        float roundRadius = length(p) * 2.0;
        float shardRadius = max(abs(p.x) * 1.72, abs(p.y) * 1.42);
        float radius = mix(roundRadius, shardRadius, 0.38);
        float body = 1.0 - smoothstep(0.46, 0.98, radius);
        float core = 1.0 - smoothstep(0.0, 0.42, radius);
        float alpha = vAlpha * 0.65 * body + (0.08 + vAlpha * 0.75) * core;
        if (alpha < 0.006) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  })
  const bits = new THREE.Points(bitsGeo, bitsMat)
  bits.frustumCulled = false
  bits.renderOrder = 3
  scene.add(bits)
  const haloUniforms = {
    uPointScale: coreUniforms.uPointScale,
    uSizeScale: { value: 2.35 },
  }
  const bitsHaloMat = new THREE.ShaderMaterial({
    uniforms: haloUniforms,
    vertexShader: particleVertex,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vHaloAlpha;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float radius = length(p) * 2.0;
        float halo = exp(-radius * radius * 3.6) * (1.0 - smoothstep(0.72, 1.0, radius));
        float alpha = vHaloAlpha * halo * 0.115;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const bitsHalo = new THREE.Points(bitsGeo, bitsHaloMat)
  bitsHalo.frustumCulled = false
  bitsHalo.renderOrder = 2
  scene.add(bitsHalo)
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColor, 3))
  const trails = new THREE.LineSegments(
    trailGeo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false }),
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
  let gateProjectionPhaseContractActive = false
  let freshGateExpectedTimelineError = 0
  let maxFreshGateExpectedTimelineError = 0
  let freshGatePresentedFrameError = 0
  let maxFreshGatePresentedFrameError = 0
  let gateProjectionPhaseError = 0
  const outputTextureTimes: number[] = []
  const renderFrameTimes: number[] = []
  const renderWallTimes: number[] = []
  const updateWallTimes: number[] = []
  const filmTexturePrepTimes: number[] = []
  const outputTexturePrepTimes: number[] = []
  const recordTiming = (samples: number[], milliseconds: number) => {
    samples.push(milliseconds)
    if (samples.length > 240) samples.splice(0, samples.length - 240)
  }
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
    // Reconstruct the exact printed source point on the moving sleeve face.
    // The plane is rotated into y/z, then the complete sleeve carries its
    // restrained -0.1rad yaw. At sd.birthTime this source row is exactly on
    // the empty threshold, so no generic side-emitter can detach the color
    // from the material it came from.
    const sourceFace = sourceFaceCoordinates(sd.sourceU, sd.sourceV)
    const labelLocalX = (sourceFace.onLabel ? 0.11 : 0.045) * detailScale
    const labelLocalY = sourceFace.localY * detailScale
    const labelLocalZ = sourceFace.localZ * detailScale
    const sleeveYaw = -0.1
    const sleeveCos = Math.cos(sleeveYaw)
    const sleeveSin = Math.sin(sleeveYaw)
    const initialX = DROP.x - 0.1 + sleeveCos * labelLocalX + sleeveSin * labelLocalZ
    const fileHalfHeight = 1.12 * detailScale
    const contactY = PLANE_Y + fileHalfHeight
    const inheritedVy = -(2 * fileHalfHeight) / FILE_TRANSIT_SECONDS
    const fileCenterAtBirth = contactY + inheritedVy * (sd.birthTime - FILE_CONTACT_AT)
    const initialY = fileCenterAtBirth + labelLocalY
    const initialZ = 0.1 - sleeveSin * labelLocalX + sleeveCos * labelLocalZ
    const packetBase = packetBases[sd.packetIndex]!
    // Shredding exposes more surface before organization: children open around
    // their zero-centroid parent without moving that parent, then C2-settle to
    // the authored packet radius during the last 340ms before horn entry.
    // This creates coverage through real separated cores rather than halo or
    // luminance, while the horn still receives its original cross-section.
    const familyOpened = minJerk(age / 0.32)
    const familySettled = minJerk((at - (sd.startTime - 0.34)) / 0.34)
    const familySupport = 1 + 3 * familyOpened * (1 - familySettled)
    const microX = Math.cos(sd.microAngle) * sd.microRadius
    const microY = Math.sin(sd.microAngle) * sd.microRadius * 0.72
    const microZ = Math.sin(sd.microAngle) * sd.microRadius
    const targetX = CLOUD_CENTER_X + (packetBase.x + microX * familySupport) * 0.82
    // The fastest inherited fragment can still approach its anchor
    // monotonically: targetY never sits above initialY-|v|/omega. That keeps
    // the cloud suspended without a hidden vertical rebound.
    const targetY = CLOUD_CENTER_Y + (packetBase.y + microY * familySupport) * 0.32
    const targetZ = CLOUD_CENTER_Z + (packetBase.z + microZ * familySupport) * 1.08
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
    void sd
    return 0.052
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
    const clusterRadius = 0.026 + 0.006 * (sd.microIndex % 3)
    const targetY = CHARGE_POINT.y
      + (slot === 0 ? -0.06 * IMG_H : 0.06 * IMG_H)
      + Math.sin(sd.microAngle) * clusterRadius
    const targetZ = slot * IMG_W * 0.32 + Math.cos(sd.microAngle) * clusterRadius
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
    // The exact source pixel and its fragment cross-fade locally. A fast core
    // handoff plus a short birth-energy shoulder closes the former 31% luma
    // trough at half crossing; the shoulder settles before suspension so it
    // cannot inflate the cloud into a furnace.
    const materialize = minJerk((at - sd.birthTime) / 0.09)
    if (at < sd.startTime) {
      const cloudBreath = 0.94 + 0.06 * Math.sin((at - sd.birthTime) * 0.72 + sd.orbit)
      const crossingShoulder = 1 - minJerk((at - (FILE_CLEAR_AT - 0.22)) / 0.22)
      const birthShoulder = 0.36
        * (1 - minJerk((at - sd.birthTime) / 0.52))
        * crossingShoulder
      return materialize * (0.36 + birthShoulder) * cloudBreath
    }
    const q = THREE.MathUtils.clamp((at - sd.startTime) / (sd.arrivalTime - sd.startTime), 0, 1)
    const coherence = 0.36 + 0.64 * minJerk(q / 0.8)
    const transfer = at <= sd.arrivalTime ? 1 : 1 - minJerk((at - sd.arrivalTime) / transferSeconds)
    return materialize * coherence * transfer
  }
  const packetCentroidSample = new Float32Array(3)
  const packetCentroidAt = (packetIndex: number, at: number, out: Float32Array, o: number) => {
    let count = 0
    let x = 0
    let y = 0
    let z = 0
    for (let micro = 0; micro < workshopOptions.fragmentsPerPacket; micro++) {
      const seed = bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET + micro]!
      if (!particleAt(seed, at, packetCentroidSample, 0)) continue
      x += packetCentroidSample[0]!
      y += packetCentroidSample[1]!
      z += packetCentroidSample[2]!
      count += 1
    }
    if (!count) return false
    out[o] = x / count
    out[o + 1] = y / count
    out[o + 2] = z / count
    return true
  }
  const archivalWarmLab = rgbToOklab([0.78, 0.56, 0.43])
  const pearlCoolLab = rgbToOklab([0.68, 0.74, 0.78])
  const pearlWarmLab = rgbToOklab([0.82, 0.7, 0.62])
  const graphiteLab = rgbToOklab([0.09, 0.115, 0.15])
  const salmonLab = rgbToOklab([0.86, 0.43, 0.36])
  const particleColorAt = (sd: ParticleSeed, at: number): [number, number, number] => {
    freezeSourceIdentity(sd)
    const age = Math.max(0, at - sd.birthTime)
    const q = at < sd.startTime
      ? 0
      : THREE.MathUtils.clamp((at - sd.startTime) / (sd.arrivalTime - sd.startTime), 0, 1)
    const suspension = minJerk(age / 0.42) * (1 - minJerk((q - 0.08) / 0.2))
    let pearlTarget = pearlWarmLab
    let pearlAmount = 0.2
    if (workshopOptions.colorScript === 'archival-warm') {
      pearlTarget = archivalWarmLab
      pearlAmount = 0.24
    } else if (workshopOptions.colorScript === 'spectral-pearl') {
      pearlTarget = sd.slot === 1 ? pearlCoolLab : pearlWarmLab
      pearlAmount = 0.18
    } else {
      pearlTarget = rgbLuminance(sd.sourceRgb) < 0.14 ? graphiteLab : salmonLab
      pearlAmount = 0.28
    }
    let lab = mixLab(sd.sourceLab, pearlTarget, pearlAmount * suspension)
    // Organization restores more of the packet's captured identity before a
    // restrained compression lift. Target-thumbnail color arrives only in
    // the last 12% of travel, so the horn never becomes a rainbow morph.
    const organized = minJerk((q - 0.18) / 0.46)
    lab = mixLab(lab, sd.sourceLab, organized * 0.34)
    // A live future writer frame is unknowable during flight. Only the
    // deterministic fallback can truthfully pre-carry its target palette;
    // live media receives that color at the actual contact/development front.
    const targetTransport = useMovingMedia ? 0 : minJerk((q - 0.88) / 0.12)
    lab = mixLab(lab, sd.targetLab, targetTransport * 0.18)
    const compression = minJerk((q - 0.76) / 0.24)
    lab[0] = Math.min(0.92, lab[0] + compression * 0.065)
    lab[1] *= 1 - compression * 0.06
    lab[2] *= 1 - compression * 0.06
    return oklabToRgb(lab)
  }
  // Density changes projected surface through normal-blended cores. Sizes are
  // large enough to clear the disappeared-sleeve coverage floor; opacity falls
  // with area so integrated light remains approximately conserved.
  const fragmentSizeForDensity = () => ({ 3: 0.44, 6: 0.365, 9: 0.3 }[workshopOptions.fragmentsPerPacket])
  const fragmentAlphaForDensity = () => ({ 3: 0.18, 6: 0.135, 9: 0.11 }[workshopOptions.fragmentsPerPacket])
  const seedIsConfigured = (seed: ParticleSeed) => seed.microIndex < workshopOptions.fragmentsPerPacket
  function update(t: number) {
    assignSourceMappings()
    // Keep rendering for responsive resize and diagnostics after the story is
    // complete, but stop every time-driven optical texture with the machine.
    const motionTime = Math.min(t, TERMINAL_STOP_AT)
    // Convert bounded world-space size families to device pixels. Density
    // changes projected area through real cores, never bloom inflation.
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, rendererDprCap)
    coreUniforms.uPointScale.value = rect.height * dpr / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))
    coreUniforms.uSizeScale.value = detailScale
    if (movingMediaIsActive() && (episodeVideo.paused || projectionVideo.paused)) {
      enterDeterministicMediaFallback()
    }
    if (temporalMediaResetRequested) {
      filmSlotReady.fill(false)
      filmSlotSourceFrames.fill(-1)
      filmSlotWriteOrdinals.fill(-1)
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
    for (const m of beamMats) m.uniforms.uTime!.value = motionTime
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
      dropFilmMat.uniforms.uTime!.value = motionTime
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
        for (let k = 0; k < MAX_VISIBLE_FRAGMENTS; k++) {
          const sd = bitsSeed[k]!
          const i3 = k * 3
          const i6 = k * 6
          if (!seedIsConfigured(sd) || !particleAt(sd, t, bitsPos, i3)) {
            bitsPos[i3 + 1] = -999
            bitsColor[i3] = 0
            bitsColor[i3 + 1] = 0
            bitsColor[i3 + 2] = 0
            bitsSize[k] = 0
            bitsAlpha[k] = 0
            bitsHaloAlpha[k] = 0
            trailPos[i6 + 1] = -999
            trailPos[i6 + 4] = -999
            continue
          }
          const energy = particleEnergy(sd, t)
          const color = particleColorAt(sd, t)
          const q = THREE.MathUtils.clamp(
            (t - sd.startTime) / (sd.arrivalTime - sd.startTime),
            0,
            1,
          )
          const contactSeat = minJerk((q - 0.68) / 0.32)
          // A cube-root volume distributes more points through the middle.
          // Attenuate its densest interior analytically so Beer-Lambert-like
          // overlap creates body without a white furnace.
          const depthExtinction = 0.62 + 0.38 * sd.volumeRadius
          bitsColor[i3] = srgbToLinear(color[0])
          bitsColor[i3 + 1] = srgbToLinear(color[1])
          bitsColor[i3 + 2] = srgbToLinear(color[2])
          // Final registration should read as three compact contacts, not a
          // luminous strip continuing through the reel. Six overlapping cores
          // carry each packet's density, so their footprint can contract while
          // compression energy moves into the emulsion. Diffraction falls off
          // faster than the solid cores as the fragments seat on the film face.
          bitsSize[k] = fragmentSizeForDensity() * sd.sizeFamily * (1 - contactSeat * 0.58)
          const contactCore = 1 - contactSeat * 0.52
          bitsAlpha[k] = energy * fragmentAlphaForDensity() * depthExtinction * contactCore
          bitsHaloAlpha[k] = bitsAlpha[k]! * (1 - contactSeat * 0.9)
          if (energy > 0.04) visibleBits += 1
          // One analytic wake per logical packet. Multiplying trails with
          // microfragment count would turn added surface area into stress.
          if (sd.microIndex === 0) {
            packetCentroidAt(sd.packetIndex, t, trailPos, i6)
            const trailEnvelope = q < PARTICLE_HORN_END
              ? minJerk((q - 0.48) / 0.14)
                * (1 - minJerk((q - (PARTICLE_HORN_END - 0.1)) / 0.1))
              : 0
            const hasTrail = packetCentroidAt(
              sd.packetIndex,
              t - PARTICLE_SHUTTER_SECONDS,
              trailPos,
              i6 + 3,
            )
            if (hasTrail && trailEnvelope > 0) {
              trailPos[i6 + 3] = THREE.MathUtils.lerp(trailPos[i6]!, trailPos[i6 + 3]!, trailEnvelope)
              trailPos[i6 + 4] = THREE.MathUtils.lerp(trailPos[i6 + 1]!, trailPos[i6 + 4]!, trailEnvelope)
              trailPos[i6 + 5] = THREE.MathUtils.lerp(trailPos[i6 + 2]!, trailPos[i6 + 5]!, trailEnvelope)
            } else {
              trailPos[i6 + 3] = trailPos[i6]!
              trailPos[i6 + 4] = trailPos[i6 + 1]!
              trailPos[i6 + 5] = trailPos[i6 + 2]!
            }
            for (let vertex = 0; vertex < 2; vertex++) {
              const colorOffset = i6 + vertex * 3
              trailColor[colorOffset] = bitsColor[i3]! * energy * 0.7
              trailColor[colorOffset + 1] = bitsColor[i3 + 1]! * energy * 0.7
              trailColor[colorOffset + 2] = bitsColor[i3 + 2]! * energy * 0.7
            }
          } else {
            trailPos[i6 + 1] = -999
            trailPos[i6 + 4] = -999
          }
        }
        bitsGeo.attributes.position!.needsUpdate = true
        bitsGeo.attributes.color!.needsUpdate = true
        bitsGeo.attributes.aSize!.needsUpdate = true
        bitsGeo.attributes.aAlpha!.needsUpdate = true
        bitsGeo.attributes.aHaloAlpha!.needsUpdate = true
        trailGeo.attributes.position!.needsUpdate = true
        trailGeo.attributes.color!.needsUpdate = true
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
    const contactFlash = completedFrames >= 1 ? Math.exp(-lastHitAge / 0.032) : 0
    const writerImpact = Math.min(1, contactFlash * 0.86 + impactPulse * 0.34)
    const finalHit = timeForFrame(FRAME_GROUPS)
    const chargingActive = completedFrames >= 1 && t <= finalHit + 0.28
    const writerEnvelope = chargingActive ? 1 - minJerk((t - finalHit) / 0.28) : 0
    const chargeRelease = 1 - minJerk((t - finalHit) / Math.max(0.1, BOOT.proj - finalHit + 0.18))
    for (const mat of lowerChargeMats) {
      mat.emissiveIntensity = 0.005 + chargeProgress * chargeRelease * 0.055 + impactPulse * 0.035
    }
    lowerReelEmber.intensity = 0.025 + chargeProgress * chargeRelease * 0.22 + impactPulse * 0.18
    chargeLight.intensity = writerEnvelope * (chargeProgress * 0.06 + writerImpact * 1.25)
    // The writer is persistent neutral hardware. It resolves before the first
    // contact, then only its emissive response pulses; the old disappearing
    // orange rectangle made the activation point look like a texture seam.
    const writerHardwareReveal = minJerk((t - (FIRST_ACTIVATION_AT - 0.85)) / 0.7)
    chargeRingMat.opacity = writerHardwareReveal * (
      0.22 + writerEnvelope * Math.min(0.07, chargeProgress * 0.01 + writerImpact * 0.055)
    )
    chargeRingMat.emissiveIntensity = writerEnvelope * (chargeProgress * 0.012 + writerImpact * 0.18)
    chargeRing.scale.setScalar(1 + contactFlash * 0.008)
    writerStockCatchMat.opacity = 0.045 + chargeProgress * chargeRelease * 0.01 + contactFlash * 0.018
    for (let i = 0; i < writerPerfCatchMats.length; i++) {
      const taper = Math.pow(Math.max(0, 1 - Math.abs(i - 9) / 10), 1.7)
      writerPerfCatchMats[i]!.opacity = 0.014 + taper * (
        0.034 + chargeProgress * chargeRelease * 0.008 + contactFlash * 0.016
      )
    }
    // A frame is not already complete when its triplet arrives. Three
    // reconstruction fronts spread from the exact registration anchors over
    // 55ms—short enough to finish before the next 16fps pull—while the impact
    // pulse and cumulative charge visibly accept the particles' energy.
    const writerReveal = completedFrames >= 1 ? minJerk(lastHitAge / 0.052) : 0
    if (completedFrames >= 1) {
      let contactR = 0
      let contactG = 0
      let contactB = 0
      let contactSamples = 0
      const packet0 = (completedFrames - 1) * PARTICLES_PER_FRAME
      for (let packet = packet0; packet < packet0 + PARTICLES_PER_FRAME; packet++) {
        for (let micro = 0; micro < workshopOptions.fragmentsPerPacket; micro++) {
          const seed = bitsSeed[packet * MAX_FRAGMENTS_PER_PACKET + micro]!
          const rgb = particleColorAt(seed, Math.min(t, seed.arrivalTime))
          contactR += srgbToLinear(rgb[0])
          contactG += srgbToLinear(rgb[1])
          contactB += srgbToLinear(rgb[2])
          contactSamples += 1
        }
      }
      chargeThumbUniforms.uWriterContactColor.value.setRGB(
        contactR / Math.max(1, contactSamples),
        contactG / Math.max(1, contactSamples),
        contactB / Math.max(1, contactSamples),
        THREE.LinearSRGBColorSpace,
      )
    }
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
      const filmPrepStarted = performance.now()
      drawFilm(filmDist, Math.min(totalPath, completedFrames * PITCH))
      recordTiming(filmTexturePrepTimes, performance.now() - filmPrepStarted)
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
      const terminalMachineSettle = minJerk(
        (t - (OUTPUT_TERMINAL_BASE + OUTPUT_TERMINAL_GAP * 2 + 0.18)) / 0.7,
      )
      const ig = t < BOOT.proj ? 0 : Math.min(1, (t - BOOT.proj) / 0.6)
      const igf = ig * ignitionFlutter(t - BOOT.proj)
      // Let the ignition flare for a fraction of a second, then settle low
      // enough that the iris, housing and three output beams remain legible.
      const strike = ig < 1 ? 1 + (1 - ig) * 0.8 : 1
      // Once stable, two incommensurate low-frequency components give the
      // concealed vintage lamp a barely perceptible life. The modulation is
      // deliberately below flicker territory and never affects ignition.
      const lampBreath = ig >= 1
        ? 1 + 0.022 * Math.sin(Math.PI * 2 * 0.37 * motionTime)
          + 0.01 * Math.sin(Math.PI * 2 * 0.53 * motionTime + 1.7)
        : 1
      const terminalLamp = 1 - terminalMachineSettle * 0.82
      gateGlow.intensity = 2.3 * igf * strike * lampBreath * terminalLamp
      headGlow.intensity = 2.15 * igf * strike * (1 + (lampBreath - 1) * 0.55) * terminalLamp
      gateLipMat.emissiveIntensity = 0.008 + 0.034 * igf * lampBreath * terminalLamp
      payoffTopRimMat.opacity = 0.032 * igf * terminalLamp
      payoffLowerRimMat.opacity = 0.052 * igf * terminalLamp
      if (gateFrameMat) {
        // The moving film texture already owns the decoded frame. This second
        // optical layer is only a restrained density lift inside the aperture;
        // at the old 0.52 opacity it read as a bright rectangular screen laid
        // across the carrier, especially from the tall/mobile camera. Keep it
        // below the stock so the image cannot become a floating band while the
        // gate lips and local light still disclose the exposure point.
        gateFrameMat.opacity = 0.14 * igf * (1 + (lampBreath - 1) * 0.35) * (0.28 + 0.72 * terminalLamp)
      }
    }

    // ACT 4 — one, two, three: each beam and its screen ignite in turn
    for (let i = 0; i < 3; i++) {
      const sequence = FAN[i]!.sequence
      const t0 = BOOT.beam0 + sequence * BOOT.beamGap
      const age = t - t0
      // Light establishes the route first, its landing field follows, and the
      // solid deliverable resolves last. All three remain monotone except the
      // shallow damped tremor in optical energy, and all settle inside the
      // existing 480ms handoff so the accepted one-two-three rhythm survives.
      const beamResolve = age < 0 ? 0 : minJerk(age / 0.3)
      const haloResolve = age < 0.04 ? 0 : minJerk((age - 0.04) / 0.44)
      const screenResolve = age < 0.08 ? 0 : minJerk((age - 0.08) / 0.4)
      const focusResolve = age < 0.06 ? 0 : minJerk((age - 0.06) / 0.42)
      const terminal = outputTerminalProgressAt(t, sequence)
      const smoke = outputTerminalSmokeAt(t, sequence)
      const opticalResidual = 1 - terminal * 0.94
      const beamOn = beamResolve * ignitionFlutter(age, sequence * 0.17) * opticalResidual
      beamMats[i]!.uniforms.uOn!.value = beamOn
      if (i === 1) blueBeamVeilMat.uniforms.uOn!.value = beamOn
      outputGlowMats[i]!.uniforms.uTime!.value = motionTime
      outputGlowMats[i]!.uniforms.uSmoke!.value = smoke
      outputGlowMats[i]!.uniforms.uOn!.value = haloResolve
        * ignitionFlutter(age - 0.04, sequence * 0.17)
        * opticalResidual
      const sm = screenMats[i]
      if (sm) sm.opacity = screenResolve
      screenResolveUniforms[i]!.uResolve.value = focusResolve
    }

    // The physical gate keeps the honest 16fps pull-down. Deterministic stills
    // use that exact held cell for every output. In motion, the finished
    // channel artifacts use the native-24fps projection head. It is delayed by
    // the same 32-frame transport and agrees with each freshly written cell on
    // that cell's first gate pass during the payoff. Once the finite 36-cell
    // carrier recirculates, outputs keep playing forward rather than seeking
    // backward by half of the 108-frame source loop.
    {
      const occ = Math.floor((S_GATE - off) / PITCH)
      const id = stableId(occ, off, filmDist)
      if (id !== lastGateId) {
        lastGateId = id
        const slot = filmSlot(gatePathCell, filmFrame)
        const gateArt = filmSlotReady[slot]
          ? filmSlotArt[slot]!
          : frameArt(id, false)
        if (gateFrameCtx && gateFrameTex) {
          gateFrameCtx.clearRect(0, 0, 320, 180)
          gateFrameCtx.drawImage(gateArt, 0, 0, 320, 180)
          maskGateFrame()
          gateFrameTex.needsUpdate = true
        }
        lastGateSourceFrame = filmSlotReady[slot] ? filmSlotSourceFrames[slot]! : -1
        const writeOrdinal = filmSlotWriteOrdinals[slot]!
        gateProjectionPhaseContractActive = t >= BOOT.proj
          && writeOrdinal >= 0
          && filmFrame === writeOrdinal + WRITER_TO_GATE_FRAMES
        const expectedProjectionFrame = mediaFrameIndex(t - PROJECTION_DELAY_SECONDS)
        if (lastGateSourceFrame >= 0) {
          const frameCount = Math.round(SOURCE_DURATION * SOURCE_FPS)
          let frameError = lastGateSourceFrame - expectedProjectionFrame
          if (frameError > frameCount / 2) frameError -= frameCount
          if (frameError < -frameCount / 2) frameError += frameCount
          gateProjectionPhaseError = frameError
          if (gateProjectionPhaseContractActive) {
            freshGateExpectedTimelineError = frameError
            maxFreshGateExpectedTimelineError = Math.max(
              maxFreshGateExpectedTimelineError,
              Math.abs(frameError),
            )
            let presentedFrameError = lastGateSourceFrame - presentedMediaFrameIndex(projectionVideo.currentTime)
            if (presentedFrameError > frameCount / 2) presentedFrameError -= frameCount
            if (presentedFrameError < -frameCount / 2) presentedFrameError += frameCount
            freshGatePresentedFrameError = presentedFrameError
            maxFreshGatePresentedFrameError = Math.max(
              maxFreshGatePresentedFrameError,
              Math.abs(presentedFrameError),
            )
          } else {
            freshGateExpectedTimelineError = 0
            freshGatePresentedFrameError = 0
          }
        } else {
          gateProjectionPhaseContractActive = false
          freshGateExpectedTimelineError = 0
          freshGatePresentedFrameError = 0
          gateProjectionPhaseError = 0
        }
        if (!movingMediaActive || projectionVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          const outputPrepStarted = performance.now()
          const haveProjectionFrame = projectionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          const outputMediaTime = haveProjectionFrame
            ? wrapMediaTime(projectionVideo.currentTime)
            : wrapMediaTime(elapsed - PROJECTION_DELAY_SECONDS)
          for (let i = 0; i < screenCtxs.length; i++) {
            drawScreen(
              screenCtxs[i]!,
              id,
              haveProjectionFrame,
              outputMediaTime,
              outputTerminalProgressAt(t, FAN[i]!.sequence),
            )
          }
          recordTiming(outputTexturePrepTimes, performance.now() - outputPrepStarted)
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
          const outputPrepStarted = performance.now()
          let redrewOutput = false
          for (let i = 0; i < screenCtxs.length; i++) {
            redrewOutput = drawScreen(
              screenCtxs[i]!,
              sourceFrame,
              true,
              mediaTime,
              outputTerminalProgressAt(t, FAN[i]!.sequence),
            ) || redrewOutput
          }
          if (redrewOutput) {
            recordTiming(outputTexturePrepTimes, performance.now() - outputPrepStarted)
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

      // Once the last contact print has resolved, freeze both decoded heads as
      // well as their CanvasTextures. The shared reel/film drive then finishes
      // its short physical coast at TERMINAL_STOP_AT; no hidden animation or
      // video loop remains alive behind the receipts.
      if (!terminalMediaPaused && t >= OUTPUT_TERMINAL_COMPLETE) {
        const sourceFrame = presentedMediaFrameIndex(projectionVideo.currentTime)
        for (let i = 0; i < screenCtxs.length; i++) {
          drawScreen(screenCtxs[i]!, sourceFrame, true, projectionVideo.currentTime, 1)
        }
        terminalMediaPaused = true
        movingMediaPlaying = false
        mediaPlayAttempt += 1
        episodeVideo.pause()
        projectionVideo.pause()
        cancelProjectionFrame()
      }
      const outputClockNow = performance.now() / 1000
      while (outputTextureTimes.length && outputClockNow - outputTextureTimes[0]! > 1.25) {
        outputTextureTimes.shift()
      }
      while (projectionPresentationTimes.length && outputClockNow - projectionPresentationTimes[0]! > 1.25) {
        projectionPresentationTimes.shift()
      }
    }
  }

  const p95 = (values: number[]) => {
    if (!values.length) return 0
    values.sort((a, b) => a - b)
    return values[Math.min(values.length - 1, Math.floor(values.length * 0.95))]!
  }
  const p50 = (values: number[]) => {
    if (!values.length) return 0
    values.sort((a, b) => a - b)
    return values[Math.min(values.length - 1, Math.floor(values.length * 0.5))]!
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
    const occupancyCell = Math.max(3, rect.width / 400)
    const occupiedCells = new Set<number>()
    const densityBins = new Map<number, number>()
    const sourceBins = new Set<string>()
    const suspendedScreenPoints: THREE.Vector3[] = []
    const packetScreenPoints = new Map<number, THREE.Vector3[]>()
    let sourceLabDistance = 0
    let sourceLabSamples = 0
    let particleRenderedLuminance = 0
    let particleEnergyTotal = 0
    let sourceLuminanceTotal = 0
    let configuredSourceSamples = 0
    let copyCollisions = 0
    let ctaCollisions = 0
    let viewportCollisions = 0
    const copyRects = [...document.querySelectorAll('.hero-h1, .hero-pillars, .hero-fineprint')]
      .map((element) => element.getBoundingClientRect())
    const ctaRect = document.querySelector('.hero-cta')?.getBoundingClientRect() ?? null
    const toScreen = (source: Float32Array, target: THREE.Vector3) => {
      target.set(source[0]!, source[1]!, source[2]!).project(camera)
      target.set((target.x * 0.5 + 0.5) * rect.width, (-target.y * 0.5 + 0.5) * rect.height, 0)
    }
    for (const seed of bitsSeed) {
      if (!seedIsConfigured(seed)) continue
      freezeSourceIdentity(seed)
      sourceLuminanceTotal += rgbLuminance(seed.sourceRgb) / workshopOptions.fragmentsPerPacket
      configuredSourceSamples += 1
      const visible = samples.every((sample, i) => particleAt(seed, t - i * dt, sample, 0))
      const activeNow = particleAt(seed, t, samples[0]!, 0)
      const energy = activeNow ? particleEnergy(seed, t) : 0
      if (activeNow && energy > 0.04) {
        visibleParticles += 1
        const currentRgb = particleColorAt(seed, t)
        const currentLab = rgbToOklab(currentRgb)
        sourceLabDistance += Math.hypot(
          currentLab[0] - seed.sourceLab[0],
          currentLab[1] - seed.sourceLab[1],
          currentLab[2] - seed.sourceLab[2],
        )
        sourceLabSamples += 1
        const sourceLum = rgbLuminance(seed.sourceRgb)
        if (sourceLum < 0.08) sourceBins.add('dark')
        if (sourceLum > 0.55) sourceBins.add('light')
        if (seed.sourceRgb[2] > seed.sourceRgb[0] * 1.18) sourceBins.add('blue')
        if (seed.sourceRgb[0] > seed.sourceRgb[2] * 1.32 && seed.sourceRgb[0] > seed.sourceRgb[1] * 1.08) sourceBins.add('salmon')
        if (seed.sourceRgb[0] > seed.sourceRgb[1] && seed.sourceRgb[1] > seed.sourceRgb[2] && sourceLum >= 0.08 && sourceLum <= 0.55) sourceBins.add('skin-brown')
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
      const pointWorld = new THREE.Vector3(samples[0]![0]!, samples[0]![1]!, samples[0]![2]!)
      const viewPoint = pointWorld.clone().applyMatrix4(camera.matrixWorldInverse)
      const pointDiameter = fragmentSizeForDensity() * seed.sizeFamily * detailScale
        * rect.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))
        / Math.max(1, -viewPoint.z)
      const pointRadius = Math.max(0.55, pointDiameter * 0.5)
      const minX = Math.floor((p0.x - pointRadius) / occupancyCell)
      const maxX = Math.ceil((p0.x + pointRadius) / occupancyCell)
      const minY = Math.floor((p0.y - pointRadius) / occupancyCell)
      const maxY = Math.ceil((p0.y + pointRadius) / occupancyCell)
      for (let gy = minY; gy <= maxY; gy++) {
        for (let gx = minX; gx <= maxX; gx++) {
          const cx = (gx + 0.5) * occupancyCell
          const cy = (gy + 0.5) * occupancyCell
          if (Math.hypot(cx - p0.x, cy - p0.y) <= pointRadius) {
            occupiedCells.add(gy * 10000 + gx)
          }
        }
      }
      const densityX = Math.floor(p0.x / 28)
      const densityY = Math.floor(p0.y / 28)
      const densityKey = densityY * 1000 + densityX
      densityBins.set(densityKey, (densityBins.get(densityKey) ?? 0) + 1)
      if (activeNow && t < seed.startTime) suspendedScreenPoints.push(p0.clone())
      if (activeNow && t >= seed.startTime) {
        const q = (t - seed.startTime) / (seed.arrivalTime - seed.startTime)
        if (q > 0.46 && q <= 1) {
          const packetPoints = packetScreenPoints.get(seed.packetIndex) ?? []
          packetPoints.push(p0.clone())
          packetScreenPoints.set(seed.packetIndex, packetPoints)
        }
      }
      const displayAlpha = energy * fragmentAlphaForDensity() * (0.62 + 0.38 * seed.volumeRadius)
      const currentColor = particleColorAt(seed, t)
      particleRenderedLuminance += Math.PI * pointRadius * pointRadius
        * displayAlpha * rgbLuminance(currentColor)
      particleEnergyTotal += energy / workshopOptions.fragmentsPerPacket
      const brightEnoughForCollision = displayAlpha * rgbLuminance(currentColor) > 0.012
      if (brightEnoughForCollision) {
        if (p0.x + pointRadius < 0 || p0.x - pointRadius > rect.width || p0.y + pointRadius < 0 || p0.y - pointRadius > rect.height) viewportCollisions += 1
        if (copyRects.some((copyRect) => (
          p0.x + pointRadius >= copyRect.left - rect.left
          && p0.x - pointRadius <= copyRect.right - rect.left
          && p0.y + pointRadius >= copyRect.top - rect.top
          && p0.y - pointRadius <= copyRect.bottom - rect.top
        ))) copyCollisions += 1
        if (ctaRect
          && p0.x + pointRadius >= ctaRect.left - rect.left
          && p0.x - pointRadius <= ctaRect.right - rect.left
          && p0.y + pointRadius >= ctaRect.top - rect.top
          && p0.y - pointRadius <= ctaRect.bottom - rect.top) ctaCollisions += 1
      }
      const trailSample = new Float32Array(3)
      const trailCurrent = new Float32Array(3)
      if (seed.microIndex === 0
        && packetCentroidAt(seed.packetIndex, t, trailCurrent, 0)
        && packetCentroidAt(seed.packetIndex, t - PARTICLE_SHUTTER_SECONDS, trailSample, 0)) {
        const trailCurrentPoint = new THREE.Vector3()
        const trailPoint = new THREE.Vector3()
        toScreen(trailCurrent, trailCurrentPoint)
        toScreen(trailSample, trailPoint)
        const q = (t - seed.startTime) / (seed.arrivalTime - seed.startTime)
        const trailEnvelope = q < PARTICLE_HORN_END
          ? minJerk((q - 0.48) / 0.14)
            * (1 - minJerk((q - (PARTICLE_HORN_END - 0.1)) / 0.1))
          : 0
        maxTrailPx = Math.max(maxTrailPx, trailCurrentPoint.distanceTo(trailPoint) * trailEnvelope)
      }
    }
    const packetCohesionAtHorn = (q: number) => {
      let total = 0
      let count = 0
      const position = new Float32Array(3)
      for (let packet = 0; packet < LOGICAL_PACKETS; packet++) {
        const points: THREE.Vector3[] = []
        for (let micro = 0; micro < workshopOptions.fragmentsPerPacket; micro++) {
          const seed = bitsSeed[packet * MAX_FRAGMENTS_PER_PACKET + micro]!
          const at = seed.startTime + q * (seed.arrivalTime - seed.startTime)
          if (!particleAt(seed, at, position, 0)) continue
          const point = new THREE.Vector3()
          toScreen(position, point)
          points.push(point)
        }
        if (points.length < 2) continue
        const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector3())
          .multiplyScalar(1 / points.length)
        total += Math.sqrt(points.reduce(
          (sum, point) => sum + point.distanceToSquared(center),
          0,
        ) / points.length)
        count += 1
      }
      return count ? total / count : 0
    }
    const sourceCorner = (u: number, v: number) => {
      const sourceFace = sourceFaceCoordinates(u, v)
      const localX = 0.045 * detailScale
      const localY = sourceFace.localY * detailScale
      const localZ = sourceFace.localZ * detailScale
      const c = Math.cos(-0.1)
      const s = Math.sin(-0.1)
      const point = new THREE.Vector3(
        DROP.x - 0.1 + c * localX + s * localZ,
        PLANE_Y + 1.12 * detailScale + localY,
        0.1 - s * localX + c * localZ,
      )
      transformMachinePoint(point, FILE_CONTACT_AT, point)
      point.project(camera)
      return new THREE.Vector3(
        (point.x * 0.5 + 0.5) * rect.width,
        (-point.y * 0.5 + 0.5) * rect.height,
        0,
      )
    }
    const sleeveCorners = [sourceCorner(0, 0), sourceCorner(1, 0), sourceCorner(1, 1), sourceCorner(0, 1)]
    let sleeveArea = 0
    for (let i = 0; i < sleeveCorners.length; i++) {
      const a = sleeveCorners[i]!
      const b = sleeveCorners[(i + 1) % sleeveCorners.length]!
      sleeveArea += a.x * b.y - b.x * a.y
    }
    sleeveArea = Math.max(1, Math.abs(sleeveArea) * 0.5)
    const densityValues = [...densityBins.values()]
    const densityP50 = densityValues.length
      ? densityValues.sort((a, b) => a - b)[Math.floor(densityValues.length * 0.5)]!
      : 0
    const densityP95 = densityValues.length
      ? densityValues[Math.min(densityValues.length - 1, Math.floor(densityValues.length * 0.95))]!
      : 0
    let hollowCenterRatio = 0
    if (suspendedScreenPoints.length >= 6) {
      const center = suspendedScreenPoints.reduce((sum, point) => sum.add(point), new THREE.Vector3())
        .multiplyScalar(1 / suspendedScreenPoints.length)
      const distances = suspendedScreenPoints.map((point) => point.distanceTo(center))
      const radius = Math.max(...distances, 1)
      const centerCount = distances.filter((distance) => distance < radius * 0.35).length
      const annulusCount = distances.filter((distance) => distance >= radius * 0.35 && distance < radius * 0.75).length
      const centerDensity = centerCount / (0.35 * 0.35)
      const annulusDensity = annulusCount / (0.75 * 0.75 - 0.35 * 0.35)
      hollowCenterRatio = annulusDensity > 0
        ? Math.max(0, 1 - centerDensity / annulusDensity)
        : 0
    }
    let packetCohesionTotal = 0
    let packetCohesionSamples = 0
    for (const points of packetScreenPoints.values()) {
      if (points.length < 2) continue
      const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector3())
        .multiplyScalar(1 / points.length)
      packetCohesionTotal += Math.sqrt(
        points.reduce((sum, point) => sum + point.distanceToSquared(center), 0) / points.length,
      )
      packetCohesionSamples += 1
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
    const meanSourceLuminance = sourceLuminanceTotal / Math.max(1, LOGICAL_PACKETS)
    const sourceReferenceLuminance = sleeveArea * meanSourceLuminance
    const integratedLuminance = sourceReferenceLuminance > 0
      ? (sourceReferenceLuminance * (1 - fileDissolve) + particleRenderedLuminance) / sourceReferenceLuminance
      : 0
    const completedFrames = writtenFramesAt(t)
    const lastHitAge = completedFrames >= 1 ? Math.max(0, t - timeForFrame(completedFrames)) : 0
    const writerDevelopment = completedFrames >= 1 ? minJerk(lastHitAge / 0.052) : 0
    const thumbnailEnergy = Math.max(0, completedFrames - 1) * PARTICLES_PER_FRAME
      + writerDevelopment * (completedFrames ? PARTICLES_PER_FRAME : 0)
    let currentCellParticleEnergy = 0
    if (completedFrames >= 1) {
      const firstPacket = (completedFrames - 1) * PARTICLES_PER_FRAME
      for (let packet = firstPacket; packet < firstPacket + PARTICLES_PER_FRAME; packet++) {
        for (let micro = 0; micro < workshopOptions.fragmentsPerPacket; micro++) {
          currentCellParticleEnergy += particleEnergy(
            bitsSeed[packet * MAX_FRAGMENTS_PER_PACKET + micro]!,
            t,
          ) / workshopOptions.fragmentsPerPacket
        }
      }
    }
    const currentCellDevelopedEnergy = writerDevelopment * PARTICLES_PER_FRAME
    const energyBalanceError = completedFrames >= 1
      ? Math.abs(PARTICLES_PER_FRAME - (currentCellParticleEnergy + currentCellDevelopedEnergy))
        / PARTICLES_PER_FRAME
      : 0
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
      p50SpeedPxPerFrame: tidy(p50(speeds)),
      p95SpeedPxPerFrame: tidy(p95(speeds)),
      p50AccelerationPxPerFrame2: tidy(p50(accelerations)),
      p95AccelerationPxPerFrame2: tidy(p95(accelerations)),
      p50JerkPxPerFrame3: tidy(p50(jerks)),
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
      logicalPackets: LOGICAL_PACKETS,
      configuredVisibleFragments: LOGICAL_PACKETS * workshopOptions.fragmentsPerPacket,
      visibleMicrofragments: visibleParticles,
      fragmentsPerPacket: workshopOptions.fragmentsPerPacket,
      fragmentsPerFilmCell: workshopOptions.fragmentsPerPacket * PARTICLES_PER_FRAME,
      colorScript: workshopOptions.colorScript,
      samplingStrategy: workshopOptions.samplingStrategy,
      sourceColorCoverage: tidy(sourceBins.size / 5),
      sourceToCloudOklabDistance: tidy(sourceLabSamples ? sourceLabDistance / sourceLabSamples : 0),
      projectedAreaVsSleeve: tidy((occupiedCells.size * occupancyCell * occupancyCell) / sleeveArea),
      integratedLuminanceVsSleeve: tidy(integratedLuminance),
      cloudHollowCenterRatio: tidy(hollowCenterRatio),
      screenDensityP50: densityP50,
      screenDensityP95: densityP95,
      packetCohesionPx: tidy(packetCohesionSamples ? packetCohesionTotal / packetCohesionSamples : 0),
      packetCohesionAtHorn55Px: tidy(packetCohesionAtHorn(0.55)),
      packetCohesionAtHorn90Px: tidy(packetCohesionAtHorn(0.9)),
      registrationArrivalSpreadMs: 0,
      particleEnergy: tidy(particleEnergyTotal),
      thumbnailEnergy: tidy(thumbnailEnergy),
      energyBalanceError: tidy(energyBalanceError),
      impactToDevelopmentMs: 52,
      terminalOutputs: screenCtxs.filter((screen) => screen.terminalSettled).length,
      copyCollisions,
      ctaCollisions,
      viewportCollisions,
    }
  }

  const rollingRate = (times: number[]) => {
    if (times.length < 2) return 0
    const span = times[times.length - 1]! - times[0]!
    return span > 0 ? (times.length - 1) / span : 0
  }
  const percentile = (values: number[], fraction: number) => {
    if (!values.length) return 0
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]!
  }
  const inspectTemporal = (): Iso4TemporalDiagnostics => {
    const nowSeconds = performance.now() / 1000
    // A settled contact print is intentionally static. Do not report its
    // frozen texture as a stalled active projection upload.
    const currentHold = terminalMediaPaused
      ? 0
      : Number.isFinite(lastOutputTextureAt) ? nowSeconds - lastOutputTextureAt : 0
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
      gateProjectionPhaseContractActive,
      freshGateExpectedTimelineErrorFrames: freshGateExpectedTimelineError,
      maxFreshGateExpectedTimelineErrorFrames: maxFreshGateExpectedTimelineError,
      freshGatePresentedFrameErrorFrames: freshGatePresentedFrameError,
      maxFreshGatePresentedFrameErrorFrames: maxFreshGatePresentedFrameError,
      gateProjectionPhaseErrorFrames: gateProjectionPhaseError,
      movingMediaPlaying,
      terminalMediaPaused,
      settledOutputTextures: screenCtxs.filter((screen) => screen.terminalSettled).length,
      usingDeterministicFallback: !useMovingMedia,
      updateWallTimeP50Ms: tidy(percentile(updateWallTimes, 0.5)),
      updateWallTimeP95Ms: tidy(percentile(updateWallTimes, 0.95)),
      renderWallTimeP50Ms: tidy(percentile(renderWallTimes, 0.5)),
      renderWallTimeP95Ms: tidy(percentile(renderWallTimes, 0.95)),
      filmTexturePrepP95Ms: tidy(percentile(filmTexturePrepTimes, 0.95)),
      outputTexturePrepP95Ms: tidy(percentile(outputTexturePrepTimes, 0.95)),
      qualityFallbackActive: softwareRenderer && workshopOptions.fragmentsPerPacket === 3,
      rendererDprCap,
    }
  }

  let shadowTick = 0
  function draw(t: number) {
    const updateStarted = performance.now()
    update(t)
    recordTiming(updateWallTimes, performance.now() - updateStarted)
    if ((shadowTick++ & 1) === 0) renderer.shadowMap.needsUpdate = true
    const renderStarted = performance.now()
    composer.render()
    recordTiming(renderWallTimes, performance.now() - renderStarted)
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
  refreshStaticOutput = () => {
    if (running) return
    lastFilmFrame = Number.NaN
    lastWrittenFrame = Number.NaN
    lastGateId = Number.NaN
    lastProjectedVideoRevision = Number.NaN
    draw(elapsed)
  }
  const loop = (now: number) => {
    elapsed = now / 1000 - timelineStart
    draw(elapsed)
    raf = requestAnimationFrame(loop)
  }

  return {
    sourceReady() {
      return episodeFrames.every((image) => imageReady(image))
    },
    configure(options: Partial<Iso4WorkshopOptions>) {
      const fragments = options.fragmentsPerPacket ?? workshopOptions.fragmentsPerPacket
      const colorScript = options.colorScript ?? workshopOptions.colorScript
      const samplingStrategy = options.samplingStrategy ?? workshopOptions.samplingStrategy
      if (![3, 6, 9].includes(fragments)) throw new Error('fragmentsPerPacket must be 3, 6, or 9')
      if (!['archival-warm', 'spectral-pearl', 'bichromatic-field'].includes(colorScript)) {
        throw new Error('unknown ISO4 color script')
      }
      if (!['uniform', 'importance', 'hybrid'].includes(samplingStrategy)) {
        throw new Error('unknown ISO4 sampling strategy')
      }
      workshopOptions = { fragmentsPerPacket: fragments, colorScript, samplingStrategy }
      for (const seed of bitsSeed) seed.sampledRevision = -1
      sourceMappingRevision = -1
      sourceMappingStrategy = null
      assignSourceMappings(true)
      if (!running) draw(elapsed)
    },
    start() {
      if (running) return
      // Software WebGL cannot sustain even the mechanically safe 324 tier on
      // the reference SwiftShader path. Present the same completed, source-
      // grounded reduced-motion tableau instead of playing a two-fps sequence
      // that drops physical film ticks. Hardware renderers keep the live 648
      // path; the quality decision is made before emission and never changes
      // packet accounting mid-flight.
      if (softwareRenderer) {
        this.still(STILL_T)
        return
      }
      const canResumeLiveHistory = useMovingMedia
        && hasLiveMediaHistory
        && Number.isFinite(lastFilmFrame)
        && Number.isFinite(lastWrittenFrame)
      const canResumeSettledTerminal = elapsed >= OUTPUT_TERMINAL_COMPLETE
        && screenCtxs.every((screen) => screen.terminalSettled)
      const lateWithoutLiveHistory = elapsed >= BOOT.run && !canResumeLiveHistory
      running = true
      useMovingMedia = canResumeSettledTerminal ? useMovingMedia : !lateWithoutLiveHistory
      movingMediaPlaying = false
      terminalMediaPaused = canResumeSettledTerminal
      temporalMediaResetRequested = !canResumeLiveHistory && !canResumeSettledTerminal
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
      gateProjectionPhaseContractActive = false
      freshGateExpectedTimelineError = 0
      maxFreshGateExpectedTimelineError = 0
      freshGatePresentedFrameError = 0
      maxFreshGatePresentedFrameError = 0
      gateProjectionPhaseError = 0
      projectionPresentedRevision = 0
      projectionPresentedMediaTime = 0
      projectionPresentationTimes.length = 0
      outputTextureTimes.length = 0
      renderFrameTimes.length = 0
      updateWallTimes.length = 0
      renderWallTimes.length = 0
      filmTexturePrepTimes.length = 0
      outputTexturePrepTimes.length = 0
      timelineStart = performance.now() / 1000 - elapsed
      if (canResumeSettledTerminal) {
        mediaPlayAttempt += 1
        episodeVideo.pause()
        projectionVideo.pause()
        cancelProjectionFrame()
      } else if (lateWithoutLiveHistory) enterDeterministicMediaFallback()
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
      const sourceExpected = wrapMediaTime(t)
      const projectionExpected = wrapMediaTime(t - PROJECTION_DELAY_SECONDS)
      const redrawStill = () => {
        if (running) return
        lastProjectedVideoRevision = Number.NaN
        layout()
        draw(t)
      }
      const holdFrame = (video: HTMLVideoElement, time: number) => {
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) return
        const settle = () => {
          video.pause()
          redrawStill()
        }
        const seekAndShow = () => {
          void video.play().then(settle, settle)
        }
        video.currentTime = time
        if (Math.abs((video.currentTime || 0) - time) < 0.04 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          seekAndShow()
          return
        }
        video.addEventListener('seeked', seekAndShow, { once: true })
      }
      holdFrame(episodeVideo, sourceExpected)
      holdFrame(projectionVideo, projectionExpected)
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
