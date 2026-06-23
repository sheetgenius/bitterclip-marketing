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

## Add the BitterClip connection in ChatGPT

::assistant-connection-intro
::

BitterClip is still going through ChatGPT's app-directory review, so for now you add it
by hand. Open ChatGPT's settings, turn on Developer Mode, and add a new connection. When
ChatGPT asks for a URL, paste in the address above (it ends in `/mcp`), then sign in.
Once the BitterClip app is published, you'll add it the same way you'd add any app, with
no Developer Mode step.

[screenshot: ChatGPT settings with the Developer Mode toggle and the "add connection" screen]

::callout{type="note"}
ChatGPT moves its menus and labels around now and then, so the exact wording may differ
from what you see. Look for the place to add a connection or app, and point it at the
BitterClip address. If you don't see Developer Mode at all, the
[Troubleshooting](/docs/help/troubleshooting) page has what to try next.
::

## Sign in to BitterClip

When you add the connection, ChatGPT opens a browser window so you can sign in. That's
the only sign-in step.

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
