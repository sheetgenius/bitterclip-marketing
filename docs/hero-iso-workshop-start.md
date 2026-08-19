# The Hero ISO Workshop — start message

*(Paste this whole document to Claude to open a workshop session. It assumes the
repo at `~/co/bitterclip-marketing`; it survives context loss — everything it
references is committed.)*

---

We are workshopping the isometric hero at `/lab/iso` — open-endedly, iteratively,
for as long as it keeps getting better. You are the lead pair of eyes and hands.
Read `docs/hero-iso-brief.md` before touching anything (especially §4, the two
camera facts); it is the design's memory and you keep it current as you go.

## The bar

An anonymous visitor who has never heard of BitterClip looks at this picture for
three seconds and understands: **folders of raw recordings are dropped in at one
end; the machine enhances the footage as it passes; a finished show winds onto
the reel; and it is broadcast out to YouTube, Podcast, LinkedIn.** Every
iteration is judged against that sentence before it is judged against taste.
The hero line ("You still gotta record") is a punchline — the picture must have
already made the argument or the line is just words.

## Order of work — fundamentals before bells and whistles

Work in this order, and never let a later layer break an earlier one:

**1. Geometry and composition.** Silhouette, mass balance, scale relationships,
believable load paths, correct occlusion, value separation between planes, the
bottom-left→top-right diagonal, and how the machine sits against the type column
(top-left is reserved for the hero line and CTA). Current standing problems: the
rig is over-articulated (too many parallel bars; legs cross the film's climb);
the lamp reads as resting on the tie bar instead of hanging; the bench's middle
is empty; the reel's far flange reads as a void; the flange window shows empty
blackness instead of wound film. Ruling (2026-08-18): **the projector lamp sits
halfway up the rig**, not in the bottom third — balance the whole assembly
around that.

**2. Story legibility.** Each station must read without copy: the drop is
obviously an intake (files/folders falling, landing, dissolving into the bed);
the extrusion is obviously one-becomes-many; the turrets are obviously
*instruments enhancing the film* (beams that visibly do something to the frames
they touch); the reel is obviously the finished show accumulating; the throw is
obviously distribution. The one-in-many-out rhythm (one file every ~6.4s, film
running continuously) is load-bearing — keep it. Test legibility with naive
eyes, not your own (see appendages below).

**3. Drama.** Film noir. Kino. The frame is a dark stage and **the machine is
the subject standing on it**. Light is the composition: the acid-plate bed gets
a glow where footage dissolves; the lasers glow; the projector's throw spreads
like a prism into the three destination beams; the great reel goes *darker*,
receding into the stage instead of competing with the action. This REVERSES the
old "no glow" rule (owner, 2026-08-18) — gradients and bloom are now allowed,
but with noir discipline: hard sources, controlled pools, darkness doing most
of the work. No web-glossy haze.

**4. Micro-detail.** Only once 1–3 hold: turrets detailed into believable
instruments; **words — captions, subtitles — visibly etched into the frames as
they pass under the beams**; sprocket perforations; thumbnail content in the
frames; the bed dissolve upgraded from an alpha fade to particles swooping to
the plane of the table. We can always get better; assume dozens of passes.

## The loop

The only reliable loop is **change → build → look at pictures → verdict**.
Reasoning about this geometry without rendering it produces confident wrong
answers (documented twice in the brief). Mechanics:

- `bun run dev --port 4180` for fast HMR iteration (binds IPv6-only — use
  `localhost`, never `127.0.0.1`). Verify with a production build
  (`bun run build`) before committing.
- **Node is pinned to 25** (`.nvmrc` + `engines`): `better-sqlite3` is a
  native module compiled per node ABI, and this machine has two nodes
  (Homebrew 25 = the shell default, nvm 22 = some agent harnesses). Whoever
  rebuilds it under the wrong node breaks the other side. The canonical node
  is Homebrew's; from a harness whose PATH resolves nvm first, prefix
  commands with `PATH=/opt/homebrew/bin:$PATH`. If a build dies with
  `NODE_MODULE_VERSION` mismatch, run
  `PATH=/opt/homebrew/bin:$PATH npm rebuild better-sqlite3` — never rebuild
  it for the nvm node.
- `node qa/iso-shot.mjs tmp/iso/<name> <t> <t> …` screenshots the page frozen
  at exact renderer times via the `window.__iso.still(t)` hook; `--clip
  x,y,w,h` (viewport px, 1600×900) crops. Compare builds at the SAME t.
- Capture several moments, not one — motion bugs are invisible in a single
  frame. Useful t's: 0.6 (file mid-fall), 1.3 (file just landed), 2.35 (the
  reduced-motion still), 5.8 (gap; strip mid-run).
- Look at crops of what you changed AND the full frame — local fixes routinely
  break the composition. If a shape vanishes, check for NaN first; Canvas 2D
  draws nothing silently.

## Visual appendages

Your solo eyeball is not a sufficient gate. Three additional sets of eyes:

- **Fresh-context subagents** (your own): spawn with ONLY an image and a naive
  question — "What is this? What does this machine do?" — to test story
  legibility, or with an expert prompt (composition/geometry critique) for
  craft. Never show them your conclusions first; don't lead the witness.
- **grok** — `grok -p "<prompt naming absolute image paths>" --permission-mode
  acceptEdits`. Verified working. Its cold reads are valuable precisely because
  they're uncontaminated (it read the reel crop as "a satellite dish" — that's
  a finding, not a failure).
- **agy** (Google harness; historically the strongest visual eye — lead
  external reviewer) — `agy --print "<prompt>"`, allowed by the
  `Bash(agy --print:*)` rule in `~/.claude/settings.json` (added 2026-08-18).
  Give it the ABSOLUTE image path and say "read that exact path directly, do
  not search" — given a bare filename it goes hunting with shell commands it
  has no permission to run, and dies.

**Corroboration rules** (adapted from the identity-studio tri-model protocol):
tag every finding with who saw it; two of three eyes agreeing = act on it; a
solo finding earns a zoom/crop or a hard measurement before you act; a naive
read that misidentifies an object ("satellite dish") outranks any expert
compliment. Log findings and rulings as dated entries in the brief (or a nit
ledger next to it) so nothing is lost between iterations.

## Hygiene

- Small commits, explicit owned paths only — the tree is shared; never
  `git add -A`. Fetch/rebase before committing; push when green so parallel
  sessions don't split.
- Keep `docs/hero-iso-brief.md` truthful after every ruling or reversal, dated.
- Screenshot evidence goes in `tmp/iso/` (untracked), named by iteration.
- Still standing: three.js stays out of the homepage bundle; render only while
  visible; reduced motion gets ONE static frame (keep `STILL_T` a moment worth
  freezing); don't touch `app/pages/index.vue`, `app/assets/css/main.css`,
  layouts, or `content/`; never invent quotes and attribute them to people.
- Surface to Michael: direction forks (e.g., changing the rig's topology),
  anything affecting the hero line/CTA column, and a short before/after strip
  at the end of each work block.

Start by rendering the current state, listing your top findings against the
bar, and working the highest-leverage fundamental first.
