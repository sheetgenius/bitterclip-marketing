<script setup lang="ts">
// A diagram, not a screenshot: a clip generator hands back a batch of
// machine-picked shorts; BitterClip keeps the whole recording as an episode and
// cuts the clips you choose from it, each one tied to where it came from.
defineProps<{ competitor: string }>()

const batch = Array.from({ length: 10 }, (_, i) => i)
// Where the chosen clips sit in the episode, as percentages of its length.
const picks = [{ at: 14, w: 9 }, { at: 47, w: 12 }, { at: 76, w: 8 }]
</script>

<template>
  <figure class="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 sm:p-6">
    <div>
      <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">What {{ competitor }} hands you</p>
      <div class="mt-3 flex gap-1.5" aria-hidden="true">
        <span v-for="i in batch" :key="i" class="block aspect-[9/16] flex-1 rounded-[4px] bg-zinc-600/60" />
      </div>
      <p class="mt-2 text-[13px] text-zinc-300">A batch of shorts, picked for you from the upload.</p>
    </div>

    <div class="mt-6">
      <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#f28f84]">What BitterClip hands you</p>
      <div class="relative mt-3 h-7 rounded-md bg-[#f28f84]/25" aria-hidden="true">
        <span
          v-for="pick in picks"
          :key="pick.at"
          class="absolute inset-y-0 rounded-md bg-[#f28f84]"
          :style="{ left: `${pick.at}%`, width: `${pick.w}%` }"
        />
      </div>
      <div class="mt-2 flex gap-1.5" aria-hidden="true">
        <span v-for="pick in picks" :key="pick.at" class="block aspect-[9/16] w-[12%] rounded-[4px] bg-[#f28f84]/80" />
      </div>
      <p class="mt-2 text-[13px] text-zinc-300">The whole episode, and the clips you choose from it.</p>
    </div>
    <figcaption class="sr-only">
      {{ competitor }} returns a batch of automatically picked short clips. BitterClip keeps the whole recording as an editable episode and makes the clips you choose from it.
    </figcaption>
  </figure>
</template>
