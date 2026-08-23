# Contributing

This repository owns the public BitterClip website and its public repository
context. Changes should keep the site accurate, crawlable, and safe to index.

## Before Editing

Read:

- `AGENTS.md` for maintainer rules.
- `CURRENT_STATE.md` for current deployed/runtime truth.
- `docs/README.md` for document authority and task routing.
- `README.md` for public product and repository context.

The shared public marketing repository standard is maintained outside this
product repo in Factory policy. This file only covers BitterClip-specific
contribution expectations.

## Change Checklist

For page changes:

- Follow `docs/runbooks/public-content.md`.
- Author docs, blog, and comparison content under `content/`; their Markdown
  twins, discovery entries, sitemap entries, and feeds are generated at build
  time. Do not patch generated output.
- For Vue-owned routes, update the page and its authored `public/*.md` twin
  together when the public claim changes.
- Update the source route inventory when adding or removing public routes.
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
bun run docs:audit
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
