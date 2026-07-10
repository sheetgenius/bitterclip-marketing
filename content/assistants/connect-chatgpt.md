---
title: Connect ChatGPT
description: Connect BitterClip to ChatGPT and make your first clip right in the chat.
navigation:
  label: Connect ChatGPT
  order: 2
section: assistants
updated: '2026-07-10'
tags:
  - chatgpt
  - assistants
  - mcp
---

# Connect ChatGPT

This page walks you through connecting BitterClip to ChatGPT and asking it for your
first clip. Once it's set up, you can say "find me a good bit from this interview" and
ChatGPT opens the editor with a clip already picked out, ready for you to review.

::callout{type="note"}
ChatGPT supports apps across plans, but access to custom developer apps and the actions
they may take can depend on your workspace policy. If the controls below are missing, ask
your workspace admin or use BitterClip in your browser or [connect Claude](/docs/assistants/connect-claude).
::

## Before you start

::connect-prereqs
::

## Add BitterClip in ChatGPT

::assistant-connection-intro
::

BitterClip is not in ChatGPT's public plugin directory yet. Until its plugin is approved
and published, add it as a custom developer app:

1. Open ChatGPT **Settings → Security and login** and turn on **Developer mode**. Your workspace may require an admin to make this available.
2. Open **Settings → Plugins**, or go to `chatgpt.com/plugins`.
3. Click **Create** to add a plugin.
4. In the **New App** window, fill in:
   - **Name** — BitterClip
   - **Connection** — leave this on **Server URL** and paste the address above (it ends in `/mcp`): `https://app.bitterclip.com/mcp`
   - **Authentication** — OAuth
5. Accept ChatGPT's developer-app warning, then click **Create**.

![ChatGPT Settings, Apps tab — "Create app" sits next to Advanced settings](/img/docs/chatgpt-apps-create-app.png)

![ChatGPT's New App window with BitterClip's name, the app.bitterclip.com/mcp server URL, and OAuth selected](/img/docs/chatgpt-new-app-dialog.png)

::callout{type="note"}
ChatGPT moves its menus and labels around, so the exact wording can differ. The shape stays
the same: enable developer mode, create a plugin pointed at the BitterClip address, and
authorize it. Once BitterClip's public plugin is available, you will add it from ChatGPT's
plugin directory instead. Stuck? See
[Troubleshooting](/docs/help/troubleshooting).
::

## Sign in to BitterClip

When you click **Create**, ChatGPT opens a browser window to sign you in to BitterClip and
authorize the connection. Approve it and you're set. That's the only sign-in step.

## Make your first clip in chat

If your account is empty, upload a recording first so there's something to clip. The
[browser walkthrough](/docs/getting-started/your-first-clip) shows you how. Once you have
one, just ask:

::example-clip-prompt{prompt="Pull up my latest interview and find the strongest moment."}
::

ChatGPT opens that episode in BitterClip's transcript editor, with the suggested clip's
words highlighted right in the transcript. Nothing is rendered yet, so take your time.
Read it like you'd read a paragraph. If the cut needs nudging, keep talking to ChatGPT
or drag the edges yourself. When it looks right, ask ChatGPT to export it. That's when
BitterClip renders the finished video and drops it in your project.

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
