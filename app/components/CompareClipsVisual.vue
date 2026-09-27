<script setup lang="ts">
// What you get out of a long recording, drawn as the videos themselves: a clip
// generator hands back a batch of shorts it picked; BitterClip hands back the
// full episode plus the clips you choose from it.
defineProps<{ competitor: string }>()

const batch = Array.from({ length: 6 }, (_, i) => i)
const clips = Array.from({ length: 3 }, (_, i) => i)
</script>

<template>
  <figure class="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 sm:p-6">
    <div>
      <p class="flex items-baseline justify-between text-[13px] font-semibold text-zinc-200">{{ competitor }} <span class="font-normal text-zinc-400">a batch of shorts</span></p>
      <div class="mt-2.5 grid grid-cols-6 gap-1.5" aria-hidden="true">
        <div v-for="i in batch" :key="i" class="tile aspect-[9/16] rounded-md border border-white/[0.08] bg-zinc-800">
          <svg viewBox="0 0 100 100" class="person text-zinc-500"><circle cx="50" cy="40" r="15" /><path d="M20 100c0-24 13-37 30-37s30 13 30 37z" /></svg>
        </div>
      </div>
      <p class="mt-2 text-[14px] text-zinc-300">Short clips, picked for you from the upload.</p>
    </div>

    <div class="mt-6">
      <p class="flex items-baseline justify-between text-[13px] font-semibold text-[#f28f84]">BitterClip <span class="font-normal text-zinc-300">the episode and your clips</span></p>
      <div class="mt-2.5 grid grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] items-end gap-2" aria-hidden="true">
        <div class="tile relative aspect-video rounded-md border border-[#f28f84]/30 bg-[#3a2220]">
          <svg viewBox="0 0 100 56" class="person person--pair"><g class="text-[#f28f84]" fill="currentColor"><circle cx="30" cy="24" r="9" /><path d="M13 56c0-15 7-23 17-23s17 8 17 23z" /></g><g class="text-[#ffc4ba]" fill="currentColor"><circle cx="70" cy="24" r="9" /><path d="M53 56c0-15 7-23 17-23s17 8 17 23z" /></g></svg>
          <span class="name-tag">Full episode</span>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          <div v-for="i in clips" :key="i" class="tile aspect-[9/16] rounded-md border border-[#f28f84]/30 bg-[#3a2220]">
            <svg viewBox="0 0 100 100" class="person text-[#ffc4ba]"><circle cx="50" cy="40" r="15" /><path d="M20 100c0-24 13-37 30-37s30 13 30 37z" /></svg>
          </div>
        </div>
      </div>
      <p class="mt-2 text-[14px] text-zinc-200">The full episode, plus the clips you choose from it.</p>
    </div>
    <figcaption class="sr-only">
      {{ competitor }} returns a batch of automatically picked short clips. BitterClip gives you the full episode as an editable video, plus the clips you choose from it.
    </figcaption>
  </figure>
</template>

<style scoped>
.tile {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.person {
  width: 100%;
  height: auto;
  fill: currentColor;
  margin-bottom: -2px;
}
.person--pair {
  width: 82%;
}
/* Styled after a video app's label, so the frames read as video. */
.name-tag {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #e4e4e7;
  font-size: 11px;
  line-height: 16px;
}
</style>
