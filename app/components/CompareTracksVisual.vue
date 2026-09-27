<script setup lang="ts">
// What you get out of the call, drawn as the videos themselves: a meeting
// recorder hands you one video with both people and the layout baked in;
// Studio hands you a separate video of each person.
defineProps<{ competitor: string }>()
</script>

<template>
  <figure class="tracks-visual rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 sm:p-6">
    <div>
      <p class="flex items-baseline justify-between text-[13px] font-semibold text-zinc-200">{{ competitor }} <span class="font-normal text-zinc-400">1 video</span></p>
      <div class="mt-2.5 flex aspect-[32/9] overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-800" aria-hidden="true">
        <div class="tile relative flex-1 border-r border-black/40">
          <svg viewBox="0 0 100 100" class="person text-zinc-500"><circle cx="50" cy="40" r="15" /><path d="M20 100c0-24 13-37 30-37s30 13 30 37z" /></svg>
          <span class="name-tag">You</span>
        </div>
        <div class="tile relative flex-1">
          <svg viewBox="0 0 100 100" class="person text-zinc-500"><circle cx="50" cy="40" r="15" /><path d="M20 100c0-24 13-37 30-37s30 13 30 37z" /></svg>
          <span class="name-tag">Guest</span>
        </div>
      </div>
      <p class="mt-2 text-[14px] text-zinc-300">One video of the call, with the layout already decided.</p>
    </div>

    <div class="mt-6">
      <p class="flex items-baseline justify-between text-[13px] font-semibold text-[#f28f84]">BitterClip Studio <span class="font-normal text-zinc-300">2 videos</span></p>
      <div class="mt-2.5 grid grid-cols-2 gap-2" aria-hidden="true">
        <div class="tile relative aspect-video overflow-hidden rounded-lg border border-[#f28f84]/30 bg-[#3a2220]">
          <svg viewBox="0 0 100 100" class="person text-[#f28f84]"><circle cx="50" cy="40" r="15" /><path d="M20 100c0-24 13-37 30-37s30 13 30 37z" /></svg>
          <span class="name-tag">You</span>
        </div>
        <div class="tile relative aspect-video overflow-hidden rounded-lg border border-[#f28f84]/30 bg-[#3a2220]">
          <svg viewBox="0 0 100 100" class="person text-[#ffc4ba]"><circle cx="50" cy="40" r="15" /><path d="M20 100c0-24 13-37 30-37s30 13 30 37z" /></svg>
          <span class="name-tag">Guest</span>
        </div>
      </div>
      <p class="mt-2 text-[14px] text-zinc-200">A separate video of each person. You choose who's on screen when you edit.</p>
    </div>
    <figcaption class="sr-only">
      A {{ competitor }} recording is one video of the call with the layout already decided. BitterClip Studio records a separate video of each person, so you choose who is on screen when you edit.
    </figcaption>
  </figure>
</template>

<style scoped>
.tile {
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.person {
  width: 58%;
  height: auto;
  fill: currentColor;
  margin-bottom: -2px;
}
/* Styled after a meeting app's name label, so the frames read as video. */
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
