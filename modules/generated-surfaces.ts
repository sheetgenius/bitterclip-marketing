import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { glob } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import { parse as parseHtml } from 'parse5'

/**
 * Generated machine-readable surfaces — produced at build time, NEVER hand-maintained.
 *
 * Creator prose comes from `content/`; the tool reference comes from one
 * build-time snapshot of the deployed Rails catalog. From these we emit, into
 * the static output (`.output/public`), after all routes are prerendered:
 *
 *   1. Per-page `.md` twins at `/docs/<path>.md` (verbatim frontmatter + body).
 *   2. `/llms.txt`     — a structured index of the docs.
 *   3. `/llms-full.txt`— the concatenated docs corpus.
 *   4. `/help-corpus.json` — docs-only corpus with source digests for product help.
 *   5. `/sitemap.xml`  — every `/docs/*` page, blog route, blog post, and marketing route.
 *   6. `/changelog.xml`— an RSS feed built from the changelog entries.
 *   7. `/blog/rss.xml` — an RSS feed built from the blog collection.
 *
 * No generated surface is authored by hand.
 */

const SITE_ORIGIN = 'https://bitterclip.com'
const TOOL_REFERENCE_PATH = '/docs/assistants/tool-reference'
const APP_ONLY_TOOLS_PATH = '/docs/assistants/app-only-tools'

interface McpDescriptor {
  name: string
  title: string
  description: string
  inputSchema: unknown
  outputSchema?: unknown
  [key: string]: unknown
}

interface McpGuidance {
  name: string
  errors: string[]
  examples: unknown[]
}

interface CatalogSnapshot {
  schema_version: string
  source: string
  product_release: string
  public_contract_commit: string
  public_contract_digest: string
  retrieved_at: string
  digest: string
  build_id: string
  profiles: Record<'model' | 'app' | 'live_workspace', { descriptors: McpDescriptor[]; guidance: McpGuidance[] }>
}

async function readCatalogSnapshot(): Promise<CatalogSnapshot> {
  const file = fileURLToPath(new URL('../tmp/mcp-catalog-snapshot.json', import.meta.url))
  const snapshot = JSON.parse(await fs.readFile(file, 'utf8')) as CatalogSnapshot
  const digest = createHash('sha256').update(JSON.stringify(snapshot.profiles)).digest('hex')
  const expectedSource = process.env.BITTERCLIP_CATALOG_URL ?? 'https://app.bitterclip.com/api/v1/mcp_descriptors.json'
  const ageMs = Date.now() - Date.parse(snapshot.retrieved_at)
  if (snapshot.schema_version !== 'bitterclip.mcp_surface_snapshot.v1' ||
      snapshot.profiles?.app?.descriptors?.length !== 112 ||
      snapshot.profiles?.model?.descriptors?.length !== 63 ||
      snapshot.profiles?.live_workspace?.descriptors?.length !== 63 ||
      snapshot.digest !== digest || snapshot.source !== expectedSource ||
      !process.env.BITTERCLIP_CATALOG_BUILD_ID || snapshot.build_id !== process.env.BITTERCLIP_CATALOG_BUILD_ID ||
      !/^[0-9a-f]{7,40}$/.test(snapshot.product_release) ||
      !/^[0-9a-f]{40}$/.test(snapshot.public_contract_commit) ||
      !/^[0-9a-f]{64}$/.test(snapshot.public_contract_digest) ||
      (!process.env.BITTERCLIP_CATALOG_URL && /^0+$/.test(snapshot.product_release)) ||
      !Number.isFinite(ageMs) || ageMs < 0 || ageMs > 30 * 60_000) {
    throw new Error('Invalid or modified build-time Rails MCP descriptor snapshot')
  }
  return snapshot
}

function toolDescriptor(snapshot: CatalogSnapshot, profile: keyof CatalogSnapshot['profiles'], name: string): McpDescriptor | undefined {
  const servedName = profile === 'live_workspace' && name === 'workspace_open' ? 'workspace_get_link' : name
  return snapshot.profiles[profile].descriptors.find((item) => item.name === servedName)
}

function toolProvenance(snapshot: CatalogSnapshot): string[] {
  return [
    `Product release: ${snapshot.product_release}`,
    `Public contract commit: ${snapshot.public_contract_commit}`,
    `Public contract SHA-256: ${snapshot.public_contract_digest}`,
    `Descriptor SHA-256: ${snapshot.digest}`,
    `Captured: ${snapshot.retrieved_at}`,
    `Source: ${snapshot.source}`,
  ]
}

function buildToolReferenceMarkdown(snapshot: CatalogSnapshot): string {
  const lines = [
    '# BitterClip MCP tool reference', '',
    `Canonical HTML page: ${SITE_ORIGIN}${TOOL_REFERENCE_PATH}`, '',
    ...toolProvenance(snapshot), '',
    `These 63 tools are exposed to the default model. MCP hosts can also list [49 app-only tools](${SITE_ORIGIN}${APP_ONLY_TOOLS_PATH}) outside this profile. This static reference captures descriptors Rails was serving at build time. Live Workspace adapts the default profile, including workspace_get_link. Host security schemes and resource URIs can vary by connector.`, '',
  ]
  for (const descriptor of snapshot.profiles.model.descriptors) {
    lines.push(`- [${descriptor.name}](${SITE_ORIGIN}/docs/assistants/tools/${descriptor.name}) — ${descriptor.title}`)
  }
  return lines.join('\n').trimEnd() + '\n'
}

function buildAppOnlyToolsMarkdown(snapshot: CatalogSnapshot): string {
  const modelNames = new Set(snapshot.profiles.model.descriptors.map((item) => item.name))
  const lines = [
    '# App-only MCP tools', '',
    `Canonical HTML page: ${SITE_ORIGIN}${APP_ONLY_TOOLS_PATH}`, '',
    ...toolProvenance(snapshot), '',
    `MCP hosts can list these 49 registered tools through the app profile. They are outside the [63-tool default model profile](${SITE_ORIGIN}${TOOL_REFERENCE_PATH}). Each page shows the exact app descriptor captured from serving Rails, with errors and examples.`, '',
  ]
  for (const descriptor of snapshot.profiles.app.descriptors) {
    if (!modelNames.has(descriptor.name)) {
      lines.push(`- [${descriptor.name}](${SITE_ORIGIN}/docs/assistants/tools/${descriptor.name}) — ${descriptor.title}`)
    }
  }
  return lines.join('\n').trimEnd() + '\n'
}

function buildToolPageMarkdown(snapshot: CatalogSnapshot, name: string): string {
  const descriptor = toolDescriptor(snapshot, 'app', name)
  if (!descriptor) throw new Error(`Missing app descriptor for ${name}`)
  const guidance = snapshot.profiles.app.guidance.find((item) => item.name === name)
  if (!guidance) throw new Error(`Missing guidance for ${name}`)
  const model = toolDescriptor(snapshot, 'model', name)
  const live = toolDescriptor(snapshot, 'live_workspace', name)
  const lines = [
    `# ${name}`, '',
    `Canonical HTML page: ${SITE_ORIGIN}/docs/assistants/tools/${name}`, '',
    `Surface: ${model ? 'default model and app' : 'app-only'}`, '',
    ...toolProvenance(snapshot), '',
    descriptor.description, '',
    'The JSON blocks below are the exact MCP descriptor projections served by Rails for the named profiles at capture time. Security schemes and resource URIs may vary by connected host.', '',
  ]
  for (const [label, value] of [['Default model', model], ['App', descriptor], ['Live Workspace', live]] as const) {
    if (!value) continue
    lines.push(`## ${label} descriptor`, '', '```json', JSON.stringify(value, null, 2), '```', '')
  }
  lines.push('## Errors', '', '```json', JSON.stringify(guidance.errors, null, 2), '```', '',
    '## Examples', '', '```json', JSON.stringify(guidance.examples, null, 2), '```', '')
  return lines.join('\n').trimEnd() + '\n'
}

// Marketing routes that live outside the docs collection (Vue pages in app/pages/).
// Kept here as the one place the static, non-docs URLs are enumerated for the sitemap.
const MARKETING_ROUTES = ['/', '/connect', '/founder-onboarding', '/privacy', '/terms', '/data-deletion', '/compare'] as const

interface DocPage {
  /** Source path relative to content/, e.g. "getting-started/your-first-clip.md". */
  sourceRel: string
  /** Public URL path, e.g. "/docs/getting-started/your-first-clip". */
  urlPath: string
  /** Public `.md` twin path, e.g. "/docs/getting-started/your-first-clip.md". */
  mdPath: string
  /** Verbatim file contents (frontmatter + body). */
  raw: string
  /** Markdown body only (frontmatter stripped). */
  body: string
  frontmatter: {
    title?: string
    description?: string
    section?: string
    updated?: string
    date?: string
    summary?: string
    navigation?: { order?: number } | false
    [k: string]: unknown
  }
}

interface BlogPost {
  /** Source path relative to content/, e.g. "blog/example.md". */
  sourceRel: string
  /** Slug without the blog/ prefix or .md extension. */
  slug: string
  /** Public URL path, e.g. "/blog/example". */
  urlPath: string
  /** Public `.md` twin path, e.g. "/blog/example.md". */
  mdPath: string
  /** Verbatim file contents (frontmatter + body). */
  raw: string
  /** Markdown body only (frontmatter stripped). */
  body: string
  frontmatter: {
    title?: string
    description?: string
    date?: string
    updated?: string
    author?: string
    ogImage?: string
    tags?: string[]
    [k: string]: unknown
  }
}

interface ComparePage {
  /** Source path relative to content/, e.g. "compare/descript.md". */
  sourceRel: string
  /** Slug without the compare/ prefix or .md extension. */
  slug: string
  /** Public URL path, e.g. "/compare/descript". */
  urlPath: string
  /** Public `.md` twin path, e.g. "/compare/descript.md". */
  mdPath: string
  /** Markdown body only (frontmatter stripped). */
  body: string
  frontmatter: {
    title?: string
    description?: string
    competitor?: string
    competitorUrl?: string
    reviewed?: string
    competitorStrength?: string
    heroLede?: string
    statusNote?: string
    verdictBitterclip?: string
    verdictCompetitor?: string
    rows?: {
      axis: string
      bitterclip: { lead: string; detail: string }
      competitor: { lead: string; detail: string }
      edge?: string
    }[]
    chooseUs?: string[]
    chooseThem?: string[]
    gotchas?: { title: string; body: string; sourceLabel: string; sourceUrl: string }[]
    faq?: { q: string; a: string }[]
    sources?: { label: string; url: string }[]
    [k: string]: unknown
  }
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/

function splitFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) return { frontmatter: {}, body: raw }
  const frontmatter = (parseYaml(match[1]) ?? {}) as Record<string, unknown>
  const body = raw.slice(match[0].length).trimStart()
  return { frontmatter, body }
}

/**
 * Map a content source path to its public URL path.
 * Mirrors the `prefix: '/docs'` + page-collection routing in content.config.ts:
 *   content/index.md                       -> /docs
 *   content/getting-started/foo.md         -> /docs/getting-started/foo
 *   content/changelog/index.md             -> /docs/changelog
 */
function toUrlPath(sourceRel: string): string {
  let p = sourceRel.replace(/\\/g, '/').replace(/\.md$/, '')
  if (p === 'index') return '/docs'
  if (p.endsWith('/index')) p = p.slice(0, -'/index'.length)
  return `/docs/${p}`
}

async function readDocs(contentDir: string): Promise<DocPage[]> {
  const pages: DocPage[] = []
  for await (const entry of glob('**/*.md', { cwd: contentDir })) {
    const sourceRel = entry.replace(/\\/g, '/')
    if (sourceRel.startsWith('_data/') || sourceRel.startsWith('blog/') || sourceRel.startsWith('compare/')) continue
    const raw = await fs.readFile(join(contentDir, sourceRel), 'utf8')
    const { frontmatter, body } = splitFrontmatter(raw)
    const urlPath = toUrlPath(sourceRel)
    pages.push({
      sourceRel,
      urlPath,
      mdPath: `${urlPath}.md`,
      raw,
      body,
      frontmatter: frontmatter as DocPage['frontmatter'],
    })
  }
  // Stable order: section, then navigation.order, then title.
  const sectionOrder = ['getting-started', 'assistants', 'connect', 'publishing', 'help', 'changelog']
  pages.sort((a, b) => {
    const sa = sectionOrder.indexOf(a.frontmatter.section ?? '')
    const sb = sectionOrder.indexOf(b.frontmatter.section ?? '')
    if (sa !== sb) return sa - sb
    const oa = (a.frontmatter.navigation && a.frontmatter.navigation.order) ?? 99
    const ob = (b.frontmatter.navigation && b.frontmatter.navigation.order) ?? 99
    if (oa !== ob) return oa - ob
    return (a.frontmatter.title ?? '').localeCompare(b.frontmatter.title ?? '')
  })
  return pages
}

async function readBlogPosts(contentDir: string): Promise<BlogPost[]> {
  const posts: BlogPost[] = []
  for await (const entry of glob('blog/*.md', { cwd: contentDir })) {
    const sourceRel = entry.replace(/\\/g, '/')
    const slug = sourceRel.replace(/^blog\//, '').replace(/\.md$/, '')
    const raw = await fs.readFile(join(contentDir, sourceRel), 'utf8')
    const { frontmatter, body } = splitFrontmatter(raw)
    posts.push({
      sourceRel,
      slug,
      urlPath: `/blog/${slug}`,
      mdPath: `/blog/${slug}.md`,
      raw,
      body,
      frontmatter: frontmatter as BlogPost['frontmatter'],
    })
  }
  posts.sort((a, b) => {
    const ad = a.frontmatter.updated ?? a.frontmatter.date ?? ''
    const bd = b.frontmatter.updated ?? b.frontmatter.date ?? ''
    if (ad !== bd) return bd.localeCompare(ad)
    return (a.frontmatter.title ?? '').localeCompare(b.frontmatter.title ?? '')
  })
  return posts
}

async function readComparePages(contentDir: string): Promise<ComparePage[]> {
  const pages: ComparePage[] = []
  for await (const entry of glob('compare/*.md', { cwd: contentDir })) {
    const sourceRel = entry.replace(/\\/g, '/')
    const slug = sourceRel.replace(/^compare\//, '').replace(/\.md$/, '')
    const raw = await fs.readFile(join(contentDir, sourceRel), 'utf8')
    const { frontmatter, body } = splitFrontmatter(raw)
    pages.push({
      sourceRel,
      slug,
      urlPath: `/compare/${slug}`,
      mdPath: `/compare/${slug}.md`,
      body,
      frontmatter: frontmatter as ComparePage['frontmatter'],
    })
  }
  pages.sort((a, b) => (a.frontmatter.competitor ?? a.slug).localeCompare(b.frontmatter.competitor ?? b.slug))
  return pages
}

/**
 * Render a comparison page's structured frontmatter + bespoke body into one
 * self-contained Markdown document (the `.md` twin AI assistants read). The
 * frontmatter carries the table/verdicts/FAQ, so a verbatim twin would be raw
 * YAML — render it properly instead.
 */
function buildCompareMarkdown(page: ComparePage): string {
  const fm = page.frontmatter
  const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const lines: string[] = []
  lines.push(`# ${fm.title ?? `BitterClip vs ${fm.competitor ?? page.slug}`}`)
  lines.push('')
  lines.push(`Canonical HTML page: ${SITE_ORIGIN}${page.urlPath}`)
  lines.push('')
  if (fm.description) {
    lines.push(fm.description)
    lines.push('')
  }
  if (fm.statusNote) {
    lines.push(`> ${fm.statusNote}`)
    lines.push('')
  }
  if (fm.heroLede) {
    lines.push(fm.heroLede)
    lines.push('')
  }
  if (fm.competitorStrength) {
    lines.push(`Where ${fm.competitor} wins: ${fm.competitorStrength}`)
    lines.push('')
  }
  if (fm.verdictBitterclip || fm.verdictCompetitor) {
    lines.push('## Quick verdict')
    lines.push('')
    if (fm.verdictBitterclip) lines.push(`**BitterClip:** ${fm.verdictBitterclip}`)
    lines.push('')
    if (fm.verdictCompetitor) lines.push(`**${fm.competitor}:** ${fm.verdictCompetitor}`)
    lines.push('')
  }
  if (fm.rows && fm.rows.length > 0) {
    lines.push('## Comparison')
    lines.push('')
    const edgeName = (edge?: string) => {
      if (edge === 'bitterclip') return 'BitterClip'
      if (edge === 'competitor') return fm.competitor ?? ''
      return 'Even'
    }
    lines.push(`| What you're comparing | BitterClip | ${cell(fm.competitor ?? '')} | Edge |`)
    lines.push('| --- | --- | --- | --- |')
    for (const row of fm.rows) {
      const ours = `**${cell(row.bitterclip.lead)}** ${cell(row.bitterclip.detail)}`
      const theirs = `**${cell(row.competitor.lead)}** ${cell(row.competitor.detail)}`
      lines.push(`| ${cell(row.axis)} | ${ours} | ${theirs} | ${cell(edgeName(row.edge))} |`)
    }
    lines.push('')
  }
  if (fm.chooseUs && fm.chooseUs.length > 0) {
    lines.push('## Choose BitterClip when')
    lines.push('')
    for (const item of fm.chooseUs) lines.push(`- ${item}`)
    lines.push('')
  }
  if (fm.chooseThem && fm.chooseThem.length > 0) {
    lines.push(`## Choose ${fm.competitor} when`)
    lines.push('')
    for (const item of fm.chooseThem) lines.push(`- ${item}`)
    lines.push('')
  }
  if (fm.gotchas && fm.gotchas.length > 0) {
    lines.push(`## The fine print (from ${fm.competitor}'s own pricing and terms)`)
    lines.push('')
    for (const gotcha of fm.gotchas) {
      lines.push(`### ${gotcha.title}`)
      lines.push('')
      lines.push(gotcha.body)
      lines.push('')
      lines.push(`Source: [${gotcha.sourceLabel}](${gotcha.sourceUrl})`)
      lines.push('')
    }
  }
  if (page.body.trim()) {
    lines.push(page.body.trim())
    lines.push('')
  }
  if (fm.faq && fm.faq.length > 0) {
    lines.push('## FAQ')
    lines.push('')
    for (const item of fm.faq) {
      lines.push(`### ${item.q}`)
      lines.push('')
      lines.push(item.a)
      lines.push('')
    }
  }
  if (fm.sources && fm.sources.length > 0) {
    lines.push('## Sources')
    lines.push('')
    for (const source of fm.sources) lines.push(`- [${source.label}](${source.url})`)
    lines.push('')
  }
  if (fm.reviewed) {
    lines.push(`Facts about ${fm.competitor} were last reviewed ${fm.reviewed}.`)
  }
  return lines.join('\n').trimEnd() + '\n'
}

async function readSite(contentDir: string): Promise<Record<string, string>> {
  const raw = await fs.readFile(join(contentDir, '_data/site.yml'), 'utf8')
  return (parseYaml(raw) ?? {}) as Record<string, string>
}

// --- Surface builders -------------------------------------------------------

function buildLlmsIndex(pages: DocPage[], posts: BlogPost[], comparisons: ComparePage[]): string {
  const groups = new Map<string, DocPage[]>()
  for (const p of pages) {
    const section = p.frontmatter.section ?? 'docs'
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section)!.push(p)
  }
  const sectionTitles: Record<string, string> = {
    'getting-started': 'Getting started',
    assistants: 'Use it from your AI assistant',
    connect: 'Connect your channels',
    publishing: 'Publishing',
    help: 'Help',
    changelog: 'Changelog',
  }
  const lines: string[] = []
  lines.push('# BitterClip')
  lines.push('')
  lines.push(
    '> BitterClip turns long video and audio recordings into short, source-accurate clips. ' +
      'You (or your AI assistant) pick the strongest moment by the words you keep; BitterClip ' +
      'derives the exact cut from the audio. It runs in the browser at app.bitterclip.com and ' +
      'inside ChatGPT and Claude via a connection.',
  )
  lines.push('')
  lines.push(
    'The model is Recording → Episode → Clip: a Recording is a raw uploaded source; an Episode ' +
      'is one stitched transcript timeline (one or more recordings) and the unit you work in; a ' +
      'Clip is an editable cut derived from an episode. A Render attempts to make media; ' +
      'an Export is one completed exact version. A Moment saves intent for review, not an Episode.',
  )
  lines.push('')
  lines.push(
    'BitterClip is a product of SheetGenius, Inc. (https://company.sheetgenius.com), the company ' +
      'that operates the service and is named in its terms and privacy policy. Support: ' +
      'hello@bitterclip.com.',
  )
  lines.push('')
  lines.push('## Install')
  lines.push('')
  lines.push(`- [Connect BitterClip](${SITE_ORIGIN}/connect): the page for people. One-click setup for Claude, ChatGPT, Claude Code and Codex, with live connection status when signed in.`)
  lines.push(
    `- [Install BitterClip in Claude Code or Codex](${SITE_ORIGIN}/docs/assistants/install): instructions an agent follows to install, ` +
      'have the person sign in, verify and hand off. Use it for any request to install BitterClip, including ' +
      `"Read ${SITE_ORIGIN}/docs/assistants/install and follow it exactly to install BitterClip, then tell me how to start."`,
  )
  lines.push('- MCP server: https://app.bitterclip.com/mcp (streamable HTTP with OAuth sign-in; never paste a token).')
  lines.push('- Optional editing skills: https://github.com/sheetgenius/bitterclip-plugin')
  lines.push('')
  for (const section of ['getting-started', 'assistants', 'connect', 'publishing', 'help', 'changelog']) {
    const list = groups.get(section)
    if (!list || list.length === 0) continue
    lines.push(`## ${sectionTitles[section] ?? section}`)
    lines.push('')
    for (const p of list) {
      const title = p.frontmatter.title ?? p.urlPath
      const desc = p.frontmatter.description ?? ''
      lines.push(`- [${title}](${SITE_ORIGIN}${p.urlPath}): ${desc}`.trimEnd())
    }
    lines.push('')
  }
  if (posts.length > 0) {
    lines.push('## Blog')
    lines.push('')
    for (const post of posts) {
      const title = post.frontmatter.title ?? post.urlPath
      const desc = post.frontmatter.description ?? ''
      lines.push(`- [${title}](${SITE_ORIGIN}${post.urlPath}): ${desc}`.trimEnd())
    }
    lines.push('')
  }
  lines.push('## Comparisons')
  lines.push('')
  lines.push('- [BitterClip vs Descript vs OpusClip](https://bitterclip.com/compare): A workflow comparison of source-linked understanding, full production control, and high-volume social clipping.')
  for (const comparison of comparisons) {
    const title = comparison.frontmatter.title ?? `BitterClip vs ${comparison.frontmatter.competitor ?? comparison.slug}`
    const desc = comparison.frontmatter.description ?? ''
    lines.push(`- [${title}](${SITE_ORIGIN}${comparison.urlPath}): ${desc}`.trimEnd())
  }
  lines.push('')
  return lines.join('\n').trimEnd() + '\n'
}

function buildLlmsFull(pages: DocPage[], posts: BlogPost[], comparisons: ComparePage[]): string {
  const parts: string[] = []
  parts.push('# BitterClip — full documentation and blog corpus')
  parts.push('')
  parts.push(
    'Concatenated Markdown of every BitterClip docs page and blog post, generated from ' +
      'the content collections. Recording → Episode → Clip is the editable product model; ' +
      'a Moment saves intent for review. BitterClip is a product of SheetGenius, Inc. ' +
      '(https://company.sheetgenius.com).',
  )
  parts.push('')
  for (const p of pages) {
    parts.push('---')
    parts.push('')
    parts.push(`# ${p.frontmatter.title ?? p.urlPath}`)
    parts.push(`Source: ${SITE_ORIGIN}${p.urlPath}`)
    if (p.frontmatter.description) parts.push(`Description: ${p.frontmatter.description}`)
    parts.push('')
    parts.push(p.body.trim())
    parts.push('')
  }
  for (const post of posts) {
    parts.push('---')
    parts.push('')
    parts.push(`# ${post.frontmatter.title ?? post.urlPath}`)
    parts.push(`Source: ${SITE_ORIGIN}${post.urlPath}`)
    if (post.frontmatter.description) parts.push(`Description: ${post.frontmatter.description}`)
    if (post.frontmatter.date) parts.push(`Date: ${post.frontmatter.date}`)
    if (post.frontmatter.author) parts.push(`Author: ${post.frontmatter.author}`)
    parts.push('')
    parts.push(post.body.trim())
    parts.push('')
  }
  parts.push('---')
  parts.push('')
  parts.push('# BitterClip vs Descript vs OpusClip')
  parts.push('Source: https://bitterclip.com/compare')
  parts.push('')
  parts.push('A workflow comparison of source-linked understanding, full production control, and high-volume social clipping. See the canonical page for the current comparison and official sources.')
  parts.push('')
  for (const comparison of comparisons) {
    parts.push('---')
    parts.push('')
    parts.push(`# ${comparison.frontmatter.title ?? `BitterClip vs ${comparison.frontmatter.competitor ?? comparison.slug}`}`)
    parts.push(`Source: ${SITE_ORIGIN}${comparison.urlPath}`)
    if (comparison.frontmatter.description) parts.push(`Description: ${comparison.frontmatter.description}`)
    parts.push('')
    // Skip the H1 line of the rendered twin — the header above already carries it.
    parts.push(buildCompareMarkdown(comparison).split('\n').slice(1).join('\n').trim())
    parts.push('')
  }
  return parts.join('\n').trimEnd() + '\n'
}

interface HtmlNode {
  nodeName: string
  value?: string
  attrs?: Array<{ name: string; value: string }>
  childNodes?: HtmlNode[]
}

function findArticle(node: HtmlNode): HtmlNode | undefined {
  if (node.nodeName === 'article' && node.attrs?.some((attr) => attr.name === 'class' && attr.value.split(/\s+/).includes('docs-prose'))) return node
  for (const child of node.childNodes ?? []) {
    const found = findArticle(child)
    if (found) return found
  }
}

function renderedArticleText(html: string, path: string): string {
  const article = findArticle(parseHtml(html) as HtmlNode)
  if (!article) throw new Error(`No rendered docs article at ${path}`)
  function walk(node: HtmlNode): string {
    if (node.nodeName === '#text') return node.value ?? ''
    if (['script', 'style', 'svg', 'iframe', 'button'].includes(node.nodeName)) return ''
    const inner = (node.childNodes ?? []).map(walk).join('')
    if (node.nodeName === 'a') {
      const href = node.attrs?.find((attr) => attr.name === 'href')?.value
      return href ? `[${inner.trim()}](${href})` : inner
    }
    if (node.nodeName === 'li') return `\n- ${inner.trim()}\n`
    if (/^(?:h[1-6]|p|div|aside|section|ul|ol|pre|blockquote)$/.test(node.nodeName)) return `\n${inner.trim()}\n`
    return inner
  }
  const body = walk(article).replace(/[ \t]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
  if (body.length < 20 || body.includes('::approval-promise') || body.includes('::connector-scopes')) {
    throw new Error(`Incomplete rendered docs article at ${path}`)
  }
  return body
}

// Rails reads this deployment-atomic projection of what the static docs page
// actually renders, including Vue snippets. The authored file hash remains
// provenance; the body hash covers rendered text delivered to help.
async function buildHelpCorpus(pages: DocPage[], publicDir: string): Promise<string> {
  if (!pages.length || pages.length > 100) throw new Error('Public help page count exceeds Rails acceptance bounds')
  const documents = await Promise.all(pages.map(async (page) => {
    const path = join(publicDir, page.urlPath.replace(/^\//, ''), 'index.html')
    const body = renderedArticleText(await fs.readFile(path, 'utf8'), path)
    const uri = `bitterclip://docs/public/${page.sourceRel.replace(/\.md$/, '')}`
    const source = `${SITE_ORIGIN}${page.urlPath}`
    const markdown = `${SITE_ORIGIN}${page.mdPath}`
    const title = page.frontmatter.title
    const description = page.frontmatter.description
    const section = page.frontmatter.section
    if (!/^bitterclip:\/\/docs\/public\/[a-z0-9/-]+$/.test(uri) ||
        !/^https:\/\/bitterclip\.com\/docs(?:\/[a-z0-9/-]+)?$/.test(source) ||
        markdown !== `${source}.md` ||
        ![title, description, section].every((value) => typeof value === 'string')) {
      throw new Error(`Public help page violates Rails acceptance bounds: ${page.sourceRel}`)
    }
    return {
      uri, title, description, section, source, markdown,
      sha256: createHash('sha256').update(page.raw).digest('hex'),
      body_sha256: createHash('sha256').update(body).digest('hex'), body,
    }
  }))
  const digest = createHash('sha256').update(documents.map((page) => `${page.uri} ${page.sha256} ${page.body_sha256}`).join('\n')).digest('hex')
  const corpus = JSON.stringify({ schema_version: 'bitterclip.public_help.v1', digest, documents }) + '\n'
  if (Buffer.byteLength(corpus) > 512_000) throw new Error('Public help corpus exceeds Rails 512 KB limit')
  return corpus
}

function buildSitemap(pages: DocPage[], posts: BlogPost[], comparisons: ComparePage[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const entries: { loc: string; lastmod: string }[] = []
  for (const route of MARKETING_ROUTES) {
    entries.push({ loc: `${SITE_ORIGIN}${route === '/' ? '/' : route}`, lastmod: today })
  }
  for (const comparison of comparisons) {
    entries.push({
      loc: `${SITE_ORIGIN}${comparison.urlPath}`,
      lastmod: comparison.frontmatter.reviewed ?? today,
    })
  }
  const latestPostDate = posts[0]?.frontmatter.updated ?? posts[0]?.frontmatter.date ?? today
  entries.push({ loc: `${SITE_ORIGIN}/blog`, lastmod: latestPostDate })
  for (const post of posts) {
    entries.push({
      loc: `${SITE_ORIGIN}${post.urlPath}`,
      lastmod: post.frontmatter.updated ?? post.frontmatter.date ?? today,
    })
  }
  for (const p of pages) {
    entries.push({
      loc: `${SITE_ORIGIN}${p.urlPath}`,
      lastmod: p.frontmatter.updated ?? today,
    })
  }
  const urls = entries
    .map((e) => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build the changelog RSS feed from the changelog content. Phase 1 ships a single
 * hand-curated "What's new" page (content/changelog/index.md); we expose it as one
 * feed item using its frontmatter. When per-entry changelog pages land (each with a
 * `date`/`summary`), every `section: changelog` page becomes a dated <item> here with
 * no further wiring.
 */
function buildChangelogRss(pages: DocPage[]): string {
  const entries = pages
    .filter((p) => p.frontmatter.section === 'changelog')
    .sort((a, b) => (b.frontmatter.date ?? b.frontmatter.updated ?? '').localeCompare(a.frontmatter.date ?? a.frontmatter.updated ?? ''))

  const items = entries
    .map((p) => {
      const link = `${SITE_ORIGIN}${p.urlPath}`
      const pub = new Date(`${p.frontmatter.date ?? p.frontmatter.updated ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`).toUTCString()
      const desc = p.frontmatter.summary ?? p.frontmatter.description ?? ''
      return (
        `    <item>\n` +
        `      <title>${xmlEscape(p.frontmatter.title ?? "What's new")}</title>\n` +
        `      <link>${link}</link>\n` +
        `      <guid isPermaLink="true">${link}</guid>\n` +
        `      <pubDate>${pub}</pubDate>\n` +
        `      <description>${xmlEscape(desc)}</description>\n` +
        `    </item>`
      )
    })
    .join('\n')

  const buildDate = new Date().toUTCString()
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>BitterClip — What's new</title>\n` +
    `    <link>${SITE_ORIGIN}/docs/changelog</link>\n` +
    `    <description>Notable changes to BitterClip, newest first.</description>\n` +
    `    <language>en</language>\n` +
    `    <lastBuildDate>${buildDate}</lastBuildDate>\n` +
    `    <atom:link href="${SITE_ORIGIN}/changelog.xml" rel="self" type="application/rss+xml" />\n` +
    `${items}\n` +
    `  </channel>\n` +
    `</rss>\n`
  )
}

function buildBlogIndexMarkdown(posts: BlogPost[]): string {
  const lines: string[] = []
  lines.push('# BitterClip blog')
  lines.push('')
  lines.push('Canonical HTML page: https://bitterclip.com/blog')
  lines.push('')
  lines.push('RSS feed: https://bitterclip.com/blog/rss.xml')
  lines.push('')
  lines.push('Launch notes, product updates, and field notes from BitterClip.')
  lines.push('')
  lines.push('## Posts')
  lines.push('')
  if (posts.length === 0) {
    lines.push('No posts published yet.')
  } else {
    for (const post of posts) {
      const title = post.frontmatter.title ?? post.urlPath
      const date = post.frontmatter.date ? ` — ${post.frontmatter.date}` : ''
      const desc = post.frontmatter.description ? `: ${post.frontmatter.description}` : ''
      lines.push(`- [${title}](${SITE_ORIGIN}${post.urlPath})${date}${desc}`)
    }
  }
  return lines.join('\n').trimEnd() + '\n'
}

function buildBlogRss(posts: BlogPost[]): string {
  const items = posts
    .map((post) => {
      const link = `${SITE_ORIGIN}${post.urlPath}`
      const pub = new Date(`${post.frontmatter.date ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`).toUTCString()
      const desc = post.frontmatter.description ?? ''
      const tags = (post.frontmatter.tags ?? [])
        .map((tag) => `      <category>${xmlEscape(tag)}</category>`)
        .join('\n')
      return (
        `    <item>\n` +
        `      <title>${xmlEscape(post.frontmatter.title ?? post.urlPath)}</title>\n` +
        `      <link>${link}</link>\n` +
        `      <guid isPermaLink="true">${link}</guid>\n` +
        `      <pubDate>${pub}</pubDate>\n` +
        `      <description>${xmlEscape(desc)}</description>\n` +
        (tags ? `${tags}\n` : '') +
        `    </item>`
      )
    })
    .join('\n')

  const buildDate = new Date().toUTCString()
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>BitterClip Blog</title>\n` +
    `    <link>${SITE_ORIGIN}/blog</link>\n` +
    `    <description>Launch notes, product updates, and field notes from BitterClip.</description>\n` +
    `    <language>en</language>\n` +
    `    <lastBuildDate>${buildDate}</lastBuildDate>\n` +
    `    <atom:link href="${SITE_ORIGIN}/blog/rss.xml" rel="self" type="application/rss+xml" />\n` +
    `${items}\n` +
    `  </channel>\n` +
    `</rss>\n`
  )
}

async function writeFile(publicDir: string, urlPath: string, contents: string): Promise<void> {
  // urlPath is a leading-slash public path; map it to a file under publicDir.
  const rel = urlPath.replace(/^\//, '')
  const dest = join(publicDir, rel)
  await fs.mkdir(dirname(dest), { recursive: true })
  await fs.writeFile(dest, contents, 'utf8')
}

export default defineNuxtModule({
  meta: {
    name: 'generated-surfaces',
    configKey: 'generatedSurfaces',
  },
  setup(_options, nuxt) {
    const contentDir = fileURLToPath(new URL('../content', import.meta.url))

    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('prerender:done', async () => {
        const publicDir = nitro.options.output.publicDir
        const authoredPages = await readDocs(contentDir)
        const catalog = await readCatalogSnapshot()
        const toolMarkdown = buildToolReferenceMarkdown(catalog)
        const appOnlyMarkdown = buildAppOnlyToolsMarkdown(catalog)
        const toolPages: DocPage[] = catalog.profiles.app.descriptors.map((descriptor) => {
          const markdown = buildToolPageMarkdown(catalog, descriptor.name)
          const urlPath = `/docs/assistants/tools/${descriptor.name}`
          return {
            sourceRel: `assistants/tools/${descriptor.name}.md`, urlPath,
            mdPath: `${urlPath}.md`, raw: markdown, body: markdown,
            frontmatter: { title: `${descriptor.name} MCP tool`, description: descriptor.description.slice(0, 155),
              section: 'assistants', updated: catalog.retrieved_at.slice(0, 10) },
          }
        })
        const pages: DocPage[] = [...authoredPages, {
          sourceRel: 'assistants/tool-reference.md',
          urlPath: TOOL_REFERENCE_PATH,
          mdPath: `${TOOL_REFERENCE_PATH}.md`,
          raw: toolMarkdown,
          body: toolMarkdown,
          frontmatter: {
            title: 'BitterClip tool reference',
            description: 'The 63 default model tools captured from the serving product.',
            section: 'assistants',
            updated: catalog.retrieved_at.slice(0, 10),
          },
        }, {
          sourceRel: 'assistants/app-only-tools.md',
          urlPath: APP_ONLY_TOOLS_PATH,
          mdPath: `${APP_ONLY_TOOLS_PATH}.md`,
          raw: appOnlyMarkdown,
          body: appOnlyMarkdown,
          frontmatter: {
            title: 'App-only MCP tools',
            description: 'The 49 app-only tools available for MCP hosts to list.',
            section: 'assistants',
            updated: catalog.retrieved_at.slice(0, 10),
          },
        }, ...toolPages]
        const posts = await readBlogPosts(contentDir)
        const comparisons = await readComparePages(contentDir)

        // 1. Per-page raw .md twins (comparisons render frontmatter → Markdown).
        let twinCount = 0
        for (const p of pages) {
          await writeFile(publicDir, p.mdPath, p.raw.endsWith('\n') ? p.raw : `${p.raw}\n`)
          twinCount++
        }
        for (const post of posts) {
          await writeFile(publicDir, post.mdPath, post.raw.endsWith('\n') ? post.raw : `${post.raw}\n`)
          twinCount++
        }
        for (const comparison of comparisons) {
          await writeFile(publicDir, comparison.mdPath, buildCompareMarkdown(comparison))
          twinCount++
        }
        await writeFile(publicDir, '/blog.md', buildBlogIndexMarkdown(posts))
        await writeFile(publicDir, `${TOOL_REFERENCE_PATH}.json`, JSON.stringify(catalog) + '\n')
        for (const descriptor of catalog.profiles.app.descriptors) {
          const name = descriptor.name
          await writeFile(publicDir, `/docs/assistants/tools/${name}.json`, JSON.stringify({
            product_release: catalog.product_release,
            public_contract_commit: catalog.public_contract_commit,
            public_contract_digest: catalog.public_contract_digest,
            descriptor_digest: catalog.digest,
            surface: catalog.profiles.model.descriptors.some((item) => item.name === name) ? 'default_model_and_app' : 'app_only',
            model: toolDescriptor(catalog, 'model', name),
            app: descriptor,
            live_workspace: toolDescriptor(catalog, 'live_workspace', name),
            guidance: catalog.profiles.app.guidance.find((item) => item.name === name),
          }) + '\n')
        }

        // 2 + 3. llms.txt index + full corpus (replaces the stale hand-written ones).
        await writeFile(publicDir, '/llms.txt', buildLlmsIndex(pages, posts, comparisons))
        // The 600 KB schema reference has its own Markdown twin. Keep the full
        // prose corpus bounded; llms.txt still links to the complete reference.
        await writeFile(publicDir, '/llms-full.txt', buildLlmsFull(authoredPages, posts, comparisons))
        // Agent help gets authored creator pages; Rails owns live tool descriptors.
        await writeFile(publicDir, '/help-corpus.json', await buildHelpCorpus(authoredPages, publicDir))

        // 4. sitemap.xml — marketing routes + comparisons + every /docs page + blog.
        await writeFile(publicDir, '/sitemap.xml', buildSitemap(pages, posts, comparisons))

        // 5. changelog RSS.
        await writeFile(publicDir, '/changelog.xml', buildChangelogRss(pages))

        // 6. Blog RSS.
        await writeFile(publicDir, '/blog/rss.xml', buildBlogRss(posts))

        nitro.logger.success(
          `[generated-surfaces] ${twinCount} .md twins + blog.md, llms.txt, llms-full.txt, help-corpus.json, sitemap.xml, changelog.xml, blog/rss.xml`,
        )
      })
    })
  },
})
