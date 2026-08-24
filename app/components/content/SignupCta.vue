<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl } from '~/utils/signup-attribution'

// Canonical Creator trial CTA. Reads signup_url from _data/site.yml.
// Invoke: ::signup-cta  (or :SignupCta)
const route = useRoute()
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
const signupUrl = computed(() => buildSignupUrl({
  baseUrl: site.value?.signup_url,
  query: route.query,
  surface: 'docs',
  landingPath: route.path,
}))
</script>

<template>
  <p class="docs-snippet docs-cta">
    The Creator trial lasts seven days and requires a card: $0 today, then $24/month
    unless you cancel before it ends. It includes $5 of agent work for one recording
    up to two hours.
    <a :href="signupUrl">Start Creator trial</a>.
    We'll email you a verification link after signup; confirm it to start uploading and
    transcribing recordings.
  </p>
</template>
