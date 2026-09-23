<script setup lang="ts">
// Canonical Recording -> Episode -> Clip noun block. Single source so the model
// never drifts. Includes the multi-recording (sync) example.
// Verified against apps/bitterclip-rails/app/services/bitterclip/mcp_server.rb.
// Moment is saved review intent, not an Episode or Clip.
// Invoke: ::what-is-episode
</script>

<template>
  <div class="docs-snippet">
    <p>There are three things you'll work with in BitterClip, and each one comes from the last.</p>
    <ul>
      <li>
        <strong>Recording</strong> — a video or audio file you upload. This is your raw
        source: the full interview, the whole podcast take, the long stream.
      </li>
      <li>
        <strong>Episode</strong> — the recording laid out as a transcript timeline, with the
        words lined up to the audio. This is where you actually work. An episode can be one
        recording on its own, or several recordings joined into a single timeline. When you
        upload a recording, BitterClip transcribes it and turns it into its own episode for
        you automatically.
      </li>
      <li>
        <strong>Clip</strong> — an editable cut derived from an episode. You pick the part
        worth keeping, then render it into an exact Export to download or post.
      </li>
    </ul>

    <p>
      So the path is simple: <strong>Recording → Episode → Clip</strong>. Upload a recording,
      open it as an episode, pick your clip.
    </p>

    <p>
      <strong>One episode can come from more than one recording.</strong> Say you record your
      side of a conversation and a guest records theirs. You upload your video, then add the
      guest's into the same episode. Now it's two recordings, one episode: a single timeline
      you clip from as if it were one piece.
    </p>
  </div>
</template>
