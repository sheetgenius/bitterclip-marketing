---
title: Edit and export with MCP
tools: [episode_read, episode_zoom, episode_edit, render_create, render_status]
---

# Edit and export with MCP

Read an Episode before editing. The returned revision, occurrence IDs, and Program ranges identify what is currently editable. Inspect a narrow region with `episode_zoom` when a boundary needs evidence. `episode_edit` applies one supported change against the expected revision and returns a receipt. Re-read after a conflict or when the target changes.

Rendering is a separate step. `render_create` starts an attempt for the exact target and revision; `render_status` reports whether it is ready. A ready render can be reviewed or exported. The edit, the render attempt, and an exact Export are different facts, so keep their returned IDs distinct.
