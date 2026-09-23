---
title: Connect Claude
description: Add BitterClip to Claude as a Connector and review your first source-backed clip.
navigation:
  label: Connect Claude
  order: 3
section: assistants
updated: '2026-09-04'
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
Claude supports custom connectors on Free, Pro, Max, Team, and Enterprise plans. A Free
account can add one custom connector, so BitterClip can be that one.
::

## Add BitterClip as a connector in Claude

::assistant-connection-intro
::

There's nothing to download or run on your computer. Claude now keeps Skills, Connectors,
Plugins, and Settings as separate sections under **Customize**. BitterClip is a Web / Custom
connector, not a Claude plugin:

1. In Claude, open **Customize → Connectors** and click **+ → Add custom connector**.
2. In **Step 1 of 2**, fill in:
   - **Name** — BitterClip
   - **URL** — paste the address above (it ends in `/mcp`): `https://app.bitterclip.com/mcp`
3. Click **Continue**. Leave OAuth Client ID and Secret blank if the next step shows
   advanced settings; BitterClip and Claude discover the connection automatically.
4. Finish adding the connector.

## Connect and sign in

BitterClip now shows up in **Customize → Connectors**. If it shows a **Connect** button,
click it. Claude opens BitterClip so you can sign in and approve the connection. When you
return, the row should say **Connected**.

BitterClip's current connector token lasts up to 30 days and does not refresh in the
background. If the connector later asks you to sign in again, reconnect it; you do not need
to remove and re-add it.

## Enable BitterClip in this conversation

Connected and enabled are separate. In the chat composer, click **+ → Connectors** and make
sure BitterClip is checked for this conversation. You can turn it off there whenever the
conversation does not need access to your recordings.

::callout{type="tip"}
Claude's BitterClip page groups tools as **Interactive**, **Read-only**,
**Write/delete**, and **App-only**. Keep Interactive and Write/delete tools on **Needs
approval**. To reduce prompts, allow only the exact reads you trust—such as **List episodes**
and **Read an episode**—instead of changing a whole group to Always allow.
::

Claude conservatively puts **Check render status** in Write/delete. Checking does not start
or charge a render, but it may tidy the delivery record for a finished Clip, so leaving it
on **Needs approval** is the honest default.

::callout{type="note"}
Claude moves its menus around now and then, so the wording can differ. The shape stays the
same: **Customize → Connectors → Add custom connector**, point it at the BitterClip address
above, authorize it, then enable it in the conversation where you want to use it.
::

You'll know it worked when BitterClip's tools turn up in your conversation and Claude can
answer about your recordings.

Before asking Claude to cut anything, try this small check:

> "Using BitterClip, list my three latest episodes with their titles and lengths. Don't
> open, edit, render, or publish anything."

That proves the connector is enabled and signed in without changing your work.

## Make your first clip in chat

If your account is empty, upload a recording first so there's something to clip. You
can do that from the [browser walkthrough](/docs/getting-started/your-first-clip). Once
you have a recording, ask Claude in plain words:

::example-clip-prompt
::

## Review and export in the editor

Claude can inspect the Episode, explain a promising stretch, and save a review point.
Ask it to prepare the Episode editor when you want to inspect the source. A host that
supports BitterClip's interactive workspace can open it in the conversation; you can
also open the same Episode in BitterClip's browser. Check the words, speakers, and
boundaries before asking for an editable Clip.

Keep talking to Claude to revise the cut ("start it on her question," "trim the last few
seconds"), or edit it in the browser. When the Clip looks right, ask Claude to render
an Export. Rendering is a separate step; the exact finished version appears in your
Project once it is ready.

::chat-vs-web-app
::

## Nothing posts until you set it up

::approval-promise
::

## Troubleshooting

If Claude says no BitterClip tools are available even though Customize shows
the connector as Connected, open **+ → Connectors** in that conversation and
turn BitterClip on. Account-level connection and conversation-level enablement
are separate; without the toggle Claude may try an unrelated artifact or code
tool instead.

The finished BitterClip card can mount even when Claude's prose says it cannot
confirm what the host displayed. Trust the visible card: it should show the
Clip title, Ready status, Play preview, Download MP4, and Open in editor. The
model's tool summary and the host's rendered UI are separate evidence layers.

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
