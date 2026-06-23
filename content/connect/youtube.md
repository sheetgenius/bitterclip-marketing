---
title: Connect YouTube
description: Connect a YouTube channel as a publishing destination, and clear the Brand-Account trap that quietly breaks the connection.
navigation:
  label: YouTube
  order: 1
section: connect
updated: '2026-06-24'
tags:
  - connect
  - youtube
  - publishing
---

# Connect YouTube

Once you connect a channel, BitterClip can post your finished clips to YouTube for you. One thing trips up almost everyone: the Google account you sign in with has to be able to act as the channel, and most channels live behind a Brand Account rather than a plain Gmail. Get that part right and the connection holds.

## Before you start

::connect-prereqs
::

## What connecting YouTube lets you do

::connector-scopes{connector="youtube"}
::

## Set your destination channel first

Before you connect anything, tell BitterClip which channel you're publishing to. Open **Settings** in the app, go to **Publishing accounts**, and find the YouTube row.

The simplest way to fill it in: open your channel in a browser, copy the web address from the address bar, and paste it into the channel field. A YouTube Studio, Videos, or Shorts URL all work. (If you happen to know your channel ID, the one that starts with `UC`, you can paste that instead.)

Save it, then connect. The connect flow has to know which channel to aim at, so if you skip this step it won't have a target to look for.

::callout{type="tip"}
If you already have the channel open in YouTube Studio, the address in your browser bar is exactly what you need. Copy it and paste it straight in.
::

## Connect with the right Google account

With your destination channel saved, choose **Connect** and sign in with Google. At Google's "Choose an account" step, pick the account that can actually manage that channel. This is where most people get stuck. Here's the trap and how to get past it:

::you-tube-brand-account-warning
::

Channel still won't show up? The heads-up above is almost always why. A YouTube Studio "manager" role is not the same as Brand Account access. Get yourself added on the Brand Account, choose it at the Google sign-in step, and the channel appears.

## Publishing privacy and defaults

You decide how your YouTube uploads behave by default in **Settings**, under **Publishing defaults**. That's where you set the privacy for uploads: private, unlisted, or public. The control stays greyed out until you've saved a destination channel and connected it, so sort the connection out first.

::callout{type="note"}
Depending on your YouTube account's standing, YouTube itself may force new uploads to start as private until your account is verified for public posting. If your uploads keep going private, that's coming from YouTube, not from BitterClip. You can still pick your preferred default in Settings.
::

## Posting to YouTube alongside X and LinkedIn

If you publish the same clip to several channels at once, BitterClip can drop the YouTube link into your X or LinkedIn post for you. That only happens after YouTube finishes publishing, since the link doesn't exist until the video is live. So when you line up a multi-channel post, let YouTube go out and the link follows on its own.

## Reconnecting later

::reconnect-note{connector="youtube"}
::

::next-steps
---
links:
  - to: /docs/publishing/publish-a-clip
    label: Publish a clip
  - to: /docs/connect/x
    label: Connect X
  - to: /docs/connect/linkedin
    label: Connect LinkedIn
  - to: /docs/help/troubleshooting
    label: Troubleshooting
---
::
