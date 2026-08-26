# AGENTS.md

## Scope

This public repository owns the marketing site for `bitterclip.com`. Product
application code, customer data, private operations, and media-processing
services live elsewhere.

## Read order

Before changing the repository, read:

1. `CURRENT_STATE.md` for the deployed/runtime truth and protected worktree notes.
2. `docs/README.md` for document authority and task routing.
3. The task-specific runbook linked from that map.
4. `README.md` and `CONTRIBUTING.md` when changing public repository context.

Commercial copy or conversion instrumentation also requires
`docs/runbooks/commercial-instrumentation.md`. Product behavior and private
commercial interpretation live in the adjacent private BitterClip repository;
the public site may emit neutral facts but must not become the experiment journal.

Do not treat an older spec, review, workshop prompt, or journal entry as current
authority merely because it is detailed. The status registry in `docs/README.md`
decides how each internal document may be used.

## Public repository boundary

Treat README copy, page copy, metadata, robots, sitemap content, and generated
AI-readable surfaces as public product assets. Do not commit secrets, private
media, private runbooks, provider payloads, customer data, rendered clips, or
generated build/evidence output.

BitterClip is a product name, not a company. The only legal entity is
SheetGenius, Inc. (`company.sheetgenius.com`). Copyright lines, corporate
attribution, legal pages, and any company-identifying copy name SheetGenius,
Inc.; never write "BitterClip Inc." or otherwise imply BitterClip is the
company. The site-wide attribution lives in the footer in
`app/layouts/default.vue`.

The README is the durable public description of BitterClip. It leads with the
product; Bitter is infrastructure context that stays below it, not the lead. Keep it factual and product-structural. Maintain
`CHANGELOG.md` as the public semantic change history; keep its categories aligned
with `.github/release.yml`.

The shared public-marketing repository standard lives in Factory. Do not copy a
generic cross-repo standard into this repository. Keep `CONTRIBUTING.md`,
`SECURITY.md`, `.github/release.yml`, and the pull-request template specific to
BitterClip.

Never commit provider keys, OAuth secrets, deploy tokens, registry credentials,
`.env` files, private recordings or transcripts, customer data, provider
payloads, internal DNS/mailbox/billing/incident runbooks, or output from
`.nuxt`, `.output`, `dist`, `tmp`, test reports, and local agent/tooling folders.

## Public content contract

Public creator documentation is authored in `content/`; public blog and compare
pages are authored in their corresponding `content/` collections. Build-time
generation in `modules/generated-surfaces.ts` emits docs Markdown twins,
`llms.txt`, `llms-full.txt`, sitemap entries, and feeds. Do not hand-edit those
generated outputs.

Vue-owned marketing routes such as the homepage and legal pages retain their
checked-in Markdown alternates under `public/`. Follow
`docs/runbooks/public-content.md` before changing routes, public claims, or
content collections.

When repository context changes, update `README.md` first, then propagate any
durable public claim to the authored public sources and `CHANGELOG.md` as
applicable.

## Homepage and ISO4

The actual homepage `/` is the acceptance surface. `/lab/iso4` is diagnostic
only. ISO3 and its routes are historical predecessors and must not be modified
as part of ISO4 work.

Production serves an immutable responsive ISO4 Artifact video generation;
development keeps the canonical Three.js scene editable. Before touching the
cinematic, read:

- `docs/runbooks/iso4-authoring.md`
- `docs/hero-iso4-brief.md`
- the latest relevant entries in `docs/hero-iso4-workshop-journal.md`

Before rendering or changing the production selection, also read
`docs/runbooks/iso4-release.md`. Run `bun run artifact:status` first. Ordinary
site deploys must reuse the accepted generation when cinematic renderer inputs
are unchanged; they must never bake the movie implicitly.

Prefer keeping homepage delivery changes inside `HeroIso4.vue`. Editing
`app/pages/index.vue` changes both the HTML homepage and its public semantic
surface; follow the homepage and public-content runbooks rather than casually
normalizing adjacent work.

## Worktree discipline

The worktree may contain active work from other people or agents. Inspect it
before acting. Preserve unrelated changes and use path-specific staging. Do not
reset, restore, stash, rename, absorb, or reformat files you do not own.

Keep generated evidence and release media under ignored `tmp/`. In particular,
large visual studies, contact sheets, frame sequences, and rendered movies do
not belong under tracked `docs/` or `public/` paths unless they are deliberately
selected public website assets.

Do not start a development server unless the human asks. If one is already
running, use it rather than starting another.

## Commands

- Install dependencies: `bun install`
- Check internal documentation: `bun run docs:audit`
- Check whether ISO4 renderer inputs differ from the accepted bake:
  `bun run artifact:status`
- Generate static output: `bun run generate`
- Run smoke tests: `bun run qa:smoke`

Run `git diff --check` before handoff. Use the narrower verification commands in
the relevant runbook when the change affects ISO4 delivery or public content.
