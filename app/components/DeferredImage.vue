<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  src: string
  alt: string
  width: number | string
  height: number | string
}>()

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const image = ref<HTMLImageElement | null>(null)
const renderedSrc = ref(TRANSPARENT_PIXEL)
let observer: IntersectionObserver | null = null

const reveal = () => {
  renderedSrc.value = props.src
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  if (!image.value || !('IntersectionObserver' in window)) {
    reveal()
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) reveal()
  }, { rootMargin: '200px 0px' })
  observer.observe(image.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <img
    ref="image"
    v-bind="$attrs"
    :src="renderedSrc"
    :data-deferred-src="src"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    fetchpriority="low"
  >
</template>
