---
title: Connect ChatGPT
description: Connect BitterClip to ChatGPT and make your first clip right in the chat.
navigation:
  label: Connect ChatGPT
  order: 2
section: assistants
updated: '2026-06-24'
tags:
  - chatgpt
  - assistants
  - mcp
---

# Connect ChatGPT

This page walks you through connecting BitterClip to ChatGPT and asking it for your
first clip. Once it's set up, you can say "find me a good bit from this interview" and
ChatGPT opens the editor with a clip already picked out, ready for you to review.

## Before you start

::connect-prereqs
::

## Add BitterClip in ChatGPT

::assistant-connection-intro
::

BitterClip is still going through ChatGPT's app-directory review, so for now you add it
by hand as a custom app. It takes about a minute:

1. In ChatGPT, open **Settings → Apps**.
2. Scroll to **Advanced settings** and click **Create app**.
3. In the **New App** window, fill in:
   - **Name** — BitterClip
   - **Connection** — leave this on **Server URL** and paste the address above (it ends in `/mcp`): `https://app.bitterclip.com/mcp`
   - **Authentication** — OAuth
4. Tick **"I understand and want to continue"** (ChatGPT shows this for any app it hasn't reviewed itself), then click **Create**.

[screenshot: ChatGPT's New App window with the BitterClip name, the /mcp server URL, and OAuth selected]

::callout{type="note"}
ChatGPT moves its menus and labels around now and then, so the exact wording may differ.
The shape stays the same: **Settings → Apps → Advanced settings → Create app**, then point
it at the BitterClip address. Once BitterClip is published in ChatGPT's app directory,
you'll add it from there with no Create-app step. Stuck? See
[Troubleshooting](/docs/help/troubleshooting).
::

## Sign in to BitterClip

When you click **Create**, ChatGPT opens a browser window to sign you in to BitterClip and
authorize the connection. Approve it and you're set — that's the only sign-in step.

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

::signup-cta
::
