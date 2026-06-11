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

### Website

- Added a first-class light preview path for the hero phone:
  `?heroTheme=light` (or `?theme=light`) now themes the phone chrome, loading
  skeleton, conversation treatment, and embedded recording surface through the
  same embed `theme` parameter while production remains dark by default.
- The hero phone now runs the FULL composition surface: tapping the widget's
  "Open in editor" opens the real composition editor in-frame — live video
  playback, scrubbing, the full word-level transcript (lazy-loaded, gzipped),
  drag-to-select, clip creation, and an export that reveals a pre-rendered
  demo MP4 (`?clip=` contract). Powered by the app-side embed-host upgrade
  (bitterclip `827d6cc6`): display-mode grants, a public allowlisted score
  endpoint, and demo-ID write stubs. One component, same constraints, across
  marketing, ChatGPT, Claude, and mobile. The phone frame widened to
  iPhone-Pro-Max proportions (368px, 392px at desktop) to give the surface
  room.
- Conversion-focused rework of the landing page (with an external CRO critique
  pass via Codex): the Clip plan now carries the accent panel, "Recommended"
  chip, and the only filled CTA (Pro demoted to a plain panel — the $99 price
  anchors on its own); plan features reworded for cold visitors ("clip
  exports", "Upload files up to 4 GB", "Add 5 more hours for $5, anytime");
  risk reversal moved to the point of decision ("30-day refund, annual
  included · cancel anytime" under each paid CTA, "Resets every month — not a
  trial" under Free); on mobile the recommended plan stacks first. Added a
  six-question FAQ section before pricing (after-signup flow, ChatGPT/Claude,
  human approval, upload limits, editor learning curve, cancellation custody)
  emitted as FAQPage JSON-LD; a mid-page signup CTA after the live editor
  demo; a "Pricing" nav link (section anchor renamed `#join` → `#pricing`);
  nav CTA reworded "Start with one" → "Start free". De-jargoned copy ("index
  once" → "upload once"; "it suggests" → "ChatGPT suggests"); hero qualifier
  now leads with "Free to start — 60 minutes of footage a month". Markdown
  twins and `llms-full.txt` updated to match. Testimonial quotes signed off
  by Andrew and Rohan on 2026-06-10.
- Removed Andrew Williams' tentative closing quote ("When they told me $99 a month, I said I’d pay $900 for this") from the footer section.
- Added Andrew Williams' coaching headshot to the testimonial beneath the hero and his centerpiece speaker chip, and added the Strength & Positions business logo to the testimonial's business link.
- Added Rohan Karunakaran's optimized profile picture and testimonial quote to the second testimonial slot below the hero, linking to Frontier Studio.
- Resized the testimonial avatars to a prominent 192px x 192px (w-48 h-48) for a high-spotlight design, and made the layouts responsive (centered stack on mobile, horizontal row on desktop).
- Redesigned the testimonial band: attribution (name, role, business link) sits centered beneath each 160px portrait (soft coral glow instead of the hard ring); quotes set in muted zinc with the key phrase in white so they skim themselves, with a hanging opening quotation mark, balanced line wrapping.
- Made the handoff fan-out's clip card playable: it projects the new BitterClip clip-embed primitive (`app.bitterclip.com/embed/clip/:id`, a poster-first iframe-able player — publishing embeds is a Pro-plan feature) serving the real coaching clip, deferred-loaded over the static poster so first paint is unchanged. One click plays inline.

- Consolidated the below-hero narrative from three numbered beats to two: the
  "it preps itself" and "right in ChatGPT & Claude" sections merged into one
  centerpiece section — copy on the left, and on the right the live transcript
  editor (the real embedded component) with two small speaker bubbles (avatar,
  name, share of conversation) floating above it. The separate static
  transcript panel and standalone editor block are gone, and the handoff
  renumbers from 03 to 02. No product claims changed; the same claims are
  stated once instead of twice.
- Featured a customer coaching-session clip across the page (Andrew Williams
  of Strength & Positions coaching his client Adrian): a two-slot testimonial
  band beneath the hero leads with Andrew's quote (second slot reserved), the
  centerpiece speaker bubbles read Andrew/Adrian with initial avatars, the
  handoff fan-out's source is the clip's thumbnail card, and a pricing pull
  quote sits above the plan ladder. The clip and its 29-second-mark poster
  are hosted in `public/clips/`. Broadened the centerpiece's example inputs
  to include training sessions (HTML page and Markdown twin).
- Replaced the handoff fan-out's photographic clip poster with flat vector art
  matching the destination logos: an archetypal black media-clip glyph with a
  centered play button and scrub bar. The poster image asset remains in
  `public/clips/` but is no longer referenced by the page.
- Replaced the single $99/month launch-access card with the three-tier pricing
  ladder: Free ($0, 60 min footage/month, 10 watermarked 1080p exports, 4 GB
  uploads), Clip ($9/month or $90/year, 10 hrs footage, 150 exports, no
  watermark, $5 per +5 hr top-ups), and Pro ($99/month or $799/year, 40 hrs
  footage, 1,000 exports up to 4K, 20 GB uploads, priority processing,
  analysis workflows as they ship). Updated the index and MCP Markdown twins,
  `llms-full.txt`, structured-data offers (now an AggregateOffer, $0–$99), and
  smoke tests to match. Every plan: 30-day refund, cancel anytime, files stay
  downloadable.
- Added a YouTube API Services disclosure section to the privacy policy and
  terms of service (HTML pages and Markdown twins), covering the YouTube Terms
  of Service and Google Privacy Policy references, what YouTube connection data
  BitterClip stores, and how to revoke access via Google security settings.
  Required for Google OAuth app verification of the YouTube publishing
  integration. Effective dates bumped to June 9, 2026.
- Re-established the logo amber/orange as BitterClip's primary brand and CTA
  color instead of mixing violet, amber, and pink action accents.
- Added `https://bitterclip.com/privacy` and `https://bitterclip.com/privacy.md`
  so provider app registration and public users have a discoverable privacy
  policy for the website, app, connector, and publishing integrations.
- Added `https://bitterclip.com/terms` and `https://bitterclip.com/terms.md`
  so provider app registration and public users have discoverable terms for the
  website, app, connector, billing, and publishing integrations.

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
- Added `CONTRIBUTING.md`, `SECURITY.md`, and a GitHub pull request template so
  public-site changes have first-class guidance for context, verification,
  deployment notes, and sensitive-information boundaries.
- Moved the generic cross-repo public marketing standard out of this product
  repository and into Factory policy, leaving BitterClip as a product-specific
  example rather than the owner of constellation-wide standards.

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
