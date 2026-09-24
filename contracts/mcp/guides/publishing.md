---
title: Publishing with MCP
tools: [publish_prepare, publish_update, publish_send, publish_status]
---

# Publishing with MCP

Publishing uses an explicit preparation and review flow. `publish_prepare` builds the proposed package for a supported destination. `publish_update` can revise the package. Review the returned state and approval requirements before `publish_send`; then use `publish_status` to inspect what happened. A prepared package, a send attempt, and provider confirmation are separate states.

External publication needs the relevant user approval. Tool access alone does not grant permission to publish. Use the exact Export and publication handles returned by the tools, and report a pending or failed provider state as pending or failed.
