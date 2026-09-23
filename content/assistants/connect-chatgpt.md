---
title: Connect ChatGPT
description: Add BitterClip to ChatGPT as a custom app in Developer mode, check the connection, then make your first clip.
navigation:
  label: Connect ChatGPT
  order: 2
section: assistants
updated: '2026-09-23'
tags:
  - chatgpt
  - assistants
  - mcp
---

# Connect ChatGPT

BitterClip isn't listed in ChatGPT's plugin directory yet, so you add it yourself as a
custom app. This page walks you through adding it, checking the connection without
changing anything, and making your first clip.

::callout{type="note"}
Custom apps need ChatGPT's **Developer mode**, which depends on your plan, and a workspace
admin may need to allow it. What a custom app can change also depends on your plan and
workspace. If ChatGPT can read your recordings but won't make changes, it can still find
and explain moments, and you finish the cut in BitterClip's browser editor.
::

## Before you start

::connect-prereqs
::

## Add BitterClip in ChatGPT

::assistant-connection-intro
::

1. Open ChatGPT **Settings → Security and login** and turn on **Developer mode**. Your workspace may require an admin to make this available.
2. Open the top-level **Plugins** page at `chatgpt.com/plugins` and click the plus button.
3. Enter **Name** — BitterClip — and a short description.
4. Under **Connection**, choose the public **Server URL** method and paste the address above (it ends in `/mcp`): `https://app.bitterclip.com/mcp`.
5. Create the connection. ChatGPT discovers BitterClip's sign-in setup automatically; sign in to BitterClip when prompted.
6. Review the tools ChatGPT discovered.

::callout{type="note"}
ChatGPT moves its menus and labels around, so the exact wording can differ. Stuck? See
[Troubleshooting](/docs/help/troubleshooting).
::

## Sign in to BitterClip

If ChatGPT asks you to connect BitterClip, complete the BitterClip sign-in window, then
review the discovered tools.

The connection renews itself in the background, so you shouldn't need to sign in again. If
ChatGPT ever asks you to reconnect, click **Connect**; you don't need to remove and re-add
BitterClip.

::callout{type="warning"}
ChatGPT's plugin information says it may share relevant chats and memories with a connected
app. Before using customer recordings, review your ChatGPT Memory and privacy settings and
only include context you intend to share. That broader context is not needed just to prove
the connection works.
::

## Check the connection before making anything

Start a fresh chat and ask:

> "Using BitterClip, list my three latest episodes with their titles and lengths. Don't
> open, edit, render, or publish anything."

That cleanly proves ChatGPT can reach your BitterClip account without mixing setup with an
edit or render.

Then test the read-only editor handoff:

> "Using BitterClip, open my most recent ready episode read-only in the BitterClip
> workspace. Don't place review points or change anything."

The transcript workspace should appear in the conversation when the current ChatGPT surface
supports the interactive MCP workspace.

## Make your first clip in chat

This needs a connection that can make changes (see the plan note at the top of this
page). With a read-only connection, ChatGPT can still explain what it found and you
continue in BitterClip's browser.

If your account is empty, upload a recording first so there's something to clip. The
[browser walkthrough](/docs/getting-started/your-first-clip) shows you how. Once you have
one, just ask:

::example-clip-prompt{prompt="Pull up my latest interview and find the strongest moment."}
::

ChatGPT can inspect the Episode and point to a promising stretch. If your connection can
make changes, it can save a review point and prepare the Episode editor. Inspect the
source and choose the cut there; asking for a Clip saves an editable cut, while asking
for an Export starts a separate render. A read-only connection can explain its findings
and direct you to continue in BitterClip's browser.

::chat-vs-web-app
::

## Nothing posts until you set it up

::approval-promise
::

## Troubleshooting

If the connection won't show up, the sign-in window doesn't open, or a clip doesn't
appear the way you expected, see [Troubleshooting](/docs/help/troubleshooting).

::signup-cta
::

## Next steps

::next-steps
---
links:
  - to: /docs/assistants/connect-claude
    label: Connect Claude instead
  - to: /docs/getting-started/your-first-clip
    label: Make your first clip in the browser
  - to: /docs/help/troubleshooting
    label: Troubleshooting
---
::
