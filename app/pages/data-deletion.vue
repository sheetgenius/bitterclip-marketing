<script setup lang="ts">
// /data-deletion - user data deletion instructions. Referenced by Meta (Facebook/
// Instagram) app settings as the "Data Deletion Instructions URL", and linked from
// the privacy policy. Plain instructions for removing data BitterClip stored from a
// connected account, plus full account/workspace deletion.
useHead({
  title: 'BitterClip - Data deletion',
  meta: [
    {
      name: 'description',
      content: 'How to delete the data BitterClip stored from your connected accounts, including Facebook and Instagram, and how to request full account deletion.',
    },
    { property: 'og:title', content: 'BitterClip - Data deletion' },
    {
      property: 'og:description',
      content: 'Disconnect a publishing integration or request deletion of the data BitterClip holds for your account.',
    },
    { property: 'og:url', content: 'https://bitterclip.com/data-deletion' },
  ],
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/data-deletion' },
  ],
})

const steps = [
  {
    title: 'Disconnect the integration (instant)',
    body: [
      'Sign in to app.bitterclip.com and open Settings.',
      'Find the connected channel — Facebook, Instagram, YouTube, LinkedIn, or X — and choose Disconnect.',
      'Disconnecting immediately stops further use of that authorization and removes the stored access tokens and connected-account metadata for that channel.',
    ],
  },
  {
    title: 'Revoke access from the provider',
    body: [
      'For a Facebook or Instagram connection, you can also remove BitterClip from your Facebook settings: Settings & privacy → Settings → Business integrations (or Apps and websites), select BitterClip, and remove it.',
      'This revokes the access BitterClip was granted, independent of the in-app disconnect above.',
    ],
  },
  {
    title: 'Delete your whole account',
    body: [
      'To remove everything BitterClip holds for you — connection records, tokens, recordings, transcripts, clips, and associated workspace data — sign in and go to app.bitterclip.com/account/delete to delete your account yourself.',
      'Prefer us to handle it? Email hello@bitterclip.com from the address on your account with the subject "Data deletion" and we will confirm and process the request.',
      'Some backups, logs, billing, and security records may remain for a limited period where required or operationally necessary, then age out.',
    ],
  },
]
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 pt-12 pb-24 relative animate-fade-in">
    <div class="absolute top-0 left-1/4 -z-10 w-[400px] h-[400px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <div class="mb-12 border-b border-zinc-900 pb-10">
      <p class="font-mono text-xs uppercase tracking-widest text-[#f28f84] mb-3">Data deletion</p>
      <h2 class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
        Delete your data.
      </h2>
      <div class="max-w-3xl space-y-4 text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
        <p>
          You can remove the data BitterClip stored from a connected account — including
          Facebook and Instagram — at any time. The fastest way is to disconnect the
          integration in the app; you can also email us to request full deletion.
        </p>
        <p>
          Questions:
          <a class="text-[#f28f84] hover:underline" href="mailto:hello@bitterclip.com?subject=Data%20deletion">
            hello@bitterclip.com
          </a>.
          See also our
          <NuxtLink class="text-[#f28f84] hover:underline" to="/privacy">privacy policy</NuxtLink>.
        </p>
      </div>
    </div>

    <div class="space-y-6">
      <section
        v-for="(step, index) in steps"
        :key="step.title"
        class="glass-panel-accented glass-reflection p-6 sm:p-7 rounded-2xl corner-ticks"
      >
        <h3 class="font-display text-lg font-bold text-white mb-4">
          <span class="font-mono text-[#f28f84] mr-2">{{ index + 1 }}.</span>{{ step.title }}
        </h3>
        <ul class="space-y-3 text-zinc-400 text-sm leading-relaxed font-sans">
          <li v-for="item in step.body" :key="item" class="flex gap-3">
            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f28f84]" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </section>
    </div>

    <section class="mt-10 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
      <h3 class="font-display font-semibold text-white text-sm mb-2">Not a customer yet?</h3>
      <p class="text-zinc-400 text-xs leading-relaxed font-sans">
        If you reached this page from a Facebook or Instagram login prompt but never created a
        BitterClip account, BitterClip holds no data for you once you remove it from your
        <a class="text-[#f28f84] hover:underline" href="https://www.facebook.com/settings?tab=business_tools" rel="noopener" target="_blank">Facebook business integrations</a>.
        Email
        <a class="text-[#f28f84] hover:underline" href="mailto:hello@bitterclip.com?subject=Data%20deletion">hello@bitterclip.com</a>
        if you'd like written confirmation.
      </p>
    </section>
  </div>
</template>
