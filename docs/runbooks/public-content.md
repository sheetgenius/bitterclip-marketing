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

The 113 MCP tool names, titles, descriptions, schemas, errors, and examples are
authored in `contracts/mcp/tools/*.json`. The four plugin skills and three
extended public guides are authored here too. Rails pins one commit and owns
handlers, authorization, visibility, effects, and private help pages. Validate
the full tree with `bun run contract:validate`. For a contract change, commit
and push a retained branch, pin its exact SHA and digest in the product repo,
run product QA and verify the Rails release is serving, then merge this branch
to `main`. The `main` push triggers Grid's static site rebuild. Both Claude
Code and Codex can install directly from this repository; no plugin mirror is
required.

`bun run generate` fetches model, app, and Live Workspace descriptor profiles
from `https://app.bitterclip.com/api/v1/mcp_descriptors.json`. It refuses any
serving digest different from the local authored contract. The ignored `tmp/`
snapshot is a build input, never an authored copy. The build emits 113 HTML
tool pages with exact served descriptors, Markdown and JSON twins, a full
index, and discovery entries. It prints the serving product release, public
contract commit, contract digest, and capture time. Host security schemes and
resource URIs can vary by connector. If a site deploy trails Rails, the older
printed provenance remains visible; do not describe it as current.

Creator explanations in `content/` remain authored here and should not
restate descriptor details. The build command passes a one-build token with
the snapshot to Nuxt; invoking Nuxt directly cannot reuse an old temporary
file. A failed or invalid fetch fails generation.

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
