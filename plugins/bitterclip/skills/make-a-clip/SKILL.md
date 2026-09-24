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
