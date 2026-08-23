# Homepage promotion audit — `/lab/iso4` → `/`

> **Status: historical completed migration.** ISO4 is already the homepage and
> `/` is now the canonical acceptance surface. See the
> [homepage runbook](runbooks/homepage.md) for current work.

2026-08-20. The owner ruled: the ISO4 page becomes the homepage. This is the
side-by-side inventory and the ticket list for the cut-over. Push-to-main
auto-deploys prod, so the swap must land as ONE complete commit — no
half-migrated states.

## Side by side

| | CURRENT `/` (index.vue, 1092 lines) | NEW `/lab/iso4` (450 lines) |
|---|---|---|
| **Hero** | Live phone running the real recording-viewer embed; H1 + copy left | The 3D machine: dual-reel projector, real footage, three-artifact constellation; integrated pillar fold; single CTA |
| **Value framing** | Prose sections ("It watched the whole session", "The handoff") | Three pillars in the fold + substrate section (editor screenshot) + Bring-your-agent (transcript) |
| **Live product** | TWO live embeds: hero recording viewer + clip-demo editor (`#demo`) | Editor as static screenshot; live clip embed in Proof |
| **Testimonials** | Band under hero: Andrew + Rohan (signed off 2026-06-10) | Same two quotes, in the Proof section with the live clip |
| **FAQ** | 8 signed answers + FAQPage structured data | — none |
| **Pricing** | Full ladder Free/$0 · Clip/$9 (recommended) · Pro/$99, plan-carrying CTAs | — none |
| **SEO head** | canonical, og:url, markdown-twin link, Organization/WebSite/SoftwareApplication/FAQPage JSON-LD | title only; **noindex** |
| **Signup attribution** | `surface: homepage` + funnel **stages** (hero_editor_opened, editor_clip_created, export…) wired to embed events | `surface: lab_iso4`, no stages |
| **Nav anchors** | `#demo`, `#faq`, `#pricing` all resolve | only `#how`; nav "Demo" and "Pricing" anchors would break |
| **Perf** | iframes deferred via afterIdle; measured heights; no layout shift | three.js in a lazy chunk (never in main bundle); IntersectionObserver stops offscreen; LCP = H1 text |

## Tickets

### Blockers (must land IN the swap commit)
1. **SEO head migration** — canonical, og:url, markdown-twin link, and the
   four JSON-LD blocks move to the new page. FAQPage JSON-LD only if the FAQ
   section moves (it must — see T3). Kill `noindex`. Real
   title/description: current title in app config vs "BitterClip — Footage
   in, Episodes out" (owner to confirm final).
2. **Signup attribution** — `surface: 'lab_iso4'` → `'homepage'`; decide
   whether funnel stages survive (the stage events come from the embeds; the
   new page has one live embed — the Proof clip — so stages reduce or retire).
3. **FAQ section ports** — 8 answers verbatim (bottom-funnel objections;
   answers were reviewed/signed; the doc previously miscounted 9), plus one
   NEW destinations answer carrying the old handoff section's facts
   (YouTube/X/LinkedIn/link, Instagram send-to-phone, confirm gate, client
   invite). New page slot: after Proof, before footer. Keeps `#faq` anchor +
   FAQPage JSON-LD.
4. **Pricing ladder ports** — the Free/Clip/Pro grid + closing pitch,
   verbatim (ladder is owner-ruled, 2026-06-09). Keeps `#pricing` anchor.
   Slot: after FAQ, per current bottom-funnel order.
5. **Nav anchors** — "Demo" nav points at `/#demo`: either the Proof section
   takes `id="demo"` (the live clip IS the demo now) or nav retargets. Owner
   pick.
6. **Route mechanics** — iso4 content becomes `app/pages/index.vue`;
   `/lab/iso4` stays as the workshop mirror (still noindexed) or retires.
   The markdown twin / llms.txt / sitemap regenerate from the new content at
   build (generated-surfaces) — verify in the build output.

### Follow-ups (after the swap, not blocking)
7. **Retire the old hero embeds** — the recording-viewer phone hero and its
   theme/height plumbing (~300 lines of script) go with the old page. The
   clip-demo editor embed could return later as an interactive "open the
   editor" moment; for now the substrate screenshot covers it.
8. **OG image** — bitterclip-og.png shows the old look; reshoot from the
   machine at t=24 for a hero-true card.
9. **Headed-GPU perf run** on the real homepage route (video texture + bloom
   at homepage traffic priority).
10. **Scene-side polish** (scene agent's list): phone caption copy ("THE
    CLIP ONLY WORKS…"), mobile phone margin, YouTube false horizon.
11. **A/B fallback** — keep the old page reachable at `/classic` (noindex)
    for one soak week, then delete.

## Cut-over executed — 2026-08-20

The swap landed as one commit (iso4 content → `app/pages/index.vue`). What was
decided and done, reconciled from three independent reviews (Fable, Grok,
Codex) plus owner rulings in-session:

- **Blockers 1–6: done.** SEO head + four JSON-LD blocks migrated; `noindex`
  dropped; site title/description in nuxt.config → "BitterClip — Footage in,
  Episodes out". Attribution `surface: 'homepage'`; the demo-stage machinery
  **retired** (owner ruled the live embeds dead — the eventual successor is a
  produced ~1-minute product film, not a live surface). FAQ (8 + destinations)
  and pricing ported verbatim, restyled to warm-card chrome. Nav: the Proof
  section took `id="demo"` (the live clip is the one touchable thing left).
  `/lab/iso4` stays as the noindexed workshop mirror; the markdown twin
  (`public/index.md` — hand-written, not generated) was rewritten.
- **Woven claims** (from the old page's prose, per the synthesis): recorder
  line in the substrate intro (the "cannot record" smoke guard was rewritten
  against it, same intent); speaker-memory + revise-the-same-cut in
  Bring-your-agent; source-check in the substrate caption; free-tier fine
  print under the hero CTA. Company links restored on both testimonials.
- **A/B fallback**: old page soaks at `/classic` (noindex, surface
  `classic`), guarded by a smoke test; delete after ~a week.
- **T8 done (2026-08-21):** OG card reshot from the real scene —
  `public/images/bitterclip-og-iso4.png` (new filename to bust scraper
  caches; nuxt.config og/twitter meta + site.yml `og_image_default` +
  smoke assertion updated; the old `bitterclip-og.png` stays for any legacy
  references). Recipe: 1200×630 viewport at dpr 2 on `/`, hide `header`,
  `.hero-cta-row`, `.hero-fineprint`, freeze `window.__iso.still(24)`
  (deployed constellation), screenshot, `sips -z 630 1200` downscale.
  Composition: headline + pillars left, machine + three projections right —
  no CTA button (an un-clickable button reads as a screenshot, and
  og:title/description already carry the ask).
- Still open (unchanged): headed-GPU perf run (T9), scene-side polish (T10).

### Losses accepted by the swap (owner-acknowledged)
- The hero no longer runs the REAL product component (the unified-composition
  direction). The machine is the first impression; the real editor appears as
  screenshot + live clip embed. The "real editor in the hero" idea can return
  inside a below-fold interactive moment later.
- Old sections' prose ("It watched the whole session", "The handoff") —
  superseded by substrate/agent/proof. Any copy worth saving is in git.
