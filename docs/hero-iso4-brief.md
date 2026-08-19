# ISO4 — the facing projector. A standalone build brief.

Route to create: **`/lab/iso4`** (new files: `app/pages/lab/iso4.vue`,
`app/components/HeroIso4.client.vue`, `app/lib/hero-iso4/scene.ts`).
Predecessor to LEAVE UNTOUCHED and to mine for parts: **`/lab/iso3`**
(`app/lib/hero-iso3/scene.ts` — ~1,100 lines of three.js that already solved
most of your problems; steal from it shamelessly).
Companion documents: `docs/hero-iso-brief.md` (the design lineage),
`docs/hero-iso-workshop-start.md` (workshop protocol),
`docs/hero-iso-nit-ledger.md` (every mistake already made once — read it so
you don't make them twice).

This brief is self-contained. A fresh agent should be able to build ISO4 from
this document plus the repo, without the conversation that produced it.

---

## 1. What this is

The hero for BitterClip's homepage. BitterClip is **agentic video editing**:
you drop in raw footage (a Zoom call, a session recording), and an AI that
watches every frame cuts it into finished, published artifacts — full
episodes, portrait clips, transcripts — and remembers everything it has ever
seen (deep video memory).

The bar, set by the owner and non-negotiable: **a stranger must understand
the concept in one second, unequivocally** — file in, machine works, three
finished artifacts out — AND the page must read as deep tech with real craft,
because the company has no recognizable customers yet and the page's own
quality is the only social proof. Film noir staging; the machine lights its
own stage; "it can't just look like some random 3D experiment."

## 2. The concept (owner's sketch, 2026-08-19)

A **projector facing the viewer**, drawn from a hand sketch with these
elements, top to bottom:

1. A file card labeled like a real recording (`ZOOM MP4` in the sketch; the
   established art uses a two-tile call card — see §6) falls from above.
2. It passes a **dashed intake outline** and drops into a **hopper on top of
   the machine — like a wood chipper's throat**. This is the drop zone. On
   crossing, the card shatters into a salmon **bitstream** that rains into
   the throat (the "rite of indexing" — this exact effect exists in iso3;
   port it).
3. The machine: a compact projector body whose **big lens faces the viewer**.
   The lens is doing double duty by design: it is the projector's output AND
   an eye — "BitterClip watches your footage" and "BitterClip projects your
   outputs" in one form. When the machine boots, the lens ignites (lamp
   strike: flicker, catch, hold).
4. From the lens, **three beams project TOWARD the viewer**, landing on three
   artifact cards in the foreground like dealt cards — the payoff owns the
   front of the frame.

### The three artifacts (all three renderers already exist in iso3's
`drawScreen` — port them)

- **Landscape episode** — 16:9, Mike & John frame content, player progress
  bar, small YouTube mark top-right. Dusty red tint `#d63d47`.
- **Portrait clip in an actual phone outline** — bezel, island, 9:16 crop of
  the same frame content, BIG stacked caption bars, small `in` (LinkedIn)
  mark top-right. Dusty blue `#3d78ae`.
- **Waveform + transcript** — a panel: waveform strip on top, speaker-labeled
  transcript lines below (`MIKE` / `JOHN` + greeked bars), podcast/RSS arcs
  mark top-right. Amber `#d9a25c`.

Three deliberately DIFFERENT silhouettes (landscape / tall phone / document):
shape carries the message at any size. Idents stay small and tasteful,
top-right of each artifact — never logo walls.

## 3. Camera — the deliberate fork

ISO4 uses a **PerspectiveCamera**. This is the first concept that genuinely
needs perspective: "projects toward you" only works if nearer things grow.
The iso1–iso3 lineage used a fixed oblique axonometric inherited from a 2D
study; do not port that camera. Guidance:

- Modest FOV (~30–38°). **Three-quarter view, not dead-frontal**: the
  projector turned roughly 25–35° toward the viewer. Dead-on gives a
  Mickey-Mouse silhouette from the reel(s) and forces a centered
  competitor-style layout.
- Composition stays the house asymmetric stage: **type column left, machine
  center-right, the throw aimed toward the lower-left foreground** so the
  artifacts land NEAR THE CTA — "here's what you get, now press start."
- The camera is fixed. No orbit, no parallax on v1.

## 4. The machine body

Compact, engineered, charismatic — "something SpaceX would manufacture" in a
noir theater. Elements:

- **Body**: one sculptural housing. Machined faces, restrained detail.
- **Lens**: large, front, with an emissive iris/ring. Dark glass until the
  boot strikes it alive.
- **Hopper**: an intake throat on top, wood-chipper honest, with the dashed
  scan-outline floating at its mouth (the dashed rectangle is an established
  brand element — salmon `#f28f84`, breathing).
- **Reel(s)**: the archive pillar rides ON the machine at sane scale — a
  film reel (or reel pair) mounted on the body, windowed like iso3's (five
  round windows, matte bores — see ledger for why bores must be matte),
  turning while the machine runs, film visibly winding. The archive is
  present but is a SUPPORTING character. Its predecessor dominated 40% of
  the frame and communicated the least; do not repeat that.
- Optional connective tissue if the story needs it: bits enter the hopper →
  become film → wind onto the reel → the lens projects. Ingestion, memory,
  output on one body.

## 5. The boot narrative — "lights, camera, action"

The page opens with a STAGED SEQUENCE, then settles into calm steady state.
Nothing loops except the work. Beats (retime to taste, keep the order):

1. **Dormant.** Dark machine, dashed intake breathing faintly at the hopper.
2. **The drop** (~0.8s): the call card materializes above, falls,
   FLASHES the dashed outline at the crossing, shatters into the bitstream,
   which rains into the throat. The intake glow flares as it's absorbed.
3. **The machine wakes** (~3s): the reel spins up (transport ramps from
   rest — quadratic ease reads as an accelerating mechanism).
4. **The lens strikes** (~4.5s): real lamp strike — flicker, catch, hold.
5. **One, two, three** (~5.5s +0.5s each): each beam ignites with its
   artifact card, in turn.
6. **Steady state**: reel turns, lens glows, beams hold, intake breathes.
   No recurring file drops — the owner killed repeating intake theatrics as
   distracting. Keep total boot ≤ ~6.5s.

Reduced motion (`prefers-reduced-motion`): render ONE still of the fully-lit
steady state (pick a photogenic t). Never a slower loop.

## 6. Content identity — Mike & John, Episode 01

Every piece of "footage" in the scene is coverage of ONE two-person session
(owner ruling). iso3 has the complete system — port these functions nearly
verbatim from `app/lib/hero-iso3/scene.ts`:

- `renderFrameContent` — abstract frames: two-shot (Mike broader left, John
  taller right), Mike close-up, John close-up, and a real-text title card
  ("MIKE & JOHN / EPISODE 01"). Bust silhouettes, never faces. (A pareidolia
  bug was fixed here once — two head-dots plus a centered caption bar reads
  as a cartoon face; keep the fuller busts.)
- `frameArt` — per-id artwork cache (the per-frame repaint was a real CPU
  cost; blit, don't repaint).
- `drawCaptionBars` — the caption motif.
- The falling file card's face: the **Zoom-call texture** — two participant
  tiles (MIKE / JOHN), red REC dot + timecode, `ep01 — raw session` label.
- `drawScreen` — the three artifact renderers described in §2.

## 7. Page copy and layout (already ruled; reuse from iso3.vue)

- Eyebrow: `AGENTIC VIDEO EDITING` (mono, tracking-wide, zinc-500).
- Headline: `Footage in` / `Episodes out` — second line in the homepage
  gradient (`from-[#ffd0c7] via-[#f28f84] to-[#d66f5f]`, bg-clip-text).
- Subhead: "BitterClip watches your footage, remembers every frame, and cuts
  it clean — episodes for your channels, reels for your clients, answers
  from every session."
- CTAs: filled coral `Start free →` + ghost `Watch it work ▶`.
- Spec line (mono, quiet): `knows who's talking · finds any moment · cuts
  you'd ship`.
- **Layout lessons already paid for**: ONE full-bleed canvas at every
  viewport (a canvas band can never color-match CSS through tone mapping —
  the seam is structural; overlay, don't stack). Page section background
  `#08090a` matching `scene.background`. Mobile: text anchored top, spec
  bullets at the fold, machine framed into the gap by an aspect-aware camera
  fit. The file-drop corridor must never cross the hero text.

## 8. Technical foundation (all proven in iso3 — copy the patterns)

- three.js via **dynamic import from the lab route only** — it must never
  enter the homepage bundle. `HeroIso4.client.vue` mirrors
  `HeroIso3.client.vue`: IntersectionObserver start/stop, reduced-motion
  still, and it MUST expose the renderer as `window.__iso` so the screenshot
  harness works unchanged.
- Renderer stack: WebGLRenderer (antialias), ACESFilmicToneMapping ~1.18,
  `scene.background = 0x08090a` (opaque; the composer can't composite over
  DOM), EffectComposer = RenderPass + UnrealBloomPass (~0.32/0.55/0.72) +
  **OutputPass (mandatory — without it tone mapping silently drops)**.
- Lighting: dim hemisphere + fill + cool rim for the base; PRACTICALS carry
  the drama (intake glow, lens glow, per-beam light). PointLight intensities
  are physical-falloff sized (dozens, not units). **three.js light `layers`
  cannot mask per-object — don't try.** Floor: vast dark plane (`~0x232327`)
  so its horizon never enters frame; with a perspective camera the clip
  planes are normal, but remember the iso3 lesson: size near/far generously.
- Shadows: one shadow-casting practical max, 512 map, half-rate updates
  (`shadowMap.autoUpdate = false`, `needsUpdate` every other frame).
- Beams: iso3's volumetric shader (open cones, axial falloff from source,
  facing-angle silhouette, drifting two-octave value-noise smoke, per-beam
  `uOn` ignition uniform). With a perspective camera, `PointsMaterial`
  sizeAttenuation works normally (in iso3 it had to be disabled — custom
  projection).
- Perf bar: iso3 measures ~120fps on real GPU (headless playwright uses
  SwiftShader and reads ~5fps — never trust headless fps).

## 9. Workflow — how to iterate (the only loop that works)

**Change → render → look at the picture → verdict.** Never reason about 3D
composition without rendering it.

- Dev server: the OWNER runs `bun run dev --port 4180` (IPv6-only: use
  `localhost`). If a build is needed: node is pinned to 25 —
  `PATH=/opt/homebrew/bin:$PATH bun run build`; if `better-sqlite3` throws
  NODE_MODULE_VERSION, rebuild it under Homebrew node ONLY (see workshop doc).
- Screenshots: `ISO_URL='http://localhost:4180/lab/iso4' node qa/iso-shot.mjs
  tmp/iso/<name> <t> <t> …` (freezes exact times via `window.__iso.still(t)`;
  `--clip x,y,w,h` in 1600×900 viewport px). Capture several boot beats AND
  steady state; crop tight on what you changed AND check the full frame.
- Outside eyes (corroboration: 2-of-3 agree = act; solo finding = zoom
  first): `grok -p "<prompt with absolute image paths>" --permission-mode
  acceptEdits` and `agy --print "<prompt>"` (give agy the ABSOLUTE path and
  say "read that exact path directly, do not search"). Ask naive questions
  ("what does this company do?") separately from expert critique. Log
  findings and rulings in `docs/hero-iso-nit-ledger.md`, dated, appended.
- Hygiene: the tree is shared. Commit small with EXPLICIT pathspecs (never
  `git add -A`), fetch/rebase before committing, push when green. Screenshot
  evidence stays in `tmp/iso/` (untracked). Do not touch
  `app/pages/index.vue`, `app/assets/css/main.css`, layouts, `content/`, or
  anything under `/lab/iso3` and `/lab/iso`. Never invent quotes.

## 10. Acceptance

1. A cold model (agy or grok) shown ONLY the steady-state page answers "what
   does this company do?" with drop-footage-in → AI edits → episodes/clips/
   transcripts out — without hesitation. (iso3's best cold score was 8.5/10
   with full pipeline narration; beat it.)
2. The boot completes the whole story in ≤ 6.5s and every act is legible in
   a single still (screenshot each beat to prove it).
3. The three artifacts read by silhouette alone at mobile width.
4. Noir craft holds: rims not voids, practicals motivated, no glints from
   bore-mirrors (matte side-materials on any pierced geometry), no seams
   against the page.
5. ~60fps+ on real GPU at dpr 2; reduced-motion still is photogenic.
6. Desktop 1600×900, tall 1330×1020, and mobile 390×844 all verified by
   screenshot before any commit claims completion.

## 11. Open questions for the owner (don't guess — ask or leave hooks)

- One reel or two on the body? (Two = classic silhouette; one = cleaner.)
- Do beams land ON foreground cards, or do the cards float independently
  with the beams as light rays behind them?
- Does the hopper's dashed outline persist in steady state (drop-zone
  affordance for a future real drag-and-drop) or fade after the boot?
- Exact boot timings — the owner conducts pacing by feel; ship a constants
  block (`BOOT = {...}`) and expect tuning.
