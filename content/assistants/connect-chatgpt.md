---
title: Connect ChatGPT
description: Use the BitterClip plugin in ChatGPT, or connect the MCP server directly for development testing.
navigation:
  label: Connect ChatGPT
  order: 2
section: assistants
updated: '2026-09-04'
tags:
  - chatgpt
  - assistants
  - mcp
---

# Connect ChatGPT

This page walks you through opening the installed BitterClip plugin in ChatGPT,
checking the connection without changing anything, and opening an Episode in
the chat. A direct MCP-server connection remains a developer/testing path.

::callout{type="note"}
ChatGPT's Plugin directory is visible across plans, but the included capabilities
and actions are not. An installed BitterClip plugin and a raw custom MCP
connection do not have the same plan boundary. OpenAI currently limits Pro
custom MCP connections to read/fetch and documents full custom-MCP writes as a
Business and Enterprise/Edu beta. An installed BitterClip Prod plugin was able
to create, edit, and render on the Pro account used for our 2026-09-04 host
check. Your workspace policy, role, region, model, and rollout can still narrow
that behavior.
::

## Before you start

::connect-prereqs
::

## Add BitterClip in ChatGPT

::assistant-connection-intro
::

BitterClip may already be installed or available to your ChatGPT account. A
**plugin** is the package ChatGPT distributes and can contain Skills, an MCP
server, or both. Installed details may separately call the connected
integration an **App**.

If **BitterClip Prod** is available:

1. Open ChatGPT **Plugins**.
2. Select **BitterClip Prod** and review its privacy and permission information.
3. Choose **Try in chat**.
4. Confirm the **BitterClip Prod** pill is selected in the composer.

That installed-plugin path does not require Developer mode. If BitterClip Prod
is not available and you are testing the raw MCP endpoint as a developer, use
the direct-server flow instead:

1. Open ChatGPT **Settings → Security and login** and turn on **Developer mode**. Your workspace may require an admin to make this available.
2. Open the top-level **Plugins** page at `chatgpt.com/plugins` and click the plus button.
3. Enter **Name** — BitterClip — and a short description.
4. Under **Connection**, choose the public **Server URL** method and paste the address above (it ends in `/mcp`): `https://app.bitterclip.com/mcp`.
5. Create the connection. ChatGPT discovers BitterClip's OAuth setup automatically; sign in and approve the connection when prompted.
6. Review the tools and metadata ChatGPT discovered.

::callout{type="note"}
ChatGPT moves its menus and labels around, so the exact wording can differ.
Prefer the installed plugin when it is available. Enable Developer mode only
when you deliberately need to add an unpublished MCP server URL. Stuck? See
[Troubleshooting](/docs/help/troubleshooting).
::

## Sign in to BitterClip

An installed plugin may already be connected. If ChatGPT asks you to connect or
reconnect it, complete the BitterClip sign-in and authorization window, then
review the discovered tools. A raw Developer-mode connection follows the same
OAuth authorization step.

BitterClip's current connector token lasts up to 30 days and does not refresh in the
background. If access later stops, reconnect BitterClip and sign in again.

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

This section requires the selected BitterClip plugin or connection to expose
write actions. The installed BitterClip Prod plugin did so on the Pro account
used for our latest host check. A raw Pro custom-MCP connection remains subject
to OpenAI's documented read/fetch boundary.

If your account is empty, upload a recording first so there's something to clip. The
[browser walkthrough](/docs/getting-started/your-first-clip) shows you how. Once you have
one, just ask:

::example-clip-prompt{prompt="Pull up my latest interview and find the strongest moment."}
::

ChatGPT can inspect the Episode and point to a promising stretch. If your selected plugin
has write actions, it can save a review point and prepare the Episode editor. Inspect the
source and choose the cut there; asking for a Clip saves an editable cut, while asking
for an Export starts a separate render. A raw read/fetch-only connection can explain its
findings and direct you to continue in BitterClip's browser.

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
