# BitterClip Docs

Canonical HTML page: https://bitterclip.com/docs

Markdown version: https://bitterclip.com/docs.md

## How A Clip Gets Made

BitterClip turns a recording into clips you can trust, in three nouns:

```text
Recording -> Moment -> Clip
```

Your AI selects the words. BitterClip derives the cut from the audio. No
timeline guessing is required, and the model does not invent timestamps.

## Recording

You bring a video or audio file. BitterClip transcribes it to time-aligned
words. That transcript becomes the canonical timing signal for everything
downstream.

## Moment

Your AI reads the transcript and proposes moments worth clipping by selecting
words, not timestamps.

BitterClip derives the start and end from the first and last selected word, adds
a little breathing room, and snaps the cut to the audio. This keeps clips from
landing mid-syllable.

## Clip

You confirm or adjust the edges. BitterClip renders a captioned MP4 with the
transcript and an SRT. Every clip stays linked to its recording, speaker, exact
words, and timestamp so the source chain remains traceable.

## Media Custody

Recordings and rendered clips live in the user's BitterClip workspace. Each clip
carries source context: recording, speaker, selected words, timestamp, and the
path from source to share.

## Developer Surface

BitterClip is a remote MCP server. The tools an AI calls, and the bridge the
editor runs on, are documented at:

https://bitterclip.com/mcp
