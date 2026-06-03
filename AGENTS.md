# AGENTS.md

## Scope

This repo owns the public marketing site for `bitterclip.com`.

The repo is intentionally public. Treat README copy, page copy, metadata,
robots, and sitemap content as product/SEO assets. Do not commit secrets,
private media, private runbooks, provider payloads, or generated build output.

The README should keep a clear semantic description of Bitter and explain how
BitterClip fits into the Bitter constellation. Keep that material factual and
product-structural rather than promotional.

## Commands

- Install dependencies: `bun install`
- Generate static output: `bun run generate`
- Run smoke tests: `bun run qa:smoke`

Do not start a dev server unless the human asks for it.
