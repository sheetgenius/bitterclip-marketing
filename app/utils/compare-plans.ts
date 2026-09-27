// BitterClip's side of every comparison's price section. One place, so the
// twelve pages cannot quote twelve slightly different plans. Keep in step with
// the homepage pricing section (app/pages/index.vue).

import catalog from '../../tmp/mcp-catalog-snapshot.json'

export const BITTERCLIP_TRIAL = '$1 for 7 days, then $24/month'

// How many editing tools an outside agent (ChatGPT, Claude, Codex) gets: the
// default model profile of the MCP catalog this build pinned. Pages write
// `{tools}`; the number follows the serving surface instead of going stale.
export const MCP_TOOL_COUNT = catalog.profiles.model.descriptors.length
const TOOLS_TOKEN = /\{tools\}/g

// Replace `{tools}` in every string of a comparison page's data. Applied once
// where the data is loaded, so the page, its JSON-LD and its Markdown twin
// all say the same number.
export function fillCompareTokens<T>(value: T): T {
  if (typeof value === 'string') return value.replace(TOOLS_TOKEN, String(MCP_TOOL_COUNT)) as T
  if (Array.isArray(value)) return value.map((item) => fillCompareTokens(item)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillCompareTokens(item)])) as T
  }
  return value
}

// How BitterClip makes money, said the same way on the homepage, every
// comparison, the Markdown twins and llms.txt. The 15% and what it covers are
// the product's own terms (Rails AgentUsageSettlement).
export const BITTERCLIP_BUSINESS = "From the subscription, by building a good workbench, not by reselling AI. The built-in agent costs what OpenRouter billed for each request plus a flat 15%, which covers OpenRouter's fees, card processing and requests that fail after they're billed. Your own ChatGPT or Claude can run the whole editor on the plan you already pay for. We run the company lean, so the subscription is enough."

// Said on every comparison, next to the plans, and in every Markdown twin.
export const BITTERCLIP_CATCH = 'The $1 trial covers one recording up to two hours and $5 of AI agent use, card required, with watermarked exports. Studio and clean exports start on a paid plan.'

export const BITTERCLIP_PLANS = [
  {
    name: 'Creator',
    price: '$24',
    includes: [
      '10 hours of footage a month',
      '$10 of AI agent use a month',
      `The whole editor for your own ChatGPT, Claude or Codex (${MCP_TOOL_COUNT} tools)`,
      'Live Studio with a guest',
      'Clean exports, files up to 4 GB',
    ],
  },
  {
    name: 'Producer',
    price: '$99',
    includes: [
      'Everything in Creator',
      '40 hours of footage a month',
      '$40 of AI agent use a month',
      'Async recording: one link, up to 25 people, no account needed',
      'Priority rendering, files up to 20 GB',
    ],
  },
] as const

// Search demand, not the alphabet: what people actually type first. Used by
// the hub and by each page's related comparisons.
export const COMPARE_PRIORITY = [
  'descript', 'riverside', 'zoom', 'opus-clip', 'capcut', 'submagic', 'captions',
  'veed', 'podcastle', 'kapwing', 'vizard', 'klap', 'munch',
]
export const compareRank = (path: string) => {
  const index = COMPARE_PRIORITY.indexOf(path.split('/').pop() ?? '')
  return index === -1 ? COMPARE_PRIORITY.length : index
}

// Related comparisons: same kind of tool first, then by search demand.
export const COMPARE_CATEGORIES = {
  recording: 'Recording tools',
  editing: 'Editors',
  clipping: 'Clip generators',
} as const

export type CompareCategory = keyof typeof COMPARE_CATEGORIES

// The proof section: a real one-minute cut made in BitterClip. The page and its
// Markdown twin both render these.
export const PROOF_NOTE_DEFAULT = "BitterClip's founder, Michael Ruescher, recorded a conversation about quitting a twelve-year job to build bitter.sh. This one-minute vertical cut came out of it, made in BitterClip."
export const PROOF_STEPS = [
  'The recording comes in and every word is transcribed, tied to the moment it was said.',
  'The agent makes a first cut; you direct it in plain words or by deleting words in the transcript.',
  'One tap makes the 9:16 version, captions and timing carried over.',
] as const
