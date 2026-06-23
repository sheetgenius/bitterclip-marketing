<script setup lang="ts">
// One callout convention for the whole docs site: TIP / WARNING / NOTE.
// Replaces the GitHub-style "> [!TIP]" blockquote so styling and semantics are
// identical on every page. Invoke in markdown as:
//   ::callout{type="warning"}
//   Body markdown here.
//   ::
const props = withDefaults(
  defineProps<{
    type?: 'tip' | 'warning' | 'note'
  }>(),
  { type: 'note' },
)

// Human-facing label per kind. Kept short so it reads as a heading, not a sentence.
const label: Record<NonNullable<typeof props.type>, string> = {
  tip: 'Tip',
  warning: 'Heads up',
  note: 'Note',
}

// A small glyph per kind, decorative (the text label carries the meaning).
const icon: Record<NonNullable<typeof props.type>, string> = {
  tip: '✨', // sparkles
  warning: '⚠', // warning sign
  note: 'ℹ', // information source
}

// All three are static, supplementary asides, so they take role="note".
// (role="alert" is for dynamically-injected, time-sensitive messages — using it
// here would make screen readers interrupt and announce the callout on page load.)
</script>

<template>
  <!-- STUB styling: minimal, readable. Full glass/dark skin is a later phase. -->
  <aside class="docs-callout" :data-type="props.type" role="note">
    <p class="docs-callout__label">
      <span class="docs-callout__icon" aria-hidden="true">{{ icon[props.type] }}</span>
      {{ label[props.type] }}
    </p>
    <div class="docs-callout__body">
      <slot />
    </div>
  </aside>
</template>
