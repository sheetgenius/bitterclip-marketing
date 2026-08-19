# Hero ISO — nit ledger

Findings from the tri-eye protocol (me = Claude session · grok · agy), tagged
by who saw them, with dispositions. Corroboration rule: 2-of-3 = act; solo =
zoom/measure first. Append, date, never rewrite history.

## 2026-08-18 — workshop block 1 (baseline `e7863ca` → `f633974`)

### Found and FIXED this block

1. Reel read as "satellite dish"; spokes flat, no supply path into the wheel
   (grok cold-read + me) — five rotating flange windows + coil face + winding
   rings + fresh khaki outer lap. `85ddcde`, `d3f1cf1`.
2. Far flange a void-black disc; wheel's silhouette dissolved into the stage
   (me + grok "star dissolves") — value lift + hard rims both flanges, warm
   rim-kiss lower-right. `2000c55`, `d3f1cf1`.
3. Sweep-seam moiré on roller/roll/barrel (me; dot-grid on the muzzle) —
   sealed sweeps. `2000c55`.
4. Lamp read as resting/floating; two hanging schemes failed IN RENDER (straps
   at girder planes project beside a z=0 barrel, never over it) — final:
   plumb masts + visible cross-shaft at mid-rig (owner height ruling),
   shaft split around the housing paint for correct occlusion. `2000c55`.
5. Legs swept across the climb (brief + me) — vertical near posts; climb's
   screen band now clean. `2000c55`.
6. Every-9th dark "cut" frame read as a hole; laser appeared to strike nothing
   when the hit landed on it (me + grok) — removed. `85ddcde`.
7. Strip didn't read as film (me; grok "beige card") — sprocket perforations
   both edges. `85ddcde`.
8. Gate was "a foggy rectangle the wedge blooms out of" (grok + agy "beams
   feel pasted") — clamp bars + lit frame + near-clipping hot core + prism
   origin core. First attempt (4-member frame) sheared askew in this camera;
   replaced with pressure bars in the strip's own plane. `85ddcde`, `d3f1cf1`.
9. Practicals didn't light anything (grok, all five points corroborated by
   eye) — throw rakes the clamp bars, climb density falloff, wider laser pool
   lapping neighbours, machined speculars roller/hub. `d3f1cf1`.
10. Bed read as generic placeholder (agy) — acid glow breathing on the drop
    cycle + folder tab on the file. Partial; see queue. `a55e176`, `d3f1cf1`.
11. Turrets fire but film unchanged (brief #6) — caption bars etched into
    frames as they cross the beam plane. `f633974`.
12. STILL_T showed an empty bed (me; soak ~89% faded at 2.35) — moved to 1.35.
    `2000c55`.

### Open, prioritized

- Turret bodies are toy cubes; need instrument detail (all three eyes, at
  various times). Next up.
- Falling folder wants mass/thickness; bed dissolve still an alpha fade, owner
  wants particles at the table plane eventually.
- Box-shading is un-motivated top-light (grok, solo but true on inspection);
  targeted relight of key faces would finish the practicals claim.
- Bed/deck butt seam (grok, solo — minor).
- Thumbnails in frames: OWNER QUESTION, still open.

### Rulings after the block

- Hero copy simplified to the four words "Footage in, episodes out" (owner);
  old punchline + subline removed from the lab page.
- The machine's ending stays FULL (prism fan + destination badges). A
  misreading of the ruling briefly built a no-destinations `?v=simple`
  variant (`a45c935`); reverted same day. If "drop the destinations" ever
  comes up for real, that commit is the working prototype.

### End-of-block cold verdict (agy, uncontaminated, on `final-t5.80`)

Craft 8.5/10; full pipeline narrated correctly. Its residual confusions, for
the next block: (a) a gap-phase STILL can't tell input tray from discard bin —
the falling file resolves it in motion and the reduced-motion still is chosen
at a with-file moment, but a stronger static intake cue is worth exploring;
(b) reel in-vs-out is likewise motion-resolved; (c) the destination badges
read as flat sticker overlays against the volumetric machine — consider a
badge integration pass (dim backplates, a kiss of beam light on each disc).

### Known-wrong outside claims, kept for the record

- "Reel is a camera-facing circle collaged onto an isometric deck" (grok) —
  false as geometry (a z-axis circle projects near-circular in this camera:
  conjugate semi-diameters equal, ~78° between them), but it correctly smelled
  the missing depth cues; fixed via windows/rim, not by re-projecting.

## 2026-08-18 — PIVOT: real 3D

Owner ruling after the Canvas study reached its noir pass: the fake-3D tax
(painter-order bugs, projected-shear, seam moire — roughly half the block's
effort) ends here. /lab/iso3 is the successor: three.js via dynamic import
(never in the homepage bundle), a CUSTOM projection matrix reproducing the
study's oblique axonometric exactly (its rows are not orthonormal, so no
stock OrthographicCamera can do it), z-buffer occlusion, real lights as the
practicals. The canvas study stays as reference until parity, then retires
like /lab/line before it. Endgame under discussion: bake to looped video for
the homepage; possibly built through BitterClip's own artifact system.

## 2026-08-18 — 3D workshop block 1 (`8f39166` → tip)

Built to visual parity-plus in one block: live-texture film ribbon, windowed
sync flanges, between-the-girders head, turrets/beams, breathing bed + folder
drop, theater beams with noise smoke, wall-of-idents shadow play, bloom
composer, real shadow mapping from the gate lamp. Lessons that cost renders:

- Spin sign: the 2D study's "counterclockwise shows as clockwise" note is a
  SCREEN-space artifact of its negative-determinant projection; in 3D the
  physics decides (surface at the tangent moves up) — owner caught the
  reversed wheel live.
- three.js light `layers` gate against the CAMERA only — per-object light
  masking silently does nothing. The floor/wall "lit only by practicals"
  scheme was an illusion; solved by tuning honest values instead.
- A custom projection needs its depth window sized for EVERYTHING, including
  a 900-unit stage floor — a tight near plane sliced it with a razor seam.
- A literal wall mesh betrays its edges on an implied-void stage; bake the
  spill into the screen textures and let darkness be the architecture.
- Under the composer, `scene.background` must match the page ground and an
  OutputPass must close the chain or ACES/sRGB silently drop.

Open queue: ident text crispness under bloom, wheel face still very dark at
gap phase, perf audit on low-end GPUs (bloom + shadow cubemap + per-frame
canvas texture), reduced-motion still parity, mobile fit, the folder's
tab/mass read at speed, docs/brief section for iso3.

## 2026-08-19 — the machine starts making sense (owner big-picture session)

Four coherence fixes in one pass, all owner-ruled:
1. Frames now printed ACROSS the strip like real film (16:9 between the perf
   rows) — kills "the footage is sideways": upright landscape in the gate,
   filmstrip-true on the bench, captions on the frame's bottom edge.
2. The wall screens project THE SAME image standing in the gate (one shared
   abstract frame renderer feeds film and screens; screens re-render each
   time a new frame arrives) — the lamp stops being a flashlight.
3. A bracket-mounted glass prism with a hot split-line explains one white
   throw becoming three channel beams; beams now originate at its output.
4. Abstract per-frame content (speaker / two-shot / title-card variants,
   hash-stable per physical frame) with a raw-vs-enhanced state: frames run
   dim and low-contrast until the turret beams lift them — before/after ON
   the strip.

## 2026-08-19 — the two triangles (owner vision + panel-driven unification)

Owner: "triangular girders, one at each track edge, converging to the center
which houses the wheel; the light rigging hangs between them like a letter A;
clean, intentional machinery." Built, then grok's review drove the full
unification: the A-frames are now the ONLY stand (old gate masts deleted —
"charcoal thicket"), the roller sits in deck pillow blocks, and the whole
optical line — lamp on drop rods, hung gate frame, prism on its bracket —
hangs from a bridge-and-boom rig between the triangles. The colossal flange
swallowed the lamp room at first; fixed by dropping the optical line into the
clear air beneath the rim (lampY fraction 0.47 → 0.32), so the drop rods
emerge from behind the archive. Intake ambiguity from agy's cold read (reel
mistaken for the SOURCE; bed for an exit tray) answered with a queue of
folders waiting beside the bed. Materials split (legs vs flange vs steel),
feet gussets + base tie close the triangles.

Queue: pod instrument anatomy + cables, far-triangle value lift, muzzle/gate/
prism intensity ladder (three distinct points), wheel upper-face presence,
motion review, perf audit, reduced-motion parity, mobile fit.
