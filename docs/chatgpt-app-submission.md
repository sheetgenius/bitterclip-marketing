# BitterClip — ChatGPT app directory submission packet

Working packet for listing BitterClip in the **ChatGPT app directory** (OpenAI Apps
SDK). Companion to [anthropic-connector-submission.md](anthropic-connector-submission.md)
— same server, same verified facts, different store, form, and review flow. The
`/mcp` page's "Submission readiness" section targets this store; this doc supersedes
it as the working checklist.

- **Submission portal:** https://platform.openai.com/apps-manage (after testing in
  ChatGPT Developer Mode)
- **Submission guide:** https://developers.openai.com/apps-sdk/deploy/submission
- **Submission guidelines (policy):** https://developers.openai.com/apps-sdk/app-submission-guidelines
- **Auth requirements:** https://developers.openai.com/apps-sdk/build/auth
- **Server/widget requirements:** https://developers.openai.com/apps-sdk/build/mcp-server
- **UI guidelines:** https://developers.openai.com/apps-sdk/concepts/ui-guidelines

> Same rule as the Anthropic packet: no OAuth secrets, demo credentials, or private
> reviewer accounts in this repo. `<provide in portal>` fields go in the dashboard.

---

## Readiness at a glance

| Gate | Status | Evidence / action |
|---|---|---|
| Remote HTTPS MCP server at `/mcp`, OAuth-gated | ✅ | `POST https://app.bitterclip.com/mcp` → `401` unauthenticated |
| All tools declare `readOnlyHint`, `destructiveHint`, `openWorldHint` | ✅ | 54/54 emit all four hints incl. `idempotentHint` (`operation_catalog.rb`) — OpenAI treats missing hints as a validation error and cites them as the top rejection cause |
| Tools declare `securitySchemes` | ✅ | `[{"type":"oauth2"}]` on each tool (code audit) |
| No purchase/subscription tools in-chat | ✅ | `billing_create_checkout_url` excluded from `MCP_TOOL_NAMES` — **mandatory here**: selling digital subscriptions in-app is prohibited; external checkout on bitterclip.com only |
| Privacy policy / terms / support | ✅ | https://bitterclip.com/privacy · /terms · hello@bitterclip.com |
| In-chat editor widget exists | ✅ | the `/mcp` page embeds the same editor; `hostActions` bridge |
| Identity verification (business) in Platform Dashboard | ⬜ | verify as BitterClip / Bitter Platform; submitter needs Owner or `api.apps.write` |
| Domain challenge file | ⬜ | serve token as plain text at `https://app.bitterclip.com/.well-known/openai-apps-challenge` **before** clicking Verify (probed 2026-06-11: 404, as expected pre-deploy) |
| OAuth 2.1 conformance | ✅ | audited 2026-06-11 (code + live): PKCE S256 mandatory, CIMD + DCR, resource binding, discovery endpoints live, 401 `WWW-Authenticate` live — see §10 |
| Demo account: **no MFA, no sign-up step** | ⬜ | auto-reject otherwise; pre-load sample recordings with finished transcripts |
| Widget CSP declaration (`_meta.ui.csp`) | ✅ | audited 2026-06-11: declared in both modern + legacy formats, `frameDomains: []`, no third-party iframes — see §10 for the allowlist + two caveats |
| Widget registration format | ✅ | modern `_meta.ui.resourceUri` + legacy `openai/outputTemplate` fallback; `text/html;profile=mcp-app`; stable URI with 5-min TTL freshness (deliberate, not a gap) |
| Listing assets | ⬜ | 64×64 icon (light + dark), ≤4 PNG screenshots of the widget UI only, MP4 demo video |
| Test cases | ⬜ | minimum 5 positive + 3 negative (drafted in §5) |

---

## 1. Listing information

| Field | Value |
|---|---|
| App name (also the `@BitterClip` invocation) | BitterClip |
| Subtitle (directory one-liner) | Turn long recordings into clips: find the moment in the transcript, trim it in chat, export a captioned MP4. |
| Developer name | `<verified business name>` |
| Website | https://bitterclip.com |
| MCP server URL | https://app.bitterclip.com/mcp |
| Privacy policy | https://bitterclip.com/privacy |
| Terms of service | https://bitterclip.com/terms |
| Customer support | hello@bitterclip.com |
| Category | Productivity (official list; Design is the alternate) |
| Localization | English; country availability `<decide: default all>` |
| Commerce declaration | check "links or directs users out of ChatGPT to make purchases" — subscriptions sold only on bitterclip.com |

### Description
Reuse the Anthropic packet's short + long descriptions (§1 there), with "Claude"
swapped for "ChatGPT". Match the length and tone of existing directory listings; no
comparative or promotional language (policy rule), no OpenAI-endorsement implication.

**Naming check:** "BitterClip" is a distinctive coined compound tied to the brand —
passes the no-generic-names rule. Tool names are plain verb phrases (`clips_create`,
`transcript_read`), matching the recommended style.

---

## 2. Technical deltas vs. the Anthropic submission

Things this store requires that the Anthropic one doesn't (or weighs differently):

1. **Domain verification.** Token served at
   `app.bitterclip.com/.well-known/openai-apps-challenge` (plain text, public). The
   domain must be unique per app. Deploy the file before clicking Verify — the check
   pings immediately.
2. **OAuth 2.1 specifics.** The link-account UI only appears if: protected-resource
   metadata is discoverable, tools declare `securitySchemes` (✅ already), and auth
   errors carry `_meta["mcp/www_authenticate"]`. PKCE S256 is required. Audit the
   server against https://developers.openai.com/apps-sdk/build/auth before submitting.
3. **Transport.** Streamable HTTP recommended (SSE legacy-supported), streaming
   responses, proper HTTP status codes. Same open verification item as the Anthropic
   packet (§8.5 there).
4. **Widget rules.** Sandboxed iframe with an explicit CSP allowlist
   (`connectDomains`, `resourceDomains`) declared in `_meta.ui.csp` — everything
   undeclared is blocked, so enumerate every host the editor fetches media from. Do
   **not** render the BitterClip logo inside the widget (ChatGPT prepends logo +
   name). Static widgets with no meaningful interaction are a rejection reason — the
   editor is genuinely interactive, so this is a strength.
5. **Model-visible payload discipline.** Keep model-facing data in
   `structuredContent`; large/sensitive payloads in `_meta` (never reaches the
   model). Handlers idempotent (the model may retry) — the toolset already uses
   `idempotency_key` params. Server `instructions`: first 512 chars must stand alone.
6. **App-only tool tier — resolved (2026-06-11 audit).** App-only tools ship with
   `_meta.ui.visibility: ["app"]` and `"openai/widgetAccessible": true`
   (`operation_catalog.rb:1880-1894`) — exactly the Apps SDK mechanism for
   widget-initiated tools. Note the precise claim: this is **host-honored metadata,
   not server-side caller enforcement** — all 54 tools accept any authenticated,
   scope-authorized call (widget and model use the same `/mcp` endpoint and token).
   Phrase submissions as "hidden from the model via standard visibility metadata;
   every call is OAuth-scope-authorized," not "restricted to the widget."

---

## 3. Monetization boundary (the decisive policy item)

Verbatim policy: *"apps may conduct commerce only for physical goods. Selling digital
products or services — including subscriptions, digital content, tokens, or credits —
is not allowed"*; *"Apps should use external checkout, directing users to complete
purchases on your own domain."*

BitterClip's stance already complies and is verified in code:
- No checkout/upgrade/credit tools over MCP (`billing_create_checkout_url` excluded
  from the allowlist).
- Free/Clip/Pro subscriptions sold only at bitterclip.com.
- The in-chat surface may *mention* plan limits in tool error messages, but must not
  initiate purchase. Review error copy for anything that looks like an in-chat
  upsell flow.

No ads. For the YouTube publish path: adhere to YouTube's ToS (named policy
requirement — "adhere to third-party terms of service"); publishing runs only via
`publishing_publish_approval` after explicit user approval.

---

## 4. Data handling declarations

- Only workspace data needed for clipping; no chat-history reconstruction (tools take
  explicit `recording_id`/`clip_id` params, not conversation context).
- Every data type returned by tools must be disclosed in the privacy policy —
  https://bitterclip.com/privacy already covers recordings, transcripts, clips,
  exports, publishing receipts, and connector/MCP tokens (eff. 2026-06-09).
- Audience: general, suitable for 13–17; not targeting under-13s.

---

## 5. Test cases (5 positive + 3 negative minimum)

Each row is a form entry: prompt → expected tool(s) → expected outcome.

**Positive**

1. *"What did I record this week?"* → `recordings_list` → newest-first list with
   titles and dates.
2. *"Find the strongest 30-second moment in my latest recording and clip it."* →
   `recordings_list` → `transcript_read` → `open_recording` (editor mounts with the
   highlighted range) → on approval `clips_create` → `clips_export`.
3. *"Tighten the start so it begins exactly on 'the real problem is'."* →
   `transcript_words_window` on the boundary line → editor start word updates; no
   invented timestamps.
4. *"Is my export done? Give me the file."* → `clips_get_status` →
   `clips_get_download_url` → short-lived download link.
5. *"Prepare that clip for YouTube."* → `youtube_get_connection_status` →
   `publishing_create_youtube_package` → package shown for review; **publishing does
   not happen yet**.

**Negative**

1. *"Upgrade me to Pro."* → **no tool call**; the assistant explains plans are
   managed at bitterclip.com (no checkout tool exists to misfire).
2. *"Clip recording rec_doesnotexist."* → tool returns a meaningful not-found error;
   assistant relays it gracefully (no stack trace, no retry loop).
3. *"What's a good pasta recipe?"* → **no BitterClip tool call**; the app stays out
   of unrelated conversations.

---

## 6. Demo account (review requirement)

- Fully-featured account, **password-only sign-in: no MFA, no SMS/email codes, no
  sign-up step in the flow** — any of these is an auto-reject.
- Pre-loaded with ≥2 sample recordings with finished transcripts and ≥1 already
  exported clip, so every test case in §5 runs without waiting on processing.
- Credentials: `<provide in portal>`. Use `@example.test` records; clean up anything
  created during reviewer dry-runs per the server runbook.

## 7. Assets to produce

- **Icon:** 64×64 px, light + dark variants.
- **Screenshots:** PNG, up to 4 (first 3 shown), of the widget UI only, matching real
  behavior: (a) editor mounted in-chat with highlighted words, (b) export/download
  state, (c) publishing approval card.
- **Demo video:** MP4 URL showing the full flow on web (and Android/iOS if claimed).
- **Release notes:** public-facing, per version.

## 8. Review flow + expectations

Submit from the dashboard → confirmation email with Case ID → automated scans +
manual review (no published SLA; community reports multi-week waits) → on approval,
click **Publish**. One version in review at a time; every update re-scans the MCP
endpoint, so **lock the final tool list before submitting** (shared open item with
the Anthropic packet). OpenAI auto-creates a Codex plugin version on approval.
Enhanced distribution (proactive suggestions) is merit-based with no request process.

## 9. Open items before "Submit"

1. Complete **business identity verification** in the Platform Dashboard.
2. Deploy the **domain challenge file** at `app.bitterclip.com/.well-known/openai-apps-challenge`.
3. ~~Audit OAuth 2.1 conformance~~ **DONE 2026-06-11** — pass; two optional
   improvements in §10.
4. ~~Audit the widget~~ **DONE 2026-06-11** — pass; two caveats in §10 (staging
   domains in CSP, CDN host value).
5. Create the **no-MFA demo account** with pre-loaded content (§6).
6. Produce **icon, screenshots, demo video** (§7).
7. ~~Confirm app-only tool tier~~ **DONE 2026-06-11** — metadata-hinted, not
   server-enforced; claim it accurately (§2.6).
8. Decide **country availability**; English copy final.
9. ~~Resolve the scopes nit~~ **FIXED 2026-06-11** (§10.4) — deploy commits
   `0967f7ce` + `d98c55df`, then re-probe `scopes_supported` and the emitted CSP.

---

## 10. Audit findings (2026-06-11, code + live probes)

### 10.1 OAuth — PASS

Code audit (`oauth_controller.rb`, `oauth_access_token.rb`,
`oauth_client_metadata.rb`) plus live probes against `app.bitterclip.com`:

- **Discovery live:** `/.well-known/oauth-protected-resource/mcp` and
  `/.well-known/oauth-authorization-server` both serve 200 with correct contents
  (issuer, endpoints, `code_challenge_methods_supported: ["S256"]`,
  `client_id_metadata_document_supported: true`).
- **401 gate live:** `POST /mcp` unauthenticated returns
  `WWW-Authenticate: Bearer realm="BitterClip MCP", resource_metadata="…/.well-known/oauth-protected-resource/mcp"`
  — the exact precondition for ChatGPT's link-account UI.
- **PKCE:** S256 mandatory, `plain` not offered; only `authorization_code` grant; no
  implicit/password/client-credentials (`oauth_controller.rb:227-228, 281`).
- **Client registration:** DCR (RFC 7591) at `/oauth/register` **and** CIMD with a
  trusted-host allowlist (chatgpt.com, openai.com, claude.ai, claude.com,
  anthropic.com) + SSRF protection.
- **Resource binding (RFC 8707):** `resource` validated at authorize + token, bound
  into token metadata, re-validated on every `/mcp` call.
- **Token validation:** SHA-256-digest storage, expiry (30-day TTL), scope subset,
  resource, account-suspension and membership checks on every call.

Optional improvements (not blockers):
- No **refresh tokens** — clients silently re-run the auth-code flow after 30 days.
- JSON-RPC tool *errors* don't carry `_meta["mcp/www_authenticate"]` (the HTTP-level
  401 does) — affects mid-session re-auth UX only.

### 10.2 Widget — PASS

- **Registration:** modern `_meta.ui.resourceUri` (`ui://bitterclip/workspace.html`,
  `text/html;profile=mcp-app`) + legacy `openai/outputTemplate` fallback
  (`mcp_widgets/workspace/resource.rb`, `golden_loop_operations.rb:155-156`).
  Stable URI with 5-minute TTL freshness — hash-versioning was deliberately dropped
  (localStorage quota); have this rationale ready if reviewers ask about
  cache-busting.
- **CSP:** declared in both `_meta.ui.csp` (camelCase) and `openai/widgetCSP`
  (snake_case); `frameDomains: []`; no third-party iframes (the only `<iframe>` in
  the codebase is a copy-paste embed snippet for users' own sites); no in-widget
  logo (host prepends serverInfo icons); system fonts only; no websockets.
- **Payload discipline:** model-visible data in `structuredContent`; full speaker
  evidence moves to `_meta` under model-context gating (`mcp_server.rb:154-166`).
- **`hostActions` only:** `window.openai` reads exist solely inside the bridge as
  guarded fallbacks; components are contract-bound to the bridge.

**CSP allowlist for the form** (from `resource.rb:17-31`):
`https://app.bitterclip.com`, `https://bitterclip.com`, `https://api.bitterclip.com`,
`https://cdn.bitterclip.com`, plus the CloudFront media host
(`https://d24e71htrizq6.cloudfront.net` — env-configured via
`Rails.configuration.x.bitterclip_cdn_host`; **verify the prod value**).

Caveats: (a) ~~staging hosts in the CSP~~ **FIXED 2026-06-11** (commit `d98c55df`,
pending deploy): production CSP now emits only `app.bitterclip.com` + public hosts;
staging origins remain in non-prod environments only. (b) pin the real CDN hostname
before filling the form.

### 10.3 App-only tier — metadata-hinted, not enforced

`tools/list` returns all 54 tools to every client; app-only entries carry
`_meta.ui.visibility: ["app"]` + `"openai/widgetAccessible": true`. There is **no**
server-side caller check — `authorize_tool!` gates on OAuth scopes only, and the
widget calls the same `/mcp` endpoint with the same token
(`mcp_server.rb:125-152, 180-184`; `mcp-apps-bridge.js:145-177`). Tests cover the
metadata shape, not enforcement. Submission language must say "hidden via standard
visibility metadata," never "restricted server-side."

### 10.4 Scopes nit — FIXED 2026-06-11 (commit `0967f7ce`, pending deploy)

The live metadata had advertised `billing:read`/`billing:write` despite no billing
tool being MCP-exposed. Fixed: connector tokens now request/issue only the five
connector scopes (`CONNECTOR_ACCOUNT_SCOPES`); billing scopes are gone from
`scopes_supported` and new grants, while existing 7-scope tokens keep validating
(no forced re-auth). The same commit closed a real gap the audit had missed:
`tools/call` had no allowlist check, so catalog operations outside `MCP_TOOL_NAMES`
(including `billing_create_checkout_url`) were dispatchable by a scoped token even
though absent from `tools/list`. `ensure_mcp_tool_available!` now rejects them
server-side, the billing dispatch case is deleted, and billing-related error copy
was rewritten to neutral account-status wording (no in-chat upsell — see §3).
**Re-probe the live metadata after the next deploy to confirm.**
