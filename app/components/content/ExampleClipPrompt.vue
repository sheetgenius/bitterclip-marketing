<script setup lang="ts">
// A reusable example natural-language prompt a creator can paste to their assistant.
// Matches the product's clip-suggestion flow: a "find the moment" ask makes the
// assistant open the episode in the transcript editor with a clip already picked
// (the open_workspace greeting). Optional `prompt` prop overrides the default example.
// Invoke: ::example-clip-prompt  or  ::example-clip-prompt{prompt="Find my best moment"}
withDefaults(defineProps<{ prompt?: string }>(), {
  prompt: 'Pull up my latest interview and find the strongest moment.',
})
</script>

<template>
  <div class="docs-snippet docs-example-prompt">
    <p>Once your assistant is connected, you can just ask in plain words. Try:</p>
    <blockquote class="docs-example-prompt__quote">
      <p>"{{ prompt }}"</p>
    </blockquote>
    <p>
      BitterClip opens that episode for you right in the chat, with a strong clip already
      picked out and the cut ready to review. From there you can keep talking to it: "make it
      a bit shorter," "start it on her question," "find me one more." It adjusts until the
      clip is right.
    </p>
  </div>
</template>
