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

## Tools

The BitterClip MCP server exposes a small, named set of tools:

| Tool | Purpose | Arguments |
| --- | --- | --- |
| `recordings_list` | Retrieve ingested recordings for selection. | `{}` |
| `clips_suggest` | Read the transcript and propose moments worth clipping for a goal. | `{ recording_id, goal }` |
| `clips_render_candidate_editor` | Mount the interactive `ui://bitterclip/candidate-editor-v4` widget in the chat. | `{ recording_id, candidates }` |
| `clips_create` | Commit a chosen moment as a durable clip. Timing is derived from audio and selected words. | `{ recording_id, start/end, title }` |
| `clips_export` | Trigger the render queue to export a captioned MP4. | `{ clip_id }` |
| `clips_compose` | Stitch spans from one or more recordings into a single clip, then render. | `{ segments[] }` |
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

Enable the BitterClip app. The same tools and editor appear through the MCP App
surface.

Plans run from Free ($0) through Clip ($9/month) to Pro ($99/month). Your plan
unlocks uploads, renders, publishing, and connector use.
