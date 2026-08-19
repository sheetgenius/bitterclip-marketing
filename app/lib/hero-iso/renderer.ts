/**
 * The assembly line, blocked out in ISOMETRIC. Massing study only — shapes and
 * their positions, no detail, no photography, no lighting model.
 *
 * WHY ISOMETRIC, IN ONE PARAGRAPH. The perspective version had to bend the film
 * through a projection, which meant it could not be drawn as frames at all: it
 * was chopped into ~50 affine slivers, each needing its own mip level, with a
 * curvature guard to stop the ribbon folding through itself, and a 90-degree
 * twist to enter the reel. Every one of those is a consequence of foreshortening
 * that varies along the strip. In an axonometric projection scale is CONSTANT,
 * so a frame is a fixed parallelogram: one quad, one transform, no slivers, no
 * mips, no fold guard, no twist. The hard parts do not get solved here — they
 * stop existing.
 *
 * THE GEOMETRY THAT KILLS THE MORPH. The film lies flat on the table with its
 * WIDTH along z. The reel's axis also points along z. A ribbon whose width runs
 * along the axis of the cylinder it wraps needs no twist to get there — it is
 * already in the right plane. That is the whole reason the film never has to
 * change orientation between the table and the spool.
 */

export interface IsoRenderer {
  start(): void
  stop(): void
  resize(): void
  destroy(): void
}

type V3 = [number, number, number]
type P2 = [number, number]

// ---- the world, in film-widths --------------------------------------------
// x runs along the line, z across it, y up. One unit is one film width.
const FILM_W = 2.05 // across the strip
const PITCH = 2.62 // one frame along it — landscape, so the thumbnail reads

// Half the length it was. The old deck was fourteen units long against a
// one-unit strip, which is what made it read as long and skinny; the fix is
// both ends of that ratio, not just the table.
const TABLE = { x0: 0.4, x1: 9.85, top: 0, z: 2.05, deep: 1.05 }
// THE BED, at the head of the table and part of it.
//
// It was a square floating off in space, which meant a long particle journey
// across empty canvas and an intake that belonged to nothing. Attached to the
// bench and raised a little, it reads as a shallow basin the files drop into —
// and the film extrudes out of a slit in its downstream face, at the belt's own
// height, so nothing has to change plane on the way out.
const BED = { x0: -3.3, x1: 0.5, z: 2.05, top: 0.55 }
// The flange separation IS the film's width. The inner face of each disc lines
// up exactly with the edge of the strip, so the film slides into the bottom of
// the cylinder between them rather than merely arriving near it — and the roll
// already wound on takes over occluding it from there. The hub sits one radius
// above the film's plane so that entry is tangential.
// COMICALLY LARGE, ON PURPOSE. The reel is the motif — it is the thing that
// says cinema before anything else in the frame does. Sized to dominate rather
// than to sit politely in scale with the bench.
// A ROLLER TURNS THE FILM 90 DEGREES, AND THE LAMP SHINES THROUGH IT.
//
// A projector beside the reel never made sense — light was arriving from a box
// that had nothing to do with the film. Bend the strip up at the end of the
// bench and the vertical run IS the slide: the lamp hangs down behind it, the
// light passes through the frame standing in the gate, and what continues to
// the right is that frame. The roller's axis and the reel's axis both lie along
// z, which is the direction the film's width already runs, so the whole path —
// flat, round the corner, and up — still needs no twist anywhere.
const ROLL = { x: 9.75, r: 0.5 }
// A tall climb. The lamp hangs partway up it and the wheel hangs above — with a
// short rise the reel's disc simply covered the lamp, which destroyed the one
// thing the arrangement is for: light passing THROUGH a standing frame.
const RISE = 9.4
// The coil is what the film actually winds onto, so the film's vertical line
// must be tangent to the COIL — which puts the reel's centre one coil-radius to
// the side of it, not directly above the roller. Centred over the roller the
// strip ran into the middle of the wheel instead of touching its rim.
const REEL = { z: 0, r: 3.75, w: FILM_W }
const COIL_F = 0.58 // coil radius as a fraction of the flange
// Behind the wheel in z, so the reel reads as mounted ON it rather than beside.
// The lamp hangs down BEHIND the vertical run and fires along +x through it.
// THE LAMP HOUSE.
//
// It was at z = -3.4 and could not be seen at all, which is why the beams
// appeared to start from nothing. In this projection -z travels UP-LEFT on
// screen — by |z|*sin(AZ) of apparent height — so a lamp set that far back is
// lifted straight into the reel hanging above and left of the climb. Nearer in
// z and lower on the climb it clears the wheel and reads as the source it is.
// THE LAMP SHOOTS ALONG +X, WHICH IS THE ONLY AXIS IT CAN.
//
// The vertical run is a plane spanning y and z, so its NORMAL lies along x —
// light can only pass through it travelling along x. Setting the lamp back in z
// put it beside the film, not behind it, and nothing was ever being shone
// through anything. Offset in -x it sits up-line of the gate, fires down the
// line away from the viewer, and the film stands in the beam.
// THE PROJECTOR IS A YOKE, NOT A BOX ON THE BENCH.
// Two girders bolted to the table plate carry the reel's axle at the top, and
// the light box — a plain cylinder — hangs between them lower down, firing
// along +x through the standing frame. The freestanding house it replaces had
// nothing holding the reel up and nothing tying the lamp to the table: two
// objects that happened to be near each other rather than one machine.
// Each girder is an A-FRAME, not a plate. A single column — tapered or not —
// is a solid bar straight across the wheel, which is the complaint the old
// ceiling stem earned. Two raked legs meeting at the axle carry the same load,
// open a triangle of daylight through the middle of the stand, and put the feet
// out where the table can actually take them.
const YOKE = { t: 0.34, z: FILM_W / 2 + 0.52, foot: 0.72, apex: 0.34, rake: 1.95, splay: 1.15 }
// The light box fires out its END, not its side: axis along x, aiming up the
// line at the film and the reel beyond it. Along z it was broadside to the
// throw, which is a lamp pointing across its own beam.
const BOX = { r: 0.78, len: 1.2 }
const TURRET = { x: 4.1, z: 1.78, y: 1.15 }
const DEST = { x: 17.6, r: 1.5 }

export function createIsoRenderer(canvas: HTMLCanvasElement): IsoRenderer {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) throw new Error('no 2d context')

  let W = 0
  let H = 0
  let dpr = 1
  let S = 1 // world units -> screen px
  let ox = 0
  let oy = 0

  // True isometric: the two ground axes leave the origin at 30 degrees, so a
  // unit square on the ground is a rhombus and verticals stay vertical.
  // AXONOMETRIC, NOT STRICTLY ISOMETRIC.
  //
  // True isometric puts both ground axes at 30 degrees, which sends the line of
  // travel steeply up the frame. Flattening the travel axis toward the camera
  // reads more side-on — you see the LENGTH of the machine rather than looking
  // down a diagonal — while keeping enough angle on the cross axis that the
  // table still shows its top. AX is the travel axis, AZ the one across it.
  const AX = (12 * Math.PI) / 180
  const AZ = (30 * Math.PI) / 180
  const CX = Math.cos(AX)
  const SX = Math.sin(AX)
  const CZ = Math.cos(AZ)
  const SZ = Math.sin(AZ)
  // +x runs right and slightly UP — the direction of travel. +z runs right and
  // down, across the table. +y is straight up.
  const iso = (x: number, y: number, z: number): P2 => [
    ox + (x * CX + z * CZ) * S,
    oy + (-x * SX + z * SZ - y) * S,
  ]

  function poly(pts: P2[], fill: string, stroke?: string) {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  /** A ground-plane quad at height y. */
  const slab = (x0: number, x1: number, z0: number, z1: number, y: number): P2[] => [
    iso(x0, y, z0), iso(x1, y, z0), iso(x1, y, z1), iso(x0, y, z1),
  ]

  /**
   * The barrel of a cylinder, swept between two rims.
   *
   * Filling [far..., near reversed] as ONE polygon looks right and is not: for
   * a closed ring that path crosses itself, so the fill rule leaves most of the
   * barrel empty and you see straight through the solid. One quad per segment
   * has no such problem.
   */
  function sweep(a2: P2[], b2: P2[], fill: string) {
    for (let i = 0; i < a2.length; i++) {
      const j = (i + 1) % a2.length
      poly([a2[i], a2[j], b2[j], b2[i]], fill)
    }
  }

  /** A cuboid: top, then the two faces that can be seen. Three values, one form. */
  function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tone: number) {
    // Order-proof. A caller passing a reversed span used to get an inside-out
    // solid whose visible faces were the ones facing away.
    if (x0 > x1) [x0, x1] = [x1, x0]
    if (y0 > y1) [y0, y1] = [y1, y0]
    if (z0 > z1) [z0, z1] = [z1, z0]
    const l = (k: number) => `hsl(232 8% ${(tone * k).toFixed(1)}%)`
    poly([iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)], l(1)) // top
    poly([iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y0, z1), iso(x0, y0, z1)], l(0.62)) // +z, down-right
    poly([iso(x0, y1, z0), iso(x0, y1, z1), iso(x0, y0, z1), iso(x0, y0, z0)], l(0.42)) // -x, down-left
  }

  // ---- transport: smooth and continuous -----------------------------------
  //
  // It used to index — advance a frame, stop, be worked on, advance. That was
  // the right answer while the tools were a blade and a press, which have to
  // strike something stationary. A laser does not: it enhances the film as it
  // passes. So the line runs, and the reel is driven off the same number, which
  // is what makes them read as one machine rather than two animations.
  const FILM_SPEED = 1.45 // world units per second
  const filmDist = (t: number) => t * FILM_SPEED

  /** Film y at the belt, and the reel's centre solved off the vertical run. */
  const beltY = () => TABLE.top + 0.02
  const gateY = () => beltY() + ROLL.r + RISE // top of the climb = the tangent point
  const coilR = () => REEL.r * COIL_F
  // THE COIL'S RIM LINES UP WITH THE CLIMB — not the flange's.
  //
  // The film climbs at x = ROLL.x, which is the right edge of the 90 degree
  // pulley. What the strip actually winds onto is the ROLL, so it is the coil's
  // rim that has to sit on that line; the flanges are larger and therefore
  // overhang it, which is exactly right — the film runs up, meets the roll, and
  // is hidden by the near flange on its way in. Aligning the flange instead put
  // the wound film a whole flange-overhang away from the strip feeding it.
  const reelX = () => ROLL.x - coilR()
  const reelY = () => gateY()
  /** Where the lamp fires through the standing frame. */
  // THE GATE SITS LOW ON THE CLIMB.
  //
  // Higher up it kept disappearing: the wheel hangs above and left of the
  // column, and a lamp set back in z is lifted up-left by |z|*sin(AZ), so the
  // two kept landing on the same pixels however the numbers were nudged. Down
  // near the roller there is nothing above it and the whole assembly reads.
  const lampY = () => beltY() + ROLL.r + RISE * 0.13

  function layout() {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = Math.round(r.width)
    H = Math.round(r.height)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Fit the whole line across the stage with a margin, then centre it.
    S = 1
    ox = 0
    oy = 0
    const probe: V3[] = [
      [BED.x0, BED.top + 4.6, 0], [BED.x0, -TABLE.deep, TABLE.z],
      [DEST.x + DEST.r, lampY() + 3.0, 0], [DEST.x, lampY() - 3.0, 0],
      [reelX() + REEL.r, reelY() + REEL.r, REEL.z - REEL.w / 2], [reelX(), TABLE.top, YOKE.z],
      [TABLE.x1, 0, -TABLE.z], [ROLL.x, beltY(), TABLE.z],
    ]
    const pts = probe.map((p) => iso(p[0], p[1], p[2]))
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const bw = Math.max(...xs) - Math.min(...xs)
    const bh = Math.max(...ys) - Math.min(...ys)
    // Biased, not centred. The top-left of the frame is reserved for the hero
    // line and its call to action, so the machine is fitted into the right of
    // the stage and dropped slightly — a diagonal composition centred on its
    // bounding box just puts the empty corner in the wrong place.
    S = Math.min((W * 0.72) / bw, (H * 0.86) / bh)
    const p2 = probe.map((p) => iso(p[0], p[1], p[2]))
    const x2 = p2.map((p) => p[0])
    const y2 = p2.map((p) => p[1])
    ox = W * 0.60 - (Math.min(...x2) + Math.max(...x2)) / 2
    oy = H * 0.52 - (Math.min(...y2) + Math.max(...y2)) / 2
  }

  function draw(t: number) {
    ctx.clearRect(0, 0, W, H)
    const dist = filmDist(t)

    // ---- painted BACK TO FRONT ---------------------------------------------
    // Occlusion here is painter's order and the order is depth in z: -z is
    // away from the viewer, +z toward. The lamp hangs behind the vertical run,
    // so it has to go down before the film — what leaves the gate has been
    // THROUGH the standing frame, and that only reads if the film is painted
    // over the lamp rather than under it.
    // The reel is a circle in the x-y plane, so its axis lies along z — the same
    // axis the film's width already runs along. In isometric that circle draws
    // as an ellipse whose major axis follows the ground's x direction.

    // ---- the table ---------------------------------------------------------
    box(TABLE.x0, TABLE.x1, -TABLE.deep, TABLE.top, -TABLE.z, TABLE.z, 15)

    // ---- the film ----------------------------------------------------------
    // Flat on the table, width along z, one quad per frame. This is the whole
    // point of the projection: no slivers, no twist, no fold.
    const y = beltY()
    const START = BED.x1 - 0.25
    // The flat run ends at the roller's BOTTOM tangent, not at its axis. Running
    // it to ROLL.x made the film turn a hard 90-degree corner through the solid
    // barrel — the strip covered the pulley completely and the bend read as a
    // crease rather than a wrap.
    const runFlat = ROLL.x - ROLL.r - START
    const ARC = ROLL.r * Math.PI / 2
    const runVert = runFlat + ARC
    const off = dist % PITCH
    // One continuous strip measured along its own length: flat while that
    // length is still on the bench, vertical once it has gone round the roller.
    const total = runVert + RISE
    // Draw one frame as up to TWO pieces: whatever of it is still on the bench,
    // and whatever has already gone round the roller. A frame straddling the
    // corner used to satisfy neither branch and simply vanished, which left a
    // hole in the strip at the bend — and anything past the tangent point used
    // to be drawn ABOVE the reel, which is the film poking out of the top.
    const flatQuad = (s0: number, s1: number, tone: string) =>
      poly(slab(START + s0, START + s1, -FILM_W / 2, FILM_W / 2, y), tone)
    // The quarter turn itself, as a fan of small quads around the barrel. One
    // straight quad across the corner cut the roller visibly flat.
    const arcQuad = (s0: number, s1: number, tone: string) => {
      const cx = ROLL.x - ROLL.r
      const cy = y + ROLL.r
      const at = (sv: number) => -Math.PI / 2 + ((sv - runFlat) / ARC) * (Math.PI / 2)
      const steps = Math.max(2, Math.ceil((s1 - s0) / ARC * 10))
      for (let k = 0; k < steps; k++) {
        const a0 = at(s0 + ((s1 - s0) * k) / steps)
        const a1 = at(s0 + ((s1 - s0) * (k + 1)) / steps)
        const p0 = [cx + Math.cos(a0) * ROLL.r, cy + Math.sin(a0) * ROLL.r]
        const p1 = [cx + Math.cos(a1) * ROLL.r, cy + Math.sin(a1) * ROLL.r]
        poly([
          iso(p0[0], p0[1], -FILM_W / 2), iso(p1[0], p1[1], -FILM_W / 2),
          iso(p1[0], p1[1], FILM_W / 2), iso(p0[0], p0[1], FILM_W / 2),
        ], tone)
      }
    }
    const riseQuad = (s0: number, s1: number, tone: string) => {
      const y0 = y + ROLL.r + (s0 - runVert)
      const y1 = y + ROLL.r + (s1 - runVert)
      poly([
        iso(ROLL.x, y0, -FILM_W / 2), iso(ROLL.x, y1, -FILM_W / 2),
        iso(ROLL.x, y1, FILM_W / 2), iso(ROLL.x, y0, FILM_W / 2),
      ], tone)
    }
    for (let i = -1; i * PITCH < total + PITCH; i++) {
      const s0 = i * PITCH + off
      if (s0 >= total) continue // past the tangent point: it is on the roll now
      const s1 = Math.min(s0 + PITCH * 0.94, total)
      if (s1 <= 0) continue
      const cut = ((Math.round((i * PITCH + off - dist) / PITCH) % 9) + 9) % 9 === 0
      // Alternating stock values give the strip a beat, so a viewer can see it
      // MOVE. A single flat tone slides past looking like a static ribbon.
      const alt = ((Math.round((i * PITCH + off - dist) / PITCH) % 2) + 2) % 2 === 0
      const tone = cut ? '#41302f' : alt ? '#77715f' : '#6b6558'
      const lo = Math.max(s0, 0)
      // A frame can straddle any two of the three runs, so clip it against all
      // three rather than branching on a single boundary — the old two-way test
      // dropped whatever spanned the corner.
      if (lo < Math.min(s1, runFlat)) flatQuad(lo, Math.min(s1, runFlat), tone)
      if (Math.max(lo, runFlat) < Math.min(s1, runVert)) arcQuad(Math.max(lo, runFlat), Math.min(s1, runVert), tone)
      if (Math.max(lo, runVert) < s1) riseQuad(Math.max(lo, runVert), s1, tone)
    }

    // ---- the roller the film bends around ---------------------------------
    // Painted AFTER the film, and this is a fact about the CAMERA, not about
    // pulleys. The projection's view direction is (-0.886, 0.684, 1): we look at
    // this machine from -x, above, and in front. The film wraps the roller's
    // bottom-right quarter — which is the quarter facing AWAY from us. Every
    // point of that wrap is behind the barrel, so the barrel has to be painted
    // over it. Drawn the other way round the strip lay across the cylinder like
    // a decal and the pulley had no mass at all.
    {
      const ry = beltY()
      // A FLANGED pulley, and both dimensions run proud of the film: the barrel
      // sits a hair outside the wrap radius so the strip cannot peek around the
      // silhouette, and the rims run wider in z so they overhang the stock. The
      // film should vanish at the left edge of this cylinder and reappear
      // climbing on the right.
      const rrad = ROLL.r * 1.03
      const rw = FILM_W / 2 + 0.26
      const rollPts = (cz: number): P2[] => {
        const out: P2[] = []
        for (let i = 0; i < 40; i++) {
          const a2 = (i / 40) * Math.PI * 2
          out.push(iso(ROLL.x - ROLL.r + Math.cos(a2) * rrad, ry + ROLL.r + Math.sin(a2) * rrad, cz))
        }
        return out
      }
      // Far rim, the barrel swept between the rims, then the near rim. Two discs
      // with nothing between them is a pair of hoops; the swept band is what
      // makes it a cylinder the film can bend around.
      const rFar = rollPts(-rw)
      const rNear = rollPts(rw)
      poly(rFar, '#24242b')
      sweep(rFar, rNear, '#31313a')
      poly(rNear, '#474751')
    }

    // ---- the bed, and the files falling into it ----------------------------
    box(BED.x0, BED.x1, -TABLE.deep, BED.top, -BED.z, BED.z, 18)
    // A dashed rim on the lip: still the drop target, just no longer floating.
    const lip = slab(BED.x0 + 0.25, BED.x1 - 0.25, -BED.z + 0.25, BED.z - 0.25, BED.top + 0.01)
    poly(lip, 'rgba(242,143,132,0.07)')
    // A darker well inside the rim, so the bed reads as a basin with depth
    // rather than a rectangle painted on the bench top.
    poly(slab(BED.x0 + 0.55, BED.x1 - 0.55, -BED.z + 0.55, BED.z - 0.55, BED.top - 0.02), 'rgba(30,14,12,0.85)')
    ctx.save()
    ctx.setLineDash([5, 6])
    ctx.strokeStyle = 'rgba(242,143,132,0.34)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(lip[0][0], lip[0][1])
    for (let i = 1; i < lip.length; i++) ctx.lineTo(lip[i][0], lip[i][1])
    ctx.closePath()
    ctx.stroke()
    ctx.restore()

    // FILES FALL UNDER GRAVITY, LAND, AND DISSOLVE.
    //
    // Not an ease. A file accelerates the whole way down — so the distance it
    // covers goes with the square of the time — arrives, stops dead on the
    // bed, and then takes a second or so to go. The stopping is the point: a
    // thing that decelerates into place looks placed, and a thing that hits
    // looks dropped.
    // ONE RECORDING AT A TIME, AND NOT OFTEN.
    //
    // Three files falling on a loop read as a conveyor of identical objects,
    // which is both untrue and dull: you do not drop a session every second.
    // One arrives, lands, soaks into the bed and is gone, and then there is a
    // pause before the next. What it becomes in the meantime is a LOT of film —
    // the belt keeps producing frames the whole time it is absent, which is the
    // actual claim: one recording in, a great many frames out.
    const FALL_S = 1.05
    const SOAK_S = 1.9
    const GAP_S = 3.4
    const LIFE = FALL_S + SOAK_S + GAP_S
    const bx = (BED.x0 + BED.x1) / 2
    {
      const age = t % LIFE
      if (age < FALL_S + SOAK_S) {
        let fy: number
        let a2 = 0.6
        if (age < FALL_S) {
          const u = age / FALL_S
          fy = BED.top - 0.06 + 4.6 * (1 - u * u) // constant acceleration downward
        } else {
          fy = BED.top - 0.06
          a2 = 0.6 * Math.pow(1 - (age - FALL_S) / SOAK_S, 1.5)
        }
        poly(slab(bx - 1.15, bx + 1.15, -1.15, 1.15, fy), `rgba(214,209,200,${a2.toFixed(3)})`)
      }
    }

    // ---- two laser turrets, one either side of the table -------------------
    for (const sgn of [-1, 1]) {
      box(TURRET.x - 0.46, TURRET.x + 0.46, 0, TURRET.y * 0.62, sgn * TURRET.z - 0.46, sgn * TURRET.z + 0.46, 27)
      // a head on a body, so it reads as an instrument aimed at the strip
      // Cant the head toward the strip on BOTH sides. Writing the far edge as
      // sgn*(z-0.34) flipped the span on one side, so one turret was drawn with
      // z0 > z1 — an inside-out box whose faces shade backwards.
      const hz = sgn * TURRET.z
      box(TURRET.x - 0.26, TURRET.x + 0.26, TURRET.y * 0.62, TURRET.y,
        Math.min(hz - sgn * 0.34, hz + sgn * 0.26), Math.max(hz - sgn * 0.34, hz + sgn * 0.26), 38)
    }
    // one of them is firing at the frame standing in the middle of the table
    const tgt = iso(TURRET.x, y, 0)
    ctx.strokeStyle = 'rgba(255,176,166,0.9)'
    ctx.lineWidth = 1.15
    for (const sgn of [-1, 1]) {
      const src = iso(TURRET.x, TURRET.y, sgn * (TURRET.z - 0.4))
      ctx.beginPath()
      ctx.moveTo(src[0], src[1])
      ctx.lineTo(tgt[0], tgt[1])
      ctx.stroke()
    }

    // ---- the projector, and the reel mounted to it -------------------------
    // THE REEL IS A CYLINDER, NOT A DISC.
    //
    // Drawn as one ellipse with a hole it read as a washer glued to a box. A
    // reel is two flanges with the wound roll between them, and the film's
    // width already lies along z — which is this cylinder's own axis — so the
    // strip runs straight in at the bottom without rotating.
    // The girders. Same plate either side of the reel, straddling it in z, so
    // the far one goes down before the wheel and the near one after — that is
    // what makes it read as a yoke the reel is held INSIDE rather than two
    // posts standing near it.
    const girder = (sgn: number, near: boolean) => {
      const z0 = sgn * YOKE.z - YOKE.t / 2
      const z1 = sgn * YOKE.z + YOKE.t / 2
      // One leg: a raked trapezoid from a foot on the table up to the axle.
      const leg = (bx: number, tx: number) => {
        const prof = (cz: number): P2[] => [
          iso(bx - YOKE.foot / 2, TABLE.top, cz),
          iso(tx - YOKE.apex / 2, reelY(), cz),
          iso(tx + YOKE.apex / 2, reelY(), cz),
          iso(bx + YOKE.foot / 2, TABLE.top, cz),
        ]
        const a = prof(z0)
        const b = prof(z1)
        poly(a, near ? '#2b2b34' : '#191920')
        sweep(a, b, near ? '#35353f' : '#212128')
        poly(b, near ? '#40404b' : '#26262e')
      }
      leg(reelX() - YOKE.rake, reelX() - YOKE.apex * 0.55)
      leg(reelX() + YOKE.splay, reelX() + YOKE.apex * 0.55)
      if (near) {
        // the bearing the axle turns in, so the wheel is visibly HELD
        const boss: P2[] = []
        for (let i = 0; i < 28; i++) {
          const a2 = (i / 28) * Math.PI * 2
          boss.push(iso(reelX() + Math.cos(a2) * 0.42, reelY() + Math.sin(a2) * 0.42, z1))
        }
        poly(boss, '#4d4d59')
      }
    }
    girder(-1, false)

    // The light box, slung between the girders. Its axis runs along x — up the
    // machine's own line — so it fires out of its FAR end cap, the one turned
    // away from us. That cap is invisible by construction: the view direction is
    // (-0.886, 0.684, 1), so every +x face is turned away. Correct, not a bug —
    // the projector shoots away from the camera. What we see is the near cap,
    // the barrel, and the light leaving the far end.
    const barrel = (cx: number): P2[] => {
      const out: P2[] = []
      for (let i = 0; i < 40; i++) {
        const a2 = (i / 40) * Math.PI * 2
        out.push(iso(cx, lampY() + Math.sin(a2) * BOX.r, Math.cos(a2) * BOX.r))
      }
      return out
    }
    const bMuzzle = barrel(reelX() + BOX.len)
    const bBack = barrel(reelX() - BOX.len)
    // The throw, emitted at the muzzle so it emerges from behind the housing
    // rather than starting in mid-air beside it.
    {
      const sq = (cx: number, r: number): P2[] => [
        iso(cx, lampY() - r, -r), iso(cx, lampY() + r, -r),
        iso(cx, lampY() + r, r), iso(cx, lampY() - r, r),
      ]
      sweep(sq(reelX() + BOX.len * 0.4, 0.3), sq(ROLL.x, 0.46), 'rgba(226,226,240,0.085)')
    }
    // Muzzle first and bright: the barrel covers all of it but the crescent
    // that forms the silhouette, which is exactly where spill would show.
    poly(bMuzzle, 'rgba(236,236,246,0.85)')
    sweep(bMuzzle, bBack, '#2c2c35')
    poly(bBack, '#3a3a45')
    // Two cradle bars carrying the barrel, running the full width in z so they
    // reach BOTH A-frames. The stubs they replace ran outward at the reel's own
    // x — but at lamp height the legs are nowhere near that line, so they ended
    // in mid-air holding nothing.
    for (const bx of [reelX() - 0.95, reelX() + 0.95]) {
      box(bx - 0.16, bx + 0.16, lampY() - BOX.r - 0.24, lampY() - BOX.r + 0.1,
        -YOKE.z - YOKE.t / 2, YOKE.z + YOKE.t / 2, 21)
    }

    const ring = (cz: number, rad: number): P2[] => {
      const out: P2[] = []
      for (let i = 0; i < 56; i++) {
        const a2 = (i / 56) * Math.PI * 2
        out.push(iso(reelX() + Math.cos(a2) * rad, reelY() + Math.sin(a2) * rad, cz))
      }
      return out
    }
    const zF = REEL.z - REEL.w / 2
    const zN = REEL.z + REEL.w / 2
    // ONE radius, not two. The roll used to be drawn at its own hard-coded
    // fraction while the reel's placement and its spin were derived from
    // coilR() — three numbers for one quantity, and the coil sat proud of the
    // film column that is supposed to be tangent to it.
    const rr = coilR()

    poly(ring(zF, REEL.r), '#15151a') // far flange
    // the roll, as a band swept between the two flanges
    sweep(ring(zF, rr), ring(zN, rr), '#3c3c47')
    // near flange, as a RING so the roll shows through the middle
    ctx.beginPath()
    const of2 = ring(zN, REEL.r)
    ctx.moveTo(of2[0][0], of2[0][1])
    for (let i = 1; i < of2.length; i++) ctx.lineTo(of2[i][0], of2[i][1])
    ctx.closePath()
    const inr = ring(zN, rr * 0.72)
    ctx.moveTo(inr[0][0], inr[0][1])
    for (let i = inr.length - 1; i >= 1; i--) ctx.lineTo(inr[i][0], inr[i][1])
    ctx.closePath()
    ctx.fillStyle = '#2e2e37'
    ctx.fill('evenodd')
    // the hub, and the axle running back into the projector behind it
    poly(ring(zN, REEL.r * 0.2), '#454551')
    // The near flange's outer edge sat against the far flange with nothing to
    // separate them, so the silhouette read as one blob at the top left.
    ctx.beginPath()
    ctx.moveTo(of2[0][0], of2[0][1])
    for (let i = 1; i < of2.length; i++) ctx.lineTo(of2[i][0], of2[i][1])
    ctx.closePath()
    ctx.strokeStyle = 'rgba(150,150,170,0.30)'
    ctx.lineWidth = 1.1
    ctx.stroke()

    // THE REEL IS TURNED BY THE FILM, not by a clock of its own. The strip winds
    // onto the coil, so the angle is simply the distance travelled divided by
    // the radius it is winding at — set it by hand and a viewer reads two
    // animations; drive it off the transport and they read one machine.
    // Contact on the right of the coil, film travelling up: the wheel turns
    // counterclockwise in world, which this projection (negative determinant,
    // world y up against screen y down) shows as clockwise.
    const spin = dist / coilR()
    ctx.save()
    ctx.strokeStyle = 'rgba(150,152,172,0.55)'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    for (let i = 0; i < 6; i++) {
      const a2 = spin + (i / 6) * Math.PI * 2
      const p0 = iso(reelX() + Math.cos(a2) * REEL.r * 0.22, reelY() + Math.sin(a2) * REEL.r * 0.22, zN)
      const p1 = iso(reelX() + Math.cos(a2) * rr * 0.99, reelY() + Math.sin(a2) * rr * 0.99, zN)
      ctx.beginPath()
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.stroke()
    }
    ctx.restore()
    // and the near girder, over the wheel: the reel hangs INSIDE the yoke
    girder(1, true)

    // ---- three destinations & chromatic prism beam ------------------------
    // The throw leaves the lens and splits through a prism into three equal colored
    // beams carrying the stream to YouTube, Podcast, and LinkedIn.
    // The throw starts AT the film, because what continues past this point has
    // been through the frame standing in the gate — that is the whole idea.
    const lens = iso(ROLL.x, lampY(), 0)

    const DESTINATIONS = [
      {
        name: 'YouTube',
        color: '#ff0033',
        beamMid: 'rgba(255, 0, 51, 0.11)',
        beamEnd: 'rgba(255, 0, 51, 0.04)',
        rim: 'rgba(255, 0, 51, 0.9)',
      },
      {
        name: 'Podcast',
        color: '#872ec4',
        beamMid: 'rgba(155, 81, 224, 0.12)',
        beamEnd: 'rgba(135, 46, 196, 0.04)',
        rim: 'rgba(155, 81, 224, 0.9)',
      },
      {
        name: 'LinkedIn',
        color: '#0a66c2',
        beamMid: 'rgba(10, 102, 194, 0.12)',
        beamEnd: 'rgba(10, 102, 194, 0.04)',
        rim: 'rgba(10, 102, 194, 0.9)',
      },
    ]

    // Draw the 3-way prism beam split
    ctx.save()
    for (let i = 0; i < DESTINATIONS.length; i++) {
      const dest = DESTINATIONS[i]
      const yTop = lampY() + 3.6 - i * 2.4
      const yBot = lampY() + 1.2 - i * 2.4
      const pTop = iso(DEST.x, yTop, 0)
      const pBot = iso(DEST.x, yBot, 0)
      const pMid = iso(DEST.x, lampY() + 2.4 - i * 2.4, 0)

      const grad = ctx.createLinearGradient(lens[0], lens[1], pMid[0], pMid[1])
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.16)')
      grad.addColorStop(0.18, dest.beamMid)
      grad.addColorStop(1, dest.beamEnd)

      poly([lens, pTop, pBot], grad as unknown as string)

      // Prism ray dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(lens[0], lens[1])
      ctx.lineTo(pTop[0], pTop[1])
      ctx.stroke()
    }
    // Bottom edge line of lowest beam
    const pLowest = iso(DEST.x, lampY() - 3.6, 0)
    ctx.beginPath()
    ctx.moveTo(lens[0], lens[1])
    ctx.lineTo(pLowest[0], pLowest[1])
    ctx.stroke()
    ctx.restore()

    // Draw destination badges, icons, and labels
    const rad = DEST.r * S * 0.52
    ctx.save()
    ctx.font = `${Math.max(9, Math.round(S * 0.42))}px "IBM Plex Mono", ui-monospace, monospace`
    for (let i = 0; i < DESTINATIONS.length; i++) {
      const dest = DESTINATIONS[i]
      const dy = lampY() + 2.4 - i * 2.4
      const p = iso(DEST.x, dy, 0)

      // Solid dark base
      ctx.beginPath()
      ctx.arc(p[0], p[1], rad, 0, Math.PI * 2)
      ctx.fillStyle = '#121217'
      ctx.fill()

      // Brand background circle
      ctx.beginPath()
      ctx.arc(p[0], p[1], rad * 0.94, 0, Math.PI * 2)
      ctx.fillStyle = dest.color
      ctx.fill()

      // Outer rim
      ctx.beginPath()
      ctx.arc(p[0], p[1], rad, 0, Math.PI * 2)
      ctx.strokeStyle = dest.rim
      ctx.lineWidth = 1.4
      ctx.stroke()

      // Platform vector icons
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#ffffff'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (i === 0) {
        // YouTube: canonical play triangle
        const s = rad * 0.38
        ctx.beginPath()
        ctx.moveTo(p[0] - s * 0.6 + rad * 0.05, p[1] - s)
        ctx.lineTo(p[0] + s * 0.95 + rad * 0.05, p[1])
        ctx.lineTo(p[0] - s * 0.6 + rad * 0.05, p[1] + s)
        ctx.closePath()
        ctx.fill()
      } else if (i === 1) {
        // Podcast: Apple Podcasts broadcast arcs + stem
        // Central dot (head)
        ctx.beginPath()
        ctx.arc(p[0], p[1] - rad * 0.06, rad * 0.16, 0, Math.PI * 2)
        ctx.fill()

        // Stem & base
        ctx.lineWidth = Math.max(1.2, rad * 0.12)
        ctx.beginPath()
        ctx.moveTo(p[0], p[1] + rad * 0.08)
        ctx.lineTo(p[0], p[1] + rad * 0.44)
        ctx.stroke()

        // Radiating broadcast arcs
        ctx.lineWidth = Math.max(1.1, rad * 0.09)
        // Inner arc pair
        ctx.beginPath()
        ctx.arc(p[0], p[1] - rad * 0.06, rad * 0.35, -Math.PI * 0.4, Math.PI * 0.4)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(p[0], p[1] - rad * 0.06, rad * 0.35, Math.PI * 0.6, Math.PI * 1.4)
        ctx.stroke()
        // Outer arc pair
        ctx.beginPath()
        ctx.arc(p[0], p[1] - rad * 0.06, rad * 0.58, -Math.PI * 0.36, Math.PI * 0.36)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(p[0], p[1] - rad * 0.06, rad * 0.58, Math.PI * 0.64, Math.PI * 1.36)
        ctx.stroke()
      } else if (i === 2) {
        // LinkedIn: canonical "in" logo
        const ix = p[0] - rad * 0.32
        const iy = p[1] - rad * 0.34
        // 'i' dot
        ctx.beginPath()
        ctx.arc(ix + rad * 0.07, iy, rad * 0.085, 0, Math.PI * 2)
        ctx.fill()
        // 'i' stem
        ctx.fillRect(ix, p[1] - rad * 0.12, rad * 0.14, rad * 0.52)

        // 'n'
        const nx = p[0] - rad * 0.03
        // left stem
        ctx.fillRect(nx, p[1] - rad * 0.12, rad * 0.14, rad * 0.52)
        // arch & right stem
        ctx.beginPath()
        ctx.moveTo(nx + rad * 0.08, p[1] - rad * 0.04)
        ctx.quadraticCurveTo(p[0] + rad * 0.19, p[1] - rad * 0.22, p[0] + rad * 0.34, p[1] - rad * 0.02)
        ctx.lineTo(p[0] + rad * 0.34, p[1] + rad * 0.40)
        ctx.lineTo(p[0] + rad * 0.20, p[1] + rad * 0.40)
        ctx.lineTo(p[0] + rad * 0.20, p[1] + rad * 0.08)
        ctx.quadraticCurveTo(p[0] + rad * 0.20, p[1] - rad * 0.07, nx + rad * 0.14, p[1] - rad * 0.01)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      // Label next to destination node
      ctx.fillStyle = 'rgba(244, 244, 245, 0.75)'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(dest.name, p[0] + rad + 8, p[1])
    }
    ctx.restore()
  }

  let raf = 0
  let running = false
  function loop(now: number) {
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
    resize() {
      layout()
      if (!running) draw(0)
    },
    destroy() {
      this.stop()
    },
  }
}
