# BitterClip Marketing

Public marketing site for [BitterClip](https://bitterclip.com/), a
speaker-aware clipping workbench for long recordings.

BitterClip turns podcasts, interviews, founder calls, demos, and recurring
shows into source-linked clips that AI assistants can find, humans can verify,
and teams can export ready to post.

## Bitter Context

[Bitter](https://bitter.sh/) is an agent-operable software environment. It gives
AI agents a persistent workspace where repositories, credentials, hosting,
email, tests, deploys, logs, checks, and work history are connected so software
work can continue without losing context.

The Bitter constellation is a set of public sites, products, applications, and
supporting repositories that share this operating model: agents work against
real source material, human operators review and steer the work, and deployed
systems keep their history and verification paths attached.

BitterClip is one product in that constellation. It applies the Bitter model to
recorded media: long recordings become structured source material, transcripts
become an agent-operable workspace, and clips stay connected to speakers,
timestamps, source context, export settings, and prior decisions.

This repository is the public web and SEO surface for BitterClip. It is not the
private product application or media-processing backend. It exists to describe
the BitterClip product clearly, link the public documentation, and give humans
and crawlers a stable semantic entry point into the BitterClip part of Bitter.

## Links

- Website: [bitterclip.com](https://bitterclip.com/)
- Product signup: [app.bitterclip.com/sign_up](https://app.bitterclip.com/sign_up)
- How it works: [bitterclip.com/docs](https://bitterclip.com/docs)
- MCP and AI assistant workflow: [bitterclip.com/mcp](https://bitterclip.com/mcp)
- BitterSH: [bitter.sh](https://bitter.sh/)

## Public Repository Posture

This repository is intentionally public. Treat the code, README, metadata,
sitemap, and public copy as indexable product assets.

Do not commit:

- provider keys, OAuth secrets, deploy tokens, registry credentials, or `.env`
  files
- private customer recordings, transcripts, renders, or provider payloads
- internal DNS, mailbox, billing, or incident runbooks
- generated output from `.nuxt`, `.output`, `dist`, test reports, or local
  agent/tooling directories

Deployment credentials must come from environment variables or the deployment
system, not from committed files.

## Development

```bash
bun install
bun run generate
bun run qa:smoke
```

The site is a static Nuxt app. Public routes that should remain crawlable are
listed in `public/sitemap.xml`.

## Content Guidelines

Keep the page concrete and product-faithful:

- describe BitterClip as a speaker-aware, source-linked clipping workspace
- make ChatGPT, Claude, MCP, verification, and export workflows easy to
  understand without protocol jargon
- prefer real workflow language over generic AI/video-editor hype
- keep claims aligned with the live product
