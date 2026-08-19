<script setup lang="ts">
/**
 * A length of film running through 3D space, carrying one real take — and the
 * edit that removes the dead air out of the middle of it.
 *
 * ARCHITECTURE — read this before editing.
 *
 * There are two meshes — the strip, and the run the edit removes — and both are
 * laid out in *film* coordinates rather than world coordinates. Attribute
 * `position.x` is an offset in gate-frames along the strip; `position.y` is the
 * across-the-film coordinate, where -1 .. +1 spans the full width of the film.
 * The vertex shader converts that into world space by walking a pre-baked curve
 * LUT, so the CPU does no geometry work at all after init: scrolling the film is
 * one uniform (`uGHead`) and the whole edit is five more.
 *
 * The curve LUT (`buildCurveLut`) is a 256 x 4 float texture: position, tangent,
 * and a rotation-minimising normal/binormal frame, resampled at equal arc length
 * so every frame on the strip is the same physical length. Frenet frames are
 * deliberately NOT used — they spin at inflection points. Row 0's alpha carries
 * the roll that would put the emulsion square to the lens at that station, so
 * the shader's twist function is pure art direction on top of a known-readable
 * base; that is what lets the ribbon roll, go edge-on and catch the key on the
 * curl without any part of it turning into an unreadable smear.
 *
 * Everything printed on the film is procedural in the fragment shader —
 * perforations (punched out with real alpha so you see through them), frame
 * lines, the optical soundtrack, the splice flash. The only raster is a static
 * atlas of the 38 photographic frames, painted into a canvas exactly once at
 * init to burn in timecode. Nothing repaints, ever.
 *
 * THE CONTENT IS REAL AND SO IS THE REASON FOR THE CUT.
 * - The 38 frames are consecutive, 6 fps, from src_bmx7xkkdi2g8btdrj8ah at
 *   00:01:57.000-00:02:03.167 of the park session. Adjacent cells are nearly
 *   identical; that near-duplication is the whole reason a strip reads as time.
 * - The optical soundtrack is the measured RMS of that same audio, 16 samples
 *   per frame, normalised to the window peak (0.0766 RMS).
 * - The removed run is frames 13-20, which is ffmpeg's silencedetect hit at
 *   119.023 -> 120.346 (1.323 s below -30 dB). The strip shows you the flat
 *   soundtrack, then removes exactly that.
 * - No dialogue is quoted and no line is attributed to anyone. The strip
 *   carries only measured quantities.
 *
 * Discipline carried over from the rest of the site: depth comes from shading,
 * fog and defocus. There is no glow, no coloured light, no bloom. The one
 * accent colour appears as flat marks in the HTML overlay only.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const host = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const failed = ref(false)

// The marker that tracks the doomed run. Driven from the render loop rather
// than reactive per-frame state, so it costs a transform and nothing else.
const marker = ref<HTMLElement | null>(null)

let teardown: (() => void) | null = null

// ---- the film ---------------------------------------------------------------
// Atlas geometry. 8 x 5 slots; 0..37 are the photographic frames baked by
// ffmpeg and 38 is the leader, drawn into the first spare slot at init. Slot 39
// is unused, and CYCLE is 39 rather than 40 so it is never sampled.
const ATLAS_URL = '/images/ribbon/strip-atlas.jpg'
const ATLAS_W = 3600
const ATLAS_H = 1716
const CELL_W = 432
const CELL_H = 324
// 16px between slots, so each cell owns 8px of gutter. Filtered sampling at a
// grazing angle reaches several texels past a cell edge; without a gutter it
// reads the neighbouring frame, and the fix for THAT (insetting the sample
// window by the mip level) makes the picture visibly breathe as the level
// changes. A gutter filled with the cell's own edge pixels removes both.
const CELL_PAD = 16
const CELL_GUTTER = 8
const CELL_COLS = 8
const CYCLE = 39 // cells per repeat: 38 frames + one leader
const PIC_CELLS = 38

// Source provenance, used for the burned-in timecode and the leader card.
const SRC_ID = 'src_bmx7xkkdi2g8btdrj8ah'
const SRC_T0 = 117.0 // seconds into the source
const SRC_FPS = 6

// Measured RMS of the window, 16 samples per frame, peak-normalised to 0..255.
// Generated from the source audio; see the header note.
const SOUNDTRACK_B64 =
  'NC8uIR0aIi83ER42GhIMBwoaGRUaExMMCgoKBgYEBAUKEB45S2BifYZPJiYZDg0KBwgICQkOEh4lLDI2UlxxfIRvXlFSTDkwKBUNDBETDQ0LCQYLBQUGDAgDDQ8HCAcGCQsHBg0GCAoTCQsOOR4oDQwmRFZaUVteUFtbW1UbDQ4LGBwkP1ZhZ2ZjWj0NDBAJCgkHFUZWWlI3EREPDxMdGiNMV05POCcVCQwLBwoKDA4SFhUNFzRFPENOREBBPD5AOyopFBAREggGChMSEAcLCQwFBQUEBAkQEhENCg8ICxQLBwwNID4uIxIOBg0HCA8NECElFAoGFBIOBwoLEAoMCQ4JEB0aFgcMCxEPDwwQDggOGxcPCgsHCw0KCwgMDA4OCAkJCwoLCQgLGRAIDwwSDQsHBgsICw8aEQ4KCRIbIycrLSYiFCIjFRULCA8OIjIoIxYiEUmBPR8QMigbGRg+MzMgExANFBo0XUtHLDk1JQ4SFBgSBxcjKRUMFClRajsuCD9yh4FcPTt6MSIbHRAMDhUsMxMRN2RnQjU1/8eEq102IiorJwkdNSYVGxkVEFllUT4xKk1RQxwJFAYJEAgWIh0LBxEZHBYnGyNCNDw9QUc6JCAiKywoOzsoN0Z0iGVfd3GIhrrevoI6JVxjYVc0LSAfJjpKQyc3HjYtMFZ2WVtWXUc8Hw0KDzRMMkNrbW5cJx8dNiE/QD5URjwXGxomGSFLOS8VMzM7NmJfTSk2OlcqHiIaGhc2Ui8kKykhHiEoKDgjFBwlMENCOCYWFQcGCw8JCgwNEBITDwgdFhMWFgk='
const SOUND_PER_FRAME = 16

// The measured silence, in cells and in seconds. Both come from the same
// silencedetect pass; keep them together so they can never drift apart.
const CUT_FIRST_CELL = 13
const CUT_CELL_COUNT = 8
const CUT_SECONDS = 1.323

// ---- strip proportions, in film widths --------------------------------------
// v runs -1 .. +1 across the full width of the film. Everything below is
// expressed in those units so the shader and the CPU agree by construction.
// A 35mm optical track is about 6% of the film width. At the size this strip is
// ever seen it would be two pixels of near-constant white — it could not carry
// the one thing it exists to show. So it is drawn at roughly twice life size,
// which is the only deliberate departure from the real geometry here.
const PITCH = 1.747 // one gate frame, along the strip
const FRAME_LINE = 0.067
const PIC_TOP = 0.800
const PIC_BOT = -0.460

const SPEED = 3.6 // gate frames per second

function timecode(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const f = Math.round((seconds % 1) * 100)
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${p(h)}:${p(m)}:${p(s)}.${p(f)}`
}

onMounted(async () => {
  // Nuxt wraps `.client.vue` components in createClientOnly, which registers its
  // own onMounted (the one that flips `mounted$` and renders the real template)
  // BEFORE the component's. So on a hydrated page our template refs are still
  // null in here until that render flushes. Wait for them rather than bailing.
  for (let i = 0; i < 12 && !(host.value && canvas.value); i++) await nextTick()
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let THREE: typeof import('three')
  try {
    // Dynamic import so three never enters the main bundle. This route is the
    // only thing that pays for it, and only once it is on screen.
    THREE = await import('three')
  } catch {
    failed.value = true
    return
  }

  // ---- atlas: one canvas paint, at init, then never again -------------------
  const atlasCanvas = document.createElement('canvas')
  atlasCanvas.width = ATLAS_W
  atlasCanvas.height = ATLAS_H
  const actx = atlasCanvas.getContext('2d')!
  actx.fillStyle = '#000'
  actx.fillRect(0, 0, ATLAS_W, ATLAS_H)

  const cellRect = (i: number) => ({
    x: CELL_PAD + (i % CELL_COLS) * (CELL_W + CELL_PAD),
    y: CELL_PAD + Math.floor(i / CELL_COLS) * (CELL_H + CELL_PAD),
  })

  const plate = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = ATLAS_URL
  })
  if (!plate) {
    failed.value = true
    return
  }
  actx.drawImage(plate, 0, 0)

  // Timecode burn-in, the way a rough cut carries it. Small, mono, corner.
  actx.textBaseline = 'alphabetic'
  for (let i = 0; i < PIC_CELLS; i++) {
    const { x, y } = cellRect(i)
    const label = timecode(SRC_T0 + i / SRC_FPS)
    actx.font = '500 17px "IBM Plex Mono", ui-monospace, monospace'
    const w = actx.measureText(label).width
    actx.fillStyle = 'rgba(0,0,0,0.5)'
    actx.fillRect(x + 10, y + CELL_H - 34, w + 16, 24)
    actx.fillStyle = 'rgba(255,255,255,0.86)'
    actx.fillText(label, x + 18, y + CELL_H - 17)
  }

  // One leader frame between passes, so the repeat reads as the head of the
  // take rather than a glitch. Printed at leader density — a black card just
  // reads as a hole punched in the strip.
  {
    const { x, y } = cellRect(PIC_CELLS)
    actx.fillStyle = '#1b1b1f'
    actx.fillRect(x, y, CELL_W, CELL_H)
    actx.strokeStyle = 'rgba(244,244,245,0.34)'
    actx.lineWidth = 2
    actx.beginPath()
    actx.arc(x + CELL_W / 2, y + CELL_H / 2, 104, 0, Math.PI * 2)
    actx.stroke()
    actx.beginPath()
    actx.moveTo(x + CELL_W / 2, y + 16)
    actx.lineTo(x + CELL_W / 2, y + CELL_H - 16)
    actx.moveTo(x + 16, y + CELL_H / 2)
    actx.lineTo(x + CELL_W - 16, y + CELL_H / 2)
    actx.stroke()
    actx.textAlign = 'center'
    actx.fillStyle = 'rgba(244,244,245,0.62)'
    actx.font = '600 18px "IBM Plex Mono", ui-monospace, monospace'
    actx.fillText('HEAD OF TAKE', x + CELL_W / 2, y + CELL_H / 2 - 122)
    actx.font = '500 15px "IBM Plex Mono", ui-monospace, monospace'
    actx.fillStyle = 'rgba(244,244,245,0.4)'
    actx.fillText(SRC_ID.slice(0, 14), x + CELL_W / 2, y + CELL_H / 2 + 132)
    actx.textAlign = 'start'
  }

  // Bleed every cell's edge row/column out into its gutter. Mip levels above
  // about 2 average across the gutter, and if that gutter is black the frames
  // grow dark fringes that pulse as the strip moves.
  for (let i = 0; i < CYCLE; i++) {
    const { x, y } = cellRect(i)
    const g = CELL_GUTTER
    actx.drawImage(atlasCanvas, x, y, 1, CELL_H, x - g, y, g, CELL_H)
    actx.drawImage(atlasCanvas, x + CELL_W - 1, y, 1, CELL_H, x + CELL_W, y, g, CELL_H)
    const w = CELL_W + g * 2
    actx.drawImage(atlasCanvas, x - g, y, w, 1, x - g, y - g, w, g)
    actx.drawImage(atlasCanvas, x - g, y + CELL_H - 1, w, 1, x - g, y + CELL_H, w, g)
  }

  const atlas = new THREE.CanvasTexture(atlasCanvas)
  atlas.flipY = false
  atlas.colorSpace = THREE.SRGBColorSpace
  atlas.wrapS = THREE.ClampToEdgeWrapping
  atlas.wrapT = THREE.ClampToEdgeWrapping
  atlas.minFilter = THREE.LinearMipmapLinearFilter
  atlas.magFilter = THREE.LinearFilter
  atlas.generateMipmaps = true

  // ---- optical soundtrack ---------------------------------------------------
  const raw = atob(SOUNDTRACK_B64)
  const sound = new Uint8Array(CYCLE * SOUND_PER_FRAME)
  for (let i = 0; i < raw.length && i < sound.length; i++) sound[i] = raw.charCodeAt(i)
  // Leader carries no track, which is also true of real leader.
  const soundTex = new THREE.DataTexture(sound, sound.length, 1, THREE.RedFormat, THREE.UnsignedByteType)
  soundTex.wrapS = THREE.RepeatWrapping
  // Nearest, deliberately: a real variable-area track is exposed line by line,
  // and stepping it reads as a waveform where interpolation reads as a ribbon.
  // Linear both ways plus a mip chain. Nearest magnification gave the track
  // hard steps along the strip with no antialiasing of their own, which read as
  // a torn white edge and crawled; the waveform is legible without them.
  soundTex.minFilter = THREE.LinearMipmapLinearFilter
  soundTex.magFilter = THREE.LinearFilter
  soundTex.generateMipmaps = true
  soundTex.needsUpdate = true

  // ---- the curve the film runs along ----------------------------------------
  // Art-directed control points: far end small and high on the right, sweeping
  // down and across so the near end leaves the bottom-left of frame. Both ends
  // run off the viewport; the strip is never a floating object in a box.
  const spine = new THREE.CatmullRomCurve3(
    [
      // Scale is the whole game here. A film strip reads as film because of the
      // REPETITION of small frames; blow one up to half the screen and you are
      // just looking at a photograph, badly. So: no part of the curve comes
      // closer than about fourteen units, the far end stops where the fog has
      // already taken it (past that the frames were being spent on nothing),
      // and the near end leaves through the bottom-left while still modest.
      new THREE.Vector3(20.0, 4.6, -62.0),
      new THREE.Vector3(12.4, 2.6, -38.0),
      new THREE.Vector3(6.8, 1.0, -23.0),
      new THREE.Vector3(2.4, -0.6, -14.0),
      new THREE.Vector3(-1.2, -1.8, -7.5),
      new THREE.Vector3(-4.4, -2.9, -2.6),
      new THREE.Vector3(-8.0, -4.4, 1.0),
      new THREE.Vector3(-12.6, -6.6, 4.0),
      new THREE.Vector3(-18.0, -9.6, 6.6),
    ],
    false,
    'catmullrom',
    0.5,
  )

  // ---- scene ----------------------------------------------------------------
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(27, 1, 0.2, 180)
  camera.position.set(0.4, 0.9, 10.6)
  camera.lookAt(-0.4, -0.9, -9)

  const LUT_N = 256
  const { lutData, arcTotal } = buildCurveLut(THREE, spine, LUT_N, camera.position)
  const curveTex = new THREE.DataTexture(lutData, LUT_N, 4, THREE.RGBAFormat, THREE.FloatType)
  curveTex.minFilter = THREE.NearestFilter
  curveTex.magFilter = THREE.NearestFilter
  curveTex.generateMipmaps = false
  curveTex.needsUpdate = true

  const HALF_W = 1.32 // world half-width of the film
  const PITCH_W = PITCH * HALF_W // world length of one gate frame
  const GSPAN = arcTotal / PITCH_W // gate frames from one end of the curve to the other

  const gl = new THREE.WebGLRenderer({
    canvas: cv,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  gl.setClearColor(0x000000, 0)
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  // The strip is nearly always seen at a grazing angle; without anisotropy the
  // sampler picks its mip for the short axis and smears the long one into the
  // streaks that show up as shimmer once the film is moving.
  atlas.anisotropy = gl.capabilities.getMaxAnisotropy()

  const BG = new THREE.Color(0x0d0d0d)

  const shared = {
    uAtlas: { value: atlas },
    uSound: { value: soundTex },
    uCurve: { value: curveTex },
    uArcTotal: { value: arcTotal },
    uPitch: { value: PITCH_W },
    uHalfW: { value: HALF_W },
    uTime: { value: 0 },
    uGHead: { value: 0 },
    uCutA: { value: 1e9 },
    uCutB: { value: 1e9 },
    uClose: { value: 0 },
    uCutActive: { value: 0 },
    uBlade: { value: 0 },
    uWhip: { value: 0 },
    uWhipAt: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uFog: { value: BG },
    uMotion: { value: 0 },
    uFocus: { value: 19.0 },
    uCoc: { value: 0.05 },
  }

  // Shared uniform objects are handed to both materials by reference, so the
  // strip and the excised piece stay in lockstep from one place.
  const makeUniforms = (piece: boolean) => ({
    ...shared,
    uPieceMode: { value: piece ? 1 : 0 },
    // The excised piece is frozen on the curve at the instant of the cut. Left
    // reading the live head it keeps sliding down the curve while it falls, and
    // collapses into a smear when it runs off the end.
    uPieceGHead: { value: 0 },
    uPieceCentre: { value: new THREE.Vector3() },
    uPieceRot: { value: new THREE.Matrix3() },
    uPieceDrift: { value: new THREE.Vector3() },
    uPieceFade: { value: 1 },
  })

  const makeMaterial = (piece: boolean) => {
    const m = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: makeUniforms(piece),
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.DoubleSide,
      transparent: false,
      defines: { LUT_N: String(LUT_N), CYCLE: `${CYCLE}.0` },
    })
    m.alphaToCoverage = true
    return m
  }

  const stripMat = makeMaterial(false)
  const pieceMat = makeMaterial(true)

  const stripGeo = buildStripGeometry(THREE, 0, GSPAN, 0.055)
  const pieceGeo = buildStripGeometry(THREE, 0, CUT_CELL_COUNT, 0.03)

  const strip = new THREE.Mesh(stripGeo, stripMat)
  strip.frustumCulled = false
  scene.add(strip)

  const piece = new THREE.Mesh(pieceGeo, pieceMat)
  piece.frustumCulled = false
  piece.visible = false
  scene.add(piece)

  // ---- the edit, as a state machine ------------------------------------------
  // One pass of the loop: the run approaches marked, the blade lands, the piece
  // falls out of frame, the gap slams shut, and the splice runs off the near end
  // where the whole thing retires without a visible reset.
  // Distance from the lens, not arc position: the blade has to land where the
  // frames are sharp, and that is a property of the camera, not the curve.
  const FIRE_DIST = 19.0
  const RETIRE_AT = 1.02
  const HALF_CUT = CUT_CELL_COUNT / 2

  // Start with the first doomed run just off the far end of the curve, so the
  // loop opens on film arriving rather than mid-cut.
  let lastN = 0
  let gHead = CUT_FIRST_CELL + HALF_CUT - 1
  let cutA = CUT_FIRST_CELL
  let cutB = CUT_FIRST_CELL + CUT_CELL_COUNT
  let cutSMid = 0
  let phase: 'armed' | 'cutting' = 'armed'
  let cutT = 0

  const armNext = () => {
    // The doomed run is always cells 13..20 of some pass: the measured silence.
    // Strictly the next pass — the cycle length and the curve length are close
    // enough that the arithmetic alone can re-arm the run just removed.
    const n = Math.max(lastN + 1, Math.floor((gHead - HALF_CUT - CUT_FIRST_CELL) / CYCLE))
    lastN = n
    cutA = n * CYCLE + CUT_FIRST_CELL
    cutB = cutA + CUT_CELL_COUNT
  }

  const easeOutBack = (t: number) => {
    const c1 = 1.9
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }
  const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

  const tmpP = new THREE.Vector3()
  const tmpAxis = new THREE.Vector3()
  const tmpQ = new THREE.Quaternion()
  const tmpQ2 = new THREE.Quaternion()
  const tmpM4 = new THREE.Matrix4()
  const WORLD_UP = new THREE.Vector3(0, 1, 0)

  const lutVecAt = (row: number, arcNorm: number, out: THREE.Vector3) => {
    const x = clamp01(arcNorm) * (LUT_N - 1)
    const i = Math.min(LUT_N - 1, Math.floor(x))
    const j = Math.min(LUT_N - 1, i + 1)
    const f = x - i
    const a = (row * LUT_N + i) * 4
    const b = (row * LUT_N + j) * 4
    out.set(
      lutData[a] * (1 - f) + lutData[b] * f,
      lutData[a + 1] * (1 - f) + lutData[b + 1] * f,
      lutData[a + 2] * (1 - f) + lutData[b + 2] * f,
    )
    return out
  }
  const curvePointAt = (arcNorm: number, out: THREE.Vector3) => lutVecAt(0, arcNorm, out)

  const sOf = (g: number) => (gHead - g) / GSPAN
  let markDist = 1e9

  function advance(dt: number, now: number) {
    gHead += SPEED * dt
    shared.uMotion.value = SPEED * dt
    shared.uTime.value = now
    shared.uGHead.value = gHead
    shared.uCutA.value = cutA
    shared.uCutB.value = cutB

    if (phase === 'armed') {
      shared.uCutActive.value = 0
      shared.uClose.value = 0
      shared.uBlade.value = 0
      piece.visible = false
      const sMid = sOf(cutA + HALF_CUT)
      markDist = sMid > 0.02 ? camera.position.distanceTo(curvePointAt(sMid, tmpP)) : 1e9
      if (sMid > 0.06 && markDist <= FIRE_DIST) {
        phase = 'cutting'
        cutT = 0
        cutSMid = sMid
        pieceMat.uniforms.uPieceGHead.value = gHead
        shared.uWhipAt.value = sMid
      }
    } else {
      cutT += dt
      shared.uCutActive.value = 1
      // Blade: a hard, fast flash on both new edges, then a faint permanent
      // splice line for as long as the join is on screen.
      shared.uBlade.value = cutT < 0.055 ? 1 : Math.max(0, 1 - (cutT - 0.055) / 0.15)
      // Gap: released a beat after the blade, and it snaps rather than glides.
      const close = clamp01((cutT - 0.09) / 0.30)
      shared.uClose.value = close <= 0 ? 0 : Math.min(1.06, easeOutBack(close))
      shared.uWhip.value = Math.max(0, 1 - cutT / 0.75)

      // The excised run: released, tipped out of the plane, and gone.
      const fall = clamp01((cutT - 0.03) / 0.72)
      piece.visible = fall < 1
      if (piece.visible) {
        const u = pieceMat.uniforms
        curvePointAt(cutSMid, tmpP)
        ;(u.uPieceCentre.value as THREE.Vector3).copy(tmpP)
        // Roll it about its own long axis, not end over end. The excised run is
        // eight frames — twenty-odd world units — so a tumble about its centre
        // swings one end straight through the lens.
        lutVecAt(1, cutSMid, tmpAxis).normalize()
        // Only a tip, not a flip: the whole point of the falling piece is that
        // you can still read the frames being thrown away.
        tmpQ.setFromAxisAngle(tmpAxis, fall * 0.85)
        tmpQ2.setFromAxisAngle(WORLD_UP, fall * 0.38)
        tmpQ.premultiply(tmpQ2)
        tmpM4.makeRotationFromQuaternion(tmpQ)
        ;(u.uPieceRot.value as THREE.Matrix3).setFromMatrix4(tmpM4)
        // Local gravity, scaled to the piece's distance so it reads the same
        // whether the cut lands near or far.
        const depth = Math.max(2, camera.position.distanceTo(tmpP))
        const g = depth * 0.145
        // Thrown clear of the strip first, then gravity takes it: an arc out of
        // frame rather than a lift shaft.
        ;(u.uPieceDrift.value as THREE.Vector3).set(
          -fall * depth * 0.075,
          -g * fall * fall * 6.2 + fall * depth * 0.045,
          -fall * depth * 0.02,
        )
        u.uPieceFade.value = 1 - clamp01((fall - 0.72) / 0.28)
      }

      if (shared.uClose.value >= 1 && sOf(cutA + HALF_CUT) > RETIRE_AT) {
        // Retire without a reset: the surviving half's mapping is identical
        // once gHead absorbs the closure, so nothing on screen moves.
        gHead += HALF_CUT
        phase = 'armed'
        shared.uWhip.value = 0
        armNext()
        // gHead only ever grows, and it is a float32 by the time it reaches the
        // shader. Left alone, a page open for hours would quantise fract(vG)
        // and the frames would start to step. Winding it back a whole number of
        // cycles is invisible — cell identity is mod CYCLE, and cutA moves with
        // it — so do that once it gets large.
        if (gHead > 4000) {
          const k = Math.floor(gHead / CYCLE) - 4
          gHead -= k * CYCLE
          lastN -= k
          cutA -= k * CYCLE
          cutB -= k * CYCLE
        }
      }
    }
  }

  // ---- the marker that tracks the doomed run ---------------------------------
  const markerPos = new THREE.Vector3()
  function placeMarker(w: number, h: number) {
    const m = marker.value
    if (!m) return
    const sMid = sOf(cutA + HALF_CUT)
    // Up a beat before the blade, and dead with the cut it describes.
    const appear = clamp01((46 - markDist) / 10)
    const die = phase === 'cutting' ? clamp01(1 - cutT / 0.45) : 1
    const vis = appear * die
    if (vis <= 0.01) {
      m.style.opacity = '0'
      return
    }
    curvePointAt(sMid, markerPos)
    markerPos.project(camera)
    // Keep it inside the frame: a label that describes a run has to be readable
    // even when that run is heading for the corner.
    const x = Math.min(Math.max((markerPos.x * 0.5 + 0.5) * w, 110), w - 110)
    // Narrow viewports stack the copy over the whole upper half, so the marker
    // is confined to the lower part of the frame rather than landing on it.
    const yMin = w < 760 ? h * 0.56 : 54
    const y = Math.min(Math.max((-markerPos.y * 0.5 + 0.5) * h, yMin), h - 30)
    m.style.opacity = String(vis)
    m.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -128%)`
  }

  // ---- render ----------------------------------------------------------------
  let raf = 0
  let last = 0
  let w = 0
  let h = 0

  function resize() {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    w = r.width
    h = r.height
    gl.setSize(w, h, false)
    camera.aspect = w / h
    // A narrow viewport crops the sweep badly, so widen the lens rather than
    // let the strip fall out of frame.
    camera.fov = camera.aspect < 1.15 ? 40 : camera.aspect < 1.6 ? 32 : 27
    camera.updateProjectionMatrix()
    shared.uCamPos.value.copy(camera.position)
  }

  function draw(now: number) {
    const t = now / 1000
    const dt = last ? Math.min(0.05, t - last) : 0.016
    last = t
    advance(dt, t)
    placeMarker(w, h)
    gl.render(scene, camera)
    raf = requestAnimationFrame(draw)
  }

  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(el)

  const stop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    last = 0
  }
  const start = () => {
    if (!raf) raf = requestAnimationFrame(draw)
  }

  let onScreen = false
  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((e) => e.isIntersecting)
      if (onScreen && !document.hidden) start()
      else stop()
    },
    { threshold: 0.02 },
  )

  const onVis = () => {
    if (document.hidden) stop()
    else if (onScreen) start()
  }

  if (reduced) {
    // A single still, not a paused animation: wind the state to the frame
    // where the blade has landed and the piece is on its way out, then render
    // once and never schedule anything.
    let k = 0
    while (phase !== 'cutting' && k < 3000) advance(1 / 60, k++ / 60)
    for (let i = 0; i < 11; i++) advance(1 / 60, (k + i) / 60)
    placeMarker(w, h)
    gl.render(scene, camera)
  } else {
    io.observe(el)
    document.addEventListener('visibilitychange', onVis)
  }

  const onLost = (e: Event) => {
    e.preventDefault()
    stop()
    failed.value = true
  }
  cv.addEventListener('webglcontextlost', onLost)

  teardown = () => {
    stop()
    ro.disconnect()
    io.disconnect()
    document.removeEventListener('visibilitychange', onVis)
    cv.removeEventListener('webglcontextlost', onLost)
    stripGeo.dispose()
    pieceGeo.dispose()
    stripMat.dispose()
    pieceMat.dispose()
    atlas.dispose()
    soundTex.dispose()
    curveTex.dispose()
    gl.dispose()
  }
})

onBeforeUnmount(() => teardown?.())

// -----------------------------------------------------------------------------
// Geometry: laid out in film coordinates. x is an offset in gate frames from the
// head of the mesh; y is the across-film coordinate. The vertex shader turns
// that into world space, so this never has to be rebuilt.
// -----------------------------------------------------------------------------
function buildStripGeometry(THREE: typeof import('three'), g0: number, g1: number, step: number) {
  const cols = Math.max(2, Math.ceil((g1 - g0) / step) + 1)
  const rows = 9 // enough to carry the across-the-film curl through the lighting
  const pos = new Float32Array(cols * rows * 3)
  const idx: number[] = []
  for (let i = 0; i < cols; i++) {
    const g = g0 + ((g1 - g0) * i) / (cols - 1)
    for (let j = 0; j < rows; j++) {
      const v = (j / (rows - 1)) * 2 - 1
      const o = (i * rows + j) * 3
      pos[o] = g
      pos[o + 1] = v
      pos[o + 2] = 0
    }
  }
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j
      const b = a + rows
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  return geo
}

// -----------------------------------------------------------------------------
// Curve LUT: resample the spine at equal arc length, carry a rotation-minimising
// frame along it, and record per station the roll that would put the emulsion
// square to the lens. Frenet frames flip through inflections, which on a ribbon
// shows up as the strip snapping over; parallel transport does not.
// -----------------------------------------------------------------------------
function buildCurveLut(
  THREE: typeof import('three'),
  curve: import('three').Curve<import('three').Vector3>,
  n: number,
  eye: import('three').Vector3,
) {
  const DENSE = 3000
  const pts: import('three').Vector3[] = []
  for (let i = 0; i <= DENSE; i++) pts.push(curve.getPoint(i / DENSE))
  const cum = new Float64Array(DENSE + 1)
  for (let i = 1; i <= DENSE; i++) cum[i] = cum[i - 1] + pts[i].distanceTo(pts[i - 1])
  const arcTotal = cum[DENSE]

  const at = (arc: number) => {
    let lo = 0
    let hi = DENSE
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid] < arc) lo = mid + 1
      else hi = mid
    }
    const i = Math.max(1, lo)
    const seg = cum[i] - cum[i - 1] || 1
    const f = (arc - cum[i - 1]) / seg
    return pts[i - 1].clone().lerp(pts[i], f)
  }

  const P: import('three').Vector3[] = []
  const T: import('three').Vector3[] = []
  for (let i = 0; i < n; i++) {
    const arc = (i / (n - 1)) * arcTotal
    P.push(at(arc))
  }
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)]
    const b = P[Math.min(n - 1, i + 1)]
    T.push(b.clone().sub(a).normalize())
  }

  // Parallel transport, double-reflection method. Seeded toward the eye so the
  // frame starts on the emulsion side rather than wherever the curve's first
  // tangent happens to put it; the per-station facing angle below does the rest.
  const N: import('three').Vector3[] = []
  const B: import('three').Vector3[] = []
  let nrm = eye.clone().sub(P[0])
  nrm.addScaledVector(T[0], -T[0].dot(nrm))
  if (nrm.lengthSq() < 1e-6) nrm = new THREE.Vector3(0, 1, 0)
  nrm.normalize()
  N.push(nrm.clone())
  B.push(new THREE.Vector3().crossVectors(T[0], nrm).normalize())
  for (let i = 1; i < n; i++) {
    const v1 = P[i].clone().sub(P[i - 1])
    const c1 = v1.lengthSq() || 1e-9
    const nL = N[i - 1].clone().addScaledVector(v1, (-2 / c1) * v1.dot(N[i - 1]))
    const tL = T[i - 1].clone().addScaledVector(v1, (-2 / c1) * v1.dot(T[i - 1]))
    const v2 = T[i].clone().sub(tL)
    const c2 = v2.lengthSq() || 1e-9
    const nNext = nL.addScaledVector(v2, (-2 / c2) * v2.dot(nL)).normalize()
    N.push(nNext)
    B.push(new THREE.Vector3().crossVectors(T[i], nNext).normalize())
  }

  // The roll that would put the emulsion square to the lens, per station.
  // Baking this means the shader's twist function is pure art direction: zero
  // is "readable", and everything else is a deliberate departure from it. A
  // single global bias could not do that — transport drifts several tens of
  // degrees across a curve this long, and the near end rolled past edge-on into
  // an unreadable smear.
  const face: number[] = []
  const scratch = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    scratch.copy(eye).sub(P[i])
    scratch.addScaledVector(T[i], -T[i].dot(scratch)).normalize()
    let a = Math.atan2(-B[i].dot(scratch), N[i].dot(scratch))
    // Unwrap: a branch cut in the middle of the strip would interpolate as a
    // full rotation between two adjacent stations.
    if (i > 0) {
      while (a - face[i - 1] > Math.PI) a -= Math.PI * 2
      while (a - face[i - 1] < -Math.PI) a += Math.PI * 2
    }
    face.push(a)
  }

  const lutData = new Float32Array(n * 4 * 4)
  const put = (row: number, i: number, v: import('three').Vector3, w: number) => {
    const o = (row * n + i) * 4
    lutData[o] = v.x
    lutData[o + 1] = v.y
    lutData[o + 2] = v.z
    lutData[o + 3] = w
  }
  for (let i = 0; i < n; i++) {
    put(0, i, P[i], face[i])
    put(1, i, T[i], 0)
    put(2, i, N[i], 0)
    put(3, i, B[i], 0)
  }

  return { lutData, arcTotal }
}

// -----------------------------------------------------------------------------
// Shaders
// -----------------------------------------------------------------------------
const VERT = /* glsl */ `
precision highp float;

uniform sampler2D uCurve;
uniform float uArcTotal;
uniform float uPitch;
uniform float uHalfW;
uniform float uTime;
uniform float uGHead;
uniform float uCutA;
uniform float uCutB;
uniform float uClose;
uniform float uCutActive;
uniform float uWhip;
uniform float uWhipAt;
uniform float uPieceMode;
uniform float uPieceGHead;
uniform vec3  uPieceCentre;
uniform mat3  uPieceRot;
uniform vec3  uPieceDrift;

out float vG;
out float vV;
out float vQ;
out vec3  vN;
out vec3  vW;

vec4 lutFetch(int row, float x) {
  float fx = clamp(x, 0.0, 1.0) * float(LUT_N - 1);
  int i = int(floor(fx));
  int j = min(i + 1, LUT_N - 1);
  float f = fx - float(i);
  return mix(texelFetch(uCurve, ivec2(i, row), 0), texelFetch(uCurve, ivec2(j, row), 0), f);
}

// A ribbon of film in air is never still. Small, and ramped toward the free
// near end so the far end stays readable.
vec3 sway(float q) {
  float ramp = q * q * 0.9 + 0.06;
  return vec3(
    sin(q * 5.1 + uTime * 0.33) * 0.30,
    sin(q * 3.9 - uTime * 0.26 + 1.1) * 0.26,
    sin(q * 4.4 + uTime * 0.21 + 2.2) * 0.16
  ) * ramp * uHalfW;
}

// Twist about the strip's own long axis. This is what makes it a ribbon and
// not a flag: it rolls, turns edge-on, and catches the key on the curl.
// Roll away from square-to-lens. Gentle where the frames are meant to be read,
// hard at the far end, where the strip turns nearly edge-on and the key catches
// the curl. Zero here would be a billboard; this is the departure from one.
float roll(float q) {
  float far = smoothstep(0.62, 0.02, q);
  float amp = 0.56 + 0.80 * far * far;
  float a = amp * sin(q * 3.4 + uTime * 0.38)
          + amp * 0.38 * sin(q * 7.3 - uTime * 0.61 + 1.3)
          - 0.24 * (q - 0.5);
  // The snap sends a pulse out along the film from the splice. Kept off the
  // excised piece — at this wavelength it corkscrewed an eight-frame run into
  // an unreadable smear on its way out of frame.
  if (uWhip > 0.0 && uPieceMode < 0.5) {
    float d = q - uWhipAt;
    a += uWhip * 0.55 * sin(d * 9.0 - uTime * 7.0) * exp(-abs(d) * 5.0);
  }
  return a;
}

float twist(float q) {
  return lutFetch(0, q).w + roll(q);
}

// Differentiated numerically so it can never drift out of step with twist().
float dTwist(float q) {
  const float e = 0.0025;
  return (twist(q + e) - twist(q - e)) / (2.0 * e);
}

void main() {
  float gOff = position.x;
  float v = position.y;

  float g = (uPieceMode > 0.5) ? (uCutB - gOff) : (uGHead - gOff);

  float gEff = g;
  if (uPieceMode < 0.5 && uCutActive > 0.5) {
    // Split at the MIDDLE of the doomed run, not at its edges. Leaving the run
    // itself undisplaced left two triangles bridging the closing gap, and the
    // fragment test only discarded half of each — the visible halves stretched
    // one frame of picture across a dozen world units and read as a smear.
    // Split this way, the only bridging triangle lies wholly inside the
    // discarded range.
    float hc = (uCutB - uCutA) * 0.5;
    gEff = (g < (uCutA + uCutB) * 0.5) ? g + uClose * hc   // near half backs off
                                       : g - uClose * hc;  // far half comes on
  }

  float head = (uPieceMode > 0.5) ? uPieceGHead : uGHead;
  float arc = (head - gEff) * uPitch;
  float q = clamp(arc / uArcTotal, 0.0, 1.0);

  vec3 P = lutFetch(0, q).xyz + sway(q);
  vec3 T = normalize(lutFetch(1, q).xyz);
  vec3 N0 = lutFetch(2, q).xyz;
  vec3 B0 = lutFetch(3, q).xyz;
  N0 = normalize(N0 - T * dot(T, N0));
  B0 = normalize(cross(T, N0));

  float th = twist(q);
  float dth = dTwist(q) / uArcTotal;
  float c = cos(th), s = sin(th);
  vec3 Bt = B0 * c + N0 * s;
  vec3 Nt = -B0 * s + N0 * c;

  // Real film curls across its width. It is a small thing that makes the
  // highlight travel instead of switching on and off.
  float curl = -0.11 * (v * v - 0.3333) * uHalfW;

  vec3 world = P + Bt * (v * uHalfW) + Nt * curl;

  vec3 dPdv = Bt * uHalfW + Nt * (-0.11 * 2.0 * v * uHalfW);
  vec3 dPda = T + dth * (Nt * (v * uHalfW) - Bt * curl);
  // Align the geometric normal with the frame's own normal so "emulsion side"
  // is a fixed fact about the strip, not an accident of winding order.
  vec3 nrm = normalize(cross(dPdv, dPda));
  if (dot(nrm, Nt) < 0.0) nrm = -nrm;

  if (uPieceMode > 0.5) {
    world = uPieceCentre + uPieceRot * (world - uPieceCentre) + uPieceDrift;
    nrm = uPieceRot * nrm;
  }

  vG = g;
  vV = v;
  vQ = q;
  vN = nrm;
  vW = world;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}
`


const FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uAtlas;
uniform sampler2D uSound;
uniform float uCutA;
uniform float uCutB;
uniform float uCutActive;
uniform float uBlade;
uniform float uPieceMode;
uniform float uPieceFade;
uniform vec3  uCamPos;
uniform vec3  uFog;
uniform float uFocus;
uniform float uCoc;
uniform float uMotion;

in float vG;
in float vV;
in float vQ;
in vec3  vN;
in vec3  vW;

out vec4 outColor;

const float PITCH      = 1.747;
const float FRAME_LINE = 0.067;
const float PIC_TOP    =  0.800;
const float PIC_BOT    = -0.460;
const float PERF_C     =  0.890;
const float PERF_HA    =  0.096;   // half size along the strip
const float PERF_HV    =  0.052;   // half size across
const float PERF_R     =  0.020;
const float TRK_C      = -0.625;
const float TRK_H      =  0.135;

const vec2 ATLAS = vec2(3600.0, 1716.0);
const vec2 CELL  = vec2(432.0, 324.0);
const vec2 SLOT  = vec2(448.0, 340.0);
const vec2 ORG0  = vec2(16.0, 16.0);

// A ShaderMaterial writes straight into the renderer's output buffer, so the
// sRGB encode that lit materials get from <colorspace_fragment> has to be done
// here. Without it every linear value is displayed as if it were already
// encoded and the whole strip sits four stops under.
vec3 linearToSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

float roundBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

// The picture, filtered by the hardware from gradients we hand it.
//
// The atlas uv is discontinuous at every frame boundary (the cell index jumps),
// so its automatic derivatives are garbage there — which is why this used to use
// textureLod with a hand-rolled level. That was a large part of the shimmer:
// fwidth() is evaluated per 2x2 quad, so the level came out quantised, adjacent
// quads picked different mips, and the picture crawled whenever the film moved.
//
// vG and vV ARE continuous, so the correct gradients can be derived from them
// analytically and handed to textureGrad. The hardware then does proper
// anisotropic filtering, and defocus is a scale on those same gradients. The
// atlas carries an 8px gutter of its own edge pixels per cell, so no clamping
// inset is needed — and without that inset the picture stops breathing as the
// filter level changes.
vec3 samplePicture(vec2 f, vec2 ddx, vec2 ddy) {
  float cell = mod(floor(vG), CYCLE);
  vec2 org = (ORG0 + vec2(mod(cell, 8.0), floor(cell / 8.0)) * SLOT) / ATLAS;
  vec2 ext = CELL / ATLAS;
  vec2 uv = org + clamp(f, 0.0, 1.0) * ext;
  return textureGrad(uAtlas, uv, ddx * ext, ddy * ext).rgb;
}

void main() {
  // The excised run is drawn by its own mesh so it can leave; the strip itself
  // is simply not there any more.
  if (uPieceMode < 0.5 && uCutActive > 0.5 && vG > uCutA && vG < uCutB) discard;

  // Screen-space footprints. Every edge below is antialiased against these
  // rather than against a fixed width in film units — a fixed width goes
  // sub-pixel in the distance, and a sub-pixel hard edge crawls.
  float fwV = max(fwidth(vV), 1e-6);
  float fwG = max(fwidth(vG), 1e-6);

  float alpha = 1.0;
  vec3 base = vec3(0.030, 0.029, 0.028); // film base, between everything

  // ---- perforations, four to the frame, punched right through ---------------
  float pa = (fract(vG * 4.0 + 0.5) - 0.5) * (PITCH * 0.25);
  float sdA = roundBox(vec2(pa, vV + PERF_C), vec2(PERF_HA, PERF_HV), PERF_R);
  float sdB = roundBox(vec2(pa, vV - PERF_C), vec2(PERF_HA, PERF_HV), PERF_R);
  float sd = min(sdA, sdB);
  float aa = max(fwidth(sd), 1e-6);
  float outside = smoothstep(-aa, aa, sd);
  // Stop punching once a hole is down to a pixel or two. Alpha-to-coverage has
  // four levels to work with, and a sub-pixel hole dithered across them crawls
  // along the whole edge of the strip. Below that size the hole is printed
  // instead, which keeps the pitch reading without the noise.
  float punch = smoothstep(PERF_HV * 0.85, PERF_HV * 0.30, aa);
  alpha = mix(1.0, outside, punch);
  // A hair of shading in the wall of the hole gives the film thickness.
  base = mix(base * 0.35, base, smoothstep(0.0, aa * 3.5, sd));
  base = mix(base, base * 0.30, (1.0 - outside) * (1.0 - punch));

  // ---- the picture ----------------------------------------------------------
  float fx = (fract(vG) * PITCH - FRAME_LINE * 0.5) / (PITCH - FRAME_LINE);
  float fy = (PIC_TOP - vV) / (PIC_TOP - PIC_BOT);

  float dist = distance(vW, uCamPos);
  float coc = clamp((uFocus - dist) * uCoc, 0.0, 1.0);

  // Gradients of the in-cell coordinate, built from the two varyings that do
  // not wrap, then widened for defocus.
  float kx = PITCH / (PITCH - FRAME_LINE);
  float ky = -1.0 / (PIC_TOP - PIC_BOT);
  vec2 gx = vec2(kx * dFdx(vG), ky * dFdx(vV));
  vec2 gy = vec2(kx * dFdy(vG), ky * dFdy(vV));
  float blur = 1.0 + coc * coc * 7.0;
  vec2 ddx = gx * blur;
  vec2 ddy = gy * blur;

  // Shutter. The film travels uMotion gate-frames between one rendered frame
  // and the next; at the near end that is tens of pixels, and sharp detail
  // moving that fast strobes however well it is filtered. Widening the sample
  // footprint along the film axis by that travel IS motion blur, and it costs
  // nothing because the hardware is already filtering anisotropically.
  if (uPieceMode < 0.5) {
    float ax = abs(ddx.x) + abs(ddy.x);
    float want = kx * uMotion * 0.28;
    float mb = clamp(ax > 1e-6 ? want / ax : 1.0, 1.0, 14.0);
    ddx.x *= mb;
    ddy.x *= mb;
  }

  vec3 pic = samplePicture(vec2(fx, fy), ddx, ddy);

  // The frame boundary used to be a hard branch — no antialiasing at all, which
  // is what crawled as a jittering bar down every frame line. Coverage mask now.
  vec2 fwF = max(abs(gx) + abs(gy), vec2(1e-6));
  float picMask = smoothstep(0.0, fwF.x, fx) * smoothstep(0.0, fwF.x, 1.0 - fx)
                * smoothstep(0.0, fwF.y, fy) * smoothstep(0.0, fwF.y, 1.0 - fy);

  // Gate edge: a darkened band either side of the picture.
  float e = min(abs(vV - PIC_TOP), abs(vV - PIC_BOT));
  base = mix(base, base * 0.55, 1.0 - smoothstep(0.03 - fwV, 0.03 + fwV, e));
  base = mix(base, pic, picMask);

  // ---- optical soundtrack, from the take's own audio -------------------------
  // Variable-area, the way a sound print carries it: the clear area is the
  // waveform. Where the take is quiet the track collapses to its bias line,
  // which is the whole point — you can see the silence before it is removed.
  float dTrk = abs(vV - TRK_C);
  float trkMask = 1.0 - smoothstep(TRK_H - fwV, TRK_H + fwV, dTrk);
  if (trkMask > 0.0) {
    float amp = texture(uSound, vec2(vG / CYCLE, 0.5)).r;
    float ink = 1.0 - smoothstep(-fwV, fwV, dTrk - (amp * (TRK_H - 0.020) + 0.004));
    base = mix(base, mix(vec3(0.010), vec3(0.62, 0.616, 0.606), ink), trkMask);
  }

  // ---- the splice ------------------------------------------------------------
  // Two hard edges appear where the blade lands. The flash is added after the
  // lighting so it does not depend on which way the film happens to be facing
  // at that instant — it is the loudest thing on the strip for a sixth of a
  // second, and then it is a seam.
  float blade = 0.0;
  if (uCutActive > 0.5) {
    float edge = min(abs(vG - uCutA), abs(vG - uCutB));
    float line = 1.0 - smoothstep(0.006, 0.021 + fwG, edge);
    base = mix(base, vec3(0.52), line * 0.34);
    blade = line * uBlade;
  }

  // ---- one hard raking key, and almost nothing else -------------------------
  // vN already points out of the emulsion side (the vertex shader aligns it
  // with the frame normal), so which face we are looking at is a fact about the
  // film, not about triangle winding. Using gl_FrontFacing here flipped it and
  // rendered the whole strip as its own grey backing.
  vec3 N = normalize(vN);
  vec3 V = normalize(uCamPos - vW);
  bool backSide = dot(N, V) < 0.0;
  if (backSide) N = -N;

  vec3 L = normalize(vec3(-0.46, 0.56, 0.69));
  float diff = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 90.0);
  float specStr = 0.38;

  if (backSide) {
    // The base side of the film: dull, dark, and glossier than the emulsion —
    // but a tight glint, not a sheet of white where the strip rolls over.
    base = vec3(dot(base, vec3(0.299, 0.587, 0.114))) * 0.17 + vec3(0.023, 0.022, 0.021);
    spec = pow(max(dot(N, H), 0.0), 190.0);
    specStr = 0.26;
  }

  float ambient = 0.065 + 0.045 * (N.y * 0.5 + 0.5);
  vec3 lit = base * (ambient + 1.55 * diff) + vec3(spec * specStr) + vec3(blade);

  // ---- depth: fog to the page's own background, nothing coloured ------------
  float fog = clamp(1.0 - exp(-pow(max(dist - 14.0, 0.0) * 0.045, 2.0)), 0.0, 1.0);
  lit = mix(lit, uFog, fog);
  alpha = mix(alpha, 1.0, smoothstep(0.45, 0.92, fog));
  if (uPieceMode > 0.5) lit = mix(uFog, lit, uPieceFade);

  outColor = vec4(linearToSRGB(lit), alpha);
}
`
</script>

<template>
  <div ref="host" class="ribbon">
    <canvas ref="canvas" class="ribbon__gl" />

    <!-- The marker the strip is being judged by. It tracks the run it describes
         and dies with it. Real measured values only. -->
    <div ref="marker" class="ribbon__marker" aria-hidden="true">
      <span class="ribbon__marker-key">SILENCE</span>
      <span class="ribbon__marker-val">{{ CUT_SECONDS.toFixed(3) }}s</span>
      <span class="ribbon__marker-sub">− {{ CUT_CELL_COUNT }} frames</span>
    </div>

    <p class="ribbon__slug" aria-hidden="true">
      src_bmx7xkk · 00:01:57.00 → 00:02:03.16 · 6 fps · silence detected at −30 dB
    </p>

    <p v-if="failed" class="ribbon__slug ribbon__slug--fail">
      WebGL unavailable — the page keeps its meaning without this.
    </p>
  </div>
</template>

<style scoped>
.ribbon {
  position: relative;
  width: 100%;
  height: 100%;
}
.ribbon__gl {
  display: block;
  width: 100%;
  height: 100%;
}
.ribbon__marker {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.3rem 0.6rem 0.3rem 0.55rem;
  border-left: 2px solid #f28f84;
  background: rgba(10, 10, 11, 0.86);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}
.ribbon__marker-key {
  color: #f28f84;
}
.ribbon__marker-val {
  color: #f4f4f5;
  font-weight: 600;
}
.ribbon__marker-sub {
  color: rgba(244, 244, 245, 0.5);
}
.ribbon__slug {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding-right: 0.25rem;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  color: rgba(244, 244, 245, 0.32);
  pointer-events: none;
}
.ribbon__slug--fail {
  bottom: auto;
  top: 50%;
  text-align: center;
  color: rgba(244, 244, 245, 0.5);
}
</style>
