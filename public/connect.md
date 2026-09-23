# Connect BitterClip to Claude, ChatGPT, Claude Code or Codex

Canonical HTML page: https://bitterclip.com/connect

Markdown version: https://bitterclip.com/connect.md

## Edit your videos from Claude or ChatGPT

Ask for a clip in plain words. BitterClip cuts it from your recording and hands
back a video you can post.

## Claude

1. Add BitterClip to Claude: https://app.bitterclip.com/go/claude?from=connect_page
   opens Claude's Add connector window with BitterClip filled in. Click Continue.
2. Sign in to BitterClip and click Allow. Works on every Claude plan.
3. Start editing: https://app.bitterclip.com/go/claude/start?from=connect_page
   opens a new Claude chat with a first request ready to send.

## ChatGPT

1. In ChatGPT, open Settings → Security and login and turn on Developer mode.
   Your plan and workspace decide whether it's available.
2. On ChatGPT's Plugins page, click +, name it BitterClip, and paste
   https://app.bitterclip.com/mcp. Then sign in to BitterClip and click Allow.
3. Open a new chat, choose BitterClip, and send the first request below.

## Claude Code

1. Install the plugin (the connection plus editing skills):
   `claude plugin marketplace add sheetgenius/bitterclip-plugin`, then
   `claude plugin install bitterclip@bitterclip`.
2. In a new Claude Code session, run `/mcp`, choose BitterClip, then
   Authenticate. Your browser opens BitterClip; click Allow.

Or send Claude Code: "Read https://bitterclip.com/docs/assistants/install and
follow it exactly to install BitterClip, then tell me how to start."

## Codex

1. Install in Codex: in the ChatGPT desktop app's Codex, send
   "/goal Read https://bitterclip.com/docs/assistants/install and follow it
   exactly to install BitterClip, then tell me how to start." Or run
   `codex plugin marketplace add https://github.com/sheetgenius/bitterclip-plugin.git --ref main`
   and `codex plugin add bitterclip@bitterclip`.
2. Sign in: `codex mcp login bitterclip` opens your browser; sign in to
   BitterClip and click Allow.
3. Start a new Codex task with the first request below.

Instructions for AI agents: https://bitterclip.com/docs/assistants/install

## A first request to try

"Using BitterClip, help me make my first clip. Briefly explain how you can help,
then show my recent recordings or help me upload one."

## Questions

- Which plans work? Claude allows custom connectors on every plan; a Free
  account can add one. In ChatGPT, adding a custom app needs Developer mode,
  which depends on your plan and workspace.
- Claude says the connector came from an external link. That note appears for
  any connector suggested by a link until it is listed in Claude's directory.
  Check the address is https://app.bitterclip.com/mcp, then click Continue.
- Do I need to install anything? Not for Claude or ChatGPT. In Claude Code and
  Codex, the BitterClip plugin (https://github.com/sheetgenius/bitterclip-plugin)
  adds the connection and editing skills in one step.
- What can the assistant do with my account? BitterClip shows you before you
  allow it: see your recordings and transcripts, make and edit clips, render
  videos, and prepare posts. Every prepared post waits for your confirmation in
  BitterClip. You can disconnect it anytime in Settings.

Server address for any MCP client: https://app.bitterclip.com/mcp (OAuth sign-in;
never paste a token).
