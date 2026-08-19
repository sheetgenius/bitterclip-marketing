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
 * This module is only ever loaded via dynamic import from a lab route —
 * three.js must never enter the homepage bundle.
 */
import * as THREE from 'three'

export interface Iso3Scene {
  start(): void
  stop(): void
  still(t?: number): void
  resize(): void
  destroy(): void
}

// ---- the world, in film-widths — same numbers as the 2D study ------------
const FILM_W = 2.05
const PITCH = 2.62
const TABLE = { x0: 0.4, x1: 9.85, top: 0, z: 2.05, deep: 1.05 }
const BED = { x0: -3.3, x1: 0.5, z: 2.05, top: 0.55 }
const ROLL = { x: 9.75, r: 0.5 }
const RISE = 9.4
const REEL = { r: 3.75, w: FILM_W }
const COIL_F = 0.58
const TURRET = { x: 4.1, z: 1.78, y: 1.15 }
const DEST = { x: 17.6, r: 1.5 }

const FILM_SPEED = 1.45
const beltY = 0.02
const gateY = beltY + ROLL.r + RISE
const coilR = REEL.r * COIL_F
const reelX = ROLL.x - coilR
const reelY = gateY
const lampY = beltY + ROLL.r + RISE * 0.47
const STILL_T = 1.35

const AX = (12 * Math.PI) / 180
const AZ = (30 * Math.PI) / 180
const CX = Math.cos(AX)
const SX = Math.sin(AX)
const CZ = Math.cos(AZ)
const SZ = Math.sin(AZ)

export function createIso3(canvas: HTMLCanvasElement): Iso3Scene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.Camera()

  // ---- fit + projection ---------------------------------------------------
  function layout() {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const W = Math.round(r.width)
    const H = Math.round(r.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(W, H, false)

    // the same probe/fit as the study, so both routes compose identically
    const px = (x: number, y: number, z: number): [number, number] => [
      x * CX + z * CZ,
      -x * SX + z * SZ - y,
    ]
    const probe: [number, number, number][] = [
      [BED.x0, BED.top + 4.6, 0], [BED.x0, -TABLE.deep, TABLE.z],
      [DEST.x + DEST.r, lampY + 3.0, 0], [DEST.x, lampY - 3.0, 0],
      [reelX + REEL.r, reelY + REEL.r, -REEL.w / 2], [reelX, TABLE.top, FILM_W / 2 + 0.52],
      [TABLE.x1, 0, -TABLE.z], [ROLL.x, beltY, TABLE.z],
    ]
    const pts = probe.map((p) => px(p[0], p[1], p[2]))
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const S = Math.min((W * 0.72) / (Math.max(...xs) - Math.min(...xs)), (H * 0.86) / (Math.max(...ys) - Math.min(...ys)))
    const ox = W * 0.6 - ((Math.min(...xs) + Math.max(...xs)) / 2) * S
    const oy = H * 0.52 - ((Math.min(...ys) + Math.max(...ys)) / 2) * S

    // depth axis: the study's view direction, normalized
    const v = new THREE.Vector3(0.886, -0.684, -1).normalize()
    const corners: [number, number, number][] = [
      [BED.x0 - 2, -3, -4], [DEST.x + 3, gateY + REEL.r + 3, 4],
      [BED.x0 - 2, gateY + REEL.r + 3, 4], [DEST.x + 3, -3, -4],
    ]
    const ds = corners.map((c) => v.x * c[0] + v.y * c[1] + v.z * c[2])
    const dMin = Math.min(...ds) - 2
    const dMax = Math.max(...ds) + 2
    const k = 2 / (dMax - dMin)

    // ndcX = (2S·CX/W)x + (2S·CZ/W)z + (2ox/W − 1)
    // ndcY = (2S·SX/H)x + (2S/H)y − (2S·SZ/H)z + (1 − 2oy/H)   (flip to y-up)
    camera.projectionMatrix.set(
      (2 * S * CX) / W, 0, (2 * S * CZ) / W, (2 * ox) / W - 1,
      (2 * S * SX) / H, (2 * S) / H, (-2 * S * SZ) / H, 1 - (2 * oy) / H,
      v.x * k, v.y * k, v.z * k, -dMin * k - 1,
      0, 0, 0, 1,
    )
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }

  // ---- palette (from the study) ------------------------------------------
  const M = {
    deck: new THREE.MeshStandardMaterial({ color: 0x2e2e36, roughness: 0.85, flatShading: true }),
    bed: new THREE.MeshStandardMaterial({ color: 0x35353e, roughness: 0.85, flatShading: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0x3a3a45, roughness: 0.6, metalness: 0.35, flatShading: true }),
    flange: new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.55, metalness: 0.4, flatShading: true }),
    coil: new THREE.MeshStandardMaterial({ color: 0x4a4437, roughness: 0.9 }),
    lap: new THREE.MeshStandardMaterial({ color: 0x6b6558, roughness: 0.9 }),
    stock: new THREE.MeshStandardMaterial({ color: 0x77715f, roughness: 0.95 }),
  }

  // box helper mirroring the study's API: extents, not center+size
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material) => {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0))
    const m = new THREE.Mesh(g, mat)
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    scene.add(m)
    return m
  }

  // ---- parity primitives (camera proof stage) ----------------------------
  box(TABLE.x0, TABLE.x1, -TABLE.deep, TABLE.top, -TABLE.z, TABLE.z, M.deck)
  box(BED.x0, BED.x1, -TABLE.deep, BED.top, -BED.z, BED.z, M.bed)
  // the climb, as a placeholder plane
  box(ROLL.x - 0.02, ROLL.x + 0.02, beltY + ROLL.r, gateY, -FILM_W / 2, FILM_W / 2, M.stock)
  // roller
  {
    const g = new THREE.CylinderGeometry(ROLL.r * 1.03, ROLL.r * 1.03, FILM_W + 0.52, 40)
    const m = new THREE.Mesh(g, M.steel)
    m.rotation.x = Math.PI / 2
    m.position.set(ROLL.x - ROLL.r, beltY + ROLL.r, 0)
    scene.add(m)
  }
  // reel: two flange discs + coil + fresh lap (parity placeholder, no windows yet)
  const reel = new THREE.Group()
  for (const zc of [-REEL.w / 2, REEL.w / 2]) {
    const g = new THREE.CylinderGeometry(REEL.r, REEL.r, 0.1, 64)
    const m = new THREE.Mesh(g, M.flange)
    m.rotation.x = Math.PI / 2
    m.position.z = zc
    reel.add(m)
  }
  {
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(coilR * 0.86, coilR * 0.86, REEL.w - 0.12, 48), M.coil)
    coil.rotation.x = Math.PI / 2
    reel.add(coil)
    const lap = new THREE.Mesh(new THREE.CylinderGeometry(coilR, coilR, REEL.w - 0.16, 48), M.lap)
    lap.rotation.x = Math.PI / 2
    reel.add(lap)
  }
  reel.position.set(reelX, reelY, 0)
  scene.add(reel)

  // ---- light rig (first pass) --------------------------------------------
  scene.add(new THREE.AmbientLight(0x8890a8, 0.32))
  const key = new THREE.DirectionalLight(0xbfc4d8, 0.55)
  key.position.set(-4, 12, 6)
  scene.add(key)
  const gateGlow = new THREE.PointLight(0xfff4e0, 26, 9)
  gateGlow.position.set(ROLL.x - 0.6, lampY, 0)
  scene.add(gateGlow)
  const bedGlow = new THREE.PointLight(0xf28f84, 14, 7)
  bedGlow.position.set((BED.x0 + BED.x1) / 2, BED.top + 0.4, 0)
  scene.add(bedGlow)
  const hitGlow = new THREE.PointLight(0xffb4a0, 8, 5)
  hitGlow.position.set(TURRET.x, beltY + 0.4, 0)
  scene.add(hitGlow)

  // ---- loop ---------------------------------------------------------------
  function draw(t: number) {
    const dist = t * FILM_SPEED
    reel.rotation.z = -dist / coilR
    renderer.render(scene, camera)
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
