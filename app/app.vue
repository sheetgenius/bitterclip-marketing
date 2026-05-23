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

        <div class="relative mx-auto w-full max-w-[34rem]" aria-label="Video clips being cut into short clips">
          <div class="clip-stage">
            <article
              class="clip-card clip-card-1"
              style="--cut-delay: 0ms"
            >
              <div class="clip-slice clip-slice-left">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-opening.mp4" type="video/mp4">
                </video>
              </div>
              <div class="clip-slice clip-slice-right">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-opening.mp4" type="video/mp4">
                </video>
              </div>
              <span class="clip-caption">Day 1 / opening hook</span>
            </article>

            <article
              class="clip-card clip-card-2"
              style="--cut-delay: 140ms"
            >
              <div class="clip-slice clip-slice-left">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-models.mp4" type="video/mp4">
                </video>
              </div>
              <div class="clip-slice clip-slice-right">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-models.mp4" type="video/mp4">
                </video>
              </div>
              <span class="clip-caption">Model whisperer</span>
            </article>

            <article
              class="clip-card clip-card-3"
              style="--cut-delay: 280ms"
            >
              <div class="clip-slice clip-slice-left">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-loop.mp4" type="video/mp4">
                </video>
              </div>
              <div class="clip-slice clip-slice-right">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-loop.mp4" type="video/mp4">
                </video>
              </div>
              <span class="clip-caption">Loop architecture</span>
            </article>

            <div class="cut-path" />

            <svg
              class="scissor"
              viewBox="0 0 420 250"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <g class="scissor-blade-top">
                <path d="M182 105L404 20L212 128L182 105Z" fill="#f8fafc" />
                <path d="M198 111L382 35L214 119" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" />
              </g>
              <g class="scissor-blade-bottom">
                <path d="M182 145L404 230L212 122L182 145Z" fill="#e2e8f0" />
                <path d="M198 139L382 215L214 131" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" />
              </g>
              <path d="M148 126L218 126" stroke="#f8fafc" stroke-width="18" stroke-linecap="round" />
              <circle cx="134" cy="88" r="43" stroke="#fcd34d" stroke-width="18" />
              <circle cx="134" cy="164" r="43" stroke="#fcd34d" stroke-width="18" />
              <circle cx="181" cy="126" r="16" fill="#fcd34d" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
