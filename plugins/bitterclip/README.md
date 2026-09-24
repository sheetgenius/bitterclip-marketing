# BitterClip for agents

Turn a recording into a finished clip by describing what you want.

This package gives a compatible agent four BitterClip skills and a connection
to the hosted OAuth MCP service. The agent can find relevant source material,
make a purposeful first cut, revise that same Clip from ordinary creative
feedback, and return the exact playable and downloadable Export.

Try:

> Make a concise portrait clip about why customer interviews changed our
> roadmap. Keep the opening direct.

Then continue naturally:

> The opening still takes too long. Start with the strongest claim and keep the
> customer's explanation intact.

You provide the intent. The agent handles source inspection, supported timing,
editing, rendering, and recovery. It should not ask you to supply timestamps or
sequence its tools.

## Included skills

- [`get-started`](skills/get-started/SKILL.md) finds a ready Episode or helps
  continue a first upload.
- [`make-a-clip`](skills/make-a-clip/SKILL.md) creates or revises a source-backed Clip.
- [`review-and-export`](skills/review-and-export/SKILL.md) delivers the exact
  current private Export.
- [`fx-studio`](skills/fx-studio/SKILL.md) authors or refines a standalone
  programmable FX Studio scene before any separately supported production use.

The package preserves the original Recording, source timing, permissions, Clip
identity, and earlier Exports. Draft-only requests stay drafts. Publishing is a
separate action that still requires the exact reviewed Export, named
destination, and fresh confirmation in BitterClip.

## Connect

The host should prompt you to sign in to BitterClip over OAuth. Never paste an
API key or access token into a chat, manifest, or configuration file.

If the connection expires or becomes unavailable, reconnect BitterClip in your
host and continue with the same Clip. Do not create a replacement just to work
around authentication.

For Claude web, a connector-only fallback is available here:

<https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=BitterClip&connectorUrl=https%3A%2F%2Fapp.bitterclip.com%2Fmcp>

That fallback connects the service but does not install these four skills.

## Package boundary

This package contains skills and MCP configuration. It does not include the
hosted BitterClip application, customer media, credentials, a local server, or
a free hosted-service entitlement.

BitterClip is a product of SheetGenius, Inc.:

- Product: <https://bitterclip.com/>
- Documentation: <https://bitterclip.com/docs>
- Assistant guide: <https://bitterclip.com/docs/assistants/overview/>
- Agent-readable docs: <https://bitterclip.com/llms.txt>
- Support: <https://company.sheetgenius.com/bitterclip/support/>
- Privacy: <https://bitterclip.com/privacy>

The package is provided under the [MIT License](LICENSE) included beside this file.
