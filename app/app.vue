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
              </article>
              <article class="source-slice" aria-hidden="true">
                <video autoplay loop muted playsinline preload="metadata">
                  <source src="/clips/day-1-opening.mp4" type="video/mp4">
                </video>
              </article>
              <div class="machine-strip" aria-hidden="true">
                <span>drop file</span>
                <span>auto directive</span>
                <span>1 credit</span>
                <strong>Clip</strong>
              </div>
              <div class="charge-rail" aria-hidden="true">
                <span class="charge-fill" />
                <span class="charge-tick charge-tick-1" />
                <span class="charge-tick charge-tick-2" />
                <span class="charge-tick charge-tick-3" />
              </div>

              <div class="cut-line" aria-hidden="true">
                <span />
              </div>
              <svg
                class="scissors"
                viewBox="0 0 560 230"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <g class="scissor-lower">
                  <path class="scissor-blade" d="M198 120L524 140L220 132Z" />
                  <path class="scissor-edge" d="M224 130L498 137" />
                </g>
                <g class="scissor-upper">
                  <path class="scissor-blade" d="M198 110L524 90L220 98Z" />
                  <path class="scissor-edge" d="M224 100L498 93" />
                </g>
                <circle class="scissor-pivot" cx="198" cy="115" r="18" />
                <path class="scissor-grip" d="M181 114C145 88 108 54 72 62C34 70 28 123 62 142C97 162 139 135 181 114Z" />
                <path class="scissor-grip" d="M181 116C145 142 108 176 72 168C34 160 28 107 62 88C97 68 139 95 181 116Z" />
              </svg>
              <div class="extract-path extract-path-left" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div class="extract-path extract-path-right" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

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
              <article class="burst-next" aria-hidden="true">
                <span>clip 03</span>
              </article>

              <div class="zap-again" aria-hidden="true">
                <span>1 credit</span>
                <strong>Clip again</strong>
                <em>clip 03</em>
              </div>
            </div>
          </div>
        </div>

        <div class="flex min-h-0 flex-[0_0_37%] flex-col items-center justify-center pb-5 pt-1 text-center">
          <p class="font-mono text-sm text-amber-300">Video in. Clips out.</p>
          <h1 class="mt-4 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-normal text-white sm:text-5xl lg:text-6xl">
            Drop a video. Clip once. Shorts jump out.
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            Add an optional directive, pay a little, and clip once for one short. Clip again when you want more.
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
