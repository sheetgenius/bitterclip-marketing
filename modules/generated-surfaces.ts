import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { glob } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'

/**
 * Generated machine-readable surfaces — produced at build time, NEVER hand-maintained.
 *
 * Single source of truth: the `content/` docs collection on disk. From it we emit, into
 * the static output (`.output/public`), after all routes are prerendered:
 *
 *   1. Per-page `.md` twins at `/docs/<path>.md` (verbatim frontmatter + body).
 *   2. `/llms.txt`     — a structured index of the docs.
 *   3. `/llms-full.txt`— the concatenated docs corpus.
 *   4. `/sitemap.xml`  — every `/docs/*` page, blog route, blog post, and marketing route.
 *   5. `/changelog.xml`— an RSS feed built from the changelog entries.
 *   6. `/blog/rss.xml` — an RSS feed built from the blog collection.
 *
 * DRY: add or edit a `content/*.md` page (or `site.yml`) and every surface above
 * regenerates on the next build. No generated surface is authored by hand.
 */

const SITE_ORIGIN = 'https://bitterclip.com'

// Marketing routes that live outside the docs collection (Vue pages in app/pages/).
// Kept here as the one place the static, non-docs URLs are enumerated for the sitemap.
const MARKETING_ROUTES = ['/', '/privacy', '/terms', '/data-deletion', '/compare'] as const

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
    '> BitterClip turns a recorded conversation into a finished episode and the clips from it. ' +
      'It transcribes every word tied to the moment it was spoken, reads the whole session, and ' +
      'its built-in agent makes the cut; you direct it in plain words or by editing the transcript, ' +
      'and every cut resolves against the audio. It runs in the browser at app.bitterclip.com; ' +
      'ChatGPT and Claude can operate the same workbench through an optional connection.',
  )
  lines.push('')
  lines.push(
    'The model is Recording → Episode → Clip: a Recording is a raw uploaded source; an Episode ' +
      'is one stitched transcript timeline (one or more recordings) and the unit you work in; a ' +
      'Clip is a short cut derived from an episode; both render to exact, downloadable exports. ' +
      '(Older material called episodes "Moments" — that term is retired.)',
  )
  lines.push('')
  lines.push(
    'BitterClip is a product of SheetGenius, Inc. (https://company.sheetgenius.com), the company ' +
      'that operates the service and is named in its terms and privacy policy. Support: ' +
      'hello@bitterclip.com.',
  )
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
      'the content collections. Recording → Episode → Clip is the product model (the ' +
      'retired "Moment" noun is not used). BitterClip is a product of SheetGenius, Inc. ' +
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
        const pages = await readDocs(contentDir)
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

        // 2 + 3. llms.txt index + full corpus (replaces the stale hand-written ones).
        await writeFile(publicDir, '/llms.txt', buildLlmsIndex(pages, posts, comparisons))
        await writeFile(publicDir, '/llms-full.txt', buildLlmsFull(pages, posts, comparisons))

        // 4. sitemap.xml — marketing routes + comparisons + every /docs page + blog.
        await writeFile(publicDir, '/sitemap.xml', buildSitemap(pages, posts, comparisons))

        // 5. changelog RSS.
        await writeFile(publicDir, '/changelog.xml', buildChangelogRss(pages))

        // 6. Blog RSS.
        await writeFile(publicDir, '/blog/rss.xml', buildBlogRss(posts))

        nitro.logger.success(
          `[generated-surfaces] ${twinCount} .md twins + blog.md, llms.txt, llms-full.txt, sitemap.xml, changelog.xml, blog/rss.xml`,
        )
      })
    })
  },
})
