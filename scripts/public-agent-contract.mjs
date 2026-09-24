import { createHash } from 'node:crypto'
import { readdir, readFile, lstat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SHA256 = /^[a-f0-9]{64}$/
const TOOL_NAME = /^[a-z][a-z0-9_]*$/
const SKILL_NAMES = ['fx-studio', 'get-started', 'make-a-clip', 'review-and-export']
const SCHEMA_KEYS = new Set([
  'type', 'description', 'properties', 'required', 'additionalProperties',
  'items', 'enum', 'minimum', 'maximum', 'minLength', 'maxLength',
  'minItems', 'maxItems', 'uniqueItems', 'pattern', 'exclusiveMinimum', 'oneOf', 'anyOf',
  'allOf', 'not', 'const', 'format', 'default',
])
const TOOL_KEYS = new Set(['name', 'title', 'description', 'input_schema', 'output_schema', 'errors', 'examples', 'live_workspace'])
const textUnsafe = [
  /\[(?:TODO|TBD|INSERT|REPLACE)[^\]]*\]/i,
  /\b(?:CHANGEME|REPLACE_ME)\b/i,
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|[^/]+\.local)(?::\d+)?(?:\/|$)/i,
  /\bbc_oauth_[A-Za-z0-9_-]+\b/i,
  /\bBearer\s+(?:sk-[A-Za-z0-9_-]+|[A-Za-z0-9_-]{24,})\b/i,
]

function fail(path, message) { throw new Error(`${path}: ${message}`) }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) }
function sha(bytes) { return createHash('sha256').update(bytes).digest('hex') }
function safeText(value, path) {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'must be nonempty text')
  if (textUnsafe.some((pattern) => pattern.test(value))) fail(path, 'unsafe public text')
}

function schema(value, path) {
  if (!object(value)) fail(path, 'schema must be an object')
  for (const key of Object.keys(value)) if (!SCHEMA_KEYS.has(key)) fail(`${path}.${key}`, 'unsupported schema keyword')
  if ('description' in value) safeText(value.description, `${path}.description`)
  if ('type' in value && !(typeof value.type === 'string' ||
      (Array.isArray(value.type) && value.type.length && value.type.every((type) => typeof type === 'string')))) {
    fail(`${path}.type`, 'invalid type')
  }
  if ('properties' in value) {
    if (!object(value.properties)) fail(`${path}.properties`, 'must be an object')
    for (const [name, child] of Object.entries(value.properties)) schema(child, `${path}.properties.${name}`)
  }
  if ('required' in value && !(Array.isArray(value.required) && value.required.every((name) => typeof name === 'string'))) {
    fail(`${path}.required`, 'must be an array of names')
  }
  if ('additionalProperties' in value && typeof value.additionalProperties !== 'boolean') {
    schema(value.additionalProperties, `${path}.additionalProperties`)
  }
  if ('items' in value) schema(value.items, `${path}.items`)
  for (const key of ['oneOf', 'anyOf', 'allOf']) {
    if (!(key in value)) continue
    if (!Array.isArray(value[key]) || !value[key].length) fail(`${path}.${key}`, 'must be a nonempty array')
    value[key].forEach((child, index) => schema(child, `${path}.${key}[${index}]`))
  }
  if ('not' in value) schema(value.not, `${path}.not`)
  if ('enum' in value && (!Array.isArray(value.enum) || !value.enum.length)) fail(`${path}.enum`, 'must be a nonempty array')
  for (const key of ['minimum', 'maximum', 'exclusiveMinimum', 'minLength', 'maxLength', 'minItems', 'maxItems']) {
    if (key in value && (typeof value[key] !== 'number' || !Number.isFinite(value[key]))) fail(`${path}.${key}`, 'must be a finite number')
  }
  if ('pattern' in value) {
    if (typeof value.pattern !== 'string') fail(`${path}.pattern`, 'must be text')
    try { new RegExp(value.pattern) } catch { fail(`${path}.pattern`, 'invalid regular expression') }
  }
}

async function filesUnder(root, dir) {
  const full = join(root, dir)
  if (!(await lstat(full)).isDirectory()) fail(dir, 'must be a directory')
  const result = []
  for (const item of (await readdir(full)).sort()) {
    const path = join(dir, item)
    const stat = await lstat(join(root, path))
    if (stat.isSymbolicLink()) fail(path, 'symlinks are forbidden')
    if (stat.isDirectory()) result.push(...await filesUnder(root, path))
    else if (stat.isFile()) result.push(path)
    else fail(path, 'must be a regular file')
  }
  return result
}

export async function readPublicAgentContract(root = process.cwd()) {
  root = resolve(root)
  const toolPaths = await filesUnder(root, 'contracts/mcp/tools')
  if (toolPaths.length !== 113 || toolPaths.some((path) => !/^contracts\/mcp\/tools\/[a-z][a-z0-9_]*\.json$/.test(path))) {
    fail('contracts/mcp/tools', `expected exactly 113 tool JSON files, found ${toolPaths.length}`)
  }
  const guides = await filesUnder(root, 'contracts/mcp/guides')
  if (guides.some((path) => !path.endsWith('.md'))) fail('contracts/mcp/guides', 'guides must be Markdown')
  const pluginFiles = await filesUnder(root, 'plugins/bitterclip')
  const skillPaths = pluginFiles.filter((path) => /\/skills\/[^/]+\/SKILL\.md$/.test(path))
  if (skillPaths.map((path) => path.split('/')[3]).sort().join(',') !== SKILL_NAMES.join(',')) {
    fail('plugins/bitterclip/skills', 'expected the four canonical skills')
  }
  const paths = [...toolPaths, ...guides, ...pluginFiles,
    '.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json'].sort()
  const bytes = new Map()
  for (const path of paths) {
    const stat = await lstat(join(root, path))
    if (!stat.isFile()) fail(path, 'must be a regular file')
    bytes.set(path, await readFile(join(root, path)))
  }
  const tools = new Map()
  for (const path of toolPaths) {
    let tool
    try { tool = JSON.parse(bytes.get(path).toString('utf8')) } catch (error) { fail(path, `invalid JSON: ${error.message}`) }
    if (!object(tool)) fail(path, 'must be an object')
    for (const key of Object.keys(tool)) if (!TOOL_KEYS.has(key)) fail(`${path}.${key}`, 'Rails-owned or unknown field')
    if (!TOOL_NAME.test(tool.name) || path !== `contracts/mcp/tools/${tool.name}.json`) fail(path, 'tool name and filename differ')
    if (tools.has(tool.name)) fail(path, 'duplicate tool name')
    safeText(tool.title, `${path}.title`)
    safeText(tool.description, `${path}.description`)
    schema(tool.input_schema, `${path}.input_schema`)
    if (tool.input_schema.type !== 'object') fail(`${path}.input_schema.type`, 'root input must be an object')
    if ('output_schema' in tool) schema(tool.output_schema, `${path}.output_schema`)
    if ('live_workspace' in tool) {
      if (tool.name !== 'workspace_open' || !object(tool.live_workspace) ||
          Object.keys(tool.live_workspace).sort().join(',') !== 'description,opened_description,title,workspace_binding_schema') {
        fail(`${path}.live_workspace`, 'invalid profile variant')
      }
      for (const key of ['title', 'description', 'opened_description']) safeText(tool.live_workspace[key], `${path}.live_workspace.${key}`)
      schema(tool.live_workspace.workspace_binding_schema, `${path}.live_workspace.workspace_binding_schema`)
    }
    if (!Array.isArray(tool.errors) || !tool.errors.every((error) => typeof error === 'string')) fail(`${path}.errors`, 'invalid errors')
    if (!Array.isArray(tool.examples)) fail(`${path}.examples`, 'invalid examples')
    tools.set(tool.name, tool)
  }
  let totalSkillBytes = 0
  for (const path of skillPaths) {
    const name = path.split('/')[3]
    const content = bytes.get(path).toString('utf8')
    if (!Buffer.from(content, 'utf8').equals(bytes.get(path))) fail(path, 'must be UTF-8')
    if (!content.startsWith(`---\nname: ${name}\n`) || !content.includes('\n---\n')) fail(path, 'invalid skill frontmatter')
    safeText(content, path)
    totalSkillBytes += bytes.get(path).length
  }
  if (totalSkillBytes > 64 * 1024) fail('plugins/bitterclip/skills', 'skill bundle exceeds 64 KiB')
  for (const path of guides) safeText(bytes.get(path).toString('utf8'), path)
  for (const path of paths.filter((path) => path.endsWith('.json') && !toolPaths.includes(path))) {
    try { JSON.parse(bytes.get(path).toString('utf8')) } catch (error) { fail(path, `invalid JSON: ${error.message}`) }
  }
  const digest = sha(paths.map((path) => `${path}\0${sha(bytes.get(path))}\n`).join(''))
  if (!SHA256.test(digest)) fail('contract', 'digest failed')
  return { digest, tools, paths, skillPaths, guides }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const contract = await readPublicAgentContract(process.argv[2] || process.cwd())
  console.log(JSON.stringify({ digest: contract.digest, tools: contract.tools.size,
    skills: contract.skillPaths.length, guides: contract.guides.length }))
}
