import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// The static tool reference is a snapshot of the *deployed* product catalog.
// A failed fetch fails the build; an old local snapshot is never a fallback.
const source = process.env.BITTERCLIP_CATALOG_URL || 'https://app.bitterclip.com/api/v1/operation_catalog.json'
const target = resolve('tmp/mcp-catalog-snapshot.json')
await rm(target, { force: true })
const url = new URL(source)
if (process.env.BITTERCLIP_CATALOG_URL && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
  throw new Error('Catalog source override is only for local tests')
}

const response = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { accept: 'application/json' } })
if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status} ${source}`)
const release = response.headers.get('x-bitterclip-release')
if (!release || !/^[0-9a-f]{7,40}$/.test(release) || (!process.env.BITTERCLIP_CATALOG_URL && /^0+$/.test(release))) {
  throw new Error('Catalog response has no valid X-BitterClip-Release header')
}
const catalog = await response.json()
if (catalog?.schema_version !== 'bitterclip.operation_catalog.v1' || catalog?.surface !== 'mcp_model_visible') {
  throw new Error('Catalog has an unexpected schema or surface')
}
if (!Array.isArray(catalog.operations) || catalog.operations.length === 0) throw new Error('Catalog has no operations')
const names = new Set()
for (const operation of catalog.operations) {
  if (typeof operation.name !== 'string' || !/^[a-z][a-z0-9_]*$/.test(operation.name) || names.has(operation.name) ||
      typeof operation.title !== 'string' || !operation.title.trim() ||
      typeof operation.description !== 'string' || !operation.description.trim() ||
      !operation.input_schema || typeof operation.input_schema !== 'object' || Array.isArray(operation.input_schema)) {
    throw new Error(`Invalid or duplicate catalog operation: ${operation?.name}`)
  }
  names.add(operation.name)
}
if (!names.has('help') || ['list_docs', 'search_docs', 'read_doc'].some((name) => names.has(name))) {
  throw new Error('Catalog still exposes retired help tools; deploy the Rails help cutover before building the site')
}

const operations = catalog.operations
const digest = createHash('sha256').update(JSON.stringify(operations)).digest('hex')
const buildId = randomUUID()
const snapshot = {
  schema_version: catalog.schema_version,
  surface: catalog.surface,
  source: url.toString(),
  product_release: release,
  retrieved_at: new Date().toISOString(),
  digest,
  build_id: buildId,
  operations,
}
await mkdir(resolve('tmp'), { recursive: true })
await writeFile(target, JSON.stringify(snapshot) + '\n')
console.log(`Catalog snapshot: ${operations.length} tools, product ${release.slice(0, 12)}, SHA-256 ${digest}`)

const command = process.argv[2]
if (command) {
  if (!['generate', 'build', 'dev'].includes(command)) throw new Error(`Unsupported Nuxt command: ${command}`)
  const child = spawn(resolve('node_modules/.bin/nuxt'), [command], {
    stdio: 'inherit',
    env: { ...process.env, BITTERCLIP_CATALOG_BUILD_ID: buildId },
  })
  process.exitCode = await new Promise((resolve) => {
    child.once('error', (error) => { console.error(error); resolve(1) })
    child.once('exit', (code) => resolve(code ?? 1))
  })
}
