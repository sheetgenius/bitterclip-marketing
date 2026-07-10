<script setup lang="ts">
import { computed } from 'vue'
import { buildSignupUrl } from '~/utils/signup-attribution'

// "Free to start" CTA. Reads signup_url from _data/site.yml — quotes NO price.
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
    BitterClip is free to start. <a :href="signupUrl">Create your account</a> and
    you're in a working space right away. We'll email you a verification link when you
    sign up — click it to start uploading and transcribing recordings.
  </p>
</template>
