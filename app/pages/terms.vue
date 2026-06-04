<script setup lang="ts">
// /terms - public terms of service for the marketing site, hosted app, and connector surface.
useHead({
  title: 'BitterClip - Terms of service',
  meta: [
    {
      name: 'description',
      content: 'BitterClip terms of service for the public site, hosted media workspace, AI assistant connectors, and publishing integrations.',
    },
    { property: 'og:title', content: 'BitterClip - Terms of service' },
    {
      property: 'og:description',
      content: 'Terms for using BitterClip, including accounts, workspace media, publishing integrations, billing, acceptable use, and service availability.',
    },
    { property: 'og:url', content: 'https://bitterclip.com/terms' },
    { name: 'twitter:title', content: 'BitterClip - Terms of service' },
    {
      name: 'twitter:description',
      content: 'Terms for using BitterClip, including accounts, workspace media, publishing integrations, billing, acceptable use, and service availability.',
    },
  ],
  link: [
    { rel: 'canonical', href: 'https://bitterclip.com/terms' },
    { rel: 'alternate', type: 'text/markdown', href: 'https://bitterclip.com/terms.md', title: 'BitterClip terms of service Markdown' },
  ],
})

const sections = [
  {
    title: 'Using BitterClip',
    body: [
      'BitterClip provides a hosted media workspace for uploading recordings, generating transcripts, identifying speakers, selecting moments, rendering clips, and publishing approved outputs.',
      'You must use BitterClip only for lawful purposes and only with content, accounts, and integrations you have the right to use.',
      'You are responsible for the activity that happens through your account, workspace, connected publishing channels, and API or connector access tokens.',
    ],
  },
  {
    title: 'Accounts And Access',
    body: [
      'You must provide accurate account information and keep your sign-in credentials and connector tokens secure.',
      'Account owners and admins control workspace membership, publishing connections, billing settings, and connector access.',
      'BitterClip may limit, suspend, or terminate access if we believe an account is unsafe, abusive, unpaid, or violating these terms.',
    ],
  },
  {
    title: 'Your Content',
    body: [
      'You retain your rights in recordings, transcripts, clips, exports, show information, publishing copy, and other content you provide or create in BitterClip.',
      'You grant BitterClip the limited rights needed to host, store, process, transcribe, analyze, render, transmit, display, and publish your content as needed to operate the service and integrations you choose to use.',
      'You are responsible for obtaining any permissions, releases, licenses, or consents required for the people, media, music, trademarks, and other material in your content.',
    ],
  },
  {
    title: 'Publishing Integrations',
    body: [
      'BitterClip can connect to services such as YouTube, LinkedIn, and X after an account owner or admin authorizes the integration.',
      'Publishing actions may upload media, create posts, refresh OAuth access, and store publishing receipts for the connected account.',
      'Published content remains subject to the destination service terms, policies, moderation, availability, and account controls.',
    ],
  },
  {
    title: 'Billing And Plans',
    body: [
      'Paid plans, launch pricing, included credits, overages, trial access, discounts, and renewal terms are shown at checkout or in the app when applicable.',
      'You authorize BitterClip and its payment providers to process charges for the plan, usage, taxes, and fees you accept.',
      'Unless a written agreement says otherwise, payments are non-refundable except where required by law or where BitterClip chooses to issue a credit or refund.',
    ],
  },
  {
    title: 'Acceptable Use',
    body: [
      'Do not use BitterClip to infringe rights, violate privacy, harass people, distribute malware, bypass platform rules, spam, scrape, overload systems, or publish unlawful or harmful material.',
      'Do not attempt to reverse engineer, probe, attack, resell, sublicense, or misuse BitterClip, its infrastructure, provider access, or connected third-party APIs.',
      'Do not upload secrets, private credentials, payment card data, or regulated data unless BitterClip has expressly agreed in writing to handle that category of data.',
    ],
  },
  {
    title: 'Service Changes And Availability',
    body: [
      'BitterClip may change, add, remove, suspend, or discontinue features, integrations, limits, plans, or access as the service evolves.',
      'BitterClip depends on infrastructure, AI/media providers, payment processors, and publishing platforms. We do not guarantee uninterrupted availability or that third-party services will continue to accept a given integration or post.',
      'Beta, preview, experimental, or launch features may be incomplete, change quickly, or fail more often than mature features.',
    ],
  },
  {
    title: 'Disclaimers And Liability',
    body: [
      'BitterClip is provided as is and as available, without warranties of merchantability, fitness for a particular purpose, non-infringement, or uninterrupted operation to the fullest extent allowed by law.',
      'BitterClip is not responsible for lost profits, lost data, lost content, publishing outcomes, platform moderation decisions, indirect damages, special damages, consequential damages, or punitive damages to the fullest extent allowed by law.',
      'To the fullest extent allowed by law, BitterClip total liability for claims related to the service is limited to the amount you paid to BitterClip for the service in the three months before the claim.',
    ],
  },
]
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 pt-12 pb-24 relative animate-fade-in">
    <div class="absolute top-0 left-1/4 -z-10 w-[400px] h-[400px] rounded-full bg-[#f28f84]/5 blur-[100px] pointer-events-none" />

    <div class="mb-12 border-b border-zinc-900 pb-10">
      <p class="font-mono text-xs uppercase tracking-widest text-[#f28f84] mb-3">Terms</p>
      <h2 class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
        Terms of service.
      </h2>
      <div class="max-w-3xl space-y-4 text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
        <p>
          Effective date: <strong class="text-zinc-200">June 4, 2026</strong>
        </p>
        <p>
          These terms govern access to the BitterClip public website at
          <a class="text-[#f28f84] hover:underline" href="https://bitterclip.com/">bitterclip.com</a>,
          the hosted app at
          <a class="text-[#f28f84] hover:underline" href="https://app.bitterclip.com/">app.bitterclip.com</a>,
          AI assistant connector surfaces, and publishing integrations.
        </p>
        <p>
          Contact:
          <a class="text-[#f28f84] hover:underline" href="mailto:hello@bitterclip.com?subject=BitterClip%20terms">
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
    </div>

    <section class="mt-10 grid gap-6 sm:grid-cols-2">
      <div class="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
        <h3 class="font-display font-semibold text-white text-sm mb-2">Changes</h3>
        <p class="text-zinc-400 text-xs leading-relaxed font-sans">
          We may update these terms as BitterClip changes. The effective date above shows when this version became active.
        </p>
      </div>
      <div class="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40">
        <h3 class="font-display font-semibold text-white text-sm mb-2">Privacy</h3>
        <p class="text-zinc-400 text-xs leading-relaxed font-sans">
          BitterClip's privacy policy explains how we handle information across the website, app, connectors, and publishing integrations.
        </p>
      </div>
    </section>
  </div>
</template>
