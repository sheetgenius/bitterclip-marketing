# The live editor on bitterclip.com — deep inventory & improvement vectors

**Date:** 2026-06-11 · **Audience:** product owners working on the marketing site / embed surfaces
**Scope:** the interactive editor experiences on the landing page (hero phone, mid-page editor, handoff clip card): what every control actually does today, where the experience breaks, and the prioritized avenues for making it convert. Backed by a code-level audit of both repos and a sourced research pass (sources + evidence-quality flags in the appendix).

---

## 1. TL;DR

The landing page embeds the **real product editor** three times — a genuinely rare asset (no published benchmark even covers "live real product in the hero"; everyone else ships screenshot tours). The architecture is sound: every visitor interaction is answered by a local "demo host" that stubs all writes, so **no anonymous click can ever reach Gemini, the transcription stack, or the render farm**. That guardrail is correct and should not be loosened.

But the demo currently has **two broken-promise moments** (a Generate button that silently does nothing, and a Download button that *claims success* and delivers no file), **zero instrumentation** (we cannot see whether anyone touches the editor, let alone whether touching it converts), and **no conversion offramp** at the exact moment a visitor finishes the aha loop (clip cut → exported). The fixes are mostly small, because the hard part — the stub host protocol — already exists.

Priority order (detail in §6):

| # | Vector | Size | Expected effect |
|---|--------|------|-----------------|
| P0-1 | Instrument the demo end-to-end (postMessage → GA events) | S | Makes every other bet measurable |
| P0-2 | Fix the two broken-promise clicks (Generate → canned result; Download → real watermarked file) | S–M | Removes the worst trust failures at the peak-interest moment |
| P0-3 | Demo-aware copy + soft-wall CTA at the export moment | M | Converts the aha moment; best-evidenced pattern in the research |
| P1-1 | Watermarked downloadable artifact as a growth loop | S | Modest compounding (K≈0.15–0.3 class), near-zero cost |
| P1-2 | Interactivity affordance — make the hero *look* touchable | S | Most visitors never realize the phone is live |
| P1-3 | Mobile strategy for the hero embed | S | 80%+ of LP traffic is mobile; today it gets the heaviest, least-rewarding version |
| P2 | Anonymous intent capture ("bring your own recording" tease), deep-linked signup, theming parity | M | Longer-loop conversion plumbing |

---

## 2. What is actually on the page today

The marketing site (`bitterclip-marketing`, Nuxt, statically generated) contains almost no demo logic itself. It iframes three surfaces served by the Rails app:

| Surface | Where on the page | URL | What it is |
|---|---|---|---|
| **Hero phone** | Right of the H1, inside an iPhone mockup | `app.bitterclip.com/embed/recording/src_qjxzecbketjkby2eynbi?bare=1&theme=dark&clip=<mp4>` | The **full real workspace widget** (same Lit component that runs inside ChatGPT/Claude), showing the "Origin Story" demo recording, with the complete chat-style flow: moment cards → "Open in editor" → full composition editor |
| **Mid-page editor** (section 01, `#demo`) | Full-width panel | `app.bitterclip.com/embed/clip-demo?bare=1&clip=<mp4>` | The real transcript-score component with a canned ~14s two-speaker fixture; drag-to-select, play, export-reveal, download |
| **Handoff clip card** (section 02) | Left side of the fan-out | `app.bitterclip.com/embed/clip/clip_yf9ibrk2b7v13yzztbba` | The **production** clip-embed primitive (the Pro feature itself), playing a real published customer clip with full beacon analytics |

Load behavior is already conversion-conscious: all three iframes defer until `requestIdleCallback` so they can't hurt LCP; the hero slot is a fixed 508 px screen whose height messages are deliberately dropped (no layout shift, ever); the mid-page editor has a tap-to-load gate on viewports < 768 px. (`app/pages/index.vue:115–223`)

### How the demo host works (the part that makes this safe)

The embed page (`apps/bitterclip-rails/app/views/embed/recording.html.erb`) hosts the widget in a **sandboxed iframe (`allow-scripts` only)** and answers its JSON-RPC calls the way ChatGPT/Claude would — except every write is intercepted locally:

- **Reads are real or canned**: the transcript score is genuinely fetched (gzipped, ~626 KB for the 46-min demo recording, CDN-cached 12 h); the recording payload is server-built.
- **Writes return demo IDs**: `clips_create` → `{ ok: true, clip_id: "clip-demo-1" }`; `moments_create` → echo with a fake id. The widget's optimistic UI proceeds normally.
- **Exports resolve instantly** to the pre-rendered MP4 the marketing site passes via `?clip=` (validated: https-only, allowlisted hosts, no query/fragment).
- **Publish checks report honest not-connected** — the YouTube sheet shows its real empty state and can never reach a publish call.
- **Unknown tools get a generic `{ ok: true }` ack** (`recording.html.erb:193`) — this is the root of the Generate bug below.
- The recording id is env-allowlisted (`BITTERCLIP_PUBLIC_EMBED_RECORDINGS`); the page carries no session, no CSRF surface; `frame-ancestors *` is safe because there is nothing to ride.

**Bottom line: there is no path from any landing-page click to live inference or rendering.** The only real server work an anonymous visitor can trigger is the score fetch (static-ish, cacheable) and clip-embed media auth (rate-limited 30/min, signed 1-h URLs). This matches the textbook guidance for public AI surfaces (OWASP "Unbounded Consumption"; see §5.4) — the open question was never *whether* to stub, only *how the stubs present*.

---

## 3. Control-by-control inventory (the editor a visitor actually touches)

Walking the exact sequence from the screenshots — recording card → "Open in editor" → transcript editor → clip panel:

| Control | Behavior in the embed today | Verdict |
|---|---|---|
| Play / scrub / spacebar | Real playback of the demo media, word cursor glides | ✅ Live, great |
| A/B clip chips (candidate moments) | Real selection — highlights the region in the transcript | ✅ Live |
| "Open in editor" | Real — host grants fullscreen display mode, full composition editor opens in-frame, transcript lazy-loads | ✅ Live; the single most impressive beat |
| Word-drag selection, Move start / Move end, Adjust range | Real local editing | ✅ Live |
| Create clip | Stubbed — returns a demo clip id; UI proceeds normally to the clip panel | ✅ Feels real |
| Details / Finish tabs | Real local UI | ✅ |
| **TITLE → "✨ Generate"** | `clips_generate_copy` is **not in the handler map** → generic `{ok:true}` ack → `if (d.title)` never fires → spinner flashes, **fields stay empty, no message** (`composition-editor/component.js:3546–3549`) | ❌ **Silent dead end** |
| Export 16:9 landscape | Stubbed → instantly "✓ Exported", the pre-rendered MP4 reveals in the canvas | ✅ The "simulated result" pattern, working as designed |
| **"⬇ Download MP4"** (appears after export) | Widget calls `ui/download-file`; host acks with empty `{}`; `assertHostActionOk` only checks `isError`, so the widget **reports success — and no file ever downloads** (sandbox has no `allow-downloads` either) (`mcp-apps-bridge.js:446–450`, `recording.html.erb:183–185`) | ❌ **Fake success — worst pattern in the rage-click literature** |
| "↻ Export again" | Re-runs the stub; harmless | ⚠️ Pointless in demo |
| Export copy: *"Renders a downloadable MP4 (uses one export credit)"* | Shown verbatim to anonymous visitors | ⚠️ Confusing/scary — the visitor has no credits and no idea what one is |
| "Embed on the web" panel | Hidden (stub returns no embed eligibility) | ✅ Correctly absent |
| Publish to YouTube sheet | Honest "not connected" empty state | ✅ Honest, but a conversion dead-end (no "this is where it posts for you — start free") |
| Done / ✕ | Real — returns to inline card | ✅ |

The mid-page `clip-demo` surface is in better shape: its Export → reveal → **Download MP4** path actually works (it's a plain anchor on an unsandboxed page), and its controls are all either live or honestly framed.

### The measurement hole

- The marketing site runs **GA4 pageviews only** (`nuxt.config.ts:51`). No demo events of any kind.
- The hero and clip-demo embeds emit **zero telemetry**. The host page sees *every tool call and display-mode change* (it answers them!) and forwards none of it.
- Ironically, the third surface — the production clip embed — has a complete beacon pipeline (`play_intent`/`first_frame`/`progress_*`/`complete`, `EmbedEvent`, daily rollups) that the demo surfaces don't use.

So today we cannot answer: what % of visitors touch the hero? How many open the editor? How many reach export? Do demo-engaged visitors sign up more? Every improvement in this document is currently unfalsifiable. That's why instrumentation is P0-1.

---

## 4. What the research says (condensed; full notes + flags in appendix)

1. **Ungated, embedded, above-the-fold is the winning configuration.** Homepage placement of interactive demos went 8% → 48% of B2B SaaS in two years (Navattic 2026, 40k demos — vendor data but the largest there is); ungated beats gated by +6–12% engagement/completion across three annual reports; 80% of top-performing demo CTAs are above the fold. The honest caveat: *all* of this benchmarks screenshot tours — nobody has published data on a live real-product hero. We're ahead of the evidence, not against it.
2. **Dead and fake-affordance clicks are a measured trust hazard.** NN/g (independent): elements that look interactive but don't respond erode trust; disabled buttons need visible state + an explanation. The fake-door literature's consensus: a gated click must land on an *honest explanation plus a next step*, never a silent no-op. Our Generate button and fake-success Download are textbook instances of the failure mode.
3. **Gate at the moment of intent, after the aha.** The best independent numbers anywhere: Duolingo moved signup after the first lesson → **+20% DAU**, and dismissible soft walls *primed* the later hard wall (+8.2% more). Baymard (independent, large-n): forced pre-value account creation is a top-2 abandonment cause (24–26% of US shoppers). RevenueCat case data: contextual "you tapped the locked thing, here's that specific benefit" prompts massively beat generic ones (+81% offer-flow lift in one case). Pattern for us: let the visitor cut + export (aha), then make the *next* high-intent action (download the file / "do this with your footage") the signup moment — dismissible.
4. **Anonymous inference: the category norm is "never," and our stub design is the right call.** OWASP LLM Top 10 names unbounded anonymous consumption ("denial of wallet"; documented incidents to $46k/day); free-compute tiers get industrially farmed (the crypto-mining death of free CI). Direct competitors: Vizard and Klap are signup-first; OpusClip lets anonymous visitors *paste a link* but runs all inference post-signup. The proven anonymous shapes are (a) canned/simulated results — what we do, (b) degraded output (watermark/low-res) with the cheap path free — remove.bg/Photoroom, (c) capture intent, infer after signup — OpusClip.
5. **Watermarked free artifacts are a real but modest loop.** Verified: Typeform attributes ~80% of new business to word-of-mouth + the form-footer loop (founder, on record); VEED's founder explicitly endorsed anonymous edit + watermarked export ("we're completely cool with that") on the way to $2M ARR; Kapwing/Clideo formalize "anonymous export with watermark" as policy. Watermark/badge loops are typically K ≈ 0.15–0.3 (uncited industry figure — directional only). Counter-signals: Instagram demotes competitors' watermarks; "X alternative no watermark" is a whole SEO category; and watermarking work a user invested *hours* in breeds resentment — none of which applies to a 14-second demo artifact a visitor got for free. For anonymous **demo** downloads specifically, watermark risk ≈ zero and the artifact carries the brand.
6. **Protect the hero's clarity and LCP.** First impressions form in ~50 ms on the static composition; the headline must work for the majority who never touch the demo. Speed is money (Google/Deloitte: +0.1 s ≈ +8.4% retail conversions; Vodafone A/B: 31% better LCP → +8% sales). Our deferred-iframe + fixed-height architecture already follows the playbook (the skeleton is effectively a facade); keep it that way — never let the embed onto the LCP path. NN/g's anti-interactivity findings are about *autonomous* motion (carousels), not user-initiated demos; they argue against auto-playing the demo, not against having it.

---

## 5. Improvement vectors

### Vector A — Instrument the demo (P0-1, small)

The host pages already see every meaningful event. Forward them.

- In `recording.html.erb` / `clip_demo.html.erb`: post structured events to the parent (`{ bitterclip_demo_event: "editor_opened" | "clip_created" | "export_started" | "export_revealed" | "download_clicked" | "generate_clicked" | "publish_sheet_opened" }`) alongside the existing height messages.
- In `index.vue`'s existing `handleMessage`: map them to `gtag('event', …)` with a `surface: hero|demo` param. Also tag every signup link with `?utm_content=` reflecting demo engagement state, so GA can segment *demo-engaged → signup* CTR.
- Optional later: reuse the `EmbedEvent` beacon pipeline for server-side ground truth (the schema already exists; would need a demo-surface event namespace).

This is a prerequisite, not a feature: the conversion claims in every other vector become testable.

### Vector B — Fix the two broken promises (P0-2, small–medium)

**B1. Generate → canned result.** Add `clips_generate_copy` to the hero host's `TOOL_HANDLERS`, returning a pre-written title + description for the demo recording (we know its content; write 2–3 good ones and pick by time range or rotate). A ~700 ms artificial delay keeps it feeling like generation. The button then *demonstrates the actual feature* at zero inference cost — the "simulated result" pattern the research recommends. Optionally suffix the description field with a subtle "Sample copy — sign up to generate from your own transcript."

**B2. Download → a real file.** Implement `ui/download-file` in the embed host page (it's unsandboxed; the widget's sandbox never needs to change): fetch the demo MP4, blob it, trigger an anchor download. Requirements: serve the demo clip from the app origin or add CORS to the marketing-hosted `/clips/*.mp4` (same infra, trivial). Until B2 ships, the honest stopgap is to make `ui/download-file` return `isError: true` so the widget falls back to its "Open MP4 in browser" affordance instead of lying.

**B3. Demo-aware copy.** The widget already receives `hostContext` and capabilities; introduce a `host: "demo"` awareness (or pass a flag through tool-input) so demo mode can swap the two worst strings: "uses one export credit" → "free sample export", and gate-adjacent labels described in Vector C. This is the only vector that touches the shared component — keep it to copy + one CTA slot so the unified-surface principle (same component everywhere) stays intact.

### Vector C — Convert the aha moment (P0-3, medium)

Right now the demo's emotional peak — *"I just cut and exported a clip in 20 seconds"* — ends in a panel with no next step. The evidence (Duolingo, Baymard, RevenueCat) all points the same way: a **dismissible, benefit-specific prompt at the moment of completed value**, not a gate in front of it.

- After export reveal, show one CTA row in the clip panel (demo mode only): **"That's the whole flow. Do it with your footage — start free (60 min/month)"** → signup URL with attribution params.
- The publish sheet's honest "not connected" state gets one line: "Connect YouTube after signing up — BitterClip posts the finished clip for you."
- Keep the demo fully ungated before that point (every dataset says ungated wins), and keep the prompt dismissible (Duolingo: ignored soft walls still prime the eventual conversion).
- On the marketing page itself, the moment a visitor *finishes* the hero flow is also the moment to surface the existing "Clip your first recording" CTA — consider a subtle highlight pulse on it triggered by the `export_revealed` event from Vector A.

### Vector D — Watermarked artifact as a growth loop (P1-1, small)

The watermark pipeline already exists and is plan-gated (`render_watermark.rb`: glass-obscura mark, 4 aspect variants, FFmpeg overlay). **Pre-render** watermarked variants of the demo clips once, offline — no live rendering — and point `?clip=` at them:

- The downloaded artifact then carries the brand wherever it goes (Typeform/VEED/Loom pattern), and is honest: it shows exactly what a Free-plan export looks like (the pricing card already says "watermarked").
- Add the upgrade framing at the download moment: "Watermark comes off on any paid plan."
- Offer the artifact in 9:16 too — the person most likely to test a clipping tool posts vertical. (The aspect selector currently exports the same 16:9 file regardless; either pre-render per-aspect variants or constrain the demo selector.)
- Expectation-set honestly: watermark loops are modest compounders, not rocket fuel. It's a cheap, on-norm move, not a strategy.

### Vector E — Make the hero *discoverably* interactive (P1-2, small)

The handwritten annotation says "this is the actual UI" — it doesn't say *you can touch it*. Carousel-era data says ~1% interact with hero modules they assume are decoration; demo-vendor data says visual nudge beacons appear in 24% of top demos.

- Add one idle-state affordance: a soft pulse on the A/B clip chips or a one-time "← try tapping a moment" hand-note that disappears on first interaction (and never auto-plays — NN/g's distraction findings are specifically about autonomous motion).
- Measure before/after with Vector A's `editor_opened` rate. This is exactly the kind of bet instrumentation makes cheap.

### Vector F — Mobile strategy (P1-3, small)

83% of landing-page visits industry-wide are mobile, mobile converts worse, and demo engagement on mobile runs at roughly half of desktop. Today the **hero loads the full live widget on phones unconditionally** (only the mid-page demo has the tap-to-load gate), spending bandwidth on the audience least likely to use it:

- Apply the same activation-gate pattern to the hero on < 768 px: static screenshot of the exact widget rest-state (we can capture it pixel-perfect) + "tap to try the live editor."
- Upside: faster paint on the dominant device class, and the *tap itself* becomes a measurable intent signal.
- The phone-in-phone presentation is actually an asset on mobile (it reads native); the gate is about cost, not concept.

### Vector G — Longer-loop conversion plumbing (P2)

- **Anonymous intent capture (OpusClip pattern):** under the hero, a single input — "Paste a YouTube link — see your best moment after signup" — captures the visitor's *own* content as intent, runs zero anonymous inference, and deep-links into the post-signup uploader with the URL prefilled. This is the highest-leverage P2 because it converts demo interest into *their-footage* commitment, which is the product's real aha.
- **Deep-linked signup:** all demo CTAs should carry `?from=` context so the app can route a fresh signup straight to the uploader (the two-field signup work from 2026-06-10 already minimizes the wall itself).
- **Theming parity:** the hero supports `?theme=light|dark`; `clip-demo` is hardcoded dark — add the param before any light-theme marketing push.
- **Prod-dependency hardening:** the handoff card is a live iframe of a real customer clip (`clip_yf9ibrk2b7v13yzztbba`) that 404s if it's ever unpublished or the account leaves a Pro plan — the static poster underneath is the only fallback. Fine, but worth a smoke-test assertion (the QA spec already exists) and a note in the runbook. Same for the env-allowlisted hero recording id.

### What *not* to do

- **Don't expose live inference or rendering to anonymous traffic, even rate-limited.** The research is unambiguous (OWASP unbounded consumption; organized free-tier farming; per-IP limits decay under CGNAT and agent traffic), the category norm is signup-first, and the canned-result pattern delivers the same perceived magic at zero marginal cost.
- **Don't front-gate the demo** with email/signup — ungated wins in every dataset, and the demo *is* our differentiation.
- **Don't auto-play or animate the hero into a carousel-like attention thief** — the value-prop headline must keep working for the majority who never touch the demo.
- **Don't fork the editor for marketing.** The whole strategic point (unified composition surface — one component across marketing/ChatGPT/Claude/mobile) is that the demo *is* the product. Demo-mode behavior belongs in the host's tool handlers and a thin `host: "demo"` presentation layer, not in a divergent build.

---

## 6. Suggested sequencing

**Week 1 (P0):** Vector A (instrumentation) + B1 (Generate canned result) + B2-stopgap (honest download fallback) + the two copy fixes from B3. All are host-page or copy changes; only B3 touches the shared component.

**Week 2 (P0/P1):** B2 proper (real watermarked download, which folds in D's pre-rendered watermarked variants) + C (export-moment CTA + publish-sheet line) + E (interactivity affordance).

**Week 3+ (P1/P2):** F (mobile hero gate), then read the Vector-A data: if `editor_opened` and `export_revealed` rates are healthy but demo-engaged→signup is weak, prioritize C iterations and G's intent capture; if `editor_opened` is near zero, the problem is discoverability (E) and placement, not the editor.

**Success metrics** (all available after Vector A): hero touch rate, editor-open rate, export-completion rate, download rate, demo-engaged → signup CTR vs non-engaged baseline, and (post-launch) watermarked-artifact referral traffic.

---

## Appendix — research sources & evidence quality

**Independent / strongest:**
- Duolingo deferred-signup experiments: ~+20% DAU; soft walls prime hard walls (+8.2%) — [First Round Review interview](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/)
- Baymard: forced pre-value account creation = top-2 abandonment cause, 24–26% — [baymard.com](https://baymard.com/blog/delayed-account-creation)
- NN/g: disabled-button and false-affordance harms — [nngroup.com](https://www.nngroup.com/articles/button-states-communicate-interaction/); distraction findings apply to *autonomous* motion — [auto-forwarding](https://www.nngroup.com/articles/auto-forwarding/)
- OWASP LLM Top 10, "Unbounded Consumption" (denial-of-wallet; Sysdig LLMjacking $46k/day) — [genai.owasp.org](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/), [sysdig.com](https://sysdig.com/blog/llmjacking-stolen-cloud-credentials-used-in-new-ai-attack/)
- Free-tier compute farming killed free CI (GitLab card-on-file response) — [layerci.com](https://layerci.com/blog/crypto-miners-are-killing-free-ci/)
- Performance→conversion: Google/Deloitte "Milliseconds Make Millions" (+0.1 s → +8.4%) — [web.dev](https://web.dev/case-studies/milliseconds-make-millions); Vodafone LCP A/B (+8% sales) — [web.dev](https://web.dev/case-studies/vodafone); facade/lazy-embed guidance — [developer.chrome.com](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)
- HockeyStack (independent of demo vendors; correlational): interactive demo presence ≈ +63% visit→MQL, 23% faster closes — [hockeystack.com](https://www.hockeystack.com/lab-blog-posts/do-interactive-demos-work)
- HF Spaces ZeroGPU anonymous-quota ladder (2 min/day/IP anonymous, queue deprioritization) — [huggingface.co](https://huggingface.co/docs/hub/en/spaces-zerogpu)

**Vendor benchmarks (directional; self-selected populations):**
- Navattic State of the Interactive Product Demo [2024](https://www.navattic.com/report/state-of-the-interactive-product-demo-2024) / [2025](https://www.navattic.com/report/state-of-the-interactive-product-demo-2025) / [2026](https://www.navattic.com/report/state-of-the-interactive-product-demo-2026): homepage demo adoption 8%→48%; ungated +6–12%; 80% of top CTAs above the fold; mobile engagement ≈ ½ desktop
- Arcade benchmarks (67% top-decile CTR vs ~3.2% video) — [arcade.software](https://www.arcade.software/post/interactive-demo-benchmarks); Storylane conversion study (24.35% engaged vs 3.05% baseline — self-selection confound) — [storylane.io](https://www.storylane.io/plot/the-impact-of-interactive-demos-on-conversion-rates-sales-velocity)
- RevenueCat contextual-paywall cases (+81% offer-flow lift) — [revenuecat.com](https://www.revenuecat.com/blog/growth/contextual-paywall-targeting/)

**Founder-attested / case norms (watermarks & anonymous use):**
- Typeform: ~80% of new business from WOM + form-footer loop (co-founder, on record) — [saasclub.io ep.230](https://saasclub.io/podcast/typeform-a-case-study-in-product-led-saas-growth-with-david-okuniev-230/); the circulating "50% from the badge" figure is secondhand/unverified
- VEED: anonymous edit + watermarked export, founder-endorsed — [saasclub.io ep.274](https://saasclub.io/podcast/veed-io-bootstrapping-a-saas-to-2-million-274/); watermark = #1 G2-cited upgrade driver — [fluxnote.io](https://fluxnote.io/guides/veed-io-pricing-2026)
- Kapwing watermark policy (cost-recovery framing; retroactive de-watermark on upgrade) — [kapwing.com](https://www.kapwing.com/help/our-watermark-policy/); Clideo anonymous-export-with-watermark — [help.clideo.com](https://help.clideo.com/hc/en-us/articles/6539612542492-Why-do-I-see-the-Clideo-watermark-on-a-video)
- Competitor gating: OpusClip (anonymous link paste, inference post-signup) — [opus.pro](https://www.opus.pro/); Vizard, Klap signup-first — [vizard.ai](https://vizard.ai/tools/clip-maker), [klap.app](https://klap.app/)

**Flagged as unverified — do not quote as fact:** Calendly "25% of signups from the badge"; watermark-loop "K = 0.15–0.3" (uncited content-marketing figures); Loom "32% of >75% viewers convert in 7 days" (couldn't trace to a primary source); Instagram's demotion of competitor watermarks is platform-confirmed but is the only hard "watermarks reduce reach" datapoint — no academic A/B exists.

**Code references (for the implementing engineer):**
- Marketing page wiring: `bitterclip-marketing/app/pages/index.vue:115–223`
- Hero demo host + tool stubs: `bitterclip-rails/app/views/embed/recording.html.erb` (unknown-tool ack at :193; display-mode grant at :159–180)
- Demo bridge (clip-demo): `bitterclip-rails/app/javascript/host_actions/demo-bridge.js`
- Generate silent no-op: `bitterclip-rails/app/javascript/components/composition-editor/component.js:3539–3552`
- Fake-success download: `component.js:3702–3740` + `host_actions/mcp-apps-bridge.js:150–155, 446–450`
- Watermark pipeline: `bitterclip-rails/app/services/bitterclip/render_watermark.rb`; assets in `public/render_marks/`
- Embed controller, allowlist, rate limits: `bitterclip-rails/app/controllers/embed_controller.rb`
- Clip-embed beacons (reusable for demo telemetry): `app/javascript/components/clip-embed/component.js:162–206`, `app/models/embed_event.rb`
