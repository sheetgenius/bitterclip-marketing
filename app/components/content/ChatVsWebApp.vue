<script setup lang="ts">
// The MCP-UI-vs-web-app responsibility split, single-sourced so connect-chatgpt and
// connect-claude (and anywhere else) describe the boundary identically and the app link
// stays out of page prose. Reads app_origin from _data/site.yml. Invoke: ::chat-vs-web-app
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
const appOrigin = computed(() => site.value?.app_origin ?? 'https://app.bitterclip.com')
const appLabel = computed(() =>
  appOrigin.value.replace(/^https?:\/\//, ''),
)
</script>

<template>
  <aside class="docs-callout" data-type="tip" role="note">
    <p class="docs-callout__label">
      <span class="docs-callout__icon" aria-hidden="true">✨</span>
      Tip
    </p>
    <div class="docs-callout__body">
      <p>
        Chat is where you find and tune a clip. For the rest of the work, open the
        BitterClip app at <a :href="appOrigin">{{ appLabel }}</a>: that's where you browse
        every clip you've made, organize your projects, and manage the channels you post
        to. Your assistant is one way in; the web app is the full workshop.
      </p>
    </div>
  </aside>
</template>
