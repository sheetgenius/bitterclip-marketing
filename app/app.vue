<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-50">
    <section class="relative isolate overflow-hidden px-5 pb-14 pt-6 sm:px-8 lg:px-12">
      <div class="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_12%,rgba(255,151,139,0.16),transparent_34%),linear-gradient(180deg,#070707_0%,#090b0a_58%,#0f1210_100%)]" />
      <video
        class="absolute inset-0 -z-20 h-full w-full object-cover opacity-45 saturate-110"
        autoplay
        loop
        muted
        playsinline
        poster="/clips/day-1-opening-poster.jpg"
        preload="metadata"
      >
        <source src="/clips/day-1-opening.mp4" type="video/mp4">
      </video>
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-950/30 via-zinc-950/58 to-zinc-950" />

      <header class="mx-auto flex w-full max-w-6xl items-center justify-between">
        <a class="font-mono text-sm font-semibold tracking-normal text-zinc-100" href="/">
          BitterClip
        </a>
        <a class="font-mono text-xs text-zinc-400 transition hover:text-zinc-100" href="mailto:hello@bitterclip.com?subject=BitterClip%20early%20access">
          early access
        </a>
      </header>

      <div class="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col justify-end pb-8 pt-20">
        <p class="font-mono text-sm text-[#ff9a8f]">Collaborative clip workbench</p>
        <h1 class="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Turn recordings and agent-found moments into clips you can verify, tune, package, and publish.
        </h1>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            class="inline-flex min-h-12 items-center justify-center rounded-md bg-[#ff9a8f] px-5 font-semibold text-zinc-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff9a8f] focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="mailto:hello@bitterclip.com?subject=BitterClip%20early%20access"
          >
            Request early access
          </a>
          <a
            class="inline-flex min-h-12 items-center justify-center rounded-md border border-zinc-700 px-5 font-semibold text-zinc-100 transition hover:border-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="#workflow"
          >
            See workflow
          </a>
        </div>
      </div>
    </section>

    <section id="workflow" class="border-t border-zinc-800 bg-[#0b0d0c] px-5 py-14 sm:px-8 lg:px-12">
      <div class="mx-auto max-w-6xl">
        <div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p class="font-mono text-sm text-[#ff9a8f]">How it works</p>
            <h2 class="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl">
              Use your cockpit for context. Use BitterClip for the media work.
            </h2>
          </div>
          <div class="grid gap-6 text-lg leading-8 text-zinc-300">
            <p>
              Ask Claude, ChatGPT, Codex, or a human editor to find the strongest moments. BitterClip turns that work into a durable review surface.
            </p>
            <p>
              Or start standalone: upload a recording, get candidate moments, tune the boundaries, and create a package.
            </p>
            <p class="text-zinc-100">
              The promise is simple: recording in, reviewable clips out.
            </p>
          </div>
        </div>
        <div class="mt-12 flex flex-col items-start gap-4 border-t border-zinc-800 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p class="max-w-xl text-base text-zinc-400">
            Early access is opening to a small group of teams. We&rsquo;ll work directly with you to shape the workbench.
          </p>
          <a
            class="inline-flex min-h-12 items-center justify-center rounded-md bg-[#ff9a8f] px-5 font-semibold text-zinc-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff9a8f] focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="mailto:hello@bitterclip.com?subject=BitterClip%20early%20access"
          >
            Request early access
          </a>
        </div>
      </div>
    </section>
  </main>
</template>
