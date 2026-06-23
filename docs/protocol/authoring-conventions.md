# Authoring conventions — the BitterClip docs substrate

This is the contract for everyone who writes docs pages after the skeleton lands. The
substrate is `@nuxt/content` **v3** (Nuxt 4). Follow these rules and nothing drifts: edit
one snippet or one `.yml` row and every page updates (O(1), not O(pages)).

> Phase status: the skeleton is **build-green** with STUB content. Snippet components and
> `_data/*.yml` rows contain clearly-marked `TODO` placeholders. Replace the placeholders;
> do not change the mechanism.

---

## Where every kind of file lives

| Thing | Path | Notes |
|---|---|---|
| A docs page | `content/<section>/<page>.md` | Served at `/docs/<section>/<page>`. The hub is `content/index.md` → `/docs`. |
| A reusable snippet (prose/UI) | `app/components/content/<PascalCase>.vue` | Auto-registered MDC component. |
| Volatile data | `content/_data/<name>.yml` | Validated by a zod schema in `content.config.ts`. Excluded from page routing. |
| Frontmatter / data schema | `content.config.ts` | One `docs` page collection + four `data` collections. |
| The render route | `app/pages/docs/[...slug].vue` | Catch-all; maps the route path 1:1 to the collection path. |

Sections (folders + the `section` frontmatter enum): `getting-started`, `assistants`,
`connect`, `publishing`, `help`, `changelog`.

---

## Frontmatter schema (every page)

```yaml
---
title: Your first clip            # required — page H1 + <title>
description: One-line summary.     # required — meta description + card subtitle
navigation:                       # object { label, order } OR false to hide from nav
  label: Your first clip
  order: 1
section: getting-started          # required enum (see sections above)
updated: '2026-06-24'             # required — ISO date string (quote it)
tags:                             # optional string[]
  - quickstart
# changelog entries only (Phase 2): date, summary
# optional anywhere: ogImage
---
```

The schema is enforced by zod (`content.config.ts` → `docsSchema`). A missing/invalid
field fails the build — that is intentional.

---

## Snippet components — the two invocation forms

Snippets are MDC components in `app/components/content/`. A file named
`WhatIsBitterClip.vue` is invocable two ways from any `.md` body:

**Block form** (the common case — can carry props, slot content, and a YAML block):

```md
::what-is-bitter-clip
::
```

The component name is the **kebab-case** of the filename. `::Callout::` also works in
PascalCase, but kebab-case is the convention here. A block ALWAYS closes with a bare `::`.

**Inline form** (rare; for inline placement, no slot body):

```md
This is great :signup-cta
```

### Passing props

Props go in `{...}` braces right after the name. Strings are bare; booleans/numbers/arrays
use a leading colon to mark them as a JS expression:

```md
::callout{type="warning"}
Body markdown goes here and is rendered into the default slot.
::

::connect-prereqs{:publishing="true"}
::

::connector-scopes{connector="youtube"}
::

::example-clip-prompt{prompt="Find my best moment"}
::
```

- `type="warning"` → string prop.
- `:publishing="true"` → boolean (the leading `:` makes it an expression, not the string `"true"`).
- `connector="youtube"` → string prop (required by `ConnectorScopes`).

### Passing slot content (markdown body)

Anything between the opening `::name` line and the closing `::` is the **default slot** and
is rendered as markdown:

```md
::callout{type="tip"}
You can write **markdown**, links, and lists in here.
::
```

For named slots, use `#slot-name` inside the block (standard MDC) — none of the current
snippets need named slots.

### Passing array/object props (e.g. NextSteps)

Use the YAML frontmatter block **inside** the component, fenced with `---`:

```md
::next-steps
---
links:
  - to: /docs/getting-started/your-first-clip
    label: Your first clip
  - to: /docs/assistants/overview
    label: Use it from your assistant
---
::
```

The keys under `---` become props (here, `links`).

### The 17 snippets and their props

| Component | Block name | Props | Reads data |
|---|---|---|---|
| `WhatIsBitterClip` | `::what-is-bitter-clip` | — | — |
| `WhatIsEpisode` | `::what-is-episode` | — | — |
| `HowTheCutWorks` | `::how-the-cut-works` | — | — |
| `SignupCta` | `::signup-cta` | — | `site` |
| `SupportContact` | `::support-contact` | — | `site` |
| `AssistantConnectionIntro` | `::assistant-connection-intro` | — | `site` |
| `ChatVsWebApp` | `::chat-vs-web-app` | — | `site` |
| `ApprovalPromise` | `::approval-promise` | — | — |
| `ConnectPrereqs` | `::connect-prereqs` | `publishing?: boolean` | — |
| `YouTubeBrandAccountWarning` | `::you-tube-brand-account-warning` | — | — |
| `ReconnectNote` | `::reconnect-note` | `connector?: string` (lowercase key: `youtube`/`x`/`linkedin`/`instagram`) | `connectors` |
| `InstagramCappedNote` | `::instagram-capped-note` | — | `connectors` |
| `ExampleClipPrompt` | `::example-clip-prompt` | `prompt?: string` | — |
| `NextSteps` | `::next-steps` | `links: {to,label}[]` (YAML block) | — |
| `McpTools` | `::mcp-tools` | `group?: string` | `mcpTools` |
| `ConnectorScopes` | `::connector-scopes` | `connector: string` (required) | `connectorScopes` |
| `LiveEditorEmbed` | `::live-editor-embed` | — | `site` |
| `Callout` | `::callout` | `type?: 'tip'\|'warning'\|'note'` + slot body | — |

> There is **no** raw `{% include %}` in v3. A "shared block on N pages" = one MDC
> component, referenced — never copy-paste prose between pages.

---

## Data collections — query + interpolation

Volatile facts (URLs, tool names, scopes, connector status) live in `content/_data/*.yml`
and are validated by zod. Four collections (defined in `content.config.ts`):

| Collection | File | Shape |
|---|---|---|
| `site` | `content/_data/site.yml` | single object (`signup_url`, `support_email`, `mcp_resource_url`, `app_origin`, …) |
| `mcpTools` | `content/_data/mcp-tools.yml` | `{ tools: [...] }` |
| `connectorScopes` | `content/_data/connector-scopes.yml` | `{ scopes: [...] }` |
| `connectors` | `content/_data/connectors.yml` | `{ connectors: [...] }` |

### Reading data inside a component (the canonical pattern)

```ts
// Single-object collection (one .yml file):
const { data: site } = await useAsyncData('site', () =>
  queryCollection('site').first(),
)
// → site.value?.signup_url

// List collection — read the doc, then index into its array:
const { data } = await useAsyncData('mcp-tools', async () => {
  const doc = await queryCollection('mcpTools').first()
  return doc?.tools ?? []
})
```

`queryCollection(<name>)` is auto-imported (no import line). Builder methods:
`.path(p)`, `.where(field, op, value)`, `.order(field, 'ASC'|'DESC')`, `.first()`, `.all()`.

> **Pages do NOT read data directly.** Prose pages stay free of tool names, scopes, URLs,
> and emails — they invoke a data-bearing snippet (`SignupCta`, `McpTools`,
> `ConnectorScopes`, `SupportContact`, `InstagramCappedNote`, `LiveEditorEmbed`) which reads
> the `.yml`. To change a fact, edit the `.yml` row, not the page.

### Rules that protect us

- **Raw OAuth scopes are never rendered.** `connector-scopes.yml` stores the raw `scope`
  string only for cross-checking against the Rails `channel_connection.rb`; the
  `ConnectorScopes` component renders **only** `plain_label`.
- **`mcp-tools.yml` is a curated subset** (the live server has ~80 ops). The `McpTools`
  component prints a "curated subset — not the full catalog" caption; keep it.
- **No prices/plan names** anywhere — link via `SignupCta` (reads `site.yml`).

---

## How to add a new page / snippet / data row

### Add a page

1. Create `content/<section>/<slug>.md`.
2. Add the full frontmatter block (all required fields; quote the ISO `updated` date).
3. Write the body; reuse snippets — don't copy prose. End with `::next-steps`.
4. Link to it from a `NextSteps` block or the hub card grid so the prerender crawler finds
   it (or add it as an explicit prerender route later).

### Add a snippet

1. Create `app/components/content/<PascalCase>.vue` (it auto-registers as MDC).
2. If it needs volatile data, read it with `useAsyncData(...)` + `queryCollection(...)` —
   never hard-code the fact in the component.
3. Document its block name + props in the table above.

### Add a data row

1. Edit the relevant `content/_data/*.yml` file (add a row to the array).
2. Match the zod schema in `content.config.ts` — a shape mismatch fails the build.
3. Every page using the data-bearing snippet updates automatically. No page edits.

### Add a new data field/collection

Edit the matching zod schema in `content.config.ts` first, then the `.yml`, then the
component that renders it.

---

## Build / verify

```bash
bun install                  # also runs `nuxt prepare` via postinstall
bun run generate             # full static build + prerender (the build gate)
# or: bun run dev  then  curl http://localhost:3000/docs
```

`@nuxt/content` v3 requires **`better-sqlite3`** (already a dependency) for its build-time
content DB. A green `bun run generate` prerenders `/docs` and every linked page; check the
emitted HTML under `.output/public/docs/`.
