---
name: review-and-export
description: Review an exact BitterClip Episode or Clip and deliver its current private Export. Use for playback, final checks, download, render recovery, or feedback on an existing result.
---

# Review and export

Bind review and delivery to one exact target revision and Export. Do not substitute the newest item, a similarly named Clip, or an older render.

Find the exact target with a bounded list or parent `episode_read`, then read it fresh. Use `render_status` before changing an existing result so currentness, revision, render plan, and any prior exact Export are explicit.

When the person asked for a finished or exported result and no current Render exists, call `render_create` only from exact creator/edit custody or from `render_status.next_action.arguments`. Copy returned arguments exactly; do not guess a target revision, render-plan hash, or other binding from a generic read. Poll the same render using the returned delay or bounded wait until ready, failed, or another terminal state. A slow job is not permission to start a duplicate.

Review what can actually be inspected. Use `export_sample_frames` with the returned exact Export identity and generation for rendered pixels. Inspect every flagged dialogue seam and use available playback to listen when audio acceptance matters. Deterministic checks and frame samples do not prove editorial taste or listening; say what remains unverified if the host cannot play or expose the media.

For requested feedback, inspect the prior exact Export on both sides of the material being changed using available playback and rendered-frame evidence. Then edit the same Clip with `episode_edit`, using fresh revision and signed source-audio evidence for every new spoken boundary. A frame never substitutes for spoken-word evidence. Give a concise account of the meaningful change while the editable result is current. Keep the prior exact Export as an earlier retained version. Then render and verify the new current revision once when the request still carries finished-result intent; respect any new draft-only or review-first instruction. Compare the new exact Export with the retained prior one around every changed seam, camera choice, treatment, or framing region, and state honestly when audio, motion, or another media property could not be inspected.

On ready, report the exact current private Download and editor Open actions through the host. Never quote, paste, or retain `playback_url` or `download_url`, and never present embedded playback plumbing as delivery proof. Use `workspace_open` once per intended handoff and stop tool work after it; a later feedback turn may refresh the same target. Distinguish `already_open`, `link_ready`, and `prepared` from visible navigation.

Publishing is a separate externally consequential workflow. `publish_send` may prepare BitterClip's inert review handoff; it does not publish from chat. Actual external dispatch still requires the exact reviewed Export, named destination, and fresh server-bound confirmation in BitterClip. If required state is missing, return its bounded next step and never claim publication.
