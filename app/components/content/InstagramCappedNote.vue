<script setup lang="ts">
// The honest Instagram reality block. Reads the instagram row from _data/connectors.yml
// so a future un-cap is one edit: flip status/auto_publish there and this copy follows.
// Invoke: ::instagram-capped-note
const { data: instagram } = await useAsyncData('connector-instagram', async () => {
  const doc = await queryCollection('connectors').first()
  return doc?.connectors.find((c) => c.connector === 'instagram') ?? null
})

// Capped = Instagram is connectable but direct auto-publish to your feed isn't reliable yet.
const isCapped = computed(
  () => !instagram.value || instagram.value.auto_publish === false,
)

// The one-liner summary is single-sourced in connectors.yml, not retyped here, so an
// edit to that row follows through to this block.
const summary = computed(() => instagram.value?.reconnect_note ?? '')
</script>

<template>
  <!-- When Instagram is capped, tell the honest story; when a future edit flips
       auto_publish on, show the simple "it just posts" version instead. -->
  <Callout v-if="isCapped" type="note">
    <p v-if="summary">{{ summary }}</p>
    <p>
      Here's the longer story. You'll see a Connect Instagram button in Settings, and it does
      work: it signs you in with Instagram. What's not reliable yet is having BitterClip post
      a clip straight to your feed for you, and that's on Instagram's side, not ours. Meta
      only allows that for professional accounts (Business or Creator), it wants a linked
      Facebook Page, and it requires an app review we haven't taken on at this stage. Most
      creators post from a personal account, so we'd rather not send you down a setup maze
      that may still not work.
    </p>
    <p>
      The path that works today is simple. Make your clip in BitterClip, download it, and get
      it onto your phone (AirDrop, a shared cloud folder, or download it on your phone's
      browser). Then open the Instagram app and post it the way you normally would. BitterClip
      still does the hard part, finding the moment and cutting it cleanly, and you post it
      yourself.
    </p>
  </Callout>

  <Callout v-else type="tip">
    <p>
      Instagram is connected. Once you've connected it in Settings, BitterClip can post your
      finished clip straight to your feed — no downloading or phone hand-off needed.
    </p>
  </Callout>
</template>
