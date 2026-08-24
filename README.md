# BitterClip

[BitterClip](https://bitterclip.com/) is a directable video workbench that
understands a whole recording, produces one coherent cut, and keeps the result
source-linked and editable. Its built-in agent is the shortest path into the
workbench; Claude, ChatGPT, and other MCP clients can operate the same substrate
when a customer prefers an external cockpit.

It is built for podcasts, interviews, founder calls, demos, livestreams, expert
conversations, coaching sessions, and recurring shows, where the recording is
already the valuable event and the remaining work is production. BitterClip keeps
the recording, transcript, speaker identity, editorial structure, render, export,
publishing state, and source history connected.

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
Every editorial decision remains linked to who said what, where it happened, what
came before and after, how it was rendered and exported, and what has already
been produced from the same session.

## Product Model

BitterClip is not a generic AI shorts generator. It is a media workbench built
around source-linked verification, where the primary result is the full-length
episode and short cuts are derivatives of that same edit.

The core object chain is:

```text
Recording -> Transcript -> Speakers -> Episode -> Program -> Clips
          -> Renders -> Exports -> Publishing
```

An Episode is the session workspace around one or more uploaded Recordings and
its primary full-length Program. A Program holds committed editable structure. A
Clip is an editable derivative of an Episode. A Render is a materialization
attempt; an Export is one completed exact rendered version.

The main workflow is:

1. Upload a session, including several synchronized angles when they exist.
2. Build a time-aligned transcript.
3. Identify and confirm speakers.
4. Work the Episode into a full-length Program, editing through the transcript
   and directing an AI agent that has the whole session in view.
5. Open any decision against the real media and surrounding transcript.
6. Verify the speaker, context, and boundaries.
7. Derive Clips from the same Program and create Renders and Exports.
8. Use Publishing connections once a person confirms the exact Export,
   destination, and account.
9. Preserve source links and project history for future recordings.

This matters because useful editorial choices are rarely isolated quotes. They
depend on speaker identity, setup, response, payoff, and the surrounding context
that keeps the cut honest.

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
- public AI-assistant and MCP guidance under `/docs/assistants`
- the generated crawlable sitemap at `/sitemap.xml`
- the static build and deployment wrapper for `bitterclip.com`

## Links

- BitterClip website: [bitterclip.com](https://bitterclip.com/)
- BitterClip app signup:
  [app.bitterclip.com/sign_up](https://app.bitterclip.com/sign_up)
- How BitterClip works: [bitterclip.com/docs](https://bitterclip.com/docs)
- BitterClip blog: [bitterclip.com/blog](https://bitterclip.com/blog)
- Blog RSS: [bitterclip.com/blog/rss.xml](https://bitterclip.com/blog/rss.xml)
- MCP and AI assistant workflow:
  [bitterclip.com/docs/assistants/overview](https://bitterclip.com/docs/assistants/overview)
  (`/mcp` remains a compatibility redirect)
- Privacy policy: [bitterclip.com/privacy](https://bitterclip.com/privacy)
- Terms of service: [bitterclip.com/terms](https://bitterclip.com/terms)
- Markdown page mirrors:
  [index.md](https://bitterclip.com/index.md),
  [docs.md](https://bitterclip.com/docs.md),
  [blog.md](https://bitterclip.com/blog.md),
  [your-show-has-a-signature-now.md](https://bitterclip.com/blog/your-show-has-a-signature-now.md),
  [assistants/overview.md](https://bitterclip.com/docs/assistants/overview.md),
  [privacy.md](https://bitterclip.com/privacy.md),
  [terms.md](https://bitterclip.com/terms.md),
  [data-deletion.md](https://bitterclip.com/data-deletion.md)
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
bun run docs:audit
bun run artifact:status
bun run generate
bun run qa:smoke
```

Useful files:

- `CURRENT_STATE.md` - concise deployed/runtime truth and protected local work
- `docs/README.md` - internal documentation map, authority registry, and task routing
- `docs/runbooks/` - homepage, public-content, and ISO4 operating procedures
- `app/pages/index.vue` - home page
- `app/pages/docs/[...slug].vue` - documentation page renderer
- `app/pages/blog/index.vue` - blog index page
- `app/pages/blog/[slug].vue` - blog post page
- `content/blog/` - blog post Markdown
- `app/pages/privacy.vue` - privacy policy page
- `app/pages/terms.vue` - terms of service page
- `content/` - authored creator docs, blog, comparison pages, and shared public data
- `modules/generated-surfaces.ts` - build-time generator for docs Markdown twins,
  discovery files, sitemap entries, and feeds
- `public/index.md`, `public/compare.md`, `public/privacy.md`,
  `public/terms.md`, and `public/data-deletion.md` - authored Markdown twins for
  Vue-owned public routes
- `public/images/blog/` - public blog images and social cards
- `nuxt.config.ts` - site metadata and Nuxt configuration
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

Every public HTML page should have a corresponding Markdown alternate,
advertised with a `rel="alternate"` Markdown link in the page head and listed in
the generated sitemap. Content-collection twins and discovery surfaces are
generated during `bun run generate`; Vue-owned route twins remain authored in
`public/`.

Markdown alternates should return canonical HTTP `Link` headers pointing back to
their HTML pages in production. The bundled `llms-full.txt` file should stay
compact, factual, and aligned with the current public page copy.

For contributors, [`CURRENT_STATE.md`](CURRENT_STATE.md) is the quickest view of
what is deployed and [`docs/README.md`](docs/README.md) routes each kind of work
to its current authority. Older specs and workshop journals remain available as
history but do not silently outrank those entrypoints.
