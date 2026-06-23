# Review — BitterClip docs site spec

**Reviewer:** senior staff eng, adversarial pass · **Date:** 2026-06-23
**Target:** `docs/docs-site-spec.md` · **Repo grounded against:** `package.json`, `nuxt.config.ts`, `nginx.conf`, `Dockerfile`, `config/deploy.yml`, `app/pages/{docs,mcp}.vue`, `app/assets/css/main.css`, `public/`.

## Verdict

The strategic shape is right — `@nuxt/content` v3 *does* run cleanly under this repo's `nuxt generate` static pipeline (it ships a SQLite-WASM dump the browser queries client-side, so even built-in search works without a server runtime), the subdirectory `/docs` placement is correct for SEO, and hand-rolling the layout is a defensible call. But the spec is **not buildable as written** because it gets the single most load-bearing fact about this repo wrong: the existing `.md`/`llms.txt` "agent surface" it claims to merely "extend" is **hand-written static files in `public/` wired up by a bespoke, per-route `nginx.conf`** — there is no server, no route module, and nothing automatic. Generalizing "a `.md` twin for every page" is therefore a real engineering task (a prerender hook that emits one static `.md` artifact per content page + nginx/route changes), not a freebie, and the spec budgets it as plumbing-by-the-way. Two further gaps will bite: the `mcp.vue` page is a **live, stateful iframe embed** (postMessage resize, client-side URL building) that cannot be expressed as markdown, and the spec materially **underestimates the hand-rolled component surface** needed to actually hit the "as good as Mintlify/Stripe/Linear" bar. Fixable, but several decisions must change before any code.

---

## Findings

### Technical feasibility — @nuxt/content v3 on this stack

**[MEDIUM] The spec never resolves the version/SSG question it flags, and the answer changes the plan.** Open questions repeatedly ask to "verify `@nuxt/content` v3 plays cleanly with Nuxt 4.4 + Tailwind v4 at P0" and even ask about "Nuxt Content v3 + **Docus** version compatibility" (§8) — the latter is incoherent given §2 explicitly rejects Docus; that line is a leftover and should be deleted. The real answer: @nuxt/content **v3** is the version that targets Nuxt 4 + Nitro, and it is **designed for static hosting** — on first query the browser downloads a generated SQLite dump and runs all subsequent queries locally via WASM SQLite ([Nuxt Content: Static Hosting](https://content.nuxt.com/docs/deploy/static)). So the headline worry ("does the query layer / search work with no server runtime?") is **resolved: yes**, client-side. This is good news the spec doesn't claim and should bank.

**[MEDIUM] But the SQLite-WASM dump is a real cost the spec ignores.** Client-side querying means the *entire docs corpus database* is shipped to and parsed in the browser before the first dynamic query resolves. For a creator audience on phones (the `mcp.vue` code already special-cases `innerWidth < 768`), that is a WASM blob + DB dump on top of the page. Mitigation: keep the per-page route a true prerendered HTML page (no client query needed for the page body — `@nuxt/content` prerenders the page content), and only pay the WASM cost for **search** and **client-side nav-tree/prev-next** if those are done as live queries. Decide explicitly: prerender the nav tree and TOC into static HTML (cheap, no WASM on load) vs. query them client-side (WASM on load). The spec assumes the framework "supplies" these for free without noting which path incurs the dump download.

**[LOW] Tailwind v4 + @nuxt/content prose styling will not "just work" together.** @nuxt/content renders prose via MDC components (`<ProseH2>`, `<ProseCode>`, …). This repo uses Tailwind v4 via `@tailwindcss/vite` with **no `@tailwindcss/typography` plugin** and a fully custom `@theme` (peach `#f28f84`, Manrope/IBM Plex Mono/Caveat). There is **no Tailwind `prose` class available**, so prose styling is *not* "supplied by the framework" as §3 implies — you will hand-write prose CSS or override every Prose* component to match the existing glass/peach aesthetic. Budget this as real work (see component list below).

**[LOW] Font reality check undercuts the "match Stripe/Linear typography" bar.** `main.css` `@theme` declares `--font-sans: "Manrope"` and `--font-mono: "IBM Plex Mono"`, but `nuxt.config.ts` only loads **Caveat** from Google Fonts. Manrope and IBM Plex Mono are **never loaded** — the site currently falls back to system fonts for body and mono. A docs section judged against Stripe/Linear typographic hierarchy needs its display/mono faces actually present. Fix the font loading (self-host or add to the Google Fonts link) as part of P0, or the typography bar is unreachable regardless of layout quality.

### The `.md` twin + `llms.txt` agent surface on a static site

**[BLOCKER] The spec's central premise about the existing agent surface is factually wrong, and it makes the work look free.** §2/§6 say the `.md` twin "extends the existing `/docs.md`, `/mcp.md` alternate-link pattern already in the repo" and call it "a small server route/module." Ground truth from the repo:
- `public/docs.md`, `public/mcp.md`, `public/index.md`, `public/privacy.md`, `public/terms.md`, `public/llms.txt`, `public/llms-full.txt` are **hand-authored static files**, visibly drifting from their `.vue` sources (e.g. `docs.md` is a prose rewrite of `docs.vue`, not a transform of it).
- They are served by a **hand-written `nginx.conf`** with an *explicit `location =` block per file* (one for `/docs.md`, one for `/mcp.md`, …) plus a catch-all `location ~* \.(md|markdown)$`. Each block sets the `text/markdown` type and a `Link: rel=canonical` header by hand.
- There is **no `server/` directory, no Nitro route, no module** doing any of this. The Dockerfile is `nuxt generate` → copy `.output/public` into **nginx**. There is no Node/Nitro server in production at all.

Consequences the spec must absorb:
1. "A `.md` twin for *every* page" cannot be "a small server route" — **there is no server**. It must be a **build-time artifact**: a Nitro/Nuxt `prerender:routes` (or `nitro:build:public-assets`) hook that, for each content page, writes a sibling `*.md` (frontmatter + body) into `.output/public`. The Nuxt SEO ecosystem already solves exactly this ([Nuxt AI-Ready / Markdown conversion](https://nuxtseo.com/docs/ai-ready/guides/markdown), and `nuxt-llms` for `llms.txt`) — the spec should either adopt one of those modules or own the hook deliberately, not hand-wave it as plumbing.
2. The `.md` files must be **generated from the same markdown source** as the HTML page, or they re-introduce exactly the drift already visible in `public/*.md`. "Single source of truth = markdown" (§2) only holds if the twin is the source file emitted verbatim, not a separate hand-written copy.
3. `nginx.conf` is **load-bearing and must change**. The spec's "no proxy, no second app, just more static routes" elides that someone must extend the nginx routing for the new `/docs/**` HTML pages, their `.md` twins, and the nested-path canonical `Link` headers — the current per-file `location =` approach does not scale to a folder tree. Either switch to a directory-glob nginx rule that serves `*.md` with the right type (the catch-all already half-does this) and drop the per-file canonical headers, or generate the headers another way. Call this out as in-scope.

**[HIGH] `llms.txt` / `llms-full.txt` must become generated, or they will rot.** Today they're hand-maintained (`public/llms-full.txt` is a 12 KB concatenation by hand). Once docs are N markdown files, a hand-curated index/corpus is guaranteed to drift within weeks. The spec lists `llms.txt` as a P0 deliverable but doesn't say it must be **generated from the content collection at build time**. Make that explicit (e.g. `nuxt-llms`, or a custom prerender step that walks the content collection). Otherwise P0 ships a maintenance liability.

**[MEDIUM] `nuxt generate` will not auto-discover content routes to prerender unless told.** This is a known sharp edge: dynamic routes backed by `@nuxt/content` are not always crawled/prerendered automatically (see [nuxt#31426](https://github.com/nuxt/nuxt/issues/31426)). You typically need `nitro.prerender.crawlLinks: true` *plus* every doc reachable by a link from a prerendered page, or an explicit `prerender:routes` enumeration of the content collection. If a page isn't linked from the crawl graph (e.g. a changelog entry only reachable via RSS), it silently won't generate. Spec must mandate a route-enumeration step and a CI check that page count == content file count.

### Hand-rolled vs framework — is the decision justified?

**[HIGH] The decision is defensible, but the spec under-scopes the hand-build by a wide margin.** §3 claims "Net new Vue is small (a layout + a couple of nav/TOC components)" and that @nuxt/content "supplies the pieces that are tedious to hand-build: nav tree, TOC, prev/next, and prose styling." That's optimistic. @nuxt/content gives you **data** (parsed frontmatter, a heading/TOC tree on the parsed doc, `queryCollectionItemSurroundings` for prev/next, a navigation query) — it does **not** give you the *rendered, accessible, styled UI*. To hit the stated bar you hand-build, at minimum:

| Piece | @nuxt/content gives | You must build |
|---|---|---|
| Sidebar nav tree | navigation query (data) | rendering, active-state, collapse/expand, scroll-into-view, ordering from frontmatter/`.navigation.yml`, mobile drawer |
| TOC right rail | heading list (data) | sticky positioning, **scroll-spy active-heading** (IntersectionObserver), nested rendering |
| Prev/next | surroundings query (data) | the component + styling |
| Prose | MDC Prose* components (unstyled vs your theme) | full prose CSS to match the glass/peach theme; no `@tailwindcss/typography` here |
| Code highlighting | Shiki via MDC (needs config + theme) | theme selection, copy-button, line-highlight, filename header (your `mcp.vue` does this by hand today) |
| Callouts/Steps/Tabs/Cards | nothing — these are Mintlify components | **build every one** as MDC components |
| ⌘K search UI | client query API only | the entire modal, keyboard handling, result rendering, focus trap, a11y |
| Dark mode | nothing | the site is dark-only today; "clean dark mode" is free but a light mode is not |
| Mobile nav | nothing | drawer, focus management |
| A11y | nothing | skip-links, landmark roles, focus order, `aria-current`, reduced-motion (the repo already invests heavily here in `main.css` — the docs must match that standard) |

"As good or better than Mintlify/Stripe/Linear" realistically means building Callouts, Steps, Tabs, Card-grid, a ⌘K search overlay, scroll-spy TOC, mobile drawer, copy-able code blocks, and a prose theme — that's **a dozen-plus components and a real prose stylesheet**, not "a couple." The hand-roll is the right *call* (consistent with the repo's bespoke aesthetic and the team's "hand-roll over frameworks" doctrine), but the spec should re-estimate honestly and phase it, or it will ship a thin layout that visibly *loses* to the references it names.

### The `mcp.vue` migration

**[HIGH] `mcp.vue` cannot be "re-created as markdown" — it is a live application embed.** §3/§7 (P1) say "migrate `mcp.vue` → assistants" as markdown pages. But `app/pages/mcp.vue` is not prose: it mounts a **live `<iframe>` to `app.bitterclip.com/embed/clip-demo`**, builds the embed URL client-side in `onMounted` (reads `window.location`, an `?embed=` override, appends a real demo clip), listens for postMessage `height` events to **auto-resize the iframe**, has a mobile activation gate, a skeleton loader, and interactive tabs. This is the "live editor running below" centerpiece — per the marketing memory, the hero embed is a measurable success criterion. Markdown + MDC can host a *custom Vue component* inside the body, so the path exists, but the spec must say so: the embed becomes an **MDC component embedded in the assistants page**, not flattened to text. As written, P1 would regress the live demo. Also note the embed's `.md` twin would lose the embed entirely — fine, but intentional.

**[MEDIUM] The tool catalog in `mcp.vue` is already stale and hand-maintained.** The 12-row tools table (`recordings_list`, `transcript_read`, `clips_create`, …) does not match the app's *actual* current MCP surface, which is **episode-first** (`episode_read`, `episode_edit`, `episodes_list`, `publishing_*`, etc., per the live MCP tool list). Migrating this table verbatim into docs canonizes stale content. This is the same drift risk as the connector single-sourcing question (below) — flag the tools reference as either (a) cut from v1 (the spec already defers a developer/API portal as a non-goal — good, lean into that and drop the tools table) or (b) generated from the MCP manifest.

### SEO / funnel claims

**[LOW — claim is correct] Subdirectory `/docs` over a subdomain is the right call and the spec's reasoning ("same domain, equity stays put") is accurate.** Consolidating docs under the apex path keeps link equity and authority on one host; this is current best practice and matches Stripe/Linear/Mintlify-hosted setups. No change needed — just don't oversell it; the bigger SEO wins are internal linking, `sitemap.xml`, and canonical correctness (below).

**[MEDIUM] Sitemap and canonicals are hand-maintained and will silently rot.** `public/sitemap.xml` lists every URL by hand (including each `.md`). Adding a docs tree by hand here is the same drift trap as `llms.txt`. The sitemap should be **generated** from the content collection at build (and include the new docs pages and their `.md` twins, or deliberately exclude the twins). Likewise the per-page `Link: rel=canonical` headers are currently hand-set in nginx per file — that doesn't scale to a folder tree.

### Information architecture, changelog, connector single-sourcing

**[LOW] IA is sound.** The `getting-started / assistants / connect / changelog` split is clear and creator-appropriate. Two nits: (1) `recordings-episodes-clips.md` is described as "Recording → Moment → Clip" but the product's current canonical unit is the **Episode** (the MCP server is episode-first) — align the doc to the current nouns or it teaches a retired model. (2) `.navigation.yml` per folder is a Docus/legacy convention; in @nuxt/content **v3** ordering is conventionally done via numeric filename prefixes (`1.getting-started/`) or frontmatter — confirm the v3 mechanism rather than the v2 `.navigation.yml` the spec cites.

**[MEDIUM] Changelog as a generated feed + RSS is fine, but RSS needs a build-time generator on a static site.** RSS/Atom can't be a runtime route here (no server). It must be a prerendered `/changelog.xml` via a `prerender:routes` + a route that serializes the changelog collection, or a build hook writing the file. The spec says "RSS generated from the collection" without naming the static mechanism — make it explicit (it's the same prerender-hook tool as the `.md` twins). Also decide the URL (`/docs/changelog` vs `/changelog`) **before** P3, because it determines canonical/sitemap/redirect wiring; don't leave it "minor, decide later."

**[MEDIUM] Connector-guide single-sourcing: pick "hand-authored + reviewed now" for v1, explicitly.** The spec lists this twice (§4 and §8 duplicate it — dedupe) and leaves it open. Decision recommendation: hand-author now (the connector facts — YouTube Brand-Account trap, scopes, "who must authorize" — are narrative and screenshot-driven, not a clean enum), but add a **CI/review checklist item** tying each connector doc to the app's connector manifest so scope changes trigger a doc review. Generating from the manifest is a P3+ nicety; designing for it now over-engineers v1. The real risk is the IG page documenting the *capped/manual* reality going stale if the connector status flips — note an owner.

### Risks / gaps / unstated assumptions

- **[HIGH] Redirects for the old `/docs` and `/mcp` URLs are under-specified and live in nginx.** §3 says "keep the old URLs (or 301)." But these are real indexed pages with canonicals and `.md` twins. If `/docs` becomes the new docs **home** (overview), the *old* `/docs` content (the Recording→Moment→Clip explainer) moves to `getting-started/...` — so the old `/docs` URL changes meaning, not just location. Decide per-URL: does `/docs` keep serving the explainer, or 301 to `/docs/getting-started/...`? Same for `/mcp` → `/docs/assistants/overview`. These 301s must be added to `nginx.conf` and the old `public/docs.md` / `public/mcp.md` reconciled. Unmanaged, this breaks the existing `rel=canonical`/`rel=alternate` graph and the sitemap.
- **[MEDIUM] No OG-image story for docs pages.** The site sets only a static global `twitter:card: summary` (no per-page OG image; no image generator). Mintlify/Stripe/Linear all have per-page social cards. If the docs are meant to be shared, decide: static fallback OG image (cheap, fine for v1) vs. generated per-page cards (needs a build-time image step — heavier). Spec is silent.
- **[MEDIUM] Content authoring/review workflow and CI are unaddressed.** This is a **public repo** (per §6). Who reviews docs PRs? Is there a CI gate that runs `nuxt generate` and asserts no broken internal links / orphaned content files / page-count == file-count / valid frontmatter schema? Mintlify-grade docs need a lint+linkcheck CI step. The repo's only `qa:smoke` is Playwright; add a docs build+linkcheck job.
- **[LOW] Search at scale / versioning correctly deferred** — but note the WASM-dump cost grows with corpus size, so revisit if docs balloon. No versioning in v1 is fine for a young product.
- **[LOW] `bun.lock` / lockfile churn.** Adding `@nuxt/content` (and likely `better-sqlite3`/WASM deps, `nuxt-llms`/`nuxt-seo` if adopted) pulls a non-trivial dep subtree into a currently tiny `package.json` (3 deps). The `overrides: { devalue }` pin suggests prior resolution pain — verify @nuxt/content v3's transitive `devalue`/`db0`/`unstorage` versions don't collide. Run the install in P0 and commit the lockfile deliberately.
- **[LOW] `compatibilityDate: '2025-07-15'`** predates some Nitro prerender-hook behavior; bump and re-test when adding content, since the `.md`-twin hook depends on current Nitro public-asset hooks.

---

## What I would change BEFORE any code is written

1. **Rewrite §2/§6 to state the truth about the agent surface.** The `.md`/`llms.txt` surface is hand-written static files + a bespoke nginx config, not an automatic pattern. The `.md` twin is a **build-time prerender artifact** (one static `*.md` per page) plus nginx routing changes — scope it as real work, and decide whether to adopt `nuxt-llms` / Nuxt-SEO's markdown-conversion module or own the prerender hook. (BLOCKER)
2. **Make `llms.txt`, `llms-full.txt`, `sitemap.xml`, RSS, and the `.md` twins all GENERATED from the content collection** at build, never hand-maintained. One prerender mechanism covers all of them. (HIGH)
3. **Re-spec the `mcp.vue` migration:** the live iframe embed becomes an MDC component inside the assistants page, not flattened prose; or it stays a bespoke page that links into docs. Don't regress the live demo. Cut or regenerate the stale tools table (the surface is episode-first now). (HIGH)
4. **Re-estimate the hand-roll.** Replace "a layout + a couple of components" with an explicit component inventory (sidebar+drawer, scroll-spy TOC, prev/next, prose stylesheet, Shiki code blocks with copy, Callouts/Steps/Tabs/Cards, ⌘K search overlay, a11y) and phase it so P0 ships a *credible* layout, not a thin one. (HIGH)
5. **Decide the redirect map per-URL** for `/docs` and `/mcp` (does old `/docs` keep its meaning or 301?), and write the nginx changes + sitemap/canonical reconciliation into the plan. (HIGH)
6. **Fix font loading** (Manrope + IBM Plex Mono are declared but never loaded) before claiming a typography bar. (LOW but trivially blocking quality)
7. **Clean the spec's contradictions:** delete the "Nuxt Content v3 + **Docus** version compatibility" open question (Docus is rejected); dedupe the connector-single-sourcing bullet (appears twice); replace `.navigation.yml` with the v3 ordering convention; align the IA on **Episode** as the current unit. (NIT)
8. **Add a docs CI gate** (`nuxt generate` + internal link check + frontmatter schema + page-count assertion) and name a content-review owner, since this is a public repo. (MEDIUM)

## Prioritized punch list

1. **(BLOCKER)** Correct the agent-surface premise; design the `.md`-twin as a generated build artifact + nginx routing change.
2. **(HIGH)** Generate `llms.txt`/`llms-full.txt`/sitemap/RSS/`.md` twins from the content collection — no hand maintenance.
3. **(HIGH)** Re-spec `mcp.vue`: keep the live embed as an MDC component; cut/regenerate the stale tools table.
4. **(HIGH)** Honest component inventory + phasing for the hand-rolled layout to actually meet the Mintlify/Stripe/Linear bar.
5. **(HIGH)** Per-URL redirect decision for old `/docs` and `/mcp`; reconcile canonicals/sitemap; write nginx changes.
6. **(MEDIUM)** `nuxt generate` route enumeration for content + CI assertion page-count == file-count; broken-link check.
7. **(MEDIUM)** Decide WASM-dump tradeoff (prerender nav/TOC vs client-query) and the changelog URL up front.
8. **(MEDIUM)** OG-image story (static fallback for v1); content review owner; connector→manifest review checklist.
9. **(LOW)** Fix font loading; verify @nuxt/content v3 transitive deps vs the `devalue` pin; add Tailwind prose styling (no `@tailwindcss/typography` present).
10. **(NIT)** Remove Docus/`.navigation.yml` leftovers, dedupe bullets, align IA on Episode.

**Sources:** [Nuxt Content static hosting (WASM SQLite)](https://content.nuxt.com/docs/deploy/static) · [Nuxt prerendering / no server endpoints](https://nuxt.com/docs/4.x/getting-started/prerendering) · [Nuxt AI-Ready markdown conversion](https://nuxtseo.com/docs/ai-ready/guides/markdown) · [nuxt#31426 prerender content routes](https://github.com/nuxt/nuxt/issues/31426).
