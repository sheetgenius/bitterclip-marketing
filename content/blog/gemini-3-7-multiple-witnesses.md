---
title: "One lesson, multiple witnesses: why Gemini 3.7 did not become BitterClip's default"
description: 'Gemini 3.7 had 47.4% lower provider-attempt latency and 20% lower estimated cost offline. Then a production canary returned invalid source times. Here is why BitterClip stayed on 3.6.'
date: '2026-08-14'
author: Michael Ruescher, Founder
ogImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-og.png
heroImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-og.png
heroAlt: A benchmark card reading Lower latency offline, rejected by the production gate, with Gemini 3.7 latency, cost, and temporal-gate results.
tags:
  - Gemini
  - visual understanding
  - benchmarks
  - engineering
---

Gemini 3.7 looked like an easy upgrade. In our offline comparison its
provider-attempt latency was 47.4% lower, and its outputs cost an estimated 20%
less to process. Then it failed
the test that mattered most: running through BitterClip's real production job,
it placed five observations outside the video chunk it was describing. The same
response also contained an interval that ended before it began.

We did not make it the default.

![Gemini 3.7 had lower latency and estimated cost in the offline comparison, but failed BitterClip's production temporal-grounding gate.](/images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-chart.svg)

That is not the same as saying Gemini 3.7 is a worse model. It is the narrower,
more useful conclusion: **Gemini 3.7 did not earn control of BitterClip's source
clock.**

## Why one lesson needed two cameras

The test footage was one real outdoor coaching session, recorded at the same
time from a static phone and a close first-person camera. One camera could see
the shape of the lesson. The other could see details the wide shot lost. In
some moments, a person was mostly hidden in one view and clear in the other.

This is the everyday multi-camera problem in miniature. If a coach gives an
instruction, demonstrates it, watches the learner try it, and then offers a
correction, a useful system has to keep several things straight:

- who is teaching and who is responding;
- what each camera actually shows;
- whether an instruction is followed by a visible action;
- which details become knowable only after combining views;
- when the picture is too occluded or ambiguous to support a claim.

We synchronized the recordings from their audio before asking a model anything.
The overlap was fixed by BitterClip, not guessed by Gemini. That distinction is
important: two cameras only become two witnesses after the system establishes
that they are showing the same moment.

We also kept observation separate from editing. A camera can contain useful
evidence without being the shot an editor should choose. Coverage is not the
cut.

## The benchmark

We tested Google's stable `gemini-3.7-flash` against the exact
`gemini-3.6-flash` baseline. We selected 15 diagnostic moments and 23 individual
camera excerpts. They
covered setup, demonstration, attempts, corrections, fine body position,
sustained movement, transitions, occlusion, and deliberately bad pairings. The
locked visual comparison used checksummed clips with audio removed, so a model
could not smuggle spoken instructions into what we called visual understanding.

For the cleanest model comparison, Gemini 3.6 and 3.7 received the same media,
prompt, schema, and transform. Each source-local case ran three times, producing
69 matched pairs. We recorded the exact requested and served model, latency,
token use, estimated cost, normalized output, and every normalization action.

([Gemini 3.7 Flash model details](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash))

The wider workshop also explored sampled frames, native video, several media
resolutions and thinking levels, transcript and vision combinations, one-pass
versus observe-then-synthesize analysis, two videos in one request, and
duplicate, shifted, mismatched, and withheld-camera controls.

Not every exploratory arm became a scored result. Thinking-level, free-form,
and modality comparisons stayed in discovery. A whole-recording response failed
our deterministic time-bound checks, so it produced no efficacy result. We also
did not finish a blinded comparative human score after the preregistered
repeatability gate failed. Guided human spot checks improved the truth set, but
they are not a substitute for that comparison.

## What looked better

All 138 requests completed—69 per model—forming 69 matched pairs. On those
pairs, Gemini 3.7 was clearly better operationally:

| Measure | Gemini 3.6 | Gemini 3.7 | Difference |
| --- | ---: | ---: | ---: |
| Mean paired provider-attempt latency | baseline | lower | **47.4% lower** |
| Mean paired estimated provider cost | baseline | lower | **19.9% lower** |
| Lexical claim-set repeatability | 0.333 | 0.341 | slightly higher |

The latency result is a mean paired difference. Its window-clustered 95%
interval was 42.9% to 52.0% lower. The mean paired estimated-cost difference had
a 95% interval of 15.3% to 24.3% lower. Separately, aggregate estimated provider
cost per analyzed minute was $0.0649 for 3.6 and $0.0513 for 3.7, a 21.0% lower
aggregate ratio.

Gemini 3.7 was not on a cheaper tariff. Google listed 3.6 and 3.7 at the same
temporary promotional Standard rates through December 31, 2026. The difference
came from the observed token and cache mix in these runs. These are rate-card
estimates, not a reconciled provider invoice. They also measure provider
attempts, not synchronization, video preparation, queues, storage, or the full
BitterClip job. ([Google's current pricing](https://ai.google.dev/gemini-api/docs/pricing))

The model-only numbers gave us a reason to continue. They did not give us a
reason to switch production.

## The multi-camera result was not stable enough

We registered an intentionally strict median Jaccard threshold of 0.85 before
seeing any provider output. The exact lexical projection used to calculate that
score was locked later: after repeat-2 execution had begun, but before semantic
inspection and before repeat 3. For the same system, moment, and witness, it
normalized the set of claims and measured how much the three runs overlapped.

The observed median across the wider confirmation suite was 0.320.

Gemini 3.7's source-local slice scored 0.341, slightly above Gemini 3.6 at
0.333. That tiny difference does not show that 3.7 was worse. It shows that
neither model came close to our absolute rule. The metric is lexical, so it can
punish harmless paraphrase, and 0.85 may have been too ambitious. But changing a
rule after seeing the result would turn the benchmark into a negotiation.

The poison tests supplied a second warning. In two of seven registered units,
the structural presence or absence of a cross-witness relationship array changed
across repeats. These were not human-adjudicated false same-moment claims. A
separate duplicate-media control showed why the architecture matters: label the
same bytes as two witnesses and a model may still describe their agreement as
corroboration.

The safer design is now clear:

1. keep each camera's observations intact;
2. establish media identity, synchronization, and overlap outside the model;
3. let a later synthesis cite those observations without rewriting them.

When synchronization is missing, BitterClip should forbid a combined claim. A
model obeying that rule has not detected a mismatch; it has followed a guard the
host already proved.

## Then the production canary failed

The offline benchmark used a candidate inline-media adapter. BitterClip's real
visual-analysis job is different: it downloads the Recording, creates silent
chunks, uploads them through Google's Files API, waits for them to become active,
asks for structured observations, normalizes local times, stitches the chunks,
and writes source-linked understanding.

So we added a narrow canary path before considering a default-model change. The
canary was deliberately single-source: it tested the current B5 production job,
not multi-camera synthesis. It required one exact model for every chunk,
pinned requested and fallback to the same exact ID to prevent cross-model
fallback, refused normalization repairs, prevented the candidate from entering
product understanding, and required remote-file cleanup.

One production canary ran against a real Recording. The response to the canary
request pinned to `gemini-3.7-flash` contained:

- five visual observations outside the declared `0.000–194.321` second chunk;
- one reversed visual-observation interval;
- one boundary cue outside the same chunk.

BitterClip's strict normalizer rejected the result after 431.8 seconds. No
candidate annotations entered product understanding. The saved annotation
projection remained byte-for-byte identical, the source and Project settings
remained off, and the temporary Gemini Files store was empty after cleanup.

This is the strong reason not to upgrade yet. BitterClip treats source media as
timing authority. If an observation points outside the material it claims to
describe, every downstream use becomes suspect: grounded questions, visual
annotations, highlight discovery, and eventually camera decisions. Faster wrong
coordinates are not a production improvement.

It exposed a failure the successful development example did not; one run in
either direction cannot estimate the failure rate.

## What shipped, and what did not

The default model is still `gemini-3.6-flash`. We did not need a rollback because
3.7 never became the default.

The safety work did ship. BitterClip can now run an entitled, non-promoting
model canary through the real job path; assert the exact served model for every
chunk; pin requested and fallback to the same exact ID to prevent cross-model
fallback; fail on timestamp repairs, drops, or clamps; isolate candidate output
from normal recovery and product indexes; and record cleanup without persisting
provider file handles.

The offline workshop's rate-card estimate was $10.46, including $3.50 in
conservative reserves for calls without returned usage. Development job-path
checks added about $0.28. The failed production canary returned no usable usage
receipt, so we reserve another $0.50 rather than invent a smaller bill. Total
conservative exposure remained under $11.25 against a $50 cap.

## What would change the decision

We will test 3.7 again, but not by repeatedly pulling the canary lever until one
run happens to pass. The next attempt needs a declared prompt or schema change
for chunk-local time, a newly registered series of production canaries, and the
same fail-closed checks. Multi-camera synthesis still needs a durable blinded
human review after the deterministic gates pass.

So the result is neither "Gemini 3.7 is bad" nor "benchmarks do not matter."
The result is more concrete:

**Gemini 3.7 did not earn the source-scoped production default because the exact
canary broke the source-time contract. Separately, the proposed multi-witness
architecture failed its repeatability and poison-stability gates.**

Speed bought the model another test. It did not buy it the clock.
