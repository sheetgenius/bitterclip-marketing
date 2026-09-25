---
name: make-a-clip
description: Make or revise a worthwhile source-backed BitterClip Clip or reel. Use when the person asks to cut, shorten, assemble, reframe, or creatively revise recorded material.
---

# Make a Clip

Produce a coherent editable cut from source evidence, preserving the exact target and the person's requested level of finish.

If the person asks to create or refine a programmable FX Studio scene, use `fx-studio` for that source-authoring work. Do not route scene feedback through `episode_edit` or `render_create`. If they also want the scene used in a particular Clip, keep authoring and application as distinct, exact-target tasks; do not assume Project defaults are the way to place it.

First distinguish the request:

- Suggestions only: read the Episode and offer evidence-backed ideas; save Moments with `review_points_place` only when explicitly asked.
- One continuous range: use `clip_create`.
- Several moments combined into one video: use one `episode_create`, not many Clips.
- Feedback on an existing Clip: revise that same Clip with `episode_edit`; do not create a replacement unless the person asked for an alternative.

Use `episodes_list` or `transcript_search` to locate material, then `episode_read` for the chosen target. Transcript text and word times are semantic locators, never cut authority. Inspect every new spoken boundary against actual source audio with a narrow `episode_zoom`. Keep any signed inspection token unchanged and pass it only to an operation whose current schema accepts or requires it; `clip_create` has no token field. Accept only exact speech support reported as `inter_word_silence` or `aligned_word_edge`; preserve more source and require playback when speech evidence is unresolved. Original-projection frames may authorize a visual boundary but never a spoken-word cut. Sample relevant pixels when picture choice or framing matters. Never invent or estimate timestamps.

Match reading depth to the work. For a multi-segment narrative or film, read enough of the whole Episode to understand its throughline before selecting an arc. For a focused thematic cut, inspect the relevant neighborhood plus enough surrounding context to preserve meaning. The person's latest request governs; use the current Project working brief as editorial context without overriding newer intent.

Choose material for a clear idea, understandable opening, useful development, and satisfying end. Keep antecedents, referents, and complete thoughts intelligible outside the source conversation, but do not ban ordinary sentence-start words. Say when material is weak. Do not make the person supply timestamps or orchestrate tools. Keep creative clarification useful and sparse.

Make treatments intentional rather than automatic. Use the request, destination when named, and current working brief to decide whether captions, speaker titles, reframing, camera changes, audio treatment, music, an intro, or an outro help. Verify speaker attribution before adding a title. Inspect actual frames for framing and caption/title collisions, and inspect actual media around camera changes and seams instead of assuming fixed source behavior. Include any intro, outro, or other inserted material when judging total duration.

Picture and title craft:

- Choose the opening and key visual beats from actual source-linked images before measuring all cut boundaries. Before keeping any materially long candidate in a reel intended for strangers, inspect representative source-linked pixels across the candidate's beginning, middle, and end for visual progression/payoff; shorten or omit a span when those samples add no new visual information. A static or screen-share span is not automatically no-payoff; keep an intentional, legible demonstration or reveal when its duration is needed to understand the payoff.
- Set `aspect_ratio` only when the person asked for a shape or named a vertical destination; "reel" names the edit, not the shape.
- For a simultaneous layout on a new Clip, prove complete coverage for every distinct secondary camera before `clip_create`. Create the Clip once, then author its scene; never create a throwaway Clip to test camera coverage, and never create a Clip or Episode as a coverage probe or just to look at a Recording (`recording_sample_frames` reads Recording pixels directly). If truthful coverage begins after the user's requested point, explain any necessary range shift before writing.
- Crop each participant from inspected Recording frames tightly enough to exclude baked-in gallery padding and labels, then inspect the composed canvas before rendering.
- When choosing a camera yourself, compare the base picture and each candidate with `episode_sample_frames` at the same Episode times; skip the comparison only when the person names the camera. For a local correction, change the inspected interval and keep other camera choices unless evidence supports a broader change. Fit bars alone do not justify discarding a useful alternate; judge subject visibility and the requested coverage. `episode_framing_guidance` reports evidence only, so choosing whom to show is your call.
- For a compressed dialogue splice, use a truthful same-exchange listener angle: enter before the audio seam, hold through it, and return after retained speech is established. Never borrow a reaction from unrelated source time. A motivated J- or L-cut may lead or lag a speaker handoff. Add `resync_blend_seconds` only when frames show a pose jump at a hard resynchronization, and use continuous Original only when dense frame inspection shows the lip-sync offset is less distracting than the synchronized jump.
- Place speaker titles only where identification earns the interruption, typically once in a cold open and once near a speaker's first sustained appearance, not on every camera cut. Choose a slot clear of the caption lane and faces, use an upper slot only when it is the calmer negative space, and inspect the returned positioning image before nudging.
- Use Produced transitions selectively between cold-open excerpts, not mechanically on body edits or multicamera switches.
- For one changed Trim edge, use at most one narrow discovery read and one `detail:"edit"` zoom at the chosen point, then pass its evidence to `episode_edit` without zooming again; for a "next boundary" Trim, measure the next candidate rather than the unchanged edge. Inspect adjacent timed words, reconcile each source side with `speech.points`, keep every chosen point out of spoken-word interiors, and then listen to the rendered seam. Require source-linked context plus exact rendered seam evidence for quality; when rendered speech and seam evidence are materially unchanged, preserve the cut rather than polishing timing metadata.

Pass current revisions and returned evidence unchanged. Follow each tool's supported idempotency and revision contract; where a caller `idempotency_key` is accepted, keep it stable and reuse it only for an exact retry. `render_create` takes no caller key. If the head is stale, re-read and reconsider before writing. After a successful mutation, adopt its returned revision; do not repeat the write while waiting.

Treat post-mutation edge or transcript-overlap warnings as required recovery,
not as a failed create or a clean result. Keep the exact created target and
revision; do not replay `clip_create`, render, or claim clean edges yet. A
warning may name a source or segment second, not a child-local second. Use each
supplied child-local `episode_seconds` directly. When absent, read the created
target with `episode_read` and map the flagged source/segment edge to its exact
child-local time. Then use `episode_zoom` on the child at each point. Never
reuse a parent/source coordinate as child-local time. Pre-create
source receipts do not discharge this target-bound check.
`clip_create` has no caller boundary-token field and persists its warnings
separately; the server does not automatically block a Render while they remain.
If the target-bound inspection supports the edge as `inter_word_silence` or
`aligned_word_edge`, preserve it. Otherwise preserve more independently
supported source and repair the same target with `episode_edit`, passing its
required signed evidence unchanged and adopting the returned revision. If a
safe repair remains unresolved, offer review and stop. This recovery is a
render prerequisite, not a new approval ritual or a blanket ban on ordinary
sentence starts.

After creating or revising the editable target, give a concise account of the selected material and meaningful changes before rendering. The work should be legible while it evolves, not only after the Export finishes.

Respect finish intent:

- For draft-only, review-first, suggestions-only, or explicit no-render requests, stop before `render_create` and offer the exact editor handoff if useful.
- Ordinary make, cut, create, export, or finished-video language authorizes one private Render of the exact created revision without an extra approval ritual. Use `render_create` once from the creator's exact returned custody, or copy `render_status.next_action.arguments` exactly when it supplies the current render call. Then follow `render_status` until terminal.
- Publishing is separate and is never implied by private-render intent.

For feedback on a previously ready result, first use `render_status` to bind the prior exact Export. Apply the edit to the same Clip, retain that earlier Export identity, and render the final new revision once unless the person changed the request to draft-only or review-first.

Use `workspace_open` once per intended exact-target handoff and stop tool work after that handoff. A draft-only or review-first request can open the editable Clip before any Render; a later feedback turn may refresh the same target after its revision. Report only what BitterClip proves. Never expose raw handles, `playback_url`, or `download_url`; present BitterClip's private Download and editor Open actions through the host.
