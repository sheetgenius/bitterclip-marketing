---
title: We stopped making templates
description: 'Every effect in BitterClip is real code — which means your AI assistant can write one, look at rendered frames of its own work, and make it better. Why we built motion design that way.'
date: '2026-07-08'
author: Michael Ruescher, Founder
ogImage: /images/blog/effects-are-code/og.jpg
heroImage: /images/blog/effects-are-code/hero.jpg
heroAlt: The Signal Lock scene as code — a dark editor panel where the frame function carries the direction note 'smeared horizontally — but not vertically'.
tags:
  - Identity Studio
  - effects
  - AI assistants
---

Open any clip tool and you'll find the same thing: a wall of templates.
Hundreds of them. Someone designed each one eighteen months ago, and it shows
— they're frozen at whatever taste, trends, and tools existed the day they
shipped. Your job is to scroll until one feels close enough, and then live
with "close enough" forever.

We shipped Identity Studio without a template wall, and it wasn't an
oversight. It was the whole point.

## An effect is a program

In BitterClip, an opener isn't a video file with your logo composited on
top. It's a **scene** — a compact program with a stage, elements, and
motion, keyed to time and sound. This is what a minimal one looks like:

```js
export const scene = {
  id: 'my-scene',
  mount(ctx) {
    const root = document.createElement('div')
    root.className = 'scene my-scene'
    root.innerHTML = '<style>.my-scene{background:#000}</style><b>YOUR MARK</b>'
    ctx.layer.append(root)
    return { root }
  },
  frame(ctx) {
    // motion, keyed to ctx.sync.progress and the soundtrack's amplitude
    ctx.refs.root.style.opacity = ctx.sync.progress
  },
}
```

The real ones are richer — the Signal Lock effect that glitches your
wordmark into focus is a few hundred lines — but the shape is the same:
plain code, drawing on a stage, in time with sound. When your render bakes,
the scene bakes with it, into the actual MP4.

## Why code instead of templates

Because code is the one format that gets better on its own.

A template is a frozen decision. Code is a *language* — and the striking
thing about the last few years is that models have gotten very, very good at
languages. When motion design is code, your AI assistant can do what a
motion designer does: write a draft, **look at rendered frames of its own
work**, notice the wordmark is drifting or the beat lands late, revise, and
look again. That loop — write, preview, critique, revise — runs right inside
your ChatGPT or Claude conversation, against your brand pack, until the
opener feels intentional.

We watched an assistant that had never seen these tools take a logo and a
one-line brief and produce a working signature opener, end to end, in one
conversation. Not by picking template #47 — by writing the scene.

## The bet underneath

Here's the honest version of the bet: **models improve every quarter;
template libraries don't.**

If we shipped five hundred templates today, they'd be stale by spring, and
the only fix would be us designing five hundred more. Instead we shipped a
small set of signature effects we're proud of — and a contract that lets any
sufficiently good model author new ones. Every time the models get better at
code, at visual judgment, at taste, your ceiling rises. You didn't upgrade
anything. Your subscription didn't change. The tool underneath your
assistant just became a better designer.

That's the principle we build on across BitterClip: prefer general
mechanisms that ride the improvement curve over special-cased features that
freeze it. Effects-as-code is the most visible example — the same idea runs
through how assistants read transcripts, pick moments, and cut episodes.

## What stays yours

Here's the part I should be honest about, because I lived it: the fiddling
doesn't go away. It moves up a level.

The signature effects that ship with BitterClip — Signal Lock included —
were made in exactly this loop, and it took a long, iterative process to
get them right. But I never wrote a line of the code. I worked the way a
producer works: watch the take, react in plain language — "I want the
letters to feel like they're being smeared horizontally, but not
vertically," "the flash is too eager," "let it settle a beat later" — and
let the model translate taste into code. Less operating a timeline, more being Rick
Rubin on the couch: you don't play the instruments; you know when it's
right.

That's the job that's left, and it's the good part. You bring the brand,
the references, the "again, but calmer," and the final yes. The assistant
brings the hands. And because every scene is inspectable code bound to your
account, you can always open the lab, see exactly what it made, and change
your mind tomorrow.

The template wall asked you to settle. This asks you to produce.

*Your show, your taste, better hands every quarter.*
