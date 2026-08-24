<script setup lang="ts">
// Shared "before you start" block for connector + publishing guides.
// Optional `publishing` prop adds the "something to publish" line.
// Invoke: ::connect-prereqs{:publishing="true"}
withDefaults(defineProps<{ publishing?: boolean }>(), { publishing: false })
</script>

<template>
  <div class="docs-snippet">
    <p>A couple of things to have ready first:</p>
    <ul>
      <li>
        A BitterClip account. The Creator trial lasts seven days and requires a card:
        $0 today, then $24/month unless canceled before it ends. It includes $5 of
        agent work for one recording up to two hours. Producer is $99/month.
      </li>
      <li>A recording you've uploaded, so you have something to clip.</li>
      <li v-if="publishing">A clip you've already exported.</li>
      <li v-if="publishing">A connected channel to send it to.</li>
    </ul>
    <p>You manage your connections under <strong>Settings</strong> in the BitterClip app.</p>
  </div>
</template>
