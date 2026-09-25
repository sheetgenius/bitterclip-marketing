import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readPublicAgentContract } from './public-agent-contract.mjs'

// Capture only what the serving Rails McpServer projects. A failed fetch or
// provenance mismatch fails the static build; no prior snapshot is a fallback.
const source = process.env.BITTERCLIP_CATALOG_URL || 'https://app.bitterclip.com/api/v1/mcp_descriptors.json'
const url = new URL(source)
if (process.env.BITTERCLIP_CATALOG_URL && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
  throw new Error('Descriptor source override is only for local tests')
}
const target = resolve('tmp/mcp-catalog-snapshot.json')
const localContract = await readPublicAgentContract()
await rm(target, { force: true })
const profiles = {}
let release
let commit
let contractDigest
for (const profile of ['model', 'app', 'live_workspace']) {
  const endpoint = new URL(url)
  endpoint.searchParams.set('profile', profile)
  endpoint.searchParams.set('connector_family', 'chatgpt')
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(20_000), headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`MCP descriptor fetch failed: ${response.status} ${endpoint}`)
  const servedRelease = response.headers.get('x-bitterclip-release')
  if (!servedRelease || !/^[0-9a-f]{7,40}$/.test(servedRelease) ||
      (!process.env.BITTERCLIP_CATALOG_URL && /^0+$/.test(servedRelease))) {
    throw new Error(`${profile} descriptor response has no valid X-BitterClip-Release header`)
  }
  const body = await response.json()
  if (body.public_contract_digest !== localContract.digest) {
    throw new Error(`${profile} serving Rails contract digest ${body.public_contract_digest} differs from this site's ${localContract.digest}`)
  }
  if (body?.schema_version !== 'bitterclip.mcp_descriptors.v1' || body.profile !== profile ||
      body.connector_family !== 'chatgpt' || !Array.isArray(body.descriptors) ||
      !Array.isArray(body.guidance) || body.descriptors.length !== ({ model: 63, app: 113, live_workspace: 63 })[profile] ||
      body.guidance.length !== body.descriptors.length ||
      !/^[a-f0-9]{40}$/.test(body.public_contract_commit) ||
      !/^[a-f0-9]{64}$/.test(body.public_contract_digest)) {
    throw new Error(`Invalid ${profile} MCP descriptor profile`)
  }
  const names = new Set()
  for (const item of body.descriptors) {
    if (typeof item.name !== 'string' || names.has(item.name) ||
        typeof item.title !== 'string' || typeof item.description !== 'string' ||
        !item.inputSchema || typeof item.inputSchema !== 'object') {
      throw new Error(`Invalid or duplicate ${profile} descriptor: ${item?.name}`)
    }
    names.add(item.name)
  }
  if (!names.has(profile === 'live_workspace' ? 'workspace_get_link' : 'help') ||
      ['list_docs', 'search_docs', 'read_doc'].some((name) => names.has(name))) {
    throw new Error(`${profile} descriptor profile has missing or retired help tools`)
  }
  if (release && release !== servedRelease || commit && commit !== body.public_contract_commit ||
      contractDigest && contractDigest !== body.public_contract_digest) {
    throw new Error(`MCP descriptor profiles came from different product or contract releases`)
  }
  release = servedRelease
  commit = body.public_contract_commit
  contractDigest = body.public_contract_digest
  profiles[profile] = { descriptors: body.descriptors, guidance: body.guidance }
}
const digest = createHash('sha256').update(JSON.stringify(profiles)).digest('hex')
const releaseRequestPath = resolve('contracts/mcp/release-request.json')
const releaseRequestText = await readFile(releaseRequestPath, 'utf8').catch((error) => {
  if (error.code === 'ENOENT') return null
  throw error
})
if (releaseRequestText !== null && !process.env.BITTERCLIP_CATALOG_URL) {
  const request = JSON.parse(releaseRequestText)
  if (request.schema_version !== 'bitterclip.public_contract_release_request.v1' ||
      !/^[a-f0-9]{40}$/.test(request.product_release) ||
      request.public_contract_commit !== commit ||
      request.public_contract_digest !== contractDigest) {
    throw new Error(`Serving Rails contract does not match ${releaseRequestPath}`)
  }
  if (request.product_release !== release) {
    console.warn(`Requested Rails release ${request.product_release} differs from serving ${release}; capturing the serving release with the same public contract`)
  }
}
const buildId = randomUUID()
const snapshot = {
  schema_version: 'bitterclip.mcp_surface_snapshot.v1',
  source: url.toString(),
  product_release: release,
  public_contract_commit: commit,
  public_contract_digest: contractDigest,
  retrieved_at: new Date().toISOString(),
  digest,
  build_id: buildId,
  profiles,
}
await mkdir(resolve('tmp'), { recursive: true })
await writeFile(target, JSON.stringify(snapshot) + '\n')
console.log(`MCP snapshot: 113 tools, product ${release.slice(0, 12)}, contract ${commit.slice(0, 12)} / ${contractDigest}`)

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
