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

### Product Context

- Corrected homepage speaker and clipper claims against shipped behavior.
  Voices are split; unnamed speakers stay Speaker 1, Speaker 2 until named in
  the project, and later recognition needs a saved voice and can fail. Search
  finds a neighborhood; it does not pick the cut. The first artifact an agent
  produces is a draft of one cut, revised in place, then opened or downloaded
  after render — not a ready MP4 and not a ranked pile.
- Reframed the homepage around the division of labor between the person and the
  product. The hero now reads "You record it. BitterClip handles the
  rest." The person shows up and has the real conversation; everything after
  that — the cutting, captions, music, opener and outro, camera changes, the
  vertical version, and the short cuts from the same edit — is BitterClip's
  work. The hero, the lede beneath it, the FAQ, the homepage structured data,
  the site title, and the social cards all carry that line, and the AI-readable
  twin at `public/index.md` was reconciled onto it from the previous "Record the
  conversation. Finish the show." framing.
- Stated the recording facts plainly, because "you record it" can be
  misread as "BitterClip cannot record". The page and the Markdown twin now say
  that every project has a browser recorder — camera and mic on a laptop or
  phone, or the screen in desktop Chrome, up to 1080p, uploading while you
  record so transcription starts when you stop — that it captures one signed-in
  person on one device with no remote guests, guest links, or separate
  per-person tracks, and that bringing footage recorded elsewhere remains the
  common path. A new FAQ answer carries the same facts.
- Named the session length the product is built for: roughly twenty minutes to
  two hours, covering podcasts, interviews, coaching sessions, founder calls,
  and workshops.
- Replaced the internal vocabulary that had leaked into the Markdown twin with
  the plain meaning behind it, so the public explanation reads the way the page
  does.
- Reframed the public explanation of BitterClip from clipping inside ChatGPT to
  finishing the recorded work. The homepage hero, section headings, FAQ, close,
  structured data, site title, and social cards now lead with the full-length
  episode as the primary result, with short cuts derived from that same edit
  rather than presented as the product. The homepage previously led with a claim
  it walked back twice in the same fold — the hero named ChatGPT, then the
  subhead and the call-to-action footnote each qualified the workspace
  eligibility.
- Demoted ChatGPT and Claude from the hero to peer cockpits over the same work.
  Connecting one is now described as a choice rather than an onboarding step,
  and the workspace-eligibility detail moved from the fold into the FAQ, where
  it no longer competes with the promise above it.
- Described the working relationship rather than the generation step: BitterClip
  watches the whole session, commits to an editorial choice it can explain and
  source, and revises that same cut when directed, keeping the previous version.
  The old "assistant suggests, you approve, you post" motif framed the agent as
  a suggestion engine and was replaced.
- Corrected the publishing answer. The FAQ and Markdown twin previously said a
  project could opt into automatic publishing; public copy now states that every
  send is bound to one exact export, destination, account, and a final human
  confirmation.
- Added an objection-handling answer for people who have tried AI clippers and
  concluded the category does not work, since that skepticism is the acquisition
  wedge rather than an education problem.
- Left the offer layer untouched. Plans, prices, allowances, plan parameters, and
  every pricing claim remain exactly as shipped; no part of the pending
  commercial plan appears in public copy.

### Website

- Replaced the park two-up in the first proof section with a 19-second cut
  from day one of the Mike and John show: Mike saying he is his own marketing
  asset. The heading is "A line you'd post." Andrew and Rohan's quotes stay
  as signed social proof beside it.
- Refined the homepage projector's physical output read: packet halos and
  cores now compact as they register so the exposure stream cannot resemble a
  strip of film protruding through the reel; the gate image is registered to
  the actual descending carrier rather than a forward monitor-like plane; and
  the motionless YouTube, LinkedIn, and Podcast/RSS contact prints now carry
  small centered vector destination marks. Projection ignition and terminal
  print settlement now share one clockwise YouTube, Transcript/RSS, LinkedIn
  circuit while preserving the accepted output positions and optical finish.
  Deterministic film coverage now advances through short real Episode 1 takes
  as the carrier accelerates instead of holding one thumbnail across most of
  the spool-up. The narrow LinkedIn contact print now develops its denser
  `PUBLISHED` outcome ahead of the supporting destination/detail copy so the
  result remains legible throughout the portrait-to-print transition without
  brightening the whole card.

- Dropped the fold's "Watch a cut" whisper. It sat alone in the lower-left
  of the stage and named a cut the machine is already showing. The Demo
  item in the site bar still goes to the live client session.
- Overhauled the homepage below the fold so a live client cut sits
  immediately after the machine. Fold dropped the "Agentic video editing"
  eyebrow; Precision Edits now reads "the good parts, finished."
  How it works is "First, the session is in view," with the editor framed
  as the place you check the tape. The Claude card drafts then revises a
  cut, with no fake tool chrome and no ready MP4. Clip's pricing CTA is
  "Start on Clip"; 150 exports sit last. The footer matches the fold
  instead of "into clips."
- Replaced the invented LinkedIn-projection caption with a sentence Mike
  actually said on day one of the Mike and John show: "I am my own marketing
  asset." The hero passage is recut to that moment at a calmer 0.70x cadence;
  the karaoke follows the source word clock with one active word, a bounded
  minimum dwell for adjacent hits, and a clean unhighlighted result hold.
- Rebuilt the homepage ISO4 transformation around 108 conserved information
  packets rendered as 648 source-coloured microfragments, then refined the
  physical film writer and projected outputs. The LinkedIn result now uses a
  supersampled product-style Active Word caption, while edge-safe diffuse
  landing halos, the film carrier, sprockets, development contact, and
  responsive mobile fan use cleaner, more continuous optical treatment. After
  one finite passage, all three outputs now settle into delineated charcoal
  contact prints, stop their media heads, and wind the shared film/reel drive
  down to a motionless cell instead of looping indefinitely.
- Set the homepage H1 to singular: Footage in / Episode out. One tape in,
  one finished program out — the same unit as "Bring one recording. Leave
  with the episode."
- Tightened the homepage fold from three named pillars to two that share a
  cadence: Deep Video Intelligence — knows your content; Precision Edits
  Craft — only the cleanest cuts. The programmable / our-agent-or-yours
  line is gone from the fold; that path stays in Bring your agent.
- Replaced the homepage FAQ's two-column always-open dump with a single
  accordion in the same warm-card chrome as the rest of the fold. Questions
  stay scannable; answers expand on click (native exclusive `<details>`).
- Floated the homepage site bar over the hero canvas instead of leaving a
  body-colored band the height of the bar above the 100svh stage. The pill now
  sits on the machine the same way it sits on the docs page.
- Added a field report on why BitterClip chose Pi for its embedded agent,
  including the production failure that sharpened the boundary, the actual
  ACP-to-Pi-to-MCP architecture, a fair comparison with DeepSeek Harness
  v0.1.0-rc.7, and guidance for teams choosing between a narrow embedded
  runtime and a broader agent platform.
- Reworked the Gemini 3.7 field report into a short user-facing update led by the
  practical result: median model response time fell 61% in the fixed test, the
  estimated cost fell 25%, no strong semantic difference appeared in the footage
  reviewed, and BitterClip upgraded with Gemini 3.6 kept as fallback. The article
  retains the useful timestamp-contract lesson and privacy-safe diagrams without
  turning the test into a broad benchmark claim.
- Added a creator-facing Google Takeout import guide covering archive setup,
  split ZIP handling, metadata and source-privacy provenance, Project mapping,
  resumable one-by-one Episode ingestion, video-quality limits, and the clear
  boundary between restoring owned uploads and connecting YouTube for
  publishing. Added discovery links from the docs hub, first-clip guide, FAQ,
  and troubleshooting, and made canonical URLs explicit on every docs article.
- Expanded the comparison surface into head-to-head pages: `/compare` is now a
  hub linking twelve `BitterClip vs <competitor>` pages driven by a new
  `compare` content collection (structured frontmatter for the table, verdicts,
  fine-print callouts sourced from each competitor's own pricing and terms,
  FAQ, and sources; bespoke Markdown prose per competitor). Each page ships
  FAQPage and BreadcrumbList JSON-LD, a generated Markdown twin with canonical
  Link headers, sitemap and `llms.txt`/`llms-full.txt` coverage, and Playwright
  smoke tests.
- Added `/compare`, a source-linked comparison page for BitterClip, Descript, and
  OpusClip. It explains the different jobs each product optimizes for, links to
  official competitor sources, adds navigation/footer discovery, and includes
  the route in the generated sitemap and AI-readable surfaces.
- Preserved original campaign UTMs and ad click IDs across every marketing,
  docs, blog, footer, and pricing signup link. BitterClip's own page and demo
  context now travels in separate `bc_*` fields, and sitewide signup clicks
  produce explicit analytics events instead of being inferred from pageviews.
- Aligned public copy with shipped behavior: removed the unsupported refund
  promise, described Instagram as a phone handoff, explained approval-mode and
  opt-in automatic publishing, described confirmed speaker recognition rather
  than automatic names, and documented the current Claude and ChatGPT custom-app
  availability rules.
- Added a dedicated 1200x630 BitterClip social card, large-card Open Graph and X
  metadata, explicit `/pricing` and `/signup` aliases, and real 404 responses for
  unknown marketing paths instead of silently serving the homepage.
- Replaced the broken Porkbun `www` forwarding path with a first-class TLS host
  that redirects to the canonical apex while preserving campaign parameters.
- Added docs engagement analytics for article, section, table-of-contents,
  sidebar, signup, and live-editor interactions, with Playwright coverage.
- Published blog posts two and three: "We stopped making templates"
  (effects-as-code) and "A condensed memory of the work" (why highlight
  reels are client memory, not marketing), each with hero/OG art and
  Markdown-twin smoke coverage.
- Added the public BitterClip blog at `/blog`, the first launch post for
  Identity Studio, per-post article SEO, BlogPosting JSON-LD, a generated
  `/blog.md` twin, generated post Markdown twins, `/blog/rss.xml`, sitemap
  entries, and discovery-file coverage for the new route.
- Blog presentation and conversion pass: every post now ends with a real
  get-started card (buttons, not a heading), posts show reading time and a
  share row (X, LinkedIn, copy link, RSS), quotes render as message bubbles,
  the index features the post's social image with an accessible card link,
  and body contrast was raised for long-form reading.
- Added a focused sign-in and conversion study after user feedback that the
  public landing page did not make returning-user sign-in obvious. The study
  verifies the live auth routes (`/sign_in` works, `/login` 404s), recommends
  a single conventional Sign in button in the top nav, and defines screenshot,
  smoke-test, attribution, and mobile guardrails for the first implementation
  slice.
- Added a public ChatGPT App Directory submission packet to the MCP page:
  app name, public URLs, support contact, MCP resource, review flow, and the
  public/private boundary for dashboard-only materials such as OAuth secrets,
  demo credentials, screenshots, test prompts, and sample workspace accounts.
  Refreshed the representative tool list against the live production operation
  catalog and documented that billing checkout should stay on BitterClip's own
  domain rather than appear in the submitted ChatGPT toolset. Markdown twins,
  `llms.txt`, and `llms-full.txt` now carry the same submission posture.
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
  cancellation and custody language moved to the point of decision ("Month to
  month · cancel anytime" under each paid CTA, "Resets every month — not a
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
- Replaced the single $99/month launch-access card with the current three-tier
  ladder: Free ($0, 60 minutes/month, 10 watermarked 1080p exports, 4 GB
  uploads), Clip ($9/month, 10 hours, 150 1080p exports, no watermark), and Pro
  ($99/month, 40 hours, 1,000 1080p exports, 20 GB uploads, priority processing,
  and visual analysis workflows). Updated the index Markdown twin, structured
  data, and smoke tests to match. Paid plans are month to month, can be canceled
  at any time, and files remain downloadable.
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

### Repository Metadata

- Updated the README's semantic description and product model to match the
  episode-first object chain: an Episode is the session workspace and its primary
  full-length Program, a Clip is an editable derivative of an Episode, a Render is
  a materialization attempt, and an Export is one completed exact rendered
  version. The documented workflow now ends in a human-confirmed publish rather
  than an approved-clip handoff.

### Public Hygiene

- Removed an internal production-readiness report from the public repository,
  rewrote the two affected tip commits out of branch history, restored branch
  protection, and kept production/customer detail out of the public docs tree.

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
