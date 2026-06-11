# BitterClip — Anthropic Connectors Directory submission packet

Working packet for listing BitterClip in **Anthropic's Connectors Directory** (the
catalog users browse and "Add" inside Claude.ai / Claude Desktop / Claude Code). This
is distinct from the ChatGPT app directory packet
([chatgpt-app-submission.md](chatgpt-app-submission.md)) — same server, different
store and review flow.

- **Submission portal:** https://claude.com/docs/connectors/building/submission
- **Review criteria:** https://claude.com/docs/connectors/building/review-criteria
- **Directory policy:** https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy
- **Directory FAQ:** https://support.claude.com/en/articles/11596036-anthropic-connectors-directory-faq

> Do **not** commit OAuth secrets, demo credentials, or the private reviewer account
> password into this repo. Fields marked `<provide in portal>` are filled in the
> submission portal / a private channel, never here.

---

## Readiness at a glance

| Gate | Status | Evidence |
|---|---|---|
| Remote HTTPS MCP server, OAuth-gated | ✅ | `POST https://app.bitterclip.com/mcp` → `401` unauthenticated (correct) |
| JSON-RPC 2.0 over HTTPS POST + MCP Apps widgets | ✅ | `/mcp` page; MCP Apps spec `2026-01-26` |
| All tools declare `title` | ✅ | 54/54 (`operation_catalog.rb`) |
| All tools declare `readOnlyHint` or `destructiveHint` | ✅ | 54/54; no mixed read/write |
| Tool names ≤ 64 chars | ✅ | longest 46 (`publishing_create_composition_platform_package`) |
| Annotations in `tools/list` wire format | ✅ | emitted via `mcp_server.rb` → `operation_catalog.mcp_tool` |
| No billing/checkout tools exposed over MCP | ✅ | `billing_create_checkout_url`, `clips_distribute`, `account_get_credit_balance` exist in the catalog but are absent from `MCP_TOOL_NAMES` (`operation_catalog.rb:18-78`) |
| Model-visible surface is focused | ✅ | 23 model-visible tools; the other 31 are app-only, backing the editor widget (see §3) |
| Public privacy policy | ✅ | https://bitterclip.com/privacy (eff. 2026-06-09; covers MCP tokens) |
| Public terms of service | ✅ | https://bitterclip.com/terms |
| Public docs page | ✅ | https://bitterclip.com/mcp |
| Support contact | ✅ | hello@bitterclip.com |
| Org plan to submit (Team/Enterprise) | ⬜ | **confirm** — else use https://clau.de/mcp-directory-submission |
| Reviewer test account populated | ⬜ | **to create** (see §6) |
| Live `tools/list` capture confirming annotations ship | ⬜ | optional belt-and-suspenders (authed curl) |

---

## 1. Listing information (public fields)

| Field | Value |
|---|---|
| App / connector name | BitterClip |
| One-line | Turn long recordings into clips: find the moment in the transcript, trim it in chat, export a captioned MP4. |
| Website | https://bitterclip.com |
| MCP server URL | https://app.bitterclip.com/mcp |
| Privacy policy | https://bitterclip.com/privacy |
| Terms of service | https://bitterclip.com/terms |
| Support contact | hello@bitterclip.com |
| Category | `<pick from portal options>` — closest fit: productivity / media & content creation |
| Submitting org | `<provide in portal>` (verified BitterClip / Bitter Platform org) |

### Short description (~50 words)
BitterClip turns long recordings into clips without leaving the chat. Ask Claude for
a moment and BitterClip reads the timed transcript, opens its editor inside the
conversation, and renders a captioned MP4. Every cut is tied to the source audio, so
clips start and end exactly on the word.

### Long description
BitterClip is a transcript-first clipping workshop that runs as a remote MCP server
with an in-chat editor (MCP Apps). A typical session: pick a recording, read its full
diarized, line-numbered transcript, recommend a moment from real context, open the
transcript editor inside the conversation to review and trim, then commit the clip
and export a captioned MP4. The model selects words; word-level timing always comes
from the source audio, so BitterClip never invents timestamps. Publishing (for
example to YouTube) is a separate step that runs only on explicit user approval.
Account creation, plan management, and checkout stay on bitterclip.com; the connector
exposes no purchase or billing tools.

---

## 2. Connection settings

- **Transport:** JSON-RPC 2.0 over HTTPS `POST /mcp`. (Confirm in the portal whether
  full streamable-HTTP semantics — SSE response streaming, session IDs — are required;
  see §8.)
- **Auth:** OAuth 2.0 (bearer). Unauthenticated requests return `401`. Users add the
  connector and sign in with their BitterClip account; tool calls route to that
  workspace.
- **UI extension:** MCP Apps (stable spec `2026-01-26`) mounts the interactive
  transcript editor as a widget in the conversation.
- **Methods:** `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`,
  `resources/read`.

---

## 3. Tool surface

54 tools appear in `tools/list`, all explicitly allowlisted in `MCP_TOOL_NAMES`
(`operation_catalog.rb:18-78`), in two deliberate tiers:

- **23 model-visible tools** (`MODEL_VISIBLE_MCP_TOOL_NAMES`) — the surface the
  assistant plans over: recordings, transcript reads, the editor opener, clip
  create/export/status/download, and YouTube publishing with explicit approval.
- **31 app-only tools** (`APP_ONLY_MCP_TOOL_NAMES`) — called by the embedded editor
  widget through the `hostActions` bridge (moment editing, compositions,
  speaker-identity curation). They exist so user actions inside the editor round-trip
  through the same authenticated, audited MCP surface as model calls. They are
  surfaced with `_meta.ui.visibility: ["app"]` (plus `"openai/widgetAccessible":
  true`) so hosts hide them from the model's planning surface; every call — widget or
  model — is OAuth-scope-authorized. This is host-honored metadata, not server-side
  caller restriction (verified 2026-06-11).

Annotation coverage (verified across all 54):

- 20 read-only (`readOnlyHint: true`)
- 32 safe writes (`readOnlyHint: false`, `destructiveHint: false`)
- 2 destructive (`destructiveHint: true`): `publishing_publish_approval`
  (model-visible) and `speakers_merge` (app-only)

**Anticipated reviewer question — "why 54 tools?"** The model-facing surface is 23
focused tools following one linear workflow (recording → transcript → moment → clip →
export → publish). The remaining 31 back the interactive editor widget rather than
expand what the model can do on its own. Read and mutate operations are deliberately
split (directory requirement); no tool both reads and mutates.

**Boundary commitments for the submitted toolset:**
- No checkout / subscription-purchase tools. Verified and **server-enforced** as of
  commit `0967f7ce` (2026-06-11, pending deploy): `billing_create_checkout_url`,
  `clips_distribute`, and `account_get_credit_balance` are excluded from the MCP
  allowlist, `tools/call` rejects any tool outside it, connector tokens no longer
  carry billing scopes, and billing-related error copy is neutral (no in-chat
  upsell).
- Publishing tools are labeled write + open-world and run only after explicit user
  approval (`publishing_publish_approval`).

---

## 4. Use cases (reviewer-runnable)

Each is a prompt a reviewer can paste against the signed-in test account, with the
expected behavior.

1. **Clip a moment from the latest recording**
   - Prompt: *"Find the strongest 30-second moment in my latest recording and clip it."*
   - Expected: `recordings_list` → `transcript_read` → a recommended range → `open_recording`
     mounts the editor with the highlighted words → on approval, `clips_create` →
     `clips_export` → status polled → download URL returned.

2. **Sub-line precision trim**
   - Prompt: *"Tighten the start so it begins exactly on 'the real problem is'."*
   - Expected: `transcript_words_window` on the boundary line → editor updates the
     start word; no invented timestamps.

3. **Stitch a highlight reel across spans**
   - Prompt: *"Stitch the three best answers into one clip."*
   - Expected: `clips_compose` with multiple segments → single rendered MP4.

4. **Publish only on explicit approval (boundary demo)**
   - Prompt: *"Publish that clip to YouTube."*
   - Expected: a publishing package is prepared and shown; nothing is published until
     the user explicitly approves via `publishing_publish_approval`.

---

## 5. Data handling

Point reviewers to https://bitterclip.com/privacy (effective 2026-06-09). It explicitly
covers: account/contact data, workspace content (recordings, transcripts, clips,
exports, approval/publishing receipts), **connector/integration data including MCP
access tokens and OAuth tokens**, billing/plan data, and usage/log/analytics. Note for
the portal: MCP-exchanged data is under BitterClip's standard retention, **not** ZDR.

---

## 6. Testing setup (reviewer account)

> Credentials are provided in the portal / private channel — **not committed here.**

- **Test account:** `<reviewer email>` / `<password — provide in portal>`
- **Pre-populated:** ≥1 sample recording with a finished transcript so the full
  golden flow (read → moment → editor → clip → export → download) works end to end.
- **OAuth walkthrough:** add BitterClip as a connector → redirected to
  `app.bitterclip.com` sign-in → consent → tools + editor appear in the conversation.
- **Screenshots to attach:** (a) editor mounted in-chat with a highlighted range,
  (b) a rendered/exported clip, (c) the publishing approval step.

Use `@example.test` addresses for any throwaway records, and delete any records created
purely for the demo (the server runbook requires smoke records be cleaned up).

---

## 7. Compliance declarations

- Complies with Anthropic Usage Policy (https://anthropic.com/use-policy); no evasion
  of Claude safety guardrails.
- No financial-transfer / crypto / image-generation primary service; no advertising.
- Connector does not coerce Claude into calling unrelated external software; tool
  descriptions carry no hidden instructions / prompt injection.
- Only collects data necessary to function; does not extract Claude memory or chat
  history.
- Verified support + vulnerability-disclosure contact: hello@bitterclip.com.

---

## 8. Open items before "Submit"

1. **Confirm the submitting org's plan.** Team/Enterprise can submit via the portal;
   otherwise use the alternative form (https://clau.de/mcp-directory-submission).
2. **Create + populate the reviewer test account**; hold its credentials for the portal.
3. **(Optional) Capture a live authed `tools/list`** to confirm the `annotations` object
   ships exactly as the code audit found, before reviewers test it.
4. **Lock the final tool list** with the backend deploy that defines it, then re-scan.
5. **Confirm transport specifics.** The server speaks JSON-RPC 2.0 over HTTPS POST;
   verify whether the portal requires full streamable-HTTP semantics (SSE streaming,
   `Mcp-Session-Id`) and whether the server provides them. (Partial signal: the MCP
   endpoint's CORS config exposes an `mcp-session-id` header.)
6. ~~Confirm how the app-only tier is enforced~~ **DONE 2026-06-11**: app-only tools
   carry `_meta.ui.visibility: ["app"]` in `tools/list`; hiding is host-honored
   metadata, **not** server-side caller restriction (all calls are scope-authorized
   on the same endpoint). §3 has been worded to match. Full findings:
   [chatgpt-app-submission.md §10](chatgpt-app-submission.md) (OAuth + widget audits
   there apply to this submission too).
7. **Fix the stale `/mcp` page tool table.** It lists `account_get_credit_balance`,
   which is not in the MCP allowlist; the public docs should match the live surface
   before reviewers compare them.
