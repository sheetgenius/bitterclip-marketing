---
title: Publish a clip
description: Send a finished clip to your connected channels. Review the post, choose how a project publishes, and check on it after it goes out.
navigation:
  label: Publish a clip
  order: 1
section: publishing
updated: '2026-06-24'
tags:
  - publishing
  - youtube
  - x
  - linkedin
---

# Publish a clip

Once you've exported a clip, BitterClip can send it to your connected channels: YouTube,
LinkedIn, and X. You review each post before it goes out, and the project decides whether
posts wait for your okay or publish on their own.

(Instagram works differently. There's no reliable one-click posting to it yet, so you hand
the clip to your phone instead. See [Connect Instagram](/docs/connect/instagram) for the way
that works today.)

## Before you start

::connect-prereqs{:publishing="true"}
::

New here? Make a clip first in [Your first clip](/docs/getting-started/your-first-clip). The
clip needs to finish exporting before you can publish it, because publishing sends that
rendered output.

## Choose how a project publishes

Each project decides for itself whether posts wait for you or go out on their own. Pick the
setting that fits before you publish anything.

::approval-promise
::

## Review the post before it goes out

::callout{type="note"}
A **package** is just your finished post for one channel: the clip, the caption that goes
with it, and where it's headed. Think of it as the post staged for you to check, not yet
sent.
::

When you ask BitterClip to publish, it builds one of these packages for each channel. You
look it over, read the caption, check the destination, watch the clip, and then your
project's setting takes over.

[screenshot: reviewing a publish package]

If the project waits for your approval, the package sits as a draft until you approve it. If
the project publishes automatically, the ready channels post as soon as the package is built.

::callout{type="tip"}
You can do all of this by chatting with ChatGPT or Claude. Ask it to publish the clip, look
over what it shows you, and approve when it reads right.
::

## Publish a whole episode at once

You don't have to post one clip at a time, and you don't have to repeat yourself for each
channel. BitterClip can take a whole episode's finished output and prepare it for YouTube,
LinkedIn, and X in one step. It builds one package per channel, then your project's
publishing setting handles the rest.

A channel counts as ready when it's connected and still has permission to post. A channel you
connected a while ago can go stale and need reconnecting. The note at the bottom of this page
points you to each channel's setup.

## Publishing a longer, assembled video

The same publishing flow works when you've stitched several pieces into a longer video, not
just a single clip. Once that longer video has finished rendering, you review and send it the
same way: a package per channel, your project's setting deciding what happens next.

## Check on a post after publishing

Publishing runs in the background, so a post can take a moment to land. You can check the
status of anything you've sent, in the BitterClip app or by asking your assistant in chat, to
see whether it's still working, finished, or waiting on you.

If a post simply fails, BitterClip flags it for review. Open it, fix what it points to (often
a caption, or a channel that needs reconnecting), and try again. For a stuck post that won't
clear, see [Troubleshooting](/docs/help/troubleshooting).

## If a post needs a second look

Sometimes BitterClip can't tell whether a post actually went out. When that happens, it asks
you to check the channel before retrying instead of failing outright. Don't hit publish
again. Go look at the channel first, because the post may already be live, and republishing
would create a duplicate. Once you've confirmed what's really there, BitterClip can bring its
record back in line.

::callout{type="warning"}
A "verify before retrying" prompt means BitterClip isn't sure the post made it. Check the
channel before you try again, so you don't post the same clip twice.
::

## Where your publishing defaults live

You don't have to set the same things every time. In the BitterClip app, open **Settings**
and find the **Publishing defaults** section. You can set, in this order:

- **Platforms**: the channels a new package goes to by default.
- **YouTube privacy**: how a YouTube upload starts. Private is the safe default, since a
  fresh upload can't go fully public until it's been reviewed.
- **Default tags**.
- **Post body template**: default copy for your X or LinkedIn posts.

Set these once and every new package starts from them.

::callout{type="note"}
Each channel has its own setup steps worth knowing first. See
[Connect YouTube](/docs/connect/youtube), [Connect X](/docs/connect/x), and
[Connect LinkedIn](/docs/connect/linkedin) for the sign-in details and reconnect steps,
including the channel-account trap that quietly breaks YouTube connections.
::

::next-steps
---
links:
  - to: /docs/getting-started/find-and-share-clips
    label: Find and share your clips
  - to: /docs/help/troubleshooting
    label: Troubleshooting
  - to: /docs/connect/youtube
    label: Connect YouTube
  - to: /docs/connect/x
    label: Connect X
  - to: /docs/connect/linkedin
    label: Connect LinkedIn
---
::
