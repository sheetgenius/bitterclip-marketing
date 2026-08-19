<script setup lang="ts">
/**
 * The hero as one composed still: a folder of session files enters from the
 * left, lands on a drop zone, springs into a finished film strip with the
 * opener, speaker titles and music attached to it, and leaves through a
 * dispatch that sends it to the connected platforms.
 *
 * STATIC BY DECISION. There is no animation loop, no requestAnimationFrame, no
 * IntersectionObserver and no reduced-motion branch, because nothing moves. The
 * composition has to earn its place as a still, which is a higher bar than
 * motion papering over a weak arrangement.
 *
 * Technique: every element is a plane carrying its own 2D canvas texture. All
 * the content — filenames, captions, lower thirds, labels — is drawn in 2D,
 * which keeps type crisp and legible; three only places, bends and lights those
 * planes. Depth comes from shading and neutral shadow, never coloured bloom.
 *
 * ACCURACY: destinations are YouTube, X and LinkedIn only — the three connectors
 * that actually auto-publish after approval. Instagram is capped to manual
 * handoff and must not appear here. See content/_data/connectors.yml.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const host = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
let cleanup: (() => void) | null = null

const ACCENT = '#f28f84'
const INK = '#f4f4f5'
const MUTED = 'rgba(244,244,245,0.55)'

onMounted(async () => {
  let THREE: typeof import('three')
  try {
    THREE = await import('three')
  } catch {
    return
  }
  const el = host.value
  if (!el) return

  // ---------- 2D helpers -----------------------------------------------------
  const surface = (w: number, h: number) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return { c, x: c.getContext('2d')! }
  }

  const round = (x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) => {
    x.beginPath()
    x.moveTo(a + r, b)
    x.arcTo(a + w, b, a + w, b + h, r)
    x.arcTo(a + w, b + h, a, b + h, r)
    x.arcTo(a, b + h, a, b, r)
    x.arcTo(a, b, a + w, b, r)
    x.closePath()
  }

  const loadImage = (src: string) => new Promise<HTMLImageElement | undefined>((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = () => res(undefined)
    img.src = src
  })

  const frames = await Promise.all([
    loadImage('/images/ribbon/f0_andrew.jpg'),
    loadImage('/images/ribbon/f1_mike.jpg'),
    loadImage('/images/ribbon/f2_andrew.jpg'),
    loadImage('/images/ribbon/f3_mike.jpg'),
    loadImage('/images/ribbon/f4_andrew.jpg'),
    loadImage('/images/ribbon/f5_mike.jpg'),
  ])

  // ---------- scene ----------------------------------------------------------
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1.7, 0.1, 200)
  camera.position.set(0, 0.4, 22)
  camera.lookAt(0, 0.15, 0)

  const gl = new THREE.WebGLRenderer({ canvas: canvasEl.value!, antialias: true, alpha: true })
  gl.setClearColor(0x000000, 0)
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(-5, 7, 9)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffd9d2, 0.45)
  fill.position.set(7, -3, 6)
  scene.add(fill)

  const made: { geo: any; mat: any; tex: any }[] = []

  /** A flat textured panel placed in world space. */
  function panel(c: HTMLCanvasElement, w: number, h: number) {
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const geo = new THREE.PlaneGeometry(w, h)
    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, metalness: 0.04 })
    made.push({ geo, mat, tex })
    return new THREE.Mesh(geo, mat)
  }

  // ---------- ① the folder of session files, entering from the left ----------
  // 24 files, three devices. The pile is deliberately UNEVEN — two heavy anchor
  // angles among a scatter of short POV clips — because that is what a real
  // multi-device shoot actually looks like.
  const FILES = [
    { name: 'IMG_4021.MOV', dev: 'iPhone 14 Pro', size: '945 MB' },
    { name: 'IMG_4022.MOV', dev: 'iPad mini', size: '712 MB' },
    { name: 'VID_0097.MOV', dev: 'Ray-Ban Meta', size: '42 MB' },
    { name: 'VID_0098.MOV', dev: 'Ray-Ban Meta', size: '13 MB' },
  ]

  function fileCard(f: { name: string; dev: string; size: string }) {
    const { c, x } = surface(420, 300)
    x.fillStyle = '#1c1c21'
    round(x, 6, 6, 408, 288, 18)
    x.fill()
    x.strokeStyle = 'rgba(255,255,255,0.12)'
    x.lineWidth = 2
    x.stroke()
    // a sliver of the frame, so a file reads as footage not an icon
    x.fillStyle = '#26262c'
    round(x, 22, 22, 376, 150, 10)
    x.fill()
    x.fillStyle = MUTED
    x.font = '600 26px "IBM Plex Mono", monospace'
    x.fillText(f.name, 26, 216)
    x.fillStyle = 'rgba(244,244,245,0.38)'
    x.font = '500 22px "IBM Plex Mono", monospace'
    x.fillText(`${f.dev}  ·  ${f.size}`, 26, 254)
    return c
  }

  FILES.forEach((f, i) => {
    const m = panel(fileCard(f), 2.3, 1.64)
    // Tumbling in: the first is mostly off-frame at the left edge.
    m.position.set(-9.5 + i * 1.18, 2.45 - i * 0.26, i * 0.32)
    m.rotation.set(0.12, 0.52 - i * 0.06, 0.16 - i * 0.05)
    scene.add(m)
  })

  // A folder lip behind them, bleeding off the left edge.
  {
    const { c, x } = surface(560, 360)
    x.fillStyle = 'rgba(255,255,255,0.05)'
    round(x, 8, 60, 544, 292, 22)
    x.fill()
    x.strokeStyle = 'rgba(255,255,255,0.13)'
    x.lineWidth = 3
    x.stroke()
    x.fillStyle = 'rgba(255,255,255,0.05)'
    round(x, 8, 20, 240, 70, 14)
    x.fill()
    x.fillStyle = ACCENT
    x.font = '600 28px "IBM Plex Mono", monospace'
    x.fillText('24 FILES', 34, 132)
    x.fillStyle = 'rgba(244,244,245,0.42)'
    x.font = '500 24px "IBM Plex Mono", monospace'
    x.fillText('iPhone ×15', 34, 176)
    x.fillText('Meta ×8', 34, 212)
    x.fillText('iPad ×1', 34, 248)
    const m = panel(c, 3.4, 2.2)
    m.position.set(-10.5, 1.85, -0.9)
    m.rotation.set(0.1, 0.46, 0.06)
    scene.add(m)
  }

  // ---------- ② the drop zone ------------------------------------------------
  {
    const { c, x } = surface(560, 190)
    x.setLineDash([14, 12])
    x.strokeStyle = 'rgba(242,143,132,0.55)'
    x.lineWidth = 3
    round(x, 8, 8, 544, 174, 20)
    x.stroke()
    x.setLineDash([])
    x.fillStyle = 'rgba(242,143,132,0.05)'
    x.fill()
    x.fillStyle = INK
    x.font = '700 34px Manrope, sans-serif'
    x.fillText('Drop the session', 40, 84)
    x.fillStyle = MUTED
    x.font = '500 24px "IBM Plex Mono", monospace'
    x.fillText('any device, any angle', 40, 130)
    const m = panel(c, 3.5, 1.19)
    m.position.set(-6.1, -0.35, 0.4)
    m.rotation.set(0.05, 0.24, 0.02)
    scene.add(m)
  }

  // ---------- ③ the finished strip -------------------------------------------
  // One long canvas bent into a gentle wave. The cut has already resolved: the
  // rambling run is gone and the strip has closed over it.
  const STRIP_W = 4096
  const STRIP_H = 470
  const { c: strip, x: sx } = surface(STRIP_W, STRIP_H)

  const CELL = 300
  const GAP = 9
  type Cell = { img?: HTMLImageElement; cap?: string; who?: string; opener?: boolean }
  // NOTE: the only attributed line is Andrew's already-published, signed-off
  // testimonial. Replace with real transcript lines before this ships.
  const cells: Cell[] = [
    { opener: true },
    { img: frames[0], cap: 'the worst three hours', who: 'Andrew Williams · Head Coach' },
    { img: frames[2], cap: 'of my week —' },
    { img: frames[4], cap: 'and the most important.' },
    { img: frames[1], who: 'Michael Ruescher · Founder' },
    { img: frames[3], cap: '' },
    { img: frames[5], cap: '' },
  ]

  sx.fillStyle = '#0d0d0d'
  sx.fillRect(0, 0, STRIP_W, STRIP_H)
  // sprocket margins
  sx.fillStyle = '#0a0a0b'
  sx.fillRect(0, 0, STRIP_W, 40)
  sx.fillRect(0, STRIP_H - 40, STRIP_W, 40)
  sx.fillStyle = 'rgba(255,255,255,0.10)'
  for (let px = 0; px < STRIP_W; px += 50) {
    round(sx, px + 14, 11, 22, 18, 5); sx.fill()
    round(sx, px + 14, STRIP_H - 29, 22, 18, 5); sx.fill()
  }

  const top = 52
  const ch = STRIP_H - 104
  cells.forEach((cell, i) => {
    const x0 = 40 + i * CELL
    sx.save()
    sx.beginPath()
    sx.rect(x0, top, CELL - GAP, ch)
    sx.clip()
    if (cell.opener) {
      sx.fillStyle = '#111113'
      sx.fillRect(x0, top, CELL, ch)
      sx.fillStyle = ACCENT
      sx.font = '600 21px "IBM Plex Mono", monospace'
      sx.fillText('SESSION 04', x0 + 22, top + 76)
      sx.fillStyle = INK
      sx.font = '700 25px Manrope, sans-serif'
      sx.fillText('Strength &', x0 + 22, top + 118)
      sx.fillText('Positions', x0 + 22, top + 150)
      sx.strokeStyle = 'rgba(242,143,132,0.55)'
      sx.lineWidth = 3
      sx.beginPath(); sx.moveTo(x0 + 22, top + 176); sx.lineTo(x0 + 106, top + 176); sx.stroke()
    } else {
      sx.fillStyle = '#141416'
      sx.fillRect(x0, top, CELL, ch)
      if (cell.img) {
        const s = Math.max(CELL / cell.img.width, ch / cell.img.height)
        sx.drawImage(cell.img, x0 + (CELL - cell.img.width * s) / 2, top + (ch - cell.img.height * s) / 2,
          cell.img.width * s, cell.img.height * s)
      }
      if (cell.cap) {
        sx.fillStyle = 'rgba(0,0,0,0.62)'
        sx.fillRect(x0, top + ch - 56, CELL - GAP, 56)
        sx.fillStyle = '#fff'
        sx.font = '600 20px Manrope, sans-serif'
        sx.fillText(cell.cap, x0 + 16, top + ch - 21)
      }
      if (cell.who) {
        const [nm, role] = cell.who.split(' · ')
        sx.fillStyle = 'rgba(10,10,12,0.9)'
        round(sx, x0 + 16, top + 26, CELL - GAP - 32, 58, 8); sx.fill()
        sx.strokeStyle = ACCENT; sx.lineWidth = 3
        sx.beginPath(); sx.moveTo(x0 + 17.5, top + 34); sx.lineTo(x0 + 17.5, top + 76); sx.stroke()
        sx.fillStyle = INK; sx.font = '700 20px Manrope, sans-serif'
        sx.fillText(nm, x0 + 31, top + 52)
        sx.fillStyle = MUTED; sx.font = '500 15px "IBM Plex Mono", monospace'
        sx.fillText(role.toUpperCase(), x0 + 31, top + 72)
      }
    }
    sx.restore()
  })

  const SEG = 220
  const stripGeo = new THREE.PlaneGeometry(8.8, 2.15, SEG, 2)
  const stripTex = new THREE.CanvasTexture(strip)
  stripTex.colorSpace = THREE.SRGBColorSpace
  stripTex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
  const stripMat = new THREE.MeshStandardMaterial({ map: stripTex, roughness: 0.72, metalness: 0.05, side: THREE.DoubleSide })
  made.push({ geo: stripGeo, mat: stripMat, tex: stripTex })
  {
    const pos = stripGeo.attributes.position as any
    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      const x0 = arr[i]
      arr[i + 2] = Math.sin(x0 * 0.46 + 0.6) * 0.42 + Math.sin(x0 * 0.21 - 0.3) * 0.3
      arr[i + 1] += Math.cos(x0 * 0.46 + 0.6) * arr[i + 1] * 0.24
    }
    pos.needsUpdate = true
    stripGeo.computeVertexNormals()
  }
  const stripMesh = new THREE.Mesh(stripGeo, stripMat)
  stripMesh.position.set(0.35, -0.95, 0.2)
  stripMesh.rotation.set(-0.1, 0.0, -0.03)
  scene.add(stripMesh)

  // ---------- overlays attaching to the strip --------------------------------
  const OVERLAYS = [
    { label: 'OPENER', x: -2.6 },
    { label: 'SPEAKER TITLES', x: 0.4 },
    { label: 'MUSIC', x: 3.2 },
  ]
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf28f84, transparent: true, opacity: 0.4 })
  OVERLAYS.forEach((o) => {
    const { c, x } = surface(360, 92)
    x.fillStyle = 'rgba(255,255,255,0.055)'
    round(x, 4, 4, 352, 84, 14); x.fill()
    x.strokeStyle = 'rgba(242,143,132,0.35)'; x.lineWidth = 2; x.stroke()
    x.fillStyle = ACCENT
    x.font = '600 26px "IBM Plex Mono", monospace'
    x.fillText(o.label, 26, 58)
    const m = panel(c, 2.05, 0.52)
    m.position.set(o.x, 1.05, 0.9)
    m.rotation.set(0.02, 0.1, 0)
    scene.add(m)
    // a thin tether down to the strip: the overlay attaches, it does not float
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(o.x, 0.79, 0.9),
      new THREE.Vector3(o.x + 0.08, -0.35, 0.5),
    ])
    scene.add(new THREE.Line(g, lineMat))
  })

  // ---------- ④ dispatch, and ⑤ the platforms --------------------------------
  {
    const { c, x } = surface(300, 300)
    x.fillStyle = 'rgba(255,255,255,0.06)'
    round(x, 8, 8, 284, 284, 26); x.fill()
    x.strokeStyle = 'rgba(242,143,132,0.4)'; x.lineWidth = 3; x.stroke()
    x.strokeStyle = ACCENT; x.lineWidth = 5; x.lineCap = 'round'
    x.beginPath(); x.moveTo(96, 152); x.lineTo(140, 194); x.lineTo(206, 112); x.stroke()
    x.fillStyle = MUTED
    x.font = '600 22px "IBM Plex Mono", monospace'
    x.fillText('YOU CONFIRM', 62, 244)
    const m = panel(c, 1.62, 1.62)
    m.position.set(5.85, -0.7, 0.5)
    m.rotation.set(0.03, -0.22, 0)
    scene.add(m)
  }

  const PLATFORMS = ['YouTube', 'X', 'LinkedIn']
  PLATFORMS.forEach((name, i) => {
    const { c, x } = surface(330, 96)
    x.fillStyle = 'rgba(255,255,255,0.05)'
    round(x, 4, 4, 322, 88, 16); x.fill()
    x.strokeStyle = 'rgba(255,255,255,0.14)'; x.lineWidth = 2; x.stroke()
    x.fillStyle = INK
    x.font = '600 30px Manrope, sans-serif'
    x.fillText(name, 30, 60)
    const m = panel(c, 1.85, 0.54)
    m.position.set(7.75, 0.65 - i * 1.15, 0.7)
    m.rotation.set(0.02, -0.34, 0)
    scene.add(m)
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(6.6, -0.7, 0.5),
      new THREE.Vector3(6.95, 0.65 - i * 1.15, 0.65),
    ])
    scene.add(new THREE.Line(g, lineMat))
  })

  // ---------- render once ----------------------------------------------------
  function draw() {
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    gl.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    gl.render(scene, camera)
  }

  draw()
  window.addEventListener('resize', draw)

  cleanup = () => {
    window.removeEventListener('resize', draw)
    made.forEach((m) => { m.geo.dispose(); m.mat.dispose(); m.tex.dispose() })
    lineMat.dispose()
    gl.dispose()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="host" class="hero-pipeline" aria-hidden="true">
    <canvas ref="canvasEl" class="hero-pipeline__canvas" />
  </div>
</template>

<style scoped>
.hero-pipeline,
.hero-pipeline__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
