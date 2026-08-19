# Hero line: frontiers of excellence (review rubric)

The assembly-line hero (`/lab/line`, drawn by `app/lib/hero-line/renderer.ts`) is
reviewed against these frontiers. It is "baked" only when every frontier passes.
Refine the criteria as we learn — see `hero-line-journal.md` for the run log.

Sibling rubric: `docs/protocol/frontiers.md` (docs site). Same spirit, different
subject: that one judges prose, this one judges a moving picture.

## The frontiers

1. **Truth** — Passes when: the picture asserts nothing the product does not do.
   Only channels that really publish appear — **YouTube, Podcast, LinkedIn** —
   never Instagram, which is capped to manual handoff. Footage is real. No line
   is attributed to a real person unless they signed it off, and a camera model
   is never printed as a speaker.

   *The cut is deliberately absent* (owner call): showing the edit made it a
   second transform competing with the one that carries the product. Do not
   reintroduce hatching, offcuts, or a cutting-room floor.

   *This list was out of step with the picture for several passes* — the rubric
   said X while the canvas shipped Podcast. A reviewer caught it. When the two
   disagree, one of them is a Truth miss; fix it the same day.

2. **Conceptual legibility** — Passes when: a stranger, in one glance and with no
   caption, can say *files went in, something was edited, finished work came out,
   and it went to platforms* — and can point at where the edit happened.

3. **Motion coherence** — Passes when: everything pinned to the film travels with
   the film, at the film's speed and direction. Nothing pops into existence,
   teleports, or visibly wraps. Intake and output read as one belt, not separate
   clocks. *Every motion bug so far has been a disagreement about the sign of
   `scroll`; there is now one conversion, `filmToScreen`, and only two places may
   mention that sign.*

4. **Registration** — Passes when: a marker and the thing it marks never separate,
   at any point in the cycle. The cut hatching sits exactly on the condemned
   frames; a card names the session actually under it; perforations belong to the
   emulsion they perforate.

5. **Depth & material** — Passes when: the parts read as one scene, not a sticker
   sheet. Depth comes from occlusion, value shift along curvature, contact
   shadow, and thickness — **never** from glow. No coloured shadows, no blurred
   colour blobs, no radial gradients; those were deliberately removed sitewide.
   Every raised surface sits *above* the page value, never below
   (`app/assets/css/main.css`) — a fill darker than `#0d0d0d` reads as a hole.

6. **Composition** — Passes when: there is one focal path, deliberate negative
   space rather than dead zones, nothing important cropped, and type never
   collides with type or with the film. The headline gets clean air made by
   geometry, not by a scrim.

7. **Fidelity** — Passes when: frames are sampled proportionally (no single-pixel
   stretching), no aliasing or moiré on the perforations, and it holds up at 1×
   and 2× and at mobile widths.

8. **Performance** — Passes when: the frame budget is met on a mid laptop, DPR is
   capped, it stops when off screen, and it adds no dependency to the bundle.
   *2D canvas was chosen over WebGL specifically to keep this frontier cheap.*

9. **Robustness** — Passes when: `prefers-reduced-motion` yields one composed
   still (not a paused loop), resize is clean, there are no console errors, and
   the page keeps its meaning if the canvas never starts.

10. **Volume & diversity** — Passes when: watching it a while shows genuinely
    different sessions — different people, shows, devices and framings — because
    the manifest drives it. The point being made is that this handles volume.

## Protocol

Each pass: capture → review → fix **one root cause** → verify → log.

- **Capture** with the contact-sheet harness, never a single still. A still
  cannot show direction, and that is exactly how three flow bugs survived.
- **Review** with three sets of eyes: this agent, plus `grok` and `agy` as
  read-only visual reviewers (see the appendages doc in the product repo). They
  have caught both a semantic error and a doctrine violation that the primary
  agent missed; use them.
- **Fix the class, not the instance.** A second sign flip is a smell; a single
  shared conversion is a fix.
- **Log** the pass in `hero-line-journal.md`, including what regressed.
