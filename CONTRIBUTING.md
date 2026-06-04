# Contributing

This repository owns the public BitterClip website and its public repository
context. Changes should keep the site accurate, crawlable, and safe to index.

## Before Editing

Read:

- `README.md` for product and repository context.
- `AGENTS.md` for maintainer rules.
- `docs/public-repository-standard.md` for the public Bitter repo pattern.

## Change Checklist

For page changes:

- Update the Vue page and the matching `public/*.md` Markdown twin together.
- Update `public/llms.txt` and `public/llms-full.txt` if the public claim,
  product model, route list, pricing, or integration surface changed.
- Update `public/sitemap.xml` when adding or removing public routes.
- Update `qa/smoke.spec.ts` when the public route contract changes.

For repository-context changes:

- Keep `README.md` factual and product-structural.
- Update `CHANGELOG.md` for meaningful public-context, deployment, metadata, or
  public-hygiene changes.
- Keep GitHub-facing descriptions focused on BitterClip, not on SEO mechanics.

For deployment changes:

- Keep `README.md`, `Dockerfile`, `nginx.conf`, and `config/deploy.yml`
  consistent.
- Do not commit deploy credentials, registry credentials, SSH material, tokens,
  or private environment values.

## Verification

Run:

```bash
bun install
bun run generate
bun run qa:smoke
```

If a command cannot run locally, document the blocker in the pull request or
handoff.

## Public Boundary

Do not commit private media, transcripts, rendered customer clips, provider
payloads, customer data, internal runbooks, `.env` files, keys, tokens, or
generated build output.

This repository is public by design. Assume README text, Markdown files,
metadata, changelog entries, and public issue or pull request text may be read
by humans, search engines, and AI systems.
