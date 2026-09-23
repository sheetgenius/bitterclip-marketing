---
title: Use BitterClip from your AI assistant
description: Connect Claude or ChatGPT to browse and work with BitterClip; editing support depends on the host plan.
navigation:
  label: Use it from your assistant
  order: 1
section: assistants
updated: '2026-09-23'
tags:
  - assistants
  - mcp
  - chatgpt
  - claude
---

# Use BitterClip from your AI assistant

You connect BitterClip to Claude or ChatGPT, then ask the assistant to find a
source-backed moment and prepare it for review. In Claude, the assistant can carry that
through to an editable Clip and a rendered video. In ChatGPT, what a custom connection can
change depends on your plan and workspace; when it can only read, it can still browse
Episodes, read transcripts, and open the workspace when the host supports it, and you
continue the edit in BitterClip's browser.

::callout{type="note"}
Claude supports custom connectors on every plan. In ChatGPT, the Plugin directory is
visible across plans, but custom-MCP access and actions depend on plan, role, workspace
policy, region, model, and rollout. BitterClip's browser workspace works for everyone.
::

You'll need a BitterClip account first. The Creator trial lasts seven days and requires a
card: $0 today, then $24/month unless canceled before it ends. It includes $5 of agent work
for one recording up to two hours. Producer is $99/month. Already have an account and just
want the connect steps?
[Jump to Connect your assistant](#connect-your-assistant).

::signup-cta
::

::what-is-bitter-clip
::

## Try the editor right here

This is the BitterClip transcript editor a supported host can open. Have a play with it.

::live-editor-embed
::

## What you can ask for

::example-clip-prompt
::

You don't have to phrase it any particular way. "Pull up my interview," "suggest moments
worth posting," and "cut the part where she talks about pricing" all work. The assistant
reads the transcript and proposes moments for you to choose from. A connection with write
actions can save a review point and prepare the editor for you.

## What your assistant can do for you

These are a handful of the things you can ask for once you're connected. Ask for a specific
cut, then inspect or revise the source-backed result in the editor. BitterClip does not
silently pick a "strong clip" for you; your request supplies the direction. A connection
with write actions can also prepare an upload handoff for a Recording you choose to add.

For tool names, descriptions, input fields, and errors, see the
[BitterClip tool reference](/docs/assistants/tool-reference). This static page
is generated from the deployed Rails catalog during the site build and shows
the product release it reflects. Available actions depend on your host and
account permissions.

## How it connects

::assistant-connection-intro
::

::callout{type="note"}
New to the word **episode**? The
[What is BitterClip?](/docs/getting-started/what-is-bitterclip) guide walks through it in
plain words.
::

## What lives in chat, and what lives in the web app

Your assistant helps find, review, and tune clips with you. Where the selected
connection allows writes, it can prepare a post and open the exact package for
review. Final confirmation happens in BitterClip.

::chat-vs-web-app
::

## Nothing posts until you set it up

::approval-promise
::

## Connect your assistant

Both assistants connect to the same BitterClip account, but their setup rules differ.

Using Claude? Add it in one click:

::add-to-claude
::

Or choose the guide for the host you use:

- **[Connect Claude](/docs/assistants/connect-claude)**: add BitterClip under
  **Customize → Connectors**, sign in, then enable it for the conversation where you need it.
- **[Connect ChatGPT](/docs/assistants/connect-chatgpt)**: BitterClip isn't in ChatGPT's
  plugin directory yet, so you add it as a custom app in **Developer mode**.

Connecting is all you need. BitterClip also publishes an optional
[plugin](https://github.com/sheetgenius/bitterclip-plugin) that adds editing skills for
Claude Code and Codex.

If the connection doesn't take or your recordings don't show up, the
[troubleshooting guide](/docs/help/troubleshooting) covers the usual fixes, and you can
always reach us:

::support-contact
::

::next-steps
---
links:
  - to: /docs/assistants/connect-chatgpt
    label: Connect ChatGPT
  - to: /docs/assistants/connect-claude
    label: Connect Claude
  - to: /docs/getting-started/your-first-clip
    label: Make your first clip in the browser
  - to: /docs/getting-started/what-is-bitterclip
    label: What is BitterClip?
---
::
