## Summary

-

## Public Context Checklist

- [ ] README, public page copy, and repository metadata still describe BitterClip accurately.
- [ ] Product claims are factual and aligned with the live product.
- [ ] Public/private boundaries remain clear.

## Web And Discovery Checklist

- [ ] Public content changes follow `docs/runbooks/public-content.md`.
- [ ] Vue-owned page changes have matching authored `public/*.md` twins.
- [ ] Generated Markdown, `llms`, sitemap, and feed outputs were rebuilt from
      their `content/` or module sources rather than hand-edited.
- [ ] Canonical and alternate links remain correct.
- [ ] Smoke tests cover changed public routes or files.

## Verification

- [ ] `bun run docs:audit`
- [ ] `bun run generate`
- [ ] `bun run qa:smoke`

## Deployment Notes

-
