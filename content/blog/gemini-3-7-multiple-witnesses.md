---
title: "We blamed Gemini 3.7. Then Gemini 3.6 went backward too."
description: "Gemini 3.7 was faster and had a lower estimated cost in our fixed video tests. Our big confirmation stopped early. Here is why we still made a small, reversible upgrade."
date: '2026-08-14'
updated: '2026-08-15'
author: Michael Ruescher, Founder
ogImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-og.png
heroImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-chart.svg
heroAlt: Gemini 3.7 visual benchmark summary showing a promising discovery result, a stopped confirmation, and a bounded production upgrade with Gemini 3.6 as fallback.
tags:
  - Gemini
  - visual understanding
  - benchmarks
  - engineering
---

I wanted this to be a shipping post.

Gemini 3.7 was new, the early reviews were enthusiastic, and BitterClip already
used Gemini 3.6 to understand video. The upgrade looked unusually simple: pin
the new model, confirm that it still understood our footage, enjoy the speedup,
and move on.

Then a production test went backward in time.

The model said one visual event began at 146 seconds and ended at 20.8 seconds.
The obvious conclusion was that Gemini 3.7 had regressed.

Then Gemini 3.6 produced its own version of the same impossible idea.

That changed the question. We were no longer asking, “What is wrong with the new
model?” We were asking, “What is wrong with the job we gave both models?”

The answer turned out to be more useful than a simple model ranking. Gemini 3.7
was much faster in our fixed-chunk tests, and cheaper by rate-card estimate.
Nothing in the work we completed established that it understood the footage
worse. But our production-shaped confirmation still stopped before it could
answer the larger comparison.

This is the story of the bad question, the better one, and the test that caught
one more bug—ours. It is also the story of how we eventually shipped the narrow
change without pretending the unfinished test had passed.

## What we were asking Gemini to see

Our test footage was an outdoor coaching session recorded from more than one
camera. A wide camera could usually see both people. A closer, first-person
camera often caught a foot, knee, or shift in posture that was hard to resolve
in the wide view.

That is a good miniature of BitterClip’s real job. A single recording rarely
contains the whole truth. One camera may establish the shape of an action while
another supplies the decisive detail. Sometimes a camera turns away at exactly
the wrong moment. Sometimes two clips look related but are actually different
moments.

![Two abstract camera witnesses cover different parts of one synchronized moment.](/images/blog/gemini-3-7-benchmark/two-witnesses.svg)

For example:

- One angle showed the coach demonstrating while the learner was partly
  occluded.
- Another made the learner’s foot and knee movement easier to see.
- In one excerpt, the camera turned away just as the learner may have responded.
  The only honest output there was uncertainty.
- In a deliberately mismatched pair, the coach’s hands occupied incompatible
  positions. The two clips could not be treated as the same moment.

BitterClip synchronizes recordings before the model sees them. Gemini is not
asked to guess whether two cameras overlap. Even then, five kinds of evidence
must remain separate:

1. **Pixels:** what one camera visibly records.
2. **Transcript context:** what someone says, which may explain an instruction
   but cannot turn an unseen response into a visual fact.
3. **Synchronization:** proof that two recordings share a moment.
4. **Navigation:** a range BitterClip creates so a person can scrub around an
   observation.
5. **Synthesis:** a combined account that preserves which camera established
   each fact.

A camera can show a foot rolling onto its outer edge while the knee moves
outward. Speech can explain the exercise. Synchronization can establish that a
second camera was recording at the same time. None of those facts proves pain,
intention, effectiveness, correct form, or how long the movement continued.

The illustrations in this article are abstract because the benchmark used
private, recognizable footage and transcript context. We are publishing the
method and aggregate results, not the participants or raw model responses.

## The bad question was a duration

Our original response contract asked the model to give every observation a
precise start and end:

```text
start_seconds: 146.0
end_seconds:    20.8
```

That seems reasonable. Video has a timeline; observations need time. But the
contract quietly asks the model to make two different judgments for every row:
when did the evidence become visible, and when did it stop being visible?

The second number is often not in the pixels. A person may hold a position after
the camera turns away. A correction may begin in one shot and continue beyond
the chunk. Dense structured output makes the problem worse: dozens of rows,
each with two independently generated timestamps, all of which must agree with
one another and with the source clock.

Both models occasionally contradicted themselves. Gemini 3.7 produced the
`146 → 20.8` interval in a later exact-release canary. Other tests found interval
failures from Gemini 3.6 as well. Those failures occurred under different
contracts and at different points in the workshop, so they do not prove the
models failed at the same rate. They do show that the problem was not uniquely a
Gemini 3.7 vision regression.

![An impossible model-authored interval reverses from 146 seconds to 20.8 seconds.](/images/blog/gemini-3-7-benchmark/timestamp-reversal.svg)

There was also a prompt problem. One early chunk mixed a chunk-local video with
full-recording timing and transcript context that extended past the uploaded
media. We had supplied competing clocks and then blamed the model for choosing
badly.

So we built a simpler experimental contract. Instead of asking, “Exactly how
long did this action last?”, it asks, “Where is the evidence that this is
visible?”

```text
at_seconds: 146.0
```

One model-authored point is a smaller, more defensible claim. It becomes grounded
only when the source supports it. BitterClip can derive a short range around the
point for navigation, but that range carries an explicit warning: it helps a
person find the moment; it is not evidence that the action persisted for the
whole range.

![A model-guessed duration is replaced by one model-authored evidence point and a separate host-derived navigation range.](/images/blog/gemini-3-7-benchmark/evidence-point-contract.svg)

The system also validates the raw points before sorting, clamping, rebasing, or
repair. If the sequence goes backward, the job fails. We would rather preserve
an honest failure than manufacture a plausible timeline from a broken one.

## The discovery result looked promising

We compared four response contracts on the same two silent video chunks. Every
matched pair used the same media, prompt, schema, and generation settings; only
the pinned model changed. There were 96 calls per model, 192 calls in all.

The point-timestamp contract passed raw temporal validation in all 48 of its
calls—24 per model. Across all four shapes, Gemini 3.6 passed raw temporal
validation in 94 of 96 calls and Gemini 3.7 in 92 of 96. That small difference
did not establish a model-specific regression.

The operational difference was much larger:

| Fixed two-chunk discovery workload | Gemini 3.6 | Gemini 3.7 |
| --- | ---: | ---: |
| Provider calls | 96 | 96 |
| Point-contract raw temporal validity | 24 / 24 | 24 / 24 |
| Raw temporal validity across all four contracts | 94 / 96 | 92 / 96 |
| Median provider latency | 27.8 s | **10.8 s** |
| Estimated provider cost | $2.75 | **$2.08** |

![Gemini 3.7 had substantially lower median provider latency on the fixed discovery workload.](/images/blog/gemini-3-7-benchmark/latency-comparison.svg)

Gemini 3.7’s median provider latency was 61.1% lower. Its estimated cost was
24.6% lower.

![Gemini 3.7 had a lower rate-card cost estimate on the fixed discovery workload.](/images/blog/gemini-3-7-benchmark/estimated-cost-comparison.svg)

The cost result does not mean Google priced 3.7 lower. Both models used the same
temporary promotional tariff. The difference came from the token mix we
observed—especially fewer thinking tokens from 3.7—not a cheaper rate. These are
rate-card estimates, not a reconciled provider bill. ([Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing))

This was enough to make 3.7 the candidate. It was not enough, by itself, to
ship it.

Two chunks can test a response contract and expose a large speed difference.
They cannot establish semantic parity across real footage. We still needed to
know whether the new model preserved roles, fine movement, source grounding,
uncertainty, and the boundary between what was visible and what came from the
transcript.

The wider multi-camera experiment was not ready either. Across 94 evaluated
units containing 282 paired observations, repeated outputs had a median lexical
claim overlap of 0.32; we had set 0.85 as the bar. In two of seven deliberately
mismatched-angle controls, repeated runs changed their structural decision. A
word-overlap metric is not factual accuracy, and those flips do not tell us which
answer was right. They do tell us the synthesis was not stable enough to ship.
The blinded comparative semantic review was never completed, so the multi-camera
path stayed off.

## The production-shaped test

We locked a broader confirmation before the first media upload or
`generateContent` request. It planned 106 real application jobs covering 164
planned chunk responses, with the two models interleaved in a fixed order. The
selected configuration used silent video plus clipped transcript context, no
fallback, no hidden application retry, and the same point contract for the
direct model comparison.

The plan required 63 point-contract responses from each model. It also included
a smaller strict version of the current Gemini 3.6 interval package and a
semantic safety screen grounded in previously reviewed footage. The locked
comparison could not authorize the candidate on structural validity alone.

The run made it through 24 jobs. Then Gemini 3.6 returned a sequence of evidence
points that moved backward.

That part worked exactly as designed. The provider completed the response. The
raw validator rejected the ordering before any repair. Two sibling chunks in
the same job completed normally.

Then our audit trail failed.

The validator had recently moved from version 1 to version 2. The component that
collects safe failure receipts still understood only version 1. It replaced the
failed chunk’s diagnostic—including its upload-cleanup evidence—with a redaction
marker. The two successful siblings kept their cleanup receipts; the failed
chunk did not.

The collector bug did not create the backward point. The backward point exposed
the collector bug.

And because the test could no longer prove the custody state of all three
temporary uploads from its original records, it stopped before job 25.

![The locked confirmation stopped after 24 of 106 jobs, before the semantic screen and reliability denominator were complete.](/images/blog/gemini-3-7-benchmark/confirmation-stopped.svg)

We later performed one read-only Files inventory and found no remote files
remaining. That establishes current absence. It does not prove the missing
original delete, and it does not convert the stopped run into a pass.

## No winner

At the stop, Gemini 3.7 had completed eight point-contract jobs covering 13
chunk responses without a catastrophic failure. That is encouraging. The gate
required 63 responses, and the semantic screen had not run.

The honest result is **inconclusive**.

The partial run did not establish a winner. We did not rerun the failed job,
replace the missing denominator, or weaken the gate after seeing the output.

That settled the research result. It did not settle the product decision.

Restarting the hundred-job comparison would answer the scientific question. We
had a separate, narrower product question: did the accumulated evidence justify
a reversible pin-only trial with a live fallback? We already knew four things:
both models could fail the old timing contract; we had not found a 3.7-specific
vision regression; 3.7 was materially faster and cheaper by estimate on the
matched workload; and the model pin was easy to reverse.

So we made a smaller decision than the benchmark had tried to make.

## What we shipped

First, we ran one strict, nonpromoting canary through BitterClip’s real B5 path.
It covered two video chunks. Both calls requested and served Gemini 3.7 on the
first attempt, ended normally, returned direct JSON, passed the production
normalization checks, and cleaned up their temporary uploads. Nothing reached a
customer-facing projection. The rate-card estimate was about eight cents.

Then we changed only the visual-analysis pins: Gemini 3.7 became the primary
model and Gemini 3.6 became its fallback. The analyzer and existing interval
contract stayed put. The point contract and multi-camera synthesis path stayed
off.

Finally, we ran one promoting visual-path acceptance on a one-minute recording.
Before starting it, we found that a completely ordinary completion would also
kick off copywriting work and could fan visual processing out across 17 other
recordings. That was unrelated to the model decision, expensive, and exactly the
kind of accidental “one more test” we wanted to avoid. We suppressed those two
downstream actions inside the isolated acceptance process and tested the visual
path itself.

The single Gemini call requested the deployed default, served 3.7 without using
the fallback, ended with `STOP`, returned direct JSON, and deleted its upload.
BitterClip normalized and stitched the result, wrote the run artifacts, and
indexed eight visual actions. There was no second attempt. The estimate was just
under two cents.

The visual path completed, but the acceptance runner still marked its outer
receipt failed because it expected a field that ordinary, non-strict mode never
emits. We kept that receipt, inspected the preserved artifact without calling the
model again, and found only two structural notes: the chunks had been stitched,
and the B5 analyzer label had been enforced. There was no timestamp repair,
reversal, or out-of-window warning. We recorded the correction as an amendment
instead of rerunning for a prettier receipt.

Gemini 3.7 is now BitterClip’s default visual-analysis model. Gemini 3.6 is the
live fallback. If wider use exposes a problem, rollback is another pin-only
change: restore Gemini 3.6 as primary and Gemini 3.5 Flash-Lite as fallback.

| What we can say | What we cannot say |
| --- | --- |
| 3.7 was 61.1% faster at the median on the fixed discovery workload. | 3.7 is always faster on arbitrary video. |
| 3.7 was 24.6% cheaper by estimate on that same workload and tariff. | 3.7 has a lower price or our estimate equals the bill. |
| Both models produced temporal-contract failures somewhere in the workshop. | The final run proves one model is more reliable. |
| The point contract removed per-row start/end reversal by construction and passed 48/48 discovery calls. | Point timestamps universally solve temporal grounding. |
| The final confirmation stopped with 13 of 63 candidate chunk responses complete. | 3.7 passed semantic noninferiority or multi-camera understanding. |
| One strict canary and one promoting visual-path acceptance completed on 3.7 without fallback. | The acceptance covered copy authoring, session-wide fanout, or every ordinary post-processing step. |
| BitterClip made a bounded, reversible production change. | The benchmark proved 3.7 semantically superior. |

## What changed beyond the model

The production model changed. More importantly, our design did.

The workshop established a better boundary between model judgment and host
responsibility:

- Ask the model for the moment where visual evidence exists, not a precise
  duration it may not be able to observe.
- Validate raw numbers, bounds, and order before any cleanup or repair.
- Keep pixel evidence, transcript context, synchronization, and synthesis as
  distinct provenance.
- Derive navigation ranges in BitterClip and label them as navigation—not action
  duration.
- Preserve point evidence through normalization, stitching, annotations, claims,
  and search.
- Fail closed when exact model identity, completion, cleanup, or customer
  projection cannot be proved.

The failure collector is now hardened for version-2 diagnostics. The point path
itself remains prospective: it is not the production default, and none of that
work rewrites the stopped result.

That distinction matters. Good instrumentation is not a retroactive pass. A
better contract is not proof that a new model is better. And a fast model is not
ready for production until the whole system can explain what happened when it
fails.

## The honest answer

We upgraded BitterClip’s visual-analysis default to Gemini 3.7.

Not because the benchmark proved it was the smarter model. It did not. We
shipped because the matched tests showed a large operational advantage, the
failures were not unique to 3.7, the deployed B5 visual path passed a deliberately
small canary and acceptance, and the rollback remained simple.

That is less dramatic than declaring a benchmark winner. It is also how I want
us to make product decisions: say exactly what the evidence supports, make the
smallest useful move, and keep a clean way back.

---

### Methods and limits

The discovery result above comes from 96 matched call pairs—192 calls total—over
four response contracts and two fixed silent chunks. It is a call-level
structural and operational comparison, not a broad video benchmark. The selected
point contract passed raw temporal validation 48/48 times across both models in
that discovery set. Full-schema arms did not contain comparable context-evidence
fields, so those safeguards were not scored there.

The separate multi-camera repeatability result covered 94 evaluated units and
282 paired observations. Its 0.32 median lexical claim overlap missed the locked
0.85 target, two of seven mismatch-control decisions flipped across repeats, and
the blinded semantic comparison was incomplete. Lexical overlap measures wording
stability, not factual correctness.

The final confirmation was prospectively locked at 106 jobs and 164 planned
chunk responses. It stopped at 24 jobs and 39 registered responses. Gemini 3.7
contributed 13 of its required 63 responses; the semantic comparison never ran.
Treating those repeated fixed-corpus calls as independent and exchangeable would
put the one-sided 95% upper failure bound for 0/13 at about 20.6%, but that
assumption is debatable and the incomplete denominator is the more important
fact.

The later release decision was separate. One strict nonpromoting canary made two
Gemini 3.7 chunk calls. The promoting default-config visual-path acceptance made
one more. It intentionally did not test queue dispatch, copy-authoring inference,
session-wide visual fanout, whole-session synthesis, or full ordinary
post-processing. Those three calls support the narrow deployed visual-path claim
in this article, not semantic superiority or a population-wide reliability rate.

Across the full workshop, cumulative estimated or conservatively reserved
provider exposure was $32.27 under a $50 authorization. Actual billed cost is
unknown. Raw media, transcript text, model bodies, internal identifiers, and the
private truth set are not published.

Model capabilities, stability, and limits were checked against Google’s
[`gemini-3.7-flash` model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash),
the [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog), and
the [Models API](https://ai.google.dev/api/models). Structured JSON guarantees
syntax and schema shape; BitterClip still has to validate semantic relations such
as time order. ([Structured output](https://ai.google.dev/gemini-api/docs/structured-output))
