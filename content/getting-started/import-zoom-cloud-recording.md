---
title: Import a Zoom cloud recording
description: Check Zoom import configuration, record a meeting to the cloud, follow it into BitterClip, and verify the Episode before deleting the original.
navigation:
  label: Import a Zoom recording
  order: 2.4
section: getting-started
updated: '2026-09-03'
tags:
  - zoom
  - import
  - cloud-recording
  - getting-started
---

# Import a Zoom cloud recording

If Zoom import has been enabled for your studio, a completed cloud recording can arrive in
BitterClip without downloading and uploading it yourself. BitterClip creates one Capture
Session for the meeting, brings in the available video views, and builds an editable Episode
inside the configured Project.

This guide starts with the configuration check, then follows the exact buttons you will use. It
also includes a short confidence test for your first real meeting.

::callout{type="note"}
Zoom import is currently configured for a studio, not connected by each person from
Settings. If the Zoom section does not say **Configured**, the status underneath tells you
what is missing. **Configured** means the required deployment values and target Project are
present; it does not prove that Zoom has delivered a recording. Do not paste Zoom credentials
into a support message.
::

::zoom-import-settings-link
::

## Before the meeting

### 1. Open Zoom settings in BitterClip

1. Sign in to BitterClip.
2. Click your name or avatar in the upper-right corner.
3. Click **Settings**.
4. Scroll to **Recording import → Zoom**.

The direct link above opens the same section.

### 2. Confirm the destination

The Zoom row should say **Configured** and name the Project that will receive meetings.
Click **Open target Project** to make sure it is the destination you expect.

Look for **Last successful delivery** underneath the Project. That timestamp is stronger
evidence than **Configured**. If Settings instead says that no successful delivery has been
proven yet, use the short test meeting in this guide as your first proof and keep the Zoom
original until the entire checklist passes.

If the row says **Setup incomplete**, **Targets another Studio**, or **Not configured**, stop
there. The explanation under the status names the problem. Click **Check setup again** after
your deployment operator changes it, or contact [BitterClip support](#if-the-import-needs-attention)
before recording anything you expect to import automatically.

::callout{type="warning"}
The destination is chosen before the recording arrives. Settings does not currently let you
route an individual Zoom meeting to a different Project. Confirm the named Project first.
::

### 3. Check the Zoom side

This path works with a **Zoom cloud recording**, not a recording stored only on your
computer. In Zoom, make sure the meeting is being recorded to the cloud. End the meeting
normally and wait until Zoom says the cloud recording has finished processing.

Only record people and material you have the right and consent to record. Importing does not
publish the meeting anywhere.

## Follow the recording into BitterClip

### 4. Find the new Episode

Return to the target Project you confirmed in step 2 and reload the page. A new Episode card
will say **Importing from Zoom**. Click **View progress** to open its Capture Session.

If the card has not appeared yet, use the diagnostic path: click your name or avatar, click
**Settings**, scroll to **Recording import → Zoom**, and click **Check for updates**. Under
**Recent Zoom deliveries**, the meeting should appear as one of these states:

- **Received** — Zoom delivered the meeting and the import is waiting to start.
- **Waiting for Zoom** — Zoom is still preparing the cloud recording files, or the import is
  queued.
- **Receiving files** — BitterClip is bringing the completed files into the Capture Session.
- **Building Episode** — the files arrived and BitterClip is organizing the Episode.
- **Episode ready** — the editable Episode has been built.
- **Needs attention** — the automatic import stopped and needs a retry or manual recovery.

From a delivery row, click **Open Capture Session** when that action appears. You can leave
while an import is working. Long meetings and several video views take longer, and Zoom's
own processing happens before BitterClip receives the delivery.

### 5. Open the Capture Session

The Capture Session says whether it is **Receiving your Zoom recording** or **Building your
Episode** and checks again automatically. Do not add the same files manually while the
automatic import is still working; that can create a second, unnecessary intake attempt.

When the page says **Episode ready**, click **Open Episode**.

## Verify the first Episode

Before deleting the Zoom original, check the parts that would expose an incomplete import:

1. Play the first and last 20 seconds.
2. Find one sentence near the start and one near the end in the transcript, then play each
   one to check that the words and audio agree.
3. If the meeting used screen sharing or more than one Zoom view, click **Sources · Compact**
   (the **Inspect sources** control) and check that the useful views arrived once each.
4. Listen across two speaker changes and make sure the meeting audio is continuous.
5. Select a short passage, click **Preview as Clip**, then **Create First Cut**. When it is
   ready, click **Download MP4** and play the file through once.

Expect the meeting's mixed audio and the completed video views Zoom made available. Separate
per-participant audio and automatic participant-name assignment are not part of this import
yet.

::callout{type="tip"}
For a first confidence test, use a 5–10 minute meeting with two people. Speak near the
beginning and end, share the screen for a minute, and switch between speakers. That one test
exercises delivery, multiple views, transcription, Episode assembly, playback, and export.
::

## If the import needs attention

Keep the original cloud recording in Zoom while you recover it.

1. Return to **Settings → Recording import → Zoom**.
2. Find the meeting marked **Needs attention**.
3. Read the recovery sentence on that row. It distinguishes a retryable delivery from one
   that needs manual recovery.
4. If shown, click **Retry Zoom import** once. Expect the state to return to **Waiting for
   Zoom**.
5. If **Open Capture Session** appears, click it. Files already received are preserved there;
   follow the recovery sentence and use **Browse files** only for missing footage.
6. If there is no Capture Session and no retry, download the completed video from Zoom,
   click **Open target Project**, click **Add footage**, then **Browse files**. This creates the
   manual fallback without discarding the Zoom original.

If no meeting appears at all, confirm that Zoom finished processing a cloud recording, reload
Settings, and recheck that the Zoom row still says **Configured**. Then contact support with the
meeting topic, approximate end time, and the status shown in BitterClip. Do not send the Zoom
download link, passcode, or credentials.

::support-contact
::

## Tomorrow's confidence check

- [ ] Zoom says the test meeting's cloud recording is ready.
- [ ] BitterClip Settings shows the expected Project and either a recent successful delivery
      or the new test delivery.
- [ ] The target Project card says **Importing from Zoom** and **View progress** opens it.
- [ ] **Open Capture Session** shows progress without asking for a duplicate upload.
- [ ] **Open Episode** reaches a playable, editable Episode.
- [ ] Beginning, end, transcript timing, audio, and useful Zoom views are present.
- [ ] A short Clip exports and the downloaded MP4 plays correctly.
- [ ] The original Zoom recording remains available until every check passes.

::next-steps
---
links:
  - to: /docs/getting-started/your-first-clip
    label: Make your first clip
  - to: /docs/help/troubleshooting
    label: Troubleshooting
  - to: /docs/getting-started/projects-and-collaborators
    label: Projects and collaborators
---
::
