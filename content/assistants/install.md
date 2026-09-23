---
title: Install BitterClip in Claude Code or Codex
description: Instructions an AI agent follows to connect BitterClip in Claude Code or Codex, have the person sign in, verify, and hand off to editing.
navigation:
  label: Install with an agent
  order: 5
section: assistants
updated: '2026-09-24'
tags:
  - assistants
  - mcp
  - claude-code
  - codex
---

# Install BitterClip in Claude Code or Codex

This page is written for AI agents. People can use the [connect page](/connect), which also
covers Claude and ChatGPT.

To have an agent install BitterClip, send it this message. In Codex, start it with `/goal`.

```text
Read https://bitterclip.com/docs/assistants/install and follow it exactly to install BitterClip, then tell me how to start.
```

## Installation contract

- **Server:** `https://app.bitterclip.com/mcp`, streamable HTTP with OAuth sign-in. Server
  name: `bitterclip`; Claude Code lists the plugin's server as `plugin:bitterclip:bitterclip`.
- Use only the section for the client you are running in. Do not install into both Claude
  Code and Codex because both are present.
- Inspect first. If a working `bitterclip` server already points at the address above, keep
  it and go to verification. Preserve unrelated servers and configuration.
- The person signs in to BitterClip in their own browser and clicks **Allow**. Never ask for a
  password, cookie or token, and never add a bearer token or authorization header.
- Installation ends after verification and the handoff. Do not upload media, create
  projects, edit, render or publish while installing.
- Report the client, the server address, sign-in and verification separately. If a step is
  still pending, such as a new session or sign-in, name it instead of saying the installation
  is ready.

## Install in Claude Code

1. Inspect the current configuration:

   ```bash
   claude plugin list
   claude mcp get plugin:bitterclip:bitterclip
   ```

2. If the BitterClip plugin is missing, add its marketplace and install it for this user.
   It brings the connection and BitterClip's editing skills:

   ```bash
   claude plugin marketplace add sheetgenius/bitterclip-plugin
   claude plugin install bitterclip@bitterclip
   ```

   If this Claude Code cannot install plugins, add the connection alone instead and say so
   in your report:

   ```bash
   claude mcp add --scope user --transport http bitterclip https://app.bitterclip.com/mcp
   ```

3. Sign in. The plugin loads in a new session. Ask the person to start one, run `/mcp`,
   choose BitterClip, then **Authenticate**. Their browser opens BitterClip; they sign in and
   click **Allow**. Ask:

   ```text
   Please start a new Claude Code session, run /mcp, choose BitterClip and authenticate. Sign in to BitterClip in the browser window that opens and click Allow, then let me know.
   ```

4. Verify. `claude mcp get plugin:bitterclip:bitterclip` (or `claude mcp get bitterclip`
   for the connection alone) must show `https://app.bitterclip.com/mcp` and a connected
   status. In a session where BitterClip's tools are loaded, call `projects_list` with `{}`:
   a structured response proves an authenticated read that changes nothing.

5. Hand off. Tell the person to start a new Claude Code session in a folder without a code
   repository, since the work is a video, and send:

   ```text
   Using BitterClip, help me make my first clip. Briefly explain how you can help, then show my recent recordings or help me upload one.
   ```

## Install in Codex

1. Find the executable. The ChatGPT desktop app bundles Codex at
   `/Applications/ChatGPT.app/Contents/Resources/codex` on macOS. Use it when present;
   otherwise use `codex` on the shell path.

   ```bash
   /Applications/ChatGPT.app/Contents/Resources/codex --version || codex --version
   ```

2. Inspect the current configuration:

   ```bash
   codex plugin list
   codex mcp list
   ```

3. If the BitterClip plugin is missing, add its marketplace and install it. It brings the
   connection and BitterClip's editing skills:

   ```bash
   codex plugin marketplace add https://github.com/sheetgenius/bitterclip-plugin.git --ref main
   codex plugin add bitterclip@bitterclip
   ```

   If this Codex cannot install plugins, add the connection alone and say so in your report:

   ```bash
   codex mcp add bitterclip --url https://app.bitterclip.com/mcp
   ```

4. Sign in. The command opens the person's browser, where they sign in to BitterClip and
   click **Allow**. Wait for it to report success. If a browser window opened, do not also
   open the URL it prints: the sign-in callback works once.

   ```bash
   codex mcp login bitterclip
   ```

5. Verify. `codex mcp list` must show `bitterclip` at `https://app.bitterclip.com/mcp`. The
   tools load in a new task, whose first `projects_list` call proves the authenticated read.

6. Hand off. Create a new task with the starter prompt below if this client lets you, or ask
   the person to start one, then end with one line saying the installation is done and where
   to continue.

   ```text
   Using BitterClip, help me make my first clip. Briefly explain how you can help, then show my recent recordings or help me upload one.
   ```

## Troubleshooting

- **Sign-in fails or is refused:** repeat the client's sign-in step. After the first sign-in
  the connection renews itself.
- **`GET https://app.bitterclip.com/mcp` returns 405:** expected for this transport; it is
  not an authentication test.
- **The server is missing after installation:** start a new session or task, then inspect
  again.
- **A tool call is refused:** BitterClip's response says why and what to do; relay it to the
  person.

The [BitterClip plugin](https://github.com/sheetgenius/bitterclip-plugin) is the source of
the marketplaces above.
