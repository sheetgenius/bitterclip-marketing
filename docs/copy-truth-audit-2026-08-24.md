# Copy–truth audit — the grounded pass (2026-08-24)

> **Status: historical audit evidence.** Reverify every finding against current
> product code and the canonical pricing plan before applying it.

Seventy copy blocks audited against the pricing plan
(`bitterclip/docs/product/pricing-and-market-plan.md`), the billing code
(`billing_plans.yml`, `creator_trial_lifecycle.rb`, `creator_proof.rb`,
`bittercheckout session.post.ts`), shipped capabilities (`CURRENT_STATE.md`),
and the house doctrine (`docs/homepage-copy-rd-journal.md`). Method: a
14-agent verified pass — four truth-gatherers, five section auditors, one
adversarial verifier per batch refuting every diagnosis and every rewrite.
28 blocks stand as written; 42 get rewrites; every rewrite below survived
fact-checking. Nothing in this document claims a feature that does not ship.

## The verdict

Every price, limit, and trial mechanic on the homepage checks out — $24/$99,
seven exact days, the 2-hour central cap, 10/40 production hours, $10/$40
balances, 4 GB/20 GB, watermark rules, cancel semantics. What's broken is
**posture**. Three patterns account for nearly all of it:

1. **Confession endings.** Answers close on the failure mode: "…and it can
   fail," "…may require an active plan," "no remote guests, no guest
   recording links, no separate track per person." Each fact is true; none
   has to be the last thing the reader hears.
2. **Underselling the truth.** The trial ships **two** watermarked Exports
   (`PROOF_EXPORT_LIMIT = 2`); nine pages say one. Purchased top-ups never
   expire and survive a lapse; no page says it. Questions during the trial
   don't consume the revision; no page says it.
3. **Docs drift into fiction.** The docs/data files still claim two things
   that don't ship and that the doctrine bans: an editor that opens "with a
   strong clip already selected" (nothing auto-picks; journal Cycle 3 ruled
   that sentence unsafe) and per-project **auto-publishing** — which flatly
   contradicts the homepage FAQ's "Can it post something without me? No."

One homepage claim runs the other direction: three blocks say checkout shows
"your exact trial end … before you confirm." The hosted checkout's own copy
defers to Billing (`bittercheckout/server/routes/api/c/[slug]/session.post.ts:259`
— "Cancel before the exact trial end **shown in Billing**"), so the exact
timestamp appears the moment the trial starts, not pre-confirmation. The
rewrites below re-time the claim. Note the pricing plan's "Trial and charge
contract" *mandates* the pre-confirmation display, so this is also a
plan-vs-checkout gap to route to product/QA — if checkout gains the display,
the original stronger copy becomes true again.

---

## 1 · The homepage FAQ (`app/pages/index.vue` faqItems + `public/index.md` twin)

Three answers are already the model the rest should imitate — "Does it
invent what happened?", "Can it post something without me?", and "Do I have
to learn a new editor?" all open with a flat answer, state one design
principle, and stop. **They stand.** The other eight:

### What happens after I sign up? (index.vue:39) — B → A

One ungrounded clause: checkout does not display the exact trial end
pre-confirmation. Re-time the claim; everything else was already good.

> Choose Creator and add a card. $0 is due today, and you see the exact
> trial end and the scheduled $24 first charge before anything bills. Then
> bring one recording. BitterClip reads the whole session, makes a crafted
> First Cut, and you direct one revision of that same cut — all inside the
> seven-day trial.

### Why would this be different? (index.vue:43) — B- → A

"Scored pile of leftovers" and "search can find a neighborhood" are internal
R&D vocabulary. Same claims, plain words, opens on what BitterClip does.

> It works from the whole session — who is speaking, what came before and
> after — and commits to one cut you can check against the exact moment it
> came from. Search only finds where things were said; the cut is a
> decision, not a score. When it is wrong, you say what is wrong and it
> revises that same cut instead of handing you ten more.

### Does it know who is talking? (index.vue:47) — C+ → A-

The emblematic confession ending ("…and it can fail"). The failure boundary
is real doctrine (enrollment is fail-closed; never "every speaker named"),
so it stays — stated once, mid-answer — and the answer ends on the win.

> Yes — it splits the voices on its own. Until you name someone they stay
> Speaker 1, Speaker 2. Recognizing a returning speaker takes a saved voice
> and is never guaranteed. Name someone once and the whole project knows who
> they are.

### Do I need ChatGPT or Claude? (index.vue:55) — C+ → A-

Currently ends on another vendor's fine print. Compress the caveat to one
honest clause; end on our win. (Vendor facts date to 2026-07-10 — re-verify
before ship; see Open verifications.)

> No. The agent is built into the editor, and that is the shortest path. If
> you would rather work from Claude or ChatGPT, BitterClip connects there
> too — Claude on every Claude plan, ChatGPT where your plan and workspace
> allow custom apps — and your agent works the same editor under the same
> rules.

### Where can the finished work go? (index.vue:63) — B+ → A

"Send the finished clip to your phone" implies a push-to-phone flow that
doesn't ship (the real Instagram path is download-and-post), and invites
scope to a *project*, not a session.

> Export the full-length episode, then pull the short vertical cuts from
> that same edit instead of starting a second production. Publish to
> YouTube, X, or LinkedIn, or grab a shareable link. For Instagram, download
> the finished clip and post it from the app. Nothing goes out until you
> confirm it. Invite a client to the same project and they can pull their
> own cuts too — upload once, everyone works from it.

### Does BitterClip record for me? (index.vue:67) — C → A

The triple-negative pile. The boundary is stated exactly once with zero
"no"s, and the old negatives flip into their true positive complements —
including a shipped strength the page never mentions: guest upload links
(`routes.rb /u/:token`).

> It can record. It cannot have the conversation for you — that part stays
> yours. Every project has a browser recorder: camera and mic on a laptop or
> phone, or your screen in desktop Chrome, up to 1080p, uploading while you
> record so transcription starts the moment you stop. The recorder captures
> one signed-in person on one device. For remote sessions, record on Zoom or
> Riverside the way you already do and bring the files — guests can send you
> theirs through a shareable upload link.

### What can I upload? (index.vue:71) — B → A

Fully verified (multi-angle metering is exactly what `ProductionDuration`
ships), but the answer ends on the word "charging." "One production, counted
once" is the same fact, positive, in four words.

> Podcasts, interviews, calls, and training sessions — audio or video. The
> Creator trial takes one central session of up to two hours. Files run up
> to 4 GB on Creator and 20 GB on Producer. Bring several angles of the same
> session and BitterClip keeps them together as one production, counted
> once.

### What happens if I cancel? (index.vue:79) — C+ → A

"May require an active plan" hedges a definite fact (resting custody blocks
all new processing) — the plain statement is both stronger *and* more
accurate. "Shown at checkout" becomes the verified claim. Adds the grounded
fact that kills the exact fear this FAQ exists for: cancel is self-serve, no
questionnaire (the product's own reminder-email copy). Ends on what you keep.

> Cancel before the exact trial boundary — shown the moment your trial
> starts — and you pay $0. No questionnaire, no support ticket. After a paid
> period begins, canceling stops the renewal and you keep the plan through
> the period you paid for. New processing needs an active plan; everything
> you made stays in your Studio — sources, edits, revision history, finished
> Exports.

**Twin duty:** every answer is duplicated nearly verbatim in the hand-written
markdown twin `public/index.md` (Common Questions; the "and it can fail"
tail also at :42-43 and :63-64; the negative pile at :152-158; "may require
an active plan" at :187-188 and :204-206). Apply each rewrite to both
surfaces in the same commit. `classic.vue` carries the same FAQ but is
noindexed and scheduled for deletion after its soak — skip unless it
survives.

---

## 2 · Hero & pricing section (`app/pages/index.vue`)

**Stand as written (10):** H1, hero CTA, hero fineprint, all four JSON-LD
blocks, "Bring one recording. Leave with the episode.", the Creator price
line, "Meet your editor. Card required; $0 due today.", and the cancel
microcopy — all verify exactly and read confident.

### Hero pillars (index.vue:176-177) — B- → A · smoke :121,:123

"Knows your content" claims nothing checkable; "the good parts, finished"
implies BitterClip decides which parts are good — the picker rhyme the
journal killed "only the cleanest cuts" for. The fix restores the journal's
own locked-draft glosses. Pillar names stay (owner-settled).

> **Deep Video Intelligence** — the whole session in view.
> **Precision Edits** — one cut you'd send.

### Pricing lede (index.vue:368) — B+ → A

One word: "improves that same work" → "**revises that same cut**" (the
doctrine's exact safe claim and the shipped contract).

### Creator card, "During the trial" (index.vue:379-385) — C+ → A

The rate-sheet block: "one intake" is bureaucratese, "central material" is
metering vocabulary, "one revised cut on the same Clip" is unparseable
jargon. It also undersells — two watermarked Exports, and the trial Deep
agent is the same model paying customers get.

> During the trial
> - One real session, up to 2 hours of recording
> - An Editor's Read, then a crafted First Cut
> - Ask questions, direct one revision of that cut
> - The real Deep agent · two watermarked Exports

### Creator card, "After the first payment" (index.vue:386-391) — B- → A

The header reads as a one-time grant; the allowances recur. "Add agent
balance anytime" is the card's one ungrounded claim (top-ups require an
active plan); the code-true claim is stronger anyway.

> Every month after
> - 10 production hours · $10 agent balance
> - Deep + Fast · clean Exports · 4 GB files
> - Add agent balance — top-ups never expire

### Producer card, fifth bullet (index.vue:413) — B+ → A

"Priority service" overreaches the shipped mechanic (render-queue priority).

> Priority rendering · top-ups never expire

### Closing reassurance line (index.vue:430) — B- → A

Same unverified checkout claim, plus "evidence" (internal noun) in a
five-item legal schedule.

> Card required for the Creator trial: $0 due today, then $24/month, and the
> exact cancel-before time is shown the moment your trial starts. Cancel and
> everything you made stays yours.

---

## 3 · Narrative sections

**Stand:** #demo eyebrow/lede/caption ("The rest of the hours are still on
the tape." is the strongest line on the page), quote framing, #how
eyebrow/H2/intro, both bring-your-agent paragraphs, card footer, FAQ chrome,
header nav, footer. Three changes:

### #demo H2 "Find the Hidden Gems" (index.vue:199) — C → A

The one doctrine violation on the homepage: "Hidden Gems" (plural) is
clip-farm idiom — the leftover-pile framing the compare pages refuse — and
it contradicts its own lede ("This is *the* cut you'd send"). Also the only
Title-Case H2 on the page. The replacement is paid off literally by the
caption beneath the video.

> Hours of tape. One cut.

Couplings: smoke :139,:145 · `lab/iso4.vue:87` · named verbatim in
`public/index.md:80`.

### #how figcaption, second paragraph (index.vue:285) — B- → A

"The agent can *still* make the cut" argues with an objection nobody raised.
State the settled doctrine as the design (editor is verification). The
smoke-pinned first sentence stays byte-identical.

> The agent makes the cut when you ask. The editor is where you check it —
> any cut, against the exact moment it came from.

Twin: `public/index.md:76-78`.

### Claude card chip name (index.vue:321) — B+ → A

"sarah-highlights" smuggles the highlight-reel idiom back in as set
dressing. Rename to match the ask: **sarah-tuesday**. Mirror at
`lab/iso4.vue:211`; no smoke assertion covers the chip.

---

## 4 · Beyond the homepage

### False capability: auto-publish (5 locations)

The shipped publish path is review-only — `prepare_publish_set` normalizes
even legacy `publish_mode: auto` to staged packages; confirm is the only
path to a `PublishRecord`. These contradict the homepage's most load-bearing
trust answer:

| Location | Fix |
|---|---|
| `app/components/content/ApprovalPromise.vue:15-25` | Drop the two-mode list ("ready clips post … on their own"); the one shipped promise: every post staged as a package, approving is the send. |
| `content/publishing/publish-a-clip.md:18-20, :35-38, :57-58` | "the project decides whether posts … publish on their own" → "Every post is staged for you to review first; approving it is the send." Cut the automatic branch. |
| `content/_data/mcp-tools.yml:88` | "it either posts on its own or waits" → "Stages a finished clip as a reviewable post… Nothing sends until you look it over and give the go-ahead." |
| `content/changelog/index.md:90-91` | "goes out automatically once it's ready" → "Every send is staged for your approval first." |
| `content/connect/youtube.md:60` | "the link follows on its own" reads as auto-dispatch → the link insertion is real; each staged post still takes your confirmation. |

### False capability: the auto-picked "strong clip" (7 locations)

Nothing auto-selects a clip — `workspace_open` is read-only, `focus_range`
is caller-supplied. Journal Cycle 3 ruled this claim unsafe; "strong/
strongest" is banned. The honest version is the better promise: *the
assistant cuts what you asked for and opens it as a draft.*

- `content/_data/mcp-tools.yml:13-17` — "a strong moment already selected"
- `content/index.md:41` — "with a strong clip already selected"
- `content/assistants/overview.md:18-22, :59-62` — "a clip already picked"
- `app/components/content/ExampleClipPrompt.vue:8,18-23` — "find the
  strongest moment" (renders on 4 docs pages)
- `content/assistants/connect-chatgpt.md:72` — prompt override re-injects
  "strongest"; drop the prop, inherit the fixed default
- `content/changelog/index.md:97-98` — "a clip already picked out"

Banned-superlative sweep in otherwise-true copy:
`WhatIsBitterClip.vue:17` ("strongest moments" → "moments worth sharing" —
renders on nearly every docs page), `HowTheCutWorks.vue:8` ("strongest
moment" → "the moment"), `mcp-tools.yml:32` ("cleanest cut points" → "exact
cut points"), `connect-claude.md:84` ("a strong moment" → "the moment you
asked for").

### Underselling and stale framing

- **"A watermarked Export" (singular) — nine locations.** The trial ships
  two (`PROOF_EXPORT_LIMIT = 2`): the First Cut and the revision. Worst on
  `veed.md:137` and `kapwing.md:133` — the watermark-argument pages. Also
  `public/index.md:198`, `public/compare.md:42`, `capcut.md:144,202`,
  `opus-clip.md:181`, `klap.md:173`, `submagic.md:175`, `vizard.md:191`.
- `content/help/faq.md:91` + `your-first-clip.md:36` — "depends on your
  plan" dodges numbers stated everywhere else: 4 GB Creator, 20 GB Producer.
- `content/getting-started/find-and-share-clips.md:58-63` — "part of an
  upgraded plan … quietly stops playing" is free-tier-era framing plus a
  confession. Both paid plans include embeds; links play while the plan is
  active.
- `content/help/faq.md:20-23` and siblings — the "may require an active
  plan" hedge recurs at `what-is-bitterclip.md:25-27`, `changelog:24-25`,
  `public/index.md` ×2, `public/compare.md:42`, `classic.vue`. Same fix as
  the homepage FAQ.

### Compare-page contradictions (verify before applying)

`vizard.md:100` and `kapwing.md:103` concede "BitterClip publishes to
YouTube only" while the rest of the site says YouTube, LinkedIn, and X (and
the model-visible channel enum says three). **Verify X and LinkedIn direct
sends are live in prod before editing** — if they aren't, the fix inverts
and the rest of the site is the overclaim.

---

## 5 · Unused ammunition

Trust facts in the plan and code stronger than anything on the page. The
rewrites above deploy four; the rest are sitting there:

- **Questions never consume your revision.** ("Asking why does not consume
  the right to experience revision" — the exact anxiety a bounded trial
  creates.) Hinted in the new trial bullets; could carry a FAQ line.
- **System-caused retries never consume your trial or your balance.** The
  plan's own pricing-page target includes this line verbatim; no surface
  uses it.
- **The first payment unlocks one clean render of your trial cut, free** —
  a concrete conversion moment ("your First Cut, un-watermarked, on us").
- **Purchased top-ups never expire and survive a lapse.** (Deployed in both
  plan cards.)
- **Cancel is self-serve — no questionnaire, no support ticket.** (Deployed
  in the cancel FAQ.)
- **The trial runs the same Deep model paying customers get.** (Deployed in
  the trial bullets.)

---

## 6 · Ship notes

### Smoke couplings — change in the same commit

`qa/smoke.spec.ts` pins copy verbatim:

- Pillar glosses "knows your content" / "the good parts, finished" — :121,
  :123
- H2 array incl. "Find the Hidden Gems" — :139-145 (also `lab/iso4.vue:87`,
  `public/index.md:80`)
- Pinned and untouched by these rewrites: hero fineprint (:124), "with
  BitterClip's own browser recorder" (:127), "Open it to check the tape."
  (:157), "Intro drags. Start on the squat." (:164), "Open in editor ·
  Download after render" (:165)
- Negative assertions (no "every speaker named", "transcript_search",
  "Start clipping") remain satisfied by every rewrite.

### Mirrors

- `public/index.md` is hand-written, served, and smoke-tested — every
  homepage rewrite has a twin edit there.
- `lab/iso4.vue` mirrors the H2 (:87) and chip name (:211).
- `classic.vue`: noindexed, deleting after soak — skip unless it survives.

### Open verifications before shipping

1. **Checkout display gap** — plan mandates the exact cancel-before
   timestamp pre-confirmation; shipped checkout defers to Billing. Rewrites
   are honest either way; route the gap to product/QA.
2. **Vendor plan facts** (Claude connectors on every plan; ChatGPT
   custom-app policy) date to the 2026-07-10 review — re-check vendor pages.
3. **X + LinkedIn direct publish** live in prod — decides the compare-page
   fix direction.
4. Trial "one central session up to two hours" — verified
   (`PROOF_DURATION_LIMIT_SECONDS`, one Proof Episode, supporting angles
   admitted unmetered); recorded because three pages state it.
