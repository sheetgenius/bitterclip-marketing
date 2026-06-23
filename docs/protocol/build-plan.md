# BitterClip docs build plan

Machine-readable plan: [`build-plan.json`](./build-plan.json). This is the human-readable rendering of the adversarially-reviewed content + DRY architecture plan the drafting workflow consumes. Honor the guardrails at the bottom (drawn from the adversarial critique) when drafting.

## Pages

### `index.md`

**BitterClip docs**

The /docs hub: a two-line plain definition of BitterClip plus a card grid routing creators to the right guide. Replaces the old docs.vue 'How a clip gets made' explainer, whose content moves to getting-started/what-is-bitterclip. VERIFY: old /docs (docs.vue) currently IS the explainer; this page replaces it and /docs 301s/serves this hub (see build_notes IA+redirect); every card link must resolve to a real page in this set.

**Outline**

- What BitterClip is (the WhatIsBitterClip snippet — one paragraph)
- Start here (card → getting-started/your-first-clip)
- Use it from your AI assistant (cards → assistants/overview, with sub-links to connect-chatgpt / connect-claude)
- Connect your channels (cards → connect/youtube, connect/x, connect/linkedin, connect/instagram)
- After you've made clips (cards → getting-started/find-and-share-clips, publishing/publish-a-clip)
- More (cards → help/troubleshooting, help/faq, changelog)
- Audience: any creator arriving at /docs — brand new or returning for one guide

**Must include**

- One-paragraph plain definition from the WhatIsBitterClip snippet: turns long video/audio recordings into short, source-accurate clips; works in the browser at app.bitterclip.com AND inside ChatGPT and Claude via a connection
- A card grid linking to at least: getting-started/your-first-clip, assistants/overview, connect/youtube, getting-started/find-and-share-clips, changelog
- A SignupCta 'free to start' line that links to app.bitterclip.com/sign_up (no inline price)

**Reuses:** `WhatIsBitterClip`, `SignupCta`, `Callout`

### `getting-started/what-is-bitterclip.md`

**What is BitterClip?**

Plain explanation of BitterClip plus Recording → Episode → Clip and the trust mechanism. Absorbs the retired docs.vue explainer AND the separate recordings/episodes/clips reference (folded here per the critique to kill the overlap). Audience: a creator who has never used BitterClip. VERIFY nouns against mcp_server.rb instructions (EPISODE comp_… = one or more recordings joined; recordings are raw inputs; freshly ingested recording auto-materializes its own episode) — already confirmed present. Do not reuse docs.vue 'Moment' wording.

**Outline**

- BitterClip in plain words (WhatIsBitterClip)
- Where it runs (browser + inside ChatGPT/Claude)
- The three things you'll work with (WhatIsEpisode: Recording, Episode, Clip)
- One episode can come from several recordings (the sync example)
- How a clip actually gets made — words, not timestamps (HowTheCutWorks)
- Why you can trust the cut (derived from audio, source-linked)
- Next steps (NextSteps → your-first-clip, assistants/overview)

**Must include**

- WhatIsEpisode block defines: Recording = a raw uploaded video/audio file (the source); Episode (comp_…) = one stitched transcript timeline made of one or more recordings, the unit you work in; Clip = a short exported cut taken from an episode
- State the model as Recording → Episode → Clip and explicitly note older material said 'Moment' — do NOT use Moment
- Multi-recording example: one person uploads a video, another appends theirs into the same episode → two recordings, one episode
- HowTheCutWorks: the AI (or you) picks the words/strongest moment, not timestamps; BitterClip derives start/end from the first and last words you keep plus a little breathing room, snapped to the audio, so a clip never lands mid-syllable
- Every clip stays linked to its recording, speaker, exact words, and timestamp

**Reuses:** `WhatIsBitterClip`, `WhatIsEpisode`, `HowTheCutWorks`, `SignupCta`, `NextSteps`

### `getting-started/your-first-clip.md`

**Your first clip**

Zero-to-first-clip quickstart in the browser: sign up, create a project, upload, transcribe, open the episode, pick the strongest moment, review, export; ends with a pointer to do it conversationally. Audience: a brand-new creator who wants a clip out fast. VERIFY: welcome notice verbatim in registrations_controller.rb line 25; export = captioned MP4 + SRT; supported uploads = any audio/* or video/* media type (upload_validator.rb SOURCE_MEDIA_CONTENT_TYPES).

**Outline**

- What you'll accomplish
- 1. Sign up (free to start) — SignupCta
- 2. Create a project (a home for a show/series; link to projects page)
- 3. Upload a recording (video or audio)
- 4. Let BitterClip transcribe it
- 5. Open the episode and pick the strongest moment (HowTheCutWorks reference)
- 6. Review and nudge the edges in the transcript editor
- 7. Export the captioned clip
- Tip (Callout): do this conversationally from your AI assistant instead (link to assistants/overview)
- Next steps (NextSteps → find-and-share-clips, publishing/publish-a-clip)

**Must include**

- Sign up at app.bitterclip.com — free to start; you land in a usable workspace immediately. The app's welcome says: verify your email, upload a recording, then use it with ChatGPT or Claude
- Create a project as a home for a show/series
- Upload a recording (any common video or audio file); BitterClip transcribes it into time-aligned words and it becomes its own episode automatically
- Open the episode, pick the strongest moment by the words you keep; the cut is derived from the audio (HowTheCutWorks)
- Review/nudge edges in the transcript editor, then export the captioned clip (MP4 with captions, plus an SRT)
- Email verification is required before some actions — verify via the email BitterClip sends
- Link out via SignupCta, not an inline price

**Reuses:** `SignupCta`, `HowTheCutWorks`, `Callout`, `NextSteps`

### `getting-started/projects-and-collaborators.md`

**Projects and collaborators**

Defines what a project is (home for a show/series), how to switch projects, and how to invite a collaborator (editor or client) so they can pull their own clips from the same recordings in their own ChatGPT or Claude. Closes the projects-noun + collaboration gaps. Audience: a creator who works with an editor/client. VERIFY: invite flow real in routes.rb (invite/:token show + accept POST); collaborator access scope (account vs project) — describe as 'access to work with you' if unclear; email send depends on SENDGRID_API_KEY (project memory) so phrase as 'they get an invite link'.

**Outline**

- What a project is (a home for a show/series)
- Switching between projects
- Inviting a collaborator (emailed accept link)
- What an invited collaborator can do
- Next steps (NextSteps)

**Must include**

- A project is the home for a show or series; recordings, episodes, and clips live under a project
- You invite a collaborator by email; they accept via a link and get access (the homepage frames this as 'invite a client to the same recording so they can pull their own clips in their ChatGPT or Claude')
- Keep it plain — describe what happens in the app, not internal mechanics

**Reuses:** `NextSteps`, `Callout`, `SignupCta`

### `assistants/overview.md`

**Use BitterClip from your AI assistant**

The marquee path: connect to ChatGPT/Claude and clip conversationally. Embeds the live transcript editor (real component, not flattened) and explains the aha moment via open_workspace. Audience: a creator who wants to clip by chatting. VERIFY: migrate mcp.vue live iframe (app.bitterclip.com/embed/clip-demo, postMessage resize, mobile gate) as an MDC component with the fixtures-only caveat (mcp.vue lines 180-182); open_workspace is THE opener and open_recording is forbidden for clipping (mcp_server.rb); do NOT reproduce the stale mcp.vue tools table; do NOT include YouTubeBrandAccountWarning here.

**Outline**

- What this gives you (chat → the editor opens with a clip already picked)
- The live editor (LiveEditorEmbed — real iframe, fixtures-only caveat)
- What you can ask for (ExampleClipPrompt; find the best moment, pull up my interview, cut something)
- What the assistant can do for you (McpTools — curated creator-facing subset)
- How it connects (AssistantConnectionIntro — remote hosted endpoint, sign in, no local setup)
- What it can and can't do (clip review/tuning in chat; full management lives in the web app)
- Nothing posts until you set it up (ApprovalPromise)
- Connect ChatGPT / Connect Claude (links)
- Next steps (NextSteps)

**Must include**

- BitterClip exposes a connection (a remote MCP server) so ChatGPT and Claude can open your recordings, read transcripts, and make clips conversationally
- The aha moment: ask for the strongest moment and the assistant opens the transcript editor with a clip already selected, ready to review — this is what open_workspace does (it opens the EPISODE with the clip pre-selected)
- AssistantConnectionIntro: a hosted endpoint (app.bitterclip.com/mcp) you add as a connection and sign into — no local setup, no config files, no processes to run
- ApprovalPromise (softened): nothing is connected or posted until you set it up and choose how a project publishes (you pick auto vs approval per project)
- Embed the live editor via LiveEditorEmbed as an MDC component, NOT flattened to text, carrying the fixtures-only caveat
- Plain-language note that deep management (libraries, settings, channels) lives in the web app; the assistant focuses on finding, reviewing, and tuning clips

**Reuses:** `AssistantConnectionIntro`, `WhatIsBitterClip`, `ApprovalPromise`, `LiveEditorEmbed`, `McpTools`, `ExampleClipPrompt`, `NextSteps`, `Callout`

### `assistants/connect-chatgpt.md`

**Connect ChatGPT**

Step-by-step to connect BitterClip to ChatGPT and make a first clip in chat. Audience: a ChatGPT creator. VERIFY: endpoint app.bitterclip.com/mcp + Developer-Mode-vs-published wording (mcp.vue lines 489-498, docs/chatgpt-app-submission.md); checkout/plan stay on BitterClip's domain (mcp.vue 502-504); keep ChatGPT menu labels tool-version-resilient — do not invent exact labels.

**Outline**

- Before you start (ConnectPrereqs — a BitterClip account, a recording uploaded)
- Add the BitterClip connection in ChatGPT
- Sign in to BitterClip (AssistantConnectionIntro)
- Make your first clip in chat (ExampleClipPrompt)
- Review and export from the editor that opens
- Tip (Callout): where management lives (the web app)
- Nothing posts until you set it up (ApprovalPromise)
- Troubleshooting (link → help/troubleshooting)
- Next steps (NextSteps)

**Must include**

- The connection is a remote, hosted endpoint at app.bitterclip.com/mcp — you add it and sign in; no local setup (AssistantConnectionIntro)
- During the app-directory/dev phase you connect the remote MCP server in ChatGPT Developer Mode and sign in; after publication users enable the BitterClip app the same way
- An example natural-language prompt (ExampleClipPrompt, e.g. 'pull up my latest interview and find the strongest moment')
- Account creation, plan management, and checkout stay on BitterClip's own domain — not in the ChatGPT app
- ApprovalPromise (softened, auto/approval mode aware)

**Reuses:** `ConnectPrereqs`, `AssistantConnectionIntro`, `ApprovalPromise`, `ExampleClipPrompt`, `SignupCta`, `NextSteps`, `Callout`

### `assistants/connect-claude.md`

**Connect Claude**

Step-by-step to add BitterClip as a Connector in Claude and make a first clip in chat. Audience: a Claude creator. VERIFY: 'Add BitterClip as a Connector and sign in' wording (mcp.vue 484-486, index.vue FAQ); endpoint app.bitterclip.com/mcp is what users paste; keep menu-path steps resilient to Claude UI changes.

**Outline**

- Before you start (ConnectPrereqs)
- Add BitterClip as a Connector in Claude
- Sign in to BitterClip (AssistantConnectionIntro)
- Make your first clip in chat (ExampleClipPrompt)
- Review and export from the editor that opens in the conversation
- Tip (Callout): where management lives (the web app)
- Nothing posts until you set it up (ApprovalPromise)
- Troubleshooting (link)
- Next steps (NextSteps)

**Must include**

- In Claude, add BitterClip as a Connector and sign in; the tools and the live editor appear right in the conversation
- The connection endpoint is the hosted app.bitterclip.com/mcp — no local setup (AssistantConnectionIntro)
- An example natural-language prompt (ExampleClipPrompt)
- ApprovalPromise (softened)

**Reuses:** `ConnectPrereqs`, `AssistantConnectionIntro`, `ApprovalPromise`, `ExampleClipPrompt`, `SignupCta`, `NextSteps`, `Callout`

### `connect/youtube.md`

**Connect YouTube**

How to connect a YouTube channel as a publishing destination, including the Brand-Account vs Studio-manager trap that silently breaks the connection. Audience: a creator publishing to YouTube who may hit the manager-role failure. VERIFY: settings/show.html.erb destination-first flow, field 'YouTube Studio channel URL or ID', placeholder 'https://studio.youtube.com/channel/UC...', note re Studio/Videos/Shorts URL or UC id + 'Connect with the Google or Brand account that can manage that channel'; 'Uploads forced private' policy (youtube_policy_warning line 33; privacy select 209-210); scopes youtube.upload/readonly/yt-analytics.readonly in channel_connection.rb — render plain labels only.

**Outline**

- What connecting YouTube lets you do (ConnectorScopes)
- Before you start: set your destination channel FIRST
- Connect with the right Google identity (Brand Account)
- The Brand-Account vs Studio-manager trap (YouTubeBrandAccountWarning)
- If the channel doesn't appear / 'I'm a manager but it won't connect'
- Publishing privacy and defaults (where they live in Settings)
- Reconnecting (ReconnectNote)
- Next steps (NextSteps)

**Must include**

- In Settings you FIRST set the YouTube destination channel by pasting the channel URL or ID (a Studio/Videos/Shorts URL, or a channel ID starting with UC) BEFORE connecting — the connect flow requires a target channel
- Connect via Google and, at Google's 'Choose an account' step, pick the identity that can ACT AS the channel — usually a Brand Account, not your personal Gmail (YouTubeBrandAccountWarning)
- WARNING: a YouTube Studio 'manager' role is NOT enough; you need Brand-Account owner/manager access or the channel won't appear and the connection silently fails
- Fix: have a Brand-Account owner add you via the Google Brand Account members page, or have them connect it
- Uploads may be forced to private by policy; you can set a YouTube privacy default in Settings
- ConnectorScopes renders YouTube permissions in plain English (publish to your channel + read your channel/analytics) — never raw scope strings
- Reconnect is available if access changes (ReconnectNote)

**Reuses:** `ConnectPrereqs`, `ConnectorScopes`, `YouTubeBrandAccountWarning`, `ReconnectNote`, `Callout`, `NextSteps`

### `connect/x.md`

**Connect X**

How to connect X so BitterClip can post clips to your feed. Short by design. Audience: a creator posting to X. VERIFY: settings/show.html.erb lists X with Connect/Reconnect + publish_scope check; scopes tweet.read/users.read/tweet.write/media.write/offline.access in channel_connection.rb — plain labels only.

**Outline**

- What connecting X lets you do (ConnectorScopes)
- Connect X (sign in / authorize)
- What gets posted and when (ApprovalPromise)
- Reconnecting (ReconnectNote)
- Next steps (NextSteps)

**Must include**

- Connect X by authorizing through OAuth; it grants posting (and reading) on your account — ConnectorScopes renders this in plain English, not raw scope strings
- Posting happens per your project's setting — nothing posts until you set it up and approve (ApprovalPromise)
- Reconnect may be needed if permissions change (ReconnectNote)

**Reuses:** `ConnectPrereqs`, `ConnectorScopes`, `ApprovalPromise`, `ReconnectNote`, `NextSteps`, `Callout`

### `connect/linkedin.md`

**Connect LinkedIn**

How to connect LinkedIn so BitterClip can post clips to your own feed, including when a reconnect is needed. Short by design. Audience: a creator posting to their LinkedIn feed. VERIFY: settings/show.html.erb lists LinkedIn with Connect/Reconnect; scopes openid/profile/w_member_social/w_member_social_feed in channel_connection.rb (feed scope is the newer one a reconnect grants) — plain labels only.

**Outline**

- What connecting LinkedIn lets you do (ConnectorScopes)
- Connect LinkedIn (sign in / authorize)
- Posts go to your own feed
- If you connected earlier: reconnect for newer permissions (ReconnectNote)
- What gets posted and when (ApprovalPromise)
- Next steps (NextSteps)

**Must include**

- Connect LinkedIn via OAuth; it posts to your own feed — ConnectorScopes renders permissions in plain English
- A reconnect may be needed to grant newer posting permissions (ReconnectNote)
- Nothing posts until you set it up and approve (ApprovalPromise)

**Reuses:** `ConnectPrereqs`, `ConnectorScopes`, `ApprovalPromise`, `ReconnectNote`, `NextSteps`, `Callout`

### `connect/instagram.md`

**Connect Instagram**

An honest guide. You WILL see a Connect Instagram button in Settings; this page explains what connecting does and does not get you, and why the dependable path today is a guided manual hand-off to your phone. Audience: a creator who wants clips on Instagram. VERIFY: Connect button IS in settings/show.html.erb (instagram_authorize_path line 37) and channel_connection.rb has full IG scopes incl. instagram_content_publish — the page must reconcile this, not pretend the button is absent; docs/build/instagram-distribution-capped.md confirms capped/parked, no personal-account API posting, FB-Page requirement, App Review, forward path = manual share-to-phone.

**Outline**

- You'll see a Connect Instagram button — here's what it does
- Why reliable auto-publish to your feed is still constrained (Meta's rules) (InstagramCappedNote)
- The dependable path today: download and share to your phone
- Step-by-step manual hand-off
- What's coming
- Next steps (NextSteps)

**Must include**

- Reconcile with the live UI: Instagram DOES appear as a Connect/Reconnect provider in Settings (it authorizes), but reliable direct auto-publish to your feed is constrained by Meta's rules (personal-account limits, a Facebook-Page requirement, and Meta App Review) — InstagramCappedNote
- The dependable path today is a guided manual hand-off: download the clip and share it to your phone, then post in the Instagram app
- Do NOT claim 'no Instagram option exists' and do NOT promise full auto-publish
- Single-source the capability via the connectors.yml data file + InstagramCappedNote so a future un-cap is one edit

**Reuses:** `ConnectPrereqs`, `InstagramCappedNote`, `NextSteps`, `Callout`

### `getting-started/find-and-share-clips.md`

**Find and share your clips**

Where finished clips live (the per-project Outputs gallery), how to download the MP4, and how to grab a shareable embed link. Closes the homepage-promised 'grab a shareable link' gap. Audience: a creator who made clips earlier. VERIFY: per-project Outputs gallery real (routes.rb projects/:id/outputs → projects#outputs, bitterclip-outputs-index Lit surface); shareable clip embed real (routes.rb embed/clip/:id, a Pro feature gated on clips_set_embed) — honor the Pro gate without quoting a price; download affordance via clips_get_download_url (operation exists).

**Outline**

- Where your finished clips live (the project Outputs tab)
- Downloading a clip
- Sharing a clip with a link / embedding it
- Next steps (NextSteps)

**Must include**

- Finished clips and rendered outputs live in your project's Outputs gallery; each clip stays linked back to its source recording
- You can download the rendered MP4
- You can publish a clip as a shareable, embeddable link (a Pro feature) so it can play on a page outside BitterClip
- Keep it creator-facing — describe what you click, not tool names

**Reuses:** `NextSteps`, `Callout`, `SignupCta`

### `publishing/publish-a-clip.md`

**Publish a clip**

After a clip is exported, how to review a publish package and send it to your connected channels. Covers the project-level auto vs approval mode honestly. Audience: a creator with an exported clip wanting to push it to YouTube/X/LinkedIn. VERIFY: prepare_publish_set respects project auto/approval mode (mcp_server.rb 'approval keeps drafts for review, auto publishes the ready channels'); verify_external_post_before_retry + resolve_cleanup states exist; publishing defaults (youtube_privacy_status select, defaults block) in settings/show.html.erb — plain words, keep volatile specifics light; describe what happens in the app/chat, not tool names.

**Outline**

- Before you start (ConnectPrereqs — a connected channel, an exported clip)
- Choosing how a project publishes (auto vs approval mode)
- Reviewing a publish package
- Approving and publishing
- Publishing to several channels at once
- Checking publish status
- If something needs your attention (verify before retry)
- Where publishing defaults live (privacy, default platforms, post body, tags)
- Next steps (NextSteps)

**Must include**

- You choose per project whether clips wait for your approval or auto-publish the ready channels — ApprovalPromise phrased so it is NOT contradicted by auto mode
- You review a package (copy, destination, media) first; in approval mode you approve to publish, in auto mode the ready channels go out once prepared
- You can prepare/queue a whole episode across channels in one step
- You can check publish status after publishing
- If a publish hits a 'verify the external post before retrying' state, do not republish — verify the destination first
- Publishing defaults (YouTube privacy, default platforms, post-body template, tags) live in Settings — point creators there
- Link to the per-channel connect guides for prerequisites

**Reuses:** `ConnectPrereqs`, `ApprovalPromise`, `Callout`, `NextSteps`

### `help/troubleshooting.md`

**Troubleshooting**

A scannable list of the most common snags, each with the fix. Audience: a creator who hit a problem and wants the fix fast. VERIFY: email-verification gate real (prod-only) per welcome notice + project memory; speaker rename real (recordings_rename_speaker / speakers_* in catalog); support email hello@bitterclip.com (mcp.vue line 205); YouTube warning text single-sourced via YouTubeBrandAccountWarning (matches connect/youtube).

**Outline**

- YouTube channel doesn't appear / 'I'm a manager but it won't connect' (YouTubeBrandAccountWarning)
- 'Reconnect required' on a channel (ReconnectNote)
- Email not verified / can't do something yet
- My recording isn't showing as an episode yet
- A clip is still processing / export pending
- A speaker is labeled wrong
- Instagram won't auto-publish
- Still stuck (SupportContact)

**Must include**

- YouTube fix reuses YouTubeBrandAccountWarning and 'set the destination channel first'
- Reconnect-required means re-authorize the channel to grant current permissions (ReconnectNote)
- Email verification is required before some actions; verify via the email BitterClip sent
- A just-uploaded recording becomes its own episode automatically; if it's not listed yet, give transcription a moment
- Export/render runs in the background; check status, it can take a bit
- A wrong speaker label can be fixed — you can rename the speaker (point to where, plainly)
- Instagram auto-publish is capped — use the manual share-to-phone hand-off (link to connect/instagram)
- Support contact: hello@bitterclip.com (SupportContact)

**Reuses:** `YouTubeBrandAccountWarning`, `ReconnectNote`, `SupportContact`, `Callout`

### `help/faq.md`

**FAQ**

Short answers to the questions creators actually ask. Audience: a creator skimming for quick answers. VERIFY: index.vue FAQ already answers some (ChatGPT vs Claude, no local setup, nothing publishes without approval) — align wording; do not quote prices/plan names (link via SignupCta); supported uploads = any audio/* or video/* media type (upload_validator.rb) so answer 'any common video or audio file' — do NOT invent an extension allowlist (validator is MIME-prefix based); collaboration has two true senses (multi-recording episode AND project invite) — cover both.

**Outline**

- Is it free to start?
- Do I need to know how to code?
- Does it work with ChatGPT, Claude, or both?
- Do I have to use an AI assistant, or can I use the browser?
- Where do my recordings and clips live?
- Will it post to my channels without asking?
- Can two people work on one episode / one project?
- What file types can I upload?

**Must include**

- Free to start — SignupCta link, no inline price
- No coding required; it's built for creators
- Works with both ChatGPT and Claude (and in the browser at app.bitterclip.com)
- Recordings and rendered clips live in your BitterClip workspace, each clip linked back to its source (WhatIsBitterClip)
- Nothing posts until you set it up and choose how a project publishes (ApprovalPromise)
- Collaboration: two recordings can form one episode (multi-recording episodes), AND you can invite a collaborator to a project (link to projects-and-collaborators) — answer both senses
- File types: any common video or audio file

**Reuses:** `WhatIsBitterClip`, `SignupCta`, `ApprovalPromise`, `WhatIsEpisode`, `SupportContact`

### `changelog/index.md`

**What's new**

A short, hand-curated 'What's new' page of notable changes, newest first. Scoped down from a full RSS feed for Phase 1 (RSS/feed generation deferred to Phase 2 per the critique). Audience: creators/agents wanting to see what's recently changed. VERIFY: backfill only real, verifiable entries (e.g. from bitterclip-marketing/CHANGELOG.md or shipped product facts) — do not invent; changelog URL is /docs/changelog per spec §8; RSS + the entry collection are GENERATED at build (no server) = Phase 2, so Phase 1 ships one static page.

**Outline**

- What this is (a running list of notable changes)
- Recent updates (newest first; a few real, verifiable entries)
- Subscribe (placeholder note — RSS arrives in Phase 2)

**Must include**

- A short intro that this is the running list of notable changes
- A small number of REAL, verifiable entries (newest first) — do not invent change history
- Phase 1 is a single hand-written page; the generated month-grouped feed + RSS is a Phase 2 deliverable (see build_notes) — do not promise a live RSS URL until the generation pipeline lands

**Reuses:** `Callout`

## Shared snippets

| Key | Purpose | Used by |
| --- | --- | --- |
| `WhatIsBitterClip` | One-paragraph plain definition: BitterClip turns long video/audio recordings into short, source-accurate clips you can trust; you (or your AI assistant) pick the strongest moments and BitterClip derives the exact cut from the audio; works in the browser at app.bitterclip.com AND inside ChatGPT and Claude via a connection. The single elevator description. MDC component, no volatile data. | `index.md`, `getting-started/what-is-bitterclip.md`, `assistants/overview.md`, `help/faq.md` |
| `WhatIsEpisode` | The canonical Recording → Episode → Clip noun block: Recording = raw uploaded video/audio source; Episode (comp_…) = one stitched transcript timeline, one or more recordings joined, the unit you work in; Clip = a short exported cut from an episode. Includes the multi-recording-into-one-episode example and the explicit 'do not use Moment' note. One MDC component so the model never drifts. Verified against mcp_server.rb instructions. | `getting-started/what-is-bitterclip.md`, `help/faq.md` |
| `HowTheCutWorks` | The trust mechanism in plain words: the AI (or you) selects the words/moment, not timestamps; BitterClip derives start/end from the first and last words you keep plus a little breathing room, snapped to the audio, so a clip never lands mid-syllable; every clip stays linked to its recording, speaker, words, and timestamp. MDC component. | `getting-started/what-is-bitterclip.md`, `getting-started/your-first-clip.md` |
| `SignupCta` | The 'free to start' call-to-action linking to app.bitterclip.com/sign_up (URL read from _data/site.yml), noting you land in a usable workspace immediately and need to verify your email. Quotes NO price (pricing in flux — link only). MDC component reading site.yml. | `index.md`, `getting-started/what-is-bitterclip.md`, `getting-started/your-first-clip.md`, `getting-started/projects-and-collaborators.md`, `getting-started/find-and-share-clips.md`, `help/faq.md` |
| `AssistantConnectionIntro` | Shared intro for the assistant pages: BitterClip connects as a remote, hosted endpoint (app.bitterclip.com/mcp, read from site.yml) you add as a connection and sign into — no local setup, no config files, no processes to run. MDC component. | `assistants/overview.md`, `assistants/connect-chatgpt.md`, `assistants/connect-claude.md` |
| `ApprovalPromise` | The safety promise, SOFTENED to match the real project-level auto-vs-approval publish mode: nothing is connected or posted until you set it up; you choose per project whether clips wait for your approval or auto-publish the ready channels; account, plan, and checkout always stay on BitterClip's own domain. Phrased so it is NOT contradicted by auto mode (per must_fix). MDC component. | `assistants/overview.md`, `assistants/connect-chatgpt.md`, `assistants/connect-claude.md`, `connect/x.md`, `connect/linkedin.md`, `publishing/publish-a-clip.md`, `help/faq.md` |
| `ConnectPrereqs` | Shared 'before you start' block for connector + publishing guides: a BitterClip account (free to start), and for publishing something to publish; connections are managed in Settings. Keeps the lead-in identical across YouTube/X/LinkedIn/Instagram/publish. MDC component. | `connect/youtube.md`, `connect/x.md`, `connect/linkedin.md`, `connect/instagram.md`, `assistants/connect-chatgpt.md`, `assistants/connect-claude.md`, `publishing/publish-a-clip.md` |
| `YouTubeBrandAccountWarning` | The single highest-value reused gotcha (2026-06-23 reception-learning finding): set the destination channel first; at Google's 'Choose an account' step authorize with a Google identity that can ACT AS the channel — usually a Brand Account, not your personal Gmail; a Studio 'manager' role is NOT enough, you need Brand-Account owner/manager access or the channel silently won't connect; fix = a Brand-Account owner adds you via the Google Brand Account members page. MDC component (a WARNING callout). NOT used on assistants/overview (per critique). | `connect/youtube.md`, `help/troubleshooting.md` |
| `ReconnectNote` | Shared note explaining the 'Reconnect required' state and that reconnecting re-authorizes a channel to grant current/newer permissions (e.g. LinkedIn's newer w_member_social_feed). MDC component. | `connect/x.md`, `connect/linkedin.md`, `connect/youtube.md`, `help/troubleshooting.md` |
| `LiveEditorEmbed` | MDC component (NOT flattened text) that mounts the real BitterClip transcript editor via the existing app.bitterclip.com/embed/clip-demo iframe with postMessage auto-resize, the ?embed= dev override, mobile activation gate, and skeleton — migrated from mcp.vue. MUST carry the fixtures-only caveat ('every edit is stubbed, no backend, no account, no render cost') per must_fix. Its .md twin omits the embed by design. | `assistants/overview.md` |
| `McpTools` | MDC component rendering a CURATED, creator-facing subset of MCP tools from content/_data/mcp-tools.yml as a small table/list, with an optional group prop. It must be LABELED as a curated subset (the live server has ~80 operations) — not presented as the full catalog (per must_fix, avoids repeating the mcp.vue mistake). open_workspace is marked the primary editor-opener; open_recording is demoted/omitted from the creator narrative. | `assistants/overview.md` |
| `ConnectorScopes` | MDC component rendering 'what permissions this grants' per connector in PLAIN ENGLISH only, from content/_data/connector-scopes.yml. Raw OAuth scope strings stay internal/non-rendered (brief rule: do not print raw scopes to creators); the component renders only plain_label. MDC component. | `connect/youtube.md`, `connect/x.md`, `connect/linkedin.md` |
| `InstagramCappedNote` | The honest Instagram reality block: you'll see a Connect button (it authorizes), but reliable direct auto-publish to your feed is constrained by Meta (personal-account limits, Facebook-Page requirement, App Review); the dependable path today is the guided manual share-to-phone hand-off. Reads status from _data/connectors.yml so a future un-cap is one edit. Owner-review-gated. MDC component. | `connect/instagram.md` |
| `ExampleClipPrompt` | A reusable example natural-language prompt a creator can paste to their assistant (e.g. 'Pull up my latest interview and find the strongest moment'), matching the product's clip-suggestion / open_workspace flow. MDC component. | `assistants/connect-chatgpt.md`, `assistants/connect-claude.md`, `assistants/overview.md` |
| `SupportContact` | Single-sourced support contact (hello@bitterclip.com, read from _data/site.yml). MDC component. | `help/troubleshooting.md`, `help/faq.md` |
| `NextSteps` | Convention/component for the short 'Next steps' link list at the foot of each page, for consistent cross-linking. MDC component taking a list of link targets. | `index.md`, `getting-started/what-is-bitterclip.md`, `getting-started/your-first-clip.md`, `getting-started/projects-and-collaborators.md`, `getting-started/find-and-share-clips.md`, `assistants/overview.md`, `assistants/connect-chatgpt.md`, `assistants/connect-claude.md`, `connect/youtube.md`, `connect/x.md`, `connect/linkedin.md`, `connect/instagram.md`, `publishing/publish-a-clip.md` |
| `Callout` | One callout component rendering the > [!TIP] / > [!WARNING] / > [!NOTE] convention from the brief, so styling/semantics are identical everywhere. | `index.md`, `getting-started/what-is-bitterclip.md`, `getting-started/your-first-clip.md`, `getting-started/projects-and-collaborators.md`, `assistants/overview.md`, `assistants/connect-chatgpt.md`, `assistants/connect-claude.md`, `connect/youtube.md`, `connect/x.md`, `connect/linkedin.md`, `connect/instagram.md`, `getting-started/find-and-share-clips.md`, `publishing/publish-a-clip.md`, `help/troubleshooting.md`, `changelog/index.md` |

## Data files

### `content/_data/site.yml`

Volatile global facts that recur everywhere. Fields: signup_url, pricing_url, support_email, mcp_resource_url, app_origin, og_image_default. Read by SignupCta, AssistantConnectionIntro, SupportContact, and meta/og defaults. Per the brief, pricing is in flux so NO plans/prices are enumerated — only the 'free to start' link target. VERIFIED values: signup_url=https://app.bitterclip.com/sign_up; app_origin=https://app.bitterclip.com; mcp_resource_url=https://app.bitterclip.com/mcp; support_email=hello@bitterclip.com. pricing_url = the signup/pricing page (use signup_url unless a dedicated pricing page is confirmed).

### `content/_data/mcp-tools.yml`

A CURATED, creator-facing subset of the MCP tool catalog (NOT the full ~80-operation list — must be labeled as a subset to avoid repeating the stale-mcp.vue-table mistake). Fields: name, group, plain_purpose, primary, creator_facing. open_workspace MUST be marked the primary editor-opener (the aha-moment tool); open_recording is omitted/demoted from the creator narrative (the live instructions forbid it for clip suggestion). Suggested rows (verified real names from operation_catalog.rb): episodes_list, episode_read, episode_zoom, open_workspace (primary), episode_create, episode_render/episode_status, recordings_request_upload/open_uploader/recordings_create_from_url, the *_get_connection_status trio, publishing_prepare_publish_set, publishing_publish_approval, clips_set_embed. Longer-term: GENERATE from operation_catalog.rb / OperationAuthorization manifest (see build_notes verification cadence).

### `content/_data/connector-scopes.yml`

Per-connector permissions, single-sourced from the app. Fields: connector, scope, plain_label, required, notes. Each row carries a creator-facing plain_label that pages render; the raw scope string is stored for cross-checking but NEVER rendered in prose (brief rule). VERIFIED scopes in channel_connection.rb: YouTube = youtube.upload + youtube.readonly + yt-analytics.readonly; LinkedIn = openid, profile, w_member_social, w_member_social_feed; X = tweet.read, users.read, tweet.write, media.write, offline.access; Instagram = instagram_basic, pages_show_list, pages_read_engagement, business_management, instagram_content_publish (but capped — see connectors.yml). Cross-repo drift risk: keep in sync with apps/bitterclip-rails/app/models/channel_connection.rb.

### `content/_data/connectors.yml`

Connector status + capability matrix driving the connect/ cards and the honest IG/reconnect notes. Fields: connector, status, auto_publish, manual_handoff, reconnect_note. Single source for 'what works today' so the capped IG reality and LinkedIn reconnect note can't drift. VERIFIED: youtube/x/linkedin = connectable + auto_publish true (post after approval/auto mode); instagram = connectable (Connect button exists) but auto_publish=false/capped, manual_handoff=true (per docs/build/instagram-distribution-capped.md). Owner reviews on any connector-manifest change.

## Frontmatter schema

- title (string, required) — page H1 + <title>
- description (string, required) — meta description + card subtitle + the page's llms.txt line
- navigation (object { label, order } or false) — sidebar label + sort; false hides from nav. v3 uses this + numeric filename prefixes, NOT a v2 .navigation.yml
- section (enum: getting-started|assistants|connect|publishing|help|changelog) — sidebar group, validated by zod
- updated (ISO date string) — 'last updated' stamp + freshness/review signal + sitemap lastmod
- tags (string[], optional) — cross-link + filtering + llms metadata
- date (ISO date, changelog entries only — Phase 2) — reverse-chron feed + RSS pubDate
- summary (string, changelog entries only — Phase 2) — one-liner shown in feed + RSS description
- ogImage (string, optional) — per-page social card; falls back to site.yml og_image_default

## Partial mechanism

@nuxt/content v3 (Nuxt 4) — NOT YET INSTALLED (package.json has only nuxt ^4.4.4 + vue + vue-router; no content/ dir; app/components/ does not yet exist). This is net-new infrastructure and is the single biggest shipping risk; treat it as a dependency to stand up, not a given. v2 mechanisms (.navigation.yml, ContentDoc/ContentSlot) are gone — do not use them.

Three verified v3 primitives, layered:

(1) PROSE/UI SNIPPETS = MDC components. Each reusable block (WhatIsEpisode, YouTubeBrandAccountWarning, McpTools, Callout, etc.) is a Vue component in app/components/content/ (the auto-registered MDC dir, which must be CREATED) and is invoked from any .md body with block syntax '::component-name … ::' (with '#slot' named slots) or inline ':component-name'. v3 has NO {% include %} / raw-markdown include — a 'shared snippet rendered identically on N pages' = one MDC component, referenced, never copy-pasted.

(2) VOLATILE DATA = type:'data' collections + zod. Define in content.config.ts: defineCollection({ type:'data', source:'_data/*.yml', schema: z.object({...}) }). A data component does queryCollection('mcpTools').all() and renders rows itself; a page can also interpolate a value in prose with the v3 mustache {{ $doc.key }} where $doc = frontmatter merged with the ContentRenderer :data prop. So pages NEVER hard-code a tool name, scope, URL, or email.

(3) RENDER = ContentRenderer. The docs layout queries the route page with queryCollection('docs').path(route.path).first() then renders <ContentRenderer :value=\"page\" />. A snippet component runs its own queryCollection() so data flows wherever it mounts. Net: edit one .yml row OR one MDC component → every page (and, in Phase 2, every generated surface) updates — O(1).

CHOSEN PATTERN: snippets are MDC components; the data-bearing ones (McpTools, ConnectorScopes, SignupCta, SupportContact, InstagramCappedNote) internally read content/_data/*.yml data collections validated by zod. One update site for prose, one for data. This is exactly what kills the copy-paste drift already visible in mcp.vue (retired tool names) and public/llms.txt (still says 'Moment').

## Build notes

1. PHASE THE BUILD (critique scope_adjustment — do not let the generation rig block correct content). Phase 1: install @nuxt/content v3; create app/components/content/ with the MDC snippet set; create content/_data/*.yml; author the 14 pages + the single 'What's new' page; build the thin docs layout (sidebar/TOC) on the existing site's dark/glass design; wire /docs routing + nav; zod-validate frontmatter. Phase 1 ships hand-verified-correct content. Phase 2: the generated .md twins, nuxt-llms /llms.txt + /llms-full.txt, generated /sitemap.xml, and changelog RSS via a Nitro prerender hook, plus the CI gate (generated-md-count == content-page-count + internal link check). RSS + a month-grouped changelog feed are Phase 2 — Phase 1 changelog is one static 'What's new' page.

2. MUST-FIX (open_workspace): the marquee/aha narrative on every assistants/* page and in mcp-tools.yml maps to open_workspace (opens the EPISODE in the transcript editor with a clip PRE-SELECTED). open_recording is explicitly FORBIDDEN for clip suggestion in the live instructions ('Do NOT use open_recording … suggesting clips is ALWAYS episode-scoped via open_workspace(selections:)', mcp_server.rb). Omit/demote open_recording from the creator-facing list.

3. MUST-FIX (Instagram reconciliation): a Connect Instagram button DOES exist in Settings (instagram_authorize_path, settings/show.html.erb line 37; full IG scopes incl. instagram_content_publish in channel_connection.rb). connect/instagram.md and the FAQ must explain what connecting does (it authorizes) and why reliable auto-publish to the feed is still constrained by Meta (personal-account limits, Facebook-Page requirement, App Review) — dependable path = manual share-to-phone. Do NOT say 'no Instagram option exists' and do NOT promise full auto-publish. Single-source via connectors.yml + InstagramCappedNote.

4. MUST-FIX (IA collision + redirects): /docs today IS docs.vue ('How a clip gets made', Recording→Moment→Clip). Decision: /docs becomes the new hub (index.md); the explainer content moves to getting-started/what-is-bitterclip (re-written to the episode-first nouns); docs.vue AND mcp.vue are retired. Add 301s (or static rewrites) for the OLD /docs and /mcp URLs to their new homes, and update the rel=canonical / rel=alternate markdown links those pages currently emit (docs.vue lines 22-25, mcp.vue lines 26-29). Wire changelog at /docs/changelog (spec §8).

5. MUST-FIX (nginx — corrected, the critique caught an overstatement): nginx.conf ALREADY has a 'location ~* \.(md|markdown)$' glob (line 52) that serves any .md tree with text/markdown — markdown handling does NOT need inventing. The real changes are: (a) add /docs/** SPA/static routing so the generated docs tree resolves, and (b) add the per-URL 301s for old /docs and /mcp. The existing per-file 'location =' blocks for /docs.md, /mcp.md etc. can stay or be folded into the glob.

6. MUST-FIX (approval-promise softened): nothing publishes 'without explicit approval' is NOT absolute — prepare_publish_set respects a project-level auto vs approval mode ('approval keeps drafts for review, auto publishes the ready channels', mcp_server.rb). The ApprovalPromise snippet emphasizes: nothing is connected or posted until you set it up and choose the mode per project. publishing/publish-a-clip.md explains both modes.

7. MUST-FIX (LiveEditorEmbed fixtures caveat): carry mcp.vue's load-bearing honesty — 'Fixtures only — every edit is stubbed, no backend, no account, no render cost' (mcp.vue lines 180-182) — into the migrated component so assistants/overview.md does not imply the marketing-page editor can really export.

8. MUST-FIX (mcp-tools.yml is a curated subset, labeled): the live catalog has ~80 operations (verified count: 82 entries in operation_catalog.rb, incl. many speakers_* / recordings_*_speaker* / publishing_* variants). The yml is a deliberately small creator-facing subset and the McpTools component must SAY so — do not present it as the full catalog (repeats the exact mcp.vue mistake). Verification cadence: re-check the curated names against operation_catalog.rb / mcp_server.rb on any backend tool change; longer-term generate the yml from the manifest.

9. MUST-FIX (supported file types verified): uploads accept ANY audio/* or video/* media type (upload_validator.rb SOURCE_MEDIA_CONTENT_TYPES = /\A(?:video|audio)\//). The FAQ CAN answer 'What file types can I upload?' with 'any common video or audio file' — do NOT invent a specific extension allowlist (the validator is MIME-prefix based, not an extension list). Question stays in.

10. MUST-FIX (find/share clips coverage added): new page getting-started/find-and-share-clips.md covers the per-project Outputs gallery (routes.rb projects/:id/outputs → projects#outputs, the bitterclip-outputs-index Lit surface — VERIFIED), downloading the MP4 (clips_get_download_url exists), and the shareable/embeddable clip link (routes.rb embed/clip/:id, a Pro feature gated on clips_set_embed — VERIFIED). It's added to the index card grid. Honor the Pro gate without quoting a price.

11. GAP CLOSED (projects + collaboration): new page getting-started/projects-and-collaborators.md defines 'project = home for a show/series' (the step-2 noun) AND the project-invite collaboration flow (routes.rb invite/:token + invite/:token/accept — VERIFIED). The FAQ 'Can two people work on one episode/project?' answers BOTH senses: multi-recording episodes AND inviting a collaborator. Note email send depends on SENDGRID_API_KEY in deploy-env (project memory) — phrase as 'they get an invite link', do not promise instant delivery.

12. GAP CLOSED (speaker fix): troubleshooting covers 'a speaker is labeled wrong' — speaker rename is real (recordings_rename_speaker / speakers_* in catalog). The homepage promises auto speaker labels, so the fix path is a legitimate creator need.

13. DROPPED from assistants/overview: YouTubeBrandAccountWarning (per critique — it's a YouTube concern; keep it only on connect/youtube + troubleshooting). FOLDED: the separate recordings-episodes-clips page is merged into getting-started/what-is-bitterclip (WhatIsEpisode single-sources the nouns, so two near-identical pages were redundant).

14. DRY rule (raw scopes): connector-scopes.yml carries the raw scope string for internal cross-checking ONLY; the ConnectorScopes component renders ONLY plain_label. Never print raw OAuth scopes to creators (brief rule). Cross-repo drift risk: connector-scopes.yml must stay in sync with apps/bitterclip-rails/app/models/channel_connection.rb (verified matching today: YouTube upload/readonly/analytics; LinkedIn openid/profile/w_member_social/w_member_social_feed; X tweet.read/users.read/tweet.write/media.write/offline.access).

15. VOICE: non-technical creator, warm/plain/second-person, short varied sentences, no AI-writing tells (a humanizer pass enforces this). Per-page shape: frontmatter → 1-2 sentence 'what you'll accomplish' intro → steps/sections → NextSteps with links. Use [screenshot: …] placeholders where a visual clearly helps. Never quote prices/plan names — link via SignupCta.

16. Authoritative source files for drafters (all VERIFIED this session): MCP nouns+flows+open_workspace = apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb (instructions ~lines 119-160); tool catalog = app/services/bitterclip/operation_catalog.rb; OAuth scopes = app/models/channel_connection.rb (lines 8-30); Settings/YouTube/Instagram/privacy = app/views/settings/show.html.erb; welcome notice = app/controllers/registrations_controller.rb line 25; uploads = app/services/bitterclip/upload_validator.rb; routes (outputs/embed/invite) = config/routes.rb; live editor embed + fixtures caveat + submission fields = bitterclip-marketing/app/pages/mcp.vue; retired explainer = bitterclip-marketing/app/pages/docs.vue; spec = bitterclip-marketing/docs/docs-site-spec.md (+ .review.md).

## Plan guardrails (from adversarial critique)

Drafters MUST honor these. They are the must-fix items from the adversarial review, plus the most load-bearing drift and accuracy concerns.

### Must fix

- Re-point the marquee narrative to open_workspace. In mcp-tools.yml and on assistants/* pages, open_workspace is THE tool that opens the transcript editor with a clip pre-selected (episode-scoped). open_recording must be demoted; the live MCP instructions explicitly forbid open_recording for clip suggestion. Verify against apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb lines 128-138.
- Fix connect/instagram.md and the FAQ to match the live Settings UI: Instagram DOES show a Connect button (instagram_authorize_path, scopes incl. instagram_content_publish in app/models/channel_connection.rb). The honest page must explain what connecting does and why reliable auto-publish to your feed is still constrained by Meta (personal-account limits, FB-Page requirement, app review) and that the dependable path today is the manual share-to-phone hand-off. Do not claim 'no Instagram option exists' and do not promise full auto-publish. Single-source via connectors.yml + InstagramCappedNote.
- Resolve the /docs IA collision before wiring links: decide whether /docs becomes the new hub (index.md) and the existing 'How a clip gets made' explainer (docs.vue) moves to getting-started/what-is-bitterclip, and add 301s for old /docs and /mcp plus update the rel=canonical / rel=alternate markdown links. Currently docs.vue and mcp.vue are bespoke .vue pages with a live iframe; the plan must state how they coexist with or are replaced by the markdown pages.
- Treat the @nuxt/content v3 + nuxt-llms + sitemap stack as an unbuilt dependency, not a given: @nuxt/content is not installed (package.json has only nuxt ^4.4.4). Either land and verify the pipeline (generated .md twins, llms.txt, llms-full.txt, sitemap.xml, RSS) in the same change, or scope the content phase to render correctly without it and fix the existing hand-written public/llms.txt + public/mcp.md (which still say 'Moment') in the interim so the machine-readable surface is not stale.
- Soften the absolute 'nothing publishes without your explicit approval' to match the real project-level auto vs approval publish mode (publishing_prepare_publish_set respects the project's mode; auto publishes ready channels without a per-clip click). Phrase the approval-promise so it is not contradicted by auto mode - emphasize nothing is connected/posted until the creator sets it up and chooses the mode.
- Carry the 'fixtures only - stubbed, no backend, no render, no account' caveat from mcp.vue into the LiveEditorEmbed component/snippet so assistants/overview.md does not imply the marketing-page editor can really export.
- Verify supported upload types from the product before the FAQ answers 'What file types can I upload?'; do not ship it as an unanswered placeholder. If it cannot be verified, cut the question.
- Add coverage for finding/downloading/sharing finished clips (the per-project Outputs/library + shareable/embed link via clips_set_embed and the /embed route) - it is sold on the homepage and has zero docs coverage. At minimum add it to the index card grid and one page.
- mcp-tools.yml v1 in the plan is already incomplete vs the live server (~70 tools incl. many speakers_*/publishing_* variants). Either keep the creator-facing list deliberately small and SAY it is a curated subset, or generate it - but do not present a partial hand-typed list as the catalog, repeating the exact mcp.vue mistake. Mark a verification cadence against operation_catalog.rb / mcp_server.rb.
- Ensure connector-scopes.yml surfaces only plain-English plain_label in prose (brief rule: do not print raw scope strings to creators); keep raw scopes internal and cross-check them against apps/bitterclip-rails/app/models/channel_connection.rb (verified matching today: youtube.upload/readonly/yt-analytics.readonly; LinkedIn openid/profile/w_member_social/w_member_social_feed; X tweet.read/users.read/tweet.write/media.write/offline.access).

### Drift risks

- The marquee editor-opening tool is open_workspace, NOT open_recording, but both the grounding-brief tool list and the proposed mcp-tools.yml lead with open_recording. The live MCP instructions are explicit: 'Do NOT use open_recording - recordings are raw inputs; suggesting clips is ALWAYS episode-scoped via open_workspace(selections:)'. If the data file or assistant pages imply open_recording is how the assistant 'opens the editor with a clip selected', that is wrong on day one. The aha-moment narrative must map to open_workspace. mcp-tools.yml must mark open_workspace as the primary editor opener and demote open_recording.
- The mcp-tools.yml hand-listed tool catalog will rot exactly like the table it replaces. The plan/arch correctly say 'longer-term generate from operation_catalog.rb' but the v1 is hand-typed from a one-time read. The live server has ~70 tool names (many speakers_*, publishing_* variants the plan's list omits or simplifies). A single yml is better than 12 copies in prose, but it is still O(1)-to-the-app-NOT, i.e. it drifts from the app unless someone re-reads mcp_server.rb. Flag that the yml needs a verification cadence or a generation step, and that the v1 list in the plan is already incomplete vs the real server.
- connector-scopes.yml hard-codes raw OAuth scope strings (tweet.write, w_member_social_feed, instagram_content_publish, youtube.upload+readonly+analytics) that must match channel_connection.rb. These DO match today (verified), but they live in two repos with no link. Note the cross-repo drift risk explicitly and that the brief says docs should NOT print raw scope strings to creators - the yml should carry only plain_label for rendering; the raw scope is internal-only and should not surface in prose.
- 'free to start, no price' is stated as an absolute rule, but the live homepage (index.vue) already publicly states 'Free - 60 minutes of footage a month' and names a Free / Clip / Pro ladder. The docs being silent on the number while the homepage states it is itself a drift/inconsistency. Decide one policy: either docs may state the same publicly-committed '60 minutes/month free' fact (it is stable, on the live site) or the homepage is the single source and docs link to it. Do not let docs contradict the homepage by implying pricing is unknowable.
- Instagram capability will flip (the decision doc says 'capped, parked, not deleted'). connectors.yml is the right single source, but the InstagramCappedNote is owner-review-gated for good reason - flag that the IG page, the FAQ, and troubleshooting all read from connectors.yml so a future un-cap is one edit, and that none of them should restate the cap in prose.

### Accuracy concerns

- Instagram appears in the live Settings UI as a normal Connect/Reconnect provider (instagram_authorize_path, full OAuth scopes including instagram_content_publish) - identical chrome to X and LinkedIn. The proposed connect/instagram.md says auto-publish is capped and the only path is a manual phone hand-off, and the plan's verify note even doubts whether IG appears in settings. It DOES appear with a Connect button. The page must reconcile this: a creator will see and click 'Connect Instagram'. The honest page has to explain what that Connect button does and does not get you (it authorizes, but direct auto-publish to your feed is constrained by Meta), not pretend the only path is manual. Otherwise the page contradicts the product the moment they open Settings.
- The plan/arch claim the nginx per-file 'location =' blocks 'do not scale to a tree' and a new directory glob 'must be added'. nginx.conf ALREADY has a 'location ~* \.(md|markdown)$' glob (line 52) serving any .md with the right content-type. The architecture overstates the nginx work; the real change is adding /docs/** routing for the SPA/generated tree and the 301s, not inventing markdown handling. Minor but it is presented as a load-bearing constraint.
- @nuxt/content is NOT installed (package.json has only nuxt ^4.4.4 - this is Nuxt 4, and current pages are hand-authored .vue, not markdown). The architecture's entire mechanism (content collections, MDC components, queryCollection, ContentRenderer, nuxt-llms generated llms.txt, generated sitemap/RSS, .md twins via a Nitro prerender hook) is net-new infrastructure that does not yet exist in this repo. That is a large build, not a content task, and it changes how docs.vue/mcp.vue (currently bespoke .vue with a live iframe) coexist with markdown-rendered pages. The plan should not assume this stack is free; it is the single biggest risk to shipping the content.
- The existing public/*.md, public/llms.txt, public/sitemap.xml are currently HAND-MAINTAINED (and llms.txt still says 'Moment'). The architecture proposes replacing all of these with generated artifacts. Until the @nuxt/content + nuxt-llms pipeline is actually stood up and verified to emit them, the plan cannot promise 'generated, never stale'. The synthesizer should treat generation as a dependency to verify, not a given - and should at minimum fix the stale 'Moment' in the existing hand-written llms.txt/mcp.md if the pipeline is not landed in the same change.
- docs.vue currently IS the canonical /docs page ('How a clip gets made', Recording -> Moment -> Clip). The proposed index.md turns /docs into a card-grid overview. The plan's own verify note flags the collision but does not resolve it. This is a real redirect/IA decision (does the 'how a clip is made' explainer become getting-started/what-is-bitterclip, with /docs becoming the hub?) that must be decided, with the old /docs and /mcp URLs 301'd, or existing inbound links and the rel=canonical/alternate markdown links break.
- The 'fixtures only, no backend, no render cost' caveat on the live embed (from mcp.vue) is load-bearing honesty - the embedded editor is stubbed. The LiveEditorEmbed snippet description omits this. If assistants/overview.md shows the live editor without the 'this demo is stubbed' note, a creator may think they can actually export from the marketing page. Carry the fixtures-only caveat into the migrated component.
- publishing must require explicit approval is stated as an absolute ('nothing publishes without your explicit approval'). The real product has a project-level auto vs approval publish mode (publishing_prepare_publish_set 'respects the project's auto/approval publish mode: approval keeps drafts... auto publishes the ready channels'). So in AUTO mode, publishing CAN happen without a per-clip approval click. The approval-promise snippet is mostly true but should be phrased so it is not contradicted by auto mode - e.g. 'you choose per project whether clips auto-publish or wait for your approval; nothing is connected or posted until you set it up'.
