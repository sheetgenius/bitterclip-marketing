import { defineContentConfig, defineCollection, z } from '@nuxt/content'

// Frontmatter schema shared by every docs page.
// Mirrors docs/protocol/build-plan.json -> frontmatter_fields.
const docsSchema = z.object({
  // title + description are also surfaced by @nuxt/content's page defaults,
  // but we declare them so they are required and queryable.
  title: z.string(),
  description: z.string(),
  // navigation: { label, order } to drive the sidebar, or false to hide.
  navigation: z
    .union([
      z.object({
        label: z.string(),
        order: z.number(),
      }),
      z.literal(false),
    ])
    .optional(),
  section: z.enum([
    'getting-started',
    'assistants',
    'connect',
    'publishing',
    'help',
    'changelog',
  ]),
  updated: z.string(), // ISO date, e.g. "2026-06-24"
  tags: z.array(z.string()).optional(),
  // Phase 2 (changelog feed): only used by changelog entries.
  date: z.string().optional(),
  summary: z.string().optional(),
  // Optional per-page social card; falls back to site.yml og_image_default.
  ogImage: z.string().optional(),
})

export default defineContentConfig({
  collections: {
    // Prose pages. _data/ is excluded so YAML data files are not parsed as pages.
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        exclude: ['_data/**'],
        // Content lives at content/<section>/<page>.md and is served under /docs/...
        prefix: '/docs',
      },
      schema: docsSchema,
    }),

    // --- Data collections (single-sourced volatile facts) ---

    // Global facts that recur everywhere (URLs, support email, og defaults).
    site: defineCollection({
      type: 'data',
      source: '_data/site.yml',
      schema: z.object({
        signup_url: z.string(),
        pricing_url: z.string(),
        support_email: z.string(),
        mcp_resource_url: z.string(),
        app_origin: z.string(),
        og_image_default: z.string(),
      }),
    }),

    // Curated, creator-facing subset of the MCP tool catalog (NOT the full ~80).
    mcpTools: defineCollection({
      type: 'data',
      source: '_data/mcp-tools.yml',
      schema: z.object({
        tools: z.array(
          z.object({
            name: z.string(),
            // Plain "what you can ask for" phrase rendered to creators (the raw `name` stays internal).
            ask: z.string(),
            group: z.string(),
            plain_purpose: z.string(),
            primary: z.boolean().default(false),
            creator_facing: z.boolean().default(true),
          }),
        ),
      }),
    }),

    // Per-connector permissions in plain English. Raw scope is internal-only.
    connectorScopes: defineCollection({
      type: 'data',
      source: '_data/connector-scopes.yml',
      schema: z.object({
        scopes: z.array(
          z.object({
            connector: z.string(),
            scope: z.string(), // raw OAuth scope — NEVER rendered to creators
            plain_label: z.string(),
            required: z.boolean().default(true),
            notes: z.string().optional(),
          }),
        ),
      }),
    }),

    // Connector status + capability matrix (drives connect/ cards + IG honesty).
    connectors: defineCollection({
      type: 'data',
      source: '_data/connectors.yml',
      schema: z.object({
        connectors: z.array(
          z.object({
            connector: z.string(),
            status: z.enum(['connectable', 'capped', 'unavailable']),
            auto_publish: z.boolean(),
            manual_handoff: z.boolean().default(false),
            reconnect_note: z.string().optional(),
          }),
        ),
      }),
    }),
  },
})
