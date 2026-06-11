# BitterClip MCP

Canonical HTML page: https://bitterclip.com/mcp

Markdown version: https://bitterclip.com/mcp.md

## How ChatGPT And Claude Open The Editor

BitterClip exposes a remote MCP server and MCP Apps-compatible editor surface.
An assistant can find a moment, BitterClip can open the transcript editor in
the conversation, and a human can verify the final cut before export or
publishing.

The assistant picks words. BitterClip handles timing, captions, export, and
final approval without guessed timestamps.

## Live Editor

The transcript editor is the same review surface BitterClip can open in ChatGPT
and Claude. A user can drag across words to cut a clip, play the media, and see
the cursor land on the selected word.

One editor can run in the web app, in AI chat hosts, and in the public demo. The
bridge changes by host; the editing surface stays familiar.

## MCP Endpoint

Endpoint:

```text
POST /mcp
```

BitterClip speaks JSON-RPC 2.0 over HTTP with CORS, origin checks, and
bearer-token authentication. Tool calls route to the user's BitterClip
workspace.

Protocol:

- MCP over JSON-RPC 2.0
- MCP Apps UI extension
- stable spec date: 2026-01-26

Supported methods:

- `initialize` - handshake and exchange capabilities
- `ping` - connection heartbeat verification
- `tools/list` - expose available editor capabilities
- `tools/call` - run a tool, such as finding moments or exporting a clip
- `resources/list` - list ingested audio/video resources
- `resources/read` - read a recording transcript and clips

Example request:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}
```

## ChatGPT App Directory Submission

The public app should be named BitterClip and submitted from a verified
BitterClip or Bitter Platform organization.

The app's job is narrow:

- find source-linked clip candidates from a user's recordings
- open the transcript editor for human review
- create approved clips
- export MP4s
- prepare publishing packages only when the user asks

Public submission fields:

- app name: BitterClip
- website: https://bitterclip.com
- privacy policy: https://bitterclip.com/privacy
- terms of service: https://bitterclip.com/terms
- support contact: hello@bitterclip.com
- MCP resource: https://app.bitterclip.com/mcp

Review flow:

- Test the remote MCP server in ChatGPT Developer Mode before submission.
- Scan the live MCP endpoint in the OpenAI Platform Dashboard after the backend
  deploy that defines the final tool list.
- Provide screenshots, test prompts, expected responses, and a demo account
  with sample recordings in the dashboard.

Submission boundaries:

- Do not publish OAuth secrets, demo credentials, provider payloads, or private
  review accounts in this repository.
- Keep billing checkout on BitterClip's own domain; the submitted ChatGPT
  toolset should not expose checkout or subscription purchase tools.
- Publishing tools should be labeled as write and open-world actions, and should
  run only after explicit user approval.

## Tools

The BitterClip MCP server exposes operations for recordings, transcripts,
moments, clips, compositions, publishing packages, and account state. This is a
representative submission-facing list; the OpenAI Platform Dashboard review
snapshot should come from the live MCP metadata after the backend deploy that
defines the final toolset.

| Tool | Purpose | Arguments |
| --- | --- | --- |
| `recordings_list` | Retrieve ingested recordings for selection. | `{}` |
| `transcript_read` | Read the full diarized, line-numbered transcript so the model can choose useful moments from context. | `{ recording_id }` |
| `transcript_words_window` | Return word-level timing for selected transcript lines when sub-line trimming is needed. | `{ recording_id, start_line, end_line }` |
| `open_recording` | Open a recording in the transcript editor with suggested line ranges for review and trimming. | `{ recording_id, selections }` |
| `moments_create` | Create a saved moment from an explicit time range or transcript unit selection. | `{ recording_id, start/end }` |
| `clips_create` | Commit a chosen moment as a durable clip. Timing is derived from audio and selected words. | `{ recording_id, start/end, title, idempotency_key }` |
| `clips_export` | Trigger the render queue to export a captioned MP4. | `{ clip_id, idempotency_key }` |
| `clips_get_status` | Check whether an export is queued, rendering, ready, or failed. | `{ clip_id, export_id }` |
| `clips_get_download_url` | Return a short-lived download URL for a completed export. | `{ clip_id, export_id }` |
| `clips_compose` | Stitch spans from one or more recordings into a single clip, then render. | `{ segments[] }` |
| `publishing_publish_approval` | Publish a package only after the user has reviewed it and explicitly asks to publish. | `{ approval_id, idempotency_key }` |
| `account_get_credit_balance` | Check plan credits and subscription limits. | `{}` |

## Host Bridge

BitterClip renders rich custom elements inside sandboxed iframes. The widget
communicates with its host through a standardized `hostActions` API contract.

Every component speaks `hostActions`, not host-specific globals such as
`window.openai`, raw `postMessage`, or direct `fetch`. This keeps the component
portable across the web app, ChatGPT, Claude, and demo surfaces.

Canonical event chain:

1. State change: the component updates its own view first.
2. Event: the component announces what happened, such as
   `bitterclip.project_focused`.
3. Tell the model: `hostActions.updateModelContext` keeps the AI in the loop.
4. Call the tool: `hostActions.callTool` does backend work.
5. Or say it: `hostActions.sendMessage` starts a new model turn when that is
   simpler.

Core host action methods include:

```text
connect
notifyReady
notifySizeChanged
onTeardown
getHostContext
onHostContextChanged
getCapabilities
createClip
updateMomentLabel
adjustMomentRange
exportMp4
focusProject
focusRecording
callTool
openExternal
downloadFile
requestDisplayMode
sendMessage
updateModelContext
onToolInput
onToolResult
onToolCancelled
log
notifyError
```

## Connecting BitterClip

BitterClip connects as a remote MCP server: a hosted endpoint with sign-in. It
does not require local setup, config files, or local processes.

Claude:

Add BitterClip as a Connector and sign in. The tools and live editor appear in
the conversation.

ChatGPT:

During development, connect the remote MCP server in ChatGPT Developer Mode and
sign in. After review and publication, users can enable the BitterClip app with
the same tools and editor.

Account creation, plan management, and checkout stay on BitterClip's own domain.
The ChatGPT app should focus on source-linked clipping, exports, and explicit
publishing approvals.
