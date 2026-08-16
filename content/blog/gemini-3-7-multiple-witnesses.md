---
title: "Visual analysis in BitterClip just got a lot faster"
description: "Gemini 3.7 cut median model response time by 61% in our video tests, with no strong semantic difference from 3.6. So we upgraded and kept 3.6 as the fallback."
date: '2026-08-14'
updated: '2026-08-16'
author: Michael Ruescher, Founder
ogImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-og.png
heroImage: /images/blog/gemini-3-7-benchmark/gemini-3-7-benchmark-chart.svg
heroAlt: BitterClip visual analysis comparison showing median model response time falling from 27.8 seconds with Gemini 3.6 to 10.8 seconds with Gemini 3.7.
tags:
  - Gemini
  - visual understanding
  - benchmarks
  - engineering
---

Visual analysis in BitterClip just got a lot faster.

We upgraded our main visual model from Gemini 3.6 to Gemini 3.7. In matched
testing, median model response time fell from 27.8 seconds to 10.8 seconds. That
is a 61.1% lower response time. Estimated cost was 24.6% lower too.

We did not find a strong semantic difference between the two models in the
footage we reviewed. Both generally understood the scene. So we put the faster
one in front and kept Gemini 3.6 as the fallback.

The route there was less direct. Our first Gemini 3.7 production test went
backward in time.

The model said a visual event began at 146 seconds and ended at 20.8 seconds. If
you were looking for a reason not to upgrade, there it was.

Then Gemini 3.6 did the same kind of thing.

That was the useful moment. We had blamed the new model before looking closely
at the question we were asking it.

## We were asking for too much

BitterClip uses Gemini to understand what is happening in a video and when it
happens. Our old response format asked for a precise start and end for every
visual observation:

```text
start_seconds: 146.0
end_seconds:    20.8
```

The numbers were individually valid. Together, they were impossible.

![A sanitized model response shows an impossible interval running from 146 seconds back to 20.8 seconds.](/images/blog/gemini-3-7-benchmark/timestamp-reversal.svg)

The deeper problem was that video often does not contain a clean ending. A
camera can show someone beginning a movement, then turn away while the movement
continues. Asking the model for an exact duration invites it to guess.

So we tried a smaller question: where can you actually see the thing?

```text
at_seconds: 146.0
```

That point is still a model claim, and BitterClip still has to check it against
the source. But it is a much cleaner unit of evidence. BitterClip can build a
short playback range around it for navigation without pretending the action
lasted for that whole range.

![A model-guessed duration is replaced by one model-authored evidence point and a separate playback range.](/images/blog/gemini-3-7-benchmark/evidence-point-contract.svg)

## What the testing showed

We ran 192 matched calls across the same two video chunks and four response
formats. We did not find a strong semantic difference between Gemini 3.6 and
3.7 in the material we reviewed. Both could understand the scene, and both
could produce bad timing under the old interval format.

The operational difference was clear:

| Fixed test workload | Gemini 3.6 | Gemini 3.7 |
| --- | ---: | ---: |
| Raw temporal checks passed | 94 / 96 | 92 / 96 |
| Median provider latency | 27.8 s | **10.8 s** |
| Estimated provider cost | $2.75 | **$2.08** |

Google charged both models at the same rate; 3.7 simply used fewer tokens in
this test. The point format also passed all 48 of its raw timing checks.

A larger follow-up stopped early because of a bug in our audit code, so we did
not use it to declare a benchmark winner. It did not change the practical read:
3.7 was much faster, a little cheaper, and not meaningfully different in the
footage we reviewed.

## We upgraded

We ran a strict two-chunk production canary, changed one model pin, and ran one
more live visual-path check. All three calls used Gemini 3.7 without falling
back or retrying.

Gemini 3.7 is now the primary model for BitterClip’s visual analysis. Gemini 3.6
remains the fallback. If wider use exposes a problem, we can put 3.6 back in
front with the same small pin change.

The point-format work remains separate from the model upgrade. The useful result
for people using BitterClip today is simpler: visual analysis now spends much
less time waiting on the model. We upgraded, kept a clean way back, and moved
on.

---

The comparison used 96 calls per model on two fixed silent video chunks. The
cost figures are rate-card estimates, not a reconciled provider bill. This was a
focused product test, not a general benchmark of video understanding.
