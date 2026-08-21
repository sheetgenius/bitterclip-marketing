# Homepage copy R&D journal

Started 2026-08-21. Long-horizon pass: market brief (LinkedIn/Reddit/Canny) ×
shipped BitterClip (`/Users/c3po/co/bitterclip`) × live marketing homepage.

Rule: each cycle has a question, evidence, a synthesis, and a decision that
the next cycle is allowed to use. Cycles do not reopen settled product facts
without new code.

## Settled before cycle 1 (from prior session)

- Couple names stay: Deep Video Intelligence / Precision Edits.
- H1 stays: Footage in / Episodes out.
- Prices and plan keys stay (owner-ruled catalog).
- Hero is the ISO4 machine, not a live editor.
- Flagship product journey (CHARTER): understand useful material → one
  editable polished cut → exact render → download/watch/open → revise the
  same cut. Editor is verification, not mandatory assembly.
- Models must not invent timestamps. Speaker names are confirm-once.
- Visual processing is on every shipped plan. Pro is Deep-tier / queue /
  20GB / 1000 exports / copy_video_light, not “has vision.”
- First economic case is a strong reel + portrait variant for LinkedIn, X,
  YouTube — one cut you’d send, not 30 leftovers.
- **Doctrine correction (owner, 2026-08-21):** CHARTER’s “no taste model”
  was written for a pure workbench for *external* agents. The rail is now
  a product surface. The embedded agent must have a point of view. What
  remains forbidden is a privileged ranker / virality score / leftover
  pile. Ingest `next_move` already authors “editorial judgment” as
  BitterClip’s episode editor-in-chief (`episode_synthesizer.rb`). Project
  Working Brief is standing direction; the person’s request in the moment
  wins.

## Cycle log

### Cycle 1 — Operation catalog vs homepage

**Question:** What may the page claim an agent can do?

**Evidence:** `operation_catalog.rb` MODEL_VISIBLE tools; `mcp_server.rb` instructions.

**Facts:**
- `transcript_search` is real. FIND tool, not a judge. Hits never authorize a cut. No `range:` param; `speaker` is a legacy diarization-label filter.
- Make a reel: `episode_read` first, then `episode_create` (multi-segment) or `clip_create` (one range), then `render_create` / `render_status` unless draft-only.
- Suggestions are a different verb: `review_points_place` 1–20 Moments. That *is* a multi-option path.
- Ordinary make/cut/create is private-render intent in tool descriptions. Compact initialize still says “Render/publish: explicit user intent.” Live Workspace is stricter on a *fresh* render.
- `publish_send` never posts. Human confirmation is real.
- Claude card is a fake trace: `transcript_search · speaker: sarah · range: tuesday` cannot exist; `render` is not a tool name.

**Decision:** FAQ “not picking moments out of a transcript search” is overstated. Evidence routing *starts* at search. The honest wedge is: search finds neighborhoods; a cut is a committed artifact, not a score. Homepage must not show a fake tool trace.

### Cycle 2 — One-shot contract in code

**Question:** Does “ask once, get a playable reel” ship?

**Evidence:** `clip_create` → draft Composition; `render_create` is a second, revision-bound job; rail cards split Clip vs Export.

**Facts:**
- Create persists `status: "draft"`. No Download on create. Open in editor can be delayed while conversation capture settles.
- Playable Export only after `render_status` ready. Bounded wait 20s, then poll.
- Same-cut iteration is *instructed* (`episode_edit` on existing `comp_…`, near-duplicate convergence) but a new idempotency key still duplicates. `supersedes_episode_id` does not delete orphans.
- Ingest synthesis is orientation, not accept-and-cut. “Make this” posts a composer ask with no timestamps.
- Portrait is a sibling of an existing landscape Clip, extra step.
- Rail is bound to the *open Episode*. “Tuesday” is not a first-class handle.

**Decision:** Homepage may say an agent can cut a source-backed draft and privately render it, then Open / Download without a Publish gate. Must not say one tap → MP4, or that ingest hands you a candidate reel.

### Cycle 3 — Identifying compelling moments

**Question:** Garvey’s “identifying” — auto pile or on ask?

**Evidence:** `EpisodeSynthesisJob` auto-at-ingest; `episode_synthesizer.rb`; CHARTER forbids in-house clip picker / virality score.

**Facts:**
- At ingest: one `next_move` (`analyze` | `inspect_moments` | `create_artifact`), no timestamps. Key ideas 3–8, not ranked as best moments.
- No Moment pile at ingest. Moments appear when someone *places* a range (1–20). No score column.
- `open_workspace` does **not** pick a strong clip. `focus_range` is caller-supplied and transient. Marketing `mcp-tools.yml` “strong clip already selected” is unsafe.
- Resting rail: one chip → composer ask. “Until then the opening has analyzed only.”

**Decision:** Safe claim: after a recording is ready, BitterClip reviews the Episode and can open a grounded conversation with one next editorial step. Timed identification happens when you ask. Unsafe: auto-selects a compelling clip; Opus-style leftovers.

CHARTER addition to settled facts: **Do not build or expose a privileged in-house clip picker, virality score, moment ranker, or taste model.** “Only the cleanest cuts” rhymes with a ranker. Kill the superlative.

### Cycle 4 — Speakers

**Question:** Can the page say “every speaker named”?

**Evidence:** speaker-identity-canonical, fusion, TranscriptSpeakerNamer, 2026-07-25 inventory.

**Facts:**
- Zero-input first session: `Speaker 1`, `Speaker 2`. ~40% of sampled tracks still generic.
- Real names without a click: (a) acoustic `auto` against enrolled voiceprint; (b) transcript namer ≥0.6 writes guesses onto captions (canonical flags this as crossing the authority boundary).
- Visual does not name alone. Faces are a vote; humans or acoustic auto name.
- Confirm-once persists profile + captions + project roster. Voice enrollment is a *request*, fail-closed, quarantined until proof.
- Default memory is **this project**, not account-wide (`global_host` is a promotion).
- Spanglish is not a documented speaker-identity failure. Do not claim it either way.

**Decision:** Replace “every speaker named.” Safe: turns are split; unnamed stays Speaker N until you name them or a saved voice matches; name someone in a project and, after the voice is saved, later sessions in that project can recognize them.

### Cycle 5 — Compare/Opus vs CHARTER

**Question:** Does compare already say the right job?

**Evidence:** `content/compare/opus-clip.md`

**Facts:** Compare already leads with “Fix the cut or roll again.” Axes: when first cut is wrong; lands on the word; **No score, on purpose**; ask instead of click; built for people talking. Competitor strength admitted: fastest ten shorts.

**Tension:** Homepage fold “only the cleanest cuts” implies ranking. Compare says no score on purpose. Pricing plan named Clip + 150 exports is the volume unit compare exists to refuse. H1 “Episodes out” is the Episode noun; compare still has to mention clips because that is the shopping category.

**Decision:** Homepage should borrow compare’s *job* language (fix the cut you have; no score; lands on the word), not its “ten shorts by Friday” framing. Do not let the fold be weaker than `/compare/opus-clip`.

### Cycle 6 — Identity Studio vs “TikTok threw up”

**Question:** Is Alisa Hamilton’s wound already a shipped product?

**Evidence:** Identity Studio axioms; blog “Your show has a signature now.”

**Facts:** Product exists to make media feel owned: openers/outros/bumpers as identity moments; FX tab; brand packs. “Clips made by tools look like they came from a tool” is the founder’s own sentence. Homepage never mentions it.

**Decision:** Not a fold claim (fold is understanding + one cut). Eligible as a later “it doesn’t look like a template” beat, or a proof caption, not a pillar. Do not promise custom captions as the differentiator vs Opus templates unless the fold has room after P1–P4.

---

### Cycle 7 — Attack on provisions

**Must rewrite:** P3 glosses (don't define DVI as anti-keyword-hunt; don't slash PEC into two claims). P4 "review/editorial step" sounds like the picker CHARTER forbids. P5 confirm-once overclaims enrollment. P6 must say you *do* check the cut. P7 "citation" will become fake traces. P9 Andrew is the wound, rewrite #demo caption, recut Rohan.

**Survives:** P8 kill agentic. P10 bans.

**New P11:** First artifact the page may show is a source-backed *draft* of one cut, not a ready file and not a list. Ban best/strongest/cleanest/compelling in our voice and in scripted agent replies.

**PEC vs no-score:** "One cut you'd send" is the person's standard, not our ranker — keep if it doesn't sit next to "cleanest." Put "lands on the word" in How, not the couplet.

### Cycle 8 — Fold drafts

Ship **A**:
- Eyebrow: One cut, not a pile
- DVI — whole conversation in view.
- PEC — one cut you'd send.
- Fine print: 60 minutes. You confirm every send. (drop unclear "Hop the tape")
- Whisper: Watch a cut → #demo

B hotter but "insight" can read as auto-identify. C is too operational for the fold.

### Cycle 9 — Below-fold

Order: fold → #demo → #how → agent → FAQ → pricing.
How H2: First, the session is understood.
Kill never-open-it. Speaker N in how + new FAQ.
Demo card: brief → drafting one reel → draft (not ready) → open in editor → revise that cut → Download after render.
Clip CTA: Start on Clip. 150 exports last bullet.

### Cycle 10 — Hostile visitor on locked draft

Bounce at 15s: **No.** Stay reason: “One cut, not a pile” + “one cut you’d send.”
Remaining Opus-smell: scripted ask is still “highlight reel”; plan named Clip; H2 “Real sessions, real cuts.”
Remaining compiler-smell: DVI/PEC names; “neighborhood”; Speaker N stuffed into How lede.
Fatal remaining: **“Two cameras, one moment, frame-locked”** as first artifact after fold — proves sync, not a Monday post.

Decision: keep eyebrow/H1/couplet. Recut `#demo` lede so the first painted object is a cut you’d send, not multicam flex. Charter reel ask in the card is allowed; don’t let it be the only ask.

### Cycle 11 — Product-truth on locked draft

Unsafe leftover: “after the voice is saved” (enrollment ≠ confirm). Stretched: “session is understood,” “whole conversation in view,” “what is on screen” as anti-search differentiator.
Lawful: one cut not a pile; one cut you’d send; Speaker N; draft not ready; Download after render; search = neighborhood.

Decision: How lede = “reviews the Episode; one next editorial step.” Split speaker: name in this project; later recognition needs enrollment and can fail. Drop “what is on screen” from clipper FAQ.

### Cycle 12 — Market jobs vs locked draft

(Completed in-session after the scoring agent stalled; scored against the evidence brief only.)

| Job | Score | Phrase / gap |
|---|---|---|
| Identifying | PARTIAL | Ingest orients; timed ID on ask. Fold does not say “identifying.” |
| Context | PARTIAL | “Whole conversation in view” — not Nissenblatt’s “context that’s missing.” |
| Insight not soundbites | PARTIAL | “One cut you’d send” vs Hanna. Demo still a highlight reel. |
| Who said what | HIT (below fold) | Speaker N FAQ. Miss on fold. |
| Producer you can talk to | PARTIAL | Agent section. Fold eyebrow is “one cut, not a pile” not “producer.” |
| Brief like an editor | HIT | Claude card brief + “intro drags.” |
| One place not a hop | PARTIAL | Rohan; not named as the hop. |
| Don’t invent context | MISS | Never said. Should be FAQ. |
| Source-linked | HIT | Check against the moment; Open in editor. |
| Quiet moment | MISS | Park clip is a stretch; no copy. |
| Taste | HIT | “You’d send” + confirm. |
| Quality over 30 leftovers | HIT | Eyebrow + FAQ clippers. |
| Non-podcast sessions | PARTIAL | Andrew coaching; fold doesn’t name types. |
| Confirm is a feature | HIT | Fine print. |
| Don’t look like TikTok | MISS | Identity Studio unused. |

Bounce words remaining: none of the banned set on the fold. “Start on Clip” is a plan name, not “Start clipping.” “Highlight reel” is CHARTER-true and still smells like Opus to this shopper.

Would they see themselves on the first screen?
- Hanna: Yes, weakly — one cut you’d send ≈ insight not soundbites.
- Garvey: No — identifying is not on the fold.
- Colin: Yes — not a pile / not garbage.
- Arielle: No — “context” unsaid.
- Alisa: No — TikTok/template unsaid.

### Cycle 13 — Synthesis (this document’s close)

See the shippable spec in the session reply. Journal path is this file.

## Locked draft (post 10–11 patches)

**Fold**
- Eyebrow: One cut, not a pile
- H1: Footage in / Episodes out
- Deep Video Intelligence — whole conversation in view.
- Precision Edits — one cut you'd send.
- CTA: Start free
- Fine print: Free to start — 60 minutes of footage a month. You confirm every send.
- Whisper: Watch a cut → `#demo`

**#demo lede patch:** lead with the cut as something you’d send a client, then cameras as how it was made — not the reverse.

**#how:** First, the session is in view. Reviews the Episode. Speaker N until you name them. Cuts land on the word. Open the editor to check source.

**Speaker:** Name once in this project. Later recognition needs a saved voice and can fail. Never “every speaker named.”

**Agent card:** One CHARTER reel ask → draft → open in editor → revise that cut → Download after render. No tool chrome, no best-lifts, no ready MP4.

**FAQ clipper:** one cut from the whole session; search finds a neighborhood; does not pick the cut; revises that cut not ten options. Add: does it invent context? No — source clock is authority.

**Pricing:** Clip name stays. CTA Start on Clip. 150 exports last.

**Footer (chrome leak):** stop “Start clipping” and “into clips you can check” as the brand sentence; match the fold.
