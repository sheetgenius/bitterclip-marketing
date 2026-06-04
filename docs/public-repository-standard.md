# Public Repository Standard

BitterClip marketing is maintained as a reference shape for public Bitter
constellation websites. A public marketing repository should make the product
understandable from source alone: what the product is, how it fits Bitter, what
the public site owns, how it deploys, and which machine-readable surfaces are
authoritative.

This document is a maintainer guide. It is not public page copy.

## What A Public Bitter Repo Should Do

Every public Bitter marketing repo should answer six questions without requiring
private context:

1. What is this product or system?
2. How does it fit into Bitter?
3. Which public URLs are canonical?
4. What does this repository own, and what lives elsewhere?
5. How is the public site built, tested, and deployed?
6. Which text surfaces should humans, search engines, and AI systems index?

The answer should be factual and structural. Avoid language that describes the
repo as an SEO project. The repo is public because the product has a public
surface, and the source should preserve useful context about that surface.

## Reference File Set

Use this repository as the baseline file set for small public Bitter sites:

| File | Role |
| --- | --- |
| `README.md` | Canonical repository context: product, Bitter connection, repo boundary, links, deployment, development, public context. |
| `CHANGELOG.md` | Curated semantic history, written for readers outside the commit log. |
| `AGENTS.md` | Maintainer and agent rules for safe public-site changes. |
| `CONTRIBUTING.md` | Human and agent checklist for page, metadata, deployment, and public-boundary edits. |
| `SECURITY.md` | Public security and sensitive-information reporting guidance. |
| `.github/release.yml` | GitHub release-note categories aligned with semantic changelog categories. |
| `.github/pull_request_template.md` | Review checklist for public-context, Markdown, sitemap, tests, and deployment effects. |
| `public/sitemap.xml` | Crawlable canonical public routes and machine-readable alternates. |
| `public/robots.txt` | Crawler access and sitemap pointer. |
| `public/llms.txt` | Curated AI-readable index of important pages and repo context. |
| `public/llms-full.txt` | Compact one-fetch public context bundle. |
| `public/*.md` | Markdown twins for public HTML routes. |
| `qa/smoke.spec.ts` | Browser and route checks for the public contract. |

Do not copy product-specific claims between repos. Copy the structure and
replace the product model, canonical links, deployment service, and boundaries.

## README Bar

The README should be useful to a human buyer, a developer, a maintainer, a
search crawler, and an AI system reading the repository later.

Minimum sections:

- Product name and one concrete sentence describing what it is.
- Place in Bitter.
- Product model or operating loop.
- Repository role and explicit boundary.
- Canonical public links.
- Deployment path and service name.
- Development and verification commands.
- Public context and indexing conventions.

Keep the product description stable. Avoid campaign language, transient slogans,
private implementation details, and internal operational notes.

## Public Page Bar

Every public HTML route should have:

- a canonical URL in the page head
- title and description metadata
- Open Graph and Twitter metadata where useful
- a Markdown alternate link in the page head
- a Markdown twin in `public/*.md`
- a sitemap entry
- coverage in smoke tests

Markdown twins should be clean, factual versions of the page. They do not need
to reproduce layout, but they should preserve the page's claims, links, and
product model. In production, Markdown twins should send canonical HTTP `Link`
headers pointing back to the HTML route.

## AI-Readable Surface Bar

Use `llms.txt` as a concise index, not as a dumping ground. It should link:

- canonical public pages
- Markdown alternates
- the public repository
- the changelog
- the relevant Bitter constellation context

Use `llms-full.txt` as a compact context bundle. It should contain enough
product and repository context for one-fetch ingestion, but it should not expose
private implementation details, customer data, provider payloads, secrets, or
internal runbooks.

When a page claim changes, update the matching Markdown twin, `llms.txt`,
`llms-full.txt`, sitemap, and smoke tests in the same change.

## Repository Metadata Bar

GitHub metadata should describe the product, not the repo mechanics.

Good description pattern:

```text
BitterClip is a speaker-aware media workspace for turning long recordings into source-linked clips.
```

Avoid descriptions like:

```text
Public SEO web surface for BitterClip.
```

Recommended topic shape:

- product or brand name
- broader Bitter category
- product category
- implementation framework
- integration surfaces, such as MCP, if product-relevant

## Deployment Bar

The public README should explain deployment without exposing secrets:

- deployment platform
- service name
- canonical domain
- branch or hook that deploys
- build command
- runtime image or static server
- health check route

Do not include registry credentials, deploy tokens, SSH host material, private
environment values, or incident runbooks.

## Public Hygiene Bar

Public repos should never include:

- `.env` files or provider keys
- deploy tokens or registry credentials
- private recordings, transcripts, rendered clips, or customer data
- provider payloads
- private DNS, mailbox, billing, or incident runbooks
- generated output unless intentionally checked in as public static assets

If a private detail is needed to operate the live product, document the boundary
and point to the owning private system in general terms instead of copying the
detail into the public repo.

## Change Checklist

Before merging a public-site change, verify:

- README still explains the product and Bitter connection accurately.
- Product copy changed in HTML and Markdown together.
- `llms.txt`, `llms-full.txt`, and `sitemap.xml` are still current.
- Smoke tests cover the visible route or public file contract.
- Changelog records meaningful public-context changes.
- No private data, credentials, generated build output, or provider payloads are
  included.
- Deployment path is documented and still matches the current service.
