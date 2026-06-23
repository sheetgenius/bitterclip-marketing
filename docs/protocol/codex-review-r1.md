# Codex review r1 - creator docs content

Scope reviewed: `content/**/*.md`, `app/components/content/`, `content/_data/*.yml`,
`docs/protocol/grounding-brief.md`, and `docs/protocol/frontiers.md`.
Product evidence came from `/Users/c3po/co/bitterclip/apps/bitterclip-rails`
controllers, services, models, MCP server instructions, and tests.

## Findings

### BLOCKER - Render defaults are contradictory and overclaim "vertical by default"

Docs:
- `content/getting-started/your-first-clip.md:78-80` says export renders a
  vertical MP4 by default, with captions burned in, and uses one export credit.
- `content/getting-started/find-and-share-clips.md:39-41` says the default is
  widescreen.

Product evidence:
- Browser clip package fallback is 9:16 only on the legacy clip package path:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/controllers/clip_packages_controller.rb:46-54`.
- Episode/composition creation now defaults to the source recording's native
  aspect, with unprobed sources falling back to landscape:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/composition_operations.rb:178-186`
  and `:2541-2549`.
- Platform defaults make the default publish set YouTube, LinkedIn, and X, all
  16:9:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/platform_preset.rb:27-33`.

Why it matters: a creator deciding whether the first export is phone-ready will
get different answers on adjacent pages. The product does not have one global
"vertical by default" rule.

Fix: create a single `rendering` data/snippet source that distinguishes browser
clip package fallback, episode/composition render default, and platform preset
exports. Then replace both page statements with the exact source-aware rule.

### BLOCKER - Instagram "Connect" copy is too broad for the actual Meta path

Docs:
- `content/connect/instagram.md:17` says the Connect Instagram button works and
  signs the user into Instagram.
- `content/connect/instagram.md:24` says choosing it signs you in with
  Instagram "the same way the other channels do."
- `content/_data/connectors.yml:31` says "Connecting Instagram signs you in just
  fine."
- `app/components/content/InstagramCappedNote.vue:26-31` repeats that the button
  works, then buries the Facebook Page / professional-account constraints.

Product evidence:
- The Instagram client is explicitly "CAPPED" and "parked", with manual
  share-to-phone as the forward path:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/instagram_oauth_client.rb:5-16`.
- The OAuth flow is Facebook Login, not a generic Instagram login, and discovers
  a Facebook Page with a linked `instagram_business_account`:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/instagram_oauth_client.rb:36-45`
  and `:75-85`.
- The connection stores the Page token and Instagram business account metadata:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/controllers/instagram_connections_controller.rb:47-64`.
- Required scopes include `instagram_basic`, `pages_show_list`,
  `pages_read_engagement`, `business_management`, and
  `instagram_content_publish`:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/models/channel_connection.rb:25-26`.

Why it matters: a personal-account creator can read this as "click Connect
Instagram and you are signed in", then hit a Meta Page/business-account dead end.
That is not the same OAuth shape as YouTube, X, or LinkedIn.

Fix: lead with "Instagram direct publishing is capped; the working path is
download/manual phone hand-off." If the Connect button is mentioned, say it is a
Meta/Facebook Page authorization path for eligible professional accounts, not a
general Instagram sign-in. Add Instagram to `connector-scopes.yml` only if the
docs intentionally explain that advanced/capped path.

### BLOCKER - The MCP data is a hand-picked list with workflow holes, and the protocol brief still seeds the wrong opener

Docs/data:
- `docs/protocol/grounding-brief.md:56-59` lists `open_recording` first in the
  "Real MCP tools" example and does not name `open_workspace` there.
- `content/_data/mcp-tools.yml:1-7` says the list is verified and curated, but
  the row set omits several model-visible tools needed to explain real workflows.
- `content/_data/mcp-tools.yml:34-38` includes `recordings_request_upload` as
  "upload a file for you directly" without showing the required
  `recordings_finalize_upload` / `recordings_abort_upload` follow-up.
- `app/components/content/McpTools.vue:31-33` labels the table as a short tour
  but does not expose the source revision or cluster boundaries.

Product evidence:
- Model-visible MCP tools include `recordings_finalize_upload`,
  `recordings_abort_upload`, `episode_edit`, `publishing_update_approval_copy`,
  publish-state getters, package creation tools, reconciliation tools, and
  cleanup tools:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/operation_catalog.rb:65-107`.
- The live MCP instructions make `open_workspace(composition_id, selections:)`
  the required action for clip suggestions and explicitly say not to use
  `open_recording` for clip suggestion:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:126-138`.
- Raw ingest workflow is `recordings_request_upload` -> `recordings_finalize_upload`
  and recordings remain raw inputs:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:145`.

Why it matters: the data file is presented as a curated truth source, but it
mixes partial workflows with missing required follow-ups. The protocol brief also
still contains the old `open_recording` trap that the user explicitly called out.

Fix: update `grounding-brief.md` so the example list starts with
`open_workspace`, not `open_recording`. Generate or snapshot
`mcp-tools.yml` from `OperationCatalog::MODEL_VISIBLE_MCP_TOOL_NAMES`, then mark
each displayed row as either a complete mini-workflow or a non-actionable sample.
At minimum, add `recordings_finalize_upload`, `recordings_abort_upload`,
`episode_edit`, the publish package/status tools, and the publish-state getters,
or remove incomplete upload/publish claims from the creator table.

### HIGH - Export-credit language is true only for fresh or stale renders

Docs:
- `content/getting-started/your-first-clip.md:78-80` says rendering "uses one
  export credit."
- `content/_data/mcp-tools.yml:49-56` describes render/status without the
  idempotency/no-second-credit rule.

Product evidence:
- MCP instructions say `episode_render` charges one credit but is idempotent:
  current or in-flight renders are no-ops:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:140-143`.
- Tests prove first render charges exactly one credit, a queued re-render charges
  no second credit, and an already-ready render charges no credit until a
  structural edit makes it stale:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/test/services/bitterclip/episode_mcp_tools_test.rb:736-795`.

Why it matters: support and billing questions will hinge on this exact behavior.
"Rendering uses one credit" is too broad.

Fix: replace with "A new or stale render uses one export credit. Re-asking while
a render is already queued, or when the current render is ready, does not spend
another credit."

### HIGH - Captions are documented as always burned in, but product behavior is conditional

Docs:
- `content/getting-started/your-first-clip.md:78-79` says captions are burned in.
- `content/getting-started/find-and-share-clips.md:39-46` says the MP4 has
  captions already burned in and no separate caption file is needed.
- `content/changelog/index.md:36-37` says exported clips come with captions
  burned in.

Product evidence:
- Captions are enabled from segment `caption_mode` unless every mode is `off`:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/composition_operations.rb:2536-2539`.
- The browser clip-package path defaults captions to true, but still accepts a
  captions param:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/controllers/clip_packages_controller.rb:52-54`.

Why it matters: "always burned in" is a stronger claim than the product. A user
who disables captions or edits caption mode will see different output.

Fix: say "Captioned exports burn captions into the MP4 by default" and add "if
you turn captions off, the video exports without burned-in captions." Single-source
this in the same render defaults snippet as the aspect/credit language.

### HIGH - Connector prerequisites incorrectly require an uploaded recording before OAuth

Docs/components:
- `app/components/content/ConnectPrereqs.vue:10-17` is shared across connector
  and publishing guides and always requires "A recording you've uploaded."
- It is used on connector setup pages such as `content/connect/instagram.md:19`
  and assistant setup pages such as `content/assistants/connect-chatgpt.md:21-24`
  and `content/assistants/connect-claude.md:21-24`.

Product evidence:
- YouTube OAuth requires an authenticated user and a target channel; it does not
  require an uploaded recording:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/controllers/youtube_connections_controller.rb:110-124`.
- Instagram, X, LinkedIn, ChatGPT, and Claude connection setup also do not need a
  pre-existing recording; only making a first clip does.

Why it matters: the shared snippet turns a later "make your first clip" need into
a fake prerequisite for connecting a provider. It also pollutes every connector
page with a fact that will not age well.

Fix: split `ConnectPrereqs` into separate snippets:
`AccountPrereq`, `ConnectorPrereqs`, `AssistantClipPrereqs`, and
`PublishPrereqs`. Connector pages should require only account/sign-in and any
provider-specific target (YouTube channel). Publishing pages should require a
ready export and a connected publishable channel.

### HIGH - Publishing docs imply all connected channels, but the capstone only supports YouTube, LinkedIn, and X

Docs:
- `content/publishing/publish-a-clip.md:18-20` says BitterClip can send exported
  clips to the channels you connected.
- `content/publishing/publish-a-clip.md:57-63` says it can prepare a whole
  episode for every connected channel in one step.
- `content/index.md:53-55` says clips can go straight out to your feed.
- `app/components/content/ApprovalPromise.vue:21-23` says ready clips post to
  your connected channels on their own once auto mode is enabled.

Product evidence:
- The publish-set channel resolver only keeps `{youtube, linkedin, x}` and drops
  unsupported defaults such as Instagram/TikTok:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/publishing_operations.rb:2064-2084`.
- MCP instructions say publishing everywhere uses a ready export id or rendered
  composition/episode id and prepares packages per supported channel:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:147-156`.

Why it matters: this creates a direct contradiction with the Instagram guide. If
a creator connects Instagram, "every connected channel" is false.

Fix: change the reusable approval/publishing language to "connected publishable
channels: YouTube, LinkedIn, and X." On the publish page, say Instagram remains a
manual hand-off and unsupported defaults are ignored by the capstone.

### HIGH - Assistant pages overpromise the first chat result as a finished clip

Docs:
- `content/assistants/connect-chatgpt.md:17-19` says a finished clip comes back,
  ready to review.
- `content/assistants/overview.md:18-21` says the user goes from a long
  recording to a clip they like in a single message.
- `content/assistants/connect-claude.md:57-64` compresses "review", "export",
  and "finished clip lands in your project" into one smooth step.
- `app/components/content/ExampleClipPrompt.vue:18-22` says BitterClip opens the
  episode and the cut is ready to review, then it adjusts until the clip is right.

Product evidence:
- The required clip-suggestion action is opening the editor with a pre-selected
  episode-time selection via `open_workspace`, not returning a finished rendered
  video:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:126-138`.
- Creating/rendering a decided clip is a separate `episode_create` /
  `episode_render` / `episode_status` flow:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:140-143`.

Why it matters: this is the marquee promise. It should teach the actual aha
moment: editor opened with selection, then review/tune, then render.

Fix: rewrite all assistant first-clip copy as "the editor opens with a suggested
clip selected." Reserve "finished video" for the later render/status step and
mention the export-credit rule there.

### MEDIUM - Upload file-type guidance is extension-shaped, but the product gates MIME type

Docs:
- `content/getting-started/your-first-clip.md:40-42` says any common video or
  audio file works.
- `content/help/faq.md:70-74` says re-exporting as mp4, mov, or mp3 fixes rejected
  files.

Product evidence:
- Upload validation accepts `audio/*` or `video/*` content types and enforces
  plan-specific byte limits capped by a 20 GB global ceiling:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/upload_validator.rb:93-143`.

Why it matters: the failure mode is not the filename extension; it is the tagged
media type, file size, and whether the source can actually be processed. The docs
will mislead support triage if a `.mp4` is tagged wrong or has bad media inside.

Fix: say "BitterClip accepts files your browser/device identifies as audio or
video; size depends on your plan." For rejected files, recommend re-exporting
with a standard audio/video codec and checking that the file is recognized as
audio/video, not just changing or naming extensions.

### MEDIUM - Signup and verification copy collapses password signup and Google signup

Docs:
- `app/components/content/SignupCta.vue:11-13` says BitterClip will email a
  verification link when you sign up.
- `content/help/troubleshooting.md:20-25` correctly notes Google signup is already
  verified, but the reusable signup CTA does not.

Product evidence:
- Password signup redirects with: "Welcome to BitterClip - your free workspace is
  ready. Verify your email, upload a recording, then use it with ChatGPT or
  Claude.": `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/controllers/registrations_controller.rb:23-25`.
- Google signup verifies the email immediately and redirects with:
  "Welcome to BitterClip - your free workspace is ready. Upload a recording to
  get started.": `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/controllers/google_auth_controller.rb:79-94`.
- The banner says "Verify your email to unlock transcription - we sent a link to
  <email>." and the button is "Resend email":
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/views/layouts/application.html.erb:53-57`.
- The email subject is "Verify your email to start transcribing on BitterClip":
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/mailers/email_verification_mailer.rb:1-7`.

Why it matters: the CTA is reused as global onboarding truth, but one of the
visible signup paths does not send the user through the email-verification gate.

Fix: make `SignupCta` say "If you sign up with email and password, we send a
verification link; Google sign-in verifies your email during sign-in." Put the
exact welcome/banner/email subject in a small `signup.yml` data file or a
commented test fixture so future product copy changes are checked once.

### MEDIUM - Free/pricing claims are scattered and stronger than the protocol allows

Docs:
- `content/help/faq.md:18-20` says users can sign up and start clipping without
  paying anything.
- `content/changelog/index.md:23-24` says "Start free, stay free" and "The free
  account is the floor, not a trial."
- `app/components/content/ConnectPrereqs.vue:12` and
  `app/components/content/SignupCta.vue:11-13` repeat "free to start."

Product/protocol evidence:
- The product signup flow does activate a free plan at signup:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/signup.rb:2-6`
  and `:30-40`.
- The protocol explicitly says pricing specifics are volatile and should be
  linked, not stated:
  `docs/protocol/grounding-brief.md:32-38`.

Why it matters: "free to start" is supportable, but "stay free" and "start
clipping without paying anything" are product/billing promises copied across
pages. If limits or plan behavior changes, updates become O(pages).

Fix: keep one reusable billing/free snippet backed by `site.yml` or a dedicated
`billing.yml`. On authored pages, say "free to start" and link to the live
signup/pricing surface. Do not restate lapsed-plan behavior in the docs changelog
unless the product team wants that as a durable public commitment.

### MEDIUM - Connector scope data is incomplete and not aligned with connector content

Docs/data:
- `content/_data/connector-scopes.yml:1-7` claims per-connector permissions are
  single-sourced from the app, but it only includes YouTube, X, and LinkedIn.
- `content/connect/instagram.md:22-27` has a "What the Connect button does"
  section without rendering permission data.
- `app/components/content/ConnectorScopes.vue:21-27` would render an empty list
  if called with `connector="instagram"`.

Product evidence:
- The product has explicit Instagram required scopes:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/models/channel_connection.rb:25-26`.

Why it matters: the docs have a connector page for Instagram but the supposedly
single-sourced connector permissions omit it. That is a design smell even if the
page decides not to show raw/advanced permissions.

Fix: add an Instagram row group marked `capped: true` / `advanced_only: true`, or
make the data file explicitly `publishable_connector_scopes.yml` so the omission
is intentional. Add a build-time guard that every connector page either has
scope data or declares why not.

### MEDIUM - "Everything in chat is also in the browser" is overbroad

Docs:
- `content/help/faq.md:37-39` says everything users can do by chatting can also
  be done in the browser.

Product evidence:
- The MCP server exposes assistant-specific flows and raw/source/tool workflows
  with their own instructions and constraints:
  `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb:126-158`.
- The web app has settings/library/channel setup, while the assistant is scoped
  to finding, reviewing, tuning, status, and publishing checks; the docs already
  state that narrower split at `content/assistants/overview.md:66-75`.

Why it matters: the FAQ claims total parity, then the assistant overview claims
a role split. That is not maintainable and probably not true feature-for-feature.

Fix: say "The core clipping workflow exists in both places. The browser is where
you manage the full library, settings, and connections; chat is best for finding
and tuning clips."

### MEDIUM - Callout conventions are inconsistent with the component system

Docs:
- `content/connect/instagram.md:39-40`,
  `content/connect/youtube.md:40`,
  `content/connect/youtube.md:56`,
  `content/connect/x.md:41`,
  `content/getting-started/what-is-bitterclip.md:30`,
  `content/assistants/connect-chatgpt.md:38`,
  `content/assistants/connect-claude.md:38`, and
  `content/assistants/overview.md:61` use GitHub-style `> [!NOTE]` /
  `> [!TIP]` blocks.
- `app/components/content/Callout.vue` exists, and many pages already use
  `::callout`.
- `docs/protocol/grounding-brief.md:85-88` still tells authors to use
  GitHub-style callouts, which conflicts with the MDC component pattern.

Why it matters: this is not just formatting. If the renderer treats blockquotes
and MDC components differently, visual styling and semantic consistency will
drift. The brief is currently teaching the older convention.

Fix: choose one convention. For Nuxt Content/MDC pages, standardize on
`::callout{type="note"}` / `::callout{type="tip"}` and update the protocol brief.

### LOW - Navigation order is duplicated within sections

Docs:
- `content/assistants/connect-chatgpt.md:4-7` and
  `content/assistants/connect-claude.md:4-7` both use order `2`.
- `content/help/faq.md:4-7` and `content/help/troubleshooting.md:4-7` both use
  order `1`.

Why it matters: if the docs navigation sorts solely by section/order, page order
can vary by filesystem or query behavior.

Fix: assign unique orders within each section, or make the nav builder sort by
`section`, `order`, then `title` explicitly and document that tie-breaker.

### LOW - Voice still contains support-risky absolutes and AI-ish compression

Docs:
- `content/assistants/connect-claude.md:59-64` says "If the words read well, the
  clip plays well."
- `content/connect/instagram.md:29-35` says BitterClip "does the hard part" and
  can letterbox your clip into vertical layout without tying that to the actual
  export path.
- `content/assistants/overview.md:18-21` compresses setup, clip selection, review,
  and satisfaction into "a single message."

Why it matters: these lines sound smooth but hide conditions. In creator docs,
smooth-but-wrong copy creates support tickets.

Fix: replace aphorisms with concrete product states: selected words, editor
opened, render queued, output ready. Keep short sentences, but avoid compressing
multi-step workflows into one confident sentence.

## Prioritized punch list

1. Replace all render/aspect/caption/credit claims with one generated or
   manually single-sourced `RenderDefaults` snippet/data file. Block publication
   until `your-first-clip.md` and `find-and-share-clips.md` stop contradicting
   each other.
2. Rewrite Instagram around the actual capped Meta/Facebook Page path. Stop
   saying it signs into Instagram "the same way" other channels do.
3. Fix MCP source-of-truth drift: update `grounding-brief.md`, regenerate or
   audit `mcp-tools.yml`, and ensure `open_workspace` is the opener while
   upload/publish rows do not show partial workflows as complete.
4. Split `ConnectPrereqs.vue` by workflow so OAuth setup pages do not require an
   uploaded recording.
5. Tighten publishing docs to YouTube, LinkedIn, and X for publish-set/auto
   publish, with Instagram explicitly carved out.
6. Rewrite assistant first-clip language to "opens editor with a selected clip"
   first, then separate review, render, status, and credit behavior.
7. Fix upload/file-type copy to describe audio/video MIME recognition and plan
   size limits.
8. Single-source signup verification, free/billing, connector scopes, and
   callout conventions so future API/provider changes are O(1), not O(pages).
