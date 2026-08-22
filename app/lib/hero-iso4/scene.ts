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
  prepare(): void
  start(): void
  stop(): void
  still(t?: number): void
  configure(options: Partial<Iso4WorkshopOptions>): void
  sourceReady(): boolean
  inspect(t: number): Iso4MotionDiagnostics
  packetCentroidsInFilmWidths(t: number): number[]
  temporal(): Iso4TemporalDiagnostics
  resize(): void
  destroy(): void
}

export type Iso4ColorScript = 'archival-warm' | 'spectral-pearl' | 'bichromatic-field' | 'information-red'
export type Iso4SamplingStrategy = 'uniform' | 'importance' | 'hybrid' | 'screen-grid'
export type Iso4EntranceTrajectory = 'shallow-toss' | 'depth-swish' | 'frontal-toss'
export type Iso4FractureStyle = 'planar' | 'depth-forward' | 'balanced'
export type Iso4FieldKernel = 'screened' | 'compact' | 'gaussian'

export interface Iso4WorkshopOptions {
  fragmentsPerPacket: 3 | 6 | 9
  colorScript: Iso4ColorScript
  samplingStrategy: Iso4SamplingStrategy
  entranceTrajectory: Iso4EntranceTrajectory
  fractureStyle: Iso4FractureStyle
  fieldKernel: Iso4FieldKernel
  tangentialRetention: 0.15 | 0.22 | 0.3
  attractionTime: 0.58 | 0.68 | 0.78
  mouthRadiusScale: 1.05 | 1.12 | 1.2
  fieldIntegrationHz: 120 | 240
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
  digitalMemoryFragments: number
  sourceShapeRetention: number
  fragmentsPerPacket: number
  fragmentsPerFilmCell: number
  colorScript: Iso4ColorScript
  samplingStrategy: Iso4SamplingStrategy
  entranceTrajectory: Iso4EntranceTrajectory
  fractureStyle: Iso4FractureStyle
  fieldKernel: Iso4FieldKernel
  tangentialRetention: number
  attractionTime: number
  mouthRadiusScale: number
  capturedLogicalPackets: number
  naturalCapturePackets: number
  captureTimeP50: number
  captureTimeP95: number
  captureTimeMax: number
  deepThroatHornArcProgress: number
  minRegistrationRunwaySeconds: number
  fieldPrecomputeMs: number
  fieldIntegrationHz: number
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
  freshGateDecoderFrameErrorFrames: number
  maxFreshGateDecoderFrameErrorFrames: number
  gateProjectionCorrections: number
  // Observational only after a developed physical cell begins recirculating.
  // A 36-cell/16fps loop and a 108-frame/24fps source have different periods.
  gateProjectionPhaseErrorFrames: number
  movingMediaPlaying: boolean
  terminalMediaPaused: boolean
  settledOutputTextures: number
  usingDeterministicFallback: boolean
  updateWallTimeP50Ms: number
  updateWallTimeP95Ms: number
  updateWallTimeP99Ms: number
  updateWallTimeMaxMs: number
  renderWallTimeP50Ms: number
  renderWallTimeP95Ms: number
  renderWallTimeP99Ms: number
  renderWallTimeMaxMs: number
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
  colorScript: 'information-red',
  samplingStrategy: 'screen-grid',
  entranceTrajectory: 'depth-swish',
  fractureStyle: 'planar',
  fieldKernel: 'gaussian',
  tangentialRetention: 0.22,
  attractionTime: 0.68,
  mouthRadiusScale: 1.12,
  fieldIntegrationHz: 240,
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
  // The stock must run between the reel flanges. Giving the flange assembly
  // exactly FILM_W depth left the lower half-wrap coplanar with the front
  // flange, so transparent film triangles painted across its face like a
  // loose tongue hanging below the reel. A narrow 0.18 clearance per side
  // lets the opaque flange occlude the wrap while the tangent run, writer,
  // perforations and physical film width remain unchanged.
  w: FILM_W + 0.36,
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
const EPISODE_FRAME_URLS = [
  '/clips/ep1-michael.jpg',
  '/clips/ep1-john.jpg',
  '/clips/ep1-john2.jpg',
] as const

// THE BOOT NARRATIVE: one file passes through an empty dashed boundary and
// dematerializes into suspended particles. A fixed writer on the lower reel absorbs exactly
// three logical packets (18 visible fragments) per frame-step; its isolated
// clunks accelerate to 16fps,
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
// after that final result appears, then stop the shared film/reel drive with a
// complete thumbnail centered in both fixed apertures. The writer and gate are
// separated by exactly 32 pitches, so they share one screen-space cell phase;
// their physical locations are not integer multiples of PITCH. Treating an
// integer transport tick as the finish left both apertures about one fifth of
// a cell off-center and exposed a fuzzy frame line in the terminal focal point.
const TERMINAL_COAST_START = OUTPUT_TERMINAL_BASE + OUTPUT_TERMINAL_GAP * 2 + 0.13
const TERMINAL_COAST_NOMINAL_DURATION = 0.85
// The threshold is kinematic, not a collision. The folder enters as a thrown
// prop, rises through one natural ballistic apex, and keeps that same
// acceleration while its representation changes from paper to information.
// Only the fully converted digital body meets the arrest plane below.
const FILE_ENTRANCE_AT = 0.22
const FILE_APEX_AT = 0.98
const FILE_CONTACT_AT = 1.8
const FILE_DESCENT_SECONDS = FILE_CONTACT_AT - FILE_APEX_AT
const FILE_TRANSIT_SECONDS = 0.36
const FILE_CLEAR_AT = FILE_CONTACT_AT + FILE_TRANSIT_SECONDS
// The perimeter is part of the throw's anticipation: one continuous dashed
// circuit begins as the prop enters and completes before first contact. It is
// not a loading indicator and never chases the crossing edge.
const THRESHOLD_DRAW_START = FILE_ENTRANCE_AT - 0.04
const THRESHOLD_DRAW_END = FILE_CONTACT_AT - 0.18
// Distance under constant gravity is g(t0*t + t^2/2) after threshold contact.
// Choosing g from the responsive folder height keeps contact/clear clocks
// identical across camera families while preserving true constant acceleration.
const FILE_TRANSIT_DISTANCE_FACTOR = FILE_DESCENT_SECONDS * FILE_TRANSIT_SECONDS
  + 0.5 * FILE_TRANSIT_SECONDS * FILE_TRANSIT_SECONDS
const gravityTransitFractionAt = (age: number) => age <= 0
  ? 0
  : THREE.MathUtils.clamp(
      (FILE_DESCENT_SECONDS * age + 0.5 * age * age) / FILE_TRANSIT_DISTANCE_FACTOR,
      0,
      1,
    )
const gravityTransitAgeAtFraction = (fraction: number) => Math.sqrt(
  FILE_DESCENT_SECONDS * FILE_DESCENT_SECONDS
    + 2 * THREE.MathUtils.clamp(fraction, 0, 1) * FILE_TRANSIT_DISTANCE_FACTOR,
) - FILE_DESCENT_SECONDS
// Collision is the one legitimate velocity discontinuity in the opening. Its
// lost momentum becomes a bounded outward pressure bloom. The first 90ms run
// at full speed; only then does local particle time collapse into the nearly
// suspended plume. The broad current is mathematically present from impact,
// but its C2 wall-clock envelope is negligible through the fracture impulse.
const FRACTURE_FULL_SPEED_SECONDS = 0.09
const FRACTURE_TIME_COLLAPSE_END = 0.27
const FRACTURE_PLUME_HOLD_END = 0.72
const FRACTURE_MEMORY_RELEASE_END = 1
const FRACTURE_SLOW_SCALE = 0.06
const FIELD_REFERENCE_AGE = 0.27
const minJerk = (v: number) => {
  const x = THREE.MathUtils.clamp(v, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
// Integral of 6u^5 - 15u^4 + 10u^3 from zero to u. It lets the local
// bullet-time clock slow continuously without sacrificing deterministic seek
// or making dropped render frames change the simulated result.
const minJerkIntegral = (v: number) => {
  const u = THREE.MathUtils.clamp(v, 0, 1)
  const u2 = u * u
  const u4 = u2 * u2
  return u4 * (u2 - 3 * u + 2.5)
}
const fractureEffectiveAgeAt = (age: number) => {
  if (age <= 0) return 0
  if (age <= FRACTURE_FULL_SPEED_SECONDS) return age
  const collapseDuration = FRACTURE_TIME_COLLAPSE_END - FRACTURE_FULL_SPEED_SECONDS
  if (age <= FRACTURE_TIME_COLLAPSE_END) {
    const u = (age - FRACTURE_FULL_SPEED_SECONDS) / collapseDuration
    return FRACTURE_FULL_SPEED_SECONDS + collapseDuration * (
      u + (FRACTURE_SLOW_SCALE - 1) * minJerkIntegral(u)
    )
  }
  const collapseDistance = FRACTURE_FULL_SPEED_SECONDS + collapseDuration * (
    1 + (FRACTURE_SLOW_SCALE - 1) * 0.5
  )
  return collapseDistance
    + (age - FRACTURE_TIME_COLLAPSE_END) * FRACTURE_SLOW_SCALE
}
const inverseMinJerk = (value: number) => {
  const target = THREE.MathUtils.clamp(value, 0, 1)
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (minJerk(mid) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
// drawFilm() advances in whole cells while filmTex.offset supplies the brief
// Geneva pull. Solve the terminal raw phase through that same nonlinear pull,
// then choose the nearest centered stop to the nominal 850ms coast. Since the
// integral of 1 - minJerk is exactly 0.5, duration follows directly from the
// required frame distance without introducing a speed discontinuity.
const terminalGatePath = (TOP_REEL.y - BOTTOM_REEL.y)
  + REEL.r * Math.PI
  + (TOP_REEL.y - lampY)
const terminalGatePhase = ((terminalGatePath / PITCH) % 1 + 1) % 1
const terminalCenteredPull = ((terminalGatePhase - 0.5) % 1 + 1) % 1
const terminalCenteredRawPhase = 0.58 + 0.42 * inverseMinJerk(terminalCenteredPull)
const terminalCoastStartFrames = FILM_FPS * (
  TERMINAL_COAST_START - BOOT.run - BOOT.runRamp / 2
)
const terminalNominalStopFrames = terminalCoastStartFrames
  + FILM_FPS * TERMINAL_COAST_NOMINAL_DURATION * 0.5
// The nearest centered cell is the deterministic two-shot. At the writer's
// thumbnail scale that valid split edit still resembles a double exposure, so
// finish on the immediately following centered, single-camera cell. This adds
// one calm 16fps pull without changing any writer or projection event.
const TERMINAL_FOCAL_CELL_ADVANCE = 1
const terminalCenteredStopFrames = Math.round(
  terminalNominalStopFrames - terminalCenteredRawPhase,
) + terminalCenteredRawPhase + TERMINAL_FOCAL_CELL_ADVANCE
const TERMINAL_COAST_DURATION = 2
  * (terminalCenteredStopFrames - terminalCoastStartFrames)
  / FILM_FPS
const TERMINAL_STOP_AT = TERMINAL_COAST_START + TERMINAL_COAST_DURATION
const STILL_T = TERMINAL_STOP_AT + 0.05
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
const SOURCE_PRESENTATION_LEAD_SECONDS = 1 / SOURCE_FPS
// Prime both decoded heads by one native frame. The exact physical gate cell
// remains the authority at a fresh first pass; a bounded correction below
// resolves the occasional two-frame phase split between independent decoders.
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
    // The CSS `md` breakpoint is not sufficient evidence that the complete
    // optical fan fits. Tablet-width canvases between 768 and 959px were
    // entering the desktop camera while still clipping the transcript at the
    // right edge. Keep the protected phone/tablet composition until there is
    // both physical width and a landscape-enough aspect for the desktop shot.
    const useDesktopLayout = W >= 960 && wide >= 1.05
    detailScale = useDesktopLayout ? 1.15 : 1
    camera.clearViewOffset()
    camera.aspect = wide

    if (useDesktopLayout) {
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
  // affects adjacent hits closer than 340ms; later source starts rejoin their
  // exact timing instead of accumulating editorial drift.
  const CAPTION_MIN_ACTIVE_SECONDS = 0.34
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
      // Chrome/Metal's decoded source head consistently presents one native
      // frame behind an assigned currentTime on cold activation, just like the
      // projection decoder. Prime that latency before the writer ever stamps
      // a persistent physical cell; ongoing playback then lands within the
      // provenance gate without seeking at each 16fps pull.
      episodeVideo.currentTime = wrapMediaTime(
        elapsed + SOURCE_PRESENTATION_LEAD_SECONDS,
      )
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
    image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => {
    const sourceWidth = image instanceof HTMLVideoElement
      ? image.videoWidth
      : image instanceof HTMLCanvasElement ? image.width : image.naturalWidth
    const sourceHeight = image instanceof HTMLVideoElement
      ? image.videoHeight
      : image instanceof HTMLCanvasElement ? image.height : image.naturalHeight
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
    // A physical cell may only claim live provenance when the decoder head is
    // actually within one native frame of the writer instant that funds it.
    // currentTime corrections are asynchronous, so assigning a desired media
    // time is not evidence that drawImage() can already see that frame. Fall
    // back atomically before touching the persistent slot rather than baking
    // stale live art into the loop and later calling the gate phase-safe.
    const expectedSourceFrame = mediaFrameIndex(timeForFrame(transportFrame + 1))
    const availableSourceFrame = episodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ? presentedMediaFrameIndex(episodeVideo.currentTime)
      : -1
    const frameCount = Math.round(SOURCE_DURATION * SOURCE_FPS)
    let provenanceError = availableSourceFrame - expectedSourceFrame
    if (provenanceError > frameCount / 2) provenanceError -= frameCount
    if (provenanceError < -frameCount / 2) provenanceError += frameCount
    if (availableSourceFrame < 0 || Math.abs(provenanceError) > 1) {
      enterDeterministicMediaFallback()
      return -1
    }
    const slot = filmSlot(writerPathCell, transportFrame)
    const c = filmSlotArt[slot]!
    renderFrameContent(c.getContext('2d')!, c.width, c.height, writerPathCell - transportFrame, false)
    filmSlotReady[slot] = true
    filmSlotWriteOrdinals[slot] = transportFrame
    filmSlotSourceFrames[slot] = availableSourceFrame
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
    // The loop is modeled as a paper-thin ribbon rather than a solid belt
    // captured between two flange volumes. Without an occlusion handoff, the
    // textured lower half-wrap remains visible around the front circumference
    // and reads as a loose vertical tongue below the reel. Keep the descending
    // stock fully present through the writer and right tangent, then tuck it
    // behind the opaque flange over a quarter-frame of travel. The hidden
    // geometry, UV loop, 36 physical slots and transport distance stay whole.
    const lowerWrapU = sAfterDescent / totalPath
    const lowerWrapHiddenU = (sAfterDescent + PITCH * 0.26) / totalPath
    filmMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        /* glsl */ `
          #include <map_fragment>
          float lowerWrapVisibility = 1.0 - smoothstep(
            ${lowerWrapU.toFixed(8)},
            ${lowerWrapHiddenU.toFixed(8)},
            vMapUv.x
          );
          diffuseColor.a *= lowerWrapVisibility;
          if (diffuseColor.a < 0.008) discard;
        `,
      )
    }
    filmMat.customProgramCacheKey = () => 'iso4-film-lower-wrap-occlusion-v1'
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
    const coilCore = cyl(coilR * 0.9, FILM_W - 0.14, M.coil, 'z', reel)
    coilCore.name = 'film-coil-core'
    const coilLap = cyl(coilR, FILM_W - 0.2, M.lap, 'z', reel)
    coilLap.name = 'film-coil-lap'
    // the archive's depth: winding laps on the coil's near face
    for (const wr of [0.38, 0.52, 0.66, 0.8]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(coilR * wr, 0.02, 6, 64),
        new THREE.MeshStandardMaterial({ color: 0x2e2a20, roughness: 1 }),
      )
      ring.position.z = FILM_W / 2 - 0.19
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
  // This is a straight tangent highlight, not another piece of stock. Its old
  // symmetric 4.5-frame plane continued below the reel tangent and exposed a
  // pair of perforation rails as a physically impossible hanging band. Keep
  // the useful lead-in above the writer, but terminate the catch exactly where
  // the real carrier turns behind the lower flange.
  const writerStockCatchTop = PITCH * 2.25
  const writerStockCatchBottom = Math.max(0.08, CHARGE_POINT.y - BOTTOM_REEL.y)
  const writerStockSpan = writerStockCatchTop + writerStockCatchBottom
  const writerStockCatchY = CHARGE_POINT.y
    + (writerStockCatchTop - writerStockCatchBottom) / 2
  for (const edgeZ of [-FILM_W / 2 + 0.025, FILM_W / 2 - 0.025]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.028, writerStockSpan), writerStockCatchMat)
    edge.rotation.y = Math.PI / 2
    edge.position.set(writerStockCatchX, writerStockCatchY, edgeZ)
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
    const perfY = CHARGE_POINT.y + i * PITCH / 4
    if (perfY < BOTTOM_REEL.y + 0.035) continue
    const taper = Math.pow(Math.max(0, 1 - Math.abs(i) / 10), 1.7)
    const perfMat = writerStockCatchMat.clone()
    perfMat.alphaMap = null
    perfMat.opacity = 0.018 + taper * 0.045
    writerPerfCatchMats.push(perfMat)
    for (const z of [-perfZ, perfZ]) {
      const perf = new THREE.Mesh(perfCatchGeometry, perfMat)
      perf.rotation.y = Math.PI / 2
      perf.position.set(writerStockCatchX + 0.002, perfY, z)
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
    physicalFrameOverride: HTMLCanvasElement | null = null,
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
      if (physicalFrameOverride) {
        drawImageCover(x, physicalFrameOverride, 0, 0, 524, 246)
      } else if (liveProjectionSource && projectionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
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
      const portraitSource = physicalFrameOverride
        ?? (liveProjectionSource && projectionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          ? projectionVideo
          : episodeFrames[0]!)
      if (portraitSource instanceof HTMLVideoElement
        || portraitSource instanceof HTMLCanvasElement
        || imageReady(portraitSource)) {
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
      // The 3.5px hard underprint already separates the words from footage.
      // A canvas blur plus scene bloom doubled the edge softness at oblique
      // phone scale, so the subtitle looked less crisp than the product.
      x.shadowColor = 'rgba(0,0,0,0)'
      x.shadowBlur = 0
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
          // Keep the product's lime Active Word convention, below the scene's
          // bloom threshold. Punch comes from timing, weight and the 8.5% hard
          // scale—not from a fluorescent halo around the glyphs.
          x.fillStyle = active ? '#a8cf42' : 'rgba(216,216,211,0.99)'
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
  const SOURCE_FOLDER_WIDTH = 1.88
  const SOURCE_FOLDER_TOP = 1.12
  const SOURCE_FOLDER_BOTTOM = -1
  const SOURCE_FOLDER_BODY_TOP = 0.8
  const SOURCE_SHELL_FACE_X = 0.028
  const SOURCE_LABEL_FACE_X = 0.034
  const SOURCE_LABEL_WIDTH = 1.52
  const SOURCE_LABEL_HEIGHT = 1.58
  const SOURCE_LABEL_CENTER_Y = -0.08
  const SOURCE_LABEL_CENTER_Z = 0.02
  // Solve contact from the desired impact centroid rather than aiming the toss
  // at the plane center and letting its horizontal momentum carry the cloud
  // past the horn. The folder still crosses the generous empty aperture
  // diagonally, but its last digital row arrests exactly over the established
  // bell. The shared mouth current can then peel the splayed plume without a
  // whole-cloud translation or an artificial regrouping state.
  const FILE_IMPACT_X = DROP.x - 0.28
  const FILE_IMPACT_Z = 0.08
  const FILE_IMPACT_YAW = -0.1
  const FILE_TRAJECTORIES = {
    'shallow-toss': {
      desktop: { x: 25.4, z: -1.6, yaw: -0.16 },
      mobile: { x: 23, z: -1.1, yaw: -0.15 },
    },
    'depth-swish': {
      desktop: { x: 29, z: -4, yaw: -0.2 },
      mobile: { x: 23.5, z: -1.8, yaw: -0.18 },
    },
    'frontal-toss': {
      desktop: { x: 22.8, z: -0.55, yaw: -0.12 },
      mobile: { x: 22.1, z: -0.45, yaw: -0.12 },
    },
  } as const
  const activeFileEntrance = () => {
    const trajectory = FILE_TRAJECTORIES[workshopOptions.entranceTrajectory]
    return mobileLayout ? trajectory.mobile : trajectory.desktop
  }
  const fileHorizontalProgressAt = (at: number) => Math.max(
    0,
    (at - FILE_ENTRANCE_AT) / (FILE_CONTACT_AT - FILE_ENTRANCE_AT),
  )
  const fileGravity = () => (
    (SOURCE_FOLDER_TOP - SOURCE_FOLDER_BOTTOM) * detailScale / FILE_TRANSIT_DISTANCE_FACTOR
  )
  const fileContactCenterY = () => PLANE_Y - SOURCE_FOLDER_BOTTOM * detailScale
  const fileApexCenterY = () => (
    fileContactCenterY() + 0.5 * fileGravity() * FILE_DESCENT_SECONDS ** 2
  )
  const fileImpactSolveRatio = FILE_TRANSIT_SECONDS / (FILE_CONTACT_AT - FILE_ENTRANCE_AT)
  const fileContactX = () => (
    (FILE_IMPACT_X + activeFileEntrance().x * fileImpactSolveRatio)
      / (1 + fileImpactSolveRatio)
  )
  const fileContactZ = () => (
    (FILE_IMPACT_Z + activeFileEntrance().z * fileImpactSolveRatio)
      / (1 + fileImpactSolveRatio)
  )
  const fileContactYaw = () => (
    (FILE_IMPACT_YAW + activeFileEntrance().yaw * fileImpactSolveRatio)
      / (1 + fileImpactSolveRatio)
  )
  const fileCenterXAt = (at: number) => {
    const entrance = activeFileEntrance()
    return THREE.MathUtils.lerp(entrance.x, fileContactX(), fileHorizontalProgressAt(at))
  }
  const fileCenterYAt = (at: number) => {
    const apexAge = at - FILE_APEX_AT
    return fileApexCenterY() - 0.5 * fileGravity() * apexAge * apexAge
  }
  const fileCenterZAt = (at: number) => {
    const entrance = activeFileEntrance()
    return THREE.MathUtils.lerp(entrance.z, fileContactZ(), fileHorizontalProgressAt(at))
  }
  const fileYawAt = (at: number) => {
    const entrance = activeFileEntrance()
    return THREE.MathUtils.lerp(entrance.yaw, fileContactYaw(), fileHorizontalProgressAt(at))
  }
  const fileBirthTimeAt = (fraction: number) => (
    FILE_CONTACT_AT + gravityTransitAgeAtFraction(fraction)
  )
  const bootFileMat = new THREE.MeshStandardMaterial({
    // Restrained manila stock establishes an immediately legible vanilla
    // folder before the threshold converts it into Bitter-red information.
    color: 0xd0ad70,
    roughness: 0.96,
    metalness: 0.005,
    transparent: true,
    opacity: 0,
    emissive: 0x75552f,
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
      depth: 0.018,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.008,
      bevelThickness: 0.004,
      curveSegments: 10,
    })
    // Stand the sleeve in the y/z plane so its face remains readable while
    // its leading lower edge passes vertically through the horizontal border.
    sleeveGeometry.rotateY(Math.PI / 2)
    sleeveGeometry.translate(0.009, 0, 0)
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
      // A contact sheet tucked into an ordinary manila folder: restrained
      // corner radius, a real stock margin on every side, and no floating
      // glass-screen treatment.
      lx.fillStyle = 'rgba(15,16,21,0.97)'
      lx.beginPath()
      lx.roundRect(10, 10, 620, 660, 14)
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

      // A literal Zoom/video-camera mark and wordmark establish the source at
      // first glance. The format remains a subordinate archival annotation.
      lx.fillStyle = '#4f8cff'
      lx.beginPath()
      lx.roundRect(34, 28, 70, 54, 12)
      lx.fill()
      lx.fillStyle = '#fff'
      lx.beginPath()
      lx.roundRect(47, 41, 30, 28, 7)
      lx.fill()
      lx.beginPath()
      lx.moveTo(76, 46)
      lx.lineTo(91, 39)
      lx.lineTo(91, 71)
      lx.lineTo(76, 64)
      lx.closePath()
      lx.fill()
      lx.fillStyle = 'rgba(250,247,240,0.96)'
      lx.font = '850 39px system-ui, sans-serif'
      lx.textAlign = 'left'
      lx.textBaseline = 'middle'
      lx.fillText('ZOOM', 122, 49)
      lx.fillStyle = 'rgba(250,247,240,0.58)'
      lx.font = '700 16px ui-monospace, monospace'
      lx.fillText('RAW RECORDING', 123, 72)
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
      lx.fillText('EPISODE 01 · MP4', 604, 616)
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
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(SOURCE_LABEL_WIDTH, SOURCE_LABEL_HEIGHT),
      bootLabelMat,
    )
    label.rotation.y = Math.PI / 2
    label.position.set(SOURCE_LABEL_FACE_X, SOURCE_LABEL_CENTER_Y, SOURCE_LABEL_CENTER_Z)
    label.renderOrder = 2
    bootFile.add(label)
  }
  bootFile.visible = false
  machineRoot.add(bootFile)
  // THE SCAN PLANE: only a demure dashed perimeter. Its interior is optically
  // empty; the moving breakup edge on the passing sleeve proves where the
  // transformation plane is without liquid, refraction, ripple, or impact.
  const PLANE_Y = lampY
  let planeMat: THREE.ShaderMaterial
  const planeUniforms = {
    uMap: { value: null as THREE.CanvasTexture | null },
    uColor: { value: new THREE.Color(0xff9d8a) },
    uDrawProgress: { value: 0 },
    uOpacity: { value: 0 },
  }
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
    planeUniforms.uMap.value = ptex
    planeMat = new THREE.ShaderMaterial({
      uniforms: planeUniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform vec3 uColor;
        uniform float uDrawProgress;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec4 dash = texture2D(uMap, vUv);

          // Arc length around the actual 6.9 x 4.8 world-space perimeter,
          // beginning at the rear-left corner and proceeding clockwise. The
          // nearest-edge test gives every border texel one stable path value;
          // only the already-authored dashes are revealed.
          const float insetX = 10.0 / 460.0;
          const float insetY = 10.0 / 340.0;
          const float edgeW = 6.9 * (1.0 - 2.0 * insetX);
          const float edgeH = 4.8 * (1.0 - 2.0 * insetY);
          const float perimeter = 2.0 * (edgeW + edgeH);
          float dTop = abs(vUv.y - (1.0 - insetY));
          float dRight = abs(vUv.x - (1.0 - insetX));
          float dBottom = abs(vUv.y - insetY);
          float dLeft = abs(vUv.x - insetX);
          float nearest = min(min(dTop, dRight), min(dBottom, dLeft));
          float path;
          if (nearest == dTop) {
            path = clamp((vUv.x - insetX) / (1.0 - 2.0 * insetX), 0.0, 1.0) * edgeW;
          } else if (nearest == dRight) {
            path = edgeW
              + clamp(((1.0 - insetY) - vUv.y) / (1.0 - 2.0 * insetY), 0.0, 1.0) * edgeH;
          } else if (nearest == dBottom) {
            path = edgeW + edgeH
              + clamp(((1.0 - insetX) - vUv.x) / (1.0 - 2.0 * insetX), 0.0, 1.0) * edgeW;
          } else {
            path = edgeW * 2.0 + edgeH
              + clamp((vUv.y - insetY) / (1.0 - 2.0 * insetY), 0.0, 1.0) * edgeH;
          }
          float pathProgress = path / perimeter;
          float reveal = 1.0 - smoothstep(
            uDrawProgress - 0.009,
            uDrawProgress + 0.009,
            pathProgress
          );
          float head = (1.0 - smoothstep(0.0, 0.028, abs(pathProgress - uDrawProgress)))
            * step(uDrawProgress, 0.995);
          float alpha = dash.a * uOpacity * reveal * (1.0 + head * 0.22);
          if (alpha < 0.002) discard;
          gl_FragColor = vec4(uColor * (1.0 + head * 0.08), alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
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
    captureTime: number
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
    const localY = THREE.MathUtils.lerp(SOURCE_FOLDER_TOP, SOURCE_FOLDER_BOTTOM, v)
    const localZ = SOURCE_LABEL_CENTER_Z - (u - 0.5) * SOURCE_FOLDER_WIDTH
    const labelU = 0.5 + (SOURCE_LABEL_CENTER_Z - localZ) / SOURCE_LABEL_WIDTH
    const labelV = 0.5 - (localY - SOURCE_LABEL_CENTER_Y) / SOURCE_LABEL_HEIGHT
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
    return [0.71 * edgeShade, 0.55 * edgeShade, 0.35 * edgeShade]
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
  const bitsDigitalMemory = new Float32Array(MAX_VISIBLE_FRAGMENTS)
  const trailPos = new Float32Array(MAX_VISIBLE_FRAGMENTS * 6)
  const trailColor = new Float32Array(MAX_VISIBLE_FRAGMENTS * 6)
  const bitsSeed: ParticleSeed[] = []
  for (let packetIndex = 0; packetIndex < LOGICAL_PACKETS; packetIndex++) {
    const packet = packetBases[packetIndex]!
    const targetFrame = Math.floor(packetIndex / PARTICLES_PER_FRAME) + 1
    const arrivalTime = timeForFrame(targetFrame)
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
        captureTime: FILE_CLEAR_AT,
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
  const SCREEN_GRID_BODY_COLUMN_ORDER = [0, 7, 3, 10, 5, 1, 8, 4, 11, 6, 2, 9] as const
  const SCREEN_GRID_TAB_COLUMN_ORDER = [0, 3, 5, 2, 4, 1] as const
  const screenGridCoordinates = (packetIndex: number, microIndex: number) => {
    // Each supported density preserves three local rows per packet family:
    // 324 = 1 x 3, 648 = 2 x 3, 972 = 3 x 3. This lets density tests change
    // spatial resolution without changing the folder silhouette or smuggling
    // extra rows outside it at the nine-fragment ceiling.
    const microColumns = workshopOptions.fragmentsPerPacket / 3
    const subColumn = microIndex % microColumns
    const subRow = Math.floor(microIndex / microColumns)
    if (packetIndex < 96) {
      // At the accepted six-fragment density, 96 packet families make a
      // 24 x 24 screen-door field across the folder body. Every logical
      // packet owns one local 2 x 3 tile neighborhood.
      const macroColumn = SCREEN_GRID_BODY_COLUMN_ORDER[packetIndex % 12]!
      const macroRow = Math.floor(packetIndex / 12)
      const columns = 12 * microColumns
      const column = macroColumn * microColumns + subColumn
      const row = macroRow * 3 + subRow
      const localY = -1 + ((row + 0.5) / 24) * 1.8
      return {
        u: (column + 0.5) / columns,
        v: (1.12 - localY) / 2.12,
      }
    }
    // The remaining twelve families form a narrower 12 x 6 field in the tab.
    // Its upper row pinches with the physical silhouette rather than emitting
    // square pixels from the empty corners of the folder's bounding box.
    const tabPacket = packetIndex - 96
    const macroColumn = SCREEN_GRID_TAB_COLUMN_ORDER[tabPacket % 6]!
    const macroRow = Math.floor(tabPacket / 6)
    const row = macroRow * 3 + subRow
    const rowProgress = (row + 0.5) / 6
    const uMin = THREE.MathUtils.lerp(0.055, 0.12, rowProgress)
    const uMax = THREE.MathUtils.lerp(0.62, 0.55, rowProgress)
    const columns = 6 * microColumns
    const column = macroColumn * microColumns + subColumn
    const localY = 0.8 + rowProgress * 0.3
    return {
      u: THREE.MathUtils.lerp(uMin, uMax, (column + 0.5) / columns),
      v: (1.12 - localY) / 2.12,
    }
  }
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
      // search the complete source in two dimensions. Source ownership is a
      // property of the recording, never of a later movement schedule.
      const allowGlobalImportance = packetIndex % 4 === 3
      for (let candidate = 0; candidate < 16; candidate++) {
        const u = fract(uniformU + (candidate - 5.5) * 0.071 + packetIndex * 0.013)
        const v = allowGlobalImportance
          ? THREE.MathUtils.clamp(fract((packetIndex + 1) * 0.5698402909980532 + candidate * 0.3819660112501051), 0.02, 0.98)
          : THREE.MathUtils.clamp(uniformV + (candidate - 7.5) * 0.0042, 0.02, 0.98)
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
        if (workshopOptions.samplingStrategy === 'screen-grid') {
          const source = screenGridCoordinates(packetIndex, microIndex)
          seed.sourceU = source.u
          seed.sourceV = source.v
        } else {
          const radius = 0.012 + 0.025 * Math.sqrt((microIndex + 0.5) / MAX_FRAGMENTS_PER_PACKET)
          const angle = seed.microAngle + packetIndex * 0.37
          seed.sourceU = fract(centerU + Math.cos(angle) * radius)
          // A packet keeps a small recognizable source neighborhood. Vertical
          // spread stays narrow so siblings leave within a few milliseconds.
          seed.sourceV = THREE.MathUtils.clamp(centerV + Math.sin(angle) * 0.0036, 0.02, 0.98)
        }
        seed.birthTime = fileBirthTimeAt(sourceBirthFraction(seed.sourceU, seed.sourceV))
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
  bitsGeo.setAttribute('aDigitalMemory', new THREE.BufferAttribute(bitsDigitalMemory, 1))
  const particleVertex = /* glsl */ `
    attribute float aSize;
    attribute float aAlpha;
    attribute float aHaloAlpha;
    attribute float aShape;
    attribute float aDigitalMemory;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vHaloAlpha;
    varying float vShape;
    varying float vDigitalMemory;
    uniform float uPointScale;
    uniform float uSizeScale;
    void main() {
      vColor = color;
      vAlpha = aAlpha;
      vHaloAlpha = aHaloAlpha;
      vShape = aShape;
      vDigitalMemory = aDigitalMemory;
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
      varying float vDigitalMemory;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        // At the threshold, the source becomes a field of restrained digital
        // tiles. Their screen-stable square grammar keeps the sampled image
        // legible; rotation, aspect variation and soft shard edges arrive only
        // as the remembered folder relaxes into volumetric material.
        float dispersed = 1.0 - vDigitalMemory;
        float angle = (vShape * 1.0472 + 0.34) * dispersed;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        p = rotation * p;
        float aspect = mix(1.0, 0.58 + 0.12 * mod(vShape, 3.0), dispersed);
        p.x /= aspect;
        float roundRadius = length(p) * 2.0;
        float shardRadius = max(abs(p.x) * 1.72, abs(p.y) * 1.42);
        float tileRadius = max(abs(p.x), abs(p.y)) * 2.0;
        float particleRadius = mix(roundRadius, shardRadius, 0.38);
        float radius = mix(tileRadius, particleRadius, dispersed);
        float body = 1.0 - smoothstep(0.46, 0.98, radius);
        float core = 1.0 - smoothstep(0.0, 0.42, radius);
        float particleAlpha = vAlpha * 0.65 * body + (0.08 + vAlpha * 0.75) * core;
        // A screen-door tile is a piece of information, not a tiny lamp. Give
        // it a nearly flat, crisply bounded core; otherwise hundreds of soft
        // radial ramps compound into the red fog bank this stage is meant to
        // avoid. The familiar photographic falloff returns only at the neck.
        float digitalBody = 1.0 - smoothstep(0.88, 0.98, tileRadius);
        float digitalAlpha = min(0.38, 0.035 + vAlpha * 1.08) * digitalBody;
        float alpha = mix(digitalAlpha, particleAlpha, dispersed);
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
  let freshGateDecoderFrameError = 0
  let maxFreshGateDecoderFrameError = 0
  let gateProjectionCorrections = 0
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
  // Source ownership -> suspended volume -> curved horn -> ordered stream.
  // Every particle is born on the invisible threshold with the folder's exact
  // ballistic state. The completed information object then shatters against
  // one arrest plane and continues as a living, time-dilated cloud while a
  // broad intake current bends it through one asymmetric volume. A rotation-
  // minimizing Bishop frame keeps that volume from flipping or accumulating
  // the arbitrary twist of a Frenet frame.
  const CLOUD_CENTER_X = DROP.x - 0.28
  const CLOUD_CENTER_Y = PLANE_Y - 0.93
  const CLOUD_CENTER_Z = 0.08
  // Crossing changes material state but not motion: every released block stays
  // locked to the same accelerating folder until the last source row clears.
  // That completed digital body then meets one common arrest plane. The impact
  // is the shared release cue, so shatter reads as one causal event rather than
  // 648 independently scheduled post-clear launches.
  const DIGITAL_MEMORY_RELEASE_AT = FILE_CLEAR_AT
  const PARTICLE_HORN_END = 0.84
  // The first 80% of the accepted horn is cadence-free. Every captured packet
  // traverses it in the same physical duration; exact film timing is allowed
  // to shape motion only after this deep-throat boundary.
  // u=.72 maps to arc s≈.776 under the accepted endpoint-speed profile: deep
  // enough for invisible cadence correction, but before the final neck. A
  // 950ms common traverse preserves the calm peel and leaves the first cohort
  // at least 280ms for its bounded registration seat.
  const DEEP_THROAT_HORN_U = 0.72
  const FIELD_TO_DEEP_THROAT_SECONDS = 0.95
  const CADENCE_FREE_HORN_SECONDS = FIELD_TO_DEEP_THROAT_SECONDS / DEEP_THROAT_HORN_U
  const MIN_REGISTRATION_SECONDS = 0.28
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
  const digitalTransitionAt = (sd: (typeof bitsSeed)[number], at: number) => {
    void sd
    // All 648 tiles share one impact clock. They keep the recognizable
    // screen-door body through the fast impulse, then soften together while
    // local time collapses. Later spatial capture cannot make the folder
    // appear to dissolve before the common fracture has happened.
    const age = at - DIGITAL_MEMORY_RELEASE_AT
    const spread = minJerk((age - 0.08) / (FRACTURE_PLUME_HOLD_END - 0.08))
    const materialSpread = minJerk((age - 0.24) / (FRACTURE_MEMORY_RELEASE_END - 0.24))
    return {
      memory: 1 - spread,
      spread,
      visualMemory: 1 - materialSpread,
    }
  }
  const fileSourcePointAt = (
    sd: (typeof bitsSeed)[number],
    at: number,
    out: Float32Array,
    o: number,
  ) => {
    const sourceFace = sourceFaceCoordinates(sd.sourceU, sd.sourceV)
    const localX = (
      sourceFace.onLabel ? SOURCE_LABEL_FACE_X : SOURCE_SHELL_FACE_X
    ) * detailScale
    const localY = sourceFace.localY * detailScale
    const localZ = sourceFace.localZ * detailScale
    const yaw = fileYawAt(at)
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    out[o] = fileCenterXAt(at) + c * localX + s * localZ
    out[o + 1] = fileCenterYAt(at) + localY
    out[o + 2] = fileCenterZAt(at) - s * localX + c * localZ
  }
  const cloudStartP = new Float32Array(3)
  const hornEndP = new Float32Array(3)
  const hornBeforeEndP = new Float32Array(3)
  const hornBeforeEnd2P = new Float32Array(3)
  const particleTransferSeconds = (sd: (typeof bitsSeed)[number]) => {
    void sd
    return 0.052
  }
  const hornArcAtFlowU = (u: number) => {
    const uu = THREE.MathUtils.clamp(u, 0, 1)
    const u2 = uu * uu
    const u3 = u2 * uu
    const u4 = u3 * uu
    const u5 = u4 * uu
    return minJerk(uu) + 0.45 * (-4 * u3 + 7 * u4 - 3 * u5)
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
    const s = hornArcAtFlowU(uu)
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
  type PacketFieldPath = {
    positions: Float32Array
    velocities: Float32Array
    captureTime: number
    capturePosition: Float32Array
    captureVelocity: Float32Array
    captureAcceleration: Float32Array
    targetFrame: number
    arrivalTime: number
    slot: number
    score: number
    naturalCapture: boolean
  }
  type PacketImpactState = {
    position: THREE.Vector3
    incomingVelocity: THREE.Vector3
    fracture: THREE.Vector3
    predicted: THREE.Vector3
    score: number
    rank: number
    targetFrame: number
    arrivalTime: number
    slot: number
  }
  let packetFieldPaths: PacketFieldPath[] = []
  let packetFieldCacheKey = ''
  let packetFieldPrecomputeMs = 0
  const fieldMouthArc = 0.12
  const fieldVelocityResponseSeconds = 0.22
  const fieldFreeDrag = 0.82
  const fieldScratchA = new Float32Array(3)
  const fieldScratchB = new Float32Array(3)
  const fractureRateAt = (age: number) => {
    if (age <= FRACTURE_FULL_SPEED_SECONDS) return 1
    if (age >= FRACTURE_TIME_COLLAPSE_END) return FRACTURE_SLOW_SCALE
    return THREE.MathUtils.lerp(
      1,
      FRACTURE_SLOW_SCALE,
      minJerk(
        (age - FRACTURE_FULL_SPEED_SECONDS)
          / (FRACTURE_TIME_COLLAPSE_END - FRACTURE_FULL_SPEED_SECONDS),
      ),
    )
  }
  const attractionEnvelopeAt = (age: number) => age <= 0
    ? 0
    : 1 - Math.exp(-Math.pow(age / workshopOptions.attractionTime, 3))
  const packetImpactStateAt = (packetIndex: number) => {
    const position = new THREE.Vector3()
    const previous = new THREE.Vector3()
    const fracture = new THREE.Vector3()
    const sample = new Float32Array(3)
    const prior = new Float32Array(3)
    const packet = packetBases[packetIndex]!
    let count = 0
    for (let micro = 0; micro < workshopOptions.fragmentsPerPacket; micro++) {
      const seed = bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET + micro]!
      fileSourcePointAt(seed, FILE_CLEAR_AT, sample, 0)
      // The incoming ballistic derivative is part of the physical initial
      // condition, not the field integrator. Sample it at one fixed high-rate
      // interval so 120/240Hz comparisons do not reorder otherwise identical
      // packet ranks before integration has even begun.
      fileSourcePointAt(seed, FILE_CLEAR_AT - 1 / 960, prior, 0)
      position.add(new THREE.Vector3(sample[0]!, sample[1]!, sample[2]!))
      previous.add(new THREE.Vector3(prior[0]!, prior[1]!, prior[2]!))
      count += 1
    }
    position.multiplyScalar(1 / Math.max(1, count))
    previous.multiplyScalar(1 / Math.max(1, count))
    const incomingVelocity = position.clone().sub(previous).multiplyScalar(960)
    const sourceRadialY = (position.y - fileCenterYAt(FILE_CLEAR_AT))
      / (0.5 * (SOURCE_FOLDER_TOP - SOURCE_FOLDER_BOTTOM) * detailScale)
    const sourceRadialZ = (position.z - fileCenterZAt(FILE_CLEAR_AT))
      / (SOURCE_FOLDER_WIDTH * 0.5 * detailScale)
    if (workshopOptions.fractureStyle === 'planar') {
      fracture.set(
        packet.x * 0.32,
        // Preserve more of the folder plane's horizontal span in the frozen
        // plume. Nearly equal vertical/transverse variance rounded the
        // far-side residue into a closed crown under blur even though no
        // centroid regrouped. A restrained planar anisotropy keeps the peel
        // reading as an opening sheet without changing impulse magnitude.
        sourceRadialY * 0.58 + packet.y * 0.24,
        sourceRadialZ * 0.76 + packet.z * 0.24,
      ).multiplyScalar(4.3)
    } else if (workshopOptions.fractureStyle === 'depth-forward') {
      fracture.set(
        packet.x * 1.08 + 0.12,
        sourceRadialY * 0.28 + packet.y * 0.48,
        sourceRadialZ * 0.26 + packet.z * 0.62,
      ).multiplyScalar(3.55)
    } else {
      fracture.set(
        packet.x * 0.78 + 0.04,
        sourceRadialY * 0.46 + packet.y * 0.48,
        sourceRadialZ * 0.44 + packet.z * 0.62,
      ).multiplyScalar(3.8)
    }
    return {
      position,
      incomingVelocity,
      fracture,
      predicted: new THREE.Vector3(),
      score: 0,
      rank: 0,
      targetFrame: 1,
      arrivalTime: timeForFrame(1),
      slot: 0,
    } satisfies PacketImpactState
  }
  const fieldCacheSignature = () => [
    detailScale.toFixed(3),
    workshopOptions.fragmentsPerPacket,
    workshopOptions.samplingStrategy,
    workshopOptions.fractureStyle,
    workshopOptions.fieldKernel,
    workshopOptions.tangentialRetention,
    workshopOptions.attractionTime,
    workshopOptions.mouthRadiusScale,
    workshopOptions.fieldIntegrationHz,
    ...bitsSeed
      .filter((seed) => seed.microIndex < workshopOptions.fragmentsPerPacket)
      .slice(0, 18)
      .flatMap((seed) => [seed.sourceU.toFixed(4), seed.sourceV.toFixed(4)]),
  ].join('|')
  const ensurePacketFieldPaths = () => {
    const signature = fieldCacheSignature()
    if (packetFieldCacheKey === signature && packetFieldPaths.length === LOGICAL_PACKETS) return
    const precomputeStarted = performance.now()

    sampleHornFrame(fieldMouthArc)
    const mouthCenter = hornFrameCenter.clone()
    const mouthTangent = hornFrameTangent.clone()
    const mouthNormal = hornFrameNormal.clone()
    const mouthBinormal = hornFrameBinormal.clone()
    const states = Array.from({ length: LOGICAL_PACKETS }, (_, packetIndex) => (
      packetImpactStateAt(packetIndex)
    ))
    const meanFracture = states.reduce(
      (sum, state) => sum.add(state.fracture),
      new THREE.Vector3(),
    ).multiplyScalar(1 / LOGICAL_PACKETS)
    const referenceAge = FIELD_REFERENCE_AGE
    const referenceTravel = fractureEffectiveAgeAt(referenceAge)
    const longitudinalDistances: number[] = []
    const transverseRadii: number[] = []
    for (const state of states) {
      state.fracture.sub(meanFracture)
      const retainedIncoming = new THREE.Vector3(
        state.incomingVelocity.x * workshopOptions.tangentialRetention,
        state.incomingVelocity.y * 0.04,
        state.incomingVelocity.z * workshopOptions.tangentialRetention,
      )
      state.fracture.add(retainedIncoming)
      state.predicted.copy(state.position).addScaledVector(state.fracture, referenceTravel)
      const toMouth = mouthCenter.clone().sub(state.predicted)
      const longitudinal = toMouth.dot(mouthTangent)
      const normalDistance = toMouth.dot(mouthNormal)
      const binormalDistance = toMouth.dot(mouthBinormal)
      const transverse = Math.hypot(normalDistance, binormalDistance)
      const alignment = Math.max(0, state.fracture.clone().normalize().dot(mouthTangent))
      state.score = 1 / (0.18 + Math.max(0, longitudinal))
        + 0.32 * alignment
        - 0.08 * transverse
      longitudinalDistances.push(longitudinal)
      transverseRadii.push(transverse)
    }
    const ranked = states.slice().sort((a, b) => b.score - a.score)
    for (let rank = 0; rank < ranked.length; rank++) ranked[rank]!.rank = rank
    for (let cohort = 0; cohort < FRAME_GROUPS; cohort++) {
      const triplet = ranked.slice(
        cohort * PARTICLES_PER_FRAME,
        (cohort + 1) * PARTICLES_PER_FRAME,
      ).sort((a, b) => a.predicted.z - b.predicted.z)
      for (let slot = 0; slot < triplet.length; slot++) {
        const state = triplet[slot]!
        state.targetFrame = cohort + 1
        state.arrivalTime = timeForFrame(cohort + 1)
        state.slot = slot
      }
    }
    for (let packetIndex = 0; packetIndex < states.length; packetIndex++) {
      const state = states[packetIndex]!
      for (let micro = 0; micro < MAX_FRAGMENTS_PER_PACKET; micro++) {
        const seed = bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET + micro]!
        seed.targetFrame = state.targetFrame
        seed.arrivalTime = state.arrivalTime
        seed.slot = state.slot
        seed.sampledRevision = -1
      }
      packetBases[packetIndex]!.slot = state.slot
    }

    const rmsTransverse = Math.sqrt(
      transverseRadii.reduce((sum, radius) => sum + radius * radius, 0)
        / Math.max(1, transverseRadii.length),
    )
    const mouthRadius = Math.max(0.72, rmsTransverse * workshopOptions.mouthRadiusScale)
    const meanLongitudinal = longitudinalDistances.reduce((sum, value) => sum + value, 0)
      / Math.max(1, longitudinalDistances.length)
    const longitudinalSpread = Math.sqrt(
      longitudinalDistances.reduce(
        (sum, value) => sum + (value - meanLongitudinal) ** 2,
        0,
      ) / Math.max(1, longitudinalDistances.length),
    )
    const fieldLength = Math.max(0.8, longitudinalSpread * 2.4)
    const dt = 1 / workshopOptions.fieldIntegrationHz
    // Spatial capture has one shared horizon. Per-frame exposure clocks cannot
    // decide when the field stops integrating a packet or force it into the
    // horn. Natural capture order is measured first; only then are neighboring
    // triplets assigned to physical film cells.
    const latestCapture = timeForFrame(FRAME_GROUPS)
      - FIELD_TO_DEEP_THROAT_SECONDS
      - MIN_REGISTRATION_SECONDS
    packetFieldPaths = states.map((state) => {
      const capacity = Math.ceil((latestCapture - FILE_CLEAR_AT) * workshopOptions.fieldIntegrationHz) + 2
      const positions = new Float32Array(capacity * 3)
      const velocities = new Float32Array(capacity * 3)
      const p = state.position.clone()
      const fieldVelocity = new THREE.Vector3()
      const totalVelocity = state.fracture.clone()
      const previousTotalVelocity = new THREE.Vector3()
      const midpoint = new THREE.Vector3()
      const midpointFieldVelocity = new THREE.Vector3()
      const midpointTotalVelocity = new THREE.Vector3()
      const desiredVelocity = new THREE.Vector3()
      const fieldDelta = new THREE.Vector3()
      const toMouth = new THREE.Vector3()
      const edgeDirection = new THREE.Vector3()
      const rankProximity = 1 - state.rank / Math.max(1, LOGICAL_PACKETS - 1)
      // Proximity controls curvature, not merely cohort order. The far side
      // must keep coasting while the writer-facing edge peels away; a high
      // mobility floor translated the whole sheet into depth and made its
      // projected residue read as a regrouped ball.
      const mobility = THREE.MathUtils.lerp(0.18, 1.28, Math.pow(rankProximity, 1.15))
      const freeScaleAtAge = (age: number) => fractureRateAt(age)
        * Math.exp(-fieldFreeDrag * fractureEffectiveAgeAt(age))
      const desiredFieldVelocityAt = (
        position: THREE.Vector3,
        age: number,
        out: THREE.Vector3,
      ) => {
        toMouth.copy(mouthCenter).sub(position)
        const longitudinal = toMouth.dot(mouthTangent)
        const normalDistance = toMouth.dot(mouthNormal)
        const binormalDistance = toMouth.dot(mouthBinormal)
        const transverse = Math.hypot(normalDistance, binormalDistance)
        const upstream = Math.max(0, longitudinal)
        let kernel: number
        if (workshopOptions.fieldKernel === 'compact') {
          kernel = minJerk(1 - upstream / (fieldLength * 2.25))
        } else if (workshopOptions.fieldKernel === 'gaussian') {
          kernel = Math.exp(-0.5 * (upstream / fieldLength) ** 2)
        } else {
          // Screen the current without turning it into a near-singular point
          // pull. The finite floor keeps the far side inside the same current.
          const epsilon = 0.24
          const screened = Math.exp(-upstream / fieldLength) * epsilon / (upstream + epsilon)
          kernel = 0.16 + 0.84 * screened
        }
        const attraction = attractionEnvelopeAt(age)
        out.copy(mouthTangent).multiplyScalar(attraction * kernel * 7.4 * mobility)
        if (transverse > mouthRadius && transverse > 1e-6) {
          edgeDirection.copy(mouthNormal).multiplyScalar(normalDistance)
            .addScaledVector(mouthBinormal, binormalDistance)
            .multiplyScalar(1 / transverse)
          out.addScaledVector(
            edgeDirection,
            attraction * Math.min(2.2, (transverse - mouthRadius) * 3.2),
          )
        }
        return out
      }
      let fieldTravel = 0
      let captureIndex = capacity - 1
      let captureTime = latestCapture
      let capturePosition = new Float32Array(3)
      let captureVelocity = new Float32Array(3)
      let captureAcceleration = new Float32Array(3)
      let captured = false
      let previousSpeedMargin = Number.NaN
      let previousTravelMargin = Number.NaN
      let previousLongitudinalMargin = Number.NaN
      let previousTransverseMargin = Number.NaN
      const travelThreshold = 0.025 + 0.32 * Math.pow(1 - rankProximity, 1.35)
      for (let sampleIndex = 0; sampleIndex < capacity; sampleIndex++) {
        const at = FILE_CLEAR_AT + sampleIndex * dt
        const age = at - FILE_CLEAR_AT
        const i3 = sampleIndex * 3
        positions[i3] = p.x
        positions[i3 + 1] = p.y
        positions[i3 + 2] = p.z
        velocities[i3] = totalVelocity.x
        velocities[i3 + 1] = totalVelocity.y
        velocities[i3 + 2] = totalVelocity.z
        toMouth.copy(mouthCenter).sub(p)
        const longitudinal = toMouth.dot(mouthTangent)
        const normalDistance = toMouth.dot(mouthNormal)
        const binormalDistance = toMouth.dot(mouthBinormal)
        const transverse = Math.hypot(normalDistance, binormalDistance)
        // Track each sticky-mouth boundary as a signed continuous margin. When
        // all four have crossed, solve the latest crossing inside this fixed
        // step instead of snapping capture to the 120/240Hz grid.
        const speedMargin = fieldVelocity.dot(mouthTangent) / 0.24 - 1
        const travelMargin = fieldTravel / travelThreshold - 1
        const longitudinalMargin = (0.035 - longitudinal) / Math.max(0.08, fieldLength * 0.1)
        const transverseMargin = (mouthRadius * 1.2 - transverse) / Math.max(0.08, mouthRadius * 0.2)
        if (sampleIndex > 0
          && speedMargin >= 0
          && travelMargin >= 0
          && longitudinalMargin >= 0
          && transverseMargin >= 0) {
          captureIndex = sampleIndex
          const crossingU = (previous: number, current: number) => {
            if (!Number.isFinite(previous)) return 1
            if (previous >= 0) return 0
            return current > previous
              ? THREE.MathUtils.clamp(-previous / (current - previous), 0, 1)
              : 1
          }
          // Capture is the latest of the four continuous boundary crossings,
          // not an interpolation of their minimum. The latter mixed different
          // active constraints at adjacent samples and created rare half-step
          // packet swaps between 120 and 240Hz.
          const eventU = Math.max(
            crossingU(previousSpeedMargin, speedMargin),
            crossingU(previousTravelMargin, travelMargin),
            crossingU(previousLongitudinalMargin, longitudinalMargin),
            crossingU(previousTransverseMargin, transverseMargin),
          )
          captureTime = at - dt + eventU * dt
          const i0 = (sampleIndex - 1) * 3
          const u2 = eventU * eventU
          const u3 = u2 * eventU
          for (let axis = 0; axis < 3; axis++) {
            const p0 = positions[i0 + axis]!
            const p1 = positions[i3 + axis]!
            const v0 = velocities[i0 + axis]!
            const v1 = velocities[i3 + axis]!
            capturePosition[axis] = (2 * u3 - 3 * u2 + 1) * p0
              + (u3 - 2 * u2 + eventU) * dt * v0
              + (-2 * u3 + 3 * u2) * p1
              + (u3 - u2) * dt * v1
            captureVelocity[axis] = (
              (6 * u2 - 6 * eventU) * p0
              + (3 * u2 - 4 * eventU + 1) * dt * v0
              + (-6 * u2 + 6 * eventU) * p1
              + (3 * u2 - 2 * eventU) * dt * v1
            ) / dt
          }
          // The Hermite path is a render interpolant, not the governing ODE.
          // Derive acceleration from the continuous field equation at the
          // sub-step event so C2 carry is not integration-rate sensitive.
          const captureAge = captureTime - FILE_CLEAR_AT
          const freeScale = freeScaleAtAge(captureAge)
          const derivativeEpsilon = 1e-4
          const freeScaleDerivative = (
            freeScaleAtAge(captureAge + derivativeEpsilon)
              - freeScaleAtAge(Math.max(0, captureAge - derivativeEpsilon))
          ) / (captureAge < derivativeEpsilon ? derivativeEpsilon : 2 * derivativeEpsilon)
          midpoint.set(capturePosition[0]!, capturePosition[1]!, capturePosition[2]!)
          midpointFieldVelocity
            .set(captureVelocity[0]!, captureVelocity[1]!, captureVelocity[2]!)
            .addScaledVector(state.fracture, -freeScale)
          desiredFieldVelocityAt(midpoint, captureAge, desiredVelocity)
          midpointTotalVelocity.copy(desiredVelocity)
            .sub(midpointFieldVelocity)
            .multiplyScalar(1 / fieldVelocityResponseSeconds)
            .addScaledVector(state.fracture, freeScaleDerivative)
          captureAcceleration = new Float32Array([
            midpointTotalVelocity.x,
            midpointTotalVelocity.y,
            midpointTotalVelocity.z,
          ])
          captured = true
          break
        }
        previousSpeedMargin = speedMargin
        previousTravelMargin = travelMargin
        previousLongitudinalMargin = longitudinalMargin
        previousTransverseMargin = transverseMargin
        if (sampleIndex === capacity - 1) break

        previousTotalVelocity.copy(totalVelocity)
        const previousFieldSpeed = fieldVelocity.length()
        desiredFieldVelocityAt(p, age, desiredVelocity)
        midpointFieldVelocity.copy(fieldVelocity).addScaledVector(
          fieldDelta.copy(desiredVelocity).sub(fieldVelocity),
          1 - Math.exp(-dt * 0.5 / fieldVelocityResponseSeconds),
        )
        const midpointAge = age + dt * 0.5
        const midpointFreeScale = freeScaleAtAge(midpointAge)
        midpointTotalVelocity.copy(state.fracture)
          .multiplyScalar(midpointFreeScale)
          .add(midpointFieldVelocity)
        midpoint.copy(p).addScaledVector(midpointTotalVelocity, dt * 0.5)
        desiredFieldVelocityAt(midpoint, midpointAge, desiredVelocity)
        fieldVelocity.addScaledVector(
          fieldDelta.copy(desiredVelocity).sub(fieldVelocity),
          1 - Math.exp(-dt / fieldVelocityResponseSeconds),
        )
        const nextAge = age + dt
        const freeScale = freeScaleAtAge(nextAge)
        totalVelocity.copy(state.fracture).multiplyScalar(freeScale).add(fieldVelocity)
        p.addScaledVector(previousTotalVelocity, dt * 0.5)
          .addScaledVector(totalVelocity, dt * 0.5)
        fieldTravel += (previousFieldSpeed + fieldVelocity.length()) * dt * 0.5
      }
      if (!captured) {
        captureIndex = capacity - 1
        captureTime = FILE_CLEAR_AT + captureIndex * dt
        const last = captureIndex * 3
        const before = Math.max(0, captureIndex - 1) * 3
        capturePosition = positions.slice(last, last + 3)
        captureVelocity = velocities.slice(last, last + 3)
        // Match the actual left second derivative of the cubic-Hermite cache
        // at the feasibility endpoint.
        const captureAccelerationAt = (axis: number) => (
          6 * positions[before + axis]!
          - 6 * positions[last + axis]!
          + 2 * dt * velocities[before + axis]!
          + 4 * dt * velocities[last + axis]!
        ) / (dt * dt)
        captureAcceleration = new Float32Array([
          captureAccelerationAt(0),
          captureAccelerationAt(1),
          captureAccelerationAt(2),
        ])
      }
      return {
        positions: positions.slice(0, (captureIndex + 1) * 3),
        velocities: velocities.slice(0, (captureIndex + 1) * 3),
        captureTime,
        capturePosition,
        captureVelocity,
        captureAcceleration,
        targetFrame: state.targetFrame,
        arrivalTime: state.arrivalTime,
        slot: state.slot,
        score: state.score,
        naturalCapture: captured,
      }
    })
    // Mechanical accounting follows the field the simulation actually made,
    // not the pre-field ballistic estimate used only to establish bounded
    // mobility and runway. Capture-time neighbors fund the same physical cell;
    // stable depth order assigns its three registration rails without crossing.
    const capturedOrder = packetFieldPaths
      .map((path, packetIndex) => ({ path, packetIndex }))
      .sort((a, b) => a.path.captureTime - b.path.captureTime || b.path.score - a.path.score)
    for (let cohort = 0; cohort < FRAME_GROUPS; cohort++) {
      const triplet = capturedOrder
        .slice(cohort * PARTICLES_PER_FRAME, (cohort + 1) * PARTICLES_PER_FRAME)
        .sort((a, b) => a.path.capturePosition[2]! - b.path.capturePosition[2]!)
      for (let slot = 0; slot < triplet.length; slot++) {
        const { path, packetIndex } = triplet[slot]!
        path.targetFrame = cohort + 1
        path.arrivalTime = timeForFrame(cohort + 1)
        path.slot = slot
        packetBases[packetIndex]!.slot = slot
        for (let micro = 0; micro < MAX_FRAGMENTS_PER_PACKET; micro++) {
          const seed = bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET + micro]!
          seed.targetFrame = path.targetFrame
          seed.arrivalTime = path.arrivalTime
          seed.slot = slot
          seed.sampledRevision = -1
        }
      }
    }
    for (let packetIndex = 0; packetIndex < packetFieldPaths.length; packetIndex++) {
      const captureTime = packetFieldPaths[packetIndex]!.captureTime
      for (let micro = 0; micro < MAX_FRAGMENTS_PER_PACKET; micro++) {
        bitsSeed[packetIndex * MAX_FRAGMENTS_PER_PACKET + micro]!.captureTime = captureTime
      }
    }
    packetFieldCacheKey = signature
    packetFieldPrecomputeMs = performance.now() - precomputeStarted
  }
  const samplePacketFieldPath = (
    path: PacketFieldPath,
    at: number,
    out: Float32Array,
    o: number,
  ) => {
    const sample = THREE.MathUtils.clamp(
      (at - FILE_CLEAR_AT) * workshopOptions.fieldIntegrationHz,
      0,
      path.positions.length / 3 - 1,
    )
    const i0 = Math.min(path.positions.length / 3 - 1, Math.floor(sample))
    const i1 = Math.min(path.positions.length / 3 - 1, i0 + 1)
    const u = sample - i0
    const dt = 1 / workshopOptions.fieldIntegrationHz
    for (let axis = 0; axis < 3; axis++) {
      const p0 = path.positions[i0 * 3 + axis]!
      const p1 = path.positions[i1 * 3 + axis]!
      const v0 = path.velocities[i0 * 3 + axis]! * dt
      const v1 = path.velocities[i1 * 3 + axis]! * dt
      const u2 = u * u
      const u3 = u2 * u
      out[o + axis] = (2 * u3 - 3 * u2 + 1) * p0
        + (u3 - 2 * u2 + u) * v0
        + (-2 * u3 + 3 * u2) * p1
        + (u3 - u2) * v1
    }
  }
  const packetJourneyProgressAt = (sd: ParticleSeed, at: number) => {
    if (packetFieldPaths.length !== LOGICAL_PACKETS) ensurePacketFieldPaths()
    if (at <= sd.captureTime) return 0
    const throatTime = sd.captureTime + FIELD_TO_DEEP_THROAT_SECONDS
    if (at <= throatTime) {
      return PARTICLE_HORN_END * THREE.MathUtils.clamp(
        (at - sd.captureTime) / FIELD_TO_DEEP_THROAT_SECONDS,
        0,
        1,
      )
    }
    return PARTICLE_HORN_END + (1 - PARTICLE_HORN_END) * THREE.MathUtils.clamp(
      (at - throatTime) / Math.max(1e-4, sd.arrivalTime - throatTime),
      0,
      1,
    )
  }
  const packetTimeAtJourneyProgress = (sd: ParticleSeed, q: number) => {
    const progress = THREE.MathUtils.clamp(q, 0, 1)
    const throatTime = sd.captureTime + FIELD_TO_DEEP_THROAT_SECONDS
    if (progress <= PARTICLE_HORN_END) {
      return sd.captureTime
        + FIELD_TO_DEEP_THROAT_SECONDS * progress / PARTICLE_HORN_END
    }
    return throatTime
      + (sd.arrivalTime - throatTime)
        * (progress - PARTICLE_HORN_END) / (1 - PARTICLE_HORN_END)
  }
  const particleAt = (sd: (typeof bitsSeed)[number], at: number, out: Float32Array, o: number) => {
    if (at < sd.birthTime) return false
    if (at > FILE_CLEAR_AT && packetFieldPaths.length !== LOGICAL_PACKETS) ensurePacketFieldPaths()
    if (at > sd.arrivalTime + particleTransferSeconds(sd)) return false
    if (at <= FILE_CLEAR_AT) {
      fileSourcePointAt(sd, at, out, o)
      transformMachinePoint(particleMachineP0.set(out[o]!, out[o + 1]!, out[o + 2]!), at, particleMachineP0)
      out[o] = particleMachineP0.x
      out[o + 1] = particleMachineP0.y
      out[o + 2] = particleMachineP0.z
      return true
    }
    const path = packetFieldPaths[sd.packetIndex]!
    fileSourcePointAt(sd, FILE_CLEAR_AT, fieldScratchB, 0)
    const fragmentOffsetX = fieldScratchB[0]! - path.positions[0]!
    const fragmentOffsetY = fieldScratchB[1]! - path.positions[1]!
    const fragmentOffsetZ = fieldScratchB[2]! - path.positions[2]!
    const fractureOffsetScale = 1 + 0.4 * minJerk((at - FILE_CLEAR_AT) / 0.27)
    if (at < path.captureTime) {
      samplePacketFieldPath(path, at, fieldScratchA, 0)
      out[o] = fieldScratchA[0]! + fragmentOffsetX * fractureOffsetScale
      out[o + 1] = fieldScratchA[1]! + fragmentOffsetY * fractureOffsetScale
      out[o + 2] = fieldScratchA[2]! + fragmentOffsetZ * fractureOffsetScale
      transformMachinePoint(particleMachineP0.set(out[o]!, out[o + 1]!, out[o + 2]!), at, particleMachineP0)
      out[o] = particleMachineP0.x
      out[o + 1] = particleMachineP0.y
      out[o + 2] = particleMachineP0.z
      return true
    }
    const q = packetJourneyProgressAt(sd, at)
    cloudStartP[0] = path.capturePosition[0]! + fragmentOffsetX * 1.4
    cloudStartP[1] = path.capturePosition[1]! + fragmentOffsetY * 1.4
    cloudStartP[2] = path.capturePosition[2]! + fragmentOffsetZ * 1.4
    const cloudVx = path.captureVelocity[0]!
    const cloudVy = path.captureVelocity[1]!
    const cloudVz = path.captureVelocity[2]!
    const cloudAx = path.captureAcceleration[0]!
    const cloudAy = path.captureAcceleration[1]!
    const cloudAz = path.captureAcceleration[2]!
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

    const throatTime = sd.captureTime + FIELD_TO_DEEP_THROAT_SECONDS
    if (q < PARTICLE_HORN_END) {
      const u = DEEP_THROAT_HORN_U * q / PARTICLE_HORN_END
      hornFlowAt(
        sd,
        cloudVx,
        cloudVy,
        cloudVz,
        cloudAx,
        cloudAy,
        cloudAz,
        CADENCE_FREE_HORN_SECONDS,
        u,
        hornEndP,
        0,
      )
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
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, CADENCE_FREE_HORN_SECONDS, DEEP_THROAT_HORN_U, hornEndP, 0)
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, CADENCE_FREE_HORN_SECONDS, DEEP_THROAT_HORN_U - epsilon, hornBeforeEndP, 0)
      hornFlowAt(sd, cloudVx, cloudVy, cloudVz, cloudAx, cloudAy, cloudAz, CADENCE_FREE_HORN_SECONDS, DEEP_THROAT_HORN_U - 2 * epsilon, hornBeforeEnd2P, 0)
      const registerDuration = sd.arrivalTime - throatTime
      const derivativeScale = registerDuration / CADENCE_FREE_HORN_SECONDS
      const secondDerivativeScale = derivativeScale * derivativeScale
      const endpointVelocity = (axis: number) => (
        (3 * hornEndP[axis]! - 4 * hornBeforeEndP[axis]! + hornBeforeEnd2P[axis]!)
        / (2 * epsilon)
      ) * derivativeScale
      const endpointAcceleration = (axis: number) => (
        (hornEndP[axis]! - 2 * hornBeforeEndP[axis]! + hornBeforeEnd2P[axis]!)
        / (epsilon * epsilon)
      ) * secondDerivativeScale
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
    // The gravitational crossing is intentionally fast. Complete the local
    // source-to-block handoff in under three 60fps frames so the last row is
    // present at impact instead of fading in after the digital body shatters.
    // A bounded core exists on the exact birth sample. This closes the
    // full-clear accounting hole where the final row technically existed but
    // rendered with zero energy until the following frame.
    const materialize = 0.34 + 0.66 * minJerk((at - sd.birthTime) / 0.045)
    if (at < sd.captureTime) {
      const cloudBreath = 0.94 + 0.06 * Math.sin((at - sd.birthTime) * 0.72 + sd.orbit)
      const crossingShoulder = 1 - minJerk((at - (FILE_CLEAR_AT - 0.22)) / 0.22)
      const birthShoulder = 0.36
        * (1 - minJerk((at - sd.birthTime) / 0.52))
        * crossingShoulder
      return materialize * (0.36 + birthShoulder) * cloudBreath
    }
    const q = packetJourneyProgressAt(sd, at)
    // Organization is not extra energy. Hold the broad current near its
    // suspended luminance, then release the conserved gain only inside the
    // final compression/development interval. The former linear rise made the
    // horn shoulder look like a regrouped hot ball even while its geometry
    // remained wide.
    const coherence = 0.36
      + 0.12 * minJerk(q / 0.55)
      + 0.52 * minJerk((q - 0.72) / 0.28)
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
    const q = packetJourneyProgressAt(sd, at)
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
    // Information first appears as a monochrome Bitter-red screen-door field.
    // The source pixel contributes only restrained lightness, preserving a
    // ghost of faces/type without breaking the one-hue conversion metaphor.
    // Source/pearl chroma is admitted only after the folder silhouette opens.
    const digital = digitalTransitionAt(sd, at)
    const digitalLab: [number, number, number] = [
      // Red-on-red tonal encoding must survive the full-size homepage, not
      // merely a diagnostic crop. Preserve enough source contrast to read the
      // two recorded faces, header and metadata as information regions while
      // keeping every tile inside one Bitter-red hue family.
      THREE.MathUtils.clamp(salmonLab[0] + (sd.sourceLab[0] - 0.5) * 0.32, 0.44, 0.78),
      salmonLab[1],
      salmonLab[2],
    ]
    if (workshopOptions.samplingStrategy === 'screen-grid' && workshopOptions.colorScript === 'information-red') {
      // The source image survives as lightness structure only. Once released,
      // the information remains in one Bitter-red hue family all the way down
      // the horn; compression may raise energy, but never reintroduces manila,
      // skin, blue, or rainbow chroma as a magic-dust tail.
      const settledRed = mixLab(digitalLab, salmonLab, minJerk((digital.spread - 0.18) / 0.72))
      const redCompression = minJerk((q - 0.76) / 0.24)
      settledRed[0] = Math.min(0.9, settledRed[0] + redCompression * 0.09)
      settledRed[1] *= 1 - redCompression * 0.14
      settledRed[2] *= 1 - redCompression * 0.14
      return oklabToRgb(settledRed)
    }
    lab = mixLab(digitalLab, lab, digital.spread)
    return oklabToRgb(lab)
  }
  // Density changes projected surface through normal-blended cores. Sizes are
  // large enough to clear the disappeared-sleeve coverage floor; opacity falls
  // with area so integrated light remains approximately conserved.
  const fragmentSizeForDensity = () => ({ 3: 0.44, 6: 0.365, 9: 0.3 }[workshopOptions.fragmentsPerPacket])
  const fragmentAlphaForDensity = () => ({ 3: 0.18, 6: 0.135, 9: 0.11 }[workshopOptions.fragmentsPerPacket])
  const fragmentOpticsAt = (sd: ParticleSeed, at: number) => {
    const q = packetJourneyProgressAt(sd, at)
    const contactSeat = minJerk((q - 0.68) / 0.32)
    const shapeMemory = workshopOptions.samplingStrategy === 'screen-grid'
      // Positional drift begins while the material is still unmistakably a
      // field of square pixels. Blocks stay optically solid through the cloud
      // and horn shoulder; edge softness belongs only to the final neck where
      // information compresses into the emulsion.
      ? 1 - minJerk((q - 0.68) / 0.18)
      : digitalTransitionAt(sd, at).visualMemory
    // Area and edge softness are separate controls. Preserve the small square
    // information scale through the broad horn shoulder: enlarging hundreds of
    // captured blocks together made a spatially broad current read as one hot
    // ball. Size may resolve only after the gesture is already legible.
    const sizeMemory = workshopOptions.samplingStrategy === 'screen-grid'
      ? 1 - minJerk((q - 0.42) / 0.28)
      : shapeMemory
    const resolvedSizeFamily = workshopOptions.samplingStrategy === 'screen-grid'
      ? Math.min(sd.sizeFamily, 0.46)
      : sd.sizeFamily
    const sizeFamily = THREE.MathUtils.lerp(0.91, resolvedSizeFamily, 1 - sizeMemory)
    const digitalTileScale = workshopOptions.fragmentsPerPacket === 6 ? 0.24 : 0.28
    const activeContact = 1 - minJerk((Math.abs(at - sd.arrivalTime) - 0.006) / 0.022)
    const unrelatedThroat = minJerk((q - 0.5) / 0.22) * (1 - activeContact)
    const size = fragmentSizeForDensity()
      * THREE.MathUtils.lerp(digitalTileScale, sizeFamily, 1 - sizeMemory)
      * (workshopOptions.samplingStrategy === 'screen-grid' ? 1.08 : 1)
      // Preserve a readable solid footprint for each of the three active
      // contact clusters. Halos disappear at the writer; the cores should not
      // collapse into an indistinct one-pixel bead trail at homepage scale.
      * (1 - contactSeat * 0.44)
      * (1 - unrelatedThroat * 0.45)
      * (1 + activeContact * 0.32)
    const depthExtinction = 0.62 + 0.38 * sd.volumeRadius
    const contactCore = 1 - contactSeat * 0.52
    const digitalCoreCompensation = THREE.MathUtils.lerp(1.75, 1, 1 - sizeMemory)
    // Projected surface and luminance are separate controls. Keep the larger
    // solid cores that make dematerialization feel materially substantial,
    // but restrain their optical weight through the early shoulder so the
    // current does not overpower the still-planar residue into a flower/ball
    // gestalt. Full energy returns only for final compression and exposure.
    const earlyHornOpticalWeight = 1 - 0.38
      * minJerk(q / 0.2)
      * (1 - minJerk((q - 0.58) / 0.18))
    const alpha = particleEnergy(sd, at)
      * fragmentAlphaForDensity()
      * digitalCoreCompensation
      * depthExtinction
      * contactCore
      * earlyHornOpticalWeight
      * (1 - unrelatedThroat * 0.7)
      * (1 + activeContact * 0.12)
    return { alpha, contactSeat, digitalMemory: shapeMemory, size }
  }
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
    const framePhase = dist / PITCH
    const writePhase = t < BOOT.run ? 0 : Math.min(FRAME_GROUPS, 1 + framePhase)
    const chargeProgress = writePhase / FRAME_GROUPS
    let impactPulse = 0
    {
      const crossAge = t - FILE_CONTACT_AT
      const transitProgress = gravityTransitFractionAt(crossAge)
      const finalHit = timeForFrame(FRAME_GROUPS)
      // Only the perimeter exists. A single clockwise circuit draws in concert
      // with the throw and is complete 180ms before contact, so the boundary
      // feels prepared for the landing rather than passively pre-existing.
      // Its empty interior never splashes, refracts, ripples, or glows.
      const thresholdDraw = minJerk(
        (t - THRESHOLD_DRAW_START) / (THRESHOLD_DRAW_END - THRESHOLD_DRAW_START),
      )
      const borderOut = 1 - minJerk((t - (FILE_CLEAR_AT + 0.18)) / 0.72)
      planeUniforms.uDrawProgress.value = thresholdDraw
      planeUniforms.uOpacity.value = borderOut * 0.24
      dropFilmMat.uniforms.uTime!.value = motionTime
      dropFilmMat.uniforms.uImpact!.value = 0
      dropFilmMat.uniforms.uOpacity!.value = 0
      // The folder now enters under visible momentum rather than fading into a
      // waiting pose. Its natural apex supplies the recognition beat; the
      // same ballistic translation and restrained yaw continue through the
      // screen-door conversion until the complete body reaches arrest.
      const dissolve = transitProgress
      if (t >= FILE_ENTRANCE_AT && t < FILE_CLEAR_AT && dissolve < 0.9995) {
        bootFile.visible = true
        bootFile.position.set(fileCenterXAt(t), fileCenterYAt(t), fileCenterZAt(t))
        bootFile.scale.setScalar(detailScale)
        bootFile.rotation.set(0, fileYawAt(t), 0)
        // The last surviving geometry used to be the integrated folder tab,
        // which briefly read as a lid hovering over the cloud. Let the shell
        // finish with the same moving breakup front instead of leaving a clean
        // container-shaped cap after the printed face is gone.
        const shellOut = 1 - minJerk((dissolve - 0.82) / 0.14)
        bootFileMat.opacity = shellOut * 0.94
        bootFileMat.emissiveIntensity = 0.035
        bootSleeveUniforms.uSleeveDissolve.value = dissolve
        if (bootLabelMat) {
          bootLabelMat.uniforms.uOpacity!.value = 1
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
            bitsDigitalMemory[k] = 0
            trailPos[i6 + 1] = -999
            trailPos[i6 + 4] = -999
            continue
          }
          const energy = particleEnergy(sd, t)
          const color = particleColorAt(sd, t)
          const optics = fragmentOpticsAt(sd, t)
          const digitalMemory = optics.digitalMemory
          const q = packetJourneyProgressAt(sd, t)
          const contactSeat = minJerk((q - 0.68) / 0.32)
          // A cube-root volume distributes more points through the middle.
          // Attenuate its densest interior analytically so Beer-Lambert-like
          // overlap creates body without a white furnace.
          bitsColor[i3] = srgbToLinear(color[0])
          bitsColor[i3 + 1] = srgbToLinear(color[1])
          bitsColor[i3 + 2] = srgbToLinear(color[2])
          // Final registration should read as three compact contacts, not a
          // luminous strip continuing through the reel. Six overlapping cores
          // carry each packet's density, so their footprint can contract while
          // compression energy moves into the emulsion. Diffraction falls off
          // faster than the solid cores as the fragments seat on the film face.
          // Pixel blocks hold a near-uniform optical pitch; bounded size
          // families arrive only with the volumetric material so the threshold
          // reads as a screen-door conversion rather than decorative confetti.
          bitsSize[k] = optics.size
          bitsDigitalMemory[k] = digitalMemory
          bitsAlpha[k] = optics.alpha
          bitsHaloAlpha[k] = bitsAlpha[k]!
            * (1 - digitalMemory * 0.94)
            * (1 - contactSeat * 0.98)
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
        bitsGeo.attributes.aDigitalMemory!.needsUpdate = true
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
          if (writerSlot < 0) {
            movingMediaActive = false
            break
          }
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
        // During a fresh first pass, compare against the exact source instant
        // that funded this physical write ordinal. Sampling `t - delay` here
        // folds up to one late RAF into the contract and can manufacture a
        // two-frame error even when writer and presented output agree. The
        // separate presented-frame check below still measures the live output
        // head at this actual render instant. Recirculated cells retain the
        // rolling timeline diagnostic.
        const expectedProjectionFrame = gateProjectionPhaseContractActive
          ? mediaFrameIndex(timeForFrame(writeOrdinal + 1))
          : mediaFrameIndex(t - PROJECTION_DELAY_SECONDS)
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
            let decoderFrameError = lastGateSourceFrame - presentedMediaFrameIndex(projectionVideo.currentTime)
            if (decoderFrameError > frameCount / 2) decoderFrameError -= frameCount
            if (decoderFrameError < -frameCount / 2) decoderFrameError += frameCount
            freshGateDecoderFrameError = decoderFrameError
            maxFreshGateDecoderFrameError = Math.max(
              maxFreshGateDecoderFrameError,
              Math.abs(decoderFrameError),
            )
            // Two independent HTMLVideoElements can straddle opposite native
            // frame boundaries even while both satisfy their own semantic
            // clocks. On a fresh first gate pass the persistent physical cell
            // is the causal authority. If the decoder is two frames away,
            // paint that exact live-stamped cell into all three output
            // treatments for this single gate arrival, then let native 24fps
            // updates continue. This is a visible phase correction, not a
            // metric waiver or generated substitute.
            let presentedFrameError = decoderFrameError
            if (Math.abs(decoderFrameError) > 1) {
              const correctionStarted = performance.now()
              const correctionTime = wrapMediaTime((lastGateSourceFrame + 0.5) / SOURCE_FPS)
              for (let i = 0; i < screenCtxs.length; i++) {
                drawScreen(
                  screenCtxs[i]!,
                  lastGateSourceFrame,
                  false,
                  correctionTime,
                  outputTerminalProgressAt(t, FAN[i]!.sequence),
                  gateArt,
                )
              }
              recordTiming(outputTexturePrepTimes, performance.now() - correctionStarted)
              gateProjectionCorrections += 1
              outputTextureRevision += 1
              const correctionAt = performance.now() / 1000
              if (Number.isFinite(lastOutputTextureAt)) {
                longestOutputHold = Math.max(longestOutputHold, correctionAt - lastOutputTextureAt)
              }
              lastOutputTextureAt = correctionAt
              outputTextureTimes.push(correctionAt)
              lastProjectedVideoRevision = presentedMediaFrameIndex(projectionVideo.currentTime)
              lastProjectionSourceFrame = lastGateSourceFrame
              presentedFrameError = 0
            }
            freshGatePresentedFrameError = presentedFrameError
            maxFreshGatePresentedFrameError = Math.max(
              maxFreshGatePresentedFrameError,
              Math.abs(presentedFrameError),
            )
          } else {
            freshGateExpectedTimelineError = 0
            freshGatePresentedFrameError = 0
            freshGateDecoderFrameError = 0
          }
        } else {
          gateProjectionPhaseContractActive = false
          freshGateExpectedTimelineError = 0
          freshGatePresentedFrameError = 0
          freshGateDecoderFrameError = 0
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
    ensurePacketFieldPaths()
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
    let digitalMemoryFragments = 0
    let sourceShapeRetentionTotal = 0
    let sourceShapeRetentionSamples = 0
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
        const digitalMemory = digitalTransitionAt(seed, t).memory
        if (digitalMemory > 0.25) digitalMemoryFragments += 1
        if (t < seed.captureTime) {
          sourceShapeRetentionTotal += digitalMemory
          sourceShapeRetentionSamples += 1
        }
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
        if (t < seed.captureTime) {
          suspendedParticles += 1
        } else if (t <= seed.arrivalTime) {
          const q = packetJourneyProgressAt(seed, t)
          if (q < PARTICLE_HORN_END) {
            funnelingParticles += 1
            const u = DEEP_THROAT_HORN_U * q / PARTICLE_HORN_END
            const s = hornArcAtFlowU(u)
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
      const optics = fragmentOpticsAt(seed, t)
      const pointDiameter = optics.size * detailScale
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
      if (activeNow && t < seed.captureTime) suspendedScreenPoints.push(p0.clone())
      if (activeNow && t >= seed.captureTime) {
        const q = packetJourneyProgressAt(seed, t)
        if (q > 0.46 && q <= 1) {
          const packetPoints = packetScreenPoints.get(seed.packetIndex) ?? []
          packetPoints.push(p0.clone())
          packetScreenPoints.set(seed.packetIndex, packetPoints)
        }
      }
      const displayAlpha = optics.alpha
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
        const q = packetJourneyProgressAt(seed, t)
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
          const at = packetTimeAtJourneyProgress(seed, q)
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
      const localX = SOURCE_SHELL_FACE_X * detailScale
      const localY = sourceFace.localY * detailScale
      const localZ = sourceFace.localZ * detailScale
      const c = Math.cos(-0.1)
      const s = Math.sin(-0.1)
      const point = new THREE.Vector3(
        DROP.x - 0.1 + c * localX + s * localZ,
        PLANE_Y + SOURCE_FOLDER_TOP * detailScale + localY,
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
    const fileDissolve = gravityTransitFractionAt(t - FILE_CONTACT_AT)
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
      const currentCellPackets = Array.from({ length: LOGICAL_PACKETS }, (_, packet) => packet)
        .filter((packet) => (
          bitsSeed[packet * MAX_FRAGMENTS_PER_PACKET]!.targetFrame === completedFrames
        ))
      for (const packet of currentCellPackets) {
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
    const captureTimes = packetFieldPaths.map((path) => path.captureTime).sort((a, b) => a - b)
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
      digitalMemoryFragments,
      sourceShapeRetention: tidy(
        sourceShapeRetentionSamples ? sourceShapeRetentionTotal / sourceShapeRetentionSamples : 0,
      ),
      fragmentsPerPacket: workshopOptions.fragmentsPerPacket,
      fragmentsPerFilmCell: workshopOptions.fragmentsPerPacket * PARTICLES_PER_FRAME,
      colorScript: workshopOptions.colorScript,
      samplingStrategy: workshopOptions.samplingStrategy,
      entranceTrajectory: workshopOptions.entranceTrajectory,
      fractureStyle: workshopOptions.fractureStyle,
      fieldKernel: workshopOptions.fieldKernel,
      tangentialRetention: workshopOptions.tangentialRetention,
      attractionTime: workshopOptions.attractionTime,
      mouthRadiusScale: workshopOptions.mouthRadiusScale,
      capturedLogicalPackets: packetFieldPaths.filter((path) => path.captureTime <= t).length,
      naturalCapturePackets: packetFieldPaths.filter((path) => path.naturalCapture).length,
      captureTimeP50: tidy(captureTimes[Math.floor(captureTimes.length * 0.5)] ?? 0),
      captureTimeP95: tidy(captureTimes[Math.floor(captureTimes.length * 0.95)] ?? 0),
      captureTimeMax: tidy(captureTimes.at(-1) ?? 0),
      deepThroatHornArcProgress: tidy(hornArcAtFlowU(DEEP_THROAT_HORN_U)),
      minRegistrationRunwaySeconds: tidy(Math.min(...packetFieldPaths.map(
        (path) => path.arrivalTime - path.captureTime - FIELD_TO_DEEP_THROAT_SECONDS,
      ))),
      fieldPrecomputeMs: tidy(packetFieldPrecomputeMs),
      fieldIntegrationHz: workshopOptions.fieldIntegrationHz,
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
      freshGateDecoderFrameErrorFrames: freshGateDecoderFrameError,
      maxFreshGateDecoderFrameErrorFrames: maxFreshGateDecoderFrameError,
      gateProjectionCorrections,
      gateProjectionPhaseErrorFrames: gateProjectionPhaseError,
      movingMediaPlaying,
      terminalMediaPaused,
      settledOutputTextures: screenCtxs.filter((screen) => screen.terminalSettled).length,
      usingDeterministicFallback: !useMovingMedia,
      updateWallTimeP50Ms: tidy(percentile(updateWallTimes, 0.5)),
      updateWallTimeP95Ms: tidy(percentile(updateWallTimes, 0.95)),
      updateWallTimeP99Ms: tidy(percentile(updateWallTimes, 0.99)),
      updateWallTimeMaxMs: tidy(Math.max(0, ...updateWallTimes)),
      renderWallTimeP50Ms: tidy(percentile(renderWallTimes, 0.5)),
      renderWallTimeP95Ms: tidy(percentile(renderWallTimes, 0.95)),
      renderWallTimeP99Ms: tidy(percentile(renderWallTimes, 0.99)),
      renderWallTimeMaxMs: tidy(Math.max(0, ...renderWallTimes)),
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
    prepare() {
      layout()
      ensurePacketFieldPaths()
      // The folder is absent at t=0, so a t=0-only warm-up defers its material
      // and shadow variants until the first visible entrance frame. Render the
      // apex once under the SSR prepaint; the wrapper immediately restores t=0
      // before takeover, but the live entrance no longer pays shader cost.
      draw(FILE_APEX_AT)
    },
    sourceReady() {
      return episodeFrames.every((image) => imageReady(image))
    },
    configure(options: Partial<Iso4WorkshopOptions>) {
      const fragments = options.fragmentsPerPacket ?? workshopOptions.fragmentsPerPacket
      const colorScript = options.colorScript ?? workshopOptions.colorScript
      const samplingStrategy = options.samplingStrategy ?? workshopOptions.samplingStrategy
      const entranceTrajectory = options.entranceTrajectory ?? workshopOptions.entranceTrajectory
      const fractureStyle = options.fractureStyle ?? workshopOptions.fractureStyle
      const fieldKernel = options.fieldKernel ?? workshopOptions.fieldKernel
      const tangentialRetention = options.tangentialRetention ?? workshopOptions.tangentialRetention
      const attractionTime = options.attractionTime ?? workshopOptions.attractionTime
      const mouthRadiusScale = options.mouthRadiusScale ?? workshopOptions.mouthRadiusScale
      const fieldIntegrationHz = options.fieldIntegrationHz ?? workshopOptions.fieldIntegrationHz
      if (![3, 6, 9].includes(fragments)) throw new Error('fragmentsPerPacket must be 3, 6, or 9')
      if (!['archival-warm', 'spectral-pearl', 'bichromatic-field', 'information-red'].includes(colorScript)) {
        throw new Error('unknown ISO4 color script')
      }
      if (!['uniform', 'importance', 'hybrid', 'screen-grid'].includes(samplingStrategy)) {
        throw new Error('unknown ISO4 sampling strategy')
      }
      if (!['shallow-toss', 'depth-swish', 'frontal-toss'].includes(entranceTrajectory)) {
        throw new Error('unknown ISO4 entrance trajectory')
      }
      if (!['planar', 'depth-forward', 'balanced'].includes(fractureStyle)) {
        throw new Error('unknown ISO4 fracture style')
      }
      if (!['screened', 'compact', 'gaussian'].includes(fieldKernel)) {
        throw new Error('unknown ISO4 field kernel')
      }
      if (![0.15, 0.22, 0.3].includes(tangentialRetention)) {
        throw new Error('tangentialRetention must be 0.15, 0.22, or 0.3')
      }
      if (![0.58, 0.68, 0.78].includes(attractionTime)) {
        throw new Error('attractionTime must be 0.58, 0.68, or 0.78')
      }
      if (![1.05, 1.12, 1.2].includes(mouthRadiusScale)) {
        throw new Error('mouthRadiusScale must be 1.05, 1.12, or 1.2')
      }
      if (![120, 240].includes(fieldIntegrationHz)) {
        throw new Error('fieldIntegrationHz must be 120 or 240')
      }
      workshopOptions = {
        fragmentsPerPacket: fragments,
        colorScript,
        samplingStrategy,
        entranceTrajectory,
        fractureStyle,
        fieldKernel,
        tangentialRetention,
        attractionTime,
        mouthRadiusScale,
        fieldIntegrationHz,
      }
      for (const seed of bitsSeed) seed.sampledRevision = -1
      sourceMappingRevision = -1
      sourceMappingStrategy = null
      packetFieldCacheKey = ''
      packetFieldPaths = []
      assignSourceMappings(true)
      if (!running) draw(elapsed)
    },
    start() {
      if (running) return
      // Build the deterministic centroid cache during scene startup, before
      // the impact beat. Deferring this work until the first post-impact
      // particle update creates a visible main-thread hitch at the exact
      // moment the fracture should feel effortless.
      ensurePacketFieldPaths()
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
      freshGateDecoderFrameError = 0
      maxFreshGateDecoderFrameError = 0
      gateProjectionCorrections = 0
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
    packetCentroidsInFilmWidths(t: number) {
      const position = new Float32Array(3)
      const result: number[] = []
      for (let packetIndex = 0; packetIndex < LOGICAL_PACKETS; packetIndex++) {
        if (!packetCentroidAt(packetIndex, t, position, 0)) {
          result.push(Number.NaN, Number.NaN, Number.NaN)
          continue
        }
        result.push(position[0]! / IMG_W, position[1]! / IMG_W, position[2]! / IMG_W)
      }
      return result
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
