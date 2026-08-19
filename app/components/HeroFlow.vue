<script setup lang="ts">
/**
 * The hero as one flat illustration: a folder of session files enters from the
 * left, passes through BitterClip, comes out as a finished film strip with the
 * cut, speaker titles, opener and music attached to it, and fans out to the
 * channels it publishes to.
 *
 * No WebGL and no 3D. Everything here is DOM, CSS and one SVG for the beams,
 * which means it renders server-side, costs no JavaScript bundle, and the type
 * stays real text rather than pixels baked into a canvas.
 *
 * Sizing: the stage is a container, and every dimension is in `cqw` (percent of
 * the stage's own width), so the whole illustration scales as one piece instead
 * of needing a breakpoint per element.
 *
 * ACCURACY: the channels shown are YouTube, LinkedIn and X — the three that
 * actually publish after your approval. Instagram is capped to manual handoff
 * and is deliberately absent. See content/_data/connectors.yml.
 */

// Twelve consecutive frames, 0.35s apart, from one continuous take of the park
// session. Consecutive matters: adjacent frames being near-identical is the
// only reason a strip reads as time passing rather than as a row of pictures.
const FRAMES = Array.from({ length: 9 }, (_, i) => `/images/hero/f${String(i).padStart(2, '0')}.jpg`)

const DEVICES = [
  { label: 'iPhone', count: 15 },
  { label: 'iPad', count: 1 },
  { label: 'Meta clips', count: 8 },
]

const CHANNELS = [
  { name: 'YouTube', tint: '#ff3d3d', y: 18 },
  { name: 'LinkedIn', tint: '#3d9bff', y: 44 },
  { name: 'X', tint: '#e8e8ea', y: 70 },
]
</script>

<template>
  <div class="stage" aria-hidden="true">
    <!-- Everything sits in one 3D world so a single rotation gives the whole
         flow a consistent vanishing point: the folder recedes, the portal is
         seen at an angle, and the strip runs away from the camera into it. This
         is CSS 3D — no WebGL, no runtime cost, still real DOM and real text. -->
    <div class="world">
    <!-- Beams: behind everything, drawn once in SVG so the curves stay smooth. -->
    <svg class="beams" viewBox="0 0 160 86" preserveAspectRatio="none">
      <defs>
        <filter id="beamGlow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <g :filter="'url(#beamGlow)'" fill="none" stroke-linecap="round">
        <path
          v-for="ch in CHANNELS"
          :key="ch.name"
          :d="`M 116 43 C 125 43, 127 ${ch.y}, 134 ${ch.y}`"
          :stroke="ch.tint"
          stroke-width="0.7"
          opacity="0.85"
        />
      </g>
    </svg>

    <!-- ① the folder of session files ---------------------------------------->
    <div class="files">
      <div class="files__stack">
        <span v-for="n in 3" :key="n" class="files__sheet" :style="{ '--i': n }" />
      </div>
      <div class="files__folder">
        <p class="files__count">24 FILES</p>
        <p class="files__sub">one session</p>
      </div>
    </div>

    <ul class="devices">
      <li v-for="d in DEVICES" :key="d.label" class="devices__chip">
        {{ d.label }} <span class="devices__n">×{{ d.count }}</span>
      </li>
    </ul>

    <!-- ② through BitterClip -------------------------------------------------->
    <div class="portal">
      <div class="portal__back" />
      <div class="portal__frame" />
      <p class="portal__mark">bitterclip</p>
    </div>

    <!-- ③ the finished strip -------------------------------------------------->
    <div class="strip">
      <span class="strip__perf strip__perf--top" />
      <div class="strip__cells">
        <img
          v-for="(src, i) in FRAMES"
          :key="src"
          :src="src"
          class="strip__cell"
          :class="{ 'strip__cell--cut': i === 3 || i === 4 }"
          width="304"
          height="228"
          alt=""
          loading="eager"
          decoding="async"
        >
      </div>
      <span class="strip__perf strip__perf--bottom" />

      <!-- the run being removed, marked on the film itself -->
      <span class="cutmark" />
    </div>

    <!-- overlays attaching to the strip --------------------------------------->
    <p class="tag tag--um">um…</p>
    <p class="note note--cut">Remove ums</p>

    <div class="card card--title">
      <p class="card__name">Andrew Williams</p>
      <p class="card__role">Head Coach, Strength &amp; Positions</p>
    </div>
    <p class="note note--titles">Speaker titles</p>

    <div class="card card--opener">
      <p class="card__kicker">SESSION 04</p>
      <p class="card__show">Strength &amp;<br>Positions</p>
    </div>
    <p class="note note--opener">Show opener</p>

    <div class="card card--music">♪</div>
    <p class="note note--music">Music &amp; outro</p>

    <!-- ④ the channels -------------------------------------------------------->
    <ul class="channels">
      <li
        v-for="ch in CHANNELS"
        :key="ch.name"
        class="channels__item"
        :style="{ '--tint': ch.tint, top: `${ch.y}%` }"
      >
        <span class="channels__dot" />
        {{ ch.name }}
      </li>
    </ul>
    </div>
  </div>
</template>

<style scoped>
/* One place for the strip's geometry so the cut marker cannot drift out of
   register with the cells it is meant to bracket. */
.stage {
  --strip-left: 28cqw;
  --strip-w: 44cqw;
  --cell: 4.67cqw;   /* (44 - 8 gaps) / 9 cells */
  --gap: 0.25cqw;
  container-type: inline-size;
  position: relative;
  width: 100%;
  aspect-ratio: 160 / 78;
  font-family: var(--font-sans);
  perspective: 150cqw;
  perspective-origin: 62% 50%;
}

/* One rotation for the whole scene. Everything inside inherits the vanishing
   point, which is what stops the parts reading as separate flat stickers. */
.world {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateX(7deg) rotateY(-15deg);
}

.beams {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ① files ------------------------------------------------------------------ */
.files { position: absolute; left: 1cqw; top: 44%; width: 15cqw; transform-style: preserve-3d; }
.files__stack { position: absolute; inset: 0; transform-style: preserve-3d; }
.files__sheet {
  position: absolute;
  transform: translate3d(calc(var(--i) * 1.4cqw), calc(var(--i) * -1.1cqw), calc(var(--i) * -3cqw));
  width: 12.5cqw;
  height: 8cqw;
  border-radius: 0.9cqw;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
}
.files__folder {
  position: relative;
  width: 13cqw;
  padding: 1.4cqw 1.3cqw;
  border-radius: 1cqw;
  background: rgba(22, 22, 26, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.16);
}
.files__count { margin: 0; font-family: var(--font-mono); font-size: 1.5cqw; letter-spacing: 0.1em; color: #f4f4f5; }
.files__sub { margin: 0.35cqw 0 0; font-family: var(--font-mono); font-size: 1cqw; color: rgba(244,244,245,0.42); }

.devices {
  position: absolute; left: 1.5cqw; top: 10%;
  margin: 0; padding: 0; list-style: none;
  display: flex; flex-direction: column; gap: 0.8cqw;
}
.devices__chip {
  align-self: flex-start;
  padding: 0.5cqw 1cqw;
  border-radius: 0.7cqw;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 1.1cqw;
  color: rgba(244,244,245,0.8);
  white-space: nowrap;
}
.devices__n { color: rgba(244,244,245,0.4); font-family: var(--font-mono); }

/* ② the portal — the aperture the session passes through ------------------- */
.portal {
  position: absolute; left: 17cqw; top: 50%;
  width: 9cqw; height: 23cqw;
  transform-style: preserve-3d;
  transform: translateY(-50%) rotateY(32deg);
}
/* The far face, pushed back in Z — the gap between the two is what reads as
   an opening you can pass through rather than a printed rectangle. */
.portal__back {
  position: absolute; inset: 0;
  transform: translateZ(-3.4cqw);
  border-radius: 1.6cqw;
  border: 0.28cqw solid rgba(242,143,132,0.35);
  background: rgba(10,10,12,0.85);
}
.portal__frame {
  position: absolute; inset: 0;
  border-radius: 1.6cqw;
  border: 0.3cqw solid rgba(242,143,132,0.9);
  background:
    linear-gradient(180deg, rgba(242,143,132,0.20), rgba(242,143,132,0.02)),
    rgba(10,10,12,0.6);
  box-shadow: inset 0 0 3cqw rgba(242,143,132,0.28);
}
.portal__mark {
  position: absolute; left: 50%; top: -3.4cqw;
  transform-origin: center;
  transform: translateX(-50%);
  margin: 0;
  font-size: 2cqw; font-weight: 700; letter-spacing: -0.02em;
  color: #f4f4f5; white-space: nowrap;
}

/* ③ the strip -------------------------------------------------------------- */
.strip {
  position: absolute;
  left: var(--strip-left);
  top: 50%;
  transform: translateY(-50%) rotate(-1.2deg) rotateX(12deg);
  transform-style: preserve-3d;
  width: var(--strip-w);
  padding: 1cqw 0;
  background: #0b0b0c;
}
.strip__perf {
  position: absolute; left: 0; right: 0; height: 1cqw;
  background-image: repeating-linear-gradient(
    to right,
    rgba(255,255,255,0.24) 0 0.62cqw,
    transparent 0.62cqw 1.75cqw
  );
}
.strip__perf--top { top: 0.22cqw; }
.strip__perf--bottom { bottom: 0.22cqw; }

.strip__cells { display: flex; gap: var(--gap); }
.strip__cell { display: block; width: var(--cell); height: auto; object-fit: cover; }
.strip__cell--cut { opacity: 0.26; filter: grayscale(1); }

/* Brackets cells 3 and 4 — derived from the same variables as the cells. */
.cutmark {
  position: absolute;
  left: calc(3 * (var(--cell) + var(--gap)));
  width: calc(2 * var(--cell) + var(--gap));
  top: -0.45cqw; bottom: -0.45cqw;
  border: 0.2cqw dashed #f28f84;
  border-radius: 0.4cqw;
}

/* overlays — each label sits beside the thing it names --------------------- */
.tag, .note, .card { position: absolute; margin: 0; }
.tag {
  padding: 0.45cqw 0.9cqw;
  border-radius: 0.55cqw;
  background: rgba(242,143,132,0.16);
  border: 1px solid rgba(242,143,132,0.5);
  color: #ffd0c7;
  font-family: var(--font-mono);
  font-size: 1.05cqw;
}
.tag--um { left: 41.5cqw; top: 27%; }

.note { font-family: var(--font-hand); font-size: 1.75cqw; color: #ffb4a8; white-space: nowrap; }
.note--cut     { left: 39.5cqw; top: 76%; }
.note--titles  { left: 50cqw;   top: 12%; }
.note--opener  { left: 31cqw;   top: 83%; }
.note--music   { left: 63cqw;   top: 16%; }

.card {
  border-radius: 0.8cqw;
  background: rgba(14,14,17,0.95);
  border: 1px solid rgba(255,255,255,0.16);
  padding: 0.9cqw 1.2cqw;
}
.card--title { left: 49cqw; top: 21%; }
.card__name { margin: 0; font-size: 1.35cqw; font-weight: 700; color: #f4f4f5; }
.card__role { margin: 0.2cqw 0 0; font-family: var(--font-mono); font-size: 0.9cqw; color: rgba(244,244,245,0.55); }

.card--opener { left: 30cqw; top: 64%; border-color: rgba(242,143,132,0.45); }
.card__kicker { margin: 0; font-family: var(--font-mono); font-size: 0.85cqw; letter-spacing: 0.12em; color: #f28f84; }
.card__show { margin: 0.25cqw 0 0; font-size: 1.35cqw; font-weight: 700; line-height: 1.15; color: #f4f4f5; }

.card--music { left: 64cqw; top: 25%; font-size: 1.7cqw; color: #f28f84; padding: 0.6cqw 0.95cqw; }

/* ④ channels --------------------------------------------------------------- */
.channels {
  position: absolute; right: 1cqw; top: 0; bottom: 0; width: 14cqw;
  margin: 0; padding: 0; list-style: none;
}
.channels__item {
  position: absolute; right: 0;
  transform: translateY(-50%) rotateY(-20deg);
  display: flex; align-items: center; gap: 0.8cqw;
  width: 13cqw;
  padding: 0.9cqw 1.2cqw;
  border-radius: 0.9cqw;
  background: rgba(18,18,21,0.94);
  border: 1px solid rgba(255,255,255,0.16);
  font-size: 1.35cqw; font-weight: 600; color: #f4f4f5;
}
.channels__dot { width: 1cqw; height: 1cqw; border-radius: 50%; background: var(--tint); flex: none; }
</style>
