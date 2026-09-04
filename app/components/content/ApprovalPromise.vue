<script setup lang="ts">
// The safety promise. Grounded in the two-phase publish confirmation: every external send
// waits for one explicit "Publish now?" on the exact export. Invoke: ::approval-promise
</script>

<template>
  <div class="docs-snippet">
    <p>
      You stay in control of what goes out. Nothing gets posted until you set up a channel
      first, and connecting one only lets BitterClip post when you confirm a specific post.
    </p>
    <p>
      Every send works the same way: BitterClip prepares the post, shows you the exact
      export, destination, and account, and asks once, "Publish now?" Only that post goes
      out. There is no setting that posts on its own.
    </p>
    <p>
      Your account, your plan, and your payment details always live on BitterClip's own
      site, and nothing you connect can reach them.
    </p>
  </div>
</template>
