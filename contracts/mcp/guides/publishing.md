---
title: Publishing with MCP
tools: [publish_prepare, publish_update, publish_send, publish_status]
---

# Publishing with MCP

Publishing uses an explicit preparation and review flow. `publish_prepare` builds a proposed package for a supported destination, and `publish_update` can revise it. `publish_send` returns a workspace review handoff only: it does not queue work, create a PublishRecord, or send anything externally. The person must review the exact package in BitterClip and give fresh final confirmation there. Use `publish_status` to inspect the package or a PublishRecord after that confirmation. A prepared package, a workspace handoff, an actual send attempt, and provider confirmation are separate states.

External publication needs the relevant user approval. Tool access alone does not grant permission to publish. Use the exact Export and publication handles returned by the tools, and report a pending or failed provider state as pending or failed.
