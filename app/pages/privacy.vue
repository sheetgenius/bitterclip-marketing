<script setup lang="ts">
// /privacy - public privacy policy for the marketing site, hosted app, and connector surface.
useHead({
  title: 'BitterClip - Privacy policy',
  meta: [
    {
      name: 'description',
      content: 'BitterClip privacy policy for the public site, hosted media workspace, AI assistant connectors, and publishing integrations.',
    },
    { property: 'og:title', content: 'BitterClip - Privacy policy' },
    {
      property: 'og:description',
      content: 'How BitterClip handles account data, media, transcripts, clips, connector access, analytics, and publishing integrations.',
    },
    { property: 'og:url', content: 'https://bitterclip.com/privacy' },
    { name: 'twitter:title', content: 'BitterClip - Privacy policy' },
    {
      name: 'twitter:description',
      content: 'How BitterClip handles account data, media, transcripts, clips, connector access, analytics, and publishing integrations.',
    },
  ],
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/privacy' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/privacy.md', title: 'BitterClip privacy policy Markdown' },
  ],
})

const sections = [
  {
    title: 'Information We Collect',
    body: [
      'Account and contact details, such as name, email address, workspace membership, authentication events, and support messages.',
      'Workspace content you provide or create, including uploaded recordings, generated transcripts, speaker labels, clips, exports, approval records, and publishing receipts.',
      'Connector and integration data, such as OAuth tokens, connected channel metadata, MCP access tokens, and publishing status from services you choose to connect.',
      'Billing and plan information needed to manage checkout, subscriptions, invoices, credit balances, and entitlement checks.',
      'Usage, device, log, and analytics data, including page views, app events, IP-derived security signals, browser information, errors, and performance diagnostics.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'Operate the BitterClip website, hosted app, transcript workspace, clipping tools, rendering pipeline, publishing workflows, and AI assistant connector.',
      'Transcribe, diarize, analyze, render, package, publish, and help you verify media and transcript-derived clips.',
      'Authenticate users, enforce account roles, process billing, prevent abuse, debug failures, and provide support.',
      'Improve reliability, product quality, security, onboarding, and public documentation.',
    ],
  },
  {
    title: 'AI, Media, And Provider Processing',
    body: [
      'BitterClip may send recordings, extracted audio, transcripts, prompts, metadata, rendered clips, or related operational data to infrastructure and AI/media providers when needed to deliver transcription, speaker analysis, rendering, storage, billing, support, or publishing features.',
      'Connected publishing services, such as YouTube, LinkedIn, or X, receive only the content and account authorization needed for actions you approve or trigger.',
      'BitterClip does not sell your recordings, transcripts, clips, or account data.',
    ],
  },
  {
    title: 'How We Share Information',
    body: [
      'With service providers that host, store, process, analyze, secure, bill, or support BitterClip.',
      'With connected third-party services when you authorize an integration or publish content through that service.',
      'When required by law, legal process, security needs, rights protection, or a business transfer such as a merger, acquisition, or asset sale.',
    ],
  },
  {
    title: 'Retention And Deletion',
    body: [
      'We keep account and workspace data for as long as needed to provide BitterClip, comply with legal obligations, resolve disputes, preserve receipts, enforce agreements, and maintain security.',
      'You may ask us to delete your account or workspace data. Some backups, logs, receipts, billing records, and security records may remain for a limited period where required or operationally necessary.',
      'Disconnecting a publishing integration stops new use of that authorization, but content already published to a third-party service remains governed by that service.',
    ],
  },
  {
    title: 'Your Choices',
    body: [
      'You can update account information, disconnect publishing channels, revoke connector tokens, and request access, correction, export, or deletion by contacting us.',
      'You can use browser and device controls to limit cookies or analytics collection on the public site.',
      'You can revoke third-party app access through the connected provider, such as LinkedIn, Google, or X account settings.',
    ],
  },
  {
    title: 'Security',
    body: [
      'We use administrative, technical, and organizational safeguards designed to protect BitterClip data, including access controls, encrypted secrets, account roles, audit-oriented receipts, and secure transport.',
      'No internet service can guarantee perfect security. Please contact us quickly if you believe your account or workspace has been compromised.',
    ],
  },
]
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 pt-12 pb-24 relative animate-fade-in">
    <div class="absolute top-0 left-1/4 -z-10 w-[400px] h-[400px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <div class="mb-12 border-b border-zinc-900 pb-10">
      <p class="font-mono text-xs uppercase tracking-widest text-[#f28f84] mb-3">Privacy</p>
      <h2 class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
        Privacy policy.
      </h2>
      <div class="max-w-3xl space-y-4 text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
        <p>
          Effective date: <strong class="text-zinc-200">June 9, 2026</strong>
        </p>
        <p>
          This policy explains how BitterClip handles information for the public website at
          <a class="text-[#f28f84] hover:underline" href="https://bitterclip.com/">bitterclip.com</a>,
          the hosted app at
          <a class="text-[#f28f84] hover:underline" href="https://app.bitterclip.com/">app.bitterclip.com</a>,
          AI assistant connector surfaces, and publishing integrations.
        </p>
        <p>
          Contact:
          <a class="text-[#f28f84] hover:underline" href="mailto:hello@bitterclip.com?subject=BitterClip%20privacy">
            hello@bitterclip.com
          </a>.
        </p>
      </div>
    </div>

    <div class="space-y-6">
      <section
        v-for="section in sections"
        :key="section.title"
        class="glass-panel-accented glass-reflection p-6 sm:p-7 rounded-2xl corner-ticks"
      >
        <h3 class="font-display text-lg font-bold text-white mb-4">{{ section.title }}</h3>
        <ul class="space-y-3 text-zinc-400 text-sm leading-relaxed font-sans">
          <li v-for="item in section.body" :key="item" class="flex gap-3">
            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f28f84]" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </section>

      <section class="glass-panel-accented glass-reflection p-6 sm:p-7 rounded-2xl corner-ticks">
        <h3 class="font-display text-lg font-bold text-white mb-4">YouTube API Services</h3>
        <div class="space-y-3 text-zinc-400 text-sm leading-relaxed font-sans">
          <p>
            BitterClip uses YouTube API Services to connect your YouTube channel and to upload the
            videos you approve. By using BitterClip's YouTube features you also agree to the
            <a class="text-[#f28f84] hover:underline" href="https://www.youtube.com/t/terms" rel="noopener" target="_blank">YouTube Terms of Service</a>.
            Google's handling of your information is described in the
            <a class="text-[#f28f84] hover:underline" href="https://www.google.com/policies/privacy" rel="noopener" target="_blank">Google Privacy Policy</a>.
          </p>
          <p>
            When you connect a YouTube channel, BitterClip stores OAuth access and refresh tokens
            (encrypted at rest), connected channel metadata such as the channel id and title, and
            publishing receipts for uploads you trigger. BitterClip uses this data only to check
            connection status and perform the publishing actions you request, and does not share it
            with third parties except as described in this policy.
          </p>
          <p>
            You can disconnect a YouTube channel in BitterClip at any time, which stops further use
            of the stored authorization, and you can revoke BitterClip's access to your Google
            account entirely from your
            <a class="text-[#f28f84] hover:underline" href="https://myaccount.google.com/permissions" rel="noopener" target="_blank">Google security settings</a>.
            You can also ask us to delete stored tokens and connection data by contacting
            <a class="text-[#f28f84] hover:underline" href="mailto:hello@bitterclip.com?subject=BitterClip%20YouTube%20data">hello@bitterclip.com</a>.
          </p>
        </div>
      </section>
    </div>

    <section class="mt-10 grid gap-6 sm:grid-cols-2">
      <div class="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
        <h3 class="font-display font-semibold text-white text-sm mb-2">Children</h3>
        <p class="text-zinc-400 text-xs leading-relaxed font-sans">
          BitterClip is not directed to children under 13, and we do not knowingly collect personal information from children under 13.
        </p>
      </div>
      <div class="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
        <h3 class="font-display font-semibold text-white text-sm mb-2">Changes</h3>
        <p class="text-zinc-400 text-xs leading-relaxed font-sans">
          We may update this policy as BitterClip changes. The effective date above shows when this version became active.
        </p>
      </div>
    </section>
  </div>
</template>
