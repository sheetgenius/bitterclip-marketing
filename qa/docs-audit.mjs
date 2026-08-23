#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const DOCS_ROOT = resolve(REPO_ROOT, 'docs')
const MAP_PATH = resolve(DOCS_ROOT, 'README.md')
const REQUIRED_ENTRYPOINTS = [
  'CURRENT_STATE.md',
  'docs/README.md',
  'docs/runbooks/homepage.md',
  'docs/runbooks/public-content.md',
  'docs/runbooks/iso4-authoring.md',
  'docs/runbooks/iso4-release.md',
]
const CURRENT_INSTRUCTION_FILES = [
  'AGENTS.md',
  'README.md',
  'CONTRIBUTING.md',
  ...REQUIRED_ENTRYPOINTS,
]
const AUTHORED_ROUTE_TWINS = [
  {
    page: 'app/pages/index.vue',
    markdown: 'public/index.md',
    href: 'https://bitterclip.com/index.md',
    canonical: 'https://bitterclip.com/',
  },
  {
    page: 'app/pages/compare/index.vue',
    markdown: 'public/compare.md',
    href: 'https://bitterclip.com/compare.md',
    canonical: 'https://bitterclip.com/compare',
  },
  {
    page: 'app/pages/privacy.vue',
    markdown: 'public/privacy.md',
    href: 'https://bitterclip.com/privacy.md',
    canonical: 'https://bitterclip.com/privacy',
  },
  {
    page: 'app/pages/terms.vue',
    markdown: 'public/terms.md',
    href: 'https://bitterclip.com/terms.md',
    canonical: 'https://bitterclip.com/terms',
  },
  {
    page: 'app/pages/data-deletion.vue',
    markdown: 'public/data-deletion.md',
    href: 'https://bitterclip.com/data-deletion.md',
    canonical: 'https://bitterclip.com/data-deletion',
  },
]
const BINARY_EVIDENCE_EXTENSIONS = new Set([
  '.avi', '.gif', '.heic', '.jpeg', '.jpg', '.mkv', '.mov', '.mp4', '.png',
  '.tar', '.tgz', '.webm', '.webp', '.zip',
])

async function text(repositoryPath) {
  return readFile(resolve(REPO_ROOT, repositoryPath), 'utf8')
}

function trackedFiles(pathspec) {
  return execFileSync('git', ['ls-files', '-z', pathspec], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).split('\0').filter(Boolean)
}

async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

async function main() {
  const errors = []
  const warnings = []
  for (const path of REQUIRED_ENTRYPOINTS) {
    try {
      const info = await stat(resolve(REPO_ROOT, path))
      if (!info.isFile() || info.size === 0) errors.push(`${path} is not one nonempty file`)
    } catch {
      errors.push(`${path} is missing`)
    }
  }

  const map = await text('docs/README.md')
  const trackedDocuments = trackedFiles('docs').sort()
  const trackedMarkdown = trackedDocuments
    .filter((path) => path.endsWith('.md'))
  const indexedDocuments = [...new Set([
    ...trackedDocuments,
    ...REQUIRED_ENTRYPOINTS.filter((path) => path.startsWith('docs/')),
  ])].sort()
  for (const path of indexedDocuments) {
    if (!map.includes(`\`${path}\``)) errors.push(`docs map does not register ${path}`)
  }

  for (const path of trackedMarkdown) {
    const head = (await text(path)).slice(0, 900)
    if (!/status:/i.test(head)) errors.push(`${path} has no status label near its heading`)
  }

  const trackedDocs = new Set(trackedFiles('docs'))
  for (const path of await walk(DOCS_ROOT)) {
    const repositoryPath = relative(REPO_ROOT, path)
    if (trackedDocs.has(repositoryPath) && BINARY_EVIDENCE_EXTENSIONS.has(extname(path).toLowerCase())) {
      errors.push(`tracked binary evidence is forbidden under docs/: ${repositoryPath}`)
    }
  }

  const untrackedBinaryEvidence = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '-z', 'docs'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  ).split('\0').filter(Boolean)
    .filter((path) => BINARY_EVIDENCE_EXTENSIONS.has(extname(path).toLowerCase()))
    .sort()
  if (untrackedBinaryEvidence.length) {
    warnings.push(
      `${untrackedBinaryEvidence.length} untracked binary evidence files exist under docs/; preserve owner work but do not commit it`,
    )
  }

  const agents = await text('AGENTS.md')
  if (!agents.includes('modules/generated-surfaces.ts') || !agents.includes('Do not hand-edit those')) {
    errors.push('AGENTS.md does not state the generated public-surface contract')
  }

  const nginx = await text('nginx.conf')
  for (const twin of AUTHORED_ROUTE_TWINS) {
    try {
      const [page, markdown] = await Promise.all([text(twin.page), text(twin.markdown)])
      if (!page.includes(twin.href)) errors.push(`${twin.page} does not advertise ${twin.href}`)
      if (!markdown.trim()) errors.push(`${twin.markdown} is empty`)
      const publicPath = `/${twin.markdown.replace(/^public\//, '')}`
      const canonicalHeader = String.raw`<${twin.canonical}>; rel=\"canonical\"`
      if (!nginx.includes(`location = ${publicPath} {`) || !nginx.includes(canonicalHeader)) {
        errors.push(`nginx.conf does not give ${publicPath} its canonical Link header`)
      }
    } catch {
      errors.push(`${twin.page} is missing its authored Markdown twin ${twin.markdown}`)
    }
  }
  if (agents.includes('app/pages/docs.vue') || agents.includes('app/pages/mcp.vue')) {
    errors.push('AGENTS.md references a retired page implementation')
  }

  for (const path of CURRENT_INSTRUCTION_FILES.filter((path) => path !== 'CURRENT_STATE.md')) {
    const source = await text(path)
    if (source.includes('app/pages/docs.vue') || source.includes('app/pages/mcp.vue')) {
      errors.push(`${path} references a retired page implementation`)
    }
  }

  let localLinksChecked = 0
  for (const path of CURRENT_INSTRUCTION_FILES) {
    const source = await text(path)
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].trim().replace(/^<|>$/g, '').split('#')[0]
      if (!target || target.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue
      localLinksChecked += 1
      const absolute = resolve(dirname(resolve(REPO_ROOT, path)), decodeURIComponent(target))
      try {
        await stat(absolute)
      } catch {
        errors.push(`${path} has a broken local Markdown link: ${target}`)
      }
    }
  }

  const result = {
    schema: 'bitterclip.docs-audit.v1',
    ok: errors.length === 0,
    trackedDocuments: trackedDocuments.length,
    trackedMarkdownDocuments: trackedMarkdown.length,
    indexedDocuments: indexedDocuments.length,
    checkedEntrypoints: REQUIRED_ENTRYPOINTS.length,
    authoredRouteTwinsChecked: AUTHORED_ROUTE_TWINS.length,
    localLinksChecked,
    warnings,
    errors,
  }
  console.log(JSON.stringify(result, null, 2))
  if (errors.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
