<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl } from '~/utils/signup-attribution'

// End-of-post conversion card. Rendered by app/pages/blog/[slug].vue after the
// prose so every post ends with a real pathway (never a heading that looks
// like a link). Reads signup_url from _data/site.yml — quotes NO price.
withDefaults(defineProps<{
  title?: string
  line?: string
}>(), {
  title: 'Give your show its signature',
  line: 'BitterClip is free to start. Upload a recording and open the FX tab — or connect ChatGPT or Claude and just describe the look you want.',
})

const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
const route = useRoute()
const signupUrl = computed(() => buildSignupUrl({
  baseUrl: site.value?.signup_url,
  query: route.query,
  surface: 'blog_post',
  landingPath: route.path,
}))
</script>

<template>
  <aside
    class="relative mt-14 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-9"
    aria-label="Get started with BitterClip"
  >
    <div class="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[#f28f84]/10 blur-[90px]" />
    <p class="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f28f84]">Try it</p>
    <h2 class="max-w-xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
      {{ title }}
    </h2>
    <p class="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
      {{ line }}
    </p>
    <div class="mt-6 flex flex-wrap items-center gap-3">
      <a
        :href="signupUrl"
        class="inline-flex items-center rounded-full bg-[#f28f84] px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-[#ffa89e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        Start free
      </a>
      <NuxtLink
        to="/docs/assistants/overview"
        class="inline-flex items-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#f28f84]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28f84] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        Use it with your assistant
      </NuxtLink>
    </div>
  </aside>
</template>
