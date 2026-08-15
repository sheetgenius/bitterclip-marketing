---
title: "One lesson, two cameras, and a Gemini 3.7 upgrade that got weird"
description: "Gemini 3.7 was much faster than 3.6 in a real video benchmark. We found and fixed a bad test, then one impossible timestamp stopped the production switch."
date: '2026-08-14'
updated: '2026-08-14'
author: Michael Ruescher, Founder
ogImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-og.png
heroImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-chart.svg
heroAlt: Gemini 3.7 benchmark card showing lower latency, matched development runs, and an impossible production timestamp that held the upgrade.
tags:
  - Gemini
  - visual understanding
  - benchmarks
  - engineering
---

I wanted this to be a shipping post.

Gemini 3.7 had just landed, the early chatter was enthusiastic, and BitterClip
was already using Gemini 3.6 to understand video. A faster model with strong
early reviews looked like the pleasant kind of upgrade: change the exact model
ID, run the tests, watch the bill go down, ship.

That is not what happened.

The short version is that Gemini 3.7 was substantially faster in our matched
comparison, and I found no good evidence that it understood our footage worse
than 3.6. But it is still not BitterClip's production default. Our first result
was contaminated by a mistake in our own prompt. After we fixed that, one fresh
production run returned an observation that began at 146 seconds and ended at
20.8 seconds.

One impossible timestamp was enough to stop the switch.

The useful part is how we got there, because the failure changed how BitterClip
asks models to look at video.

## A better test than a demo reel

The footage was a real outdoor movement lesson. A friend was teaching; I was
trying to follow along. A stationary phone could see both of us. A first-person
camera could see the same lesson from close range, but often lost the teacher's
body or caught only the edge of mine.

That made the session a compact version of the problem BitterClip actually has
to solve. One camera sees the shape of an event. Another sees a hand, foot, or
change in stance that the wide shot misses. Sometimes the second angle adds a
fact. Sometimes it adds nothing. Sometimes two clips look plausible together
but are not the same moment at all.

At the start of this project, I remembered a line like “Where are we going?”
The recording did not contain it. The real opening was simply an introduction
to the lesson. Small correction, big point: when memory and the recording
disagree, the recording wins.

Later, the wide camera clearly showed me copying a lateral movement. The close
camera could see only part of my head and shoulder. In another negative-control
pair, one view showed the teacher gesturing while the other showed both of his
hands planted on a table. If those were truly simultaneous views of the same
two people, both descriptions could not be true.

![Two abstract camera witnesses cover different parts of the same lesson, joined by a deterministic synchronization spine.](/images/blog/gemini-3-7-benchmark/two-witnesses.svg)

Before Gemini saw anything, BitterClip synchronized the recordings from their
audio. The model never had to guess whether two clips overlapped. That matters:
two videos do not become two witnesses because a prompt calls them that. They
become witnesses after the system proves that they share time.

The illustrations in this post are abstract on purpose. We are not publishing
recognizable participant footage or private transcript excerpts as part of the
benchmark.

## What we actually tested

We selected 15 diagnostic moments and 23 individual camera excerpts from the
session. They covered arrival, demonstration, an attempt, a visible response to
an instruction, fine body position, a held movement, transitions, occlusion,
and deliberately shifted or mismatched views.

For the clean model comparison, every visual clip had its audio removed. Gemini
3.6 and 3.7 received the same bytes, prompt, output schema, and settings. Each
witness ran three times, giving us 69 matched calls per model—138 calls in all.
We recorded the exact requested and served model, request and response hashes,
latency, token use, estimated cost, and every normalization action.

We tried the more ambitious versions too: multiple videos in one request, a
synchronized mosaic, separate camera notes followed by synthesis, and several
input settings. They were useful for learning, but not stable enough to support
a public claim. Repeated runs varied, and deliberately mismatched angles did
not reliably make the model stop and say, “these are not the same moment.” We
also did not complete a blinded human comparison.

So I cannot honestly say Gemini 3.7 proved better at understanding multiple
cameras. The decision we could make was narrower: was it safe enough to replace
3.6 in the visual-analysis job BitterClip already runs on each recording?

## At first, 3.7 looked like the easy winner

All 138 matched provider calls completed. Gemini 3.7's mean paired
provider-attempt latency was 47.4% lower than 3.6's, with a window-clustered 95%
interval from 42.9% to 52.0% lower. Its estimated provider cost was 19.9% lower,
with a 95% interval from 15.3% to 24.3% lower.

| Locked source-local comparison | Gemini 3.6 | Gemini 3.7 |
| --- | ---: | ---: |
| Completed calls | 69 / 69 | 69 / 69 |
| Mean paired provider latency | baseline | **47.4% lower** |
| Mean paired estimated cost | baseline | **19.9% lower** |

The cost result needs one caveat. Google listed 3.6 and 3.7 at the same temporary
promotional Standard tariff. The difference came from the token and cache mix
we observed, not a cheaper price for 3.7. These are rate-card estimates, not a
reconciled invoice. ([Google's Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing))

The visual output could be genuinely useful. A representative normalized row,
with the labels shortened for publication, looked like this:

```text
128.0–141.0 seconds
Coach demonstrates a right torso lean and a lateral pelvis shift.
Learner mirrors the movement.
certainty: seen
```

That is close to what a person watching the wide shot would say. It separates
the demonstration from the attempt and puts both on the source clock.

It was not flawless. In the same successful run, a human role was accidentally
labeled `screen_surface` in one internal field. The prose understood the scene;
the type label did not. That is a good example of why “the answer looked smart”
is not a sufficient benchmark.

## The first production failure was ours

BitterClip's production path is not the little benchmark script. It fetches the
Recording, creates silent chunks, uploads them through Google's Files API,
waits for them to become active, asks for structured observations, normalizes
their times, stitches the chunks, and writes source-linked evidence.

Our first 3.7 canary failed that path badly. Several observations landed outside
the chunk. The tempting conclusion was obvious: 3.7 was fast in a lab and unsafe
in production.

Then I asked the more embarrassing question: what if we had tested it badly?

We had.

The first chunk ended at 194.321 seconds. One transcript unit overlapped the
edge of that chunk, so we included the whole unit in the prompt—including its
unclipped end at 204.229 seconds. The same request also inherited the full
recording duration, “cover the whole recording” language, and summaries from
earlier material. We had handed the model several competing clocks and then
scolded it for choosing the wrong one.

We fixed the harness before drawing another conclusion:

- boundary-crossing transcript units are now rebuilt only from timed words
  inside the uploaded chunk, or withheld;
- chunk requests no longer contain the full-source clock or prior-recording
  summaries;
- the chunk's minimum and maximum time are placed directly in the structured
  output schema; and
- success and failure receipts preserve hashes, model identity, token use,
  numeric timestamp paths, and cleanup status without storing private prose.

Structured output gave us valid JSON, but not sensible time. That second check
had to belong to BitterClip. ([Google's structured-output guide](https://ai.google.dev/gemini-api/docs/structured-output))

On the corrected real job path in development, 3.7 completed three of three
strict runs. Gemini 3.6 completed one of three. One 3.6 run jumped outside its
window; another produced the interval `140 → 20`.

So our original story—“3.7 broke production”—was wrong. The timing contract was
fragile across both models.

That was a useful warning, not a model ranking. Three runs each are nowhere
near enough to prove that 3.7 is more reliable.

## One clean canary, one impossible interval

We shipped the harness hardening first, while leaving production on 3.6. Before
running the next canary, we wrote down its pass/fail rules and agreed to one
attempt against that exact release.

The rules were deliberately unfriendly to cherry-picking:

- request exact `gemini-3.7-flash` and use the same ID as fallback;
- run through the real production job;
- reject any decoded, shifted, clamped, dropped, out-of-window, or reversed
  timestamp;
- keep the output out of BitterClip's product indexes; and
- delete every temporary provider file.

Most of the canary behaved exactly as designed. Both chunks were served by the
exact requested model. The second chunk completed. Both uploaded files were
deleted. No annotation reached the product. The saved visual projection was
unchanged.

The first chunk returned this sequence:

```text
observation 7     136.0 → 146.0
observation 8     146.0 →  20.8   ← impossible
observation 9      20.8 → 141.0
```

![A 194.321-second source window with one Gemini interval reversing from 146 seconds back to 20.8 seconds.](/images/blog/gemini-3-7-benchmark/timestamp-reversal.svg)

The model's response was syntactically valid and inside the per-field minimum
and maximum. JSON Schema can bound each number; it cannot express “the end must
be after this row's start” using the subset Gemini supports. BitterClip's own
semantic validator caught the contradiction and stopped before stitch.

The full production job took about seven and a half minutes. The slower part
was creating the two silent video chunks on our CPU-capped worker. The parallel
Gemini attempts took 22.7 and 32.3 seconds. The run's rate-card estimate was
about 7.5 cents for 6.48 minutes of source video. Provider latency and total job
latency are not the same measurement.

We had preregistered one attempt. It failed. Running it again until the dice
came up clean would have made a nicer launch post and a worse experiment.

## Why 3.6 is still the default

Here is the slightly uncomfortable answer: 3.6 did not win.

Gemini 3.6 produced the same class of reversed-time error in development.
Gemini 3.7 was faster, cheaper in this usage mix, and completed more of the
corrected strict development runs. We found no direct evidence that 3.7 is
semantically worse.

But a production migration is a change, and the candidate did not clear the
production gate we wrote before seeing its response. Both models could break
the same timestamp rule, so we kept the known production model, retained the
model-independent hardening, and did not pretend a failed canary had passed.

The default remains `gemini-3.6-flash`. The wider multi-camera synthesis path
also remains off.

The model did not change. The pipeline did:

- every chunk has one authoritative source-time window;
- transcript evidence is clipped to the same window;
- requested and actually served model versions are recorded per chunk;
- failed parallel jobs retain the successful sibling's evidence and cost;
- strict canaries cannot publish annotations or suppress normal enrichment;
- temporary Files API uploads must be confirmed deleted; and
- receipts keep numeric evidence and hashes, not provider prose or private
  transcript text.

Our ledger reserved $11.84 against the $50 cap. That is an estimate from
published rates, not a reconciled invoice.

## What the two cameras taught us anyway

The original question was more ambitious than a model upgrade: can one system
understand a single embodied lesson through multiple visual witnesses?

We do not have a publishable “yes” yet. We do have a much better architecture:

1. synchronize cameras deterministically;
2. keep each camera's observations intact;
3. attach source and time evidence to every claim;
4. synthesize only after the witness records exist; and
5. forbid combined claims when overlap is missing or contradictory.

That last point matters. If the wide shot shows hands on a table and the close
view shows the same person's hand gesturing, the system should not ask a model
to smooth the disagreement into a story. It should preserve the disagreement.

Coverage is not the cut, and synthesis is not permission to erase provenance.

## The next test

The next version may stop asking a model for two independently fallible numbers
per observation. We can ask for ordered boundaries and derive spans ourselves.
That is a new contract, though—not a way to rescue this failed response. Its
next start also jumped backward to 20.8 seconds. Before another canary, the new
contract needs raw-order checks, fresh held-out footage, and repeated matched
3.6/3.7 runs. Less satisfying than changing one constant, but it is what the
work showed.

Gemini 3.7 bought itself another test. It did not buy the clock.
