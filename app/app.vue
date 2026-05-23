<template>
  <main class="min-h-screen bg-zinc-950 text-white">
    <section class="relative min-h-screen overflow-hidden px-6 py-8 sm:px-10">
      <header class="mx-auto flex w-full max-w-6xl items-center justify-between">
        <a class="font-mono text-sm font-semibold tracking-normal text-zinc-100" href="/">
          BitterClip
        </a>
        <span class="font-mono text-xs text-zinc-400">bitterclip.com</span>
      </header>

      <div class="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="max-w-3xl">
          <p class="font-mono text-sm text-amber-300">Founder video loops, cut for distribution.</p>
          <h1 class="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
            Turn long conversations into sharp clips.
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            BitterClip is a coming-soon workspace for finding, approving, and preparing clips from founder and operator recordings.
          </p>
          <div class="mt-9">
            <a
              class="inline-flex min-h-12 items-center justify-center rounded-md bg-amber-300 px-5 font-mono text-sm font-semibold tracking-normal text-zinc-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-zinc-950"
              href="mailto:founders@bitterclip.com?subject=BitterClip%20early%20access"
            >
              Coming soon
            </a>
          </div>
        </div>

        <div class="hidden lg:block" aria-hidden="true">
          <div class="grid aspect-[9/12] w-full max-w-sm grid-rows-[1fr_1fr_1fr] gap-3 justify-self-end">
            <div class="rounded-lg border border-white/12 bg-white/8 p-4 shadow-2xl shadow-black/25 backdrop-blur">
              <div class="h-3 w-28 rounded-full bg-amber-300/80" />
              <div class="mt-8 h-20 rounded bg-zinc-900/80" />
              <div class="mt-4 h-3 w-3/4 rounded-full bg-white/30" />
            </div>
            <div class="rounded-lg border border-white/12 bg-white/10 p-4 shadow-2xl shadow-black/25 backdrop-blur">
              <div class="h-3 w-20 rounded-full bg-teal-300/80" />
              <div class="mt-8 h-20 rounded bg-zinc-900/80" />
              <div class="mt-4 h-3 w-2/3 rounded-full bg-white/30" />
            </div>
            <div class="rounded-lg border border-white/12 bg-white/8 p-4 shadow-2xl shadow-black/25 backdrop-blur">
              <div class="h-3 w-24 rounded-full bg-white/70" />
              <div class="mt-8 h-20 rounded bg-zinc-900/80" />
              <div class="mt-4 h-3 w-5/6 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
