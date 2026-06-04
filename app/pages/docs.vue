<script setup lang="ts">
// /docs — an honest, plain explanation of how a clip gets made. Recording → Moment → Clip.
useHead({
  title: 'BitterClip - How a clip gets made',
  meta: [
    {
      name: 'description',
      content: 'How BitterClip turns recordings into source-linked clips through time-aligned transcripts, Moments, verification, and exports.',
    },
    { property: 'og:title', content: 'BitterClip - How a clip gets made' },
    {
      property: 'og:description',
      content: 'How BitterClip turns recordings into source-linked clips through time-aligned transcripts, Moments, verification, and exports.',
    },
    { property: 'og:url', content: 'https://bitterclip.com/docs' },
    { name: 'twitter:title', content: 'BitterClip - How a clip gets made' },
    {
      name: 'twitter:description',
      content: 'How BitterClip turns recordings into source-linked clips through time-aligned transcripts, Moments, verification, and exports.',
    },
  ],
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/docs' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/docs.md', title: 'BitterClip docs Markdown' },
  ],
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pt-12 pb-24 relative animate-fade-in">

    <!-- Top Glowing Gradient Accent -->
    <div class="absolute top-0 left-1/4 -z-10 w-[400px] h-[400px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <!-- Title Block -->
    <div class="mb-14 border-b border-zinc-900 pb-10">
      <p class="font-mono text-xs uppercase tracking-widest text-[#f28f84] mb-3">How it works</p>
      <h2 class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
        How a clip gets made.
      </h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
        BitterClip turns a recording into clips you can trust, in three nouns: <strong class="text-zinc-200">Recording → Moment → Clip</strong>. Your AI selects the words; BitterClip derives the cut from the audio. No timeline, no guessed timestamps.
      </p>
    </div>

    <!-- Three steps -->
    <div class="space-y-6">
      <div class="glass-panel-accented glass-reflection p-6 sm:p-7 rounded-2xl corner-ticks">
        <div class="flex items-center gap-3 mb-3">
          <span class="font-mono text-xs text-[#f28f84] bg-[#f28f84]/10 px-2 py-0.5 rounded border border-[#f28f84]/20">01</span>
          <h3 class="font-display text-lg font-bold text-white">Recording</h3>
        </div>
        <p class="text-zinc-400 text-sm leading-relaxed font-sans">
          You bring a video or audio file. BitterClip transcribes it to time-aligned words — and that transcript is the canonical timing signal for everything downstream.
        </p>
      </div>

      <div class="glass-panel-accented glass-reflection p-6 sm:p-7 rounded-2xl corner-ticks">
        <div class="flex items-center gap-3 mb-3">
          <span class="font-mono text-xs text-[#f28f84] bg-[#f28f84]/10 px-2 py-0.5 rounded border border-[#f28f84]/20">02</span>
          <h3 class="font-display text-lg font-bold text-white">Moment</h3>
        </div>
        <p class="text-zinc-400 text-sm leading-relaxed font-sans">
          Your AI reads the transcript and proposes moments worth clipping — by selecting <em>words</em>, not timestamps. BitterClip derives the start and end from the first and last word it picked, plus a little breathing room, snapped to the audio. The AI never invents a time code, so a clip never lands mid-syllable.
        </p>
      </div>

      <div class="glass-panel-accented glass-reflection p-6 sm:p-7 rounded-2xl corner-ticks">
        <div class="flex items-center gap-3 mb-3">
          <span class="font-mono text-xs text-[#f28f84] bg-[#f28f84]/10 px-2 py-0.5 rounded border border-[#f28f84]/20">03</span>
          <h3 class="font-display text-lg font-bold text-white">Clip</h3>
        </div>
        <p class="text-zinc-400 text-sm leading-relaxed font-sans">
          You confirm or nudge the edges, and BitterClip renders a captioned MP4 with the transcript and an SRT. Every clip stays linked to its recording, speaker, exact words, and timestamp — so you can always trace it back.
        </p>
      </div>
    </div>

    <!-- Media custody + developer pointer -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
      <div class="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
        <h4 class="font-display font-semibold text-white text-sm mb-2">Media custody</h4>
        <p class="text-zinc-400 text-xs leading-relaxed font-sans">
          Your recordings and rendered clips live in your BitterClip workspace. Each clip carries a receipt — recording, speaker, words, timestamp — so the chain from source to share is never broken.
        </p>
      </div>
      <div class="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
        <h4 class="font-display font-semibold text-white text-sm mb-2">For developers</h4>
        <p class="text-zinc-400 text-xs leading-relaxed font-sans">
          BitterClip is a remote MCP server. The tools your AI calls, and the bridge the editor runs on, are documented on the <NuxtLink to="/mcp" class="text-[#f28f84] hover:underline">MCP page</NuxtLink>.
        </p>
      </div>
    </div>

  </div>
</template>
