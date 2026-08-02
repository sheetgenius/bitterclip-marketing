---
title: Import your YouTube archive
description: Export videos you uploaded with Google Takeout, then bring the ZIP files into BitterClip as source-linked Episodes.
navigation:
  label: Import your YouTube archive
  order: 2.5
section: getting-started
updated: '2026-08-01'
tags:
  - youtube
  - import
  - google-takeout
  - getting-started
---

# Import your YouTube archive

If you uploaded a collection of videos to YouTube, Google Takeout gives you a direct way to
export them. BitterClip can inspect that export, let you choose what belongs together, and
turn each selected video into an Episode inside one Project.

This is an archive import, not a YouTube downloader and not a publishing connection. Use it
only for videos you uploaded or otherwise have the right to copy. See
[Connect YouTube](/docs/connect/youtube) when you want BitterClip to publish finished clips
to your channel.

::callout{type="warning"}
Importing does not publish anything. A label such as **Public**, **Unlisted**, or **Private**
describes how the source was set on YouTube; it does not change the Episode's visibility or
post it anywhere.
::

## 1. Create one Google Takeout export

1. Sign in to the Google Account that owns the channel, then open
   [Google Takeout](https://takeout.google.com/).
2. Choose **Deselect all**.
3. Select **YouTube and YouTube Music**. Open **All YouTube data included** and make sure
   your uploaded videos and their metadata are included.
4. Choose **Next step**.

Choose **Export once**. A recurring export is unnecessary for a first import.

If the channel belongs to a Brand Account, switch to the Brand Account used to upload the
videos before making the export. Google's
[Takeout help](https://support.google.com/accounts/answer/3024190) explains the account
switch and the full export process.

## 2. Choose ZIP and an archive size

Choose **.zip** as the file type. For the maximum archive size:

- **50 GB is recommended** because it gives Google more room to keep the export in fewer
  parts.
- **2 GB works too.** It creates more ZIP files for a large channel, and you will need to
  download and provide every part.

The size setting only controls where Google splits the archive. It does not change the
resolution of the videos inside it. Choose your delivery method, then select **Create
export**. Google will notify you when the files are ready.

## 3. Download every part

Download all of the ZIP files Google created for this export. Keep them zipped and together
in one folder until the import is complete.

::callout{type="tip"}
An export split into six ZIP files is still one archive. Missing one part can mean missing
videos or metadata in BitterClip.
::

## 4. Open the importer

Sign in to BitterClip, open the account menu, and choose **Import YouTube archive**. You can
drop in one ZIP, select all of the ZIP parts together, or choose a folder that contains
them.

BitterClip first inspects the ZIP files in your browser. It finds the videos and reads the
metadata without sending the whole archive to BitterClip as one giant upload. Nothing is
imported until you review the map and start the import.

## 5. Review the map and choose a Project

The review shows the videos BitterClip found, their total running time and size, and any
metadata or matching warnings. For each video, BitterClip uses as much Takeout metadata as
is available, including its:

- title and description;
- YouTube create or publish timestamp, kept as source provenance rather than treated as a
  recording date;
- source privacy label; and
- video filename and technical details.

When the same upload appears in more than one rendition, BitterClip selects the
highest-resolution copy present in the Takeout files. You can still deselect any video you
do not want to import.

Choose one destination for the selected videos:

- **Create a new Project** when the archive belongs to one show or series.
- **Use an existing Project** when those Episodes belong with work already in BitterClip.

If the archive contains several shows, import one selection into its Project, then return
and import another selection into a different Project.

## 6. Start the import

BitterClip extracts and uploads each selected video individually. Every video becomes its
own Episode in the Project you chose. The screen shows the current file, completed Episodes,
items still waiting, and anything that needs attention.

Large archives take time, but completed Episodes are saved as the batch proceeds. Media
inspection and transcription can continue after a video is stored, so an Episode may need a
little more time before its transcript is ready.

Nothing in this flow publishes to YouTube or any other channel.

## Continue an interrupted import

Keep the original ZIP files until the batch is finished. If you close the tab or lose your
connection:

1. Return to **Import YouTube archive** and choose **Continue**.
2. Select the same complete set of ZIP files again.
3. BitterClip restores the original Project choice and selection, keeps completed Episodes,
   and resumes the remaining work.

Choosing the same archive again does not require a second media transfer for a Recording
that BitterClip has already completed.

## What video quality should you expect?

BitterClip preserves the highest-resolution rendition it finds in your Takeout archive. It
does not reach back into YouTube to fetch a different copy.

Google says Takeout may provide an uploaded video in its original format or as an H.264/AAC
MP4. That exported copy may be compressed and can differ from the camera master or another
original you kept. If you have a higher-quality master, upload that file directly instead.
Google's [YouTube owner-download help](https://support.google.com/youtube/answer/56100?hl=en) also
explains the difference between downloading one of your uploads and exporting all of them
with Takeout.

## Troubleshooting

### Some videos are missing

Confirm that you downloaded every ZIP part and included videos in the Takeout selection. If
the missing uploads belong to a Brand Account, switch to that Brand Account and create a new
export. Google specifically calls out Brand Accounts as a common reason videos are absent.

### Titles or descriptions are missing

Some exports contain less metadata than others. BitterClip will flag missing details and use
the video filename as a fallback title. You can edit the Episode after import.

### The import stopped partway through

Choose **Continue** and select the same ZIP set. Already completed Episodes are safe. If the
screen shows a plan or billing action, follow that prompt before resuming; a collaborator may
need the Project owner to do this.

### The Episode exists but has no transcript yet

The video upload and the transcription are separate steps. Leave the Project open or return
later; processing continues in the background.

::next-steps
---
links:
  - to: /docs/getting-started/projects-and-collaborators
    label: Organize Projects and collaborators
  - to: /docs/getting-started/your-first-clip
    label: Make a clip from an Episode
  - to: /docs/connect/youtube
    label: Connect YouTube for publishing
  - to: /docs/help/troubleshooting
    label: Troubleshooting
---
::
