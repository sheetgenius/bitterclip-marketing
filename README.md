# BitterClip

[BitterClip](https://bitterclip.com/) is a speaker-aware media workspace for
turning long recordings into source-linked clips. It is designed for AI agents
that can search transcript context and for human operators who need to verify
the final cut before publishing.

It is built for podcasts, interviews, founder calls, demos, livestreams, expert
conversations, and recurring shows where the strongest moments are buried inside
long-form media. BitterClip keeps the recording, transcript, speaker identity,
clip boundary, export, publishing state, and source history connected.

## Place In Bitter

[Bitter](https://bitter.sh/) is an agent-operable software environment. It gives
AI agents persistent workspaces where repositories, credentials, hosting, email,
tests, deploys, logs, checks, and work history are connected.

The Bitter constellation is the set of public sites, products, applications, and
supporting repositories that share that operating model:

- agents work against real source material
- humans review, steer, and approve the work
- deployed systems retain enough context to keep improving
- outputs stay connected to their source history and verification path

BitterClip applies that model to recorded media. A long recording becomes
structured source material. A transcript becomes an agent-operable workspace.
A clip remains linked to who said what, where it happened, what came before and
after, how it was exported, and what has already been clipped.

## Product Model

BitterClip is not a generic AI shorts generator. It is a media workbench built
around source-linked verification.

The core object chain is:

```text
Recording -> Transcript -> Speakers -> Moments -> Clips -> Exports -> Publishing
```

The main workflow is:

1. Upload a recording.
2. Build a time-aligned transcript.
3. Identify and confirm speakers.
4. Use an AI agent to identify candidate Moments.
5. Open the Moment against the real media and surrounding transcript.
6. Verify the speaker, context, and boundaries.
7. Save the approved Moment as a Clip and create Exports.
8. Use Publishing connections for approved Clips when available.
9. Preserve source links and project history for future recordings.

This matters because useful clips are rarely just isolated quotes. They depend
on speaker identity, setup, response, payoff, and the surrounding context that
keeps the cut honest.

## Repository Role

This repository contains the public BitterClip website at
[bitterclip.com](https://bitterclip.com/). It is the public semantic entry point
for BitterClip inside the Bitter constellation.

It is not the private BitterClip product application, Rails workspace,
media-processing backend, billing system, or customer data store. Those systems
live outside this public marketing repository.

This repository owns:

- the public BitterClip website
- public product copy and metadata
- public documentation pages at `/docs` and the public blog at `/blog`
- public legal pages at `/privacy` and `/terms`
- Markdown alternates for every public page route
- AI-readable discovery files at `/llms.txt` and `/llms-full.txt`
- public blog RSS at `/blog/rss.xml`
- public, non-secret ChatGPT app submission context on the `/mcp` page
- crawlable routes in `public/sitemap.xml`
- the static build and deployment wrapper for `bitterclip.com`

## Links

- BitterClip website: [bitterclip.com](https://bitterclip.com/)
- BitterClip app signup:
  [app.bitterclip.com/sign_up](https://app.bitterclip.com/sign_up)
- How BitterClip works: [bitterclip.com/docs](https://bitterclip.com/docs)
- BitterClip blog: [bitterclip.com/blog](https://bitterclip.com/blog)
- Blog RSS: [bitterclip.com/blog/rss.xml](https://bitterclip.com/blog/rss.xml)
- MCP and AI assistant workflow:
  [bitterclip.com/mcp](https://bitterclip.com/mcp)
  (remote MCP, ChatGPT submission posture, and review boundaries)
- Privacy policy: [bitterclip.com/privacy](https://bitterclip.com/privacy)
- Terms of service: [bitterclip.com/terms](https://bitterclip.com/terms)
- Markdown page mirrors:
  [index.md](https://bitterclip.com/index.md),
  [docs.md](https://bitterclip.com/docs.md),
  [blog.md](https://bitterclip.com/blog.md),
  [your-show-has-a-signature-now.md](https://bitterclip.com/blog/your-show-has-a-signature-now.md),
  [mcp.md](https://bitterclip.com/mcp.md),
  [privacy.md](https://bitterclip.com/privacy.md),
  [terms.md](https://bitterclip.com/terms.md)
- AI crawler entry points:
  [llms.txt](https://bitterclip.com/llms.txt),
  [llms-full.txt](https://bitterclip.com/llms-full.txt)
- Public change history: [CHANGELOG.md](CHANGELOG.md)
- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security and public boundary: [SECURITY.md](SECURITY.md)
- Bitter: [bitter.sh](https://bitter.sh/)
- BitterGrid: [bittergrid.com](https://bittergrid.com/)

## Deployment

BitterClip's public website is deployed on
[BitterGrid](https://bittergrid.com/) as the `bitterclip-marketing` service for
`bitterclip.com`.

Commits pushed to `main` trigger the BitterGrid deployment hook. BitterGrid
rebuilds and publishes `bitterclip.com` from the `main` branch.

The deployment path is:

1. Nuxt generates a static site with `bun run generate`.
2. The `Dockerfile` builds that output and copies `.output/public` into an
   nginx image.
3. `nginx.conf` serves the static files and exposes `/up` as the health check.
4. `config/deploy.yml` defines the production service, host name, image, proxy,
   registry, and health check settings used by BitterGrid.

Deployment credentials, registry credentials, remote host values, and SSH keys
are supplied by BitterGrid or the deployment environment. They are not stored in
this repository.

## Development

```bash
bun install
bun run generate
bun run qa:smoke
```

Useful files:

- `app/pages/index.vue` - home page
- `app/pages/docs/[...slug].vue` - documentation page renderer
- `app/pages/blog/index.vue` - blog index page
- `app/pages/blog/[slug].vue` - blog post page
- `content/blog/` - blog post Markdown
- `app/pages/privacy.vue` - privacy policy page
- `app/pages/terms.vue` - terms of service page
- `public/index.md`, `public/privacy.md`, `public/terms.md`, and generated
  docs/blog `.md` files - Markdown twins for public pages
- `public/llms.txt` - AI crawler entry point that links canonical pages and
  Markdown alternates
- `public/llms-full.txt` - compact bundled Markdown context for one-fetch AI
  ingestion
- `public/images/blog/` - public blog images and social cards
- `nuxt.config.ts` - site metadata and Nuxt configuration
- `public/sitemap.xml` - crawlable public routes
- `CHANGELOG.md` - public semantic change history
- `CONTRIBUTING.md` - public change checklist for humans and agents
- `SECURITY.md` - sensitive-reporting and public-boundary policy
- `.github/pull_request_template.md` - GitHub review checklist for public
  context, Markdown mirrors, discovery files, tests, and deployment notes
- `.github/release.yml` - GitHub generated release note categories
- `Dockerfile` - static build and nginx runtime image
- `config/deploy.yml` - BitterGrid deployment service configuration

## Public Context

This repository is intentionally public. README text, page copy, metadata,
sitemap entries, and public links should preserve durable context for humans,
search engines, and AI systems that index public repositories.

Public text in this repository should stay factual, structural, and aligned
with the live BitterClip product.

Every public HTML page should have a corresponding Markdown alternate served
from `public/*.md`, advertised with a `rel="alternate"` Markdown link in the
page head, and listed in `public/sitemap.xml`.

Markdown alternates should return canonical HTTP `Link` headers pointing back to
their HTML pages in production. The bundled `llms-full.txt` file should stay
compact, factual, and aligned with the current public page copy.
