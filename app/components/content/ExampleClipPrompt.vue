<script setup lang="ts">
// A reusable example natural-language prompt a creator can paste to their assistant.
// A suggestion points to source-backed evidence; write-capable connections can
// save a review point and prepare the editor. Optional `prompt` overrides this example.
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
      Your assistant can inspect the Episode and point to a promising stretch. With a
      connection that supports write actions, it can save a review point and prepare the
      Episode editor. Review the source, then ask it to make a Clip or adjust a cut.
    </p>
  </div>
</template>
