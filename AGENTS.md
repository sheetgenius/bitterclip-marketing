# AGENTS.md

## Scope

This repo owns the public marketing site for `bitterclip.com`.

The repo is intentionally public. Treat README copy, page copy, metadata,
robots, and sitemap content as product/SEO assets. Do not commit secrets,
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
