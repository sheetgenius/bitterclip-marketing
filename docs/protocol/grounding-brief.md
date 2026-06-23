# BitterClip docs — grounding & voice brief (authoritative)

Every writer/reviewer reads this first. Two jobs: (1) the facts must be TRUE, (2) the voice
must be friendly and human.

## What BitterClip is (use this framing)
BitterClip turns long recordings (video or audio) into short, source-accurate clips you can
trust. You bring a recording; it transcribes it into time-aligned words; then you — or your
AI assistant — pick the strongest moments, and BitterClip derives the exact cut from the
audio. No manual timeline, no guessed timestamps. It works in your browser at
`app.bitterclip.com` and, notably, **inside your AI assistant** (ChatGPT, Claude) via MCP.

## The core model / nouns — CURRENT (use these, not old ones)
- **Recording** — a raw uploaded video/audio file (the source).
- **Episode** — one stitched transcript timeline (one or more recordings joined). The episode
  is the unit you actually work in.
- **Clip** — a short, exported cut taken from an episode.
Recording → Episode → Clip. NOTE: older material says "Moment" as a noun — do NOT use
"Moment"; the current model is episode-first.

## Audience & voice (NON-NEGOTIABLE)
- Reader = a creator/operator, NOT a developer. Assume zero coding knowledge.
- Voice: warm, friendly, plain, encouraging, concrete. Second person ("you"). Short
  sentences. Active voice. Sound like a thoughtful human explaining something to a friend.
- NO dev-speak, NO marketing hype, NO jargon. Explain any necessary term in plain words.
- Lead with what the user wants to DO, then the steps. Use `[screenshot: …]` placeholders
  where a visual clearly helps.
- Avoid AI-writing tells (a humanizer pass will enforce this hard): no "Let's dive in", no
  reflexive rule-of-three, no em-dash overuse, no inflated/promotional adjectives, no hollow
  hedging, no "In today's world". Vary sentence length. Be specific and concrete.

## Accuracy rules (this is "vetted/verified")
- Only document what ACTUALLY exists. If unsure, READ the product repo
  (`/Users/c3po/co/bitterclip`) or the existing marketing pages
  (`/Users/c3po/co/bitterclip-marketing/app/pages/`) to verify — or omit the claim.
- Do NOT state volatile specifics that may be wrong (exact prices, exact plan names). Say
  "free to start" and link to the pricing/signup page. Pricing is in flux.
- Frontmatter on every page: `title`, `description`, and a `navigation`/order hint where useful.

## Key flows — grounding facts

### Quick start (zero → first clip)
1. Sign up at `app.bitterclip.com` — free to start; you land in a usable account immediately.
2. Create a project (a home for a show/series).
3. Upload a recording (video or audio).
4. BitterClip transcribes it; open the episode and pick the strongest moment (you, or your
   AI assistant).
5. Review the clip in the transcript editor — the cut is derived from the words you keep.
6. Export or publish it.

### Connect an AI assistant (MCP) — the marquee path
- BitterClip exposes an MCP endpoint so assistants like ChatGPT and Claude can open your
  recordings, read transcripts, and make clips conversationally.
- READ `bitterclip-marketing/app/pages/mcp.vue` (real setup content + a live embed) and the
  product repo to get the exact connect steps and CURRENT tool names.
- Real MCP tools (verify, use real names): `open_recording`, `episodes_list`,
  `episode_read`, `episode_edit`, `episode_render`, `episode_zoom`, `recordings_list` /
  `recordings_request_upload` / `recordings_finalize_upload`, `speakers_*`, the `youtube_*` /
  `x_*` / `linkedin_*` connection tools, and `publishing_*`. Do NOT use retired names.

### Connect YouTube (document the REAL gotchas — verified this week)
- In Settings you FIRST set your YouTube destination channel (paste the channel URL) BEFORE
  connecting — the connect flow requires a target channel.
- Then connect via Google. CRITICAL: authorize with a Google identity that can ACT AS the
  channel. Most channels are **Brand Accounts**. A YouTube **Studio "manager"** role is NOT
  enough — you need **Brand-Account** owner/manager access, or the channel won't appear and
  the connection silently fails. At Google's "Choose an account" step, pick the Brand
  Account, not your personal Gmail.
- Troubleshooting ("I'm a manager but it won't connect"): you're probably a *Studio* manager,
  not a *Brand-Account* manager. Have a Brand-Account owner add you via the Google Brand
  Account members page, or have them connect it.

### Connect X
- Connect via OAuth; grants posting (and read). Keep it simple for the user.

### Connect LinkedIn
- Connect via OAuth; posts to your own feed. A reconnect may be needed to grant newer
  permissions.

### Connect Instagram (BE HONEST)
- Direct API auto-publish is currently capped by Meta's constraints (personal-account limits,
  Facebook-Page requirement, app review). The practical path today is a guided manual
  hand-off to your phone. Document the honest, working path — do NOT promise full auto-publish.

## Per-page shape
Frontmatter → a 1–2 sentence intro on what you'll accomplish → the steps/sections → a short
"Next steps" with links. For callouts use the `::callout{type="tip|warning|note"}` MDC
component — NOT GitHub blockquote syntax (`> [!TIP]`), which does not render. Never surface
raw `snake_case` tool identifiers in creator-facing prose; lead with plain verb phrases.
Keep each page focused on one job.
