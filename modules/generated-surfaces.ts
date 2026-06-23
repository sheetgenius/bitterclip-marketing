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
 *   4. `/sitemap.xml`  — every `/docs/*` page plus the marketing routes.
 *   5. `/changelog.xml`— an RSS feed built from the changelog entries.
 *
 * DRY: add or edit a `content/*.md` page (or `site.yml`) and every surface above
 * regenerates on the next build. No surface is authored by hand.
 */

const SITE_ORIGIN = 'https://bitterclip.com'

// Marketing routes that live outside the docs collection (Vue pages in app/pages/).
// Kept here as the one place the static, non-docs URLs are enumerated for the sitemap.
const MARKETING_ROUTES = ['/', '/privacy', '/terms', '/data-deletion'] as const

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
    if (sourceRel.startsWith('_data/')) continue
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

async function readSite(contentDir: string): Promise<Record<string, string>> {
  const raw = await fs.readFile(join(contentDir, '_data/site.yml'), 'utf8')
  return (parseYaml(raw) ?? {}) as Record<string, string>
}

// --- Surface builders -------------------------------------------------------

function buildLlmsIndex(pages: DocPage[]): string {
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
      'Clip is a short exported cut from an episode. (Older material called episodes "Moments" — ' +
      'that term is retired.)',
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
  return lines.join('\n').trimEnd() + '\n'
}

function buildLlmsFull(pages: DocPage[]): string {
  const parts: string[] = []
  parts.push('# BitterClip — full documentation corpus')
  parts.push('')
  parts.push(
    'Concatenated Markdown of every BitterClip docs page, generated from the content ' +
      'collection. Recording → Episode → Clip is the product model (the retired "Moment" ' +
      'noun is not used).',
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
  return parts.join('\n').trimEnd() + '\n'
}

function buildSitemap(pages: DocPage[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const entries: { loc: string; lastmod: string }[] = []
  for (const route of MARKETING_ROUTES) {
    entries.push({ loc: `${SITE_ORIGIN}${route === '/' ? '/' : route}`, lastmod: today })
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

        // 1. Per-page raw .md twins.
        let twinCount = 0
        for (const p of pages) {
          await writeFile(publicDir, p.mdPath, p.raw.endsWith('\n') ? p.raw : `${p.raw}\n`)
          twinCount++
        }

        // 2 + 3. llms.txt index + full corpus (replaces the stale hand-written ones).
        await writeFile(publicDir, '/llms.txt', buildLlmsIndex(pages))
        await writeFile(publicDir, '/llms-full.txt', buildLlmsFull(pages))

        // 4. sitemap.xml — marketing routes + every /docs page.
        await writeFile(publicDir, '/sitemap.xml', buildSitemap(pages))

        // 5. changelog RSS.
        await writeFile(publicDir, '/changelog.xml', buildChangelogRss(pages))

        nitro.logger.success(
          `[generated-surfaces] ${twinCount} .md twins + llms.txt, llms-full.txt, sitemap.xml, changelog.xml`,
        )
      })
    })
  },
})
