<script setup lang="ts">
// "Free to start" CTA. Reads signup_url from _data/site.yml — quotes NO price.
// Invoke: ::signup-cta  (or :SignupCta)
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
</script>

<template>
  <p class="docs-snippet docs-cta">
    BitterClip is free to start. <a :href="site?.signup_url">Create your account</a> and
    you're in a working space right away. We'll email you a verification link when you
    sign up — click it to start uploading and transcribing recordings.
  </p>
</template>
