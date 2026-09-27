<script setup lang="ts">
// A diagram, not a screenshot: what a meeting recorder hands you (one file,
// switching already decided) next to what Studio hands you (a track per person).
defineProps<{ competitor: string }>()

// Who the recorder showed, in order. Widths are percentages of the call.
const baked = [
  { w: 16, who: 'a' }, { w: 9, who: 'b' }, { w: 21, who: 'a' }, { w: 7, who: 'b' },
  { w: 13, who: 'a' }, { w: 24, who: 'b' }, { w: 10, who: 'a' },
]
</script>

<template>
  <figure class="tracks-visual rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 sm:p-6">
    <div>
      <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">What a {{ competitor }} recording gives you</p>
      <div class="mt-3 flex h-9 overflow-hidden rounded-md" aria-hidden="true">
        <span
          v-for="(seg, i) in baked"
          :key="i"
          class="block h-full"
          :class="seg.who === 'a' ? 'bg-zinc-500/70' : 'bg-zinc-700/80'"
          :style="{ width: `${seg.w}%` }"
        />
      </div>
      <p class="mt-2 text-[13px] text-zinc-300">A view of the call. Who's on screen was decided while you talked.</p>
    </div>

    <div class="mt-6">
      <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#f28f84]">What BitterClip Studio gives you</p>
      <div class="mt-3 space-y-2" aria-hidden="true">
        <div class="flex items-center gap-3">
          <span class="w-12 shrink-0 text-[12px] text-zinc-300">You</span>
          <span class="lane lane--you h-7 flex-1 rounded-md" />
        </div>
        <div class="flex items-center gap-3">
          <span class="w-12 shrink-0 text-[12px] text-zinc-300">Guest</span>
          <span class="lane lane--guest h-7 flex-1 rounded-md" />
        </div>
      </div>
      <p class="mt-2 text-[13px] text-zinc-300">A track per person. You decide who's on screen, on the word.</p>
    </div>
    <figcaption class="sr-only">
      A {{ competitor }} recording is a view of the call, with the speaker switching already decided. BitterClip Studio records each person on their own track, so you choose who is on screen when you edit.
    </figcaption>
  </figure>
</template>

<style scoped>
/* A waveform-ish texture so the lanes read as recorded media, not bars. */
.lane {
  background-image:
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.28) 0 2px, transparent 2px 7px),
    linear-gradient(90deg, var(--lane-a), var(--lane-b));
}
.lane--you { --lane-a: #f28f84; --lane-b: #d66f5f; }
.lane--guest { --lane-a: #ffd0c7; --lane-b: #f2a99f; }
</style>
