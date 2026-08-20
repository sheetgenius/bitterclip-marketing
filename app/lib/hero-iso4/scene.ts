/**
 * ISO4 — the particle-charged facing projector, descended from ISO3 and the
 * Canvas 2D study at /lab/iso. A modest-FOV perspective camera looks back
 * toward the projector's +X optical axis while a large floating dual-reel
 * mechanism stays dark behind the copy. A raw session crosses a liquid-film
 * indexing membrane, becomes a suspended particle cloud, and activates the
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
  resize(): void
  destroy(): void
}

export interface Iso4MotionDiagnostics {
  t: number
  visibleParticles: number
  writtenFrames: number
  fileDissolve: number
  p95SpeedPxPerFrame: number
  p95AccelerationPxPerFrame2: number
  p95JerkPxPerFrame3: number
  maxTrailPx: number
  transportFramesPerSecond: number
  reelTangentFramesPerSecond: number
  reelAngleRadians: number
  apparatusYawDegrees: number
  apparatusYawSpeedDegreesPerSecond: number
  finalWriteAt: number
  projectorStrikeAt: number
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

// THE BOOT NARRATIVE: one file crosses a dashed indexing membrane and bursts
// into suspended particles. A fixed writer on the lower reel absorbs exactly
// three particles per frame-step; its isolated clunks accelerate to 16fps,
// the charged thumbnails reach the gate, and the projector strikes.
const BOOT = { plane: 0.45, drop: 0.85, fall: 1.85, run: 3.8, runRamp: 2.0, proj: 7.37, beam0: 7.87, beamGap: 0.48 }
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
const timeForFrame = (frame: number) => {
  const rampFrames = (FILM_FPS * BOOT.runRamp) / 2
  const u = frame <= rampFrames
    ? Math.sqrt((2 * BOOT.runRamp * frame) / FILM_FPS)
    : frame / FILM_FPS + BOOT.runRamp / 2
  return BOOT.run + u
}

// The first written thumbnail is the starter motor. At that exact arrival the
// reels are still at rest; over a restrained 650ms Hermite run-up they join
// both the position and tangent speed of the accelerating film transport.
// After the join, angular speed is exactly linear film speed / wound radius.
const FIRST_ACTIVATION_AT = timeForFrame(1)
const REEL_SYNC_WINDOW = 0.65
const REEL_SYNC_AT = FIRST_ACTIVATION_AT + REEL_SYNC_WINDOW
const REEL_SYNC_DISTANCE = transportDist(REEL_SYNC_AT) - PITCH
const REEL_SYNC_SPEED = transportSpeed(REEL_SYNC_AT)
const reelDriveDistance = (t: number) => {
  if (t <= FIRST_ACTIVATION_AT) return 0
  if (t >= REEL_SYNC_AT) return transportDist(t) - PITCH
  const x = (t - FIRST_ACTIVATION_AT) / REEL_SYNC_WINDOW
  const h01 = -2 * x * x * x + 3 * x * x
  const h11 = x * x * x - x * x
  return h01 * REEL_SYNC_DISTANCE + h11 * REEL_SYNC_WINDOW * REEL_SYNC_SPEED
}
const reelDriveSpeed = (t: number) => {
  if (t <= FIRST_ACTIVATION_AT) return 0
  if (t >= REEL_SYNC_AT) return transportSpeed(t)
  const x = (t - FIRST_ACTIVATION_AT) / REEL_SYNC_WINDOW
  const dh01 = -6 * x * x + 6 * x
  const dh11 = 3 * x * x - 2 * x
  return (dh01 * REEL_SYNC_DISTANCE + dh11 * REEL_SYNC_WINDOW * REEL_SYNC_SPEED) / REEL_SYNC_WINDOW
}


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

  // The public homepage already carries the real Mike & John Episode 1
  // coverage. Reuse it here instead of manufacturing look-alike faces. The
  // renderer can paint its abstract fallback immediately, then naturally
  // replaces it on the next 16fps gate tick as each small JPEG arrives.
  let episodeMediaRevision = 0
  let useMovingMedia = true
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
  const episodeVideo = document.createElement('video')
  episodeVideo.src = '/clips/ep1-loop.mp4'
  episodeVideo.muted = true
  episodeVideo.loop = true
  episodeVideo.playsInline = true
  episodeVideo.preload = 'auto'
  episodeVideo.addEventListener('loadeddata', () => {
    episodeMediaRevision += 1
  })
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
    // Hold each editorial angle for roughly 1.25 seconds at 16fps. Cycling
    // angle every individual film frame looked like flashing stills, not an
    // edited conversation.
    const variant = ((Math.floor(id / 20) % 4) + 4) % 4
    const mike = episodeFrames[0]!
    const john = episodeFrames[1]!
    const johnAlt = episodeFrames[2]!
    const movingMikeReady = useMovingMedia && episodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    const selected = variant === 0
      ? (movingMikeReady ? episodeVideo : mike)
      : variant === 1 ? john : johnAlt
    const canDrawReal = variant === 3
      ? imageReady(mike) && imageReady(john)
      : selected instanceof HTMLVideoElement ? movingMikeReady : imageReady(selected)
    if (canDrawReal) {
      g2.save()
      g2.imageSmoothingEnabled = true
      g2.imageSmoothingQuality = 'high'
      // A restrained archival grade seats webcam footage in the metal and
      // amber practicals without hiding that these are real people.
      g2.filter = 'sepia(0.16) saturate(0.72) contrast(1.08) brightness(0.82)'
      if (variant === 3) {
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
    const key = `${episodeMediaRevision}:${useMovingMedia ? 'm' : 's'}:${id}${captioned ? 'c' : 'r'}`
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
        fctx.drawImage(frameArt(id, false), 0, 0, vH, uH)
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
    box(lipX0, lipX1, lampY + gateHalfH, lampY + gateHalfH + 0.15, -gateHalfW, gateHalfW, M.steelDark)
    box(lipX0, lipX1, lampY - gateHalfH - 0.15, lampY - gateHalfH, -gateHalfW, gateHalfW, M.steelDark)
    box(lipX0, lipX1, lampY - gateHalfH, lampY + gateHalfH, gateHalfW, gateHalfW + 0.15, M.steelDark)
    box(lipX0, lipX1, lampY - gateHalfH, lampY + gateHalfH, -gateHalfW - 0.15, -gateHalfW, M.steelDark)

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
    gateFrame.position.set(LENS_X + 0.065, lampY, 0)
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
  const chargeThumb = new THREE.Mesh(new THREE.PlaneGeometry(IMG_W, IMG_H), chargeThumbMat)
  chargeThumb.rotation.y = Math.PI / 2
  chargeThumb.position.copy(CHARGE_POINT).add(new THREE.Vector3(0.045, 0, 0))
  machineRoot.add(chargeThumb)

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
  // built a lit room-corner; the wall is IMPLIED — the projected frames carry
  // their own baked spill halos and the darkness does the architecture.)
  // THEATER BEAMS (owner: "a little bit of smoke in the air, just like
  // theater lighting"). Three round volumetric shafts from the prism to the
  // destinations: open cones with a shader doing axial falloff from the
  // source, a soft silhouette via the facing angle, drifting value-noise
  // smoke inside, and a white core melting into each brand colour.
  const beamMats: THREE.ShaderMaterial[] = []
  const beamMeshes: THREE.Mesh[] = []
  {
    const vert = /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`
    const frag = /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSeed;
      uniform float uAlpha;
      uniform float uOn;
      uniform vec3 uView;
      varying vec2 vUv;
      varying vec3 vNormal;
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
        float axial = (0.30 + 0.70 * pow(1.0 - t, 1.4)) * smoothstep(0.0, 0.05, t);
        // A cone's geometric silhouette otherwise reads as a hard triangular
        // laser ramp. Ease its camera-facing density to zero before the mesh
        // edge, approximating the soft lateral extinction of light in haze.
        float facing = abs(dot(normalize(vNormal), normalize(uView)));
        float lateral = pow(smoothstep(0.03, 0.92, facing), 2.1);
        float smoke = 0.5
          + 0.32 * vnoise(vec2(t * 7.0 - uTime * 0.30, vUv.x * 3.0 + uSeed * 7.31))
          + 0.18 * vnoise(vec2(t * 17.0 - uTime * 0.55, vUv.x * 6.0 + uSeed * 3.7));
        vec3 col = mix(vec3(1.0), uColor, smoothstep(0.0, 0.26, t));
        gl_FragColor = vec4(col, axial * lateral * smoke * uAlpha * uOn);
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
          uAlpha: { value: [0.44, 0.64, 0.12][i] },
          uOn: { value: 0 },
          // vNormal is in view space, where the camera always lies along +Z.
          uView: { value: new THREE.Vector3(0, 0, 1) },
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
  // the projected frames on the wall: THE SAME IMAGE that stands in the gate
  // (shared renderer), tinted per channel, redrawn each time a new frame
  // arrives — the machine is visibly projecting the film, not just glowing
  const screenCtxs: { c: HTMLCanvasElement; x: CanvasRenderingContext2D; tex: THREE.CanvasTexture; d: (typeof FAN)[number] }[] = []
  const screenMats: THREE.MeshBasicMaterial[] = []
  const screenMeshes: THREE.Mesh[] = []
  const settledOutputTargets = FAN.map(() => new THREE.Vector3())
  const posedLens = new THREE.Vector3()
  const posedTarget = new THREE.Vector3()
  const posedBeamDir = new THREE.Vector3()
  const beamUp = new THREE.Vector3(0, 1, 0)
  let outputPoseTime = 0
  function drawScreen(sc: (typeof screenCtxs)[number], id: number) {
    const { x, d, c } = sc
    const W2 = c.width
    const H2 = c.height
    x.clearRect(0, 0, W2, H2)
    // the throw's spill behind the artifact
    x.save()
    x.filter = 'blur(26px)'
    x.fillStyle = d.color
    // The landscape core has a healthy phone margin; only its broad blurred
    // spill reached the final few pixels. Restrain the halo, not the card.
    x.globalAlpha = d.icon === 'yt' ? 0.26 : 0.32
    x.fillRect(W2 * 0.1, H2 * 0.12, W2 * 0.8, H2 * 0.76)
    x.restore()
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
      x.save()
      x.translate(58, 44)
      x.globalCompositeOperation = 'screen'
      x.globalAlpha = 0.88
      x.drawImage(frameArt(id, false), 0, 0, 524, 246)
      x.restore()
      x.fillStyle = 'rgba(255,255,255,0.3)'
      x.fillRect(58, 306, 524, 6)
      x.fillStyle = 'rgba(255,255,255,0.9)'
      x.fillRect(58, 306, 336, 6)
      x.beginPath()
      x.arc(394, 309, 8, 0, Math.PI * 2)
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
      x.globalCompositeOperation = 'screen'
      x.globalAlpha = 0.9
      // A curated center crop keeps the steady-state phone from landing on a
      // wall or partial head as the shared editorial id advances. Live mode
      // still uses the real Episode 1 video; deterministic review uses its
      // matching Mike still.
      const portraitSource = useMovingMedia && episodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ? episodeVideo
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
      x.save()
      x.globalAlpha = 0.9
      x.fillStyle = 'rgba(255,235,205,0.85)'
      const hsh2 = Math.abs(Math.imul(id | 0, 40503)) >>> 0
      for (let k = 0; k < 56; k++) {
        const bh = 12 + (((hsh2 >> (k % 24)) & 7) / 7) * 66 * (0.35 + 0.65 * Math.abs(Math.sin(k * 0.55 + id)))
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
    // Keep the artifact itself optically solid enough to read. Its canvas
    // already contains a baked additive spill; additive-blending the whole
    // card made overlaps bleach together and erased the three silhouettes.
    const smat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.NormalBlending, depthWrite: false })
    screenMats.push(smat)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), smat)
    // The artifacts face down the +X optical axis, toward the viewer-facing
    // perspective camera. They are no longer wall projections seen edge-on.
    m.rotation.y = Math.PI / 2
    m.rotation.z = d.tilt
    m.position.set(d.x, lampY + d.y, d.z)
    screenMeshes.push(m)
    scene.add(m)
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

      const beam = beamMeshes[i]!
      posedBeamDir.copy(posedTarget).sub(posedLens)
      const len = posedBeamDir.length()
      beam.position.copy(posedLens).add(posedTarget).multiplyScalar(0.5)
      beam.quaternion.setFromUnitVectors(beamUp, posedBeamDir.normalize())
      beam.scale.y = len
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
      // On phones the portrait output takes a true lower-left branch from the
      // gate. The landscape remains high-right and the transcript low-right,
      // producing a bilateral three-ray fan instead of a right-side stack.
      const mobileFanZ = mobileLayout ? [0.22, 1.75, 0][i]! : 0
      const target = new THREE.Vector3(
        d.x,
        lampY + d.y + lowerLift,
        d.z - 0.78 * panoramicFit + mobileFanZ,
      )
      settledOutputTargets[i]!.copy(target)
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
    sleeveGeometry.rotateX(-Math.PI / 2)
    sleeveGeometry.translate(0, -0.02, 0)
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
    label.rotation.x = -Math.PI / 2
    label.position.set(0, 0.038, 0.07)
    bootFile.add(label)
  }
  bootFile.visible = false
  machineRoot.add(bootFile)
  // THE SCAN PLANE: a demure dashed indexing membrane. The falling file
  // splashes into a suspended cloud as it passes through, then the outline
  // dissolves so no UI chrome remains in steady state.
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
    slot: number
  }[] = []
  for (let k = 0; k < BITS_N; k++) {
    const hx = ((k * 137) % 100) / 100 - 0.5
    const hz = ((k * 71) % 100) / 100 - 0.5
    const hy = ((k * 43) % 100) / 100 - 0.5
    const targetFrame = Math.floor(k / PARTICLES_PER_FRAME) + 1
    const arrivalTime = timeForFrame(targetFrame)
    const journey = 1.42 + (((k * 17) % 9) / 8) * 0.2
    bitsSeed.push({
      x: hx * 1.42,
      y: 0.12 + Math.abs(hy) * 0.62,
      z: hz * 1.68,
      orbit: (k * 2.399963229728653) % (Math.PI * 2),
      targetFrame,
      arrivalTime,
      startTime: Math.max(BOOT.drop + BOOT.fall + 0.08, arrivalTime - journey),
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
  // file → membrane → writer → lower reel → upper reel → gate → outputs. It
  // makes the active area legible without illuminating the whole apparatus.
  const actionLightTarget = new THREE.Object3D()
  scene.add(actionLightTarget)
  const actionSpot = new THREE.SpotLight(0xffd0ad, 0, 64, 0.42, 0.86, 1.35)
  actionSpot.position.set(30, 18, 8)
  actionSpot.target = actionLightTarget
  scene.add(actionSpot)
  const actionLightPath = [
    { t: 0.2, p: new THREE.Vector3(DROP.x, PLANE_Y + 5.4, 0) },
    { t: 2.7, p: new THREE.Vector3(DROP.x, PLANE_Y, 0) },
    { t: 4.3, p: new THREE.Vector3((DROP.x + CHARGE_POINT.x) / 2, (PLANE_Y + CHARGE_POINT.y) / 2, 0) },
    { t: 5.05, p: CHARGE_POINT.clone() },
    { t: 5.55, p: new THREE.Vector3(BOTTOM_REEL.x, BOTTOM_REEL.y, 0) },
    { t: 6.2, p: new THREE.Vector3(ASCENT_X, TOP_REEL.y - 1.1, 0) },
    { t: 6.8, p: new THREE.Vector3(TOP_REEL.x, TOP_REEL.y, 0) },
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
    const ap = a.t >= 5.05 ? transformMachinePoint(a.p, t, actionPointA) : a.p
    const bp = b.t >= 5.05 ? transformMachinePoint(b.p, t, actionPointB) : b.p
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
  const flick = (x: number) => 0.55 + 0.45 * Math.abs(Math.sin(x * 43.7) * Math.sin(x * 17.3))
  const cubic = (a: number, b: number, c: number, d: number, u: number) => {
    const v = 1 - u
    return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d
  }
  const particleMachineP0 = new THREE.Vector3()
  const particleMachineP1 = new THREE.Vector3()
  const particleMachineP2 = new THREE.Vector3()
  const particleMachineP3 = new THREE.Vector3()
  const particleAt = (sd: (typeof bitsSeed)[number], at: number, out: Float32Array, o: number) => {
    if (at < sd.startTime || at > sd.arrivalTime + 0.14) return false
    const q = THREE.MathUtils.clamp((at - sd.startTime) / (sd.arrivalTime - sd.startTime), 0, 1)
    const e = minJerk(q)
    // Source points cover the actual lower edge of the dissolving file rather
    // than erupting from one singularity.
    const edgeProgress = (sd.targetFrame - 0.5) / FRAME_GROUPS
    const sourceX = DROP.x + sd.x
    const sourceY = PLANE_Y + 0.04 + sd.y
    const sourceZ = 0.8 - edgeProgress * 1.6 + sd.z * 0.12
    // The membrane, source card, and particle source all live on the same
    // mechanical intake axis. Transform both opening control points with the
    // yawing machine so information visibly peels from the surface it struck
    // instead of from the membrane's former world-space position.
    transformMachinePoint(
      particleMachineP0.set(sourceX, sourceY, sourceZ),
      at,
      particleMachineP0,
    )
    transformMachinePoint(
      particleMachineP1.set(
        sourceX - 0.52,
        sourceY - 0.22,
        sourceZ + Math.sin(sd.orbit) * 0.2,
      ),
      at,
      particleMachineP1,
    )
    // Three monotone registration sites across the 16:9 film cell. Assignment
    // follows source z order within every cohort, preventing crossing paths.
    const slot = sd.slot === 0 ? -1 : sd.slot === 2 ? 1 : 0
    transformMachinePoint(
      particleMachineP3.set(
        CHARGE_POINT.x + 0.045,
        CHARGE_POINT.y + (slot === 0 ? -0.045 : 0.07),
        slot * IMG_W * 0.41,
      ),
      at,
      particleMachineP3,
    )
    transformMachinePoint(
      particleMachineP2.set(
        CHARGE_POINT.x + 0.045,
        CHARGE_POINT.y + (slot === 0 ? -0.045 : 0.07) + 0.92,
        slot * IMG_W * 0.41,
      ),
      at,
      particleMachineP2,
    )
    const p3x = particleMachineP3.x
    const p3y = particleMachineP3.y
    const p3z = particleMachineP3.z
    const p0x = particleMachineP0.x
    const p0y = particleMachineP0.y
    const p0z = particleMachineP0.z
    const p1x = particleMachineP1.x
    const p1y = particleMachineP1.y
    const p1z = particleMachineP1.z
    // P3-P2 points straight down the feed, so every path becomes tangent to
    // the film before it stops: floating information resolves into order.
    const p2x = particleMachineP2.x
    const p2y = particleMachineP2.y
    const p2z = particleMachineP2.z
    const curlEnvelope = Math.pow(Math.sin(Math.PI * e), 2)
    const curlAngle = sd.orbit + Math.PI * 2 * 0.55 * e
    const curlRadius = (0.25 + Math.abs(sd.z) * 0.1) * curlEnvelope
    const commonDrift = Math.sin((at - (BOOT.drop + BOOT.fall)) * 0.62) * 0.055 * curlEnvelope
    out[o] = cubic(p0x, p1x, p2x, p3x, e) + Math.cos(curlAngle) * curlRadius
    out[o + 1] = cubic(p0y, p1y, p2y, p3y, e) + Math.sin(curlAngle * 0.72) * curlRadius * 0.2 + commonDrift
    out[o + 2] = cubic(p0z, p1z, p2z, p3z, e) + Math.sin(curlAngle) * curlRadius
    return true
  }
  // Particles wake gradually, gain coherence as they join the common stream,
  // then give their luminance to the written film cell during the 140ms hold.
  // The registration point is a transfer, not a deletion.
  const particleEnergy = (sd: (typeof bitsSeed)[number], at: number) => {
    if (at < sd.startTime || at > sd.arrivalTime + 0.14) return 0
    const q = THREE.MathUtils.clamp((at - sd.startTime) / (sd.arrivalTime - sd.startTime), 0, 1)
    const birth = minJerk(q / 0.18)
    const coherence = 0.34 + 0.66 * minJerk(q / 0.72)
    const transfer = at <= sd.arrivalTime ? 1 : 1 - minJerk((at - sd.arrivalTime) / 0.14)
    return birth * coherence * transfer
  }
  function update(t: number) {
    // The desktop camera sees a much larger physical stage. Preserve the
    // source's legibility and the particles' delicate cores without adding
    // particles or speeding them up; mobile retains its accepted density.
    bitsMat.size = 0.16 * detailScale
    bitsHaloMat.size = 0.42 * detailScale
    const dist = transportDist(t)
    // A real projector holds each frame at the gate, then pulls the strip down
    // one pitch. Keep that intermittent 16fps transport distinct from the
    // continuously turning reel loop and the otherwise smooth scene.
    const filmFrame = quantizedFrame(dist / PITCH)
    const filmDist = filmFrame * PITCH
    const off = 0
    machinePivot.rotation.y = apparatusYawAt(t)
    poseOutputs(t)
    for (const m of beamMats) m.uniforms.uTime!.value = t
    updateActionLight(t)

    // ACT 1 — the rite of indexing: the membrane wakes; a file materializes,
    // splashes through it, hangs as a cloud, then enters the writer in groups
    // of three particles for every mechanical frame-step.
    const bx = DROP.x
    const framePhase = dist / PITCH
    const chargeProgress = Math.min(1, framePhase / FRAME_GROUPS)
    let impactPulse = 0
    {
      // Materialize below the CTA band. The earlier 9.6-world-unit corridor
      // forced the readable file face through “Watch it work” on mobile.
      const y0 = PLANE_Y + 6.2
      const tau = t - BOOT.drop
      const tPlane = BOOT.fall
      const crossAge = tau - tPlane
      const finalHit = timeForFrame(FRAME_GROUPS)
      // One broad ripple acknowledges contact. The membrane remains while the
      // source is being written, then recedes before the projector strikes.
      const wake = THREE.MathUtils.smoothstep(t, BOOT.plane, BOOT.plane + 0.6)
      const crossFlash = crossAge > 0 ? 1 - minJerk(crossAge / 1.08) : 0
      const zoneOut = minJerk((t - (finalHit + 0.14)) / Math.max(0.1, BOOT.proj - finalHit - 0.14))
      const scanFade = 1 - zoneOut
      const outlineDim = crossAge > 0
        ? 1 - 0.55 * minJerk(crossAge / 1.15) - 0.3 * Math.pow(chargeProgress, 0.82)
        : 1
      planeMat.opacity = wake * scanFade * outlineDim * (0.25 + 0.035 * Math.sin(t * 0.82) + 0.28 * crossFlash)
      dropFilmMat.uniforms.uTime!.value = t
      dropFilmMat.uniforms.uImpact!.value = crossFlash
      dropFilmMat.uniforms.uOpacity!.value = wake * scanFade * (0.58 + crossFlash * 0.16)
      // The card glides to rest, then erodes from its lower edge for the full
      // duration of the write. Its last ember vanishes with the final cohort.
      const fileIn = minJerk(tau / 0.42)
      const dissolve = crossAge > 0 ? Math.pow(chargeProgress, 0.82) : 0
      if (tau > 0 && t < BOOT.proj && dissolve < 0.9995) {
        bootFile.visible = true
        const fallLinear = THREE.MathUtils.clamp(tau / tPlane, 0, 1)
        const fall = minJerk(fallLinear)
        const flatten = minJerk((fallLinear - 0.52) / 0.48)
        const settle = crossAge > 0 ? minJerk(crossAge / Math.max(0.1, finalHit - (BOOT.drop + tPlane))) : 0
        bootFile.position.set(bx - 0.1, THREE.MathUtils.lerp(y0, PLANE_Y + 0.09, fall) - settle * 0.1, 0.1)
        bootFile.scale.setScalar(detailScale)
        // Present the Zoom face during the descent, then lay it flat into the
        // liquid-film plane instead of showing a thin, unreadable plank.
        // The sleeve and its printed inset share one axis. A restrained roll
        // keeps the recording readable in flight without counter-rotating the
        // media panel against its physical container.
        bootFile.rotation.z = THREE.MathUtils.lerp(-0.82, 0, flatten) + 0.025 * Math.sin(tau * 0.72) * (1 - flatten) * (1 - dissolve)
        bootFile.rotation.x = THREE.MathUtils.lerp(0.14, 0, flatten) + 0.018 * Math.sin(tau * 0.55) * (1 - flatten) * (1 - dissolve)
        const bodyFade = crossAge <= 0 ? 1 : 1 - minJerk(crossAge / 0.55)
        bootFileMat.opacity = fileIn * (0.07 * (1 - dissolve) + 0.71 * bodyFade)
        bootFileMat.emissiveIntensity = 0.12 + crossFlash * 0.42
        if (bootLabelMat) {
          bootLabelMat.uniforms.uOpacity!.value = fileIn
          bootLabelMat.uniforms.uDissolve!.value = dissolve
        }
      } else {
        bootFile.visible = false
      }
      // Cohorts peel away gradually and share one broad flow. Their arrivals
      // remain exactly frame-locked, while each trajectory is a deterministic
      // minimum-jerk curve with a single restrained curl.
      if (crossAge > 0 && t < finalHit + 0.18) {
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
          const trailEnvelope = minJerk((q - 0.58) / 0.12) * (1 - minJerk((q - 0.88) / 0.12))
          const hasTrail = particleAt(sd, t - 0.028, trailPos, i6 + 3)
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

    // ACT 2 — the lower reel catches in visible steps, then resolves into a
    // smooth flywheel while the film itself keeps its honest 16fps cadence.
    const reelDist = reelDriveDistance(t)
    // Clockwise matches the loop: film rises on the left tangents and falls
    // on the right, so flange motion and thumbnail motion agree.
    reel.rotation.z = -reelDist / coilR
    lowerReel.rotation.z = -reelDist / coilR
    const completedFrames = Math.min(FRAME_GROUPS, quantizedFrame(framePhase))
    for (let n = Math.max(1, completedFrames - 4); n <= completedFrames; n++) {
      const age = t - timeForFrame(n)
      if (age >= 0) impactPulse += Math.exp(-age / 0.14)
    }
    impactPulse = Math.min(1, impactPulse * 0.42)
    const finalHit = timeForFrame(FRAME_GROUPS)
    const chargingActive = completedFrames >= 1 && t <= finalHit + 0.28
    const writerEnvelope = chargingActive ? 1 - minJerk((t - finalHit) / 0.28) : 0
    for (const mat of lowerChargeMats) mat.emissiveIntensity = 0.01 + chargeProgress * 0.08 + impactPulse * 0.1
    lowerReelEmber.intensity = 0.04 + chargeProgress * 0.48 + impactPulse * 0.6
    chargeLight.intensity = writerEnvelope * (chargeProgress * 0.15 + impactPulse * 2.35)
    chargeRingMat.opacity = writerEnvelope * Math.min(0.38, chargeProgress * 0.045 + impactPulse * 0.3)
    chargeRingMat.emissiveIntensity = writerEnvelope * (chargeProgress * 0.09 + impactPulse * 1.05)
    chargeRing.scale.setScalar(1 + impactPulse * 0.08)
    const lastHitAge = completedFrames >= 1 ? Math.max(0, t - timeForFrame(completedFrames)) : 0
    const writerReveal = completedFrames >= 1 ? minJerk(lastHitAge / 0.14) : 0
    chargeThumbMat.opacity = writerEnvelope * Math.min(0.62, 0.08 + impactPulse * 0.18 + writerReveal * 0.46)
    filmMatRef.opacity = 0.2 + 0.8 * THREE.MathUtils.smoothstep(t, BOOT.run - 0.05, BOOT.run + 1.55)
    if (filmFrame !== lastFilmFrame) {
      lastFilmFrame = filmFrame
      drawFilm(filmDist, Math.min(totalPath, filmDist))
      const writerOcc = Math.floor((CHARGE_S - off) / PITCH)
      renderFrameContent(chargeThumbCtx, chargeThumbCanvas.width, chargeThumbCanvas.height, stableId(writerOcc, off, filmDist), false)
      chargeThumbTex.needsUpdate = true
    }

    // ACT 3 — the projector strikes (a real lamp strike: flicker, then hold)
    {
      const ig = t < BOOT.proj ? 0 : Math.min(1, (t - BOOT.proj) / 0.6)
      const igf = ig >= 1 ? 1 : ig * flick(t)
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
      gateGlow.intensity = 3.2 * igf * strike * lampBreath
      headGlow.intensity = 2.45 * igf * strike * (1 + (lampBreath - 1) * 0.55)
      if (gateFrameMat) gateFrameMat.opacity = 0.88 * igf * (1 + (lampBreath - 1) * 0.65)
    }

    // ACT 4 — one, two, three: each beam and its screen ignite in turn
    for (let i = 0; i < 3; i++) {
      const t0 = BOOT.beam0 + i * BOOT.beamGap
      const on = t < t0 ? 0 : minJerk((t - t0) / 0.5)
      const onf = on >= 1 ? 1 : on * flick(t + i * 3.1)
      beamMats[i]!.uniforms.uOn!.value = onf
      const sm = screenMats[i]
      if (sm) sm.opacity = onf
    }

    // the wall projects whatever stands in the gate
    {
      const occ = Math.floor((S_GATE - off) / PITCH)
      const id = stableId(occ, off, filmDist)
      if (id !== lastGateId) {
        lastGateId = id
        if (gateFrameCtx && gateFrameTex) {
          gateFrameCtx.clearRect(0, 0, 320, 180)
          gateFrameCtx.drawImage(frameArt(id, false), 0, 0, 320, 180)
          gateFrameTex.needsUpdate = true
        }
        for (const sc of screenCtxs) drawScreen(sc, id)
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
    const rect = canvas.getBoundingClientRect()
    const toScreen = (source: Float32Array, target: THREE.Vector3) => {
      target.set(source[0]!, source[1]!, source[2]!).project(camera)
      target.set((target.x * 0.5 + 0.5) * rect.width, (-target.y * 0.5 + 0.5) * rect.height, 0)
    }
    for (const seed of bitsSeed) {
      const visible = samples.every((sample, i) => particleAt(seed, t - i * dt, sample, 0))
      if (particleAt(seed, t, samples[0]!, 0) && particleEnergy(seed, t) > 0.04) visibleParticles += 1
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
      if (particleAt(seed, t - 0.028, trailSample, 0)) {
        const trailPoint = new THREE.Vector3()
        toScreen(trailSample, trailPoint)
        const q = (t - seed.startTime) / (seed.arrivalTime - seed.startTime)
        const trailEnvelope = minJerk((q - 0.58) / 0.12) * (1 - minJerk((q - 0.88) / 0.12))
        maxTrailPx = Math.max(maxTrailPx, p0.distanceTo(trailPoint) * trailEnvelope)
      }
    }
    const framePhase = transportDist(t) / PITCH
    const crossing = BOOT.drop + BOOT.fall
    const fileDissolve = t <= crossing ? 0 : Math.pow(Math.min(1, framePhase / FRAME_GROUPS), 0.82)
    const yawDegrees = THREE.MathUtils.radToDeg(apparatusYawAt(t))
    const yawSpeedDegrees = THREE.MathUtils.radToDeg(
      (apparatusYawAt(t + dt) - apparatusYawAt(t - dt)) / (2 * dt),
    )
    const tidy = (n: number) => Number(n.toFixed(3))
    return {
      t: tidy(t),
      visibleParticles,
      writtenFrames: Math.min(FRAME_GROUPS, quantizedFrame(framePhase)),
      fileDissolve: tidy(fileDissolve),
      p95SpeedPxPerFrame: tidy(p95(speeds)),
      p95AccelerationPxPerFrame2: tidy(p95(accelerations)),
      p95JerkPxPerFrame3: tidy(p95(jerks)),
      maxTrailPx: tidy(maxTrailPx),
      transportFramesPerSecond: tidy(transportSpeed(t) / PITCH),
      reelTangentFramesPerSecond: tidy(reelDriveSpeed(t) / PITCH),
      reelAngleRadians: tidy(-reelDriveDistance(t) / coilR),
      apparatusYawDegrees: tidy(yawDegrees),
      apparatusYawSpeedDegreesPerSecond: tidy(yawSpeedDegrees),
      finalWriteAt: tidy(timeForFrame(FRAME_GROUPS)),
      projectorStrikeAt: BOOT.proj,
    }
  }

  let shadowTick = 0
  function draw(t: number) {
    update(t)
    if ((shadowTick++ & 1) === 0) renderer.shadowMap.needsUpdate = true
    composer.render()
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
      running = true
      useMovingMedia = true
      lastFilmFrame = Number.NaN
      lastGateId = Number.NaN
      timelineStart = performance.now() / 1000 - elapsed
      void episodeVideo.play().catch(() => {
        // Muted inline playback is normally allowed; the decoded Mike still
        // remains the honest fallback if a browser policy says otherwise.
      })
      raf = requestAnimationFrame(loop)
    },
    stop() {
      if (running) elapsed = performance.now() / 1000 - timelineStart
      running = false
      episodeVideo.pause()
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    still(t: number = STILL_T) {
      this.stop()
      useMovingMedia = false
      lastFilmFrame = Number.NaN
      lastGateId = Number.NaN
      elapsed = t
      layout()
      draw(t)
    },
    inspect(t: number) {
      return inspectMotion(t)
    },
    resize() {
      layout()
      if (!running) draw(elapsed)
    },
    destroy() {
      this.stop()
      episodeVideo.removeAttribute('src')
      episodeVideo.load()
      renderer.dispose()
    },
  }
}
