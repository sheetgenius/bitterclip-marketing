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
- `sitemap.xml`;
- docs changelog RSS and blog RSS.

Do not hand-edit a generated artifact to repair drift. Edit the `content/`
source, collection data, or generation module and rebuild.

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
