# Hero line journal

Date started: 2026-08-18
Surface: `/lab/line` (prototype route, unlinked — not in nav, sitemap, or `llms.txt`)
Rubric: `docs/hero-line-frontiers.md`

## Objective

One hero picture that carries the whole product, read left to right with no
caption:

> Raw session files fly in and **dissolve** into the intake machine → fragments
> of the real footage stream out of its back and **condense** into a finished
> film strip → the strip runs in a wave, carrying the titles and openers that
> were applied to it → it enters a second machine, the **transmitter**, and
> stops being matter → it leaves as **energy** that arrives at the channels.

It is driven by a manifest of real sessions, so watching it a while shows volume
and diversity rather than one staged example.

## Tooling

- `app/lib/hero-line/renderer.ts` — 2D canvas, no dependency. All film goes
  through one routine, `drawFilm()`, which samples a path and rotates the canvas
  to the local tangent at each step: a software texture mapper with banking.
  That is what lets a *flat* canvas carry photographs around a curve, and it is
  the whole reason WebGL was not needed.
- **Fast shooter** (`/tmp/shot.ts`) — Playwright + `page.clock`, against the
  **dev server on :4180**, one frame in ~5s. Iterating against `nuxt generate`
  cost ~90s a round; that difference is the difference between 6 rounds and 100.
- **Contact sheet** (`scratchpad/contact.ts`) — N frames at chosen times, tiled
  with ffmpeg. Single stills cannot show direction; that is how three flow bugs
  survived review.
- **Telemetry** — `window.__lineProbe` records per-frame scroll and card
  positions, so motion invariants are assertable rather than eyeballed.
- **Reviewers** — `grok` (xhigh) and `agy` (high), read-only, in the background,
  on a still plus a contact sheet. See the product repo's
  `docs/build/visual-review-appendages.md`.

## The rotation

Rounds cycle through these lenses so no single frontier eats the whole run:

1. **Concept** — does the sentence read with no caption?
2. **Composition** — focal path, negative space, crop, collisions.
3. **Dimensionality** — does it feel like a scene with volume, not a sticker sheet?
4. **Particles** — the dissolve, the condensation, the transmission.
5. **Material & value** — edges, shading, the film's own believability.
6. **Frontier** — what can 2D canvas do here that nobody bothers to do?
7. **Motion** — coherence, easing, and what a still cannot show.
8. **Type & hierarchy** — the labels, the marks, the machine's identity.

## Passes

### Pass 0 — the harness was lying (2026-08-18)

The deterministic screenshot path did not exist. The page read `?t=` into a prop,
but `.client.vue` mounts before the route query resolves on a prerendered page,
so `fixedTimeMs` was always `null` and the renderer silently ran live. Every
"different" frame in a contact sheet was the same moment after page load.

Three direction bugs had survived review because of this. Fixed by reading the
URL directly at mount, then replaced the whole approach with Playwright's clock
so the harness drives the shipping code path rather than a test-only branch.

**Lesson:** a review instrument that cannot fail loudly will fail silently.

### Pass 1 — direction and registration

- Film ran backwards: the cell lookup used `u + scroll`. Now `u - scroll` in the
  one place that inverts.
- The cut marking used the opposite sign from the strip, so hatching drifted off
  the cells it condemned. Introduced `filmToScreen()` as the single conversion.
- Frames were sampled one source pixel per column and stretched. Now a
  proportional slice with smoothing.

### Pass 2 — the cut was a lie (reviewer-found)

`agy` caught a semantic error: the condemned run travelled the whole line still
attached and reached the output, which says the bad take gets published. Reworked
as a real excision with a blade station. **Regression this caused:** the remapped
index made unrelated downstream cells test as condemned. `grok` had predicted
exactly this desync class.

### Pass 3 — things that belong to the film must ride it

Perforations were static while the images slid past them; the portal was
incoherent ("a red door that's open"); thumbnails were grainy. `grok` also found
file chips *darker than the page*, violating the site's own elevation rule, and
hatching drawn in canvas space rather than on the strip.

### Pass 4–8 — the machine, and the end of the cut

- **Frame aspect** was wrong: cells were 102×243, a 4:3 frame crushed into a
  tall slot. Fewer, wider cells.
- **Portal → machine.** A tall angled portal read first as a doorway, then as a
  slab. Rebuilt as the shape everyone already knows from a printer: a body with
  a slot in each face, both slots punched out of the body with an even-odd fill
  so whatever is painted underneath shows through the openings and nowhere else.
  That single change is what made "things go in one side and come out the other"
  legible without a caption.
- **The mouth now defines the wave.** The film was leaving the slot a full
  amplitude above it. Phase and frequency are now *derived* from the mouth:
  the crest is pinned there and the frequency chosen so exactly two humps fit
  between mouth and node, which puts the far end back at the same flat crest.
  A machine does not spit its output out at an angle.
- **The cut was removed entirely** (owner call). First it became an excision,
  then offcuts falling to a cutting-room floor, then nothing. The reasoning is
  worth keeping: the edit was a *second transform* competing with the one that
  carries the product. Raw in, programme out, and the picture does not stop to
  explain how.

### Pass 9 — particles (owner direction)

Files now **dissolve** into the intake: the card comes apart into fragments of
its own frame which are drawn toward the slot and swallowed.

Out of the back comes an **assembly cloud** — and the fragments are not
sparkles. Each carries the exact piece of picture it is going to become: its
source rectangle is derived from the same cell lookup the strip uses, at its own
position along the line. So the image genuinely assembles out of its own
material rather than fading up behind a decorative particle layer. The strip's
own alpha ramps underneath on a squared curve; the two together read as the
picture pulling itself together.

### Pass 10 — one ribbon routine

Owner: *"the streaming into the YouTube looks completely terrible — is that
obvious to you?"* It was. The branch had its own drawing loop, so it came out as
a smeared wallpaper swipe with no black edges, no perforations and no frame
rules, next to a ribbon that had all three; and one source frame was stretched
across the whole arc.

The fix was structural, not cosmetic: **one `drawFilm()` routine** that takes a
path sampler, used by every piece of film on the canvas. It rotates to the local
tangent per step, so the ribbon banks into a turn instead of shearing vertically,
and the edges, rules and perforations follow the curve for free.

**Regression this caused:** rotating per step faceted the troughs — a turn
tighter than the step leaves wedge gaps on the outside of the curve. Fixed with
more steps, each quad overlapping its neighbour by 35%, and a gentler wave.

Also this pass: the classic film look the owner asked for — solid black edge
bands with bright perforations and a hard black rule between frames.

### Pass 11 — the transmitter (owner direction)

Owner: *"show it as energy, like we're making a transmission… a second little
portal that when it crosses through transforms into energy streams… YouTube also
absorbs shorts, so keep it much more conceptual."*

Film does not travel to a platform; a transmission does. The finished ribbon now
runs into a second machine and does not come out as film — it leaves as three
streams of energy. Packets leave in BitterClip's coral and arrive in the
channel's colour; scatter decays along the path, so the beam collimates as it
locks onto a channel.

This is also the *accurate* choice. Drawing a 16:9 reel to YouTube and 9:16 cuts
to LinkedIn asserts a split that is not real.

### Pass 12–18 — the ribbon becomes a ribbon

The owner's note was the whole round: *"It looks like a creeping caterpillar. It
doesn't look 3D at all… a film strip isn't elastic on any axis except the one
you can fold it on. I can't take a film strip and make one edge narrower or one
edge wider."*

That is a physical constraint, and the drawing was violating it structurally.
The strip's two edges were generated in **screen** space, by offsetting
perpendicular to the projected tangent by a projected half-height. On a curve
the outer edge then travels further than the inner one and the width drifts step
to step, so a frame comes out wider at one end than the other. Rubber.

Rebuilt where the ribbon actually lives:

- A centreline in **world** coordinates, a unit tangent, and a width direction
  perpendicular to it rotated by the roll. The edges are the centreline plus and
  minus a **constant world half-width**. Both edges are projected independently.
  Perspective may then shrink the far end, because it is further away, and that
  is the only reason the width is ever allowed to change.
- The cross-width shading ramp was deleted as a fake. A flat ribbon has one
  surface normal across its width, so it takes one Lambert value. The ramp was
  pretending the strip was part of a cylinder — another way of saying rubber.
- Frames advance by **world arc length**, not by the path parameter, so they
  stop stretching down the slopes and squeezing at the crests. The perforations
  inherited the same fix.

### Pass 19–22 — five artefacts, five root causes

Each of these looked like a rendering glitch and each turned out to be a
different piece of geometry being wrong. Written down because the *class* of
mistake recurs:

1. **Black comb at the troughs.** The frame rule was being drawn a full step
   wide, so on steep stretches it painted whole blocks black. A rule is a
   hairline.
2. **Fanned slivers.** Steps were uniform in the path parameter, so steep
   stretches took huge bites. Fixed by walking a precomputed **screen** arc
   table — the projection does not depend on time, so even three-pixel steps are
   free.
3. **Whole ribbon rendered as base stock.** The surface normal was wound so that
   it faced away from the camera when the ribbon was flat, so every sliver took
   the back-of-the-stock branch.
4. **Vertical bars at every sliver boundary.** The bleed that closes seams is
   safe for opaque paint — drawing the same pixels twice changes nothing — but
   not for a translucent shading wash, which doubles in the overlap.
5. **Nine-pixel seams.** Measured, not guessed: an affine transform maps the
   unit square to a **parallelogram**, so a quad whose ends differ in width
   cannot be filled that way. Replaced with exact **per-triangle texture
   mapping** — one affine map exists between any two triangles, so it is not an
   approximation, and adjacent triangles share edges by construction. Canvas has
   no primitive for this; the transform is solved by hand.

### Pass 23 — the wave was physically impossible

The last fold refused to go away, so it got measured instead of tuned: the
minimum radius of curvature of the two-hump wave was about 37px against a 49px
half-width. **A stiff ribbon cannot be bent around a radius smaller than its own
half-width without the inner edge folding through itself.** The renderer was
faithfully drawing an impossible object.

Halving the frequency quadruples the radius. One long swell — which is also the
calmer picture both reviewers had independently argued for.

The guard that used to cap the depth sweep now covers this whole class: it
samples the signed area of every sliver's quad and reduces amplitude, then
twist, then depth, until nothing folds at any viewport. The margin is on the
probe, so a regression is visible rather than decorative.

### Pass 24 — thresholds, not machines (owner direction)

*"The portals are just grey boxes. Totally unacceptable… like the portal is just
a thin ring of energy. Pure black in the middle. As things pass through, they
transform."*

Three bodies had been tried and all three failed: a rounded chip read as UI, a
3D plate with a throat read as a grey box in perspective, a film gate read as a
prop nobody recognises. There is no body. There is a circle standing
perpendicular to the line in world coordinates — the projection turns it into
the narrow ellipse a ring makes seen almost edge on — filled black, with a lit
rim and a thin swirl at it.

And the change of state happens **at** it: `TRANSITION_PX = 38`. The old cloud
sprawled across a fifth of the canvas, which read as confetti standing next to a
film rather than as film arriving.

### Pass 25 — the transmission, on the fifth attempt

Jittered capsules read as scratches. Fat textured packets read as copper rope.
Wide beams carrying emulsion read as pink tentacles. The common error was giving
the beam **body**. A transmission has none: a hairline carrier that tapers to
nothing, a brighter core, a few glints. The three beams leave the ring at three
separate points so they are separated at birth rather than untangling
downstream.

Both reviewers had independently said the channel colours turned the climax into
a telecom diagram, so red, purple and blue are gone. Coral means BitterClip; the
platforms get their names.

### Pass 26 — the emulsion is not a surface (reviewer-found)

`grok`, on being asked whether the picture is beautiful: the film was a stop
down with crushed midtones, and in the left third the coral rim and the white
perforations both out-read the photograph. The source JPEGs are bright daylight,
so this was the renderer.

The diagnosis is the useful part, and it reframes a whole class of decision:

> **A carried image has its own exposure. The stock is what takes light.**

Every version had shaded the emulsion with the ribbon's Lambert term, which
dims the one thing the picture exists to sell — worst exactly where the film is
born, which is the first word of the sentence. Now the Lambert lives on the
rails, which are the actual surface, and the frames are left alone. The film's
cut edge takes a hairline highlight, which is also what stops a black rail on a
near-black page from dissolving into it.

Also this pass: the depth sweep was inverted so the birth stretch is the side
swinging *toward* the viewer rather than the receding, smaller, dimmer one; the
frames are graded once at load into an offscreen canvas (hundreds of filtered
draws a frame would be unshippable, one per source frame is free); and the
ribbon was thickened and the whole line dropped, because a hero whose product
occupies a fifth of the stage is not making its own case.

### Pass 27 — the emulsion was upside down (reviewer-found)

`agy` caught what nobody else had, across many passes and hundreds of frames:
**every frame was inverted**. Canvas `+y` points down while the ribbon's width
vector is built from world up, so `A.p` is the *bottom* edge on screen — and the
texture mapped source `y = 0`, the top of the frame, onto it.

**Lesson:** a defect that is present in every frame is the hardest kind to see,
because there is nothing to compare it to. That is what a second and third pair
of eyes are for.

### Pass 28 — rails measured in the wrong space

At magnification the two rails were different widths, which on a film strip is
impossible. They were being taken as a fixed fraction of the *projected* width,
by interpolating between the two already-projected edges. Perspective is not
linear along a segment, so a rolled ribbon came out with a fat near rail and a
vanishing far one. Rails and perforations are now measured across the ribbon in
world units and projected — the same principle as the ribbon itself, applied one
level down.

### Pass 29 — entering is occultation, not fade

The intake beat was asking transparency to mean travel: cards faded out in open
air, tens of pixels short of the ring. Now a card stays whole all the way to the
aperture and the ring's void takes it, which only works because the files are
painted *before* the black. Two files instead of five, sized to the hoop, so
"it fits through" is visible.

And the change of state is made of the film's own material: square chips read as
broken tiles, so the transition is now full-width SLIVERS of the strip,
displaced along their own direction of travel and shuffling into register. They
are constrained to point away from the threshold, because a shard that crosses
it says the film came out the far side still being film.

### Pass 30 — performance, measured for the first time

The rubric has always required a frame budget and nobody had ever taken one.
Measured: 14.9ms at 1200x760@2x and **25.5ms at 1800x1000@2x** — over budget on
a large display. Profiled by switching layers off (`?off=pic,rails,rule`, which
is why those switches exist): the picture triangles were 15ms of the 23.

Three things brought it to 10.7 / 17.7ms:

- **Do not draw the whole bitmap inside every triangle clip.** The rasteriser
  still walks the transformed bounds of a 640x480 image for each of nearly a
  thousand triangles a frame; passing the source slice costs nothing.
- **The step can be much coarser than the seam maths implied.** Coverage is
  exact at any step, because the triangles are clipped and share edges; the step
  only affects how far an affine texture map drifts from a true projective one
  *inside* one sliver, which is second order. 7px → 19px, no visible change.
- **Sample each cross-section once.** `worldC` and `frameAxes` are
  trigonometric and were being recomputed six to ten times per sliver.

Also tried and rejected: skipping the clip where the quad is nearly a
parallelogram. Measured, the error is above a pixel almost everywhere on this
geometry, so the cheap path almost never fires. Left in, because it costs one
comparison and will fire on a calmer line.

### Pass 31 — the footage was running backwards (reviewer-found)

`agy` again, and again something invisible because it was true of every frame:
the strip is extruded left to right, so the frame index at a fixed point
*decreases* with time — which plays the session in reverse. Fixed by storing the
manifest in reverse capture order, so walking it backwards walks it forwards.
No geometry change, no mirrored frames. The intake filenames were counting down
for the same reason, and now count the way a camera counts.

Same pass: shards were being thrown up to two ribbon-widths — about 120px —
three times past the 38px the transition is allowed, landing on solid film
downstream. The displacement is now derived from `TRANSITION_PX` itself. And the
middle beam originated on the *far* side of the ring but was painted after it,
so it crossed in front of a void it should have been behind; all three now leave
from the near side.

### Pass 32 — a cycle is not a beat (reviewer-found)

`grok`: *"There is a cycle. There is not yet a beat."* Files in transit, film
already formed, energy already leaving — at every moment. Nothing is ever
*caught* happening, so the still is the idle of a conveyor rather than the verb.

The intake now has a downbeat. As a file crosses the threshold the ring answers:
the rim brightens, the swirl quickens, the material coming through the mouth
surges, and it settles within a second. The film also runs fast enough that a
session turns over inside a hero loop instead of once every thirteen seconds.

Same pass, on the same note — **subtract**. Occultation, a square-chip burst and
slivers were three metaphors for one event, at one door, inside forty pixels.
The chip burst is gone.

And the transition band now starts at the ring's downstream *rim* rather than
its centre: the ring is a solid ellipse about fifty pixels across drawn after
it, so half the band was hidden behind the very object it was emerging from.

### Pass 33 — one world

`grok`: the film is a photographed object in space and the incoming files were
Finder chips — rounded rect, 1px white stroke, mono label — that did not take
the key, share the depth, or shrink as they came in. The cards are now four
corners in world coordinates through the same projection as the ribbon,
approaching from behind the ring's plane and landing on it, lit by the same
source, with the same bright top edge the rails have.

Also this pass: the title plate was sized by eye and **the show line — the
product's own name — ran off the end of it**. It is measured now. And the plate
arrives opaque and then recedes, so the photograph wins the trough; a caption
that never fades is a caption for the whole illustration rather than one that
landed on a frame.

### Pass 34 — three more inversions and a phase error (reviewer-found)

`agy`, asked to be forensic, found three things that were true of every frame:

1. **The title was landing from below.** `drop` was *added* to a y that is
   already below centre, and canvas `+y` is down — so the plate spawned in the
   void under the ribbon and floated up onto it. The same axis mistake as the
   inverted emulsion, in a different place. Two of these now; the lesson is that
   "down" has to be written down, not inferred at each call site.
2. **The film's fade and the shards were out of phase.** `stripAlpha` ramped
   from the ring's *plane* while the shards started at its *rim*, so the strip
   was fully opaque for 25px while shards were still flying over it — and its
   first 25px faded in behind the ring's own void where nobody could see it.
   Both now start at the rim and run the same length, off one shared
   `ringRimPx()`.
3. **Frame rules were chopping the rails.** A rule was stamped across the full
   width of the strip, cutting notches through the rails and slicing their
   shading and edge highlight into pieces. On real stock the rails run
   continuously and the rule lives on the emulsion between them.

Also: the three beams were not leaving the hoop from the same plane — two sat on
the `z = 0` meridian, which projects to the *middle* of the ellipse, and the
third on the near apex, which projects to its lip.

### Pass 35 — a rim is an object

`grok`: the rings were "a die-cut, not a swirl of smoke" — a 1.4px stroke reads
as a hole punched in a website. They are drawn as a **band** now, with an inner
and an outer edge and a value that travels around the hoop: the quadrant facing
the key is bright, the far side falls to nearly nothing. That is a torus
section, it costs the same as the stroke it replaced, and it is what makes a
hoop read as an object standing in a room when glow is not available.

The destinations answer now too. Three identical marks pulsing on a sine are a
legend; a mark that responds to the thing that just reached it is an arrival, so
a ring is thrown off and fades as it widens when a packet lands.

### Pass 36 — the drape, and a beat you can actually photograph

The wave is phase-warped now rather than a pure cosine: a strip of film hanging
under its own weight sags long and broad and recovers shorter and steeper.
Warping the phase gets that for free — `sin` vanishes at both ends of the cycle,
so the film still leaves and arrives dead level and the fold guard's reasoning
is unchanged.

The beat took three attempts and each failure was worth writing down:

1. **The flare was invisible** because it was spent on alpha that was already
   clamped at 1 in the lit quadrant — the only part of the ring that could
   brighten was the part nobody looks at. A flare has to change the shape and
   the colour, not the opacity of something already opaque.
2. **The card bumped into the hoop.** A flat card arriving broadside at a ring
   seen edge-on is only occluded through the middle, which reads as a hole
   punched in the card. It turns to face the aperture now and threads it.
3. **The turn was too aggressive** and foreshortened the card to a sliver before
   it arrived — so it vanished rather than entered. Measured, not guessed: the
   probe now records each card's phase, easing and turn, and the numbers said
   the card *was* reaching the ring and being consumed in about a frame and a
   half. Slower arrival (smoothstep, so it ends flat), less turn, and a card
   wider than the hoop, and the consumption is watchable.

**Lesson, again:** three rounds of adjusting constants by eye, then one
measurement that settled it. Instrument first.

### Pass 37 — the ring becomes a hoop, and the ends rhyme (reviewer-found)

`grok` located the single decision that had been keeping the thresholds flat:

> "The ring is a screen-space disk stamped last, which is why it cannot be a
> hoop."

The `#000` interior was filled *after* the files, the film and the slivers — so
nothing could ever be seen **in** the aperture, the film could not thread it,
and the consuming of a file was a mask rather than a space. The comment above
the function claimed the opposite, which is its own lesson.

Now the void and the **far** limb are painted before everything, and only the
**near** limb after. The film threads the hoop. A card crossing the plane is
visible inside it. And because nothing is masked away any more, the card has to
stop existing by transforming — which is what the brief said all along.

The interior is `#070709` rather than absolute black: the house rule is that a
fill below the page value reads as a hole, and the owner asked for "pure black
in the middle". A near-black that both the film and the rim read against is the
honest resolution of those two, and it is the reason the ring stopped looking
like a die-cut.

Also this pass, on grok's suggestion: **the destinations rhyme with the intake.**
They were three identical coral circles with words beside them — a legend, and a
legend that can flash is still a legend. Each is now a small sibling of the
threshold in world coordinates: the beam goes *into* an opening and is gone, the
way the film goes into the big one, with the channel lettered in the same mono
as the filenames. Named matter in, named channel out.

A bug worth recording: the old circled-dot receiver was still being drawn
underneath the new one, because a text replacement had silently missed on
whitespace. Both were painting, which is why a coral blob sat in the middle of
each hoop. **A replacement that does not assert it matched is a replacement that
can quietly not happen.**

### Pass 38 — the coalesce, made of the film's own behaviour

The change of state had become *correct and invisible*: it obeyed its forty
pixels, it was made of the film's own slivers, it started at the rim — and you
could not see a coalesce in any frame. The instinct is to add more objects. The
right answer was already in the material: film that has not settled in the gate
shows it by being **out of register**.

So inside the transition the emulsion is displaced across the stock, per frame,
by an amount that decays over about two frames — bounded by the rail width,
because mis-registration slides the picture *within* the film, it does not throw
the emulsion off it. The rails and perforations stay put, because the stock is
already stock; the frame rule travels with the picture, because the rule is
emulsion too.

It reads as film arriving and snapping into line, and it added nothing to the
canvas that was not already film.

### Pass 39 — the invariants are asserted (finally)

`qa/hero-line.spec.ts`. It reads `window.__lineProbe` at five viewports and
fails the build if the ribbon folds through itself, if the guard has solved the
geometry by deleting the picture (amplitude, sweep or twist reduced to nothing),
if a file travels away from the threshold, if the console errors, or if the
prototype route leaks into the sitemap.

**And it was checked against a deliberately broken build.** Commenting out
`fitRibbon()` fails five of the seven. A test that cannot fail is the exact
mistake this project already paid for in Pass 0, and it is not a thing to take
on trust.

### Pass 40 — seven forensic defects (reviewer-found)

`agy`, asked to be forensic on a picture three of us had already been over:

1. **The title was swimming upstream.** A film frame `f` sits at screen
   coordinate `f + scroll` — the one relation the whole drawing turns on — and
   the titles subtracted instead. A caption pinned to a frame travelled
   *backwards* against the film at twice the belt speed, in every frame of every
   sheet, and none of us saw it.
2. **Every opener was landing on the last frame of its show.** The manifest is
   stored in reverse capture order (see Pass 31), so a session's run *begins* at
   the highest index of its block; `sessionStarts()` was still looking for
   boundaries in stored order.
3. **Exit shards sprayed upstream** into the oncoming ribbon instead of
   disintegrating into the threshold.
4. **The receiver hoops were shearing** — small objects far from the vanishing
   point, given a full-depth ring, skew hard enough to fight the label beside
   them. Flattened in z.
5. **An arrival flared only the near half** of a hoop, because the far half is
   drawn in a different pass. The arrival is computed once and shared now.
6. **The probe was lying again**: `probe.scroll` still reported a rate the
   renderer had stopped using several passes earlier. A probe that lies is worse
   than no probe.
7. **Comments that said the opposite of the code**, left behind when the void
   moved from front to back.

**The pattern across every reviewer-found defect so far is the same:** they are
all true of *every* frame, which is precisely why they are invisible to whoever
has been looking at it longest.

### Pass 41 — the acetate is rigid

The registration jog was moving the rails with the emulsion, which no film does.
Real stock is a rigid chassis and the picture weaves behind a fixed gate — which
is why what you see is a sliver of the neighbouring frame rather than a picture
that has drifted off the film. Rails and perforations are drawn from the
un-jogged boundary now, and the jogged picture is clipped to the gate they
define.

Also: one file with a **ghost of the next** far behind it. One card alone reads
as a demo probe; two at full strength were the sticker sheet again.

### Pass 42 — what coral is for (reviewer-found, then corrected)

`grok`: *"Coral is BitterClip's hand. It should mark the act, not the
plumbing."* It had spread to both hoops, both limbs, three beams, three
receivers, the title's key bar and the show name — which is what makes an accent
read as diagram ink.

The first attempt took the note literally and removed coral from everything
except a flare. That is a hero with no hand in it at all. **The correction to
the correction:** the two thresholds are where BitterClip *acts*, so they keep
the accent and drive toward white as they answer; everything downstream of the
act — beams, receivers, type — is neutral, because it is the result rather than
the doing.

And the title is **optically printed into the frame**, not sat on a plate:
letters in the quiet band at the top of these sessions, each glyph carrying a
film-black hold-out the way an optical printer leaves one. The plate only ever
existed because the type was landing on somebody's torso. The exit threshold now
answers too, on every frame boundary that crosses it — a bookend that only works
on one side is not a bookend.

### Pass 43 — the elasticity, measured (owner-found)

Owner: *"This film still has a very elastic effect. Before we start making
changes, let's actually assess here."* Right on both counts. Measured at
1200x760, over 160 samples:

| | min | median | max | spread |
|---|---|---|---|---|
| frame length | 65.8px | 108.8 | 139.2 | **2.11x** |
| strip width | 90.8px | 113.2 | 123.1 | 1.36x |
| frame ÷ width | **0.596** | 0.985 | **1.219** | **2.05x** |

A frame's length relative to the film's width is a constant of the stock.
Swinging it 2x along one strip is the elasticity, stated as a number.

**Two foreshortenings act on this ribbon and they do not read the same.**

- **Across** it, from the roll: the width narrows, the frames keep their length,
  and the eye reads a **twist**. This is what the owner's film reference is made
  of, and it was never the problem.
- **Along** it, from the heading: the frames compress while the width does not,
  and the eye reads **rubber**, because nothing physical shortens a frame
  without also narrowing the film.

`|tangent.z|` was reaching **0.838** — the line running 57 degrees out of the
picture plane, squeezing frames to 54% of their length on a strip whose width
barely moved. The fold guard had never looked at heading; it only ever checked
that the ribbon did not pass through itself.

`MAX_HEADING_Z = 0.34` now bounds it, and the roll was raised to compensate,
because the twist is the dimensionality that was reading correctly. After:

| | spread |
|---|---|
| frame length | **1.10x** (was 2.11x) |
| frame ÷ width | **1.26x** (was 2.05x) |

and what remains is almost entirely the roll. The cost is a gentler depth sweep,
since z amplitude and heading are the same parameter — that trade is the right
way round, because depth scales a frame and the width *together* and so never
reads as rubber in the first place.

The bound is asserted in `qa/hero-line.spec.ts`.

**Lesson:** "it looks elastic" was true for two passes before anyone measured
it, and the measurement named the cause in one shot. Three earlier attempts to
fix the rubbery read by adjusting constants had all been aimed at the wrong
foreshortening.

## Open, by severity

1. **The transitions are correct and nearly invisible** (grok). They obey the
   38px, they are slivers rather than chips, they start at the rim — and you
   cannot really see a coalesce in any tile. The change of state is a
   specification more than a picture.
2. **The file cards share the projection but not the world.** They take the key
   and they foreshorten, but across a sheet the near and far card are almost
   the same size, so the left side is still pictorially a sticker sheet.
3. **Coral is outlining a system** (grok). Rings, beams, receivers, title key —
   the accent has become a diagram colour, while the most beautiful edge in the
   picture is the film's own top hairline, which is not coral at all.
4. **The title is still a broadcast lower-third** laid on a photograph: the one
   piece of UI riding the one piece of cinema.
5. **Invariants are recorded but not asserted.** `zMargin`, the fold guard and
   the card telemetry are all on the probe; the test that fails the build on a
   regression does not exist.
6. **Sign-off.** The manifest prints two real people's names and shows their
   faces. The rubric says no line is attributed to a real person unless they
   signed it off. Worth confirming before this leaves `/lab`.
