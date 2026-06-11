# BitterClip landing editor conversion journal

Date started: 2026-06-11  
Goal thread: `019eb816-863d-7bb1-81b1-25e4c48dfdc7`  
Primary surfaces: `bitterclip.com` landing page and `app.bitterclip.com/embed/*` demo hosts

## Objective

Make the landing-page editor demo a conversion-quality product experience without
opening anonymous inference, rendering, publishing, billing, or account access.
The demo should stay the real editor component, but run in an explicit demo host
that answers expensive or stateful calls with honest, useful stubs.

## Source inventory

- `docs/landing-editor-conversion-analysis.md` is the prior deep inventory and
  research packet. It identifies two current trust failures: Generate silently
  doing nothing, and Download reporting success without delivering a file.
- `app/pages/index.vue` owns the public page, hero phone composition, iframe
  activation, signup links, GA bootstrap, and mobile gating for the mid-page
  editor.
- `public/index.md`, `public/llms.txt`, `public/llms-full.txt`, and the smoke
  tests must stay aligned with homepage claims.
- `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/views/embed/recording.html.erb`
  hosts the full real workspace widget for the hero phone and stubs the chat
  host protocol.
- `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/views/embed/clip_demo.html.erb`
  hosts the mid-page transcript editor demo.
- `/Users/c3po/co/bitterclip/apps/bitterclip-rails/app/javascript/components/composition-editor/component.js`
  is the shared editor surface used by the app, ChatGPT/Claude widget, and the
  marketing demo.

## Workstreams

### P0-A: Measurement

Forward meaningful demo events from embed hosts to the marketing page and then
to GA. Required events: `editor_opened`, `editor_closed`, `clip_created`,
`generate_started`, `generate_completed`, `export_started`, `export_revealed`,
`download_clicked`, `download_failed`, and publish-sheet intent.

Verification gates:
- `index.vue` accepts demo events only from known demo iframes.
- GA calls are no-op safe when `gtag` is absent.
- Signup links gain stable attribution for demo-engaged sessions.
- Smoke tests cover event ingestion without depending on live GA.

### P0-B: Broken-promise controls

No visible control in the demo may silently no-op or claim a successful action
that did not happen.

Targets:
- Generate returns rotating canned title/description copy with short fake
  latency.
- Download either triggers a real file/open fallback or fails honestly so the
  editor changes to "Open MP4 in browser."
- Unknown tool calls should be logged/telemetried as demo stubs, not used as a
  silent hiding place for user-visible features.

Verification gates:
- Controller/view tests assert the demo host contains the canned Generate path.
- Browser verification proves the generated title changes and Download exposes a
  usable artifact or fallback.

### P0-C: Demo-aware conversion copy

The shared editor should know when it is inside the landing demo and avoid
account-scoped production copy.

Targets:
- Replace "uses one export credit" with demo/free-sample language in demo mode.
- Add a soft conversion row after export reveal: do this with your own footage,
  start free, 60 minutes/month.
- Publish-not-connected state should explain the real next step after signup.

Verification gates:
- Demo copy appears only for `hostContext.host === "demo"`.
- Production/app hosts retain account-accurate credit copy.
- The CTA URL carries source attribution.

### P1-D: Watermarked artifact

Use a pre-rendered watermarked MP4 for demo downloads. Do not trigger live
rendering from anonymous traffic.

Targets:
- Produce/store watermarked demo clip variants safely.
- Download file carries BitterClip branding.
- Aspect selector is honest: either use matching variants or constrain the demo.

Verification gates:
- No anonymous export/render provider calls.
- Downloaded/opened artifact is inspectable and branded.
- Watermark removal framing points to paid plans without interrupting the demo.

### P1-E: Discoverable interactivity

Make the hero phone read as touchable, not decorative.

Targets:
- Add a subtle idle affordance that disappears after first interaction.
- Avoid autonomous playback or carousel-like motion.

Verification gates:
- Desktop visual check: hint is readable and does not crowd the phone.
- Mobile visual check: hint/gate does not add clutter.
- Event data can compare pre/post `editor_opened` rate.

### P1-F: Mobile hero strategy

Avoid loading the heaviest live hero widget by default on small screens.

Targets:
- Static rest-state screenshot or skeleton + tap-to-try gate on mobile.
- First tap becomes an explicit intent event.

Verification gates:
- Mobile LCP path does not include the live iframe.
- Tap-to-try loads the same real editor and preserves the conversion path.

### P2-G: Longer-loop conversion plumbing

Turn demo interest into "my footage" intent without anonymous inference.

Targets:
- Deep-linked signup/source params from every demo CTA.
- Optional YouTube-link capture that runs only after signup.
- Handoff clip embed dependency smoke coverage.

## Current decisions

- Keep the real shared editor. Demo-mode behavior belongs in host protocol
  stubs and thin copy/CTA branches, not a marketing fork.
- Do not expose anonymous Gemini, transcription, render, publishing, checkout,
  or account actions.
- Favor honest degradation over fake success. A fallback that opens the sample
  MP4 is better than a Download button that reports success and does nothing.
- Commit and push coherent checkpoints. Commit messages should be descriptive
  enough to recover the work path after compaction.

## Running checkpoint log

### 2026-06-11 checkpoint 1

Completed before this journal:
- Added `clips_generate_copy` to the hero recording embed host with rotating
  canned titles/descriptions and roughly one second of fake latency.
- Added explicit demo stubs for moment label/state/range updates.
- Expanded the hero assistant response so the phone composition is vertically
  more balanced and the visitor gets a clearer next action.

Verification already run:
- `/Users/c3po/co/bitterclip/apps/bitterclip-rails`: `RBENV_VERSION=3.3.2 rbenv exec bundle exec rails test test/controllers/embed_controller_test.rb`
- `/Users/c3po/co/bitterclip`: `git diff --check`
- `/Users/c3po/co/bitterclip-marketing`: `bun run generate`
- `/Users/c3po/co/bitterclip-marketing`: `bun run qa:smoke`
- `/Users/c3po/co/bitterclip-marketing`: `git diff --check`

### 2026-06-11 checkpoint 2 plan

Next implementation loop:
- Add demo event forwarding from the hero embed host.
- Add marketing-page event ingestion, demo-engagement state, signup URL
  attribution, and smoke coverage.
- Make the hero Download path honest.
- Add demo-aware export copy and the post-export conversion row.
- Rebuild widgets if the shared component changes, then run app and marketing
  verification, capture visual screenshots, commit, and push.

### 2026-06-11 checkpoint 2 receipt

Completed:
- Hero recording embed host now identifies as `host: "demo"` and passes a
  demo signup URL through host context.
- Hero host emits parent demo events for editor open/close, clip creation,
  Generate start/completion, export start/reveal, Download click/failure,
  publish-status checks, CTA clicks, external opens, and unknown demo stubs.
- Hero host handles `ui/download-file` and `ui/open-link` explicitly instead of
  returning a generic empty ack.
- Shared composition editor now swaps export-credit copy for demo-safe
  "free sample export" copy when `hostContext.host === "demo"`.
- Shared composition editor shows a post-export demo CTA: "That's the whole
  flow. Do it with your own footage — start free with 60 minutes a month."
- Publish-not-connected copy in demo mode points to signup as the honest next
  step.
- Marketing page ingests source-scoped demo events, records GA events when
  `gtag` is present, stores a local event list for tests, and updates signup
  attribution through the global header/footer CTAs.
- Homepage Markdown, `llms.txt`, and `llms-full.txt` now describe the safe
  demo-mode and attribution contract.

Verification run:
- `/Users/c3po/co/bitterclip/apps/bitterclip-rails`: `RBENV_VERSION=3.3.2 rbenv exec bundle exec rails test test/controllers/embed_controller_test.rb`
- `/Users/c3po/co/bitterclip`: `bun run build:mcp-widgets`
- `/Users/c3po/co/bitterclip`: `bun run verify:mcp-widgets-fresh`
- `/Users/c3po/co/bitterclip`: `bun run verify:mcp-widget`
- `/Users/c3po/co/bitterclip`: `git diff --check`
- `/Users/c3po/co/bitterclip-marketing`: `bun run generate`
- `/Users/c3po/co/bitterclip-marketing`: `bun run qa:smoke`
- `/Users/c3po/co/bitterclip-marketing`: `git diff --check`

Visual/protocol checks:
- Landing desktop, mobile, and light-mode screenshots captured from generated
  static output at `http://127.0.0.1:4179`.
- App-side exported clip panel verified in the unminified
  `composition-editor/journey.html` workbench with forced demo host context:
  canned Generate populated title/description, sample-export copy appeared,
  post-export CTA appeared, and Download stayed visible.
- Focused fable review resumed as a fresh session after the original session id
  was unavailable. It confirmed the architecture and identified the remaining
  P0 risks: popup/download success reporting, mid-page editor telemetry, and
  signup attribution from the post-export CTA.
- Local recording host protocol checks confirmed host-level popups without user
  activation fail honestly instead of reporting success.
- Browser checks confirmed sandboxed anchor clicks open under
  `allow-popups allow-popups-to-escape-sandbox allow-downloads`; the demo payoff
  controls now use anchor-first actions instead of host-open JavaScript.

### 2026-06-11 checkpoint 2.5 receipt

Fable review follow-up completed:
- Recording embed sandbox now allows popup/download fallback anchors.
- Host `ui/open-link` checks `window.open` and returns a real `uiError` on a
  blocked popup.
- Host `ui/download-file` refuses cross-origin pseudo-downloads so the widget
  does not count a video-tab open as a file download.
- Shared editor demo CTAs and sample-MP4 actions render as real anchors, with
  button styling and demo-event forwarding for attribution.
- Demo signup URLs now carry both `utm_content` and `from=landing_<stage>`.
- Mid-page `clip-demo` emits demo funnel events for clip selection, export
  start/reveal, and sample MP4 clicks.
- Marketing smoke tests now cover source-scoped signup attribution from both the
  hero recording embed and the mid-page editor embed.

Remaining P1/P2 tracks:
- Add a mobile hero tap-to-load gate or screenshot facade to keep the live
  widget off the mobile LCP path.
- Add a subtle interactivity cue that disappears after first touch.
- Add true visual QA for the production hero after app deploy so the live
  iframe shows the new demo host behavior on `bitterclip.com`.
- Add server-side/demo-event beaconing if GA client events are not enough for
  funnel attribution.

### 2026-06-11 checkpoint 3 receipt

P1 watermarked artifact:
- Generated `apps/bitterclip-rails/public/demo/day-1-opening-watermarked.mp4`
  from the existing public sample clip.
- The sample is 640x360, 4 seconds, about 60 KB, and visibly branded with
  `BITTERCLIP DEMO` plus `Sample export · bitterclip.com`.
- Marketing embeds now default `?clip=` to
  `https://app.bitterclip.com/demo/day-1-opening-watermarked.mp4`, with a local
  `?clip=` query override retained for testing.
- Public homepage Markdown and discovery text now state that the demo export is
  branded and app-origin.
