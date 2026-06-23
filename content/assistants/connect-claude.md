---
title: Connect Claude
description: Add BitterClip to Claude as a Connector and make your first clip in chat.
navigation:
  label: Connect Claude
  order: 2
section: assistants
updated: '2026-06-24'
tags:
  - assistants
  - claude
  - mcp
---

# Connect Claude

Connect BitterClip to Claude once and you can make clips just by asking. After that,
the BitterClip tools and a live transcript editor show up right inside your
conversation. Here's how to set it up and pull your first clip.

## Before you start

::connect-prereqs
::

::callout{type="note"}
Adding your own connector in Claude takes a paid plan (Pro, Max, Team, or Enterprise).
On the free tier there's no place to add one, so if you can't find the option, that's
usually why. It isn't anything you did wrong.
::

## Add BitterClip as a Connector in Claude

In Claude, open your settings, find the Connectors section, and add a new connector.
There's nothing to download or run on your computer.

::assistant-connection-intro
::

When Claude asks for a URL, paste in that address (the one ending in `/mcp`). Then sign
in to your BitterClip account in the browser window Claude opens. That sign-in is part
of adding the connector, not a separate step you do later.

::callout{type="note"}
Claude moves its menus around now and then, so the wording can differ from what you see
here. Look for **Connectors** (sometimes filed under integrations or tools), add a new
one, and point it at the BitterClip address above.
::

You'll know it worked when BitterClip's tools turn up in your conversation and Claude
can answer about your recordings.

## Make your first clip in chat

If your account is empty, upload a recording first so there's something to clip. You
can do that from the [browser walkthrough](/docs/getting-started/your-first-clip). Once
you have a recording, ask Claude in plain words:

::example-clip-prompt
::

## Review and export in the editor that opens

When Claude picks out a strong moment, the transcript editor opens right in the
conversation with that clip already selected. You'll see the words, who's speaking, and
the cut Claude chose. Read it over the way you'd read a paragraph. The cut comes
straight from the words you keep, so you can trace it back to the exact spot it came
from.

Nothing is final yet. Keep talking to Claude to nudge the edges ("start it on her
question," "trim the last few seconds"), or drag the selection yourself. When it looks
right, ask Claude to export it. That render is a separate step, and the finished clip
lands in your project once it's done.

::chat-vs-web-app
::

## Nothing posts until you set it up

::approval-promise
::

## Run into trouble?

If a connection won't stick or a clip doesn't show up, see the
[troubleshooting guide](/docs/help/troubleshooting).

::signup-cta
::

::next-steps
---
links:
  - to: /docs/assistants/overview
    label: Using BitterClip from your assistant
  - to: /docs/assistants/connect-chatgpt
    label: Connect ChatGPT instead
  - to: /docs/getting-started/your-first-clip
    label: Make a clip in the browser
  - to: /docs/help/troubleshooting
    label: Troubleshooting
---
::
