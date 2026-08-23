# The isometric hero — design brief

> **Status: historical ISO predecessor.** Do not apply this brief to current
> ISO4 or alter ISO3 from it. Current authority is
> [`hero-iso4-brief.md`](hero-iso4-brief.md).

Prototype route: **`/lab/iso`**
Renderer: **`app/lib/hero-iso/renderer.ts`** (~830 lines, Canvas 2D, no dependencies)
Mount: `app/components/HeroIso.client.vue` · Page: `app/pages/lab/iso.vue`
Workshop charter: **`docs/hero-iso-workshop-start.md`** (phases, visual-appendage
protocol, loop mechanics — read it alongside this brief)

This is the direction. Everything below exists so the next person can keep
workshopping it without re-deriving the decisions or re-making the mistakes.

---

## 1. The concept, in one sentence

**A cinematic isometric machine — a metaphor for BitterClip — that an anonymous
visitor understands in three seconds without reading a word.**

Every part of that sentence is load-bearing:

- **Cinematic.** The vocabulary is film: a reel, a gate, a lamp, a bench, a
  strip of frames. The reel especially. It is deliberately oversized because it
  is the one object on earth that says *cinema* instantly, from any distance, at
  any resolution, to anyone. It is the logo the composition doesn't have.
- **Isometric.** Not a style choice — an engineering one. See §3.
- **A machine.** Not an illustration of a machine. It has to look like it would
  work: things stand on other things, loads have paths to the ground, nothing
  floats, nothing is held by nothing. Believability is what makes it read as an
  *industrial process* rather than as decoration.
- **A metaphor for BitterClip.** The machine's stations map one-to-one onto what
  the product actually does. See §2.
- **Immediately legible.** The visitor has never heard of us. They should not
  need the copy to get the idea. The copy confirms what the picture already
  said; it does not carry it.

The one idea the picture has to land: **raw recordings go in at one end,
finished shows come out the other, and the work in between is done for you.**
The hero line is now the same idea in four words — *"Footage in / Episodes out"* (owner, 2026-08-18; it replaced the earlier punchline *"You still gotta
record"* and its subline). Line and picture say one thing, so the legibility
bar is unchanged: the picture must still make the argument entirely on its
own, and the line confirms it rather than carrying it.

## 2. The metaphor, station by station

The line runs **bottom-left to top-right**, along +x. Read it in that order.

| Station | What you see | What it means |
| --- | --- | --- |
| **The bed** | A shallow basin at the head of the bench, dashed warm rim. Files fall vertically into it, land, and dissolve over ~2s. | Ingest. You drop in a recording. |
| **The extrusion** | Film emerges from a slit in the bed's downstream face, already flat, already at bench height. | One file becomes many frames. **This is the point of the bed:** it resolves a 90° plane change (files fall vertically, film lies flat) by *dematerialising* rather than by bending anything. |
| **The bench** | A long flat deck. The strip runs across it, frames alternating in tone so you can see it move. | The workshop. The cutting-room floor. |
| **The turrets** | Two small instruments either side, firing a thin beam that converges on the passing strip. | Automated editing. Lasers, not blades — a blade has to strike something stationary, which forces a stop-and-go transport. A laser enhances film *as it passes*, so **the line never stops**. That was a deliberate reversal of an earlier indexed design. |
| **The roller** | A flanged pulley. The film wraps it through 90° and climbs. | Nothing semantic — it's the mechanism that gets the film from the horizontal plane to the vertical one without a morph. |
| **The rig** | Two stands, each a plumb mast under the axle with one raked brace (reworked 2026-08-18 from tie-barred A-frames — the vertical masts keep the climb's screen band clean). | Structure. It exists to make the reel's height *believable* and to carry the lamp. |
| **The lamp** | A cylinder journalled on a cross-shaft spanning mast to mast at half the rig's height (owner ruling), axis along the line, firing at the standing frame. | Publishing. It is a projector. |
| **The reel** | A large two-flange reel, film winding onto the coil from below. Turns at the film's own rate. | The finished show, accumulating. |
| **The throw** | Three coloured beams leaving the gate. | Distribution. |
| **The destinations** | YouTube, Podcast, LinkedIn. | Where it goes. |

**Rhythm.** One recording drops roughly every 6.4s (`FALL_S 1.05` +
`SOAK_S 1.9` + `GAP_S 3.4`), and that single file yields a continuous run of
many frames. Earlier versions spammed files in at high frequency, which read as
noise and broke the one-file-becomes-many-thumbnails idea. **One in, many out**
is the shape of the rhythm; keep it.

## 3. Why isometric — do not undo this

There was a perspective version of the same idea at `/lab/line`
(`app/lib/hero-line/renderer.ts`, ~4,280 lines; retired 2026-08-18 along with
the `/lab/ribbon` three.js study — recover either from git history at
`0d923ca^` if ever needed). It worked, and it cost all of this: the film had to be chopped into ~50 affine slivers, each needing its own
manually-built mip level; a curvature guard to stop the ribbon folding through
itself; a 90° twist to enter the reel; and a long fight against shimmer and
crawl on the thumbnails.

Every one of those problems is a consequence of **foreshortening that varies
along the strip**. In an axonometric projection, scale is *constant*. So:

- a frame is a fixed parallelogram — **one quad**, one transform;
- no slivers, no mip pyramid, no fold guard;
- and the film's width runs along **z**, which is *also* the axis of both the
  roller and the reel — so a ribbon wrapping either of them **needs no twist**.
  It is already in the right plane.

The hard parts don't get solved here. They stop existing. That is the whole
argument for the projection, and it is why 830 lines does what 4,280 does.

## 4. Two camera facts that will bite you

Both of these have already caused wrong work. Read them before moving anything.

```
sx = ( x·cos(12°) + z·cos(30°) ) · S
sy = ( −x·sin(12°) + z·sin(30°) − y ) · S      (screen y is DOWN)
```

**(a) The view direction is `(−0.886, 0.684, 1)`.** We look at this machine
from **−x, above, and in front**. Consequences:

- **Every +x face is turned away from us.** The lamp's muzzle is invisible *by
  construction*. That is correct — the projector shoots away from the camera —
  not a bug to be fixed by rotating it back.
- **The film wraps the roller's bottom-right quarter, which faces away.** So the
  roller is painted **after** the film and occludes it. Painting it "over the
  wrap because film wraps over pulleys" is the intuitive answer and it is wrong
  here; it makes the strip look like a decal and the pulley look massless.

**(b) The projection has a negative determinant.** World-counterclockwise reads
as screen-clockwise. The reel winds film on from below, turning
counterclockwise in world — which you will see as clockwise on screen. Don't
"fix" it by eye.

Also: **NaN silently draws nothing.** Canvas 2D throws no error. This cost three
separate debugging sessions. If a shape vanishes, check for NaN first.

## 5. Current state

**As of the 2026-08-18 workshop block (commits `2000c55…f633974`), the study
has moved well past massing.** Blocking remains coherent (occlusion verified,
reel spin still driven off the transport, composition biased right for the
type column) and on top of it:

- **Film language.** The near flange is a plate pierced by five rotating round
  windows (a projection reel — this killed a cold-eye "satellite dish" read);
  the wound coil shows its face, winding rings, and a fresh outer lap in the
  strip's own khaki so the feed visibly accumulates. Sprocket perforations run
  both edges of the strip; frame gaps read as separators.
- **Geometry rework.** Masts are plumb under the axle with one raked brace each
  (the old A-frame splay swept across the climb); the lamp sits at mid-rig on
  a visible cross-shaft (owner ruling); slim base pads; die-gate bridge at the
  bed's mouth; two clamp bars at the gate.
- **Noir lighting (owner reversal of the old no-glow rule).** The machine
  lights its own stage: acid glow breathing on the drop cycle in the bed, laser
  hit pool + emitter glints, gradient throw shaft with a muzzle halo painted
  over hardware, a near-clipping hot core in the gate, density falloff along
  the climb, hard rims keeping the dark wheel's edge against the void, machined
  speculars on roller and hub, stronger prism fan with a hot origin.
- **Captions etched.** Frames arrive bare and leave lettered: two abstract
  subtitle bars burn into a frame's lower third the moment its centre crosses
  the turret beam plane.

Naive cold reads (agy) now narrate the full pipeline unprompted: ingest →
laser-processed filmstrip → take-up reel → gate splits to YouTube/Podcast/
LinkedIn.

**Remaining queue, in priority order** (see `docs/hero-iso-nit-ledger.md` for
who saw what):

1. The turret bodies are still toy cubes — they need instrument-grade detail
   (nose optics, a yoke, a cable) to match the rest.
2. The falling folder is a flat slab with a tab; the drop would read better
   with mass (thickness, a face seam) and the bed dissolve is still an alpha
   fade, not particles at the table's plane.
3. Box-shading is a fixed top-lit convention that no scene light motivates —
   good enough under the noir rims, but a targeted relight of key faces (mast
   inner faces toward the gate, deck near the pools) would finish the "lit by
   its own practicals" claim.
4. The bed/deck butt seam could use a fused plinth.
5. Open owner question: thumbnails in the frames, or stay abstract?

## 6. Hard constraints — these came from the owner and still hold

- ~~**No glow.**~~ **REVERSED by the owner 2026-08-18.** The direction is now
  film noir / kino: the frame is a dark stage, the machine its lit subject.
  The acid-plate bed glows where footage dissolves, the lasers glow, the
  projector's throw spreads like a prism to the destinations, and the great
  reel goes *darker*, receding into the stage. Gradients/bloom are allowed —
  with noir discipline: hard sources, controlled pools, darkness doing most of
  the work. No web-glossy haze.
- **The lamp sits halfway up the rig** (owner, 2026-08-18) — not in the bottom
  third; balance the assembly around it.
- **three.js must stay out of the homepage bundle.** This renderer is Canvas 2D
  with zero dependencies. Keep it that way.
- **Render only while visible** (`IntersectionObserver`) and **paint a single
  static still under `prefers-reduced-motion`** — not a slower loop. Both are
  implemented; the still is `STILL_T = 2.35`, chosen because a file is soaking
  in the bed and the strip is mid-run.
- **Do not modify** `app/pages/index.vue`, `app/assets/css/main.css`, the
  layouts, or anything under `content/`. This is a prototype at a lab route.
- **Do not invent quotes and attribute them to real people.**
- The working tree is shared with other agents. **Commit explicit owned paths
  only; never `git add -A`.** At the time of writing there are ~22 modified
  files in this repo that belong to other work.

## 7. How to work on it

The only reliable loop is: **change → rebuild → look at a picture → decide.**
Reasoning about this geometry without rendering it produces confident wrong
answers; that is documented above in §4 twice over.

- Fast loop: `bun run dev --port 4180` (HMR; binds IPv6-only — browse
  `localhost`, not `127.0.0.1`), then `node qa/iso-shot.mjs tmp/iso/<name>
  <t>…` to screenshot frames frozen at exact times via the `window.__iso`
  hook (`--clip x,y,w,h` in 1600×900 viewport px crops). Verify with a real
  `bun run build` before committing.
- Slow/verify loop: `bun run build && bunx serve .output/public -p <port>` —
  note `serve` takes ~7s to bind. A screenshot taken before then is a blank
  page with **no error**. Kill stale `serve` processes first; only the first
  one binds, so leftovers mean you are screenshotting an old build.
- Capture several moments, not one. Motion bugs (the strip vanishing at the
  bend, the reel spinning the wrong way) are invisible in a single frame.
- Crop tight on the thing you changed *and* look at the whole frame. Local fixes
  routinely break the composition.

## 8. Open questions for the owner

Two of the original three were answered 2026-08-18: the massing look is
scaffolding — the destination is a detailed, noir-lit machine (captions etched
into passing frames, instrument-grade turrets, particle dissolve at the bed);
and the bed dissolve does eventually become particles, with a glow. See the
workshop charter's phase ladder.

- Does the strip show real thumbnails, or stay abstract?
