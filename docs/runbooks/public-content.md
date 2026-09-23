# Public content runbook

Status: Current authority
Last verified: 2026-08-25

## Source of truth

Creator documentation, blog posts, comparison pages, and shared public data are
authored under `content/`:

- docs pages: `content/**/*.md`, excluding the blog and compare collections;
- blog: `content/blog/*.md`;
- comparisons: `content/compare/*.md`;
- reusable volatile facts: `content/_data/*.yml`;
- reusable prose/UI snippets: `app/components/content/`.

Follow `docs/protocol/authoring-conventions.md` and validate current product
facts against the product repository or live product when they may have drifted.
Submission packets and older protocol briefs are snapshots, not current fact
sources.

## Company identity

BitterClip is a product name. The company is SheetGenius, Inc.
(`company.sheetgenius.com`), and it is the only legal entity: copyright notices,
corporate attribution, and the provider named in legal pages are SheetGenius,
Inc. Do not write "BitterClip Inc." or attribute ownership to BitterClip itself.
The footer attribution is in `app/layouts/default.vue` and reaches every page.

## Generated surfaces

`modules/generated-surfaces.ts` derives these during `bun run generate`:

- per-page docs Markdown twins;
- docs/blog/compare discovery entries in `llms.txt` and `llms-full.txt`;
- a docs-only `/help-corpus.json` projection for product agent help. Each entry
  carries authored-file and rendered-body SHA-256 values, canonical URL,
  Markdown URL, and text from the built HTML article, including Vue snippets;
  the corpus digest covers the ordered page identities and digests;
- `sitemap.xml`;
- docs changelog RSS and blog RSS.

Do not hand-edit a generated artifact to repair drift. Edit the `content/`
source, collection data, or generation module and rebuild.

The product repository fetches the deployed `help-corpus.json` for creator help
and keeps its private agent operating pages separately. For a new public fact
needed by existing product behavior, publish this site first. For the initial
single-`help` cutover, deploy Rails first because the static catalog build
requires its new descriptor; help will explicitly report public guidance
unavailable until the site deploys next. It does not use
a bundled public copy. It revalidates on every call and refuses an unverified
response. Generated Markdown twins retain authored MDC directives; the help
corpus reads the prerendered HTML article and includes each snippet's actual
visible words. Review rendered pages for claims inside snippets.

Exact MCP tool names, titles, descriptions, and schemas live in the Rails
operation catalog. `bun run generate` fetches the deployed
`https://app.bitterclip.com/api/v1/operation_catalog.json` once, validates its
model-visible profile and product release, then builds the static
`/docs/assistants/tool-reference` HTML, Markdown twin, JSON snapshot, and
discovery entries from that response. The ignored `tmp/` snapshot is a build
input, never an authored or committed copy. A failed fetch or invalid response
fails the build; there is no fallback to an older snapshot. The page prints
its source release, capture time, and catalog SHA-256. Creator explanations in
`content/` remain authored here and should not restate descriptor details.
The build command passes a one-build token with the snapshot to Nuxt; invoking
Nuxt directly cannot reuse an old temporary file.
The build also requires the new `help` tool and refuses the retired help-tool
names, so this cutover cannot accidentally publish the old tool list.

Release order for a tool change: deploy Rails first, then rebuild and deploy
this static site. Independent deployments cannot update atomically; until the
site rebuilds, its printed product release identifies the older catalog it
reflects. The live Rails catalog and MCP `tools/list` update with Rails.

Vue-owned routes outside the content collections—currently the homepage and
legal/marketing pages—may have authored alternates under `public/`. When one of
those pages changes, update its alternate, metadata, route inventory, and smoke
contract together as applicable.

## Adding or removing a public route

1. Add/remove the authored Vue or `content/` source.
2. Update the collection schema or marketing-route inventory if required.
3. Add/remove the Markdown alternate mechanism for that route class.
4. Update navigation and canonical/alternate metadata.
5. Update smoke assertions.
6. Run the generated build and inspect the emitted HTML, Markdown, discovery,
   sitemap, and HTTP content-type/canonical-link behavior.

## Verification

```bash
bun run docs:audit
git diff --check
bun run generate
bun run qa:smoke
```

Never commit `.output`, `.nuxt`, generated reports, private product facts, or
provider credentials. Public submission context may be committed only when it
contains no reviewer credentials or secret dashboard data.
