<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  src: string
  type: string
  poster: string
  width: number | string
  height: number | string
  title: string
}>()

const video = ref<HTMLVideoElement | null>(null)
const mediaReady = ref(false)
let observer: IntersectionObserver | null = null

const reveal = async () => {
  if (mediaReady.value) return
  mediaReady.value = true
  observer?.disconnect()
  observer = null
  await nextTick()
  video.value?.load()
}

onMounted(() => {
  if (!video.value || !('IntersectionObserver' in window)) {
    void reveal()
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void reveal()
  }, { rootMargin: '200px 0px' })
  observer.observe(video.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <video
    ref="video"
    v-bind="$attrs"
    :poster="mediaReady ? poster : undefined"
    :data-deferred-poster="poster"
    :data-deferred-src="src"
    :preload="mediaReady ? 'metadata' : 'none'"
    :width="width"
    :height="height"
    :title="title"
  >
    <source v-if="mediaReady" :src="src" :type="type">
  </video>
</template>
