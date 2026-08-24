---
title: 'Pi vs. DeepSeek Harness: why we chose Pi'
description: 'A concrete look at why BitterClip uses the Pi agent harness for its embedded AI agent, how it works, and when DeepSeek Harness would fit better.'
date: '2026-08-18'
author: Michael Ruescher, Founder
ogImage: /images/blog/pi-vs-deepseek-harness/pi-vs-deepseek-harness-og.png
heroImage: /images/blog/pi-vs-deepseek-harness/pi-vs-deepseek-harness.svg
heroAlt: BitterClip's embedded-agent architecture, with the editor speaking ACP to Pi and Pi limited to BitterClip MCP tools, beside DeepSeek Harness as a larger plugin platform.
ctaTitle: Put the agent to work on a real recording
ctaLine: 'The Creator trial lasts seven days and requires a card: $0 today, then $24/month unless you cancel before it ends. It includes $5 of agent work for one recording up to two hours. Upload a recording and ask for a moment, a Clip, or a Render—then inspect exactly what changed before you export.'
tags:
  - Pi
  - DeepSeek Harness
  - agent harnesses
  - MCP
  - engineering
---

An early version of BitterClip's in-product agent got confused about a missing
tool, searched through the server filesystem, and then told us BitterClip could
not add background music.

BitterClip could add background music. The agent just couldn't see the right way
to do it.

That was the moment our harness decision became much simpler. Inside a video
editor, we did not want a coding agent with a side job. We wanted an agent that
could do exactly what BitterClip could do, through the same operations every
other client uses, and nothing else.

We chose the [Pi agent harness](https://pi.dev/) for that job.
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) arrived
after that decision, so this is not a story about rejecting it in a bake-off.
It is an impressive foundation and, for some products, the better choice. For
BitterClip, we would still choose Pi.

## What is an agent harness?

The model is the intelligence. The harness is everything that lets that
intelligence get work done: the conversation loop, tools, streaming, retries,
memory, compaction, and the connection to a user interface.

That makes the title easy to misread. This isn't Pi versus a DeepSeek model.
Both harnesses can call models from multiple providers. Can Pi run a DeepSeek
model? [Yes—DeepSeek publishes an official Pi integration guide](https://api-docs.deepseek.com/quick_start/agent_integrations/pi_mono/).
That is a separate decision from using DeepSeek Harness. In fact, one DeepSeek
Harness adapter uses Pi's lower-level
[`pi-ai`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/llm/llm-pi-ai/README.md)
package.

Models and harnesses are separate choices. We can change the model without
rebuilding the product around it.

## What BitterClip actually needed

[BitterClip](/docs/getting-started/what-is-bitterclip) is a transcript-first
media workshop. You can ask the agent to find a moment, trim a section, create a
Clip, start a Render, or undo an edit without leaving the editor.

Most of that machinery already existed before the embedded agent. Rails owns
the recordings, transcripts, edit operations, permissions, revisions, renders,
and account boundaries. [ChatGPT and Claude already reach those operations
through BitterClip's MCP server](/docs/assistants/overview).

The new agent didn't need another workflow engine. It needed to become one
more careful client of the product we already had.

That gave us four requirements:

1. The model should see only BitterClip's MCP tools: no shell, filesystem,
   browser, skills, or subagents.
2. The editor should receive live text, progress, tool activity, cancellation,
   and usage events while the agent works.
3. Conversations should survive a reload, and the stored copy should stay with
   BitterClip.
4. The harness should remain replaceable without rewriting the editor or the
   product's operations.

Our internal shorthand is: **BitterClip remembers the video. The harness
remembers the conversation. MCP is the only way between them.**

## How we embedded Pi in BitterClip

Two protocols keep those jobs separate.
[ACP](https://agentclientprotocol.com/get-started/introduction) carries the
conversation between the editor and the agent.
[MCP](https://modelcontextprotocol.io/docs/getting-started/intro) gives the model
a typed set of things BitterClip can do. In production, the path looks like
this:

```text
BitterClip editor
      │  ACP: prompts, progress, tool activity, cancellation
      ▼
Rails bridge
      │  ACP
      ▼
Pi session
      │  MCP: BitterClip tools only
      ▼
Rails operations, authorization, recordings, and edits
```

Pi owns the middle. Its
[SDK](https://github.com/earendil-works/pi/blob/v0.84.1/packages/coding-agent/docs/sdk.md)
gives us the agent loop, streaming events, provider adapters, retries,
compaction, and tree-structured sessions. We wrote the two adapters around it:
an ACP server facing the editor and an MCP client facing BitterClip.

We use ACP's session and activity vocabulary, plus small BitterClip-specific
updates for save receipts and diagnostics. A replacement harness could keep the
editor and product operations, but its adapter would still need to implement
that contract.

The important part is how we create the session. This is a simplified version
of our Pi 0.84.1 setup:

```ts
const tools = await loadBitterClipMcpTools()
const names = tools.map((tool) => tool.name)

const { session } = await createAgentSession({
  tools: names,
  customTools: tools,
  excludeTools: ["read", "bash", "edit", "write", "grep", "find", "ls"],
  resourceLoader: lockedDownResourceLoader,
  sessionManager,
})
```

The allowlist comes straight from BitterClip's MCP server. If a tool isn't on
that list, Pi never registers it. We also turn off extension, skill,
prompt-template, theme, and context-file discovery, then replace Pi's coding
prompt with BitterClip's own prompt.

At startup, we inspect Pi's live tool registry and refuse to serve unless it
contains every expected BitterClip tool and zero built-ins.

That may sound fussy. It is cheaper than discovering later that an inactive
shell could be switched back on.

## Pi vs. DeepSeek Harness at a glance

The two projects overlap, but they start from different centers of gravity.

| Question | Pi in BitterClip | DeepSeek Harness v0.1.0-rc.7 |
| --- | --- | --- |
| What do you start with? | A small TypeScript agent runtime with an SDK | A plugin-based agent platform with web and headless profiles |
| How do you customize it? | Construct a session in code with a prompt, model, tools, resources, and storage | Assemble or replace Cordis plugins |
| What does it provide? | Loop, streaming, retries, providers, compaction, and session history | Those foundations plus a UI, jobs, goals, workflows, subagents, policy, and more |
| Which tools reach the model? | The exact custom-tool allowlist we construct and check | The tools registered by the chosen plugin profile; the shipped base is broad but can be recomposed |
| How does its current ACP path fit our editor? | We own the adapter, including live deltas, tool traces, history loading, and BitterClip receipts | The upstream adapter creates fresh sessions and sends committed answers; live progress, tool activity, resume, fork, and delete are not exposed over ACP |
| What evidence do we have today? | Pi 0.84.1 is pinned and serving in BitterClip; upgrades still need tool-surface, migration, and resume tests | v0.1.0-rc.7 is a [developer preview](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/README.md#developer-preview) whose maintainers warn of breaking changes |

DeepSeek Harness is aiming at a larger problem. That is precisely what makes it
interesting.

## What we like about DeepSeek Harness

DeepSeek Harness is built around one powerful idea:
[everything is a plugin](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/docs/architecture.md).
Models, tools, sessions, policies, jobs, and the UI all plug into Cordis. Its
append-only session log makes runs easier to replay and inspect, and you can
replace one capability without forking the core.

If we were building a general agent workbench, that would be hard to ignore. The
web UI, job panel, goals, workflows, sandbox policies, and subagent providers
would save real work.

It isn't limited to the bundled web UI. DeepSeek Harness also has public agent
APIs and [an out-of-process TypeScript SDK](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/sdk/README.md)
for custom integrations. For agents that genuinely need shell and filesystem
access, its approval, policy, and sandbox seams provide controls Pi doesn't
supply by itself.

BitterClip already has a backend, an editor, jobs, permissions, and one
established set of editing operations. Putting another full platform in the
middle would force us to answer the same question over and over: does this state
belong to Rails or to the harness?

DeepSeek Harness can be pared down. That is one of its strengths. For
BitterClip, though, we would need to build a custom profile, keep conversation
data on our side of the boundary, extend ACP, and adapt its MCP tool names and
presentation to our existing editor. Most of that work would be spent making
the platform deliberately smaller.

The current upstream
[ACP adapter](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/acp/acp/README.md)
is the clearest example. The harness has live internal events—its own web UI uses
them—but the upstream ACP adapter is built for clean automation: create a fresh
session, submit a prompt, wait for a committed answer, cancel if needed. Our
interactive editor lets people watch tools run, reopen old conversations,
inspect what changed, and undo edits. We would have to extend the adapter before
the harness could replace what is serving today.

All of that is possible. It just wouldn't improve BitterClip enough to justify
the work today.

## Pi is not a security boundary

There is an important caveat. Pi's normal coding-agent experience includes
file and shell tools, and Pi
[doesn't provide a built-in permission system](https://github.com/earendil-works/pi/blob/v0.84.1/README.md#permissions--containerization).
By default it runs with the permissions of its process.

Our safety doesn't come from the word “minimal.” It comes from the system we
built around the runtime:

- the unwanted tools are absent from the live registry, not hidden by the UI;
- the agent runs as a non-root user in a separate container, with bounded,
  private, non-executable temporary storage and no persistent volume;
- every product action goes back through Rails authorization;
- the model never chooses which account it is acting for; and
- agent edits carry a revision and receipt, so people can see exactly what
  changed and undo it.

The container is useful hardening, not a complete sandbox around Bun. This is
also why we don't call our setup “Pi out of the box.” We use Pi as a library
and take responsibility for the boundary.

## The tradeoffs we accepted

Pi is small, but the integration work is still ours. We own the ACP adapter, the
MCP-to-Pi tool bridge, conversation storage, and the tests around them.

There is another catch: Pi owns the format for conversation history. Rails
stores those session bytes without parsing the conversation itself. That keeps
us from quietly rebuilding Pi in Ruby, but upgrades need careful migration and
resume testing.

Finally, a narrow system can fail quietly. An empty allowlist leaves you with an
agent that chats perfectly and cannot do a thing. So startup checks both
failures: zero Pi built-ins and every expected BitterClip tool. That turns the
background-music failure from our opening into a boot error instead of a bad
answer in front of a user.

Those are real costs. They are still smaller than owning two product backends.

## When we would choose DeepSeek Harness instead

We would put DeepSeek Harness near the top of the list if the harness itself
were the product:

- a coding or research workbench with several frontends;
- a system where users assemble agents from plugins;
- a multi-agent environment with jobs, goals, workflows, and shared policy;
- a platform that needs a rich, replayable event model as its primary state; or
- a new product without an existing backend that already owns tools,
  authorization, and durable work.

In that situation, DeepSeek Harness's larger surface is not overhead. It is the
thing you would otherwise have to build.

## The five questions we would ask again

If you are choosing an agent harness for an application, start with the product
boundary rather than a feature matrix:

1. What must the model never be able to do?
2. Which system stores the real customer data and enforces permissions?
3. Do you need an agent platform, or only an agent loop inside an existing
   product?
4. At runtime, can you prove exactly which tools the model can use?
5. Can you replace the harness without replacing your product?

For BitterClip, those answers pointed to Pi. It isn't a universal winner. It
let us keep the agent narrow without rebuilding the parts of BitterClip that
already worked.

If we had to make the choice again, we would start with the same question: where
should the harness stop and the product begin?

---

*Version note: this field report describes BitterClip's pinned Pi 0.84.1
integration and DeepSeek Harness v0.1.0-rc.7, reviewed on August 18, 2026.
DeepSeek Harness is in developer preview and changing quickly. We will revisit
the comparison as its embedded interfaces mature.*
