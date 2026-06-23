<script setup lang="ts">
// The safety promise, softened for the real project-level auto-vs-approval mode.
// Grounded in Show#publish_mode ("approval" default | "auto"). Invoke: ::approval-promise
</script>

<template>
  <div class="docs-snippet">
    <p>
      You stay in control of what goes out. Nothing gets posted until you set up a channel
      first, and connecting one just lets BitterClip post on your behalf when you ask it to.
    </p>
    <p>
      Each project has its own publishing setting, and you choose which one fits:
    </p>
    <ul>
      <li>
        <strong>Wait for my approval</strong> (the default): clips are prepared as drafts
        and sit ready for you to look over. Nothing goes out until you say so.
      </li>
      <li>
        <strong>Publish automatically</strong>: once you turn this on for a project, ready
        clips post to your connected channels on their own. You opt into it, so it's never
        the starting point.
      </li>
    </ul>
    <p>
      Your account, your plan, and your payment details always live on BitterClip's own
      site, and nothing you connect can reach them.
    </p>
  </div>
</template>
