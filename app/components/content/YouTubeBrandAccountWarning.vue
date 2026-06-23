<script setup lang="ts">
// The single highest-value reused gotcha. Renders as a WARNING callout.
// Used on connect/youtube + help/troubleshooting. Invoke: ::you-tube-brand-account-warning
</script>

<template>
  <Callout type="warning">
    <p>
      Connect with the Google identity that can <strong>act as the channel</strong>. Most
      YouTube channels live under a <strong>Brand Account</strong>, not your personal Gmail.
      At Google's "Choose an account" step, pick that Brand Account.
    </p>
    <p>
      Being a "manager" inside YouTube Studio is not the same thing. If that's the only
      access you have, the channel won't show up and the connection quietly fails. You need
      owner or manager access on the <strong>Brand Account</strong> itself.
    </p>
    <p>
      The fix: ask a Brand Account owner to add you on the
      <a
        href="https://myaccount.google.com/brandaccounts"
        target="_blank"
        rel="noopener"
      >Google Brand Account members page</a>, or have them connect the channel for you.
    </p>
  </Callout>
</template>
