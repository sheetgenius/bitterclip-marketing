# BitterClip docs site — spec

**Status:** design / spec (2026-06-23). Not yet built.
**Repo:** `bitterclip-marketing` (Nuxt 4, Tailwind v4, Kamal deploy).
**Lives at:** `bitterclip.com/docs` — natively, inside the existing static marketing site.
No subdomain, no proxy, no second app.

> One-line: a markdown-driven, creator-facing docs section built **inside the existing
> static marketing site** with `@nuxt/content` + a **hand-rolled docs layout inspired by
> Docus** (not the Docus framework) — plus a **changelog** and a **machine-readable `.md`
> surface for agents**.

---

## 1. Goal & audience

Give creators a calm, screenshot-driven place to learn **what BitterClip is** and **how to
connect their stuff** — written for non-technical operators (plain language, no code). The
immediate driver is real connection friction (e.g. the YouTube Brand-Account-vs-Studio-
manager trap we hit on 2026-06-23 — see `bitterclip/docs/build/reception-learning-loop.md`).

**Non-goals (v1):** a public JSON API reference / developer portal. Deferred until there's a
stable public API contract worth documenting.

---

## 2. Principles (these are the brief, verbatim)

- **Hand-rolled, not framework'd.** Build our own lean docs layout (sidebar · content · TOC)
  *inspired by* Docus's look — it does NOT have to match exactly. No docs framework or theme
  (no Docus, no Nuxt UI Pro, no license). Rationale: heavyweight scaffolds were a hedge
  against expensive code; that's mostly gone — a small tailored thing we own beats adopting a
  whole framework to avoid a few hundred lines of Vue.
- **One static site.** Lives in the existing `bitterclip-marketing` Nuxt app
  (`nuxt generate`), same build + Kamal/Grid deploy. The only added dependency is
  `@nuxt/content` — a markdown module, not a framework — for markdown+frontmatter rendering.
- **Markdown + frontmatter is the source of truth.** Public repo → every doc is a plain
  `.md` file with structured frontmatter. Human-editable, diff-able, reviewable.
- **Machine-readable / agent surface.** Every page is also available as raw `.md`, plus an
  `llms.txt` index, so agents (and our own MCP) can read the docs as text. (Extends the
  existing `/docs.md`, `/mcp.md` alternate-link pattern already in the repo.)

---

## 2b. Inspiration & quality bar

Do **not** adopt any of these frameworks — **steal their best patterns** and build something
as good or better with our own hand-rolled components (§3). The bar is their *quality*, not
their codebase. Three references:

1. **Mintlify** (and Mintlify-powered: Anthropic, Resend, ElevenLabs, Cursor) — the modern,
   friendly product-docs bar, closest to our creator audience. Steal: ⌘K search; Note/Tip/
   Warning callouts; Steps, Tabs, Accordion, and Card-grid components; the overview page as a
   grid of cards; warm-but-precise tone; clean dark mode.
2. **Stripe docs** — the structure/clarity gold standard. Steal: multi-column layout with a
   contextual right rail; deep-but-well-grouped left nav; progressive disclosure; paired
   explanation + example; ruthless clarity.
3. **Linear docs + changelog** — aesthetic restraint + the changelog done right. Steal:
   typographic hierarchy and calm minimalism; and the changelog-as-product-feed pattern
   (dated entries, tags, RSS) for §5.

Honorable mentions for interaction polish: Tailwind CSS docs (search/TOC/dark-mode),
Supabase (product + reference mix).

**Directive:** match or beat these three on clarity, polish, and the patterns above — using
our own lean components. Quality bar = theirs; code = ours.

## 3. Technical approach

**Engine: `@nuxt/content` in the existing app.** Add the module to `bitterclip-marketing`.
Content lives as `.md` in `content/`; `nuxt generate` pre-renders the docs pages into the
same static build. No second app, no proxy — `/docs/*` is just more static routes on
`bitterclip.com`.

**Layout: hand-rolled, Docus-inspired.** Build one `docs` layout component — left sidebar
nav · content · right TOC — using the site's existing Tailwind v4 tokens. Take spacing,
sidebar treatment, and typography *cues* from Docus, but it's our component and doesn't have
to match. `@nuxt/content` supplies the pieces that are tedious to hand-build: nav tree from
the file structure, the TOC from headings, prev/next, and prose styling. Net new Vue is
small (a layout + a couple of nav/TOC components).

**Routing & migration:**
- `bitterclip.com/docs` → docs home / overview
- `bitterclip.com/docs/<section>/<page>` → rendered markdown
- `bitterclip.com/docs/<…>.md` → raw markdown twin (agent surface, §6)
- Re-create the content currently in `app/pages/docs.vue` and `mcp.vue` as markdown pages,
  then retire those bespoke pages. Keep the old `/docs` and `/mcp` URLs (or 301 to the new
  locations) so SEO/links don't break — same domain, so equity stays put.

**Search / versioning:** start with `@nuxt/content`'s built-in search; no versioning in v1.

---

## 4. Information architecture (content tree)

```
content/
  index.md                         → /docs            (overview + "start here" cards)
  getting-started/
    what-is-bitterclip.md
    your-first-clip.md
    recordings-episodes-clips.md   (migrate from docs.vue: Recording → Moment → Clip)
  assistants/                      "Use BitterClip from your AI assistant"
    overview.md                    (migrate/condense from mcp.vue)
    connect-chatgpt.md
    connect-claude.md
  connect/                         "Connect your channels" (the connector guides)
    youtube.md                     ← includes the Brand-Account vs Studio-manager gotcha,
                                      the analytics scope, and "who must authorize"
    x.md
    linkedin.md
    instagram.md                   (note the capped/manual reality per the IG decision doc)
  changelog/
    <YYYY-MM-DD>-<slug>.md          (one entry per change; see §5)
```

Sidebar nav groups = top-level folders, ordered + titled via frontmatter / a
`.navigation.yml` per folder (Docus convention).

**Connector-guide content is single-sourced where possible.** The "what scopes / what
permissions" facts should not drift from the app. Either (a) hand-authored now and kept in
sync by review, or (b) later generated from the app's connector manifest. Flag for decision.

---

## 5. Changelog section

A `changelog/` collection of markdown entries, published as a reverse-chronological feed at
`bitterclip.com/docs/changelog` (or top-level `/changelog` — decide in §8).

**Per-entry frontmatter:**
```yaml
---
title: "X threads: publish episodes as a thread"
date: 2026-06-23
tags: [publishing, x]
summary: "One-line shown in the feed and RSS."
---
```
- Rendered as a dated feed (newest first), grouped by month.
- **RSS/Atom feed** generated from the collection (creators/agents can subscribe).
- **`.md` + `llms.txt`** surface like every other doc (§6) — the changelog is itself an
  agent-readable update stream.

---

## 6. The machine-readable / agent surface

Public repo + agent-first ethos → docs are first-class machine-readable:

- **Raw `.md` twin per page:** `…/youtube` ↔ `…/youtube.md` returns the source markdown
  (frontmatter + body). Generalizes the existing `/docs.md`, `/mcp.md` alternate links into a
  rule for every page. *(This is functional plumbing — a small server route/module — and is
  explicitly exempt from the "no custom" branding rule in §2; the no-custom rule governs
  CSS/layout/theme, not the agent surface, which is a core requirement.)*
- **`/llms.txt`** (and `/docs/llms-full.txt`): an index + concatenated corpus of the docs for
  LLM ingestion, following the emerging convention.
- **Structured frontmatter** on every file (title, description, section, order, updated,
  tags) so the corpus is queryable, not just prose.
- Stretch: BitterClip's own MCP/agent can fetch these `.md` endpoints to answer "how do I
  connect X" in-product — the docs become a tool the assistant reads.

---

## 7. Phasing

| Phase | Scope |
|---|---|
| **P0** | Add `@nuxt/content`; build the thin `docs` layout (sidebar/TOC) on the site's design; one placeholder page; the `.md` twin + `llms.txt` plumbing; `/docs` route + nav. |
| **P1** | Migrate `docs.vue` → getting-started; migrate `mcp.vue` → assistants (ChatGPT/Claude connect pages). Redirects for old URLs. |
| **P2** | Connector guides, **YouTube first** (with the Brand-Account/Studio-manager + analytics-scope gotchas), then X / LinkedIn / Instagram. |
| **P3** | Changelog collection + feed + RSS; backfill a few recent entries. |
| **P4** | Built-in search, polish, "start here" cards, cross-links. |

---

## 8. Open questions / decisions

- ~~Docus-as-theme vs framework vs hand-rolled~~ **RESOLVED:** hand-rolled docs layout
  inspired by Docus, inside the existing static site, `@nuxt/content` as the only added dep
  (§2/§3). No framework, no separate app, no proxy.
- ~~Placement~~ **RESOLVED:** `bitterclip.com/docs`, native in the existing app.
- **Changelog URL:** `/docs/changelog` (under docs) vs top-level `/changelog` (reads more
  like a product-update page). Minor — decide at P3.
- **Connector-guide single-sourcing:** hand-authored + review now, or later generated from
  the app's connector manifest? (Avoids scope/permission drift.)
- **Verify** `@nuxt/content` v3 plays cleanly with the repo's Nuxt 4.4 + Tailwind v4 at P0.
- **Connector-guide single-sourcing:** hand-authored + review now, or generated from the
  app's connector manifest later? (Avoids scope/permission drift.)
- **Nuxt Content v3 + Docus version compatibility** with the repo's Nuxt 4.4 — verify exact
  versions during P0.
- **Search engine:** confirm built-in (Orama) is enough for launch.
