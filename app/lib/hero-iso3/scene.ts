/**
 * The assembly line in REAL 3D — the successor to the Canvas 2D study at
 * /lab/iso (owner pivot, 2026-08-18: stop paying the fake-3D occlusion tax;
 * spend the effort on design). Same world, same numbers, same camera LOOK.
 *
 * THE CAMERA IS A CUSTOM PROJECTION MATRIX, NOT AN ORTHOGRAPHIC CAMERA.
 * The study's projection is a hand-tuned oblique axonometric:
 *   sx = ( x·cos12° + z·cos30° )·S      sy = ( −x·sin12° + z·sin30° − y )·S
 * Its two screen rows are NOT orthonormal (checked: lengths 1.31 / 1.14,
 * dot 0.23), so no rotation of a stock OrthographicCamera can reproduce it.
 * We build the projection matrix directly: rows 0/1 are the study's mapping
 * fitted by the same probe/layout algorithm, row 2 is depth along the view
 * direction (0.886, −0.684, −1) so the z-buffer resolves what painter's
 * order used to. The camera transform stays identity, so world space IS view
 * space and lights/normals behave normally.
 *
 * THE FILM IS ONE STATIC RIBBON WITH A LIVE TEXTURE. The ribbon's UV.u is
 * arclength along the path; every tick a small offscreen 2D canvas redraws
 * the strip IN WORLD-S SPACE — frame tones, sprocket perforations, caption
 * bars stamping in at the turret plane — so all of the study's transport
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

export interface Iso3Scene {
  start(): void
  stop(): void
  still(t?: number): void
  resize(): void
  destroy(): void
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
const TABLE = { x0: 0.4, x1: 9.85, top: 0, z: 2.05, deep: 1.05 }
const BED = { x0: -3.3, x1: 0.5, z: 2.05, top: 0.55 }
const ROLL = { x: 9.75, r: 0.5 }
const RISE = 9.4
// COLOSSAL, BY RULING (owner 2026-08-19): the reel is the ARCHIVE — deep
// video memory, wound and searchable. Doubled diameter: it looms over the
// whole line, and the coil tangency drags the axle to mid-bench, which is
// where the big gantry now stands.
const REEL = { r: 5.8, w: FILM_W }
const COIL_F = 0.58
const DEST = { x: 17.6, r: 1.5 }

const FILM_SPEED = 1.05
const beltY = 0.02
const gateY = beltY + ROLL.r + RISE
const coilR = REEL.r * COIL_F
const reelX = ROLL.x - coilR
const reelY = gateY
// The optical line lives in the CLEAR AIR under the wheel's rim (at 0.47 the
// colossal flange swallowed lamp and rigging whole); the drop rods emerge
// from behind the archive, which reads as hung — source above, work below.
// The optical line sits ON the A-bars: the crossbeams run slightly below
// the wheel's lowest rim edge (owner: no collision with the reel), complete
// each girder into a letter A, and their cantilevered ends carry the head.
const lampY = beltY + ROLL.r + RISE * 0.347
// THE HEAD lives at the climb (owner: "it all happens in between the
// girders") — masts straddle the film, the housing's muzzle nearly kisses it.
const MAST = { x0: 9.44, x1: 9.85, top: 6.15, z: 1.545, t: 0.2 }
const LAMP_CX = 8.9
const LAMP_LEN = 0.62 // half-length of the housing along x
const STILL_T = 11.9

// THE BOOT NARRATIVE (owner: "lights, camera, action"): one file drops into
// the acetate; the pool flares; the line starts moving; the laser wakes and
// inscribes; the projector strikes; the three screens ignite one-two-three;
// then steady state. Nothing loops except the work itself.
const BOOT = { plane: 0.45, drop: 0.85, run: 3.05, runRamp: 1.2, proj: 4.7, beam0: 5.5, beamGap: 0.55 }
const transportDist = (t: number) => {
  if (t <= BOOT.run) return 0
  const u = t - BOOT.run
  return FILM_SPEED * (u < BOOT.runRamp ? (u * u) / (2 * BOOT.runRamp) : u - BOOT.runRamp / 2)
}


const AX = (12 * Math.PI) / 180
const AZ = (30 * Math.PI) / 180
const CX = Math.cos(AX)
const SX = Math.sin(AX)
const CZ = Math.cos(AZ)
const SZ = Math.sin(AZ)

// film path arclengths
const START = BED.x1 - 0.25
const runFlat = ROLL.x - ROLL.r - START
const ARC = (ROLL.r * Math.PI) / 2
const runVert = runFlat + ARC
const totalPath = runVert + RISE
// the arclength of the frame standing in the gate
const S_GATE = runVert + (lampY - beltY - ROLL.r)

export function createIso3(canvas: HTMLCanvasElement): Iso3Scene {
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
  scene.background = new THREE.Color(0x08090a)
  const camera = new THREE.Camera()

  // restrained bloom pulls the practicals, screens and beams into one glow
  // family — the finishing move the noir pass asked for
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.55, 0.72)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  // ---- fit + projection ---------------------------------------------------
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

    // the same probe/fit as the study, so both routes compose identically
    const px = (x: number, y: number, z: number): [number, number] => [
      x * CX + z * CZ,
      -x * SX + z * SZ - y,
    ]
    const probe: [number, number, number][] = [
      [BED.x0, BED.top + 2.6, 0], [BED.x0, -TABLE.deep, TABLE.z],
      [DEST.x + DEST.r, lampY + 3.0, 0], [DEST.x, lampY - 3.0, 0],
      [reelX + REEL.r, reelY + REEL.r, -REEL.w / 2], [reelX, TABLE.top, FILM_W / 2 + 0.52],
      [TABLE.x1, 0, -TABLE.z], [ROLL.x, beltY, TABLE.z],
    ]
    const pts = probe.map((p) => px(p[0], p[1], p[2]))
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    // Aspect-aware: at 16:9 the machine presses close to the type for one
    // shared stage; at taller viewports it yields ground so the column and
    // the rite never collide ("room to breathe").
    const wide = W / H
    const widthBudget = wide > 1.55 ? 0.78 : wide > 1.25 ? 0.7 : 0.97
    const centerX = wide > 1.55 ? 0.585 : wide > 1.25 ? 0.63 : 0.5
    const centerY = wide > 1.25 ? 0.52 : 0.63
    const S = Math.min((W * widthBudget) / (Math.max(...xs) - Math.min(...xs)), (H * 0.9) / (Math.max(...ys) - Math.min(...ys)))
    const ox = W * centerX - ((Math.min(...xs) + Math.max(...xs)) / 2) * S
    const oy = H * centerY - ((Math.min(...ys) + Math.max(...ys)) / 2) * S

    const v = new THREE.Vector3(0.886, -0.684, -1).normalize()
    const corners: [number, number, number][] = [
      [BED.x0 - 2, -3, -4], [DEST.x + 3, gateY + REEL.r + 3, 4],
      [BED.x0 - 2, gateY + REEL.r + 3, 4], [DEST.x + 3, -3, -4],
    ]
    const ds = corners.map((c) => v.x * c[0] + v.y * c[1] + v.z * c[2])
    // wide enough that the vast stage floor never crosses the clip planes —
    // a tight window sliced it with a razor-straight diagonal seam
    const dMin = Math.min(...ds) - 60
    const dMax = Math.max(...ds) + 60
    const k = 2 / (dMax - dMin)

    camera.projectionMatrix.set(
      (2 * S * CX) / W, 0, (2 * S * CZ) / W, (2 * ox) / W - 1,
      (2 * S * SX) / H, (2 * S) / H, (-2 * S * SZ) / H, 1 - (2 * oy) / H,
      v.x * k, v.y * k, v.z * k, -dMin * k - 1,
      0, 0, 0, 1,
    )
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }

  // ---- palette ------------------------------------------------------------
  const M = {
    deck: new THREE.MeshStandardMaterial({ color: 0x30303a, roughness: 0.88 }),
    deckDark: new THREE.MeshStandardMaterial({ color: 0x24242c, roughness: 0.9 }),
    bed: new THREE.MeshStandardMaterial({ color: 0x363640, roughness: 0.88 }),
    well: new THREE.MeshStandardMaterial({ color: 0x1c0e0c, roughness: 1 }),
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

  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material, parent: THREE.Object3D = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat)
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }
  const cyl = (r: number, len: number, mat: THREE.Material, axis: 'x' | 'y' | 'z', parent: THREE.Object3D = scene, seg = 40) => {
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
    floor.position.y = -TABLE.deep - 0.02
    scene.add(floor)
  }

  // ---- deck + bed + die gate ---------------------------------------------
  box(TABLE.x0, TABLE.x1, -TABLE.deep, TABLE.top, -TABLE.z, TABLE.z, M.deck)
  box(BED.x0 - 0.14, BED.x1 + 0.1, -TABLE.deep, -TABLE.deep + 0.34, -BED.z - 0.1, BED.z + 0.1, M.deckDark)
  box(BED.x0, BED.x1, -TABLE.deep, BED.top, -BED.z, BED.z, M.bed)
  // the basin: a dark well sunk into the bed's top
  box(BED.x0 + 0.55, BED.x1 - 0.55, BED.top - 0.14, BED.top + 0.005, -BED.z + 0.55, BED.z - 0.55, M.well)
  // die gate: two cheeks and a lintel the strip extrudes beneath
  box(BED.x1, BED.x1 + 0.26, 0.36, 0.68, -1.38, 1.38, M.steelDark)
  box(BED.x1, BED.x1 + 0.26, 0, 0.36, 1.06, 1.38, M.steelDark)
  box(BED.x1, BED.x1 + 0.26, 0, 0.36, -1.38, -1.06, M.steelDark)

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

  // ---- the shared frame renderer -----------------------------------------
  // One function draws a frame's "content" — an abstract episode image, never
  // a photo — and BOTH the filmstrip and the wall screens call it, so what
  // stands in the gate and what the machine projects are visibly the same
  // picture. Landscape orientation in, callers handle rotation/tint.
  // THE SHOW IS ALWAYS THE SAME SHOW (owner: "stick with the original theme
  // — Mike and John, episode one"). Every frame is coverage of one two-person
  // session: two-shot, Mike close-up, John close-up, and the title card.
  function renderFrameContent(g2: CanvasRenderingContext2D, w: number, h: number, id: number, captioned: boolean) {
    const hsh = Math.abs(Math.imul(id | 0, 2654435761)) >>> 0
    const j1 = ((hsh >> 3) % 100) / 100
    const variant = ((id % 4) + 4) % 4
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
    if (variant === 0 || variant === 2) {
      // the two-shot: Mike (broader) left, John (taller) right
      person(w * 0.28, h * 0.4, h * 0.13)
      person(w * 0.72, h * 0.36, h * 0.115)
    } else if (variant === 1) {
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
    if (captioned && variant !== 3) {
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
    const key = id + (captioned ? 'c' : 'r')
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

  function drawFilm(dist: number) {
    const sToPx = FILM_TEX_W / totalPath
    const off = dist % PITCH
    // stock base + frame lines
    fctx.fillStyle = '#2b2820'
    fctx.fillRect(0, 0, FILM_TEX_W, FILM_TEX_H)
    // image field per frame, printed ACROSS the strip: rotate the shared
    // renderer 90° so its horizontal axis runs across the film's width
    const vTop = (PERF_MARGIN / FILM_W) * FILM_TEX_H
    const vH = (IMG_W / FILM_W) * FILM_TEX_H
    for (let i = -1; i * PITCH < totalPath + PITCH; i++) {
      const s0 = i * PITCH + off
      if (s0 + PITCH <= 0 || s0 >= totalPath) continue
      const id = stableId(i, off, dist)
      const u0 = (s0 + 0.09) * sToPx
      const uH = (IMG_H) * sToPx
      fctx.save()
      // image top edge = higher s; canvas y-down maps to decreasing s
      fctx.translate(u0 + uH, vTop)
      fctx.rotate(Math.PI / 2)
      // frames come out of the acetate already assembled — the pool is the
      // transformation, not any single visible tool (owner: keep it abstract)
      fctx.drawImage(frameArt(id, true), 0, 0, vH, uH)
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
    filmTex.needsUpdate = true
  }

  {
    // ribbon geometry: N segments along the flat→arc→climb path, width in z
    const SEGS = 96
    const pos: number[] = []
    const uv: number[] = []
    const idx: number[] = []
    const pt = (s: number): [number, number] => {
      if (s <= runFlat) return [START + s, beltY]
      if (s <= runVert) {
        const a = -Math.PI / 2 + ((s - runFlat) / ARC) * (Math.PI / 2)
        return [ROLL.x - ROLL.r + Math.cos(a) * ROLL.r, beltY + ROLL.r + Math.sin(a) * ROLL.r]
      }
      return [ROLL.x, beltY + ROLL.r + (s - runVert)]
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
    scene.add(filmMesh)
  }

  // ---- the head: masts straddling the climb -------------------------------
  // (owner: "it all happens in between the girders" — the projection event
  // lives inside the stand: roller journalled at the bottom, lamp on the
  // cross-shaft, gate bars at the film, reel carried on arms from the tops.)
  const bossGroup = new THREE.Group()
  // (No gate masts: the outside review called the leftover posts a "charcoal
  // thicket" sharing the stand's job — the two triangles are the ONLY stand,
  // and lamp, gate and prism all hang from the rig between them.)
  // ---- THE TWO TRIANGLES --------------------------------------------------
  // (owner: "the girders should be triangular — one at each edge of the
  // track, converging to the center, which houses the wheel. And between the
  // two, almost like a letter A, hangs the rigging for the light. A clean,
  // intentional piece of machinery.") One A-frame per track edge; the axle
  // is housed at the apexes; the laser pods hang from the up-line legs; the
  // lamp hangs from a bridge-and-boom rig slung between the frames.
  const APEX = new THREE.Vector2(reelX, reelY)
  const FOOT_L = new THREE.Vector2(reelX - 3.3, 0)
  const FOOT_R = new THREE.Vector2(reelX + 2.2, 0)
  const legXAt = (foot: THREE.Vector2, y: number) => foot.x + (y / APEX.y) * (APEX.x - foot.x)
  const legMember = (f: THREE.Vector2, zc: number) => {
    const dvec = APEX.clone().sub(f)
    const m = new THREE.Mesh(new THREE.BoxGeometry(dvec.length() + 0.1, 0.44, 0.28), M.legs)
    m.position.set((f.x + APEX.x) / 2, (f.y + APEX.y) / 2, zc)
    m.rotation.z = Math.atan2(dvec.y, dvec.x)
    m.castShadow = true
    m.receiveShadow = true
    scene.add(m)
  }
  for (const sgn of [-1, 1]) {
    const zc = sgn * MAST.z
    legMember(FOOT_L, zc)
    legMember(FOOT_R, zc)
    // feet pads + gussets, and a low base tie closing the triangle
    for (const f of [FOOT_L, FOOT_R]) {
      box(f.x - 0.5, f.x + 0.5, 0, 0.13, zc - 0.24, zc + 0.24, M.steel)
      box(f.x - 0.3, f.x + 0.3, 0.13, 0.52, zc - 0.07, zc + 0.07, M.legs)
    }

    // bearing cap at the apex
    const boss = cyl(0.34, 0.18, M.steel, 'z')
    boss.position.set(reelX, reelY, zc)
  }
  // the axle, housed between the apexes
  cyl(0.17, MAST.z * 2 + 0.4, M.steel, 'z').position.set(reelX, reelY, 0)

  // THE A-BARS: one crossbeam per girder, leg to leg — the bar that makes
  // each triangle a letter A — cantilevering down-line to carry the head
  // bolted between their ends. The bars run just below the wheel's lowest
  // edge, so structure and archive never collide on screen.
  {
    const CB_END = 10.32
    for (const sgn of [-1, 1]) {
      const zc = sgn * MAST.z
      box(legXAt(FOOT_L, lampY) - 0.12, CB_END, lampY - 0.11, lampY + 0.11, zc - 0.09, zc + 0.09, M.legs)
      // mounting boss: bar into the head's collar cheek
      box(9.62, 10.08, lampY - 0.09, lampY + 0.09, sgn * 1.3, sgn * (MAST.z - 0.09), M.steel)
    }
    // the lamp's shaft rides between the collar cheeks
    cyl(0.09, 2.6, M.steel, 'z').position.set(LAMP_CX, lampY, 0)
  }
  // roller in pillow blocks on the deck, like real transport hardware
  {
    const roller = cyl(ROLL.r * 1.03, FILM_W + 0.52, M.steel, 'z')
    roller.position.set(ROLL.x - ROLL.r, beltY + ROLL.r, 0)
    cyl(0.08, FILM_W + 0.9, M.steelDark, 'z').position.set(ROLL.x - ROLL.r, beltY + ROLL.r, 0)
    for (const sz of [-1, 1]) {
      box(ROLL.x - ROLL.r - 0.24, ROLL.x - ROLL.r + 0.24, 0, 0.58, sz * (FILM_W / 2 + 0.31) - 0.12, sz * (FILM_W / 2 + 0.31) + 0.12, M.steel)
    }
  }
  {
    const housing = cyl(0.78, LAMP_LEN * 2, M.steelDark, 'x')
    housing.position.set(LAMP_CX, lampY, 0)

  }
  let lensDiscMat: THREE.MeshStandardMaterial | null = null
  let lensRingMat: THREE.MeshStandardMaterial | null = null
  // THE PROJECTOR HEAD: one instrument on one axis. A rigid collar hugs the
  // standing film (the lit frame stays visible through its open front), the
  // lamp housing docks into its up-line face, and a lens snout leaves its
  // down-line face — the beams are born at the lens. This replaced a hung
  // picture-frame, a milky floating prism, a glow ball and stick brackets
  // (owner: "this whole rig is still pretty messy").
  {
    const cx0 = 9.55
    const cx1 = 10.15
    box(cx0, cx1, lampY + 0.62, lampY + 0.86, -1.32, 1.32, M.steel) // top plate
    box(cx0, cx1, lampY - 0.86, lampY - 0.62, -1.32, 1.32, M.steel) // bottom plate
    for (const sgn of [-1, 1]) {
      box(cx0, cx1, lampY - 0.86, lampY + 0.86, sgn * 1.08 + sgn * 0.0 - (sgn < 0 ? 0.24 : 0), sgn * 1.08 + (sgn > 0 ? 0.24 : 0), M.steel) // cheeks
    }
    const snout = cyl(0.56, 0.72, M.steelDark, 'x')
    snout.position.set(cx1 + 0.36, lampY, 0)
    lensRingMat = new THREE.MeshStandardMaterial({ color: 0x222228, emissive: 0xfff2dc, emissiveIntensity: 0 })
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.055, 12, 40), lensRingMat)
    lensRing.rotation.y = Math.PI / 2
    lensRing.position.set(cx1 + 0.73, lampY, 0)
    scene.add(lensRing)
    lensDiscMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 })
    const lensDisc = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), lensDiscMat)
    lensDisc.rotation.y = Math.PI / 2
    lensDisc.position.set(cx1 + 0.74, lampY, 0)
    scene.add(lensDisc)
  }
  scene.add(bossGroup)

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
    cyl(coilR * 0.9, REEL.w - 0.14, M.coil, 'z', reel)
    cyl(coilR, REEL.w - 0.2, M.lap, 'z', reel)
    // the archive's depth: winding laps on the coil's near face
    for (const wr of [0.38, 0.52, 0.66, 0.8]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(coilR * wr, 0.02, 6, 64),
        new THREE.MeshStandardMaterial({ color: 0x2e2a20, roughness: 1 }),
      )
      ring.position.z = REEL.w / 2 - 0.19
      reel.add(ring)
    }
    // one machined hub: a single disc, nothing stacked
    cyl(0.72, 0.3, M.steel, 'z', reel).position.z = REEL.w / 2 - 0.02
  }
  reel.position.set(reelX, reelY, 0)
  scene.add(reel)

  // ---- the throw: a shadow play on the back wall --------------------------
  // (owner: the projection lands ON A WALL — three tinted versions of the
  // same frame, like theater. The wall is page-black and lit only by what
  // falls on it, so the projections ARE the architecture.) Each shows the
  // gate's frame tinted by its destination and wears that channel's
  // watermark bug in the corner, like an ident.
  // THE PRISM explains the trinity: one white throw leaves the gate, enters a
  // glass wedge on a bracket arm, and leaves as three coloured shafts. The
  // beams' origin (lens) is the prism's output face.
  const lens = new THREE.Vector3(10.9, lampY, 0)
  const WALL_X = 16.8
  // Three LITERAL artifacts from one session (owner): a landscape episode
  // with a small YouTube mark, a phone-framed portrait clip with big captions
  // and a LinkedIn mark, and a waveform-plus-transcript under a podcast/RSS
  // mark. Different SHAPES read at any size; small logos, top right, tasteful.
  const FAN = [
    { icon: 'yt', color: '#d63d47', w: 4.6, h: 2.6, y: 3.05, z: -1.15, cone: 0.95 },
    { icon: 'in', color: '#3d78ae', w: 1.72, h: 3.5, y: 0.4, z: 2.35, cone: 0.62 },
    { icon: 'pod', color: '#d9a25c', w: 3.6, h: 2.35, y: -2.45, z: -0.7, cone: 0.85 },
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
        float face = pow(abs(dot(normalize(vNormal), normalize(uView))), 1.35);
        float smoke = 0.5
          + 0.32 * vnoise(vec2(t * 7.0 - uTime * 0.30, vUv.x * 3.0 + uSeed * 7.31))
          + 0.18 * vnoise(vec2(t * 17.0 - uTime * 0.55, vUv.x * 6.0 + uSeed * 3.7));
        vec3 col = mix(vec3(1.0), uColor, smoothstep(0.0, 0.26, t));
        gl_FragColor = vec4(col, axial * face * smoke * uAlpha * uOn);
      }`
    FAN.forEach((d, i) => {
      const target = new THREE.Vector3(WALL_X - 0.05, lampY + d.y, d.z)
      const dir = target.clone().sub(lens)
      const len = dir.length()
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uColor: { value: new THREE.Color(d.color) },
          uTime: { value: 0 },
          uSeed: { value: i + 1 },
          uAlpha: { value: 0.34 },
          uOn: { value: 0 },
          uView: { value: new THREE.Vector3(-0.886, 0.684, 1).normalize() },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      beamMats.push(mat)
      const g = new THREE.CylinderGeometry(d.cone, 0.09, len, 28, 24, true)
      const m = new THREE.Mesh(g, mat)
      m.position.copy(lens.clone().add(target).multiplyScalar(0.5))
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
      scene.add(m)
    })
  }
  // A quad that renders UNSHEARED: spanned by the two world directions that
  // project to exactly screen-horizontal and screen-vertical in this camera
  // (H picks up a -sin12° drop in y to cancel the travel axis's climb). An
  // x-y plane quad sheared visibly — the badge labels leaned.
  const SCREEN_H = new THREE.Vector3(1, -SX, 0)
  const SCREEN_V = new THREE.Vector3(0, 1, 0)
  function screenQuad(center: THREE.Vector3, w: number, h: number, mat: THREE.Material) {
    const g = new THREE.BufferGeometry()
    const pts = [
      center.clone().addScaledVector(SCREEN_H, -w / 2).addScaledVector(SCREEN_V, h / 2),
      center.clone().addScaledVector(SCREEN_H, w / 2).addScaledVector(SCREEN_V, h / 2),
      center.clone().addScaledVector(SCREEN_H, w / 2).addScaledVector(SCREEN_V, -h / 2),
      center.clone().addScaledVector(SCREEN_H, -w / 2).addScaledVector(SCREEN_V, -h / 2),
    ]
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((p) => [p.x, p.y, p.z]), 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2))
    g.setIndex([0, 2, 1, 0, 3, 2])
    const m = new THREE.Mesh(g, mat)
    scene.add(m)
    return m
  }

  // the projected frames on the wall: THE SAME IMAGE that stands in the gate
  // (shared renderer), tinted per channel, redrawn each time a new frame
  // arrives — the machine is visibly projecting the film, not just glowing
  const screenCtxs: { c: HTMLCanvasElement; x: CanvasRenderingContext2D; tex: THREE.CanvasTexture; d: (typeof FAN)[number] }[] = []
  const screenMats: THREE.MeshBasicMaterial[] = []
  function drawScreen(sc: (typeof screenCtxs)[number], id: number) {
    const { x, d, c } = sc
    const W2 = c.width
    const H2 = c.height
    x.clearRect(0, 0, W2, H2)
    // the throw's spill behind the artifact
    x.save()
    x.filter = 'blur(26px)'
    x.fillStyle = d.color
    x.globalAlpha = 0.32
    x.fillRect(W2 * 0.1, H2 * 0.12, W2 * 0.8, H2 * 0.76)
    x.restore()
    const mark = (mx: number, my: number) => {
      // small ident, top right, tasteful
      x.fillStyle = 'rgba(255,255,255,0.85)'
      if (d.icon === 'yt') {
        x.beginPath()
        x.roundRect(mx - 34, my - 12, 34, 24, 7)
        x.fill()
        x.fillStyle = 'rgba(30,10,10,0.9)'
        x.beginPath()
        x.moveTo(mx - 22, my - 6)
        x.lineTo(mx - 12, my)
        x.lineTo(mx - 22, my + 6)
        x.closePath()
        x.fill()
      } else if (d.icon === 'in') {
        x.font = 'bold 26px system-ui, sans-serif'
        x.textAlign = 'right'
        x.textBaseline = 'middle'
        x.fillText('in', mx, my)
        x.textAlign = 'left'
      } else {
        x.strokeStyle = 'rgba(255,255,255,0.85)'
        x.lineWidth = 3
        x.beginPath()
        x.arc(mx - 14, my + 4, 5, 0, Math.PI * 2)
        x.fill()
        for (const rr of [11, 18]) {
          x.beginPath()
          x.arc(mx - 14, my + 4, rr, -2.35, -0.8)
          x.stroke()
        }
      }
    }
    if (d.icon === 'yt') {
      x.save()
      x.translate(58, 44)
      x.globalCompositeOperation = 'screen'
      x.globalAlpha = 0.88
      x.drawImage(frameArt(id, true), 0, 0, 524, 246)
      x.restore()
      x.fillStyle = 'rgba(255,255,255,0.3)'
      x.fillRect(58, 306, 524, 6)
      x.fillStyle = 'rgba(255,255,255,0.9)'
      x.fillRect(58, 306, 336, 6)
      x.beginPath()
      x.arc(394, 309, 8, 0, Math.PI * 2)
      x.fill()
      mark(576, 66)
    } else if (d.icon === 'in') {
      // an actual phone outline, portrait clip inside, big captions
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
      const art = frameArt(id, false)
      x.drawImage(art, 82, 0, 76, 136, 38, 58, 264, 586)
      x.restore()
      // the big stacked captions a portrait clip wears
      x.fillStyle = 'rgba(255,255,255,0.96)'
      const cw1 = 190
      x.beginPath()
      x.roundRect((W2 - cw1) / 2, 470, cw1, 30, 7)
      x.fill()
      const cw2 = 132
      x.beginPath()
      x.roundRect((W2 - cw2) / 2, 512, cw2, 30, 7)
      x.fill()
      mark(292, 92)
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
      mark(592, 66)
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
    const smat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    screenMats.push(smat)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), smat)
    m.rotation.y = -Math.PI / 2
    m.position.set(WALL_X - 0.03, lampY + d.y, d.z)
    scene.add(m)
  })
  // the prism's hot origin: a soft radial core where the fan leaves the gate
  {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const x = c.getContext('2d')!
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64)
    gr.addColorStop(0, 'rgba(255,255,255,0.85)')
    gr.addColorStop(0.4, 'rgba(255,244,224,0.32)')
    gr.addColorStop(1, 'rgba(255,244,224,0)')
    x.fillStyle = gr
    x.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    screenQuad(new THREE.Vector3(11.02, lampY, 0), 1.15, 1.15, new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
  }

  // ---- the intake: a drop zone, and one opening drop -----------------------
  // (owner: the recurring folder was distracting. The acetate pool reads as
  // a FILE DROP ZONE — a breathing rim — and a single labeled file drops in
  // once, as the opening beat that boots the machine.)
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2a1512, emissive: 0xf28f84, emissiveIntensity: 0.7, roughness: 0.9 })
  {
    const rw = 0.06
    const x0 = BED.x0 + 0.62
    const x1 = BED.x1 - 0.62
    const z0 = -BED.z + 0.62
    const z1 = BED.z - 0.62
    box(x0, x1, BED.top - 0.005, BED.top + 0.02, z0, z0 + rw, rimMat)
    box(x0, x1, BED.top - 0.005, BED.top + 0.02, z1 - rw, z1, rimMat)
    box(x0, x0 + rw, BED.top - 0.005, BED.top + 0.02, z0, z1, rimMat)
    box(x1 - rw, x1, BED.top - 0.005, BED.top + 0.02, z0, z1, rimMat)
  }
  const bootFileMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c9, roughness: 0.85, transparent: true, opacity: 0, emissive: 0xff9d7a, emissiveIntensity: 0 })
  const bootFile = new THREE.Group()
  {
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 2.0), bootFileMat)
    card.castShadow = true
    bootFile.add(card)
    const lc = document.createElement('canvas')
    lc.width = 512
    lc.height = 600
    const lx = lc.getContext('2d')!
    // the Zoom call: two tiles, a REC light, the filename
    lx.fillStyle = 'rgba(16,16,20,0.92)'
    lx.beginPath()
    lx.roundRect(10, 10, 492, 580, 26)
    lx.fill()
    const tile = (tx: number, name: string) => {
      lx.fillStyle = '#26262e'
      lx.beginPath()
      lx.roundRect(tx, 120, 224, 260, 14)
      lx.fill()
      lx.fillStyle = '#4a4a55'
      lx.beginPath()
      lx.arc(tx + 112, 220, 46, 0, Math.PI * 2)
      lx.fill()
      lx.beginPath()
      lx.ellipse(tx + 112, 330, 84, 56, 0, Math.PI, 0, true)
      lx.fill()
      lx.fillStyle = 'rgba(250,247,240,0.85)'
      lx.font = '600 30px ui-monospace, monospace'
      lx.textAlign = 'center'
      lx.fillText(name, tx + 112, 416)
    }
    tile(26, 'MIKE')
    tile(262, 'JOHN')
    lx.fillStyle = '#ff4d4d'
    lx.beginPath()
    lx.arc(48, 62, 13, 0, Math.PI * 2)
    lx.fill()
    lx.fillStyle = 'rgba(250,247,240,0.9)'
    lx.font = '600 34px ui-monospace, monospace'
    lx.textAlign = 'left'
    lx.textBaseline = 'middle'
    lx.fillText('REC 58:14', 76, 62)
    lx.textAlign = 'center'
    lx.fillStyle = 'rgba(250,247,240,0.65)'
    lx.font = '500 30px ui-monospace, monospace'
    lx.fillText('ep01 — raw session', 256, 520)
    const ltex = new THREE.CanvasTexture(lc)
    ltex.colorSpace = THREE.SRGBColorSpace
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 1.7),
      new THREE.MeshBasicMaterial({ map: ltex, transparent: true }),
    )
    label.rotation.x = -Math.PI / 2
    label.rotation.z = 0.35
    label.position.set(0, 0.06, 0)
    bootFile.add(label)
  }
  bootFile.visible = false
  scene.add(bootFile)
  // THE SCAN PLANE: a dashed outline floating above the pool — the indexing
  // plane. The falling file shatters into a bitstream as it passes through.
  // raised to the same datum as the A-bars (owner): one horizontal line runs
  // through the girders' crossbars and the scan plane
  const PLANE_Y = lampY
  let planeMat: THREE.MeshBasicMaterial
  {
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
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(BED.x1 - BED.x0 - 1.1, BED.z * 2 - 1.1), planeMat)
    plane.rotation.x = -Math.PI / 2
    plane.position.set((BED.x0 + BED.x1) / 2, PLANE_Y, 0)
    scene.add(plane)
  }
  // the bitstream: the file's substance, raining into the acetate
  const BITS_N = 170
  const bitsPos = new Float32Array(BITS_N * 3)
  const bitsSeed: { x: number; z: number; delay: number; v: number }[] = []
  for (let k = 0; k < BITS_N; k++) {
    const hx = ((k * 137) % 100) / 100 - 0.5
    const hz = ((k * 71) % 100) / 100 - 0.5
    bitsSeed.push({ x: hx * 1.6, z: hz * 1.9, delay: ((k * 29) % 100) / 100 * 0.5, v: 2.6 + (((k * 53) % 100) / 100) * 2.2 })
    bitsPos[k * 3 + 1] = -999
  }
  const bitsGeo = new THREE.BufferGeometry()
  bitsGeo.setAttribute('position', new THREE.BufferAttribute(bitsPos, 3))
  const bitsMat = new THREE.PointsMaterial({ color: 0xffb4a0, size: 4.5, sizeAttenuation: false, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  const bits = new THREE.Points(bitsGeo, bitsMat)
  bits.frustumCulled = false
  scene.add(bits)

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
  const gateGlow = new THREE.PointLight(0xfff2dc, 19, 9)
  gateGlow.position.set(ROLL.x - 0.55, lampY, 0)
  gateGlow.castShadow = true
  gateGlow.shadow.mapSize.set(512, 512)
  gateGlow.shadow.bias = -0.004
  scene.add(gateGlow)
  // a small glint where the film arrives on the coil — the handoff reads
  const wheelKiss = new THREE.PointLight(0xa8b4d8, 72, 26)
  wheelKiss.position.set(reelX - 7, reelY + 2, 6)
  scene.add(wheelKiss)
  // THE ARCHIVE IS ALIVE: a warm ember inside the drum, between the flanges —
  // the wound memory glows out through the windows as they turn
  const archiveGlow = new THREE.PointLight(0xffd9a8, 13, 7.5)
  archiveGlow.position.set(reelX, reelY + 1.2, 0)
  scene.add(archiveGlow)
  const coilGlint = new THREE.PointLight(0xffe8cc, 3.2, 3.2)
  coilGlint.position.set(ROLL.x - 0.3, reelY - 0.4, 0)
  scene.add(coilGlint)
  // inside the head, so the housing, shaft and mast inner faces read as a
  // lamp room rather than a black pocket
  const headGlow = new THREE.PointLight(0xffe4c4, 15, 7)
  headGlow.position.set(8.35, lampY + 0.35, 0)
  scene.add(headGlow)
  const bedGlow = new THREE.PointLight(0xf28f84, 16, 6.2)
  bedGlow.position.set((BED.x0 + BED.x1) / 2, BED.top + 0.5, 0)
  scene.add(bedGlow)

  // ---- per-frame state ----------------------------------------------------
  let lastGateId = Number.NaN
  const flick = (x: number) => 0.55 + 0.45 * Math.abs(Math.sin(x * 43.7) * Math.sin(x * 17.3))
  function update(t: number) {
    const dist = transportDist(t)
    const off = dist % PITCH
    for (const m of beamMats) m.uniforms.uTime!.value = t

    // ACT 1 — the rite of indexing: the scan plane wakes; a file materializes
    // high in the clear lane, accelerates through the plane, and shatters
    // into a bitstream the acetate drinks. Abstract on purpose: the pool is
    // ALL of the work (framing, cutting, editing, music), not one tool.
    const bx = (BED.x0 + BED.x1) / 2
    let splash = 0
    {
      const y0 = BED.top + 9.6
      const tau = t - BOOT.drop
      const tPlane = Math.sqrt((y0 - PLANE_Y) / 4.6)
      // the plane: fades in, breathes, FLASHES at the crossing
      const wake = THREE.MathUtils.smoothstep(t, BOOT.plane, BOOT.plane + 0.6)
      const crossFlash = tau > tPlane ? Math.max(0, 1 - (tau - tPlane) / 0.45) : 0
      planeMat.opacity = wake * (0.34 + 0.1 * Math.sin(t * 1.9) + 0.66 * crossFlash)
      // the card: materialize, fall, vanish INTO the plane
      if (tau > 0 && tau < tPlane) {
        bootFile.visible = true
        bootFileMat.opacity = Math.min(1, tau / 0.35)
        bootFileMat.emissiveIntensity = tau > tPlane - 0.18 ? 2.2 : 0
        bootFile.position.set(bx - 0.1, y0 - 4.6 * tau * tau, 0.1)
        bootFile.rotation.z = 0.1 * Math.sin(tau * 2.1)
      } else {
        bootFile.visible = false
      }
      // the bitstream: born at the crossing, raining to the pool
      if (tau > tPlane && tau < tPlane + 1.6) {
        for (let k = 0; k < BITS_N; k++) {
          const sd = bitsSeed[k]!
          const bt = tau - tPlane - sd.delay
          const i3 = k * 3
          if (bt > 0) {
            const y = PLANE_Y - sd.v * bt - 2.3 * bt * bt
            if (y > BED.top - 0.05) {
              bitsPos[i3] = bx - 0.1 + sd.x
              bitsPos[i3 + 1] = y
              bitsPos[i3 + 2] = 0.1 + sd.z
            } else {
              bitsPos[i3 + 1] = -999
            }
          } else {
            bitsPos[i3 + 1] = -999
          }
        }
        bitsGeo.attributes.position!.needsUpdate = true
        bits.visible = true
      } else {
        bits.visible = false
      }
      // the pool absorbs: splash follows the bits' arrival
      if (tau > tPlane + 0.25) splash = Math.max(0, 1 - (tau - tPlane - 0.25) / 1.7)
    }
    // the pool breathes as a drop zone; absorption makes it flare
    const breathe = 0.2 + 0.07 * Math.sin(t * 1.4)
    const acid = Math.min(1, breathe + splash * 0.9)
    bedGlow.intensity = 2.5 + 12 * acid
    rimMat.emissiveIntensity = 0.45 + 1.15 * acid

    // ACT 2 — the line starts (transportDist handles the ramp); the wheel
    // turns with it, and the first ASSEMBLED footage fades in on the belt.
    reel.rotation.z = dist / coilR
    filmMatRef.opacity = THREE.MathUtils.smoothstep(t, BOOT.run - 0.35, BOOT.run + 0.9)
    drawFilm(dist)

    // ACT 3 — the projector strikes (a real lamp strike: flicker, then hold)
    {
      const ig = t < BOOT.proj ? 0 : Math.min(1, (t - BOOT.proj) / 0.6)
      const igf = ig >= 1 ? 1 : ig * flick(t)
      gateGlow.intensity = 19 * igf
      headGlow.intensity = 15 * igf
      if (lensDiscMat) lensDiscMat.emissiveIntensity = 3.2 * igf
      if (lensRingMat) lensRingMat.emissiveIntensity = 1.4 * igf
    }

    // ACT 4 — one, two, three: each beam and its screen ignite in turn
    for (let i = 0; i < 3; i++) {
      const t0 = BOOT.beam0 + i * BOOT.beamGap
      const on = t < t0 ? 0 : Math.min(1, (t - t0) / 0.45)
      const onf = on >= 1 ? 1 : on * flick(t + i * 3.1)
      beamMats[i]!.uniforms.uOn!.value = onf
      const sm = screenMats[i]
      if (sm) sm.opacity = onf
    }

    // the wall projects whatever stands in the gate
    {
      const occ = Math.floor((S_GATE - off) / PITCH)
      const id = stableId(occ, off, dist)
      if (id !== lastGateId) {
        lastGateId = id
        for (const sc of screenCtxs) drawScreen(sc, id)
      }
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
  const loop = (now: number) => {
    draw(now / 1000)
    raf = requestAnimationFrame(loop)
  }

  return {
    start() {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    still(t: number = STILL_T) {
      this.stop()
      layout()
      draw(t)
    },
    resize() {
      layout()
      if (!running) draw(STILL_T)
    },
    destroy() {
      this.stop()
      renderer.dispose()
    },
  }
}
