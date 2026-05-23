<template>
  <main class="min-h-screen bg-zinc-950 text-white">
    <section class="relative min-h-screen overflow-hidden px-6 py-6 sm:px-10">
      <header class="mx-auto flex w-full max-w-6xl items-center justify-between">
        <a class="font-mono text-sm font-semibold tracking-normal text-zinc-100" href="/">
          BitterClip
        </a>
        <span class="font-mono text-xs text-zinc-400">bitterclip.com</span>
      </header>

      <div class="mx-auto flex h-[calc(100vh-3.25rem)] w-full max-w-6xl flex-col">
        <div class="flex min-h-0 flex-[0_0_63%] items-center justify-center py-2 sm:py-4" aria-label="Video clips being extracted from source recordings">
          <div class="relative mx-auto w-full max-w-[41rem]">
            <div class="stage-floor" />
            <div class="stage-haze" />
            <div class="zap-stage">
              <article class="source-card">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-opening.mp4" type="video/mp4">
                </video>
                <span class="source-caption">drop video</span>
              </article>

              <div class="beam" />
              <div class="zap-orb" />
              <svg
                class="lightning"
                viewBox="0 0 520 520"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path class="bolt-main" d="M454 38L298 210H388L206 482L244 278H154L454 38Z" />
                <path class="bolt-branch bolt-branch-1" d="M304 220L162 166L224 248" />
                <path class="bolt-branch bolt-branch-2" d="M285 274L456 315L344 340" />
                <path class="bolt-branch bolt-branch-3" d="M247 314L105 397L218 374" />
              </svg>

              <article class="burst burst-left">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-models.mp4" type="video/mp4">
                </video>
                <span>clip 01</span>
              </article>
              <article class="burst burst-right">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-loop.mp4" type="video/mp4">
                </video>
                <span>clip 02</span>
              </article>

              <div class="reactions reactions-left" aria-hidden="true">
                <span class="reaction reaction-heart">&#9829;</span>
                <span class="reaction reaction-like">like</span>
                <span class="reaction reaction-count">+18</span>
              </div>
              <div class="reactions reactions-right" aria-hidden="true">
                <span class="reaction reaction-heart">&#9829;</span>
                <span class="reaction reaction-like">save</span>
                <span class="reaction reaction-count">+31</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex min-h-0 flex-[0_0_37%] flex-col items-center justify-center pb-5 pt-1 text-center">
          <p class="font-mono text-sm text-amber-300">Video in. Clips out.</p>
          <h1 class="mt-4 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-normal text-white sm:text-5xl lg:text-6xl">
            Drop a video. Hit Zap. Clips jump out.
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            Add an optional directive, pay a little, and zap once for one clip. Zap again when you want more.
          </p>
          <div class="mt-5">
            <a
              class="inline-flex min-h-12 items-center justify-center rounded-md bg-amber-300 px-5 font-mono text-sm font-semibold tracking-normal text-zinc-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-zinc-950"
              href="mailto:founders@bitterclip.com?subject=BitterClip%20early%20access"
            >
              Coming soon
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
