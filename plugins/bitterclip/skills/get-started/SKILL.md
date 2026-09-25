---
name: get-started
description: Connect to BitterClip, orient the current account, find a ready Episode, or guide a first Recording upload. Use for setup, first use, an empty library, processing recovery, or an unclear starting point.
---

# Get started with BitterClip

Get the person to one useful next state: a selected ready Episode, or a clear upload or processing continuation that preserves their original task.

If the request is for a standalone programmable effect or FX Studio scene, use `fx-studio` instead; a Recording or Episode is not a prerequisite for scene authoring.

Use the connected BitterClip MCP server. Let the host perform OAuth; never request, paste, or retain credentials. Use `account_context_get` only when the account or studio is ambiguous. Use `projects_list`, `recordings_list`, and `episodes_list` to discover current work. If an unfamiliar tool contract matters, call `help` with its exact `bitterclip://docs/tools/<name>` URI or a short question instead of guessing or reading the whole documentation set.

Account context from `account_context_get` is private to the owner: never quote or summarize it to anyone else. The person's explicit request outranks a confirmed Project working brief, which outranks account context; account context is never Project direction. When a Project has no confirmed brief, account context may inform a brief you propose; show it and confirm it through `project_brief_set` only with the owner's agreement. Confirm context or a brief only when the owner states or corrects it, never from inferred conversation history, and carry forward what is still current because each confirmation replaces the whole text. When reviewing faces under delegated authority, set `reviewer_kind:delegated_agent_review` and never claim the owner inspected the images; never infer participant permission or extend it to another Project.

For an existing library, return a small relevant choice rather than an inventory dump. Prefer a searchable, ready Episode that fits the person's latest requested intent and the current Project working brief when available; never assume a personal default Project, source, or destination. Keep every returned handle tool-only. For an informational ask ("do I have X?", "did we discuss X?"), answer with evidence and offer to open related findings. Call `workspace_open` once and last only when the person asked to open, show, edit, or review an exact target; report its `open_status` honestly rather than claiming the host visibly opened something.

For an empty library, create one `upload_link_create` result for the intended Project, or omit the Project for BitterClip's default upload destination. Give the person the host-presented upload action and return to their original goal after upload. Do not create a second link or upload because processing is slow.

After upload, poll `recordings_list` for that exact Recording until it is searchable and has an Episode handle. Follow returned wait or next-action guidance. If processing fails, is denied, or needs user action, report the typed blocker and bounded recovery; do not blindly retry a write.

Stop once the Episode is selected and ready. Continue into clip-making only when the request already includes that outcome.
