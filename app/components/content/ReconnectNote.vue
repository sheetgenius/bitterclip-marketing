<script setup lang="ts">
// Explains the "Reconnect required" state a connected channel can show in Settings.
// The connector-specific detail (e.g. LinkedIn's newer posting permission) is NOT
// hard-coded here — it's read from the matching row in _data/connectors.yml so the
// note can't drift from the connector matrix. Invoke: ::reconnect-note{connector="linkedin"}
const props = defineProps<{ connector?: string }>()

// Friendly display names for the lowercase data keys. Falls back to "the channel".
const labels: Record<string, string> = {
  youtube: 'YouTube',
  x: 'X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
}
const key = props.connector?.toLowerCase()
const channel = key && labels[key] ? labels[key] : 'the channel'

// Pull the connector-specific reconnect line from the single source of truth.
const { data: note } = await useAsyncData(
  `reconnect-note-${key ?? 'generic'}`,
  async () => {
    if (!key) return null
    const doc = await queryCollection('connectors').first()
    return doc?.connectors.find((c) => c.connector === key)?.reconnect_note ?? null
  },
)
</script>

<template>
  <div class="docs-snippet">
    <p>
      Sometimes a channel you already connected shows <strong>"Reconnect required"</strong> in
      Settings. That's normal. It usually means {{ channel }} needs you to sign in again so
      BitterClip can keep the permissions it needs to post for you. Newer features can also ask
      for a permission your earlier connection didn't include.
    </p>
    <p v-if="note">
      {{ note }}
    </p>
    <p>
      To fix it, open Settings, find {{ channel }} in your connections, and choose
      <strong>Reconnect</strong>. You'll sign in and approve again, and the channel goes back to
      "Connected." Nothing you set up before is lost.
    </p>
  </div>
</template>
