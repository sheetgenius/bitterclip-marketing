# DRY content architecture (the maintainability frontier)

The APIs will keep evolving. The cost of a change must be **O(1), not O(pages)** — a
contributor updates one place and nothing drifts. Rules:

## Single-source every reused fact
Reusable blocks live as partials/snippets and are *referenced*, never copy-pasted:
- the MCP tool list, the "what is an episode" definition, connection prerequisites, the
  YouTube Brand-Account warning, the signup CTA, the pricing-link blurb.
- **Mechanism:** `@nuxt/content` MDC components / partials (the planner verifies the exact v3
  mechanism — e.g. a `content/_partials/` dir surfaced via a `<ContentSlot>`/component, or
  `queryCollection` includes).
- **Volatile data** (tool names, OAuth scopes, plan/pricing) lives in `content/_data/*.yml`
  — or, longer-term, is **generated from the app's connector/operation manifest**. Pages
  render from the data; updating the data updates every page and every generated surface.

## Conventions
- **Frontmatter schema** (every page): `title`, `description`, `navigation` (label + order),
  `section`, `updated` (ISO date), `tags`.
- **File tree** = sections as folders (`getting-started/`, `assistants/`, `connect/`,
  `changelog/`). Quickstart sits at the top of `getting-started/`.
- **Callouts:** one convention — `> [!TIP]`, `> [!WARNING]`, `> [!NOTE]` — rendered by a
  shared component.
- **Generated surfaces** (per the spec review): `.md` twins, `llms.txt`, `llms-full.txt`,
  `sitemap.xml`, and the changelog RSS are produced at build time (Nitro prerender hook),
  NEVER hand-maintained.

## "When the API changes" playbook
1. Update the single-sourced data file / snippet (one place).
2. Pages and the generated `.md`/`llms` surfaces rebuild automatically.
3. Run the Accuracy-frontier review (or a Codex pass) to confirm no page hard-codes the
   changed fact.

Goal: a contributor edits one `.yml`/snippet, ships, and nothing anywhere goes stale.
