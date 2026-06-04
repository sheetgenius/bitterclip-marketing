# AGENTS.md

## Scope

This repo owns the public marketing site for `bitterclip.com`.

The repo is intentionally public. Treat README copy, page copy, metadata,
robots, and sitemap content as product and discoverability assets. Do not commit secrets,
private media, private runbooks, provider payloads, or generated build output.

The README should keep a clear semantic description of Bitter and explain how
BitterClip fits into the Bitter constellation. Keep that material factual and
product-structural rather than promotional.

Use the README as the pattern for other public Bitter constellation repos:

1. Name the product or system directly.
2. State what it is in one concrete sentence.
3. Explain how it fits into Bitter.
4. Define the repo boundary and what lives elsewhere.
5. Link the canonical public surfaces.
6. Document deployment without exposing secrets.
7. Preserve public, indexable context that will still make sense later.

The shared public marketing repository standard lives outside this repo in
Factory. Do not add generic cross-repo standards docs here. Keep
`CONTRIBUTING.md`, `SECURITY.md`, `.github/release.yml`, and
`.github/pull_request_template.md` specific to BitterClip.

Maintain `CHANGELOG.md` as the public semantic change history. Entries should
explain product-context, website, deployment, repository metadata, and public
hygiene changes in terms that will still make sense outside the commit log.
GitHub release-note grouping lives in `.github/release.yml`; keep its
categories aligned with the changelog categories.

Every public route should have a Markdown twin in `public/*.md`. When editing
`app/pages/index.vue`, `app/pages/docs.vue`, or `app/pages/mcp.vue`, update the
matching Markdown file, `public/llms.txt`, page-head Markdown alternate links,
`public/llms-full.txt`, `public/sitemap.xml`, and smoke tests together.
Markdown twins should be served with canonical HTTP `Link` headers pointing back
to the matching HTML route.

When changing repository context, update the README first, then propagate any
durable public claims into `public/llms.txt`, `public/llms-full.txt`,
`CHANGELOG.md`, and the public repository standard when applicable.

Do not commit provider keys, OAuth secrets, deploy tokens, registry credentials,
`.env` files, private recordings, transcripts, rendered clips, provider
payloads, customer data, internal DNS/mailbox/billing/incident runbooks, or
generated output from `.nuxt`, `.output`, `dist`, test reports, and local
agent/tooling directories.

## Commands

- Install dependencies: `bun install`
- Generate static output: `bun run generate`
- Run smoke tests: `bun run qa:smoke`

Do not start a dev server unless the human asks for it.
