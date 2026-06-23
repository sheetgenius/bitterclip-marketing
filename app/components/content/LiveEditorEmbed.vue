<script setup lang="ts">
// Mounts the real BitterClip transcript editor — the exact same editor that opens
// inside ChatGPT and Claude — via the app's bare /embed/clip-demo iframe.
// Migrated from app/pages/mcp.vue: postMessage auto-resize, ?embed= dev override,
// mobile activation gate, skeleton loader. Reads app_origin from the `site` data file.
// MUST carry the fixtures-only caveat. Invoke: ::live-editor-embed
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)

const appOrigin = computed(() => site.value?.app_origin ?? 'https://app.bitterclip.com')

const embedUrl = ref(`${appOrigin.value}/embed/clip-demo?bare=1`)
const iframeHeight = ref(540)
const isIframeLoading = ref(true)
const demoActivated = ref(true)

const onIframeLoad = () => {
  isIframeLoading.value = false
}

const activateDemo = () => {
  demoActivated.value = true
}

const handleMessage = (event: MessageEvent) => {
  // The embed posts its own measured height up so the iframe never scrolls inside itself.
  if (event.data && typeof event.data === 'object' && 'height' in event.data) {
    const height = Number((event.data as { height: unknown }).height)
    if (!isNaN(height) && height > 200 && height < 1500) {
      iframeHeight.value = height
    }
  }
}

onMounted(() => {
  // Base URL is overridable via ?embed= for local testing against a dev server,
  // e.g. ?embed=http://localhost:3000/embed/clip-demo — read on the client so it
  // still works on the statically generated page.
  const override = new URLSearchParams(window.location.search).get('embed')
  const base = (override || `${appOrigin.value}/embed/clip-demo`).split('?')[0]
  // Point at a real demo clip the marketing site hosts, so Play and Export work.
  const clip = `${window.location.origin}/clips/day-1-opening.mp4`
  embedUrl.value = `${base}?bare=1&clip=${encodeURIComponent(clip)}`

  // On small screens, wait for a tap before loading the iframe (saves bandwidth).
  if (window.innerWidth < 768) {
    demoActivated.value = false
  }

  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <figure class="docs-snippet docs-live-editor">
    <div class="docs-live-editor__shell">
      <div class="docs-live-editor__bar">
        <span class="docs-live-editor__dot" aria-hidden="true"></span>
        Live editor · demo mode
      </div>

      <!-- Mobile activation gate -->
      <div v-if="!demoActivated" class="docs-live-editor__gate">
        <h4>The same editor your assistant opens.</h4>
        <p>Drag across the words to cut a clip. Tap to load it.</p>
        <button type="button" @click="activateDemo">Load the editor</button>
      </div>

      <!-- Skeleton while the iframe boots -->
      <div
        v-if="demoActivated && isIframeLoading"
        class="docs-live-editor__skeleton"
        aria-hidden="true"
      >
        <div class="docs-live-editor__spinner"></div>
        <span>Loading the editor…</span>
      </div>

      <iframe
        v-if="demoActivated"
        :src="embedUrl"
        title="BitterClip — the live transcript editor"
        loading="lazy"
        class="docs-live-editor__frame"
        :style="{ height: `${iframeHeight}px` }"
        @load="onIframeLoad"
      />
    </div>
    <figcaption class="docs-live-editor__caveat">
      This is the same editor ChatGPT and Claude open for you. Try it: drag across the words
      to pick a clip, then press play and watch the cursor land on each word. It runs on a
      sample recording, so nothing you do here is saved. You don't need an account.
    </figcaption>
  </figure>
</template>

<style scoped>
.docs-live-editor {
  margin: 1.5rem 0;
}
.docs-live-editor__shell {
  position: relative;
  min-height: 300px;
  border: 1px solid var(--ui-border, #27272a);
  border-radius: 0.75rem;
  overflow: hidden;
  background: #060608;
}
.docs-live-editor__bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font: 600 0.7rem/1 ui-monospace, monospace;
  letter-spacing: 0.04em;
  color: #71717a;
  background: #09090b;
  border-bottom: 1px solid rgba(39, 39, 42, 0.6);
}
.docs-live-editor__dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: #f28f84;
}
.docs-live-editor__gate {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  background: #09090b;
}
.docs-live-editor__gate h4 {
  margin: 0;
  color: #fff;
  font-weight: 700;
}
.docs-live-editor__gate p {
  margin: 0;
  max-width: 22rem;
  color: #71717a;
  font-size: 0.85rem;
}
.docs-live-editor__gate button {
  margin-top: 0.75rem;
  padding: 0.6rem 1.25rem;
  font: 700 0.8rem/1 ui-monospace, monospace;
  color: #09090b;
  background: #f28f84;
  border: 0;
  border-radius: 0.6rem;
  cursor: pointer;
}
.docs-live-editor__gate button:hover {
  background: #ffa89e;
}
.docs-live-editor__skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  pointer-events: none;
  background: rgba(6, 6, 8, 0.9);
}
.docs-live-editor__skeleton span {
  font: 0.7rem/1 ui-monospace, monospace;
  letter-spacing: 0.04em;
  color: #71717a;
}
.docs-live-editor__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid rgba(242, 143, 132, 0.2);
  border-top-color: #f28f84;
  border-radius: 9999px;
  animation: docs-live-editor-spin 0.8s linear infinite;
}
@keyframes docs-live-editor-spin {
  to {
    transform: rotate(360deg);
  }
}
.docs-live-editor__frame {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  transition: height 0.2s ease;
}
.docs-live-editor__caveat {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--ui-text-muted, #71717a);
}
</style>
