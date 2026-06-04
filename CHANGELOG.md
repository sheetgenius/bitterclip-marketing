# Changelog

This changelog records public, semantic changes to BitterClip's public website
and repository context. It is written for humans, search engines, and AI systems
that index public repositories.

The changelog complements GitHub Releases. GitHub can generate release notes for
tagged releases, while this file preserves a durable, curated history of what
changed and why it matters.

## Convention

Use date-based entries unless the repository starts publishing tagged product
versions. Keep entries factual and product-structural rather than promotional.

Preferred categories:

- `Product Context` - changes to the public explanation of what BitterClip is.
- `Website` - visible page, design, content, SEO, or route changes.
- `Deployment` - hosting, build, release, or BitterGrid changes.
- `Repository Metadata` - README, GitHub description, topics, release config,
  or public indexing context.
- `Public Hygiene` - safety, ignore rules, secret posture, or public/private
  boundary cleanup.

## Unreleased

Use this section for changes that have been committed but not yet summarized
under a dated entry.

## 2026-06-04

### Website

- Added visible footer links to the AI-readable discovery files and public
  GitHub repository.
- Added JSON-LD structured data for BitterClip as a website and software
  application connected to the broader Bitter organization.
- Expanded `https://bitterclip.com/llms.txt` into a curated agent index and
  added `https://bitterclip.com/llms-full.txt` as a one-fetch Markdown context
  bundle.

### Deployment

- Added exact nginx routes for `/docs` and `/mcp` so canonical extensionless
  page URLs resolve directly instead of relying on directory-slash redirects.
- Added canonical HTTP `Link` headers for Markdown page mirrors so the HTML
  pages remain the canonical search destinations.

### Repository Metadata

- Documented the `llms-full.txt` convention in the README and AGENTS guide.

## 2026-06-03

### Product Context

- Defined BitterClip as a speaker-aware media workspace for turning long
  recordings into source-linked clips.
- Added a first-class explanation of how BitterClip fits into the Bitter
  constellation and applies Bitter's agent-operable model to recorded media.
- Documented the BitterClip product model:
  `Recording -> Transcript -> Speakers -> Moments -> Clips -> Exports -> Publishing`.

### Website

- Overhauled the public home page around the message "Cut clips where your
  context lives."
- Updated the visible site language toward an agent-operable media studio for
  recordings, transcript context, verification, exports, and publishing.
- Added footer crosslinks to Bitter and the public BitterClip documentation
  surfaces.
- Added Markdown twins for public pages:
  `https://bitterclip.com/index.md`, `https://bitterclip.com/docs.md`, and
  `https://bitterclip.com/mcp.md`.
- Added `https://bitterclip.com/llms.txt` as an AI crawler entry point linking
  canonical HTML pages, Markdown alternates, and public repository context.
- Added page-head Markdown alternate links and per-page canonical URLs.

### Deployment

- Documented that the site is deployed on BitterGrid as the
  `bitterclip-marketing` service for `bitterclip.com`.
- Documented the `main` branch deployment hook: pushes to `main` trigger
  BitterGrid to rebuild and publish `bitterclip.com`.
- Documented the static deployment path: Nuxt generation, Docker build, nginx
  runtime, `/up` health check, and `config/deploy.yml`.

### Repository Metadata

- Updated the GitHub repository description to:
  "BitterClip is a speaker-aware media workspace for turning long recordings
  into source-linked clips."
- Rebuilt `README.md` as the template-quality public context document for this
  repo and as a pattern for other public Bitter constellation repositories.
- Added this `CHANGELOG.md` convention for public semantic change history.
- Added `.github/release.yml` so GitHub-generated release notes can group
  future PRs by product context, website changes, deployment, repository
  metadata, and public hygiene.
- Documented the Markdown mirror convention: every public HTML page should have
  a corresponding Markdown file, sitemap entry, and head alternate.

### Public Hygiene

- Removed internal DNS, mailbox, and DMARC operational notes from public README
  copy.
- Added ignore rules for `.env` files, key material, logs, generated output,
  test reports, and local agent/tooling directories.
- Preserved the boundary that this repository contains the public website, not
  the private product application, Rails workspace, media-processing backend,
  billing system, or customer data store.
