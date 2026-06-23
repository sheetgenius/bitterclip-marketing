# Docs review R1 — fix list

> Not ready to publish as-is, but close — the content prose is largely solid and on-voice; the blocking issues are concentrated and fixable in a focused pass. Four must-fix items dominate: (1) the default-export-shape contradiction (your-first-clip.md says vertical, find-and-share says widescreen; product truth = source aspect / 16:9 landscape fallback) — a factual error on the single most-followed page; (2) the public agent/crawler files (llms.txt, llms-full.txt, docs.md, index.md) still teach the retired 'Moment' model and ignore the new docs entirely; (3) the sitemap omits all 17 new docs pages, leaving the site invisible to crawlers; (4) 8 callouts render as broken plain text because they use the retired GitHub-blockquote syntax instead of the committed ::callout component. After those, a second tier of clarity/completeness fixes matters for a non-technical audience: stop surfacing snake_case tool names as the thing 'to know', close the missing Claude-paid-plan prerequisite and the ChatGPT/Claude URL-field gap, surface the Pro/embed prerequisite before its walkthrough, and reconcile the verification-gate and 'Outputs' naming inconsistencies. The remaining items are voice de-templating and DRY/generation hygiene. Verified the four high-severity claims directly against the repo; dropped nothing as wrong — the input reports were accurate, and I merged the duplicate export-default finding (raised independently by 4 frontiers) into one fix plus a cross-cutting note. Estimated effort: ~half a day for the four blockers, another half for the clarity/completeness tier.

## Fixes by file

### content/getting-started/your-first-clip.md

- **[HIGH]** (Accuracy / Completeness / Clarity / DRY) — Step 7 (line 78) says "BitterClip renders a vertical MP4 by default" — FALSE and self-contradicting. The verified product default follows the source aspect (composition_operations.rb default_aspect_for_resolved -> derive_aspect_from_source, FALLBACK_ASPECT="16:9" landscape); find-and-share-clips.md:39 correctly says "By default it's widescreen." Rewrite step 7 to match: "renders an MP4 with captions burned in; by default it keeps the shape of your source (a widescreen recording stays widescreen), and you can pick vertical/square at export." Verified by grep: the two pages literally contradict. ALSO surface the aspect-ratio choice as an explicit step (most creators want vertical for Shorts/Reels and will be stuck) and close the export-invocation gap between step 6 and step 7 — the page never says where the Export control is or what options appear (aspect, captions toggle).
- **[MEDIUM]** (Completeness) — Move the email-verification gotcha onto step 3 (upload) or step 4 (transcribe) where the creator actually hits it — currently it's only attached to sign-up. troubleshooting.md states upload+transcribe are both blocked pre-verification. Add a one-line Heads-up at the upload step pointing to troubleshooting.
- **[LOW]** (Clarity / Accuracy) — Line 79 "uses one export credit" drops undefined billing jargon on the first clip. Either remove from the happy path or add a half-sentence reassurance + pricing link. Also: first 'episode' mention (step 4, line 51) is redefined-everyday-word with no inline link to the What-is-BitterClip glossary — add the link the way overview.md does. Possible free-tier watermark/resolution caveat: free plan declares watermark:true / max 1080 in billing_plans.yml (declared, only export_credits enforced today) — re-verify enforcement before publishing; if live, add a light non-numeric note.
- **[LOW]** (Voice) — Step 6 (lines 70-72) parenthetical "the same gesture from step 5, now used to refine instead of choose" is talk-down filler (negative-parallelism tell). Trim to "the same thing you did in step 5."

### content/getting-started/find-and-share-clips.md

- **[HIGH]** (Completeness / Clarity) — "Share a clip with a link" section: (1) the Pro-plan requirement is buried at the bottom (line ~60) after two paragraphs of how-great-it-is — move it up as a prerequisite callout; (2) the section never says WHERE the embed toggle lives or that it's per-clip (clips_set_embed exists) — add the concrete gesture/location (e.g. the clip's Outputs card) or a screenshot placeholder, mirroring the concrete Download-button description.
- **[MEDIUM]** (Voice) — Lines 27-28: "the recording it came from" repeats in two consecutive sentences — cut the echo. Line 42 "Save it, drop it into a post, hand it to someone. It's yours to use anywhere." is a limp triple-imperative + hollow filler — trim to one or two concrete actions and drop "yours to use anywhere."

### content/assistants/overview.md

- **[HIGH]** (Clarity) — Line 51 tells a zero-coding reader the one thing "to know" is the snake_case function name `open_workspace` — directly contradicts the page's "just ask in plain words" promise. Rephrase to the capability: "The main thing it does is open your episode in the editor with a strong clip already picked." Drop the inline function name (it's in the table for the curious).
- **[LOW]** (Voice / Completeness) — Line 22 "go from a long recording to a clip you like in a single message" is hype that the page's own back-and-forth tuning contradicts — soften to "without leaving the chat." Also: the tool table advertises upload tools (open_uploader / recordings_request_upload) but no page documents uploading from chat (connect pages route back to the browser) — add one line confirming you can ask the assistant to add a recording / pull from a URL.

### content/_data/mcp-tools.yml + app/components/content/McpTools.vue

- **[HIGH]** (Clarity) — The rendered tool table leads with raw snake_case identifiers (open_workspace, episode_render, recordings_request_upload...) under a column headed "Tool", as <code> — pure jargon to a creator, undercutting the "just ask in plain words" promise. Lead each row with a plain verb phrase ("Open a clip in the editor", "Get the finished video"), demote or drop the raw name, and rename the column to "What you can ask for". Also tighten the episode_create row (verified line 46): "Saves the clip you and the assistant chose so it's ready to render" overstates — episode_create persists/saves with no render and no credit charge; episode_render is the separate render step.

### content/assistants/connect-claude.md

- **[HIGH]** (Completeness) — Missing prerequisite: custom connectors require a paid Claude plan (Pro/Team/Enterprise) and aren't on the free tier. The current NOTE only vaguely says "aren't on every plan or every version." Add an explicit Before-you-start / Heads-up callout so a free-Claude creator can diagnose a missing menu instead of assuming they did it wrong (connect-chatgpt.md handles its Developer-Mode situation clearly by comparison).

### content/assistants/connect-chatgpt.md

- **[MEDIUM]** (Completeness / Clarity) — The page tells the creator to "point it at BitterClip" but never says which field gets the /mcp URL. The endpoint is rendered in the embedded ::assistant-connection-intro snippet but the prose is vague. Mirror connect-claude.md: after the snippet add one sentence — "paste that address (it ends in /mcp) into ChatGPT's connector URL field, then sign in." Apply the same explicit reference fix to connect-claude.md lines 34-36 ("that address above" — point at it unambiguously).

### content/publishing/publish-a-clip.md

- **[MEDIUM]** (Clarity / Voice) — "package" is invented internal jargon defined once mid-paragraph then reused heavily and in the whole-episode section without re-anchoring. Pull the definition to the top of the section as a short callout ("A package is just your finished post for one channel — clip, caption, destination — staged for you to check"), or consider "draft post". Also cut the repeated if/else approval-mode explanation (ApprovalPromise component + prose lines 48-51 + whole-episode lines 62-63 all restate the same branch) and drop the hollow "Either way it comes back to the setting you chose above." Reduce the page's em-dash density (11, far above the ~0-1 of neighbors).
- **[MEDIUM]** (Completeness) — No documented path to publish a COMPOSITION / longer assembled video — only single clips and "a whole episode at once" — yet find-and-share-clips.md teases "longer videos you've put together" and composition-publish tools exist. Add a short "Publishing a longer video" note, or stop teasing longer videos if out of scope.

### content/connect/youtube.md

- **[MEDIUM]** (Consistency / Clarity / DRY) — (1) Line 50 "The warning above is almost always the cause" — the Callout component renders type=warning as "Heads up" (verified Callout.vue:18), not "Warning"; reword to "the heads-up above." (2) Line 31 field "YouTube Studio channel URL or ID" + the UC-prefix instruction is jargon with no where-to-find-it — lead with the easy path (copy the channel web address) and demote channel-ID to a parenthetical fallback. (3) The "set your destination channel first" instruction is written out in full prose on BOTH youtube.md and troubleshooting.md:46 — extract a YouTubeDestinationChannel snippet (the Brand-Account warning twin is already componentized). (4) Add a note that YouTube must publish first for the YouTube-link-in-comments cross-post behavior to attach (linkedin.md hints at it; the hub page omits it).

### content/help/troubleshooting.md

- **[MEDIUM]** (Completeness / DRY) — Add two missing entries that other pages dead-link to: a rejected-upload fix (faq.md has the re-export guidance; troubleshooting.md doesn't) and a stuck-publish / "verify before retrying" entry (publish-a-clip.md explicitly sends users here for a stuck post). Also single-source the email-verification gate: troubleshooting.md says upload+transcribe are blocked while your-first-clip.md says "uploading and exporting" — the two prose lists disagree; extract the canonical gated-action list + banner string into a snippet.

### content/getting-started/projects-and-collaborators.md

- **[LOW]** (Voice / Completeness / Clarity) — The editor/reviewer/viewer role triad is enumerated ~4 times in one page (intro, bullets, prose example, and "What an invited collaborator can do") — cut one; keep the bullets canonical and shorten the later section to the practical example. Add one sentence on whether an invited editor can publish to the owner's connected channels (project-isolation deferred area — owners will assume they can). Define 'studio'/'workspace' on first use or standardize one term.

### content/connect/instagram.md

- **[LOW]** (Completeness) — "What's coming" implies the current personal-account connection will suffice for future auto-publish, which the InstagramCappedNote component's own facts (professional account + linked Facebook Page) contradict. Soften to note direct posting will require those when it lands. (Capped framing itself is verified accurate — keep it.)

### content/connect/linkedin.md, content/connect/x.md, content/connect/youtube.md

- **[MEDIUM]** (Consistency) — The Settings sub-section for connecting channels is named three ways: x.md "Publishing accounts", linkedin.md "connections", youtube.md "the YouTube section" (shared ConnectPrereqs only says "under Settings"). Verify the real app label and standardize one phrase across all connect pages. Also vary the near-identical "send your clips straight to your feed without leaving BitterClip" opener that templates across all four connect pages.

### content/help/faq.md

- **[LOW]** (DRY / Voice) — Line 35 hard-codes [app.bitterclip.com](https://app.bitterclip.com) in prose instead of reading site.yml app_origin (every other surface single-sources it via snippet). Route through an AppLink/ChatVsWebApp snippet; same for the inline mention in overview.md:72. Also: the "browser when you want X; assistant when you'd rather Y" A/B sentence is re-typed verbatim-in-shape across faq.md, index.md, overview.md — single-source it as a snippet or genuinely vary it.

### content/index.md

- **[LOW]** (Voice / Discoverability) — Line 23 "Either way works, so do whatever feels easier" is hollow restatement — end at "or hand the job to your AI assistant." Separately, the hub (served at /docs) declares section:getting-started order:0, colliding with what-is-bitterclip.md (also getting-started, order 0) — give the hub a distinct top-level position or bump what-is-bitterclip.md to a non-zero order so getting-started has a clean sequence and the hub doesn't get lumped in.

### app/components/content/AssistantConnectionIntro.vue

- **[LOW]** (Voice) — Doubled no-install reassurance in adjacent paragraphs ("There's nothing to install" + "Nothing runs on your computer and there are no settings files to fuss with"). Merge into one.

### app/components/content/HowTheCutWorks.vue

- **[LOW]** (Voice) — "trust that it says what was really said" (lines 24-25) is a promotional flourish — state the mechanism plainly: "You can always trace a clip back to the exact moment it came from." (The "clipped off" pun on line 18 may be intentional charm — judgment call.)

## Cross-cutting

- DEFAULT EXPORT SHAPE (highest-leverage fix): your-first-clip.md and find-and-share-clips.md state OPPOSITE defaults (vertical vs widescreen); instagram.md assumes default is not vertical. Verified product default = source aspect, falling back to 16:9 landscape. Pick the one true statement, single-source it into a snippet (or _data value), and render it in both pages so it can never drift again.
- STALE 'Moment' NOUN IN PUBLIC AGENT/CRAWLER FILES (high, 4 files): public/llms.txt (2x), public/llms-full.txt (18x), public/docs.md (3x), public/index.md (8x) all still teach the retired Recording->Moment->Clip model. Content/ is clean — the only 'Moment' is the deliberate reassurance note in what-is-bitterclip.md:31. These public mirrors predate the docs site (dated Jun 12) and are advertised as the canonical agent index via robots.txt/nuxt.config.ts. Regenerate all four from current content with Recording->Episode->Clip and the new /docs/* pages. Keep the what-is-bitterclip.md note as the single sanctioned mention of 'Moment'.
- SITEMAP MISSES THE ENTIRE DOCS SITE (high): public/sitemap.xml lists only 5 legacy pages + .md mirrors (12 <loc>, verified) — NONE of the 17 new /docs/* pages. The whole creator docs site is invisible to crawlers/AI indexers; lastmod is stale. Generate the sitemap from the docs collection.
- CALLOUT SYNTAX SPLIT (high consistency, 8 callouts in 6 files): connect-chatgpt.md:38, connect-claude.md:38, overview.md:61, youtube.md:40+56, instagram.md:39, x.md:41, what-is-bitterclip.md:30 use GitHub-style '> [!NOTE]/[!TIP]' blockquotes; 14 others correctly use ::callout. No GitHub-alert transformer is configured, so the blockquotes render as plain text containing a literal '[!NOTE]' line — visibly broken vs the styled aside. Convert all 8 to ::callout{type=...}. Then fix grounding-brief.md:87 and the frontiers rubric, which still endorse the retired '> [!TIP]' form (they contradict the committed Callout.vue).
- NAVIGATION ORDER COLLISIONS + NO NAV CONSUMER: assistants section has connect-chatgpt.md and connect-claude.md both at order 2; help section has faq.md and troubleshooting.md both at order 1; the hub ties with what-is-bitterclip.md at order 0. Assign unique orders per section. Note: the docs render path (app/pages/docs/[...slug].vue) currently ships NO sidebar/TOC/breadcrumb/prev-next, so navigation.order has no rendered consumer today and cross-section discoverability rests entirely on inline ::next-steps blocks — fix the orders now so they're correct when the sidebar ships.
- DOCS PAGES EMIT NO PER-PAGE SEO/SOCIAL METADATA: [...slug].vue sets only name=description — no canonical, no og:/twitter: tags, no consistent <title> suffix, and the declared per-page ogImage field is unconsumed. Social/AI previews of every /docs/* URL fall back to the generic homepage card. Add per-page canonical + og:title/description + og:image (page.ogImage ?? site.og_image_default) and a consistent title suffix.
- 'OUTPUTS' SURFACE NAMED 4 WAYS (consistency): 'Outputs tab' / 'Outputs grid' (find-and-share-clips.md), 'Outputs gallery' (troubleshooting.md:40), 'Outputs tab - the gallery' (faq.md:43), bare 'Outputs' (your-first-clip.md:82). Standardize on 'Outputs tab' as the referring noun; reserve grid/gallery for one-time descriptive asides.
- SINGLE-SOURCING / GENERATION GAPS (DRY, lower urgency): add a CI check that every name in mcp-tools.yml exists in operation_catalog.rb (the file's own comment flags the intent to generate it); consider driving the changelog from _data/changelog.yml (date/summary fields already reserved in content.config.ts) and reusing snippets (e.g. ::instagram-capped-note) so feature facts can't drift.
- SOURCE LINE-WRAPPING STYLE SPLIT (low): 9 files soft-wrap (one long line/paragraph), 7 hard-wrap at ~90 cols. Pick one convention and document it in the protocol; no rendered-output change but noisier diffs.
- TEMPLATED VOICE CADENCE ACROSS PAGES: the 'recording it came from' phrase, the 'straight to your feed without leaving BitterClip' connect-page opener, and the 'browser when you want X; assistant when you'd rather Y' A/B sentence each recur near-verbatim across multiple pages — vary or single-source them so a reader hitting two pages doesn't see the same stock construction.
