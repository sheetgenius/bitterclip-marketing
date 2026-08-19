# The isometric hero — design brief

Prototype route: **`/lab/iso`**
Renderer: **`app/lib/hero-iso/renderer.ts`** (~830 lines, Canvas 2D, no dependencies)
Mount: `app/components/HeroIso.client.vue` · Page: `app/pages/lab/iso.vue`

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
The hero line — *"You still gotta record"* — is the joke that lands *because*
the picture already made the argument. If a first-time visitor doesn't get the
argument from the picture, the line is just words.

## 2. The metaphor, station by station

The line runs **bottom-left to top-right**, along +x. Read it in that order.

| Station | What you see | What it means |
| --- | --- | --- |
| **The bed** | A shallow basin at the head of the bench, dashed warm rim. Files fall vertically into it, land, and dissolve over ~2s. | Ingest. You drop in a recording. |
| **The extrusion** | Film emerges from a slit in the bed's downstream face, already flat, already at bench height. | One file becomes many frames. **This is the point of the bed:** it resolves a 90° plane change (files fall vertically, film lies flat) by *dematerialising* rather than by bending anything. |
| **The bench** | A long flat deck. The strip runs across it, frames alternating in tone so you can see it move. | The workshop. The cutting-room floor. |
| **The turrets** | Two small instruments either side, firing a thin beam that converges on the passing strip. | Automated editing. Lasers, not blades — a blade has to strike something stationary, which forces a stop-and-go transport. A laser enhances film *as it passes*, so **the line never stops**. That was a deliberate reversal of an earlier indexed design. |
| **The roller** | A flanged pulley. The film wraps it through 90° and climbs. | Nothing semantic — it's the mechanism that gets the film from the horizontal plane to the vertical one without a morph. |
| **The rig** | Two A-frame girders on base plates, tie-barred, carrying the reel's axle. | Structure. It exists to make the reel's height *believable* and to give the lamp something to hang from. |
| **The lamp** | A cylinder journalled on a trunnion between the tie bars, axis along the line, firing at the standing frame. | Publishing. It is a projector. |
| **The reel** | A large two-flange reel, film winding onto the coil from below. Turns at the film's own rate. | The finished show, accumulating. |
| **The throw** | Three coloured beams leaving the gate. | Distribution. |
| **The destinations** | YouTube, Podcast, LinkedIn. | Where it goes. |

**Rhythm.** One recording drops roughly every 6.4s (`FALL_S 1.05` +
`SOAK_S 1.9` + `GAP_S 3.4`), and that single file yields a continuous run of
many frames. Earlier versions spammed files in at high frequency, which read as
noise and broke the one-file-becomes-many-thumbnails idea. **One in, many out**
is the shape of the rhythm; keep it.

## 3. Why isometric — do not undo this

There is a perspective version of the same idea at `/lab/line`
(`app/lib/hero-line/renderer.ts`, ~4,280 lines). It works, and it cost all of
this: the film had to be chopped into ~50 affine slivers, each needing its own
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

**Solid.** The blocking is done and coherent: 100+ verified geometry fixes, each
rebuilt and eyeballed. Bed, extrusion, bench, strip, turrets, roller wrap, rig,
lamp, reel, throw, destinations all present and correctly related. The reel's
spin is driven off the transport (`spin = dist / coilR()`), not a clock of its
own, so the wheel and the film read as one machine. Occlusion order is correct
throughout. The composition is biased right, leaving the top-left for the hero
line and CTA.

**Crude, and knowingly so.** This is a *massing study* — shapes and positions.
There is no lighting model, no material, no texture, no photography in the
frames. Values are flat fills chosen by hand. The strip's frames are solid
tones, not thumbnails.

**Known rough edges, in rough priority order:**

1. The rig is over-articulated — four legs plus tie bars plus base plates is a
   lot of parallel bars in a small area, and the near frame's legs cross the
   film's climb.
2. The lamp reads as *resting on* the tie bar more than *hanging from* the
   trunnion.
3. The bench's middle is empty now that the old lamp house is gone.
4. The turret beams converge on the strip but the turrets themselves are small
   dark boxes that don't read as instruments.
5. The bed's dissolve is an alpha fade; the concept called for particles
   swooping and rematerialising *at the plane of the table*.
6. Nothing is stamped, lasered or cut *visibly* — the turrets fire but the film
   they hit is unchanged. The strip should visibly gain something (captions
   stamped in) as it passes.

**Not started:** any of the detail pass. Thumbnails in the frames. Subtitle
stamping. Colour beyond the destination brand marks.

## 6. Hard constraints — these came from the owner and still hold

- **No glow.** No `createRadialGradient`, no `shadowBlur`. Light is shown by
  geometry and value, not by bloom. (Currently clean — keep it that way.)
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

- `bun run build && bunx serve .output/public -p <port>` — note `serve` takes
  ~7s to bind. A screenshot taken before then is a blank page with **no error**.
  Kill stale `serve` processes first; only the first one binds, so leftovers
  mean you are screenshotting an old build.
- Capture several moments, not one. Motion bugs (the strip vanishing at the
  bend, the reel spinning the wrong way) are invisible in a single frame.
- Crop tight on the thing you changed *and* look at the whole frame. Local fixes
  routinely break the composition.

## 8. Open questions for the owner

- How far toward *detail* should this go — is the flat massing look the final
  aesthetic, or is it scaffolding for a rendered pass?
- Does the strip show real thumbnails, or stay abstract?
- The bed dissolve: particles, as originally described, or is the current fade
  enough?
