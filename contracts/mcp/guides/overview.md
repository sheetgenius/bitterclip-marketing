---
title: BitterClip MCP tools
tools: [help, recordings_list, episodes_list, episode_read]
---

# BitterClip MCP tools

BitterClip exposes one shared set of authorized operations to its embedded Agent and connected MCP hosts. The default model surface contains the tools that help an assistant find, inspect, edit, render, and deliver an Episode or Clip. App-only tools are also registered for connected host applications. A connected user's access and the operation's authorization are checked when each tool is called.

Start with `help` to discover public guides and private operating guidance, or read the exact public tool reference for schemas and examples. Use `recordings_list` for source media and `episodes_list` for editable Episodes and Clips. A Recording supplies evidence; an Episode or Clip is the editable production.

Tool results contain exact handles for later calls. Preserve those handles and the clock named in each result. Source time belongs to a Recording; Episode time belongs to the ordered edit.
