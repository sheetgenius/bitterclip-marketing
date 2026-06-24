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

## Add BitterClip as a connector in Claude

::assistant-connection-intro
::

There's nothing to download or run on your computer:

1. In Claude, open **Settings → Connectors** and click **Add custom connector** (it's marked BETA).
2. Fill in:
   - **Name** — BitterClip
   - **URL** — paste the address above (it ends in `/mcp`): `https://app.bitterclip.com/mcp`
   - Leave **Advanced settings** (OAuth Client ID / Secret) blank — you don't need them.
3. Click **Add**.

![Claude's "Add custom connector" dialog with BitterClip and the app.bitterclip.com/mcp URL](/img/docs/claude-add-custom-connector.png)

## Connect and sign in

BitterClip now shows up in your connectors with **"You are not connected to BitterClip yet."**
Click **Connect**, then sign in to your BitterClip account in the window Claude opens. That's
the only sign-in step.

![Claude showing BitterClip not connected yet, with a Connect button](/img/docs/claude-connect.png)

::callout{type="tip"}
Optional: on the BitterClip connector's page you can set **Tool permissions** to **Always
allow** so Claude stops asking each time it opens an episode or reads a transcript. You can
also allow tools one at a time.
::

![Claude's BitterClip connector page with tool permissions set to Always allow](/img/docs/claude-tool-permissions.png)

::callout{type="note"}
Claude moves its menus around now and then, so the wording can differ. The shape stays the
same: **Settings → Connectors → Add custom connector**, point it at the BitterClip address
above, then click **Connect** to sign in.
::

You'll know it worked when BitterClip's tools turn up in your conversation and Claude can
answer about your recordings.

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
