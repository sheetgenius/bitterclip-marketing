# Documentation build — run log (compounding)

The meta-artifact. Each run records what we did, what improved, and how to work better next
time. **Read "Current best practice" before starting a run; update it after.** The point is
for each run to start smarter than the last.

## Current best practice (refine every run)
- Start from `grounding-brief.md` (facts + voice) and `frontiers.md` (rubric).
- Plan with subagents; decompose for DRY (`content-architecture.md`) BEFORE drafting.
- Cycle: draft → adversarial multi-frontier review (round-robin) → humanizer pass →
  cross-provider Codex xhigh spot-check → iterate until every frontier passes.
- Persist learnings here so the next run is faster and sharper.

## Open questions / standing improvements
- Finalize the exact `@nuxt/content` v3 partial/snippet mechanism for single-sourcing.
- Decide hand-authored `_data/*.yml` vs generated-from-app-manifest for the volatile facts.
- ~~Wire the generated `.md`/`llms.txt`/sitemap/RSS prerender hook (per the spec review).~~
  **DONE — Phase 2** (see Run 2 below). Standing improvement: when per-entry changelog
  pages land (each with `date`/`summary` frontmatter, `section: changelog`), the RSS feed
  picks them up automatically — no module change needed.

## Runs
### Run 1 — 2026-06-24 — initialize protocol + first full build
- Created `grounding-brief.md`, `frontiers.md`, `content-architecture.md`, this log.
- Maintainability/DRY elevated to a co-equal frontier alongside voice.
- Planning workflow → `build-plan.json` / `build-plan.md` (16 pages, 17 snippets, 4 data files), adversarially reviewed.
- Skeleton agent → `@nuxt/content@3.14.0` substrate, 4 zod data collections, 17 MDC snippet components, catch-all renderer; build GREEN; `authoring-conventions.md` written. (Gotcha: `better-sqlite3` is a required build-time dep — note for CI.)
- Content workflow (90 agents) → authored + verified snippets/data, then 16 pages via draft→adversarial-critique→humanize. Build green: 49 routes prerendered (crawler discovered all pages via NextSteps links).
- Review R1: Codex xhigh (cross-provider) + a 7-frontier round-robin workflow → `review-r1.md` (21 fixes, 6 HIGH).

**Learnings (fold into artifacts before next run):**
- **Callout syntax bug (my fault):** the grounding brief suggested GitHub blockquote callouts (`> [!TIP]`) but the real mechanism is the `::callout` MDC component — 8 callouts rendered broken. FIX the grounding brief + conventions to mandate `::callout` only. (Pending.)
- **Generated surfaces are not optional:** the hand-written `public/llms.txt`, `llms-full.txt`, `docs.md` still teach the retired "Moment" model and the `sitemap.xml` omits all 17 new pages. Must build the prerender generation pipeline (Phase 2) — this is the maintainability frontier biting exactly as predicted.
- **No raw `snake_case` tool names in creator-facing prose** — lead with plain verb phrases; demote identifiers. Add to grounding brief.
- **Single-source cross-page facts harder:** the export-shape default contradiction (vertical vs widescreen) shows two pages stated the same fact independently — that fact belongs in a snippet/data value.

- Next: merge Codex + R1 fix list → per-file fix workflow → humanizer-skill pass → re-verify build → Phase 2 generated surfaces + redirects → iterate to baked.

### Run 2 — 2026-06-24 — Phase 2: generated machine-readable surfaces + redirects
Built the surfaces so they are never hand-maintained again, plus the retirement redirects.

**What was wired (one module: `modules/generated-surfaces.ts`, registered in `nuxt.config.ts`):**
- A Nuxt module that hooks `nitro:init` → `prerender:done` (fires after every route is
  prerendered) and writes, into `nitro.options.output.publicDir` (`.output/public`):
  1. **Per-page raw `.md` twins** at `/docs/<path>.md` (verbatim frontmatter + body) — 16 twins
     (15 section pages under `/docs/**.md` + the hub at `/docs.md`).
  2. **`/llms.txt`** — a section-grouped index (title + description per page) with the
     Recording → Episode → Clip elevator + a one-line "Moment is retired" note.
  3. **`/llms-full.txt`** — the concatenated docs corpus (frontmatter stripped, source URL per page).
  4. **`/sitemap.xml`** — the 4 marketing routes (`/`, `/privacy`, `/terms`, `/data-deletion`)
     + all 16 `/docs/*` pages, `lastmod` from each page's `updated` frontmatter.
  5. **`/changelog.xml`** — an RSS 2.0 feed built from `section: changelog` pages.
- Deleted the stale hand-written `public/llms.txt`, `public/llms-full.txt`, `public/sitemap.xml`
  (now generated) and the orphaned `public/docs.md` / `public/mcp.md`. Scrubbed the retired
  Recording→Moment→Clip model out of the homepage twin `public/index.md` (it is hand-maintained,
  not a docs page).

**Redirects / retirement:**
- `app/pages/docs.vue` was already gone; `/docs` is served by the catch-all `docs/[...slug].vue`
  rendering `content/index.md` (the new hub).
- Deleted `app/pages/mcp.vue`; repointed the two global-nav `/mcp` links in `app/app.vue` to
  `/docs/assistants/overview` (the crawler 404'd on `/mcp` until this — the live editor embed +
  page content already migrated to `LiveEditorEmbed.vue` + `assistants/overview.md` in Run 1).
- `nginx.conf`: 301 `/mcp` → `/docs/assistants/overview` and `/mcp.md` → `/docs/assistants/overview.md`;
  removed the dead `/mcp` `try_files` block; added `/docs/` subpath routing,
  `changelog.xml` (`application/rss+xml`) and `sitemap.xml` (`application/xml`) content-type blocks.
  `/docs.md` is now the generated hub twin (served by the existing `.md` glob). The legacy
  per-file `.md` canonical blocks for `/index.md`, `/privacy.md`, `/terms.md` stay.

**How it stays DRY:** the single source is the `content/` collection on disk. The module reads
those files (frontmatter via `yaml`, body verbatim) — no second copy of any fact. Edit one
`content/*.md` page (or `site.yml`) and every surface above regenerates on the next build. The
marketing (non-docs) routes are enumerated in exactly one place (`MARKETING_ROUTES`), and the
RSS auto-discovers any future `section: changelog` page.

**Verification (all GREEN):**
- `bun run generate` → green, 47 routes prerendered; module logs
  `16 .md twins + llms.txt, llms-full.txt, sitemap.xml, changelog.xml`.
- `.output/public` contains all 16 `.md` twins, `llms.txt`, `llms-full.txt`,
  `sitemap.xml` (16 `/docs/*` `<loc>` + 4 marketing), `changelog.xml`. Both XML files parse.
- `grep -ri moment` over the generated surfaces: every hit is ordinary prose ("the strongest
  moment", "give it a moment") or the one sanctioned "the 'Moment' noun is retired" line.
  Precise checks for the retired model (`source-linked moment`, `Moment ->`, `Moments:` step
  labels) all returned **none** — CLEAN.

**Learnings:**
- In Nuxt 4 the `~/` alias is `app/` (srcDir), so a root-level `modules/` entry must be
  registered by absolute path (`fileURLToPath(new URL('./modules/...', import.meta.url))`),
  not `~/modules/...`.
- `prerender:done` (not `close`) is the right hook to append files into the static output: it
  fires after all HTML/`.md`-route prerendering, with `nitro.options.output.publicDir` resolved.
- Retiring a page means hunting its inbound links too — the crawler fails the build on a 404,
  which is a useful guardrail (caught the stale `/mcp` nav links).

### Run 3 — 2026-06-24 — review rounds, humanize, acceptance GO, committed
- Review R1 (Codex xhigh + 7-frontier round-robin) → merged per-file fix workflow applied all
  21 fixes (incl. the export-shape contradiction, McpTools snake_case→plain-ask, Claude
  paid-plan prereq, broken-callout conversion).
- Full humanizer-skill pass over all 16 pages (em/en-dash hard ban; accuracy + snippet
  invocations preserved). Final acceptance review → **GO** (all HIGH fixes verified landed,
  all spot-checked claims TRUE vs the product repo). Committed `6a3cb8f` (build green, 47 routes).

**Learnings (fold into artifacts next run):**
- **Quote frontmatter values containing a colon.** A humanized `description:` with "BitterClip:
  cost" broke the YAML build (`Nested mappings not allowed`). Add to authoring-conventions:
  any frontmatter value with `: ` must be quoted.
- **Include `content/_data/*.yml` in humanizer + em-dash sweeps.** The page pass missed the
  data files, which still rendered em-dashes in the McpTools table. Sweep data values too
  (dev comments are exempt).
- **Generated surfaces don't cover `public/index.md`** (the hand-maintained homepage twin):
  it still hard-codes prices/storage and can silently drift. Candidate to generate or de-price.
- **Nav-order ties** (`getting-started` 0×2, `assistants` 2×2) are harmless now (nothing reads
  `navigation.order`) but clean them before a sidebar ships.
