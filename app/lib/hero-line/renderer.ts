/**
 * The hero as an assembly line, drawn on a 2D canvas.
 *
 * Files fly in and pass through an angled portal; the finished film strip comes
 * out of the portal's back and runs in a two-hump wave; speaker titles and show
 * openers drop onto it as it travels; a condemned run carries the conventional
 * cut hatching and a scissors mark; the strip reaches an energy node and streams
 * out — the full episode to YouTube, short clips to LinkedIn.
 *
 * WHY 2D CANVAS AND NOT WEBGL. The one thing DOM cannot do is bend a textured
 * surface, which is what argued for three.js. But a canvas can: the strip is
 * drawn as a few hundred narrow vertical columns, each a 1px-wide slice of the
 * source frame scaled to the strip's local height. That is how software texture
 * mappers worked before GPUs, and it costs no dependency. The sibling repo
 * (bitter-marketing app/lib/field-ring) already builds its particle torus this
 * way, so this matches the house pattern — including the factory shape and the
 * deterministic `renderAt(timeMs)` used for screenshots and reduced motion.
 *
 * ACCURACY: destinations are YouTube and LinkedIn — both publish after your
 * approval. Instagram is capped to manual handoff and is deliberately absent.
 */

export interface HeroLineOptions {
  reducedMotion?: boolean
  /** Freeze at a specific time for deterministic frames. */
  fixedTimeMs?: number | null
  /** Flow direction. The concept has been described both ways; flip and look. */
  direction?: 'ltr' | 'rtl'
  /** Sessions cycled through the line. Volume and diversity are the point:
   *  watch it a while and different shows, people and angles come through. */
  sessions?: Session[]
}

export interface Session {
  dir: string
  frames: number
  show: string
  session: string
  speaker: string
  role: string
  /** Filename stem of the camera this session came off. Different sessions come
   *  off different devices, and the intake says so. */
  file: string
}

/** Placeholder labels over real footage — swap for the real inventory. */
export const DEFAULT_SESSIONS: Session[] = [
  { dir: 's1', frames: 8, show: 'Strength & Positions', session: 'SESSION 04', speaker: 'Andrew Williams', role: 'HEAD COACH', file: 'IMG_40' },
  { dir: 's2', frames: 8, show: 'The Mike & Andrew Show', session: 'EPISODE 12', speaker: 'Michael Ruescher', role: 'FOUNDER', file: 'IMG_41' },
  { dir: 's3', frames: 8, show: 'Field Notes', session: 'CLIP 03', speaker: '', role: 'POV ANGLE', file: 'VID_00' },
]

export interface HeroLineRenderer {
  start(): void
  stop(): void
  resize(): void
  renderAt(timeMs: number): void
  destroy(): void
}

/** Build stamp for Act II. Bumped every round so a screenshot can be proved
 *  to come from the code that was just edited rather than a cached bundle. */
const ACT_II_BUILD = 'r23'

const TAU = Math.PI * 2
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const INK = '#f4f4f5'
const ACCENT = '#f28f84'
const MUTED = 'rgba(244,244,245,0.55)'

/** Where things sit along the line, in normalised units of the strip run. */
const PORTAL_U = 0.0
const NODE_U = 1.0

export function createHeroLineRenderer(
  canvas: HTMLCanvasElement,
  options: HeroLineOptions = {},
): HeroLineRenderer {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) throw new Error('hero line needs a 2D context')

  /**
   * Layer switches for isolating a visual defect, and for profiling.
   *
   * `?off=pic,rails,perf,rule,strip` were already here and they are the reason
   * the previous performance pass could name its costs instead of guessing at
   * them. Act II adds `table`, `offcut`, `press` and `shoe` for the same
   * reason: a cost you cannot switch off is a cost you will attribute wrongly,
   * and this act guessed wrong once already.
   */
  const OFF: Record<string, boolean> = {}
  if (typeof window !== 'undefined') {
    for (const k of (new URLSearchParams(window.location.search).get('off') || '').split(','))
      if (k) OFF[k] = true
  }

  const prefersReduced =
    options.reducedMotion ??
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const fixedTimeMs = options.fixedTimeMs ?? null
  const dir = options.direction === 'rtl' ? -1 : 1

  const sessions = options.sessions ?? DEFAULT_SESSIONS
  // Flat cell list: every cell knows which session it belongs to, so the strip
  // carries one show, then the next, and the cards follow whatever is passing.
  type Cell = {
    img: (HTMLImageElement | HTMLCanvasElement) | null
    s: number
    /** Halved copies of `img`, largest first. See `grade` and `mipFor`. */
    mips?: HTMLCanvasElement[]
  }
  const cells: Cell[] = []
  let framesReady = false

  Promise.all(
    sessions.flatMap((sess, si) =>
      Array.from({ length: sess.frames }, (_, i) => {
        const url = `/images/hero/${sess.dir}/f${String(i).padStart(2, '0')}.jpg`
        return new Promise<Cell>((res) => {
          const img = new Image()
          img.onload = () => res({ img, s: si })
          img.onerror = () => res({ img: null, s: si })
          img.src = url
        })
      }),
    ),
  ).then((loaded) => {
    // Reversed on purpose. The strip is extruded left to right, so the frame at
    // a fixed point on screen has a DECREASING index over time; stored forwards,
    // that plays the session backwards. Stored backwards, it plays forwards.
    cells.push(...loaded.filter((c) => c.img).map(grade).reverse())
    framesReady = cells.length > 0
  })

  /**
   * Grade each frame once, at load, into an offscreen canvas.
   *
   * The emulsion is the product, so it has to be the best-read thing on the
   * canvas — and raw phone footage on a near-black page reads muddy. A canvas
   * `filter` per sliver would cost hundreds of filtered draws a frame; doing it
   * once per source frame costs nothing and every sliver samples the graded
   * copy. It is also true to what the product does: the footage that comes out
   * of BitterClip has been through a grade.
   */
  function grade(c: Cell): Cell {
    const img = c.img
    if (!img || typeof document === 'undefined') return c
    const off = document.createElement('canvas')
    off.width = img.width
    off.height = img.height
    const g = off.getContext('2d')
    if (!g) return c
    g.filter = 'saturate(0.94) contrast(1.11) brightness(1.08)'
    g.drawImage(img, 0, 0)

    // MINIFICATION. The source frames are 640x480 and a frame of film is only
    // ever about a hundred and thirty pixels wide on screen. Canvas 2D has no
    // mip chain: every sliver resamples the full-size bitmap directly, and
    // because the affine transform shifts a fraction of a texel between one
    // animation frame and the next, it picks up a different set of source
    // pixels each time. That is the speckle that reads as the picture boiling.
    //
    // Halving repeatedly with the browser's own high-quality downscale gives us
    // the chain it does not keep, and `mipFor` picks the level that matches how
    // big the film actually is on screen.
    // Root-2 steps rather than halving. The level is chosen per sliver from the
    // local scale, so the strip does cross levels along its length; at 2x
    // apart that crossing is a visible step in sharpness, at 1.41x it is not.
    const mips: HTMLCanvasElement[] = [off]
    let cur: HTMLCanvasElement = off
    while (cur.width > 44 && mips.length < 10) {
      const next = document.createElement('canvas')
      next.width = Math.max(1, Math.round(cur.width / Math.SQRT2))
      next.height = Math.max(1, Math.round(cur.height / Math.SQRT2))
      const g2 = next.getContext('2d')
      if (!g2) break
      g2.imageSmoothingEnabled = true
      g2.imageSmoothingQuality = 'high'
      g2.drawImage(cur, 0, 0, next.width, next.height)
      mips.push(next)
      cur = next
    }
    return { img: off as unknown as HTMLImageElement, s: c.s, mips }
  }

  /**
   * The largest prepared level that is not being MINIFIED — that is, whose
   * texels are no denser than the pixels it is about to cover.
   *
   * Chosen per sliver from the LOCAL size, which is the whole point: where the
   * film bends it is foreshortened hard along its length, so a frame that is a
   * hundred and thirty pixels wide on the flat may be thirty in the bend. A
   * level picked from the nominal width is then sampling four texels per pixel
   * there, and canvas has no filter to average them — it just takes whichever
   * one it lands on, and lands on a different one each animation frame. That is
   * the shimmer in the bends.
   *
   * Erring to the smaller level trades a little softness for no aliasing, which
   * is the right way round: blur sits still, aliasing crawls.
   */
  function mipFor(c: Cell | undefined, maxWidthDevicePx: number) {
    const m = c?.mips
    if (!m || !m.length) return c?.img ?? null
    for (const lv of m) if (lv.width <= maxWidthDevicePx) return lv
    return m[m.length - 1]
  }

  // ---- layout, recomputed on resize ----------------------------------------
  let W = 0
  let H = 0
  let dpr = 1
  const L = {
    portalX: 0,
    portalY: 0,
    portalW: 0,
    portalH: 0,
    runStart: 0,
    runEnd: 0,
    baseY: 0,
    amp: 0,
    halfH: 0,
    /** Scene scale for the MACHINE. The film's width is not a unit of
     *  measurement for the equipment that handles it. */
    unit: 0,
    nodeX: 0,
    mouthU: 0,
    waves: 2,
    zAmp: 0,
    zAmpWanted: 0,
    ampWanted: 0,
    headingZ: 0,
    feedRise: 0,
    takeRise: 0,
    rollFeed: 0,
    rollTake: 0,
    zMargin: 0,
    rollAmp: 0,
    rollWanted: 0,
    focal: 0,
    vpX: 0,
    /**
     * THE ACT BOUNDARIES, DERIVED FROM THE THIRDS.
     *
     * The owner asked for even thirds — hopper, table, reel — and the two
     * numbers that decide where the film stops descending and starts climbing
     * were hand-tuned constants that happened to put the table at x 0.355W to
     * 0.515W: a sixth of the width, left of centre. Measuring it was the whole
     * argument. A constant that has to agree with a composition rule is a
     * constant that will drift away from it, so the boundaries are now SOLVED
     * from the rule instead of tuned toward it.
     *
     * Across the table z is zero, so the projection is the identity there and
     * screen x is world x — which is what makes this inversion exact rather
     * than approximate.
     */
    feedEndU: 0.42,
    tableEndU: 0.72,
  }

  function resize() {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    W = Math.round(r.width)
    H = Math.round(r.height)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Aspect-aware. On a narrow stage the intake needs more runway before the
    // ring or the cards crowd the edge, and a thinner ribbon can be bent around
    // a tighter radius — which is what lets the fold guard keep some wave
    // instead of flattening the line to save it.
    const wide = clamp01((W / H - 1.1) / 1.2)
    L.portalW = W * 0.105
    L.portalH = H * 0.34
    const inX = 0.195 - 0.05 * wide
    L.portalX = dir > 0 ? W * inX : W * (1 - inX)
    // THE THIRDS ARE THE LAYOUT.
    //
    // The run's two ends are placed first, then the act boundaries are solved
    // from the thirds rather than guessed at. `runStart` sits behind the
    // hopper's throat so the body occludes the film's birth; `runEnd` is the
    // reel hub. Everything between is parameterised by u, and because z is
    // zero across the table the mapping from u to screen x is affine there —
    // so W/3 and 2W/3 invert exactly.
    // Behind the mouth: the body occludes this end, so the film reads as being
    // extruded through the slot rather than starting in mid-air. Act I owns it.
    L.runStart = L.portalX - dir * L.portalW * (GATE_TX + 0.3)
    L.nodeX = dir > 0 ? W * 0.735 : W * 0.265
    L.runEnd = L.nodeX
    const uAtX = (x: number) => (x - L.runStart) / (L.runEnd - L.runStart)
    L.feedEndU = uAtX(dir > 0 ? W / 3 : (2 * W) / 3)
    L.tableEndU = uAtX(dir > 0 ? (2 * W) / 3 : W / 3)
    L.baseY = H * 0.575
    L.ampWanted = H * 0.165
    // Height and twist are free of the elasticity constraint, so this is where
    // the dimensionality goes.
    L.feedRise = H * 0.21
    // The owner's redesign: the film runs dead level into the reel. No rise,
    // and no depth either — the take-up spends twist and nothing else.
    L.takeRise = 0
    L.takeZ = 0
    // THE REEL IS THE TERMINUS, SO IT IS ALLOWED TO BE BIG.
    //
    // This was min(H*0.105, W*0.043) — about 0.041W — because I had told this
    // act to yield after measuring it as the heaviest third. That instruction
    // confused MASS with EMPHASIS. A large dark circle is quiet; a small bright
    // event is loud. The reel can be the biggest object on the canvas without
    // ever competing with the cut, because the cut is where something happens.
    // Held small, the line simply tapered out at the right-hand end instead of
    // arriving anywhere. Clamped on min(W, H) rather than W alone, or a short
    // viewport gets a wheel taller than the stage.
    L.reelR = Math.min(W * 0.115, H * 0.275)
    L.rollFeed = -0.62
    L.rollTake = 1.45
    // A FLOOR ON THE FILM'S WIDTH. Height-derived with nothing under it, a short
    // stage shrank the stock until the frames stopped being readable — measured
    // 51-52px at 760 and 1000 wide, against a 60px floor. The product IS the
    // frames; they are the last thing that should pay for a small viewport.
    L.halfH = Math.max(H * (0.04 + 0.013 * wide), 30.5)
    L.unit = H * (0.088 + 0.02 * wide)

    // The film has to leave the slot dead level, and arrive at the node the
    // same way — a machine does not spit its output out at an angle. So the
    // wave's phase and frequency are DERIVED from the mouth: the crest is
    // pinned there, and the frequency is chosen so exactly two humps fit
    // between mouth and node, putting the far end back at the same flat crest.
    L.mouthU = (L.portalX + dir * L.portalW * GATE_TX - L.runStart) / (L.runEnd - L.runStart)
    // ONE hump, not two.
    //
    // This is not a taste call, it is a measurement. A stiff ribbon cannot be
    // bent around a radius smaller than its own half-width without the inner
    // edge folding through itself. Two humps across this run put the minimum
    // radius of curvature at about 37px against a 49px half-width — so the
    // strip was physically impossible, and the renderer duly drew the fold as
    // a fan of slivers at every crest. Halving the frequency quadruples the
    // radius. It is also, as both reviewers independently argued, the calmer
    // picture: one long swell reads as composure where two read as turbulence.
    L.waves = 1 / (1 - L.mouthU)
    L.vpX = W * 0.46
    L.focal = H * 3.1
    L.zAmpWanted = H * 1.1
    L.rollWanted = 0.66
    L.zAmp = L.zAmpWanted
    L.rollAmp = L.rollWanted
    L.amp = L.ampWanted
    L.zAmp = L.zAmpWanted
    reelCache = null
    fitRibbon()
    // Centre of mass, after the guard has had its say. The line was dropped to
    // 0.575H to stop a full-amplitude wave hanging high — but on a narrow stage
    // the guard flattens the wave, and the same offset then pushes a small
    // drawing into the lower half with a third of the canvas empty above it.
    // Translating the whole line is free: it changes no curvature and cannot
    // reintroduce a fold.
    // The hopper stands above the mouth, so the line sits a little lower than
    // optical centre to make room for it.
    // THE DATUM.
    //
    // `L.baseY` is the film's screen y everywhere across the table, exactly:
    // z is zero there, so the perspective divide is the identity and
    // `worldC(u)[1]` passes through the projection untouched. That makes it the
    // one number the other two acts have to meet, and a number three people are
    // building against cannot be an expression that drifts with whatever the
    // fold guard happened to leave the feed and take-up rises at. It is
    // published, flat, and the same at every viewport: H/2.
    //
    // Half the canvas above for the hopper and the descent; half below for the
    // table, which is the act that needs the room.
    // THE DATUM IS SET BY THE REEL'S HEADROOM, NOT BY TASTE.
    //
    // The hub hangs one radius above the film's line so the strip arrives
    // tangentially at bottom dead centre — which means the wheel's whole
    // DIAMETER has to fit between the line and the top of the stage. At
    // baseY = 0.50H that caps the radius at 0.25H, and the reel the owner
    // wants is bigger than that; it was clipping off the top of the canvas.
    // Dropping the line to 0.58H buys the diameter the terminus needs.
    L.baseY = H * 0.58
    L.portalY = pathY(L.mouthU)
    buildCellTable()
    GRAD = null
    buildGradients()
  }

  // ---- the line, as an actual ribbon in three dimensions --------------------
  /**
   * THE FILM IS NOT ELASTIC.
   *
   * Every "rubbery" complaint traces to one mistake: the strip's two edges were
   * being generated in SCREEN space, by offsetting perpendicular to the
   * projected tangent by a projected half-height. Do that on a curve and the
   * outer edge travels further than the inner one, the width drifts step to
   * step, and a frame ends up wider at one end than the other. A film strip
   * cannot do that. It bends, and it twists about its own length, and that is
   * all — its width is fixed forever.
   *
   * So the ribbon is now built where it actually lives. A centreline in world
   * coordinates, a unit tangent, and a width direction perpendicular to that
   * tangent, rotated by the roll. The two edges are the centreline plus and
   * minus a CONSTANT world half-width. Both edges are projected independently,
   * and each sliver of picture is mapped onto the quad between them with an
   * affine transform. Perspective then shrinks the far end because it is
   * further away, which is the only reason the width may ever appear to change.
   *
   * That also deletes a fake: the cross-width shading ramp. A flat ribbon has
   * one surface normal across its width, so it takes one value. The ramp was
   * pretending the strip was part of a cylinder, which is another way of saying
   * it was pretending the strip was rubber.
   */
  type V3 = [number, number, number]

  /**
   * The line's phase, warped so the wave drapes instead of oscillating.
   *
   * A pure cosine is symmetric, and a strip of film hanging under its own
   * weight is not: the sag is long and broad, the recovery is shorter and
   * steeper. Warping the PHASE rather than the amplitude gets that for free and
   * costs nothing else — `sin` vanishes at both ends of the cycle, so the film
   * still leaves and arrives dead level, and the extremes are still the
   * extremes, so the fold guard's reasoning is unchanged.
   */
  const DRAPE = 0.34
  /**
   * THE LINE HAS THREE ACTS, NOT ONE CURVE.
   *
   *   feed ──▶ ┌──── the table ────┐ ──▶ take-up
   *
   * A single sinusoid made every part of the line the same kind of place, which
   * is why the middle had nothing to say. A machine does not work like that:
   *
   *   FEED     the film leaves the hopper's throat at an angle and settles.
   *   TABLE    it runs dead flat and broadside to camera. Level, untwisted, at
   *            one depth. This is the working section — you can read the frames,
   *            so this is where things are inserted and where material is taken
   *            out.
   *   TAKE-UP  it twists toward edge-on and rises to feed the reel IN THE
   *            REEL'S PLANE, which is what actually has to happen for film to
   *            wind onto a flange.
   *
   * This is also what lets the ends be dramatic without the elasticity coming
   * back. Measured earlier: foreshortening ACROSS the ribbon reads as a twist
   * and is wanted; foreshortening ALONG it compresses frames while the width
   * holds and reads as rubber. The table is broadside, so nothing compresses
   * where the product has to be read; the drama lives in the take-up twist,
   * which is the harmless one.
   */
  // A longer feed reaches the same depth with a gentler gradient, which is
  // what buys depth back without heading past the elasticity bound.
  //
  // These are no longer constants. `L.feedEndU` and `L.tableEndU` are solved in
  // `resize()` from x = W/3 and x = 2W/3, because the act boundaries are a
  // COMPOSITION rule and a hand-tuned number cannot be trusted to keep
  // agreeing with one. See the note on `L.feedEndU`.

  /** 0 through the feed, 1 from the table onward. Smooth at both ends. */
  function feedBlend(u: number) {
    const k = clamp01((u - L.mouthU) / Math.max(1e-6, L.feedEndU - L.mouthU))
    return k * k * (3 - 2 * k)
  }
  /** 0 up to the table's end, 1 at the reel. Smooth at both ends. */
  function takeBlend(u: number) {
    const k = clamp01((u - L.tableEndU) / Math.max(1e-6, 1 - L.tableEndU))
    return k * k * (3 - 2 * k)
  }

  function worldC(u: number): V3 {
    const f = 1 - feedBlend(u)
    const g = takeBlend(u)
    return [
      L.runStart + (L.runEnd - L.runStart) * u,
      // Flat across the table; lifted at the hopper, lifted again to the reel.
      L.baseY - L.feedRise * f - L.takeRise * g,
      // Depth only where it cannot cost legibility.
      L.zAmp * f - L.takeZ * g,
    ]
  }
  function pathZ(u: number) {
    return worldC(u)[2]
  }
  /** Perspective scale at u. */
  function depth(u: number) {
    return L.focal / (L.focal + pathZ(u))
  }
  function proj3(p: V3): [number, number] {
    const d = L.focal / (L.focal + p[2])
    return [L.vpX + (p[0] - L.vpX) * d, L.baseY + (p[1] - L.baseY) * d]
  }
  function proj(x: number, y: number, z: number): [number, number] {
    return proj3([x, y, z])
  }

  const sub = (a2: V3, b2: V3): V3 => [a2[0] - b2[0], a2[1] - b2[1], a2[2] - b2[2]]
  const cross = (a2: V3, b2: V3): V3 => [
    a2[1] * b2[2] - a2[2] * b2[1],
    a2[2] * b2[0] - a2[0] * b2[2],
    a2[0] * b2[1] - a2[1] * b2[0],
  ]
  const norm = (v: V3): V3 => {
    const m = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / m, v[1] / m, v[2] / m]
  }
  const dot3 = (a2: V3, b2: V3) => a2[0] * b2[0] + a2[1] * b2[1] + a2[2] * b2[2]

  function tangent(u: number): V3 {
    const e = 0.0009
    return norm(sub(worldC(Math.min(1, u + e)), worldC(Math.max(0, u - e))))
  }

  /**
   * Roll about the long axis. Flat on the table, twisting toward edge-on for
   * the reel — film has to arrive in the plane of the flange it winds onto.
   */
  function pathRoll(u: number) {
    return L.rollFeed * (1 - feedBlend(u)) + L.rollTake * takeBlend(u)
  }

  /** Unit vector across the ribbon, and the ribbon's surface normal. */
  function frameAxes(u: number) {
    const T = tangent(u)
    const up: V3 = [0, 1, 0]
    const d = dot3(up, T)
    const W0 = norm([up[0] - T[0] * d, up[1] - T[1] * d, up[2] - T[2] * d])
    const U0 = cross(T, W0)
    const r = pathRoll(u)
    const cr = Math.cos(r)
    const sr = Math.sin(r)
    const W: V3 = [W0[0] * cr + U0[0] * sr, W0[1] * cr + U0[1] * sr, W0[2] * cr + U0[2] * sr]
    // Wound so that N faces the viewer when the ribbon is flat; the other
    // convention silently renders the entire strip as the back of the stock.
    // `?dir=rtl` has always rendered the whole strip as the back of the stock:
    // mirroring negates T's x, cross(W, T) negates with it, `facing` goes
    // negative for every sliver and drawStrip takes the back-face branch. Two
    // agents measured it independently against the baseline, 50 vs 255.
    const N = dir > 0 ? cross(W, T) : cross(T, W)
    return { T, W, N }
  }
  /**
   * A point across the ribbon at u, at cross-offset `v` in units of the
   * half-width. Projected from WORLD, never interpolated between two already
   * projected edges.
   *
   * That distinction is not pedantic. Perspective is not linear along a
   * segment, so taking a fixed fraction of the projected width — which is what
   * lerping the two screen edges does — makes the near rail and the far rail
   * come out different sizes on a ribbon that is rolled. Measured in world,
   * both rails are the same piece of film and stay so at any angle.
   */
  function acrossAt(u: number, v: number): [number, number] {
    const C = worldC(u)
    const { W } = frameAxes(u)
    const h = L.halfH * v
    return proj3([C[0] + W[0] * h, C[1] + W[1] * h, C[2] + W[2] * h])
  }

  /**
   * Everything about one cross-section of the ribbon, computed once.
   *
   * `worldC` and `frameAxes` are trigonometric and were being recomputed six to
   * ten times per sliver — by `edgesAt`, by `acrossAt` for each rail and each
   * perforation corner, and again by `tangent` inside `frameAxes`. Sampling
   * once and passing the section around is most of the arithmetic gone.
   */
  function sectionAt(u: number) {
    const C = worldC(u)
    const { W, N } = frameAxes(u)
    const across = (v: number): [number, number] => {
      const h = L.halfH * v
      return proj3([C[0] + W[0] * h, C[1] + W[1] * h, C[2] + W[2] * h])
    }
    return { C, W, N, across, p: across(1), m: across(-1) }
  }

  /** The two projected edges of the ribbon at u. Constant world width. */
  function edgesAt(u: number) {
    const C = worldC(u)
    const { W, N } = frameAxes(u)
    const h = L.halfH
    return {
      p: proj3([C[0] + W[0] * h, C[1] + W[1] * h, C[2] + W[2] * h]),
      m: proj3([C[0] - W[0] * h, C[1] - W[1] * h, C[2] - W[2] * h]),
      N,
    }
  }

  function pathX(u: number) {
    return proj3(worldC(u))[0]
  }
  function pathY(u: number) {
    return proj3(worldC(u))[1]
  }
  /** Half the ribbon's apparent width. Derived, never assumed. */
  function pathH(u: number) {
    const e = edgesAt(u)
    return Math.max(0.5, Math.hypot(e.p[0] - e.m[0], e.p[1] - e.m[1]) / 2)
  }

  /**
   * How much sweep and twist this geometry can carry without folding.
   *
   * A perspective divide is not monotonic for free. `pathX` is
   * `vp + (world - vp) * depth`, so its slope is
   * `world' * depth + (world - vp) * depth'`. Far from the vanishing point the
   * second term is large, and where the line is receding fastest it can
   * overpower the first — at which point x runs BACKWARDS and the ribbon
   * doubles through itself.
   *
   * The first version of this guard only checked the CENTRELINE, which is not
   * enough: the two edges sit at different depths whenever the ribbon is
   * rolled, so an edge can fold while the centre is perfectly well behaved.
   * That is measurable — thirty-odd steps in four hundred where the lower edge
   * travelled backwards — and it is what printed a fan of slivers at the
   * crests. So both edges are checked, and both the sweep and the twist are
   * reduced until neither folds, at any viewport, with margin to spare.
   */
  /**
   * How far the line is allowed to head away from the picture plane.
   *
   * THIS IS THE ELASTICITY CONSTRAINT, and it is a different thing from the
   * fold. Two foreshortenings act on the ribbon and they do not read the same:
   *
   *   - ACROSS the strip, from the roll. The width narrows, the frames keep
   *     their length, and the eye reads a TWIST. This is the effect the film
   *     reference is made of and it should stay.
   *   - ALONG the strip, from the heading. The frames compress while the width
   *     does not, and the eye reads RUBBER — because a frame's length relative
   *     to the film's width is a constant of the stock, and nothing physical
   *     changes it.
   *
   * Measured on the previous geometry, the tangent reached 0.838 of the view
   * direction — 57 degrees out of the picture plane — squeezing frames to 54%
   * of their length on a strip whose width barely moved. The frame-to-width
   * ratio swung 2.05x along one piece of film.
   *
   * So the heading is bounded and the roll is left alone. The cost is a gentler
   * depth sweep, because z amplitude and heading are the same parameter; the
   * dimensionality that survives is the twist, which is the one that was
   * reading correctly anyway.
   */
  const MAX_HEADING_Z = 0.34

  function fitRibbon() {
    const nominal = Math.abs(L.runEnd - L.runStart)
    const SAMPLES = 320
    for (let attempt = 0; attempt < 40; attempt++) {
      // Heading first: it is the constraint that decides whether the film can
      // be believed at all.
      let worstTz = 0
      for (let i = 0; i <= SAMPLES; i++) {
        const T = tangent(i / SAMPLES)
        worstTz = Math.max(worstTz, Math.abs(T[2]))
      }
      if (worstTz > MAX_HEADING_Z) {
        // Heading is a property of Z alone. Height and twist cost nothing here
        // and must not be spent paying for it.
        L.zAmp *= 0.9
        continue
      }
      let worst = Infinity
      let sign = 1
      let prev = edgesAt(0)
      for (let i = 1; i <= SAMPLES; i++) {
        const e = edgesAt(i / SAMPLES)
        // Signed area of the sliver's quad. While this keeps one sign the
        // ribbon is a surface; when it changes sign the quad has folded into a
        // bowtie and the film is passing through itself.
        const ax = e.p[0] - prev.p[0]
        const ay = e.p[1] - prev.p[1]
        const bx = prev.m[0] - prev.p[0]
        const by = prev.m[1] - prev.p[1]
        const area = (ax * by - ay * bx) / (nominal / SAMPLES)
        if (i === 1) sign = Math.sign(area) || 1
        worst = Math.min(worst, area * sign)
        prev = e
      }
      // Normalised by the ribbon's width, so the threshold means the same
      // thing at any scale: how far the sliver is from collapsing flat.
      L.zMargin = worst / Math.max(1, 2 * L.halfH)
      L.headingZ = worstTz
      if (L.zMargin > 0.08) return
      // The table is not negotiable, so the guard spends the feed's rise and
      // depth first, and the take-up twist last.
      L.feedRise *= 0.93
      L.zAmp *= 0.93
      L.takeRise *= 0.96
      // Roll is NOT in the spend list, and that is a measurement rather than a
      // preference: forcing rollTake to zero at 390x523 moved zMargin by
      // nothing at all (-1.856 either way), while zeroing the feed's descent
      // made it converge (+0.117). A roll about the ribbon's own axis shrinks
      // its projected width but never crosses its edges, so the signed area
      // this guard watches cannot change sign because of it. Grinding the
      // twist down here was buying nothing and cost the film its ability to
      // enter the plane of the flange it winds onto.
    }
  }

  /** Key light, in world space. Upper left, slightly toward the viewer. */
  const KEY: V3 = norm([-0.42, -0.82, -0.4])

  // ---- the strip's editorial content ---------------------------------------
  // What comes out of the machine is the FINISHED cut, and the picture does not
  // stop to explain how. Earlier drafts hatched the condemned frames, then
  // dropped them on a cutting-room floor; both turned the edit into a second
  // transform competing with the one that carries the product.

  /** Half thickness of a gate, as a fraction of the machine's footprint. */
  /** Where the mouth sits relative to the machine's nominal footprint. Kept
   *  because the ring, the run's start, and the file lane all derive from it. */
  const GATE_TX = 0.3
  const FRAME_ASPECT = 1.07
  /** Frames of film passing the mouth per second. */
  const FILM_RATE = 1.05
  /** Fraction of the ribbon's width taken by each black rail. */
  const RAIL = 0.11

  /** Deterministic per-item noise. No allocation, stable across frames, and
   *  reproducible — which is what makes a screenshot harness meaningful. */
  const hash = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
  }

  const CELL_SAMPLES = 1024
  let cellTable = new Float64Array(CELL_SAMPLES + 1)
  /** Cumulative PROJECTED length along the line, in CSS pixels. The projection
   *  does not depend on time, so this is static between resizes — which is what
   *  makes it safe to walk the ribbon in even screen steps. */
  let pixTable = new Float64Array(CELL_SAMPLES + 1)

  /**
   * Frames advance by WORLD arc length. Frame width is a constant of the film,
   * so this table is the film's own footage count — perspective then makes the
   * distant ones look smaller without anyone having to arrange it.
   */
  function buildCellTable() {
    const frameW = 2 * L.halfH * FRAME_ASPECT
    let acc = 0
    let pix = 0
    cellTable[0] = 0
    pixTable[0] = 0
    let prev = worldC(0)
    let prevP = proj3(prev)
    for (let i = 1; i <= CELL_SAMPLES; i++) {
      const u = i / CELL_SAMPLES
      const c = worldC(u)
      const pr = proj3(c)
      acc += Math.hypot(c[0] - prev[0], c[1] - prev[1], c[2] - prev[2])
      pix += Math.hypot(pr[0] - prevP[0], pr[1] - prevP[1])
      cellTable[i] = acc / frameW
      pixTable[i] = pix
      prev = c
      prevP = pr
    }
  }

  /** u at a given distance in projected pixels along the line. */
  function uAtPixels(px: number) {
    if (px <= 0) return 0
    if (px >= pixTable[CELL_SAMPLES]) return 1
    let lo = 0
    let hi = CELL_SAMPLES
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (pixTable[mid] < px) lo = mid
      else hi = mid
    }
    const a2 = pixTable[lo]
    const b2 = pixTable[hi]
    return (lo + (b2 > a2 ? (px - a2) / (b2 - a2) : 0)) / CELL_SAMPLES
  }

  function uAtCell(c: number) {
    if (c <= cellTable[0]) return 0
    if (c >= cellTable[CELL_SAMPLES]) return 1
    let lo = 0
    let hi = CELL_SAMPLES
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (cellTable[mid] < c) lo = mid
      else hi = mid
    }
    const a2 = cellTable[lo]
    const b2 = cellTable[hi]
    return (lo + (b2 > a2 ? (c - a2) / (b2 - a2) : 0)) / CELL_SAMPLES
  }
  function cellAtU(u: number) {
    const f = clamp01(u) * CELL_SAMPLES
    const i = Math.min(CELL_SAMPLES - 1, Math.floor(f))
    return cellTable[i] + (cellTable[i + 1] - cellTable[i]) * (f - i)
  }

  // ---- THE CUT -------------------------------------------------------------
  /**
   * THE FILM STOPS TO BE CUT, AND THAT IS THE WHOLE ACT.
   *
   * Every earlier attempt at showing the edit failed the same way and the
   * journal names it: "it's just another transform". Hatching, scissors,
   * offcuts on a floor — each one added a SECOND thing happening alongside the
   * one that carries the product, competing with it, and the honest response
   * was to delete them all. That was right about the symptom and wrong about
   * the cause. The cut was competing because it was drawn as decoration ON a
   * film that never stopped moving.
   *
   * A real editor does not cut film in motion, and neither does any machine
   * that has ever handled it. You run, you find the frame, YOU STOP, you cut,
   * you splice, you run on. So the loudest thing available in a picture whose
   * entire visual field is "everything travels at one constant rate" is not
   * another object. It is the absence of motion.
   *
   * The whole line stops. The hopper stops feeding, the reel stops winding, and
   * for six hundred milliseconds nothing on the belt moves at all — which is
   * also, and not by accident, the only moment in the loop where a still frame
   * can be photographed with the product's verb in it. Then three frames of
   * film are removed and the strip SLAMS closed at eleven times the running
   * speed. Stop, cut, slam. Nobody has to be told where to look.
   *
   * This makes Act II the conductor of the whole piece rather than a scene in
   * the middle of it, and it is the reason everything downstream reads as one
   * machine instead of three animations: there is now exactly one clock and the
   * table owns it.
   */

  /** Frames of film between one cut and the next, on the original recording. */
  const CUT_PERIOD = 7
  /** Frames removed each time. Three of seven — BitterClip removes most of a
   *  recording, and a run shorter than this is a nick rather than an edit. */
  const CUT_REMOVED = 3
  /** Frames that survive per cycle, which is also the spacing between splices
   *  once they are travelling downstream. */
  const CUT_KEEP = CUT_PERIOD - CUT_REMOVED

  /**
   * Seconds the belt is dead still.
   *
   * Long enough to be a hold and not a hitch, and then longer than that on
   * purpose. The beat sheet fills the first 420ms with the blade and the fall;
   * what is left is the part worth having, which is the open gap standing empty
   * with nothing moving anywhere on the canvas. That is the single strongest
   * image the act produces and it is the frame a poster would be shot on, so it
   * gets 360ms rather than the 70ms the first timing left it.
   */
  const HOLD_S = 0.62
  /** Seconds the gap takes to close. Three frames in this is ~1500px/s — an
   *  order of magnitude above running speed, which is what makes it a slam. */
  const SLAM_S = 0.13
  /** Fraction of the running phase spent easing off and back on. The belt is at
   *  constant speed for the other 95%: a line that breathes reads as two
   *  animations, and motion coherence is a frontier this project already
   *  fought for. */
  const RUN_RAMP = 0.05

  /**
   * The run phase's distance curve, precomputed.
   *
   * The rate is 1 through the middle and smoothsteps to 0 at both ends, so the
   * film arrives at the blade rather than hitting it. Integrating that profile
   * numerically once, and normalising, gives a distance function that is exact
   * and monotonic by construction — which matters, because a film that goes
   * backwards for one frame is the class of defect this drawing has produced
   * over and over.
   *
   * The integral of the profile over the phase is `1 - RUN_RAMP` (each
   * smoothstep ramp contributes exactly half its own width), which is what lets
   * the phase's duration be solved so the plateau runs at exactly `FILM_RATE`.
   */
  const RUN_CURVE = (() => {
    const N = 128
    const out = new Float64Array(N + 1)
    const ss = (x: number) => {
      const k = clamp01(x)
      return k * k * (3 - 2 * k)
    }
    const rate = (x: number) => ss(x / RUN_RAMP) * (1 - ss((x - (1 - RUN_RAMP)) / RUN_RAMP))
    let acc = 0
    for (let i = 1; i <= N; i++) {
      acc += (rate((i - 1) / N) + rate(i / N)) / 2 / N
      out[i] = acc
    }
    for (let i = 0; i <= N; i++) out[i] /= acc || 1
    return out
  })()

  function runCurve(x: number) {
    const f = clamp01(x) * 128
    const i = Math.min(127, Math.floor(f))
    return RUN_CURVE[i] + (RUN_CURVE[i + 1] - RUN_CURVE[i]) * (f - i)
  }

  /**
   * Seconds the belt stays still AFTER the gap has closed, so the joint can be
   * forged.
   *
   * A splice is not two ends touching, it is two ends WELDED, and on a bench
   * that is a separate press stroke onto a joint that is already closed. It
   * needs the belt stopped, which it now is, and it is the beat that turns
   * "the gap shut" into "the film is whole again".
   */
  const FORGE_S = 0.28

  const RUN_S = CUT_KEEP / (FILM_RATE * (1 - RUN_RAMP))
  const CYCLE_S = RUN_S + HOLD_S + SLAM_S + FORGE_S

  /**
   * The beat sheet, in seconds from the instant the belt comes to rest.
   *
   * Written as numbers rather than as feel, because the one lesson this project
   * keeps re-learning is that three rounds of adjusting constants by eye lose
   * to one measurement. Everything the blade, the marks and the offcut do is
   * read off these, so the choreography is in one place and can be re-timed
   * without hunting through draw calls.
   */
  const BEAT = {
    /** Blade starts falling. A moment of stillness first, so the stop reads as
     *  a stop and not as the blade's wind-up. */
    fallFrom: 0.06,
    /** Blade is through the stock. Ninety milliseconds is about four frames at
     *  60Hz: fast enough to be violent, slow enough to be seen. */
    fallTo: 0.19,
    /**
     * It stays down while the offcut clears.
     *
     * Timed against the fall rather than chosen. On the first beat sheet the
     * blades were back up before the gap had opened, so no single frame of the
     * loop contained both the tool and its result — and a still that has to be
     * two stills is a still that cannot be a poster.
     */
    dwellTo: 0.34,
    /** And retracts, once the footage is on its way down. */
    riseTo: 0.52,
    /** The condemned run leaves the line and lands on the deck. */
    liftFrom: 0.19,
    liftTo: 0.42,
  }
  /** The film is in two pieces from here on. Coincides with the blade bottoming
   *  out, because that is the frame in which it is true. */
  const SEVER_AT = BEAT.fallTo

  /**
   * Where the cut happens, in the film's own cell coordinates.
   *
   * Derived from x = W/2, not chosen: the condemned run is CENTRED on the
   * canvas's vertical midline, so the loudest event in the piece lands on its
   * strongest compositional axis. Across the table z is zero, so screen x is
   * world x and this inversion is exact.
   *
   * `cutC1` is the DOWNSTREAM cut line — the boundary between the last frame
   * that survives and the first frame that does not. The upstream cut line is
   * `CUT_REMOVED` frames behind it. Both are on frame boundaries by
   * construction, because a splice that lands mid-frame is not a splice.
   */
  function cutC1() {
    const half = (CUT_REMOVED / 2) * 2 * L.halfH * FRAME_ASPECT
    // Snapped to a whole frame. A splice that lands mid-frame is not a splice,
    // and rounding moves the station by at most half a frame — thirty pixels,
    // against a compositional axis nobody can measure to that.
    return Math.round(cellAtU(uAtX(W / 2 + dir * half)))
  }

  /** u at a screen x, on the table, where the projection is the identity. */
  function uAtX(x: number) {
    return clamp01((x - L.runStart) / (L.runEnd - L.runStart))
  }

  /** Distance in projected pixels from the line's start to u. The inverse of
   *  `uAtPixels`, which several things now need in order to walk a piece of
   *  film rather than the whole line. */
  function pixAtU(u: number) {
    const at = clamp01(u) * CELL_SAMPLES
    const i = Math.min(CELL_SAMPLES - 1, Math.max(0, Math.floor(at)))
    return pixTable[i] + (pixTable[i + 1] - pixTable[i]) * (at - i)
  }

  type FilmClock = {
    /** Completed splices. Only its parity with `sigma` matters to the drawing;
     *  it exists so the film coordinate stays continuous across a cycle. */
    n: number
    /** Seconds into the current cycle. */
    tau: number
    /** Frames the belt has travelled this cycle, 0..CUT_KEEP. */
    sigma: number
    /** How far the upstream piece has advanced into the gap, 0..CUT_REMOVED. */
    adv: number
    /** 0 running, 1 held, 2 closing, 3 forging. */
    phase: 0 | 1 | 2 | 3
    /** 0..1 through the forge stroke, or -1 outside it. */
    forge: number
    /** Seconds since the belt came to rest. Negative while it is still running,
     *  which is what lets the marks anticipate. */
    since: number
    /** The film is in two pieces. */
    severed: boolean
    /** The downstream cut line, in cell coordinates. */
    c1: number
    /** Cell coordinates of the open gap, or null. */
    hole: [number, number] | null
    /** The offset that turns a cell coordinate into a film coordinate on the
     *  most UPSTREAM piece — the old global `scroll`, generalised. Everything
     *  that lives at the intake end (files, the intake pulse) runs off this. */
    upstream: number
    /** Frames of finished film the take-up has pulled. Drives the reel, so the
     *  reel stops when the belt does instead of spinning through the cut. */
    wound: number
  }

  function filmClock(t: number): FilmClock {
    const n = Math.floor(t / CYCLE_S)
    const tau = t - n * CYCLE_S
    let sigma: number
    let adv = 0
    let phase: 0 | 1 | 2 | 3 = 0
    let forge = -1
    if (tau < RUN_S) {
      sigma = CUT_KEEP * runCurve(tau / RUN_S)
    } else if (tau < RUN_S + HOLD_S) {
      sigma = CUT_KEEP
      phase = 1
    } else if (tau < RUN_S + HOLD_S + SLAM_S) {
      sigma = CUT_KEEP
      phase = 2
      const kk = clamp01((tau - RUN_S - HOLD_S) / SLAM_S)
      // Ease OUT only. The gap closes the way a spring-loaded splicer closes:
      // all of the speed at the start, arriving rather than accelerating.
      adv = CUT_REMOVED * (1 - Math.pow(1 - kk, 2.2))
    } else {
      sigma = CUT_KEEP
      adv = CUT_REMOVED
      phase = 3
      forge = clamp01((tau - RUN_S - HOLD_S - SLAM_S) / FORGE_S)
    }
    const since = tau - RUN_S
    const severed = since >= SEVER_AT
    const c1 = cutC1()
    return {
      n,
      tau,
      sigma,
      adv,
      phase,
      since,
      severed,
      forge,
      c1,
      hole: severed ? [c1 - CUT_REMOVED + adv, c1] : null,
      upstream: sigma + n * CUT_PERIOD + (severed ? adv : 0),
      wound: n * CUT_KEEP + sigma,
    }
  }

  /**
   * THE STRIP, AS A SEQUENCE OF SPLICED PIECES.
   *
   * The bookkeeping here is the intellectual core of the act, so it is worth
   * stating exactly rather than approximating.
   *
   * Removing frames from a moving strip is not a change of speed, it is a
   * change of TOPOLOGY. Cut three frames out and the film is in two pieces with
   * a hole between them; close the hole and the upstream piece has advanced
   * three frames further than the downstream piece ever will. So a material
   * point travels `CUT_PERIOD` frames per cycle while it is upstream of the
   * blade and `CUT_KEEP` frames per cycle once it is downstream, and the
   * difference is exactly the footage that went in the bin. One global scroll
   * cannot express that, and the very first version of this — a single scroll
   * with the film jumping — moved the finished film backwards.
   *
   * So the line is a list of pieces. Each is a contiguous span of cell
   * coordinates with its own constant offset; crossing a splice seam
   * downstream, the film coordinate steps up by `CUT_REMOVED`, which is the
   * removed footage, stated as geometry. Seams are `CUT_KEEP` apart because
   * that is how far the belt travels between splices, and they travel with the
   * film for the rest of their lives — so a splice you watch being made is
   * still there when it reaches the reel. That is the evidence the act leaves
   * behind, and it is the reason a still taken anywhere in the loop has the
   * edit in it.
   *
   * The offsets are continuous across a cycle boundary. Checked by hand, both
   * sides of the seam, and it is not obvious: at the end of a cycle the
   * upstream piece carries `sigma + n·CUT_PERIOD + CUT_REMOVED`, and at the
   * start of the next it carries `0 + (n+1)·CUT_PERIOD`, and those are equal
   * precisely because `CUT_KEEP + CUT_REMOVED = CUT_PERIOD`.
   */
  type Piece = { c0: number; c1: number; off: number }

  function filmPieces(k: FilmClock): Piece[] {
    const cMax = cellTable[CELL_SAMPLES]
    const base = k.sigma + k.n * CUT_PERIOD
    const out: Piece[] = []
    // Seams from completed splices, marching downstream from the blade.
    const s0 = k.c1 + k.sigma
    let lo = 0
    let below = 0
    for (let j = 0; ; j++) {
      const s = s0 + j * CUT_KEEP
      if (s >= cMax || j > 64) break
      if (s > lo) out.push({ c0: lo, c1: s, off: base - CUT_REMOVED * below })
      lo = Math.max(lo, s)
      below++
    }
    out.push({ c0: lo, c1: cMax, off: base - CUT_REMOVED * below })
    // The open gap splits the most upstream piece and displaces what is behind
    // it, because the upstream half has started closing the distance.
    if (k.hole) {
      const [h0, h1] = k.hole
      for (let i = 0; i < out.length; i++) {
        const p = out[i]
        if (h0 > p.c0 && h1 <= p.c1 + 1e-9) {
          out.splice(i, 1, { c0: h1, c1: p.c1, off: p.off }, { c0: p.c0, c1: h0, off: p.off + k.adv })
          break
        }
      }
    }
    return out.filter((p) => p.c1 - p.c0 > 1e-6)
  }

  /**
   * The cell-to-film offset in force at a cell coordinate.
   *
   * Wanted by everything that lives at ONE END of the line rather than walking
   * it — the exit threshold's shards, the exit's downbeat. Sampling the piece
   * list is the only correct way to get it: the first attempt used
   * `wound + n·CUT_REMOVED` as a stand-in for "the downstream side", and
   * measuring the clock showed that quantity stepping by three frames at every
   * cycle boundary, which would have popped the film at the reel once per cut.
   * The stand-in looked right and was wrong; the piece list cannot be, because
   * it is the same thing the strip is drawn from.
   */
  function offAtCell(c: number, k: FilmClock) {
    const pieces = filmPieces(k)
    for (const p of pieces) if (c >= p.c0 && c <= p.c1) return p.off
    return pieces.length ? pieces[pieces.length - 1].off : k.upstream
  }

  /** Where a given film frame is on the line, or null if it has been removed or
   *  is off the ends. Used by anything pinned to a frame rather than a place. */
  function uForFilm(f: number, pieces: Piece[]) {
    for (const p of pieces) {
      const c = f + p.off
      if (c >= p.c0 && c <= p.c1) return uAtCell(c)
    }
    return null
  }

  /**
   * How far the film travels while it is coming into existence, in pixels.
   *
   * The owner's constraint, and it is the right one: the change of state
   * happens AT the threshold. Earlier versions ramped the film in over a fifth
   * of the run and filled the gap with a cloud, which read as a confetti field
   * standing next to a film rather than as film arriving.
   */
  const TRANSITION_PX = 38

  /** The u that is `px` pixels along the line from `uRef`. */
  function uOffsetPixels(uRef: number, px: number) {
    const totalPix = pixTable[CELL_SAMPLES]
    const at = uRef * CELL_SAMPLES
    const i = Math.min(CELL_SAMPLES - 1, Math.max(0, Math.floor(at)))
    const base = pixTable[i] + (pixTable[i + 1] - pixTable[i]) * (at - i)
    return uAtPixels(Math.max(0, Math.min(totalPix, base + px)))
  }


  const stripAlpha = (u: number) => {
    const inStart = uOffsetPixels(L.mouthU, ringRimPx(L.mouthU))
    const inEnd = uOffsetPixels(inStart, TRANSITION_PX)
    const outEnd = uOffsetPixels(NODE_U, -ringRimPx(NODE_U))
    const outStart = uOffsetPixels(outEnd, -TRANSITION_PX)
    const rise = clamp01((u - inStart) / Math.max(1e-6, inEnd - inStart))
    const fall = 1 - clamp01((u - outStart) / Math.max(1e-6, outEnd - outStart))
    return Math.pow(rise, 0.7) * Math.pow(fall, 0.7)
  }

  type P2 = [number, number]
  const lerp2 = (a2: P2, b2: P2, k: number): P2 => [a2[0] + (b2[0] - a2[0]) * k, a2[1] + (b2[1] - a2[1]) * k]

  /**
   * Paint a triangle of a bitmap onto a triangle of the canvas, exactly.
   *
   * This is the piece that makes the ribbon possible. An affine transform maps
   * the unit square to a PARALLELOGRAM, so a quad whose two ends differ in
   * width — which is every quad on a ribbon in perspective — cannot be filled
   * that way: the fourth corner misses, and the miss was measured at up to
   * nine pixels, printed as a fan of slivers at the crests. A triangle has
   * exactly one affine map onto another triangle, so splitting each sliver in
   * two and solving that map is not an approximation at all. Adjacent
   * triangles share their edges by construction, so nothing can seam.
   *
   * Canvas has no primitive for this; the transform is solved by hand and the
   * draw is clipped to the destination triangle.
   */
  /** Overlap between adjacent textured triangles, in CSS px. The backing store
   *  is only dpr-scaled (capped at 1.5), so this has to clear a whole backing
   *  pixel to cover an antialiased clip edge. See texTriangle. */
  const SEAM_OUTSET = 0.8
  /** Texels of margin added to every source read. See texTriangle. */
  const SOURCE_BLEED = 1

  const lerpP = (a2: P2, b2: P2, s2: number): P2 => [
    a2[0] + (b2[0] - a2[0]) * s2,
    a2[1] + (b2[1] - a2[1]) * s2,
  ]

  function texTriangle(
    img: CanvasImageSource,
    s0: P2, s1: P2, s2: P2,
    d0: P2, d1: P2, d2: P2,
    /** Source sub-rect actually needed. Drawing the whole bitmap inside every
     *  triangle clip is the single most expensive thing this renderer can do:
     *  the rasteriser still walks the transformed bounds of a 640x480 image for
     *  each of nearly a thousand triangles a frame. Passing the slice costs
     *  nothing and is most of the frame budget. */
    sub?: [number, number, number, number],
  ) {
    const [x0, y0] = s0
    const [x1, y1] = s1
    const [x2, y2] = s2
    const [u0, v0] = d0
    const [u1, v1] = d1
    const [u2, v2] = d2
    const det = x0 * (y2 - y1) - x1 * y2 + x2 * y1 + (x1 - x2) * y0
    if (!det) return
    ctx.save()
    // SEAMS. ctx.clip() antialiases, so two triangles sharing an edge each take
    // about half the coverage of the pixels along it, and source-over leaves
    // roughly a quarter of the background showing through — a dark hairline on
    // every join. There are close to a thousand joins a frame and they travel
    // with the film, which is what reads as vertical bars jittering along the
    // strip. Pushing each vertex a fraction of a pixel out from the centroid
    // makes neighbours overlap instead of abut; the overlap is drawn twice from
    // a continuous image, so it is invisible, and the hairlines are gone.
    const gx = (u0 + u1 + u2) / 3
    const gy = (v0 + v1 + v2) / 3
    const out = (x: number, y: number): P2 => {
      const dx = x - gx
      const dy = y - gy
      const l = Math.hypot(dx, dy) || 1
      return [x + (dx / l) * SEAM_OUTSET, y + (dy / l) * SEAM_OUTSET]
    }
    const e0 = out(u0, v0)
    const e1 = out(u1, v1)
    const e2 = out(u2, v2)
    ctx.beginPath()
    ctx.moveTo(e0[0], e0[1])
    ctx.lineTo(e1[0], e1[1])
    ctx.lineTo(e2[0], e2[1])
    ctx.closePath()
    ctx.clip()
    ctx.transform(
      -(y0 * (u2 - u1) - y1 * u2 + y2 * u1 + (y1 - y2) * u0) / det,
      (y1 * v2 + y0 * (v1 - v2) - y2 * v1 + (y2 - y1) * v0) / det,
      (x0 * (u2 - u1) - x1 * u2 + x2 * u1 + (x1 - x2) * u0) / det,
      -(x1 * v2 + x0 * (v1 - v2) - x2 * v1 + (x2 - x1) * v0) / det,
      (x0 * (y2 * u1 - y1 * u2) + y0 * (x1 * u2 - x2 * u1) + (x2 * y1 - x1 * y2) * u0) / det,
      (x0 * (y2 * v1 - y1 * v2) + y0 * (x1 * v2 - x2 * v1) + (x2 * y1 - x1 * y2) * v0) / det,
    )
    if (sub) {
      // BLEED THE SOURCE RECT.
      //
      // Sampling stops at the edge of a source rectangle: there are no
      // neighbouring texels inside it, so the filter falls off toward
      // transparent and leaves a dark hairline down both sides of every slice.
      // The slice edges are the sliver boundaries, so that is one faint black
      // bar every nineteen pixels, straight across the thumbnails. Widening the
      // read by a texel each way gives the filter something real to reach for;
      // the destination rectangle grows with it, so the mapping stays 1:1 and
      // the extra is clipped off by the triangle anyway.
      const iw = (img as HTMLCanvasElement).width
      const ih = (img as HTMLCanvasElement).height
      const bx0 = Math.max(0, sub[0] - SOURCE_BLEED)
      const by0 = Math.max(0, sub[1] - SOURCE_BLEED)
      const bx1 = Math.min(iw, sub[0] + sub[2] + SOURCE_BLEED)
      const by1 = Math.min(ih, sub[1] + sub[3] + SOURCE_BLEED)
      ctx.drawImage(img, bx0, by0, bx1 - bx0, by1 - by0, bx0, by0, bx1 - bx0, by1 - by0)
    } else ctx.drawImage(img, 0, 0)
    ctx.restore()
  }

  function fillQuad(a2: P2, b2: P2, c2: P2, d2: P2, fill: string) {
    ctx.beginPath()
    ctx.moveTo(a2[0], a2[1])
    ctx.lineTo(b2[0], b2[1])
    ctx.lineTo(c2[0], c2[1])
    ctx.lineTo(d2[0], d2[1])
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
  }

  /**
   * Draw a quad by mapping the unit square onto it with an affine transform:
   * (0,0) -> a, (1,0) -> b, (0,1) -> d. For a thin sliver of a smooth surface
   * that is exact enough, and it is what lets `drawImage` paint a photograph
   * into a shape canvas has no primitive for.
   */
  function unitQuad(a2: [number, number], b2: [number, number], d2: [number, number]) {
    ctx.transform(b2[0] - a2[0], b2[1] - a2[1], d2[0] - a2[0], d2[1] - a2[1], a2[0], a2[1])
  }

  /**
   * The film, drawn one spliced piece at a time.
   *
   * The only structural change from the single-scroll version is that the walk
   * is now nested inside `filmPieces()`. Everything a piece needs is its own
   * offset from cell coordinate to film coordinate, so the body below is the
   * routine that was already here with `scroll` read per piece instead of once
   * — which is deliberate, because the per-sliver mip selection, the source
   * bleed, the seam outset and the one-frame-per-sliver split inside it are all
   * hard-won and none of them care how the film coordinate was arrived at.
   *
   * Walking pieces rather than the whole line also puts an exact boundary at
   * every splice and at both edges of the open gap, which is what a sliver
   * straddling a discontinuity needed: at 19px steps a seam lands inside a
   * sliver about a third of the time, and a sliver that spans a jump of three
   * frames would try to paint three frames into nineteen pixels.
   */
  function drawStrip(t: number) {
    if (!framesReady) return
    const k = filmClock(t)
    const pieces = filmPieces(k)
    for (const p of pieces) drawStripPiece(p, k)
    if (OFF.rule) return
    for (const p of pieces) drawStripMarks(p, k)
  }

  function drawStripPiece(piece: Piece, k: FilmClock, coarse = false) {
    const total = cells.length
    const scroll = piece.off
    // EVEN SLIVERS, IN SCREEN SPACE.
    //
    // Stepping by a fixed fraction of a frame samples the film evenly and the
    // SCREEN unevenly: wherever the ribbon comes toward the viewer, dozens of
    // slivers land inside a few pixels, each a sub-pixel quad, and the picture
    // combs into vertical bars. Estimating the local scale per step was worse —
    // the probe was finer than the lookup table, so the estimate rang.
    //
    // But the projection does not depend on time. The distance along the line
    // in real pixels is a static table, so the ribbon can simply be walked in
    // even nineteen-pixel steps, and the film coordinate looked up per step.
    // Every sliver is then the same size on screen no matter what the geometry
    // does. The mapping is exact per triangle, so slivers no longer have to be
    // tiny to hide an approximation error; they only have to be short enough
    // that the curve inside one is straight.
    // ONE SLIVER PER FRAME, FOR A PIECE THAT IS OFF THE LINE.
    //
    // Nineteen pixels is the step the CURVED ribbon needs: it bounds how far an
    // affine texture map drifts from a true projective one inside one sliver.
    // A piece lying on the table is straight, unrolled and at z = 0, so that
    // drift is exactly zero and the affine map is not an approximation at all —
    // one sliver per frame is not a saving with a cost, it is the same drawing
    // with a third of the triangles. Measured: the offcuts were 11.5ms of an
    // 61.6ms software-rendered frame, and almost all of it was this.
    const STEP_PX = coarse ? 2 * L.halfH * FRAME_ASPECT : 19
    // Registration window, in film coordinates, so the jog is a property of a
    // FRAME rather than of a pixel and a whole frame moves together.
    const regFrom = cellAtU(uOffsetPixels(L.mouthU, ringRimPx(L.mouthU)))
    const regTo = cellAtU(uOffsetPixels(uOffsetPixels(L.mouthU, ringRimPx(L.mouthU)), TRANSITION_PX * 1.6))
    const regOutTo = cellAtU(uOffsetPixels(NODE_U, -ringRimPx(NODE_U)))
    const regOutFrom = cellAtU(uOffsetPixels(uOffsetPixels(NODE_U, -ringRimPx(NODE_U)), -TRANSITION_PX * 1.6))

    // The piece's own span, in projected pixels, walked so that the last step
    // lands exactly on its end. The cut edges have to be where the cut is.
    const pxA = pixAtU(uAtCell(piece.c0))
    const pxB = pixAtU(uAtCell(piece.c1))
    const span = pxB - pxA
    if (span <= 0.35) return
    const steps = Math.max(1, Math.round(span / STEP_PX))

    let prev: ReturnType<typeof sectionAt> | null = null
    for (let s = 0; s < steps; s++) {
      const u0 = uAtPixels(pxA + (span * s) / steps)
      const u1 = uAtPixels(pxA + (span * (s + 1)) / steps)
      const alpha = stripAlpha(u0)
      // The far section of one sliver is the near section of the next, so it is
      // sampled once and carried forward.
      const A = prev ?? sectionAt(u0)
      const B = sectionAt(u1)
      prev = B
      if (alpha <= 0.004) continue
      const c0 = cellAtU(u0)
      const c1 = cellAtU(u1)
      const cf0 = c0 - scroll
      const cf1 = c1 - scroll
      if (!(cf1 > cf0)) continue

      // The picture sits between the rails. Its corners are measured across the
      // ribbon in WORLD units and projected, so both rails stay the same piece
      // of film however the strip is rolled or foreshortened.
      // THE PICTURE ARRIVES OUT OF REGISTER AND SETTLES.
      //
      // Inside the transition the EMULSION is displaced across the stock, per
      // frame, by an amount that decays to nothing; the rails and perforations
      // stay put, because the stock is already stock. The picture jumps into
      // register and stops.
      const PIC = 1 - 2 * RAIL
      const unsettled =
        Math.pow(1 - clamp01((c0 - regFrom) / Math.max(1e-6, regTo - regFrom)), 2.6) +
        Math.pow(clamp01((c0 - regOutFrom) / Math.max(1e-6, regOutTo - regOutFrom)), 2.6)
      const gAp = A.across(PIC)
      const gAm = A.across(-PIC)
      const gBp = B.across(PIC)
      const gBm = B.across(-PIC)

      const facing = dot3(A.N, [0, 0, -1])
      const nl = facing >= 0 ? A.N : ([-A.N[0], -A.N[1], -A.N[2]] as V3)
      const lam = clamp01(0.5 + 0.5 * dot3(nl, KEY))

      ctx.save()
      ctx.globalAlpha = alpha
      if (OFF.pic) {
        fillQuad(gAp, gBp, gBm, gAm, '#556')
      } else if (facing >= 0) {
        // ONE FRAME PER SLIVER, ALWAYS.
        //
        // A sliver is an even step in SCREEN pixels, so it happily straddles a
        // frame boundary. The film span is cut at the integer boundaries and
        // each piece is drawn from its own frame, with a source window that
        // needs no clamping because it cannot leave the bitmap by construction.
        let segA = cf0
        while (segA < cf1 - 1e-9) {
          const ci = Math.floor(segA + 1e-9)
          const segB = Math.min(cf1, ci + 1)
          // How big one frame of film actually is here, on screen, in device
          // pixels — along the strip and across it. In a bend the first of
          // those collapses, which is exactly what has to drive the level.
          const alongPx = (((pxB - pxA) / steps) / Math.max(1e-6, cf1 - cf0)) * dpr
          const acrossPx = Math.hypot(gAp[0] - gAm[0], gAp[1] - gAm[1]) * dpr
          const img = mipFor(
            cells[((ci % total) + total) % total],
            Math.min(alongPx, acrossPx * FRAME_ASPECT),
          )
          if (img) {
            const w0 = segA - ci
            const w1 = segB - ci
            const sx = w0 * img.width
            const sw = (w1 - w0) * img.width
            if (sw > 1e-4) {
              // Bounded by the rail width: mis-registration slides the picture
              // WITHIN the stock, it does not throw the emulsion off the film.
              const jog =
                unsettled > 0.002 ? (hash(ci * 7.3) - 0.5) * 2 * RAIL * 1.5 * Math.min(1, unsettled) : 0
              const jAp = jog ? A.across(PIC + jog) : gAp
              const jAm = jog ? A.across(-PIC + jog) : gAm
              const jBp = jog ? B.across(PIC + jog) : gBp
              const jBm = jog ? B.across(-PIC + jog) : gBm
              // The sliver's geometry is straight over nineteen pixels, so the
              // piece's corners are just interpolated along it.
              const f0 = (segA - cf0) / (cf1 - cf0)
              const f1 = (segB - cf0) / (cf1 - cf0)
              const Ap = lerpP(jAp, jBp, f0)
              const Bp = lerpP(jAp, jBp, f1)
              const Am = lerpP(jAm, jBm, f0)
              const Bm = lerpP(jAm, jBm, f1)
              const H0 = img.height
              ctx.save()
              if (jog) {
                // The gate. The picture may slide within it; it may not leave it.
                const cAp = lerpP(gAp, gBp, f0)
                const cBp = lerpP(gAp, gBp, f1)
                const cAm = lerpP(gAm, gBm, f0)
                const cBm = lerpP(gAm, gBm, f1)
                ctx.beginPath()
                ctx.moveTo(cAp[0], cAp[1])
                ctx.lineTo(cBp[0], cBp[1])
                ctx.lineTo(cBm[0], cBm[1])
                ctx.lineTo(cAm[0], cAm[1])
                ctx.closePath()
                ctx.clip()
              }
              // `Ap` is the screen-BOTTOM edge (canvas +y points down while the
              // ribbon's width vector is built from world up), so the bottom of
              // the frame maps to it. Getting this backwards flips every frame.
              const sub: [number, number, number, number] = [sx, 0, sw, H0]
              texTriangle(img, [sx, H0], [sx + sw, H0], [sx, 0], Ap, Bp, Am, sub)
              texTriangle(img, [sx + sw, H0], [sx + sw, 0], [sx, 0], Bp, Bm, Am, sub)
              ctx.restore()
            }
          }
          segA = segB
        }
      } else {
        fillQuad(gAp, gBp, gBm, gAm, '#2b2b31')
      }
      // THE PHOTOGRAPH IS NOT A SURFACE.
      //
      // A carried image has its own exposure. The STOCK is what takes light. So
      // the Lambert lives on the rails, which are the actual surface, and the
      // frames are left alone.
      ctx.globalAlpha = alpha
      if (!OFF.rails) {
        // Rails from the UN-jogged boundary: the acetate is rigid, so only the
        // emulsion weaves behind the gate.
        const rAp = gAp
        const rAm = gAm
        const rBp = gBp
        const rBm = gBm
        const railLit = Math.round(15 + 14 * lam)
        const rail = `rgb(${railLit},${railLit},${railLit + 2})`
        fillQuad(A.p, B.p, rBp, rAp, rail)
        fillQuad(rAm, rBm, B.m, A.m, rail)
        // The film's own cut edge catches the key. Two hairlines are what stop
        // a black rail on a near-black page from dissolving into it.
        const edge = `rgba(255,246,242,${(0.03 + 0.11 * lam).toFixed(3)})`
        fillQuad(A.p, B.p, B.across(0.96), A.across(0.96), edge)
        fillQuad(A.across(-0.96), B.across(-0.96), B.m, A.m, edge)
      }
      ctx.restore()
    }

    drawPieceEnds(piece, k)
  }

  /**
   * THE SEVERED ENDS.
   *
   * A cut is not a hole with film on either side of it — it is two fresh edges,
   * and a fresh edge across film stock is the brightest thing on the strip
   * because it is the only place the light gets at the acetate's thickness end
   * on. The strip already uses that idea along its length, where the rails'
   * outer edges take a hairline; this is the same material fact turned ninety
   * degrees.
   *
   * Drawn per piece rather than per cut, so the seam a splice leaves behind
   * gets one too and keeps it all the way to the reel. That is the evidence:
   * every still of this picture, taken at any moment, has finished splices
   * travelling down the line in it.
   */
  function drawPieceEnds(piece: Piece, k: FilmClock) {
    const cMax = cellTable[CELL_SAMPLES]
    for (const [c, side] of [
      [piece.c1, 1],
      [piece.c0, -1],
    ] as [number, number][]) {
      if (c <= 1e-6 || c >= cMax - 1e-6) continue
      const u = uAtCell(c)
      const a = stripAlpha(u)
      if (a <= 0.02) continue
      // THREE STATES, AND THEY LOOK DIFFERENT BECAUSE THEY ARE DIFFERENT.
      //
      //  - an OPEN cut edge: nothing behind it, so the acetate's thickness
      //    takes the key full on and it is the brightest mark on the strip;
      //  - a joint that is CLOSED but not yet pressed: two of those edges
      //    abutting, which still reads as a pair rather than as one film;
      //  - a FORGED seam: one fine continuous line, because that is what a
      //    weld leaves and because the film is whole again.
      //
      // The forge stroke moves a seam from the second state to the third, and
      // the change is in the seam's geometry rather than its brightness — the
      // only kind of heat this palette allows.
      const hole = k.hole
      const open = !!hole && hole[1] - hole[0] > 1e-6 && (Math.abs(c - hole[0]) < 1e-6 || Math.abs(c - hole[1]) < 1e-6)
      const unpressed = !open && !!hole && Math.abs(c - hole[1]) < 1e-6 && k.forge < 0.26
      const w = open ? L.halfH * 0.055 : unpressed ? L.halfH * 0.045 : L.halfH * 0.026
      const A = sectionAt(uAtCell(Math.max(0, c - (side > 0 ? w / (2 * L.halfH) : 0))))
      const B = sectionAt(uAtCell(Math.min(cMax, c + (side > 0 ? 0 : w / (2 * L.halfH)))))
      ctx.save()
      ctx.globalAlpha = a
      fillQuad(
        A.p,
        B.p,
        B.m,
        A.m,
        open ? 'rgba(246,240,236,0.9)' : unpressed ? 'rgba(14,14,18,0.85)' : 'rgba(232,226,222,0.42)',
      )
      ctx.restore()
    }
  }

  /**
   * Frame rules and perforations, on their own arc spans so each one is a rigid
   * rectangle of the film rather than whatever a sliver happened to be. Driven
   * per piece for the same reason the picture is: a rule belongs to a frame,
   * and after a splice the frames on one side of the seam are not the frames on
   * the other.
   */
  function drawStripMarks(piece: Piece, k: FilmClock) {
    const scroll = piece.off
    const frameW = 2 * L.halfH * FRAME_ASPECT
    const regFrom2 = cellAtU(uOffsetPixels(L.mouthU, ringRimPx(L.mouthU)))
    const regTo2 = cellAtU(uOffsetPixels(uOffsetPixels(L.mouthU, ringRimPx(L.mouthU)), TRANSITION_PX * 1.6))
    const regOutTo2 = cellAtU(uOffsetPixels(NODE_U, -ringRimPx(NODE_U)))
    const regOutFrom2 = cellAtU(uOffsetPixels(uOffsetPixels(NODE_U, -ringRimPx(NODE_U)), -TRANSITION_PX * 1.6))
    const stampW = frameW * 0.038
    void k

    for (let f = Math.ceil(piece.c0 - scroll) - 1; f <= piece.c1 - scroll + 1; f++) {
      const c0 = f + scroll
      if (c0 < piece.c0 || c0 > piece.c1) continue
      const uA = uAtCell(c0)
      const uB = uAtCell(Math.min(piece.c1, c0 + stampW / frameW))
      const alpha = stripAlpha(uA)
      if (alpha <= 0.02) continue
      const A = sectionAt(uA)
      const B = sectionAt(uB)
      const PICR = 1 - 2 * RAIL
      const uns =
        Math.pow(1 - clamp01((c0 - regFrom2) / Math.max(1e-6, regTo2 - regFrom2)), 2.6) +
        Math.pow(clamp01((c0 - regOutFrom2) / Math.max(1e-6, regOutTo2 - regOutFrom2)), 2.6)
      // The rule is emulsion, so it slides with the picture it divides.
      const jg = uns > 0.002 ? (hash(Math.floor(f) * 7.3) - 0.5) * 2 * RAIL * 1.5 * Math.min(1, uns) : 0
      ctx.save()
      ctx.globalAlpha = alpha
      // Between the rails only — the rails themselves run continuously, as they
      // do on real stock.
      fillQuad(A.across(PICR + jg), B.across(PICR + jg), B.across(-PICR + jg), A.across(-PICR + jg), '#000')
      ctx.restore()
    }

    const perfW = frameW * 0.075
    const perfPitch = 0.25
    for (
      let n = Math.ceil((piece.c0 - scroll) / perfPitch) - 1;
      n * perfPitch <= piece.c1 - scroll + perfPitch;
      n++
    ) {
      const c0 = n * perfPitch + scroll
      if (c0 < piece.c0 || c0 > piece.c1) continue
      const uA = uAtCell(c0)
      const uB = uAtCell(Math.min(piece.c1, c0 + perfW / frameW))
      const alpha = stripAlpha(uA)
      if (alpha <= 0.02) continue
      const A = sectionAt(uA)
      const Bs = sectionAt(uB)
      if (Math.abs(dot3(A.N, [0, 0, -1])) < 0.18) continue
      // Inside the rail, measured in the film's own units.
      const outer = 1 - RAIL * 0.55
      const inner = 1 - RAIL * 1.5
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(240,240,245,0.72)'
      for (const side of [1, -1]) {
        ctx.beginPath()
        const q0 = A.across(side * outer)
        const q1 = Bs.across(side * outer)
        const q2 = Bs.across(side * inner)
        const q3 = A.across(side * inner)
        ctx.moveTo(q0[0], q0[1])
        ctx.lineTo(q1[0], q1[1])
        ctx.lineTo(q2[0], q2[1])
        ctx.lineTo(q3[0], q3[1])
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }
  }

  /**
   * The assembly cloud.
   *
   * What comes out of the back of the machine is not film yet — it is a stream
   * of fragments that pulls itself into film over the next fifth of the run.
   *
   * The fragments are not sparkles. Each one carries the exact piece of picture
   * it is going to become: its source rectangle is derived from the same cell
   * lookup the strip uses, at its own position along the line. So the image
   * genuinely assembles out of its own material rather than fading up behind a
   * decorative particle layer.
   */
  /**
   * The change of state, at both thresholds.
   *
   * On the left, fragments of the frame that is about to exist burst out of the
   * ring and snap onto the film within a few dozen pixels. On the right the
   * same thing runs backwards: the emulsion comes apart as it reaches the ring
   * and is gone. Both are confined to `TRANSITION_PX`, so what you read is
   * "it passed through and changed", not "there is a cloud here".
   *
   * The fragments are not sparkles. Each carries the exact piece of picture it
   * is going to become or has just been, sampled through the same cell lookup
   * the strip uses, at its own position on the line.
   */
  /**
   * The change of state, at both thresholds.
   *
   * Square chips of picture read as broken tiles — compression damage, not a
   * transformation. What the film is actually made of is SLIVERS, so that is
   * what comes through the ring: full-width slices of the strip, displaced
   * along their own direction of travel and shuffling into register over the
   * last few dozen pixels. On the right the same thing runs backwards and the
   * emulsion comes apart into the slices it was assembled from.
   *
   * Confined to `TRANSITION_PX` at each end, because the owner's constraint is
   * the right one: the change of state happens AT the threshold, not across a
   * fifth of the canvas.
   */
  const SHARDS = 16

  function drawTransition(t: number, atEnd: boolean) {
    if (!framesReady) return
    const total = cells.length
    // The thresholds run on the table's clock too: shards that keep swirling
    // while the belt is stopped would say the two ends are separate machines.
    const kk = filmClock(t)
    const scroll = atEnd ? offAtCell(cellAtU(NODE_U), kk) : kk.upstream
    // Start at the ring's downstream RIM, not its centre. The ring is a solid
    // ellipse about fifty pixels across drawn after this, so a band centred on
    // the plane spent half its length behind the very object it is meant to be
    // emerging from.
    const uCentre = atEnd ? NODE_U : L.mouthU
    const uRing = uOffsetPixels(uCentre, (atEnd ? -1 : 1) * ringRimPx(uCentre))
    const uFar = uOffsetPixels(uRing, atEnd ? -TRANSITION_PX : TRANSITION_PX)
    const totalPix = pixTable[CELL_SAMPLES]
    const sliverPx = 9
    const PIC = 1 - 2 * RAIL

    for (let k = 0; k < SHARDS; k++) {
      const h1 = hash(k * 1.7 + (atEnd ? 611 : 0))
      const h2 = hash(k * 3.1 + (atEnd ? 97 : 13))
      // 0 at the ring, 1 where the film is whole.
      const prog = ((t * (atEnd ? 0.9 : 0.8) + h1) % 1)
      // At the exit the shard starts upstream, still attached, and travels
      // INTO the threshold; at the intake it starts at the rim and travels
      // out. Both run with the film, never against it.
      const u0 = atEnd ? uFar + (uRing - uFar) * prog : uRing + (uFar - uRing) * prog
      const u1 = uOffsetPixels(u0, sliverPx)
      if (u1 <= u0 && !atEnd) continue

      const A = edgesAt(u0)
      const B = edgesAt(u1)
      const Ap = acrossAt(u0, PIC)
      const Am = acrossAt(u0, -PIC)
      const Bp = acrossAt(u1, PIC)
      const Bm = acrossAt(u1, -PIC)

      // Displaced along its own direction of travel, settling to nothing.
      const loose = Math.pow(atEnd ? prog : 1 - prog, 1.9)
      // Never past the boundary the transition is allowed to occupy.
      const push = (atEnd ? -1 : 1) * h2 * TRANSITION_PX * 0.85 * loose
      const tx = B.p[0] - A.p[0]
      const ty = B.p[1] - A.p[1]
      const tl = Math.hypot(tx, ty) || 1
      const dx = (tx / tl) * push
      const dy = (ty / tl) * push
      const off = (q: [number, number]): [number, number] => [q[0] + dx, q[1] + dy]

      const cf = cellAtU(u0) - scroll
      const ci = Math.floor(cf)
      const shardAcrossPx = Math.hypot(Ap[0] - Am[0], Ap[1] - Am[1]) * dpr
      const img = mipFor(cells[((ci % total) + total) % total], shardAcrossPx * FRAME_ASPECT)
      if (!img) continue
      const within = (((cf - ci) % 1) + 1) % 1
      const sw = Math.max(1, img.width * (cellAtU(u1) - cellAtU(u0)))
      const sx = Math.min(img.width - sw, Math.max(0, within * img.width))
      const H0 = img.height

      ctx.save()
      const life = atEnd ? 1 - prog : prog
      ctx.globalAlpha = Math.min(1, life / 0.12) * Math.pow(1 - life, 1.5) * (atEnd ? 1 : 0.55 + 0.75 * intakePulse(t))
      const sub: [number, number, number, number] = [sx, 0, sw, H0]
      texTriangle(img, [sx, H0], [sx + sw, H0], [sx, 0], off(Ap), off(Bp), off(Am), sub)
      texTriangle(img, [sx + sw, H0], [sx + sw, 0], [sx, 0], off(Bp), off(Bm), off(Am), sub)
      // Its own scrap of rail, so a shard is a piece of film and not a photo.
      fillQuad(off(A.p), off(B.p), off(Bp), off(Ap), '#131316')
      fillQuad(off(Am), off(Bm), off(B.m), off(A.m), '#131316')
      ctx.restore()
    }
    void totalPix
  }

  // ---- the machine: a hopper and a reel --------------------------------------
  /**
   * A hopper at one end and a reel at the other.
   *
   * Two identical rings were the wrong answer for a reason the ink map makes
   * plain: they were the two densest objects on the canvas, and they said the
   * same thing twice. A machine has a side you put things IN and a side work
   * comes OFF, and they do not look alike.
   *
   * So: raw footage falls into a hopper, and finished programme winds onto a
   * reel. Both are drawn in the same projection as the film, lit by the same
   * key, and both are shapes anybody recognises without a caption — which is
   * the whole test. Coral stays on the working edges only, because that is
   * where the product is happening.
   */
  // Sized against the film's own half-height, so the machine stays in
  // proportion to the material at every viewport.
  // Sized against the film's own half-height, so the machine stays in
  // proportion to the material at every viewport.
  const HOPPER_H = 1.05
  const HOPPER_TOP = 1.5
  const HOPPER_NECK_H = 0.72
  const REEL_R = 2.55

  /**
   * The intake: a funnel on a housing, and a fusion inside it.
   *
   * Raw material is poured in the top and vanishes. Inside the housing
   * something violent happens to it — you never see the whole of it, only what
   * shows through the exit — and a perfectly formed strip of film extrudes out
   * of the slot, already finished.
   *
   * The energy is made of SHAPES, because the house rules forbid glow: hard
   * filaments, a hot core band, hard-edged flicker. Nothing is blurred and
   * nothing is radial. What reads as a field is that it is bright, contained,
   * and never still.
   */
  function intake() {
    const u = uOffsetPixels(L.mouthU, L.halfH * 0.3 + TRANSITION_PX * 0.5)
    const C = worldC(u)
    const exitY = C[1]
    const exitZ = C[2]
    const bodyW = L.unit * 1.6
    const bodyH = L.unit * 1.05
    const x1 = C[0] + L.unit * 0.04
    const x0 = x1 - bodyW
    const bodyTop = exitY - bodyH * 0.5
    return {
      cx: (x0 + x1) / 2,
      x0,
      x1,
      z: exitZ,
      bodyTop,
      bodyBot: bodyTop + bodyH,
      exitY,
      slotH: pathH(u) * 1.22,
      funnelTop: bodyTop - L.unit * 1.05,
      topHalf: L.unit * 1.42,
      neckHalf: L.unit * 0.44,
    }
  }


  /** Project a point on the intake's own plane, which is at the film's depth. */
  const P0 = (x: number, y: number): P2 => proj3([x, y, intake().z])

  /** The fusion, seen through the exit. Filaments, not a bloom. */
  function drawFusion(t: number, k: number) {
    const n = intake()
    const e0 = P0(n.x1, n.exitY)
    const x = e0[0]
    const y = e0[1]
    const h = Math.abs(P0(n.x1, n.exitY + n.slotH)[1] - y)
    const w = L.unit * 0.3
    ctx.save()
    ctx.beginPath()
    ctx.rect(x - w, y - h, w + L.unit * 0.05, h * 2)
    ctx.clip()

    // Hot core: a hard band, brightest at the plane the film leaves by.
    ctx.fillStyle = '#08080b'
    ctx.fillRect(x - w, y - h, w, h * 2)
    const g = ctx.createLinearGradient(x - w, 0, x, 0)
    g.addColorStop(0, 'rgba(242,143,132,0)')
    g.addColorStop(0.55, 'rgba(242,143,132,0.22)')
    g.addColorStop(0.9, 'rgba(255,208,196,0.75)')
    g.addColorStop(1, 'rgba(255,250,247,1)')
    ctx.fillStyle = g
    ctx.fillRect(x - w, y - h, w, h * 2)

    // Filaments: thin, hard, and never in the same place twice.
    ctx.lineWidth = Math.max(0.9, L.unit * 0.012)
    for (let i = 0; i < 22; i++) {
      const ph = t * (2.1 + i * 0.37) + i * 1.7 + k
      const a2 = 0.35 + 0.65 * Math.abs(Math.sin(ph))
      ctx.strokeStyle = `rgba(255,${Math.round(178 + 70 * a2)},${Math.round(160 + 82 * a2)},${(0.16 + 0.5 * a2).toFixed(3)})`
      ctx.beginPath()
      const y0 = y + (hash(i * 3.1 + Math.floor(ph)) - 0.5) * h * 2.2
      ctx.moveTo(x - w, y0)
      const steps = 6
      for (let sIdx = 1; sIdx <= steps; sIdx++) {
        const f = sIdx / steps
        // Converging: everything is being squeezed toward the plane the film
        // leaves by, which is what makes it read as a field rather than noise.
        const jitter = (hash(i * 7.7 + sIdx + Math.floor(ph * 2)) - 0.5) * h * 0.5 * (1 - f) * (1 - f)
        ctx.lineTo(x - w + w * f, y0 * (1 - f) + y * f + jitter)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  /** Housing, funnel and fusion — everything the film comes out from behind. */
  function drawIntakeBack(_t: number) {
    // Nothing behind the film: the funnel's interior has to be painted AFTER
    // the falling file, or the file is never swallowed by anything.
  }

  function drawIntakeFront(t: number) {
    const n = intake()
    const pulse = intakePulse(t)
    const K = L.unit * 0.24
    ctx.save()

    // Interior first, opaque and deeper than the page — this is the thing a
    // file disappears into.
    fillQuad(
      P0(n.cx - n.topHalf, n.funnelTop),
      P0(n.cx + n.topHalf, n.funnelTop),
      P0(n.cx + n.neckHalf, n.bodyTop),
      P0(n.cx - n.neckHalf, n.bodyTop),
      '#050508',
    )

    // Funnel walls.
    fillQuad(
      P0(n.cx - n.topHalf - K, n.funnelTop - K * 0.4),
      P0(n.cx - n.topHalf, n.funnelTop),
      P0(n.cx - n.neckHalf, n.bodyTop),
      P0(n.cx - n.neckHalf - K, n.bodyTop),
      '#3f3f4a',
    )
    fillQuad(
      P0(n.cx + n.topHalf, n.funnelTop),
      P0(n.cx + n.topHalf + K, n.funnelTop - K * 0.4),
      P0(n.cx + n.neckHalf + K, n.bodyTop),
      P0(n.cx + n.neckHalf, n.bodyTop),
      '#1b1b22',
    )
    // Rolled lip.
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'
    ctx.lineWidth = Math.max(1.6, L.unit * 0.04)
    ctx.beginPath()
    ctx.moveTo(...P0(n.cx - n.topHalf - K, n.funnelTop - K * 0.4))
    ctx.lineTo(...P0(n.cx + n.topHalf + K, n.funnelTop - K * 0.4))
    ctx.stroke()

    // Housing: same family as the projector's body.
    const g = ctx.createLinearGradient(0, n.bodyTop, 0, n.bodyBot)
    g.addColorStop(0, '#34343f')
    g.addColorStop(0.42, '#232329')
    g.addColorStop(1, '#141419')
    ctx.fillStyle = g
    const hTL = P0(n.x0, n.bodyTop)
    const hBR = P0(n.x1, n.bodyBot)
    roundRect(hTL[0], hTL[1], hBR[0] - hTL[0], hBR[1] - hTL[1], L.unit * 0.1)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(...P0(n.x0 + L.unit * 0.14, n.bodyTop))
    ctx.lineTo(...P0(n.x1 - L.unit * 0.14, n.bodyTop))
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.3
    ctx.stroke()

    // Louvres, through which the fusion shows as flicker.
    for (let i = 0; i < 4; i++) {
      const ly = n.bodyTop + (n.bodyBot - n.bodyTop) * (0.26 + i * 0.13)
      const flick = 0.1 + 0.5 * Math.abs(Math.sin(t * (3.1 + i) + i * 2.3))
      ctx.fillStyle = `rgba(255,${Math.round(180 + 50 * flick)},${Math.round(168 + 60 * flick)},${(0.1 + 0.5 * flick * (0.4 + pulse)).toFixed(3)})`
      const lp0 = P0(n.x0 + L.unit * 0.16, ly)
      ctx.fillRect(lp0[0], lp0[1], L.unit * 0.42, Math.max(1.5, L.unit * 0.03))
    }
    ctx.restore()

    // The exit: the film extrudes from here, so this is where the field shows.
    drawFusion(t, 0)
    ctx.save()
    ctx.strokeStyle = `rgba(255,${Math.round(206 + 40 * pulse)},${Math.round(196 + 45 * pulse)},${(0.8 + 0.2 * pulse).toFixed(3)})`
    ctx.lineWidth = Math.max(1.6, L.unit * 0.035) + pulse * 2
    ctx.beginPath()
    ctx.moveTo(...P0(n.x1, n.exitY - n.slotH))
    ctx.lineTo(...P0(n.x1, n.exitY + n.slotH))
    ctx.stroke()
    ctx.restore()
  }

  /**
   * THE TABLE.
   *
   * The owner calls the middle third "the operating table, the cutting room
   * floor". Those two phrases pull in opposite directions and only one of them
   * can be the object: an operating table is precision, light and containment;
   * a cutting room floor is offcuts underfoot and hours of somebody's labour.
   * The floor is the OLD way of doing this, and drawing it would be drawing the
   * competitor's story. So this is an operating table, and the only thing kept
   * from the floor is that the removed material is still somewhere you can see
   * it — set down, accounted for, not swept away.
   *
   * AND IT IS RAKED, WHICH IS THE WHOLE REASON IT CAN BE SEEN AT ALL.
   *
   * The previous version reasoned, correctly, that a horizontal surface at this
   * camera height projects to about a dozen pixels of depth — "which is not a
   * table" — and then drew furniture in elevation instead: a top, two legs and
   * a stretcher, floating in a void. That reads as a saw-horse the film happens
   * to fly over.
   *
   * The premise was the error, not the conclusion. An editing bench IS raked
   * toward the operator; so is a light table, so is a drawing board, and so is
   * an operating table once you tilt it. Rake the plane 28 degrees off
   * horizontal and it projects to a third of the canvas height instead of a
   * dozen pixels, and — this is the part that matters — raking about the x axis
   * changes nothing the film does, because the film's line runs along x. It
   * stays level, untwisted and at z = 0. The surface gains area; the datum does
   * not move.
   *
   * Everything here is stated in screen space on purpose. A raked plane's
   * projection has a closed form — a point `s` down the slope sits at
   * `baseY + s·cos(rake)·d(s)` with `d(s) = focal / (focal - s·sin(rake))` —
   * so the top face is an exact trapezoid and there is nothing to sample.
   */
  /** Rake measured from the picture plane. 1.08 rad ≈ 62°, i.e. 28° off flat. */
  const TABLE_RAKE = 1.08
  /**
   * Extent of the working surface in front of and behind the film, in H.
   *
   * Deliberately lopsided, and measured rather than chosen. Behind the film
   * there is only enough surface to read as a far lip — the first version put
   * 68px of slab up there and the table appeared to lean away from the camera,
   * with a large grey plane standing behind the descending film in the act
   * before this one. In front there is a lot, because that is where the work
   * happens: it is the room the blade swings in and where the removed film is
   * set down.
   */
  // Deep enough that a piece of removed film can lie flat on it BELOW the strip
  // and still be clear of the front edge. That is a real constraint with a
  // narrow answer: the deck has to hold the film's own width plus clearance at
  // both ends, and at 0.4H it did not — the offcut either overlapped the strip
  // it was cut from or hung off the front of the table.
  const TABLE_FRONT = 0.5
  const TABLE_BACK = 0.095
  /** Thickness of the slab at its front edge, in H. */
  const TABLE_LIP = 0.034

  /**
   * The table's screen geometry. Everything in Act II hangs off this, so it is
   * computed in one place and read from everywhere else.
   *
   * `x0`/`x1` are the thirds, and they are also exactly where the film's level
   * run begins and ends — see `L.feedEndU` / `L.tableEndU`. At the film's own
   * depth the table and the film start and stop together, which is the point:
   * the film is level BECAUSE it is on the table.
   */
  function table() {
    const cr = Math.cos(TABLE_RAKE)
    const sr = Math.sin(TABLE_RAKE)
    const sFront = H * TABLE_FRONT
    const sBack = -H * TABLE_BACK
    const dAt = (s: number) => L.focal / (L.focal - s * sr)
    const yAt = (s: number) => L.baseY + s * cr * dAt(s)
    const dF = dAt(sFront)
    const dB = dAt(sBack)
    const x0 = dir > 0 ? W / 3 : (2 * W) / 3
    const x1 = dir > 0 ? (2 * W) / 3 : W / 3
    // A world x that projects to `x` at the film's depth projects to
    // `vpX + (x - vpX)·d` at any other depth. The trapezoid's taper is
    // therefore not a style choice, it is the same perspective the ribbon uses.
    const spread = (x: number, d: number) => L.vpX + (x - L.vpX) * d
    return {
      x0,
      x1,
      /** The film's line: the surface at s = 0, where depth is exactly 1. */
      lineY: L.baseY,
      frontY: yAt(sFront),
      backY: yAt(sBack),
      frontX0: spread(x0, dF),
      frontX1: spread(x1, dF),
      backX0: spread(x0, dB),
      backX1: spread(x1, dB),
      lip: H * TABLE_LIP,
      /** Screen y for a point `k` of the way from the film's line to the front
       *  edge. Used by anything that has to lie ON the surface. */
      yDown: (k: number) => yAt(sFront * k),
      xDown: (x: number, k: number) => spread(x, dAt(sFront * k)),
    }
  }

  /**
   * Act II's gradients, built once per resize.
   *
   * The table, its lamp, the film's contact shadow and the two hold-downs are
   * all large flat fills with a ramp, and every one of them was allocating a
   * fresh CanvasGradient on every animation frame — eight allocations a frame
   * for objects whose geometry only changes when the viewport does. Profiled
   * with the layer switches, the table and the shoes together were 5.6ms of a
   * 58.5ms software-rendered frame and this is most of it.
   *
   * They are rebuilt from `resize()`, which is the only thing that can move
   * them, and nulled first so a stale one can never be drawn at a new size.
   */
  type ActIIGrads = {
    surface: CanvasGradient
    lamp: CanvasGradient
    contact: CanvasGradient
    shoe: CanvasGradient
    shoeShadow: CanvasGradient
    loose: CanvasGradient
  }
  let GRAD: ActIIGrads | null = null

  function buildGradients() {
    const T = table()
    const surface = ctx.createLinearGradient(0, T.backY, 0, T.frontY)
    surface.addColorStop(0, '#1e1e25')
    surface.addColorStop(0.42, '#292931')
    surface.addColorStop(1, '#1c1c23')

    // Peak on the DECK, not behind the film. A lamp brightest at the back lit
    // the table exactly where the gap is, so the hole read as a lit panel; and
    // the deck in front is where the work — the blade, the fallen film —
    // actually happens, which is where a person would point a lamp.
    const lamp = ctx.createLinearGradient(0, T.backY, 0, T.frontY)
    lamp.addColorStop(0, 'rgba(255,250,246,0.028)')
    lamp.addColorStop(0.42, 'rgba(255,250,246,0.075)')
    lamp.addColorStop(1, 'rgba(255,250,246,0.02)')

    const cTop = L.baseY + L.halfH * 0.86
    const contact = ctx.createLinearGradient(0, cTop, 0, cTop + L.halfH * 1.5)
    contact.addColorStop(0, 'rgba(0,0,0,0.72)')
    contact.addColorStop(0.35, 'rgba(0,0,0,0.34)')
    contact.addColorStop(1, 'rgba(0,0,0,0)')

    const sTop = L.baseY - L.halfH * 1.28
    const sBot = L.baseY + L.halfH * 1.12
    const shoe = ctx.createLinearGradient(0, sTop, 0, sBot)
    shoe.addColorStop(0, '#3a3a44')
    shoe.addColorStop(0.4, '#23232b')
    shoe.addColorStop(1, '#141419')
    const shoeShadow = ctx.createLinearGradient(0, sBot, 0, sBot + L.halfH * 1.1)
    shoeShadow.addColorStop(0, 'rgba(0,0,0,0.66)')
    shoeShadow.addColorStop(1, 'rgba(0,0,0,0)')

    const loose = ctx.createLinearGradient(0, L.baseY + L.halfH * 0.8, 0, L.baseY + L.halfH * 2.1)
    loose.addColorStop(0, 'rgba(0,0,0,0.6)')
    loose.addColorStop(1, 'rgba(0,0,0,0)')

    GRAD = { surface, lamp, contact, shoe, shoeShadow, loose }
  }

  /**
   * The table, drawn.
   *
   * Value discipline, because this is the largest block of ink in the picture
   * and it must not become the loudest. The surface sits above the page value —
   * the house rule is that a fill darker than #0d0d0d reads as a hole — but
   * well under the emulsion, which is the thing being sold. The only bright
   * marks are edges: the far lip and the near lip each take a hairline, which
   * is the same device the film's own cut edge uses, and it is what keeps a
   * near-black slab from dissolving into a near-black page.
   *
   * The lamp is shading and nothing else. No radial gradient, no bloom, no
   * coloured light — a hard-edged quadrilateral of slightly raised value where
   * the work is happening, which is what a shaded pool of lamplight on a matte
   * surface actually looks like when you are not allowed to blur anything.
   */
  function drawTable(t: number) {
    const T = table()
    ctx.save()

    // Legs first, behind the slab. They leave the frame rather than stopping in
    // mid-air: a leg that ends in the void is a saw-horse, a leg that runs off
    // the bottom edge is a table standing in a room.
    ctx.fillStyle = '#121217'
    for (const k of [0.14, 0.86]) {
      const xTop = T.frontX0 + (T.frontX1 - T.frontX0) * k
      const wTop = H * 0.036
      const lean = (k < 0.5 ? -1 : 1) * H * 0.05
      ctx.beginPath()
      ctx.moveTo(xTop - wTop, T.frontY)
      ctx.lineTo(xTop + wTop, T.frontY)
      ctx.lineTo(xTop + wTop * 0.8 + lean, H + 4)
      ctx.lineTo(xTop - wTop * 0.8 + lean, H + 4)
      ctx.closePath()
      ctx.fill()
    }

    // The working surface. A single flat value with one long ramp across it —
    // the surface is matte and evenly lit except where the lamp is.
    if (!GRAD) buildGradients()
    ctx.beginPath()
    ctx.moveTo(T.backX0, T.backY)
    ctx.lineTo(T.backX1, T.backY)
    ctx.lineTo(T.frontX1, T.frontY)
    ctx.lineTo(T.frontX0, T.frontY)
    ctx.closePath()
    ctx.fillStyle = GRAD!.surface
    ctx.fill()

    // THE LAMP.
    //
    // A cutting room has one light and it is over the bench. The house rules
    // forbid glow, bloom and radial gradients, which sounds like it forbids a
    // lamp — it does not. What a lamp actually does to a matte surface is raise
    // its value inside a hard-edged footprint, and a cone of light meeting a
    // raked plane makes a trapezoid that splays toward the viewer. So the lamp
    // is that trapezoid, flat-filled, one value up from the surface. It is
    // shading, drawn as geometry, and it puts the brightest part of the table
    // exactly where the blade comes down — which is the cheapest way there is
    // to tell an eye where to look.
    const cx = T.x0 + (T.x1 - T.x0) * 0.5
    // Wide and only slightly splayed. The first version tapered hard toward the
    // back and read as a projector cone pointing at the film — a lamp's
    // footprint on a raked plane is nearly a rectangle at this angle, and the
    // splay only has to be enough to say the light comes from above and behind.
    const lampBackHalf = (T.x1 - T.x0) * 0.26
    const lampFrontHalf = (T.x1 - T.x0) * 0.4
    ctx.beginPath()
    ctx.moveTo(cx - lampBackHalf, T.backY)
    ctx.lineTo(cx + lampBackHalf, T.backY)
    ctx.lineTo(cx + lampFrontHalf, T.frontY)
    ctx.lineTo(cx - lampFrontHalf, T.frontY)
    ctx.closePath()
    ctx.fillStyle = GRAD!.lamp
    ctx.fill()

    // The far lip: where the surface ends and the room begins.
    ctx.beginPath()
    ctx.moveTo(T.backX0, T.backY + 0.5)
    ctx.lineTo(T.backX1, T.backY + 0.5)
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // The slab's front face, and the edge that catches the key. This is the
    // "real edge" — the one line that tells you the surface has thickness and
    // that you are looking at an object rather than a shape.
    ctx.beginPath()
    ctx.moveTo(T.frontX0, T.frontY)
    ctx.lineTo(T.frontX1, T.frontY)
    ctx.lineTo(T.frontX1 + H * 0.004, T.frontY + T.lip)
    ctx.lineTo(T.frontX0 - H * 0.004, T.frontY + T.lip)
    ctx.closePath()
    ctx.fillStyle = '#0f0f14'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(T.frontX0, T.frontY + 0.6)
    ctx.lineTo(T.frontX1, T.frontY + 0.6)
    ctx.strokeStyle = 'rgba(255,246,242,0.4)'
    ctx.lineWidth = 1.4
    ctx.stroke()

    ctx.restore()
    drawFilmContact(t)
  }

  /**
   * THE CONTACT SHADOW, which is what makes the film LIE on the table.
   *
   * Everything else in this act was correct and the film still read as a
   * conveyor passing over a desk. The reason is that the two objects shared a
   * plane and nothing said so: film at z = 0, table surface through z = 0, and
   * between them a clean gap of page colour where a shadow belongs. Contact is
   * not a lighting effect here, it is the entire claim of the act — the film
   * is ON the operating table, which is why it is flat, which is why it can be
   * read, which is why it can be cut.
   *
   * The key is upper-left and slightly toward the viewer, so the shadow falls
   * down-slope and a little to the right, and it is dense at the stock and gone
   * within about two-thirds of the film's own width. Neutral black, no colour,
   * no blur: a linear ramp down the rake is exactly what a hard shadow looks
   * like on a matte surface photographed from near its own plane.
   *
   * Drawn from `drawTable`, so it is under the film and over the surface, which
   * is the only order in which a shadow is a shadow.
   */
  function drawFilmContact(t: number) {
    const T = table()
    const top = L.baseY + L.halfH * 0.86
    const drop = L.halfH * 1.5
    // Beyond the thirds the film lifts off the table, so the shadow has to stop
    // being a shadow there rather than run to the edge of the slab.
    const fade = (T.x1 - T.x0) * 0.05
    const x0 = Math.min(T.x0, T.x1) - fade
    const x1 = Math.max(T.x0, T.x1) + fade

    // A SHADOW IS EVIDENCE OF FILM, SO IT STOPS WHERE THE FILM DOES.
    //
    // Painted straight across the table, the shadow made the open gap read as a
    // bright PANEL with a dark band beneath it rather than as a hole — measured
    // at x = 740 mid-cut, the table showed 48/48/54 above the shadow line and
    // 18/18/21 below it, which is a hard horizontal edge exactly where nothing
    // should be casting anything. Skipping the hole is not a detail: the
    // missing shadow is the second, quieter signal that the footage is gone,
    // and it arrives a beat before the eye works out why.
    const k = filmClock(t)
    const spans: [number, number][] = []
    if (k.hole) {
      const hx0 = pathX(uAtCell(k.hole[0]))
      const hx1 = pathX(uAtCell(k.hole[1]))
      spans.push([x0, Math.min(hx0, hx1)], [Math.max(hx0, hx1), x1])
    } else spans.push([x0, x1])

    ctx.save()
    if (!GRAD) buildGradients()
    ctx.fillStyle = GRAD!.contact
    for (const [a, b] of spans) {
      if (b - a < 0.5) continue
      ctx.beginPath()
      ctx.moveTo(a, top)
      ctx.lineTo(b, top)
      ctx.lineTo(b - (b - a) * 0.008, top + drop)
      ctx.lineTo(a + (b - a) * 0.008, top + drop)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  /**
   * THE HOLD-DOWNS, AND WHY THE FILM IS FLAT.
   *
   * The film is level, untwisted and at one depth for exactly the middle third
   * and then it is not, and until now nothing in the picture said why. A
   * boundary that exists because three agents agreed on a number is a boundary
   * a viewer cannot see; a boundary that exists because there is a shoe holding
   * the stock down is one they never have to think about.
   *
   * So there is a pressure shoe astride x = W/3 and another astride x = 2W/3 —
   * the two act boundaries, made into objects. They are the reason the film
   * flattens where it flattens and lifts where it lifts, they physically mark
   * the thirds the owner asked for, and they give the acts either side of this
   * one something to hand over to rather than a coordinate.
   *
   * They are also the quietest objects on the table on purpose: dark metal, one
   * lit top edge, no accent. A hold-down that competes with the blade is a
   * hold-down drawn wrong.
   */
  function drawHoldDowns() {
    if (!GRAD) buildGradients()
    const T = table()
    const halfW = W * 0.0125
    const topY = L.baseY - L.halfH * 1.28
    const botY = L.baseY + L.halfH * 1.12
    ctx.save()
    for (const cx of [T.x0, T.x1]) {
      // Its shadow on the deck first, so it is standing on the table and not
      // floating over the film the way the film once floated over the table.
      ctx.fillStyle = GRAD!.shoeShadow
      ctx.fillRect(cx - halfW * 1.15, botY, halfW * 2.3, L.halfH * 1.1)

      // The block. Chamfered on the leading and trailing faces, because a shoe
      // with a square edge would scratch the stock it is holding.
      const ch = halfW * 0.42
      ctx.beginPath()
      ctx.moveTo(cx - halfW + ch, topY)
      ctx.lineTo(cx + halfW - ch, topY)
      ctx.lineTo(cx + halfW, topY + (botY - topY) * 0.38)
      ctx.lineTo(cx + halfW, botY)
      ctx.lineTo(cx - halfW, botY)
      ctx.lineTo(cx - halfW, topY + (botY - topY) * 0.38)
      ctx.closePath()
      ctx.fillStyle = GRAD!.shoe
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - halfW + ch, topY + 0.6)
      ctx.lineTo(cx + halfW - ch, topY + 0.6)
      ctx.strokeStyle = 'rgba(255,246,242,0.34)'
      ctx.lineWidth = 1.3
      ctx.stroke()
    }
    ctx.restore()
  }

  /**
   * THE PRESS.
   *
   * A fixed station over the table, and the film runs under it. That is the
   * whole mechanism and it is the reason the act can be read without a caption:
   * the machine's two blades are a FIXED distance apart, so the span between
   * them is permanently, visibly, the amount of footage this thing removes. You
   * can see how much is going before anything happens.
   *
   * Not scissors. Scissors were tried here and rightly rejected — a scissors
   * icon is a diagram, it has no place in a photographed scene, and it implies
   * a hand. This is a punch: a crosshead on two rams, with a chisel-edged blade
   * hanging at each end. The two blades' inner faces are vertical and they are
   * exactly on the cut lines, so what is between them is exactly what leaves.
   * Every part of the tool states the edit.
   *
   * It falls, and falling is the only vertical motion in the entire piece.
   * Everything else — film, files, light, the reel's rim — travels horizontally
   * or turns. An orthogonal move against a wholly horizontal field is the
   * loudest compositional device available and it costs nothing to draw.
   *
   * VALUE. The two blades are the brightest hard-edged objects on the table by
   * a wide margin: polished steel at about #6d6d78 with a specular hairline on
   * the inner face, against a surface at #23232b. That is a four-to-one local
   * jump landing on the canvas's midline at the instant the belt stops. It is
   * shading on metal, not a glow, and it is the fifth cue stacked on one
   * moment: the stop, the vertical, the brightness, the marks, and then the
   * slam.
   */
  /**
   * Rest height of the chisel tips above the film's top edge, in H.
   *
   * Measured against a constraint rather than picked: nothing belonging to the
   * press may be in front of the film when the blades are through it. The first
   * version put a crosshead across the hole the blades had just made — the tool
   * occluding its own result, which is the most expensive mistake available
   * here — and the second gave the press two tall posts and a beam, which
   * enclosed a large empty rectangle in the void above the table and read as a
   * picture frame rather than as machinery.
   *
   * What survived both is the smallest thing that still says press: two blades,
   * a fixed distance apart, in dark holders that run off the top of the frame.
   * The span between them is the edit, permanently and visibly, and there is no
   * second shape to misread.
   */
  const BLADE_LIFT = 0.2
  /** How far past the film's bottom edge the tips travel, in H. */
  const BLADE_THROUGH = 0.022
  /** Length of the bright steel, in H. Short: it is the only object on the
   *  table above about 40% luminance and it should stay small enough to be a
   *  mark rather than a mass. */
  const BLADE_LEN = 0.2

  function press() {
    const c1 = cutC1()
    const x1 = pathX(uAtCell(c1))
    const x0 = pathX(uAtCell(c1 - CUT_REMOVED))
    const lo = Math.min(x0, x1)
    const hi = Math.max(x0, x1)
    const filmTop = L.baseY - L.halfH
    const filmBot = L.baseY + L.halfH
    const rest = filmTop - H * BLADE_LIFT
    const through = filmBot + H * BLADE_THROUGH
    return {
      lo,
      hi,
      rest,
      fall: through - rest,
      len: H * BLADE_LEN,
      // Narrow. At 24px the blade read as a grey PANEL and punched two holes
      // in the strip it was standing on; a knife's whole silhouette is that it
      // is thinner than anything it cuts.
      w: W * 0.0092,
      tipW: W * 0.0018,
      // The tang is much narrower than the blade. A holder as wide as the steel
      // reads as a structural column and becomes the dominant vertical in the
      // third; a thin one reads as what carries a knife.
      tangW: W * 0.0052,
    }
  }

  /**
   * Where the press is, 0 at rest and 1 fully through the stock.
   *
   * It accelerates on the way down — a blade under spring load is not eased,
   * it is released, and the squared curve is what makes the last third of the
   * travel read as an impact rather than an arrival. Coming back up it is
   * eased-out instead, because a press that snaps back as hard as it fell reads
   * as a bounce, and a bounce is comic.
   */
  function pressDrop(k: FilmClock) {
    const s = k.since
    if (s < BEAT.fallFrom) return 0
    if (s < BEAT.fallTo) {
      const x = (s - BEAT.fallFrom) / (BEAT.fallTo - BEAT.fallFrom)
      return Math.pow(x, 1.9)
    }
    if (s < BEAT.dwellTo) return 1
    if (s < BEAT.riseTo) {
      const x = (s - BEAT.dwellTo) / (BEAT.riseTo - BEAT.dwellTo)
      return Math.pow(1 - x, 2.4)
    }
    return 0
  }

  function drawPress(t: number) {
    const k = filmClock(t)
    const P = press()
    const y = P.rest + pressDrop(k) * P.fall
    const topOfSteel = y - P.len

    ctx.save()
    for (const side of [-1, 1] as const) {
      // The face that does the cutting is VERTICAL and sits exactly on the cut
      // line; the bevel is ground on the outside, away from the footage being
      // removed. So what lies between the two vertical faces is precisely what
      // leaves, and the tool's geometry states the edit rather than illustrating
      // it.
      const face = side < 0 ? P.lo : P.hi
      const back = face - side * P.w
      const bevelFrom = y - P.len * 0.34

      // Tang: dark, thin, running off the top of the frame. A machine whose
      // supports stop halfway up the canvas is a prop.
      const tangX = face - side * (P.w / 2 + P.tangW / 2)
      ctx.fillStyle = '#1d1d23'
      ctx.fillRect(Math.min(tangX, tangX + P.tangW), -4, P.tangW, topOfSteel + 4)
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(Math.min(tangX, tangX + P.tangW), -4, 1, topOfSteel + 4)

      // Steel. Two flat values and one specular edge: a polished flat has no
      // ramp across it, and the left blade takes the key while the right one is
      // turned away from it.
      ctx.beginPath()
      ctx.moveTo(face, topOfSteel)
      ctx.lineTo(face, y)
      ctx.lineTo(face - side * P.tipW, y)
      ctx.lineTo(back, bevelFrom)
      ctx.lineTo(back, topOfSteel)
      ctx.closePath()
      ctx.fillStyle = side < 0 ? '#8d8d99' : '#63636e'
      ctx.fill()
      // The ground bevel catches more light than the flat behind it.
      ctx.beginPath()
      ctx.moveTo(face, bevelFrom)
      ctx.lineTo(face, y)
      ctx.lineTo(face - side * P.tipW, y)
      ctx.lineTo(back, bevelFrom)
      ctx.closePath()
      ctx.fillStyle = side < 0 ? '#c2c2cb' : '#8e8e99'
      ctx.fill()
      // The cutting face itself. The only hairline on the table brighter than
      // the film's own edge highlight, and a vertical one in a horizontal
      // picture.
      ctx.beginPath()
      ctx.moveTo(face - side * 0.9, topOfSteel)
      ctx.lineTo(face - side * 0.9, y)
      ctx.strokeStyle = 'rgba(255,250,246,0.95)'
      ctx.lineWidth = 1.8
      ctx.stroke()
    }
    ctx.restore()
  }

  /**
   * THE FORGE.
   *
   * The owner's sequence is cut, fall, advance, and then "the seam would be
   * forged" — and that last beat is the one that makes this an assembly line
   * rather than a pair of scissors. A splice is not two ends touching, it is
   * two ends welded, and until the joint is pressed the film is not whole.
   *
   * WHY IT IS THE SAME STATION, not one downstream. Measured: the table is 480
   * pixels, which is 7.6 frames of film. The cut takes 3 of them and the two
   * hold-downs take most of a frame each, so a second station four frames
   * downstream — where a seam actually arrives — lands at x = 1088, well past
   * 2W/3 and inside the next act. There is no room for two stations at this
   * scale, and the craft agrees: a bench splicer cuts and welds in one block,
   * because the joint has to be held in exactly the register the cut defined.
   * So the press has three heads on one carriage. Two blades take the run out;
   * the forge between them comes down on the joint they left.
   *
   * It also keeps every beat on the canvas's vertical midline, which is the
   * whole compositional argument for the cut being there in the first place.
   *
   * NO GLOW, and the word "forge" is doing no work here beyond naming the
   * operation. What a pressed joint looks like is a joint that has stopped
   * being two edges: before the stroke there are two lit cut faces with a dark
   * hairline between them, after it there is one continuous fine line. The
   * change is in the GEOMETRY of the seam, not in its brightness, which is
   * the only kind of "heat" this palette permits.
   */
  function forgeHead() {
    const P = press()
    const c1 = cutC1()
    const x = pathX(uAtCell(c1))
    const filmTop = L.baseY - L.halfH
    const filmBot = L.baseY + L.halfH
    return {
      x,
      // Narrow. At 32px the head covered a frame and a half and hid the very
      // joint it was pressing — a tool obscuring its own result, the same
      // mistake the blades' first crosshead made. A press only has to be wider
      // than the seam.
      halfW: W * 0.0095,
      rest: filmTop - H * 0.2,
      through: filmBot + H * 0.008,
      len: H * 0.075,
      tangW: P.tangW,
    }
  }

  /** 0 at rest, 1 pressed onto the joint. */
  function forgeDrop(k: FilmClock) {
    if (k.forge < 0) return 0
    // Down fast, held, up slower. A press that dwells is a press that has done
    // something; the dwell is most of the stroke on purpose.
    if (k.forge < 0.26) return Math.pow(k.forge / 0.26, 1.7)
    if (k.forge < 0.66) return 1
    return Math.pow(1 - (k.forge - 0.66) / 0.34, 1.6)
  }

  function drawForge(t: number) {
    const k = filmClock(t)
    const d = forgeDrop(k)
    if (d <= 0.001) return
    const F = forgeHead()
    const y = F.rest + (F.through - F.rest) * d
    const top = y - F.len

    ctx.save()
    // Its ram, thinner than the blades' tangs: this head presses, it does not
    // cut, and the picture should not offer two objects of equal weight at one
    // station.
    ctx.fillStyle = '#1d1d23'
    ctx.fillRect(F.x - F.tangW / 2, -4, F.tangW, top + 4)
    ctx.fillStyle = 'rgba(255,255,255,0.09)'
    ctx.fillRect(F.x - F.tangW / 2, -4, 1, top + 4)

    // The head. Wider than it is deep and flat-bottomed — the opposite
    // silhouette to a blade, so the two tools cannot be confused even though
    // they share a carriage.
    // Dark body, one lit face. The blades are the bright objects at this
    // station and there must not be a second: what identifies the forge is its
    // silhouette — wide and flat-bottomed where a blade is narrow and pointed —
    // not its value.
    ctx.fillStyle = '#26262e'
    ctx.fillRect(F.x - F.halfW, top, F.halfW * 2, F.len)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(F.x - F.halfW, top, F.halfW * 2, 1.2)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(F.x - F.halfW, top, 1, F.len)
    // The pressing face, which is the part that touches the joint.
    ctx.fillStyle = 'rgba(228,224,221,0.9)'
    ctx.fillRect(F.x - F.halfW, y - 2, F.halfW * 2, 2)
    ctx.restore()
  }

  /**
   * THE MARK.
   *
   * The run is condemned before it arrives. Two grease-pencil strokes on the
   * stock, one at each end of the doomed footage, riding the film exactly the
   * way the perforations do — which is the whole point, because a mark that
   * drifts off the frames it condemns is the semantic error a reviewer caught
   * in this drawing once already, and it says the wrong take gets published.
   *
   * This is what coral is for. The accent means "BitterClip did this", and
   * deciding which frames go is the only thing in the middle third that
   * BitterClip actually does — the press is just a machine and the table is
   * just furniture. So the marks are the only coral in the act, they are small
   * and flat exactly as the site rules require, and they are the thing the eye
   * can follow in from the left and watch line up with the blades.
   *
   * They also give the stop a cause. Mark, align, stop, cut: four beats a
   * stranger can assemble without being told, because they have watched a
   * machine index something into position before.
   */
  function condemnedAnchor(k: FilmClock) {
    // The highest-numbered condemned frame, for this cycle. Derived rather than
    // chosen: at the hold, cell coordinate `c1` carries film coordinate
    // `c1 - CUT_KEEP - n·CUT_PERIOD`, and the run is the CUT_REMOVED frames
    // immediately upstream of it.
    return k.c1 - CUT_KEEP - k.n * CUT_PERIOD - 1
  }

  /** Is this film frame one of the ones that goes? */
  function isCondemned(f: number, k: FilmClock) {
    const m = (((condemnedAnchor(k) - f) % CUT_PERIOD) + CUT_PERIOD) % CUT_PERIOD
    return m < CUT_REMOVED
  }

  function drawMarks(t: number) {
    if (!framesReady) return
    const k = filmClock(t)
    const pieces = filmPieces(k)
    const frameW = 2 * L.halfH * FRAME_ASPECT
    const anchor = condemnedAnchor(k)
    const cMax = cellTable[CELL_SAMPLES]

    for (const p of pieces) {
      const fLo = Math.floor(p.c0 - p.off) - 1
      const fHi = Math.ceil(p.c1 - p.off) + 1
      for (let f = fLo; f <= fHi; f++) {
        // Only the two boundaries of a run are marked. Marking every condemned
        // frame turns the film into hatching, which is the diagram this act
        // spent four passes getting rid of.
        const rel = (((anchor - f) % CUT_PERIOD) + CUT_PERIOD) % CUT_PERIOD
        const boundary = rel === 0 ? 1 : rel === CUT_REMOVED - 1 ? -1 : 0
        if (!boundary) continue
        // Biased INSIDE the condemned run. A mark centred on the boundary
        // leaves half of itself on the frame that survives, which says the
        // wrong thing about which footage was condemned.
        const inset = (frameW * 0.033) / frameW
        const c = (boundary > 0 ? f + 1 - inset : f + inset) + p.off
        if (c < p.c0 || c > p.c1 || c <= 0 || c >= cMax) continue
        const u = uAtCell(c)
        const a = stripAlpha(u)
        if (a <= 0.03) continue
        // A pencil stroke has width. Half a hairline in a picture at this scale
        // reads as an artefact rather than as a mark somebody made.
        const wCell = (frameW * 0.055) / frameW
        const A = sectionAt(uAtCell(Math.max(0, c - wCell / 2)))
        const B = sectionAt(uAtCell(Math.min(cMax, c + wCell / 2)))
        ctx.save()
        ctx.globalAlpha = a
        // Across the emulsion only, and short of the rails — a china marker on
        // the picture area is what an assistant editor actually leaves.
        const PICR = 1 - 2 * RAIL
        fillQuad(A.across(PICR), B.across(PICR), B.across(-PICR), A.across(-PICR), ACCENT)
        ctx.restore()
      }
    }
  }

  /**
   * IT FALLS, AND THE TABLE CATCHES IT.
   *
   * The owner gave this act two names that pull opposite ways — "the operating
   * table" and "the cutting room floor" — and the removed film is where they
   * have to be reconciled, because it is the only object that belongs to both.
   * An operating table is containment: nothing leaves, everything is accounted
   * for. A cutting room floor is the opposite, and it is also the OLD way of
   * doing this work: scraps underfoot, an assistant on their knees, hours of
   * somebody's evening. Drawing a floor would be drawing the competitor.
   *
   * So the offcut falls — gravity, accelerating, the owner's own word made
   * literal — and the table catches it. It lands on the deck a few inches from
   * where it was cut, still recognisably the footage that was removed, still
   * carrying the two coral marks that condemned it. Nothing is swept away and
   * nothing is hidden. That is the honest picture of what this product does:
   * it does not lose your material, it sets it down.
   *
   * It is also what makes a still legible. The blade is only down for a
   * hundred and fifty milliseconds out of nearly five seconds; the offcuts are
   * there the whole time. Any frame you photograph has three pieces of removed
   * film lying on the table saying an edit happened here.
   *
   * DRAWN AS FILM, NOT AS A RECTANGLE. The piece is put through the ribbon's
   * own routine under a canvas transform, so it keeps its rails, its
   * perforations, its frame rules and its photographs. A grey rectangle would
   * say "some data was discarded"; this says "these three seconds, the ones you
   * can see, are the ones that went".
   */
  /**
   * How many landed offcuts stay on the deck.
   *
   * TWO, plus whichever is in the air. Measured on a full-width still with
   * three of them: the deck carried about nine frames of removed emulsion while
   * the table carried five of kept film, so the discarded material out-massed
   * the product — which inverts the sentence the picture is there to say. Two
   * is the fewest that still reads as a practice rather than an accident, and
   * the older one is shaded further down so the pair has a near and a far.
   */
  const BIN_SLOTS = 2

  /** The cell-to-film offset a condemned run carries, for cycle `m`. Fixed for
   *  all time once cut, which is why a landed offcut keeps showing the footage
   *  it was cut from rather than drifting with the line. */
  function offcutOff(m: number) {
    return CUT_KEEP + m * CUT_PERIOD
  }

  /**
   * Where the offcut from cycle `m` comes to rest on the deck.
   *
   * Keyed on the CYCLE, not on a slot index. Keyed on the slot, every piece
   * landed in exactly the same place at exactly the same angle — which at 60fps
   * is unmistakable: the new one drops onto the old one and covers it exactly,
   * so a pile of two reads as a single piece that flickers. Deterministic noise
   * per cycle gives each one its own place and lie, so what accumulates looks
   * like something a person put down twice rather than a sprite at a fixed
   * coordinate.
   */
  function binSlot(m: number) {
    const T = table()
    const P = press()
    // Well down the deck, and clear of the film's own bottom rail. At 0.66 the
    // nearer piece overlapped the strip it had been cut from by about eighteen
    // pixels, which reads as clutter rather than as material set aside. A short
    // drop reads as the film sagging; a long one reads as it leaving.
    // Bounded at both ends by geometry, not taste: below `0.60` the piece
    // overlaps the strip above it, above `0.78` it hangs off the front lip.
    const k = 0.66 + 0.1 * hash(m * 2.7 + 4.1)
    // Overlapping, not laid out in a row. Pieces side by side at full value
    // read as a SECOND film lane competing with the line above them; piled,
    // they read as what they are — material that has been finished with.
    const spread = (T.x1 - T.x0) * 0.16
    // Fanned downstream-left of the blade: behind where the machine is working
    // now, which is where a person would put something they had finished with.
    const cx = (P.lo + P.hi) / 2 - dir * spread * (0.15 + hash(m * 1.9))
    return {
      x: T.xDown(cx, k),
      y: T.yDown(k),
      ang: (hash(m * 5.1) - 0.5) * 0.4,
    }
  }

  /**
   * The fall, 0 at the line and 1 on the deck.
   *
   * Gravity on the way down and nothing on the way back, because there is no
   * way back. Squared, so it leaves slowly and arrives fast — the opposite of
   * everything else in this drawing, which is exactly why it reads as falling
   * rather than as being moved.
   */
  function offcutFall(k: FilmClock) {
    if (!k.severed) return -1
    return clamp01((k.since - BEAT.liftFrom) / (BEAT.liftTo - BEAT.liftFrom))
  }

  function drawOffcuts(t: number) {
    if (!framesReady) return
    const k = filmClock(t)
    const P = press()
    const c1 = k.c1
    const ox = (P.lo + P.hi) / 2
    const oy = L.baseY
    const piece = (m: number): Piece => ({ c0: c1 - CUT_REMOVED, c1, off: offcutOff(m) })

    // The pieces already on the deck. Oldest first, so a new one lands on top.
    for (let j = BIN_SLOTS; j >= 1; j--) {
      const m = k.n - j
      if (m < 0) continue
      const slot = binSlot(m)
      // The older piece is further out of the lamp than the newer one, which is
      // what gives a pile of two a near and a far.
      drawLoosePiece(piece(m), k, slot.x - ox, slot.y - oy, slot.ang, ox, oy, 1, 0.72 + 0.06 * (j - 1))
    }

    // And the one in flight.
    const f = offcutFall(k)
    if (f < 0) return
    const slot = binSlot(k.n)
    const drop = Math.pow(f, 1.6)
    const glide = 1 - Math.pow(1 - f, 2.6)
    drawLoosePiece(
      piece(k.n),
      k,
      (slot.x - ox) * glide,
      (slot.y - oy) * drop,
      slot.ang * glide,
      ox,
      oy,
      1,
      0.72 * glide,
    )
  }

  /**
   * A piece of film that is no longer on the line, drawn by putting the
   * ribbon's own routine under a canvas transform.
   *
   * This works only because the table's section of the ribbon is level,
   * untwisted and at z = 0 — a rigid straight segment, so a screen-space rotate
   * and translate is an exact rigid motion of it rather than an approximation.
   * Everywhere else on the line it would shear. It is one more thing the flat
   * datum buys.
   */
  function drawLoosePiece(
    piece: Piece,
    k: FilmClock,
    dx: number,
    dy: number,
    ang: number,
    ox: number,
    oy: number,
    alpha: number,
    /** How far out of the lamp this piece has fallen, 0..1. */
    shade: number,
  ) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(ox + dx, oy + dy)
    ctx.rotate(ang)
    ctx.translate(-ox, -oy)
    // Its own contact shadow, so a landed piece sits on the deck instead of
    // hovering over it. Same reasoning as the film's, one level down.
    ctx.save()
    ctx.fillStyle = GRAD!.loose
    ctx.fillRect(pathX(uAtCell(piece.c0)) - 4, oy + L.halfH * 0.8, pathX(uAtCell(piece.c1)) - pathX(uAtCell(piece.c0)) + 8, L.halfH * 1.3)
    ctx.restore()
    drawStripPiece(piece, k, true)
    drawStripMarks(piece, k)
    drawPiecePencil(piece, k)
    // OUT OF THE LAMP.
    //
    // Removed film lying on the deck is the same stock at the same scale as the
    // film on the line, and at the same exposure it competes with it — measured
    // on a full-width frame, three offcuts put as much bright emulsion below
    // the line as there was on it. So they are shaded down, which is not a
    // cheat: they have fallen out of the lamp's footprint and away from the
    // key, and a neutral black scrim is the one darkening device the house
    // rules allow. What survives at low value is the shape, the perforations
    // and the two coral marks — which is exactly the information they carry.
    if (shade > 0.001) {
      const c0 = pathX(uAtCell(piece.c0))
      const c1x = pathX(uAtCell(piece.c1))
      ctx.fillStyle = `rgba(6,6,9,${(shade * 0.78).toFixed(3)})`
      ctx.fillRect(
        Math.min(c0, c1x) - 3,
        L.baseY - L.halfH * 1.25,
        Math.abs(c1x - c0) + 6,
        L.halfH * 2.5,
      )
    }
    ctx.restore()
  }

  /** The two condemning marks, kept on the offcut. They travelled in with the
   *  footage and they go out with it, which is the registration invariant this
   *  drawing has broken before and must not break again. */
  function drawPiecePencil(piece: Piece, k: FilmClock) {
    const cMax = cellTable[CELL_SAMPLES]
    const frameW = 2 * L.halfH * FRAME_ASPECT
    const wCell = 0.055
    for (const c of [piece.c0, piece.c1]) {
      const A = sectionAt(uAtCell(Math.max(0, c - wCell / 2)))
      const B = sectionAt(uAtCell(Math.min(cMax, c + wCell / 2)))
      const PICR = 1 - 2 * RAIL
      fillQuad(A.across(PICR), B.across(PICR), B.across(-PICR), A.across(-PICR), ACCENT)
    }
    void k
    void frameW
  }





  function roundRectPath(x: number, y: number, w: number, h: number, r: number) {
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    roundRectPath(x, y, w, h, r)
  }

  // ---- files flying in ------------------------------------------------------
  const FILES_IN_FLIGHT = 2

  /**
   * The intake beat.
   *
   * There is no machine to go into any more, so the files have to be legible as
   * files right up until the moment they stop being files. They come in from
   * off-frame with real runway, converge on the ring, and come apart against
   * its rim inside the same `TRANSITION_PX` the film obeys on the other side.
   * Three at a time, not five: the owner asked for calm and a queue is calmer
   * than a swarm.
   */
  /**
   * The intake beat.
   *
   * There is no machine to go into, so a file has to be legible as a file right
   * up until the moment it stops being one. It comes in with runway, converges
   * on the ring, and the ring's void takes it — occultation, not a fade, which
   * only works because the files are painted before the black.
   *
   * And it is CAUSAL. The card's clock is the film's clock: a file is consumed
   * every `FRAMES_PER_FILE` frames, and the thumbnail it carries is the frame
   * that will be at the mouth when it lands. So the picture you watch go in is
   * the picture that comes out, and the filename changes when the session does,
   * because different sessions came off different cameras. Two at a time, not
   * five: a queue is calmer than a swarm.
   */
  const FRAMES_PER_FILE = 2.1

  /**
   * THE BEAT.
   *
   * A loop can be perfectly coherent and still have nothing you can point at.
   * The line was a cycle: files in transit, film already formed, energy already
   * leaving, at every moment. Nothing was ever *caught* happening.
   *
   * So the intake has a downbeat. As a file crosses the threshold the ring
   * takes it, and the ring answers: the rim brightens, the swirl quickens, and
   * the material coming through the mouth surges. It settles within a second.
   * That is the frame a stranger can point at, and it is the frame the poster
   * should be shot on.
   *
   * Returns 0..1, peaking at the instant a file is consumed.
   */
  /** The exit answers on every frame boundary that crosses it — the film is
   *  consumed continuously, so its downbeat is the frame rate itself. */
  function exitPulse(t: number) {
    const kk = filmClock(t)
    const atNode = cellAtU(NODE_U) - offAtCell(cellAtU(NODE_U), kk)
    const d = Math.abs(atNode - Math.round(atNode))
    return 0.55 * Math.exp(-Math.pow(d / 0.13, 2))
  }

  function intakePulse(t: number) {
    const scroll = filmClock(t).upstream
    let best = 0
    for (let i = 0; i < FILES_IN_FLIGHT; i++) {
      const ph = ((scroll / FRAMES_PER_FILE + i / FILES_IN_FLIGHT) % 1 + 1) % 1
      // Distance to the landing instant, forward-biased so the flare decays
      // after the event rather than anticipating it.
      const d = ph > 0.5 ? 1 - ph : ph * 0.55
      best = Math.max(best, Math.exp(-Math.pow(d / 0.09, 2)))
    }
    return best
  }

  function drawFiles(t: number) {
    if (!framesReady) return
    const hp = intake()
    const total = cells.length
    // The hopper is fed by the same belt the table stops. A file that keeps
    // falling through the hold would break the one-machine reading, and the
    // hold is long enough that it would be obvious.
    const scroll = filmClock(t).upstream
    const mouthCell = cellAtU(L.mouthU)
    const N = FILES_IN_FLIGHT

    for (let i = 0; i < N; i++) {
      const phaseNow = scroll / FRAMES_PER_FILE + i / N
      const p2 = ((phaseNow % 1) + 1) % 1
      // The scroll value at which this card lands, and therefore which frame it
      // is carrying.
      const scrollLand = (Math.ceil(phaseNow - 1e-9) - i / N) * FRAMES_PER_FILE
      const landIdx = Math.floor(mouthCell - scrollLand)
      const cell = cells[((landIdx % total) + total) % total]
      const sess = sessions[cell.s]
      const thumb = cell.img
      // Capture order, not walk order, or the camera appears to count down.
      const capture = total - 1 - (((landIdx % total) + total) % total)
      const name = `${sess.file}${String(capture + 11)}.MOV`

      // IN THE SAME WORLD AS THE FILM.
      //
      // A rounded rect with a 1px white stroke is app chrome flying through a
      // cinema still: it does not take the key, does not share the depth, and
      // does not shrink as it comes in. So the card is four corners in world
      // coordinates pushed through the same projection as the ribbon. It
      // approaches from further away, arrives at the threshold's own plane, and
      // is lit by the same source everything else is lit by.
      // Smoothstep: leaves gently, gains through the middle, and ARRIVES
      // slowly — the arrival is the beat, and a card that hits the threshold
      // at full speed is consumed in a frame and a half.
      const e = p2 * p2 * (3 - 2 * p2)
      const cw = L.unit * 0.62
      const chh = cw * 0.6
      const startX = hp.cx - dir * L.halfH * 0.2
      const wx = startX
      const lane = (i - (N - 1) / 2) * L.unit * 0.4
      // FALLING INTO THE HOPPER. A hopper is fed from above, so the intake is a
      // drop rather than a glide: the file comes in over the mouth, accelerates
      // down the funnel, and is gone at the throat.
      const wy = hp.funnelTop - L.unit * 1.0 + (hp.bodyTop - (hp.funnelTop - L.unit * 1.0)) * e + lane * (1 - e) * 0.6
      // Comes in from behind the plane of the ring and lands on it.
      const wz = (1 - e) * L.unit * (i === 0 ? 1.6 : 2.8)

      // The file TURNS to face the aperture.
      //
      // A flat card arriving broadside at a hoop seen edge-on can only ever bump
      // into it: the ring's black is drawn afterwards, so anything that crosses
      // is hidden, and what you watch is a card stopping at a rim. Rotating the
      // card about its vertical axis as it arrives makes it foreshorten into the
      // ring's own plane and slot through — which is both legible and what a
      // thing going through a hoop actually does.
      // Enough turn to read as facing the aperture, not so much that the card
      // foreshortens to a sliver and vanishes before it gets there.
      const turn = 0.55 * Math.pow(clamp01((e - 0.55) / 0.45), 1.3)
      const ct = Math.cos(turn)
      const st = Math.sin(turn)
      const corner = (sx2: number, sy2: number) =>
        proj3([wx + sx2 * cw * 0.5 * ct, wy + sy2 * chh * 0.5, wz - sx2 * cw * 0.5 * st])
      const tl = corner(-1, -1)
      const tr = corner(1, -1)
      const br = corner(1, 1)
      const bl = corner(-1, 1)

      // Crossing the plane is now visible, so the card has to stop existing by
      // transforming rather than by being covered up.
      // The trailing file is a ghost: present enough to say more is coming,
      // quiet enough that the arriving one is the subject.
      const a2 = Math.min(1, p2 / 0.07) * (1 - clamp01((e - 0.9) / 0.1)) * (i === 0 ? 1 : 0.22)
      // `y` is load-bearing telemetry, not decoration: the machine pours from
      // above, so "a file descends into the hopper" is the invariant the spec
      // asserts, and a direction bug here has always been a sign error that a
      // still frame cannot show. Dropping it from this push turned a real
      // assertion into one comparing undefined.
      probe.cards.push({ key: `f${i}`, x: corner(0, 0)[0], y: corner(0, 0)[1], p: p2, e, turn })
      if (a2 <= 0.01) continue

      ctx.save()
      ctx.globalAlpha = a2
      // Plate: above the page value, lit from the same upper-left key, with the
      // bright edge along the top exactly as the film's rails have.
      fillQuad(tl, tr, br, bl, '#26262c')
      ctx.strokeStyle = 'rgba(255,246,242,0.16)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(bl[0], bl[1])
      ctx.lineTo(tl[0], tl[1])
      ctx.lineTo(tr[0], tr[1])
      ctx.stroke()

      if (thumb) {
        const q = corner
        const i0 = q(-0.9, -0.82)
        const i1 = q(0.9, -0.82)
        const i2 = q(0.9, 0.24)
        const i3 = q(-0.9, 0.24)
        const TW = (thumb as HTMLCanvasElement).width
        const TH = (thumb as HTMLCanvasElement).height
        texTriangle(thumb, [0, 0], [TW, 0], [0, TH], i0, i1, i3, [0, 0, TW, TH])
        texTriangle(thumb, [TW, 0], [TW, TH], [0, TH], i1, i2, i3, [0, 0, TW, TH])
      }

      // The label rides the card's own plane.
      const lp = proj3([wx - cw * 0.42 * ct, wy + chh * 0.34, wz + cw * 0.42 * st])
      const rp = proj3([wx + cw * 0.42 * ct, wy + chh * 0.34, wz - cw * 0.42 * st])
      ctx.save()
      ctx.translate(lp[0], lp[1])
      ctx.rotate(Math.atan2(rp[1] - lp[1], rp[0] - lp[0]))
      ctx.globalAlpha = (i === 0 ? a2 : 0) * clamp01((ct - 0.42) / 0.3)
      ctx.fillStyle = 'rgba(244,244,245,0.8)'
      ctx.font = `${Math.max(8, cw * 0.115)}px "IBM Plex Mono", monospace`
      ctx.fillText(name, 0, 0)
      ctx.restore()
      ctx.restore()
    }
  }

  // ---- titles, applied to the film ------------------------------------------
  /**
   * A title is not a tooltip. It belongs to a FRAME.
   *
   * The old drawing floated a UI pill above the ribbon on a hairline tether and
   * slid it along, which reads as an annotation about the picture rather than
   * something the workshop did TO the picture. So a caption is now anchored to
   * a film-space frame index, found on the line by inverting the arc-length
   * table, and drawn in the ribbon's own local space: same tangent rotation,
   * same perspective scale, and vertically foreshortened by the same roll. It
   * lies on the emulsion. When its frame travels, it travels; when its frame
   * leaves, it leaves.
   *
   * It also LANDS. Upstream of the applicator it is above the film and
   * transparent; crossing that station it settles onto the frame it belongs to.
   * That is the moment the product is actually claiming.
   */
  const APPLY_AT = 0.5

  /** Everything a thing riding the film needs in order to be drawn on it. */
  function filmFrameAt(u: number) {
    const e = 0.0012
    return {
      x: pathX(u),
      y: pathY(u),
      ang: Math.atan2(pathY(u + e) - pathY(u - e), pathX(u + e) - pathX(u - e)),
      /** un-rolled half height: the film's true half-width at this depth */
      flat: L.halfH * depth(u),
      cos: Math.cos(pathRoll(u)),
    }
  }

  /**
   * Frames where a new show starts, in cell space. Driven by the manifest, so
   * the titles change as different sessions come down the line rather than
   * repeating one staged caption.
   */
  function sessionStarts() {
    const out: number[] = []
    const n = cells.length
    for (let i = 0; i < n; i++) {
      // Walk order is DECREASING index, so a run starts where the next index up
      // belongs to a different session.
      if (cells[i].s !== cells[(i + 1) % n].s) out.push(i)
    }
    return out
  }

  function drawTitles(t: number) {
    if (!framesReady) return
    const kk = filmClock(t)
    const pieces = filmPieces(kk)
    const scroll = kk.upstream
    const total = cells.length
    // A frame `f` is on screen while `f + scroll` is inside the line.
    const first = cellTable[0] - scroll
    const last = cellTable[CELL_SAMPLES] - scroll
    const starts = sessionStarts()

    // Walk whole passes of the manifest so a title exists for every session
    // currently on the line, however many wraps that spans.
    const passFrom = Math.floor(first / total) - 1
    const passTo = Math.ceil(last / total) + 1

    for (let pass = passFrom; pass <= passTo; pass++) {
      for (const startIdx of starts) {
        const frame = pass * total + startIdx
        if (frame < first || frame > last) continue
        // Located through the piece list, because a caption belongs to a
        // FRAME and after a splice that frame is not where a single global
        // scroll would put it — and if its frame was the one that got removed,
        // the caption goes with it.
        const u = uForFilm(frame, pieces)
        if (u === null || u <= L.mouthU || u >= 0.99) continue
        const sess = sessions[cells[((startIdx % total) + total) % total].s]
        drawTitleOnFilm(u, sess.show, sess.speaker)
      }
    }
  }

  function drawTitleOnFilm(u: number, show: string, speaker: string) {
    const f = filmFrameAt(u)
    // Landing: above the film and transparent before the applicator, settled
    // onto it after. Eased, so it arrives rather than snaps.
    const land = ease(clamp01((u - APPLY_AT + 0.13) / 0.13))
    if (land <= 0.001) return
    const leave = 1 - clamp01((u - 0.9) / 0.08)
    const alpha = land * leave
    if (alpha <= 0.01) return

    ctx.save()
    ctx.translate(f.x, f.y)
    // Attitude damping. Locked rigidly to the tangent, a title on a 40-degree
    // slope rotates past a readable posture and the roll crushes it to a slit.
    // So position is 100% the frame's, attitude is a fraction of it: enough
    // bank to read as attached, never enough to stop being words. The dark
    // plate and the coral key do the rest of the 3D cueing.
    const BANK = 0.72
    const BANK_MAX = 0.5
    ctx.rotate(Math.max(-BANK_MAX, Math.min(BANK_MAX, f.ang * BANK)))
    ctx.scale(1, Math.max(0.66, Math.abs(f.cos)))
    ctx.globalAlpha = alpha

    const fh = f.flat
    const drop = (1 - land) * fh * 3.4
    const nameFont = `600 ${Math.max(8, fh * 0.2)}px Manrope, sans-serif`
    const showFont = `${Math.max(6, fh * 0.13)}px "IBM Plex Mono", monospace`

    // OPTICALLY PRINTED, NOT LAID ON.
    //
    // A dark plate is a broadcast graphic sitting on a photograph — the one
    // piece of UI riding the one piece of cinema. The letters go INTO the
    // frame instead, in the quiet band at the top of these sessions, each glyph
    // carrying a small film-black hold-out the way an optical printer leaves
    // one. No rectangle, and no coral: the accent belongs to the act, and this
    // is the result of the act.
    const pad = fh * 0.1
    const by = -fh * 0.5 - drop

    const holdOut = (text: string, x: number, y: number) => {
      ctx.fillStyle = 'rgba(3,3,5,0.78)'
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -1.8], [0, 1.8], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5], [1.5, 1.5]])
        ctx.fillText(text, x + dx, y + dy)
    }

    ctx.textBaseline = 'middle'
    if (speaker) {
      ctx.font = nameFont
      holdOut(speaker, -fh * 0.9 + pad, by)
      ctx.fillStyle = INK
      ctx.fillText(speaker, -fh * 0.9 + pad, by)
      ctx.font = showFont
      holdOut(show.toUpperCase(), -fh * 0.9 + pad, by + fh * 0.19)
      ctx.fillStyle = 'rgba(238,236,235,0.82)'
      ctx.fillText(show.toUpperCase(), -fh * 0.9 + pad, by + fh * 0.19)
    } else {
      ctx.font = nameFont
      holdOut(show, -fh * 0.9 + pad, by)
      ctx.fillStyle = INK
      ctx.fillText(show, -fh * 0.9 + pad, by)
    }
    ctx.textBaseline = 'alphabetic'
    ctx.restore()
  }

  // ---- the transmitter ------------------------------------------------------
  /**
   * The second barrier, and the bookend to the intake machine.
   *
   * Film does not travel to a platform — a transmission does. So the finished
   * ribbon runs into this and does not come out the other side as film: it
   * leaves as energy, three streams heading for the channels.
   *
   * Keeping it at this level of abstraction is also the accurate choice.
   * Drawing a 16:9 reel to YouTube and 9:16 cuts to LinkedIn asserts a split
   * that is not real — YouTube takes shorts too. The picture should say
   * "published to your channels", and stop there.
   */
  function bezAt(p: number, c: number[]): [number, number] {
    const m = 1 - p
    const a3 = m * m * m
    const b3 = 3 * m * m * p
    const c3 = 3 * m * p * p
    const d3 = p * p * p
    return [
      a3 * c[0] + b3 * c[2] + c3 * c[4] + d3 * c[6],
      a3 * c[1] + b3 * c[3] + c3 * c[5] + d3 * c[7],
    ]
  }
  function bezAngle(p: number, c: number[]) {
    const [x0, y0] = bezAt(Math.max(0, p - 0.004), c)
    const [x1, y1] = bezAt(Math.min(1, p + 0.004), c)
    return Math.atan2(y1 - y0, x1 - x0)
  }

  const mixHex = (h1: string, h2: string, k: number) => {
    const a = parseInt(h1.slice(1), 16)
    const b = parseInt(h2.slice(1), 16)
    const ch = (sh: number) =>
      Math.round((((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k))
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`
  }

  /** How close a packet is to landing on channel `ci`, 0..1. */
  function channelArrive(t: number, ci: number) {
    let a = 0
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.34 + k / 3 + ci * 0.17) % 1
      a = Math.max(a, Math.exp(-Math.pow((1 - p) / 0.1, 2)))
    }
    return a
  }

  /**
   * The output end is a PROJECTOR.
   *
   * Three hairlines to three circled marks was a flowchart, and the ink map
   * proved it: the right third held a quarter of the drawing's ink across a
   * third of its width. A projector solves the same sentence with a shape
   * everybody already knows — the finished programme winds onto the take-up
   * reel, a lamp throws it, and the light lands on the channels.
   *
   * The cone is a hard-edged wedge with flat fills and a few travelling bands.
   * It is not a bloom: no radial gradient, no glow, nothing soft. What makes it
   * read as light is that it has an origin, straight edges, and things in it
   * that move.
   */
  function screenPlaneX() {
    return dir > 0 ? W * 0.93 : W * 0.07
  }

  const CHANNELS = [
    { name: 'YouTube', dy: -0.235 },
    { name: 'Podcast', dy: 0.01 },
    { name: 'LinkedIn', dy: 0.255 },
  ]

  function screenAt(dy: number) {
    return { x: screenPlaneX(), y: L.baseY + H * dy }
  }



  /**
   * Per-frame telemetry. Three separate motion bugs (film, cut marking and
   * cards each travelling a different way) survived visual review because a
   * still cannot show direction. Recording where things actually landed makes
   * those invariants testable instead of a matter of opinion.
   */
  const probe: {
    t: number
    scroll: number
    cards: { key: string; x: number; p: number; e: number; turn: number }[]
    /** Lowest projected slope along the line, as a fraction of the nominal
     *  slope. Must stay positive or the ribbon folds through itself. */
    zMargin: number
    zAmp: number
    rollAmp: number
    amp: number
    headingZ: number
  } = { t: 0, scroll: 0, cards: [], zMargin: 0, zAmp: 0, rollAmp: 0, amp: 0, headingZ: 0 }

  if (typeof window !== 'undefined') {
    (window as any).__lineProbe = probe
    /**
     * Act II's own telemetry, and its build stamp.
     *
     * Two separate jobs. The stamp proves the bundle being screenshotted is the
     * one that was just edited — a review instrument that cannot fail loudly
     * fails silently, and this project has already paid for that once (Pass 0).
     * The rest makes the table's contract and the cut's timing assertable:
     * where the datum is, where the boundaries landed, and what phase of the
     * cut a given frame was caught in.
     */
    /**
     * The belt's motion, sampled without re-rendering.
     *
     * "The film stops" is an assertion about VELOCITY and a still cannot show
     * velocity — which is precisely how three direction bugs survived review in
     * this drawing before anyone instrumented it. This returns the upstream and
     * downstream film positions over a time range so the stop, the slam and the
     * downstream side's refusal to move can be asserted as numbers.
     */
    ;(window as any).__actIIClock = (t0 = 3.9, t1 = 5.1, steps = 30) => {
      const out: number[][] = []
      for (let i = 0; i <= steps; i++) {
        const t = t0 + ((t1 - t0) * i) / steps
        const k = filmClock(t)
        out.push([
          +t.toFixed(4),
          +k.upstream.toFixed(4),
          +offAtCell(cellAtU(NODE_U), k).toFixed(4),
          k.phase,
          +k.adv.toFixed(3),
        ])
      }
      return out
    }
    ;(window as any).__actII = () => {
      const T = table()
      return {
        build: ACT_II_BUILD,
        W,
        H,
        baseY: L.baseY,
        baseYinH: +(L.baseY / H).toFixed(4),
        feedEndU: +L.feedEndU.toFixed(4),
        tableEndU: +L.tableEndU.toFixed(4),
        tableXAtFilm: [T.x0, T.x1],
        tableFrontY: +T.frontY.toFixed(1),
        tableBackY: +T.backY.toFixed(1),
        frameWidthPx: +(2 * L.halfH * FRAME_ASPECT).toFixed(1),
        filmWidthPx: +(2 * L.halfH).toFixed(1),
        cycleS: +CYCLE_S.toFixed(3),
        runS: +RUN_S.toFixed(3),
        holdS: HOLD_S,
        slamS: SLAM_S,
        cut: (() => {
          const kk = filmClock(probe.t)
          const c1 = kk.c1
          return {
            phase: kk.phase,
            since: +kk.since.toFixed(3),
            severed: kk.severed,
            adv: +kk.adv.toFixed(3),
            holeX: kk.hole
              ? [+pathX(uAtCell(kk.hole[0])).toFixed(1), +pathX(uAtCell(kk.hole[1])).toFixed(1)]
              : null,
            cutX: +pathX(uAtCell(c1)).toFixed(1),
            runX: [
              +pathX(uAtCell(c1 - CUT_REMOVED)).toFixed(1),
              +pathX(uAtCell(c1)).toFixed(1),
            ],
            pieces: filmPieces(kk).map((p) => [+p.c0.toFixed(2), +p.c1.toFixed(2), +p.off.toFixed(2)]),
          }
        })(),
      }
    }
    /**
     * Per-sample geometry, for judging ELASTICITY with numbers.
     *
     * On real film the ratio of a frame's length to the film's width is a
     * constant of the stock. On screen the two are foreshortened by different
     * things — the frame by how much the strip runs away from the camera, the
     * width by depth and roll — so the ratio is what tells you whether the
     * projection has become extreme enough to read as rubber.
     */
    ;(window as any).__lineGeom = (n = 160) => {
      const out: any[] = []
      const totalPix = pixTable[CELL_SAMPLES]
      for (let i = 1; i < n; i++) {
        const u = uAtPixels((totalPix * i) / n)
        const uNext = uAtPixels((totalPix * (i + 0.5)) / n)
        const dCell = cellAtU(uNext) - cellAtU(u)
        const a = proj3(worldC(u))
        const b = proj3(worldC(uNext))
        const dPix = Math.hypot(b[0] - a[0], b[1] - a[1])
        const e = edgesAt(u)
        const width = Math.hypot(e.p[0] - e.m[0], e.p[1] - e.m[1])
        const T = tangent(u)
        out.push({
          u: +u.toFixed(3),
          framePx: dCell > 1e-9 ? +(dPix / dCell).toFixed(1) : null,
          widthPx: +width.toFixed(1),
          ratio: dCell > 1e-9 ? +(dPix / dCell / width).toFixed(3) : null,
          tz: +Math.abs(T[2]).toFixed(3),
          depth: +depth(u).toFixed(3),
          roll: +pathRoll(u).toFixed(3),
        })
      }
      return out
    }

    // Geometry dump, for measuring the ribbon instead of guessing at it.
    ;(window as any).__lineDump = (n = 400) => {
      const out: number[][] = []
      const totalPix = pixTable[CELL_SAMPLES]
      for (let i = 0; i <= n; i++) {
        const u = uAtPixels((totalPix * i) / n)
        const e = edgesAt(u)
        out.push([u, e.p[0], e.p[1], e.m[0], e.m[1], pathRoll(u), depth(u)])
      }
      return out
    }
  }

  /**
   * THE STILL.
   *
   * `prefers-reduced-motion` gets exactly one frame and so does every
   * screenshot taken without `?t=`, so which frame it is matters more than any
   * other single number in the file. It used to be 4200ms, which was nothing in
   * particular. It is now the moment the act exists for: the belt stopped, both
   * blades through the stock, the condemned run on its way to the deck and the
   * gap opening behind it. A reader who never sees the animation still sees the
   * product's verb.
   *
   * Solved from the beat sheet rather than written down, so re-timing the cut
   * cannot silently move the poster off the beat.
   */
  const STILL_MS = (RUN_S + (BEAT.dwellTo + BEAT.liftTo) / 2) * 1000

  // ---- frame ----------------------------------------------------------------
  /** The coil and flange only ever ROTATE, so they are baked once per resize
   *  and drawn under a single ctx.rotate. What is deliberately not baked is
   *  anything positioned by the light or by where the film lands. */
  let reelCache: HTMLCanvasElement | null = null
  let reelCacheR = 0

  /**
   * HOW MUCH LIGHT IS GETTING OUT, given where the film is in its cycle.
   *
   * A shutter was tried once and cut, and the reasoning was right at the time:
   * on a film indexing at about one frame a second a faithful two-blade shutter
   * blinks the throw at four hertz, which is a strobe on a page where calm is
   * load-bearing — and it was incoherent, because the beam went dark while the
   * pictures it was throwing stayed lit.
   *
   * The incoherence is gone now that the film indexes. There IS a moment when
   * the light is genuinely interrupted: the claw is pulling, no frame is
   * standing in the gate, and every surface downstream loses the same light at
   * the same instant. So ONE number dims the wedge, its edges, the dust, the
   * aperture and the three gates together — which reads as a machine breathing
   * rather than as an element blinking.
   *
   * Deliberately shallow, and it never reaches black. A real shutter is
   * invisible because it runs at forty-eight hertz; at one hertz the faithful
   * depth would be a blackout once a second, and faithful is not the same as
   * true.
   */
  function gateLit(t: number) {
    return 0.74 + 0.26 * filmPos(t).dwell
  }

  /** One destination: a circle on the arc, and the angle it sits at. */
  function gateAt(i: number) {
    const g = throwGeom()
    const a = DESTINATIONS[i].a
    return {
      cx: g.lx + Math.cos(a) * g.len * g.sgn,
      cy: g.ly + Math.sin(a) * g.len,
      r: g.gr,
      a,
      name: DESTINATIONS[i].name,
    }
  }

  /**
   * The frame standing in the light is the frame at the head, right now.
   *
   * Not a decorative loop of its own. The strip, the reel's rotation and this
   * all read the same clock, so what is published is visibly what has just been
   * wound — and it changes on the film's own beat, about once a second, which
   * is all the animation this end of the piece needs.
   */

  function reelBitmap(R: number, coil: number) {
    if (reelCache && reelCacheR === R) return reelCache
    const pad = 2
    const size = Math.ceil((R + pad) * 2 * dpr)
    const off = document.createElement('canvas')
    off.width = size
    off.height = size
    const g = off.getContext('2d')
    if (!g) return null
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.translate(R + pad, R + pad)

    // The coil, as one continuous spiral of stock. A ring says "circle"; a
    // spiral says "this is one continuous thing that has been wound", which is
    // the entire sentence this object exists to speak.
    g.beginPath()
    g.arc(0, 0, coil, 0, TAU)
    g.fillStyle = '#101015'
    g.fill()
    const TURNS = 17
    const r0 = R * 0.3
    g.strokeStyle = 'rgba(236,236,244,0.07)'
    g.lineWidth = 1
    g.beginPath()
    for (let k = 0; k <= TURNS * 20; k++) {
      const f = k / (TURNS * 20)
      const a2 = -f * TURNS * TAU
      const rr = r0 + (coil - r0) * f
      const px = Math.cos(a2) * rr
      const py = Math.sin(a2) * rr
      if (k === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()

    // THREE WINDOWS, NOT SIX SPOKES. At sixty pixels of radius six tapered
    // spokes merge into a grey annulus; three read as a reel from across the
    // room, which is the only test that matters.
    //
    // But three WIDE arms over a full coil read as a desk fan, which is what
    // the first version of this did — sector-shaped openings with sharp radial
    // edges are precisely the geometry of a blade guard. The fix is to spend as
    // little metal as a real reel does: thin arms, starting well out from the
    // hub, and darker than the rim, so the brightest thing on the object is the
    // lit edge of the flange rather than the arms crossing the film.
    const metal = g.createLinearGradient(0, -R, 0, R)
    metal.addColorStop(0, '#34343d')
    metal.addColorStop(0.44, '#212129')
    metal.addColorStop(1, '#101014')
    g.fillStyle = metal
    g.beginPath()
    g.arc(0, 0, R, 0, TAU)
    for (let k = 0; k < 3; k++) {
      const a0 = (k / 3) * TAU + 0.075
      const a1 = a0 + TAU / 3 - 0.15
      g.moveTo(Math.cos(a0) * R * 0.92, Math.sin(a0) * R * 0.92)
      g.arc(0, 0, R * 0.92, a0, a1)
      g.arc(0, 0, R * 0.36, a1, a0, true)
      g.closePath()
    }
    g.fill('evenodd')

    // Hub, with the slot the film's leader is threaded into.
    g.beginPath()
    g.arc(0, 0, R * 0.26, 0, TAU)
    g.fillStyle = metal
    g.fill()
    g.strokeStyle = 'rgba(255,255,255,0.18)'
    g.lineWidth = 1
    g.stroke()
    g.fillStyle = '#08080b'
    g.fillRect(-R * 0.17, -R * 0.03, R * 0.34, R * 0.06)
    g.beginPath()
    g.arc(0, 0, R * 0.075, 0, TAU)
    g.fillStyle = '#08080b'
    g.fill()

    reelCache = off
    reelCacheR = R
    return off
  }

  /** Geometry of the throw, in screen pixels. Everything downstream reads this
   *  so the beam, the gates and the labels cannot drift apart. */
  function throwGeom() {
    const l = lens()
    const sgn = dir > 0 ? 1 : -1
    const gr0 = W * 0.0155
    // Clamped, because the machine's size follows H while the throw follows W:
    // a short wide stage walks the far gates off the edge that a tall one has
    // room for. The margin is measured to the OUTSIDE of the furthest gate.
    const room = Math.abs(dir > 0 ? W * 0.973 - l.x : l.x - W * 0.027) - gr0
    const len = Math.max(W * 0.055, Math.min(W * 0.105, room))
    return { lx: l.x, ly: l.y, len, gr: gr0, sgn, h0: H * 0.022 }
  }

  /**
   * The frame standing in the light is the frame at the head, right now.
   *
   * Not a decorative loop of its own. The strip, the reel's rotation and this
   * all read the same clock, so what is published is visibly what has just been
   * wound — and it changes on the film's own beat, about once a second, which
   * is all the animation this end of the piece needs.
   */
  function publishedCell(t: number) {
    return Math.floor(cellAtU(NODE_U) - filmPos(t).pos)
  }

  function drawThrow(t: number) {
    const g = throwGeom()
    const sgn = g.sgn
    const lit = gateLit(t)
    // THE FAN IS SOLVED FROM THE GATES, not chosen and then compared to them.
    // Its edges are the TANGENTS from the lens to the outer circle, so the
    // light exactly contains the things standing in it — no wider, which would
    // leave two hairlines running off into the margin, and no narrower, which
    // would light half of a screen.
    const outer = Math.abs(DESTINATIONS[0].a)
    const spread = outer + Math.asin(Math.min(0.9, g.gr / g.len))
    const far = g.len + g.gr * 0.15
    // The wedge, struck as a circular sector from the lens: two straight edges
    // and an arc across the far end, which is what a cone of light landing on
    // an arc of surfaces actually is.
    const a0 = -spread
    const a1 = spread
    ctx.save()
    if (sgn < 0) {
      ctx.translate(g.lx, 0)
      ctx.scale(-1, 1)
      ctx.translate(-g.lx, 0)
    }
    ctx.beginPath()
    ctx.moveTo(g.lx, g.ly - g.h0)
    ctx.lineTo(g.lx + Math.cos(a0) * far, g.ly + Math.sin(a0) * far)
    ctx.arc(g.lx, g.ly, far, a0, a1)
    ctx.lineTo(g.lx, g.ly + g.h0)
    ctx.closePath()
    // A LINEAR falloff along the throw — light spreading over distance,
    // computed the way it actually spreads. A linear gradient along the axis,
    // never a radial one around a point, and never above the value of the
    // machine that made it.
    const grad = ctx.createLinearGradient(g.lx, 0, g.lx + far, 0)
    grad.addColorStop(0, `rgba(255,250,246,${(0.075 * lit).toFixed(4)})`)
    grad.addColorStop(0.5, `rgba(255,250,246,${(0.026 * lit).toFixed(4)})`)
    grad.addColorStop(1, `rgba(255,250,246,${(0.012 * lit).toFixed(4)})`)
    ctx.fillStyle = grad
    ctx.fill()

    // The two edges. Straight, one pixel, brighter at the source than at the
    // far end — the falloff again, on the only line that can carry it without
    // becoming a shape.
    const eg = ctx.createLinearGradient(g.lx, 0, g.lx + far, 0)
    eg.addColorStop(0, `rgba(255,248,244,${(0.22 * lit).toFixed(4)})`)
    eg.addColorStop(1, `rgba(255,248,244,${(0.085 * lit).toFixed(4)})`)
    ctx.strokeStyle = eg
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(g.lx, g.ly - g.h0 + 0.5)
    ctx.lineTo(g.lx + Math.cos(a0) * far, g.ly + Math.sin(a0) * far + 0.5)
    ctx.moveTo(g.lx, g.ly + g.h0 - 0.5)
    ctx.lineTo(g.lx + Math.cos(a1) * far, g.ly + Math.sin(a1) * far - 0.5)
    ctx.stroke()

    // DUST. You cannot see a beam; you see what is floating in it. Seventy
    // one-pixel motes, drifting on the air rather than streaking along the
    // axis, deterministic so a screenshot is reproducible. A mote is a point:
    // what varies between motes is how brightly it is lit, not how big it is.
    const MOTES = 70
    for (let k = 0; k < MOTES; k++) {
      const p1 = hash(k * 3.7 + 11)
      const p2 = hash(k * 9.1 + 3)
      const p3 = hash(k * 5.3 + 29)
      // Distributed on the SECTOR, not on a rectangle: the square root spreads
      // them evenly by area, so the fan does not thin out toward its rim.
      const rr = far * Math.sqrt((p1 + t * 0.014 * (0.5 + p3)) % 1)
      const aa = (p2 * 2 - 1) * spread * 0.97 + Math.sin(t * 0.35 + k * 1.7) * 0.012
      const x = g.lx + Math.cos(aa) * rr
      const y = g.ly + Math.sin(aa) * rr
      const f = rr / far
      const mote = (0.15 + 0.36 * (1 - f) * (0.35 + 0.65 * p3)) * lit
      ctx.fillStyle = `rgba(255,250,247,${mote.toFixed(3)})`
      ctx.fillRect(x, y, 1, 1)
    }
    ctx.restore()

    // THE SOURCE. A hard, small, bright rectangle at the lens's front element,
    // set into a dark face. It is the brightest thing in this act by design and
    // the smallest, which is the trade that lets light read without a single
    // soft pixel — and without the dark surround the bright slot reads as a
    // strip light screwed to the side of the machine rather than as a hole.
    ctx.save()
    const fw = Math.max(2, W * 0.0017)
    const ah = g.h0 * 1.05
    ctx.fillStyle = '#08080b'
    ctx.fillRect(g.lx - fw * 1.7 * sgn, g.ly - g.h0 * 1.5, fw * 1.7 * sgn, g.h0 * 3)
    ctx.fillStyle = `rgba(255,250,247,${(0.88 * lit).toFixed(3)})`
    ctx.fillRect(g.lx - fw * sgn, g.ly - ah, fw * sgn, ah * 2)
    ctx.restore()
  }

  /**
   * THE GATES.
   *
   * Round surfaces standing in the throw, each carrying the frame that is
   * passing the head at that moment — the same edit, arriving in three places,
   * which is the accurate claim and the only one worth making. Not a channel's
   * interface, not a play button, not a view count. BitterClip publishes to
   * YouTube, to podcast feeds and to LinkedIn after your approval; Instagram is
   * capped to manual handoff, so it is not here and nothing implies otherwise.
   *
   * FALLOFF IS WHY THEY ARE DIM. A projected image at the end of a throw is a
   * fraction of the brightness of the film in the gate, and that fact does real
   * compositional work: the film on the table stays the brightest thing in the
   * piece and the last word is spoken quietly.
   */
  function drawDestinations(t: number) {
    const total = cells.length
    const ci = publishedCell(t)
    const cell = total ? cells[((ci % total) + total) % total] : undefined
    const g0 = throwGeom()
    ctx.save()
    ctx.font = `${Math.max(9, Math.round(H * 0.018))}px "IBM Plex Mono", monospace`
    for (let i = 0; i < DESTINATIONS.length; i++) {
      const q = gateAt(i)

      // The surface before anything lands on it. Near-black, so the page's film
      // grain does not read through a lit screen.
      ctx.beginPath()
      ctx.arc(q.cx, q.cy, q.r, 0, TAU)
      ctx.fillStyle = '#070709'
      ctx.fill()

      const img = mipFor(cell, q.r * 2 * dpr)
      if (img) {
        const iw = (img as HTMLCanvasElement).width
        const ih = (img as HTMLCanvasElement).height
        ctx.save()
        ctx.beginPath()
        ctx.arc(q.cx, q.cy, q.r, 0, TAU)
        ctx.clip()
        // Cover-fit: the frame fills the circle and is cropped by it, the way
        // a round gate crops a rectangular frame. No letterboxing, and no
        // squeezing a 4:3 picture into a circle.
        const dh = q.r * 2
        const dw = dh * (iw / ih)
        ctx.drawImage(img, q.cx - dw / 2, q.cy - q.r, dw, dh)
        ctx.restore()
        // THE EXPOSURE OF A THROWN IMAGE, held well under the film's own, plus
        // OFF-AXIS FALLOFF: the gate on the optical axis catches more light
        // than the two at the edge of the fan. It is a small difference and it
        // is the difference between three lit surfaces and three identical
        // stickers — equal circles read as a set of buttons, unequal ones read
        // as a room. Applied as a black scrim rather than with `globalAlpha`,
        // because dimming is less light arriving, not a translucent surface.
        const expo = (0.46 - 0.09 * Math.abs(q.a) / 0.53) * gateLit(t)
        ctx.beginPath()
        ctx.arc(q.cx, q.cy, q.r, 0, TAU)
        ctx.fillStyle = `rgba(0,0,0,${(1 - expo).toFixed(3)})`
        ctx.fill()
      }

      // One lit arc on the rim, on the side facing the lens, because that is
      // the side the light is coming from. A rim all the way round would be a
      // border, and a border is what made the old rectangles read as cards.
      const toLens = Math.atan2(-Math.sin(q.a), -Math.cos(q.a) * throwGeom().sgn)
      ctx.strokeStyle = 'rgba(255,246,242,0.26)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(q.cx, q.cy, q.r - 0.5, toLens - 0.85, toLens + 0.85)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,246,242,0.07)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(q.cx, q.cy, q.r - 0.5, 0, TAU)
      ctx.stroke()

      // THE NAMES GO INSIDE THE THROW, not under the gates.
      //
      // Under them they cannot fit: three circles on an arc struck from the
      // lens are about a diameter apart, which leaves under twenty pixels of
      // gap, and a label set in that gap lands on the next gate. Widening the
      // arc until the labels fit turns a calm fan into a splash. Set to the
      // side that faces the lens they have the whole empty middle of the beam
      // to sit in, they read as captions ON the light rather than as captions
      // under objects, and the arc can stay as tight as it wants to be.
      ctx.fillStyle = 'rgba(244,244,245,0.4)'
      ctx.textAlign = g0.sgn > 0 ? 'right' : 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(q.name, q.cx - (q.r + W * 0.008) * g0.sgn, q.cy)
      ctx.textBaseline = 'alphabetic'
    }
    ctx.textAlign = 'left'
    ctx.restore()
  }

  function drawReel(t: number) {
    const r = reel()
    const R = r.R
    // THE REEL IS WHAT IS PULLING THE FILM IN, so its rotation is not a free
    // parameter — it is the film's linear speed divided by the radius it is
    // winding at. Set by hand, the spokes and the coil disagree with the strip
    // and a viewer reads two animations rather than one machine.
    // COUNTERCLOCKWISE, and not as a preference. Film travelling rightward
    // under the reel drags the bottom of the wheel rightward with it; on a
    // canvas whose y runs downward that is a NEGATIVE angular rate. Spin it the
    // other way and the roll is visibly paying film back out onto the table.
    //
    // AND IT INDEXES. The reel's rotation is not a free parameter and it is not
    // a constant: it is the film's own position divided by the radius it is
    // winding at, so when the claw stops, the wheel stops. That is the single
    // strongest link between the strip and this object — set the spin by hand
    // and a viewer reads two animations, drive it off the transport and they
    // read one machine.
    // The sign follows the direction of travel: mirror the line and the wheel
    // has to turn the other way, or the roll is paying film back out.
    const spin = (-dir * filmPos(t).pos * (2 * L.halfH * FRAME_ASPECT)) / r.coil
    // WHERE THE FILM LIES DOWN ON THE ROLL.
    //
    // Not the angle of the path's last point — that is under the coil already,
    // and taking it put the fresh-stock highlight at the bottom of the reel
    // while the film was visibly touching it on the lower left. The contact is
    // where the CENTRELINE CROSSES THE COIL'S RIM, so the path is walked back
    // from its end until it does. Twenty-four samples is far finer than the
    // eye can want and costs nothing once a frame.
    let land = Math.atan2(r.endY - r.cy, r.endX - r.cx)
    for (let k = 1; k <= 24; k++) {
      const q = proj3(worldC(1 - k / 240))
      const dx2 = q[0] - r.cx
      const dy2 = q[1] - r.cy
      if (Math.hypot(dx2, dy2) >= r.coil) {
        land = Math.atan2(dy2, dx2)
        break
      }
    }

    ctx.save()
    ctx.translate(r.cx, r.cy)

    // THE FAR FLANGE, and only the sliver of it you could actually see.
    //
    // Drawn as a full offset ring it read as a shadow of the reel — a second,
    // blurred disc — because a whole ring behind a whole disc is exactly what a
    // drop shadow looks like. What is really visible of the back of a reel is a
    // CRESCENT on the side the near flange has moved away from, and that
    // crescent is what says the object has thickness. So it is an arc, on the
    // far side of the offset, and nothing else.
    const par = 0.05
    const fx = (L.vpX - r.cx) * par
    const fy = (L.baseY - r.cy) * par
    const fa = Math.atan2(-fy, -fx)
    ctx.strokeStyle = 'rgba(232,232,240,0.11)'
    ctx.lineWidth = R * 0.075
    ctx.beginPath()
    ctx.arc(fx, fy, R * 0.965, fa - 1.15, fa + 1.15)
    ctx.stroke()

    const bm = reelBitmap(R, r.coil)
    if (bm) {
      ctx.save()
      ctx.rotate(spin)
      const half = bm.width / (2 * dpr)
      ctx.drawImage(bm, -half, -half, half * 2, half * 2)
      ctx.restore()
    }

    // The outermost turn, where the film has just been laid down. It is the
    // only part of the roll the key can reach, and it fades away from the
    // contact point — which is what says the roll is growing at that spot. It
    // does NOT rotate: the film lands in the same place every turn.
    // The flange hides the last seventeen pixels of strip, so without this the
    // film simply stopped at the silhouette; this is the one thing that says it
    // went ONTO the wheel rather than ending beside it.
    // It has to be long enough to BRIDGE. The flange overhangs the coil, so the
    // last seventeen pixels of strip are behind the wheel, and a two-degree
    // glint at the contact left a visible gap between where the film stops and
    // where the roll starts. Sweeping forty degrees around from the contact
    // carries the eye across it: the film goes in there, and comes round.
    // Drawn as many short overlapping arcs rather than a few long ones: at
    // twenty-six segments the alpha steps were visible and the highlight read
    // as a dotted line running round the roll.
    for (let k = 0; k < 64; k++) {
      const f = k / 64
      const a0 = land - dir * f * 0.72
      ctx.strokeStyle = `rgba(255,246,242,${(0.36 * (1 - f) * (1 - f)).toFixed(3)})`
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(0, 0, r.coil - 0.6, a0 - 0.026, a0)
      ctx.stroke()
    }

    // One lit arc, upper left, where the key is. Everything else on this rim
    // stays at the value of the machine around it — and it stays still while
    // the reel turns under it, because a highlight is a property of the room.
    ctx.strokeStyle = 'rgba(255,246,242,0.3)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(0, 0, R - 0.7, Math.PI * 1.03, Math.PI * 1.72)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(0, 0, R - 0.7, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }

  function drawProjectorBody() {
    const pj = projector()
    const R = pj.r.R
    ctx.save()
    // Everything below is written as though the line ran left to right. One
    // reflection about the hub puts it the other way round, and the key light
    // is left alone on purpose: mirroring the drawing must not mirror the room.
    if (pj.sgn < 0) {
      ctx.translate(pj.r.cx, 0)
      ctx.scale(-1, 1)
      ctx.translate(-pj.r.cx, 0)
    }

    // NO STAND, AND NO VISIBLE AXLE.
    //
    // The reel hangs on a little axle above the table, off the housing that
    // stands behind it — and that axle points straight down the z-axis at the
    // viewer, so it foreshortens to nothing. There is no post to draw. A column
    // running down to a foot was inventing a second structure in front of the
    // table for a wheel that is already supported from behind it.
    // THE LAMP HOUSE. Taller than the body and set back, with vents cut in it,
    // because the one thing everybody knows about a lamp is that it needs air.
    const lg = ctx.createLinearGradient(0, pj.lampTop, 0, pj.bot)
    lg.addColorStop(0, '#25252d')
    lg.addColorStop(1, '#101015')
    ctx.fillStyle = lg
    ctx.fillRect(pj.lampX0, pj.lampTop, pj.lampX1 - pj.lampX0, pj.bot - pj.lampTop)
    ctx.fillStyle = 'rgba(255,246,242,0.2)'
    ctx.fillRect(pj.lampX0, pj.lampTop, pj.lampX1 - pj.lampX0, 1)
    // A chimney cap: the one detail that turns a vented box into a lamp house.
    ctx.fillStyle = '#1b1b22'
    ctx.fillRect(pj.lampX0 - R * 0.06, pj.lampTop - R * 0.1, pj.lampX1 - pj.lampX0 + R * 0.12, R * 0.1)
    ctx.fillStyle = 'rgba(255,246,242,0.22)'
    ctx.fillRect(pj.lampX0 - R * 0.06, pj.lampTop - R * 0.1, pj.lampX1 - pj.lampX0 + R * 0.12, 1)
    const vw = (pj.lampX1 - pj.lampX0) * 0.5
    for (let k = 0; k < 4; k++) {
      const vy = pj.lampTop + (pj.bot - pj.lampTop) * (0.16 + k * 0.14)
      ctx.fillStyle = '#08080b'
      ctx.fillRect(pj.lampX0 + vw * 0.28, vy, vw, 2)
      ctx.fillStyle = 'rgba(255,246,242,0.07)'
      ctx.fillRect(pj.lampX0 + vw * 0.28, vy + 2, vw, 1)
    }

    // THE BODY. A chamfer along the top deck takes the key; the front face
    // falls away below it. Two values and one hairline is a solid, and it is
    // the same trick the table's top edge uses, which is why they read as
    // furniture in the same room.
    const g = ctx.createLinearGradient(0, pj.top, 0, pj.bot)
    g.addColorStop(0, '#33333e')
    g.addColorStop(0.22, '#22222a')
    g.addColorStop(0.24, '#1a1a20')
    g.addColorStop(1, '#0c0c10')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(pj.x0, pj.top + R * 0.12)
    ctx.lineTo(pj.x0 + R * 0.14, pj.top)
    ctx.lineTo(pj.x1 - R * 0.1, pj.top)
    ctx.lineTo(pj.x1, pj.top + R * 0.12)
    ctx.lineTo(pj.x1, pj.bot)
    ctx.lineTo(pj.x0, pj.bot)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,246,242,0.22)'
    ctx.fillRect(pj.x0 + R * 0.14, pj.top, pj.x1 - pj.x0 - R * 0.24, 1)

    // THE BARREL, in two steps. One cylinder is a peg; two is a lens.
    const bh1 = H * 0.036
    const bh2 = H * 0.027
    const bg = ctx.createLinearGradient(0, pj.axisY - bh1, 0, pj.axisY + bh1)
    bg.addColorStop(0, '#33333c')
    bg.addColorStop(0.46, '#1f1f26')
    bg.addColorStop(1, '#101014')
    ctx.fillStyle = bg
    ctx.fillRect(pj.x1 - 1, pj.axisY - bh1, pj.barrelX1 - pj.x1 + 1, bh1 * 2)
    ctx.fillRect(pj.barrelX1, pj.axisY - bh2, pj.lensX - pj.barrelX1, bh2 * 2)
    ctx.fillStyle = 'rgba(255,246,242,0.16)'
    ctx.fillRect(pj.x1 - 1, pj.axisY - bh1, pj.barrelX1 - pj.x1 + 1, 1)
    ctx.fillRect(pj.barrelX1, pj.axisY - bh2, pj.lensX - pj.barrelX1, 1)
    // The focus ring: one dark groove, which is the detail that says "this
    // barrel was made to be turned".
    ctx.fillStyle = '#0a0a0d'
    ctx.fillRect(pj.barrelX1 - 4, pj.axisY - bh1, 2, bh1 * 2)

    // Feet. A machine that does not stand on anything is floating.
    ctx.fillStyle = '#0d0d11'
    for (const fx of [pj.x0 + R * 0.16, pj.x1 - R * 0.3]) {
      ctx.beginPath()
      ctx.moveTo(fx, pj.bot)
      ctx.lineTo(fx + R * 0.16, pj.bot)
      ctx.lineTo(fx + R * 0.2, pj.bot + R * 0.13)
      ctx.lineTo(fx - R * 0.04, pj.bot + R * 0.13)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(255,246,242,0.07)'
    ctx.fillRect(pj.x0 + R * 0.14, pj.bot + R * 0.13, pj.x1 - pj.x0 - R * 0.44, 1)
    ctx.restore()
  }

  /**
   * The take-up reel: hung ONE COIL-RADIUS above the film's own line.
   *
   * The hub is at the run's end in x — that is the contract. In y it is exactly
   * `coil` above the film, and that one number is the whole mechanism. A line
   * at distance r from a circle's centre, where r is the circle's radius, is
   * TANGENT to it. So the film runs dead level out of the table, straight on at
   * the same height, and arrives along the bottom of the roll without deviating
   * anywhere: it is not posted into the reel, it spools into it.
   *
   * Tangency also does the occlusion for free. The flange is larger than the
   * coil, so its lower rim dips below the film's line and the last thirty-odd
   * pixels of strip pass behind the wheel. Nothing has to be faded out by hand.
   */
  function reel() {
    const C = worldC(NODE_U)
    const P = proj3(C)
    const R = L.reelR
    // The coil fills the flange right out to its windows. Partly that is the
    // sentence — a full reel is a finished episode — and partly it is the only
    // way the windows can be windows: leave an annulus of nothing behind them
    // and the film arriving from the table shows through the gap as a bright
    // rectangle floating inside the wheel, which is what it was doing.
    // The coil comes almost out to the flange's rim. That is partly the
    // sentence — a full reel is a finished episode — and partly geometry: the
    // film's line is tangent to the COIL, so however far the flange overhangs
    // the coil is exactly how much of the strip's approach the flange hides. At
    // 0.85 the last thirty pixels vanished and the film read as ending beside
    // the wheel rather than running under it.
    const coil = R * 0.955
    // TANGENT TO THE FLANGE, not to the coil — a difference of under three
    // pixels that decides whether the film is seen to arrive at all.
    //
    // Hung one COIL-radius up, the flange overhangs the roll by a few pixels,
    // and a few pixels of overhang at the rim is seventeen pixels of chord at
    // the film's height: the strip vanished behind the wheel a sixth of a
    // radius before it touched anything, and read as ending beside the reel.
    // Hung one FLANGE-radius up, the wheel's silhouette rests exactly on the
    // film's line, nothing is occluded, and the roll sits three pixels inside
    // the rim where it belongs. Tangency is preserved either way; only the
    // occlusion changes.
    return { cx: P[0], cy: P[1] - R, R, coil, endX: P[0], endY: P[1] }
  }

  /**
   * THE HEAD.
   *
   * One machine, not two objects. The owner asked for "the reel and the
   * projection", and the honest way to have both is the way a projector has
   * always had both: the film that is being shown is the same film that is
   * being wound up, on the same machine, at the same moment. The reel is the
   * head's take-up spindle. Nothing is preserved that is not also published,
   * and nothing is published that is not also kept.
   *
   * The old body was a rounded rectangle the size of a shoebox with a second
   * rounded rectangle stuck to its side, and at this scale it read as a
   * camcorder lying on a wheel. What makes a machine read as a machine is not
   * size, it is FACETS AND FITTINGS: a bed it stands on, a lamp house with
   * vents, a chamfer that catches the key along one edge, a barrel made of two
   * steps rather than one, feet. All of that fits in a hundred pixels, and a
   * hundred pixels of mechanism outreads three hundred pixels of blob.
   *
   * AND IT STANDS BEHIND THE REEL. The head and the wheel used to occupy
   * consecutive stretches of x, which is how a twenty-percent-wide act ran out
   * of room; now they share one. You see the lamp house on the left, the wheel
   * in front of the middle of the machine, and the barrel coming out on the
   * right. Three planes in a strip of canvas that previously held two objects
   * standing in a row, and the depth is free — it is only draw order.
   *
   * The layout below is ALWAYS WRITTEN LEFT TO RIGHT and mirrored as a whole.
   * Every offset is measured downstream from the reel's hub and `mx` turns a
   * downstream coordinate into a screen one. Writing the machine twice — once
   * per direction — is how the previous version ended up with its lens on the
   * upstream side under `?dir=rtl`, firing its beam back through its own body
   * and across the reel.
   */
  function projector() {
    const r = reel()
    const R = r.R
    const sgn = dir > 0 ? 1 : -1
    // The optical axis sits BETWEEN the hub and the film's line — inside the
    // wheel's silhouette, which is the whole point of the layering. Put it on
    // the film's line and the barrel emerges at the wheel's very bottom edge
    // and the two objects stop overlapping; put it on the hub and the light
    // leaves higher than anything else in the piece.
    const axisY = r.cy + R * 0.42
    // The body runs well past the wheel on the upstream side, so the lamp house
    // and its vents stay visible, and stops short of it downstream, so the only
    // thing that comes out on the right is the barrel.
    const x0 = r.cx - R * 1.72
    const x1 = r.cx + R * 0.5
    const bodyH = H * 0.095
    return {
      r,
      axisY,
      x0,
      x1,
      top: axisY - bodyH * 0.46,
      bot: axisY + bodyH * 0.44,
      /** The lamp house stands proud of the body at the back. */
      lampX0: x0 - R * 0.16,
      lampX1: x0 + R * 0.6,
      lampTop: axisY - bodyH * 0.78,
      barrelX1: r.cx + R * 1.18,
      lensX: r.cx + R * 1.38,
      /** The column the whole machine stands on, under the wheel.
       *
       *  Its foot is measured from the TABLE'S datum, not from the wheel, so
       *  the machine stands on the same floor the table's legs stand on. Tied
       *  to the wheel it stopped in mid-air two thirds of the way up the stage
       *  and left the bottom of the act empty — the same dead band the
       *  composition has been pulled up for twice. */
      standHalf: R * 0.21,
      standFoot: Math.max(r.cy + R * 1.2, L.baseY + H * 0.17),
      sgn,
      /** Downstream coordinate to screen coordinate. */
      mx: (x: number) => r.cx + (x - r.cx) * sgn,
    }
  }

  function lens() {
    const pj = projector()
    return { x: pj.mx(pj.lensX), y: pj.axisY }
  }

  /**
   * How far into the run each end is hidden by the machine, in pixels, so the
   * change of state starts where it can actually be seen rather than behind the
   * object it is emerging from.
   */
  function ringRimPx(u: number) {
    // Nothing at the take-up end: the flange's lower rim already hides the last
    // thirty pixels of strip, so the film may stay at full strength right up to
    // where the roll takes it and simply disappear behind the wheel.
    return u < 0.5 ? L.halfH * 0.3 : 0
  }

  /**
   * The three destinations, as ANGLES off the optical axis.
   *
   * They stand on an arc struck from the lens, so all three are at the same
   * throw — same size, same distance — and the only thing separating them is
   * where they sit in the fan. That is what an arc of screens around a
   * projector actually is, and it is a great deal calmer than a column of
   * rectangles ruled up the right-hand margin.
   *
   * They are CIRCLES. A round gate is if anything more filmic than a rectangle:
   * it is the shape of an aperture, of a lens, of the pool of light a lamp
   * throws before anything masks it. It also removes the last thing that made
   * these read as user interface, which was having four corners.
   */
  const DESTINATIONS: { name: string; a: number }[] = [
    { name: 'YouTube', a: -0.53 },
    { name: 'Podcast', a: 0 },
    { name: 'LinkedIn', a: 0.53 },
  ]

  /**
   * Act III's reel needs a single scalar "how much film has gone by"; Act II's
   * clock is the authority on the film's motion, so this DERIVES that scalar
   * rather than keeping a second transport that could drift out of step.
   * Downstream of the blade a material point advances CUT_KEEP frames a cycle,
   * which is what the take-up actually winds.
   */
  function filmPos(t: number) {
    const k = filmClock(t)
    return { pos: k.n * CUT_KEEP + k.sigma, dwell: k.phase === 1 || k.phase === 3 ? 1 : 0 }
  }

  function renderAt(timeMs: number) {
    if (!W || !H) resize()
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const t = timeMs / 1000
    probe.t = t
    // A probe that lies is worse than no probe (Pass 40). The rate this used
    // to report was already one the renderer had stopped using; now that the
    // belt stops and slams, reporting a linear scroll would hide the only thing
    // worth asserting about the motion.
    probe.scroll = filmClock(t).upstream
    probe.cards = []
    probe.zMargin = L.zMargin
    probe.zAmp = L.zAmp
    probe.rollAmp = L.rollTake
    probe.amp = L.feedRise
    probe.headingZ = L.headingZ
    ctx.clearRect(0, 0, W, H)

    if (!OFF.table) drawTable(t)
    drawIntakeBack(t)
    drawFiles(t)
    drawProjectorBody()
    drawStrip(t)
    drawMarks(t)
    drawTransition(t, false)
    drawTransition(t, true)
    drawTitles(t)
    // ACT II. The removed film first — it is on the table, under the tool — and
    // then the tool, which is above the material it works on.
    if (!OFF.offcut) drawOffcuts(t)
    if (!OFF.shoe) drawHoldDowns()
    if (!OFF.press) {
      drawPress(t)
      drawForge(t)
    }
    drawIntakeFront(t)
    drawThrow(t)
    drawReel(t)
    drawDestinations(t)
  }

  let raf = 0
  let running = false
  function loop(now: number) {
    renderAt(now)
    raf = requestAnimationFrame(loop)
  }

  return {
    start() {
      if (running) return
      running = true
      if (prefersReduced || fixedTimeMs !== null) renderAt(fixedTimeMs ?? STILL_MS)
      else raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    resize() {
      resize()
      if (!running || prefersReduced || fixedTimeMs !== null) renderAt(fixedTimeMs ?? STILL_MS)
    },
    renderAt,
    destroy() {
      this.stop()
    },
  }
}
