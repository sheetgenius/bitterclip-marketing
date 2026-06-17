# BitterClip Sign-In And Conversion Study

Date: 2026-06-17
Scope: `bitterclip.com` public landing page, top navigation, first-screen CTA
clarity, and the handoff to `app.bitterclip.com`.

## Trigger

User feedback on 2026-06-17: it was not obvious how to sign in from the public
BitterClip marketing page.

The current first viewport shows a strong product promise and a clear acquisition
CTA, but it does not expose a returning-user path. The header has product links
and a filled `Start free` button. The hero repeats the acquisition path with
`Clip your first recording` plus a `Try the editor` anchor. A visitor who already
has an account has to infer that `Start free` may lead to auth, scroll, or use
the app domain directly.

## Current-State Evidence

- Live `https://bitterclip.com/` header links are `Demo`, `In ChatGPT`, `How it
  works`, `Pricing`, and `Start free`.
- The live homepage has multiple signup CTAs, all pointing to
  `https://app.bitterclip.com/sign_up` with landing-page attribution.
- Live `https://app.bitterclip.com/sign_in` returns the real sign-in page.
- Live `https://app.bitterclip.com/login` returns 404, so `/sign_in` is the
  canonical returning-user target.
- The app auth pages themselves distinguish the paths correctly:
  `/sign_in` has `Need an account? Create one`; `/sign_up` has
  `Already have an account? Sign in`.

## Diagnosis

This is not a "more CTA" problem. It is a path-labeling problem.

The page currently treats all account intent as acquisition intent. That is good
for cold visitors but poor for three valuable segments:

- returning users who want the workspace
- people sent by an existing user or invite who already expect an account
- evaluators who understand the product and want to inspect the app/login path

The page also compresses three different concepts into the first-screen CTA
cluster:

- start a new free account
- try the embedded editor demo
- use BitterClip inside ChatGPT or Claude

The result is a strong hero that explains the product outcome but underspecifies
the account doorway.

## Conversion Principles

1. Keep one dominant acquisition CTA.
   `Start free` should remain the filled peach button. Adding sign-in must not
   create a second primary action.

2. Put returning-user auth where people expect it.
   Sign-in belongs in the persistent header. It should not be hidden behind
   pricing or signup.

3. Separate visitor intent without adding a decision tree.
   The page needs two account paths: `Start free` for new users and `Sign in` for
   returning users. Do not add plan-choice, ChatGPT-choice, or checkout-choice
   friction at the top.

4. Explain the first action in user language.
   "Start free" is a good button, but the nearby copy should answer "what
   happens next?" in one line: create an account, upload a recording, connect in
   ChatGPT or Claude.

5. Preserve the existing demo posture.
   The live editor remains the differentiator. Do not gate the demo in front of
   signup; use the demo events and post-export CTA work already in place.

## Decision

The element of least surprise wins. Ship the conventional top-nav pattern first:
a single `Sign in` button. Keep signup CTAs in the page body where acquisition
intent is already being explained.

Do not add hero account microcopy, a decision tree, or extra explanatory UI in
the first pass. The point is not to persuade returning users; it is to give them
the expected door.

## Recommended First Slice

Ship this as one small conversion-safe change:

1. Add `signInUrl = "https://app.bitterclip.com/sign_in"` to the global app
   shell.
2. Replace the top-bar account controls with a single `Sign in` link.
   - Desktop: visible filled button, using the existing top-bar CTA treatment.
   - Mobile: keep `Sign in` visible even if product nav links collapse or hide.
   - Remove `Start free` from the top bar so there is only one header button.
3. Keep the sign-in URL clean and exact: `https://app.bitterclip.com/sign_in`.
4. Leave the existing signup attribution untouched.

Acceptance criteria:

- A first-viewport desktop screenshot visibly contains one account button:
  `Sign in`.
- A 390px mobile screenshot still exposes `Sign in` without horizontal overflow.
- The sign-in URL is exactly `https://app.bitterclip.com/sign_in`.
- No signup CTA loses the existing `utm_content` / `from=landing_*` attribution.
- The smoke test asserts the header sign-in link.

## Recommended Second Slice

If the first slice is accepted, follow with a small clarity pass:

1. Change the hero support line to make the setup sequence explicit:
   `Start free, upload a recording, then ask in ChatGPT or Claude.`
2. Add a compact three-step row under the hero CTA or just above testimonials:
   `1. Upload recording` -> `2. Ask in ChatGPT/Claude` -> `3. Check and export`.
3. Add the same sequence to `public/index.md`, `public/llms.txt`, and
   `public/llms-full.txt` if the HTML copy changes.

This is worth testing only after the sign-in fix because it changes more of the
hero's comprehension load.

## A/B Test Options

Test A: header-only sign-in

- Single header button: `Sign in`.
- No footer or hero account microcopy.
- This isolates whether the missing navigational affordance caused the issue.

Test B: header sign-in plus hero account microcopy

- Header from Test A.
- Add `Already have an account? Sign in.` under the hero CTA row.
- This should help returning users and reduce anxiety for evaluators without
  weakening acquisition.

Test C: explicit setup sequence

- Test B plus the three-step setup sequence.
- Use only if analytics or user calls show confusion about "inside ChatGPT" vs
  "create/upload in the app."

Primary metrics:

- header sign-in CTR
- signup CTR
- total account-start CTR (`sign_in + sign_up`)
- demo-engaged signup CTR
- mobile first-screen click distribution

Guardrail metrics:

- `Start free` CTR should not drop more than the gain in `Sign in` CTR unless
  downstream activation improves.
- No increase in pricing-link pogo-sticking before account action.
- No measurable LCP regression from header/hero changes.

## Notes From External UX Evidence

- Baymard's account-creation research supports delaying unnecessary account
  decisions and keeping users focused on the primary task; the relevant lesson
  here is to make the account paths explicit without forcing a decision tree:
  https://baymard.com/blog/delayed-account-creation
- NN/g's button-state guidance reinforces that actionable controls need clear
  state and labels; `Start free` and `Sign in` should look like different kinds
  of actions, not two competing primary buttons:
  https://www.nngroup.com/articles/button-states-communicate-interaction/
- Chrome's facade guidance supports the existing lazy/deferred embedded-demo
  strategy: keep heavy interactive embeds off the critical path until needed:
  https://developer.chrome.com/docs/lighthouse/performance/third-party-facades
- The Vodafone/web.dev LCP case study is a useful guardrail: conversion work
  should not add first-load weight, especially on mobile:
  https://web.dev/case-studies/vodafone

## Strong Recommendation

Implement Test A first: header sign-in only. It directly addresses the observed
feedback, follows the convention users already expect, preserves the current
acquisition hierarchy, and is cheap to verify with screenshots and smoke tests.
