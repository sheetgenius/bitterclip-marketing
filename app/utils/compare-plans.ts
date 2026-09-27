// BitterClip's side of every comparison's price section. One place, so the
// twelve pages cannot quote twelve slightly different plans. Keep in step with
// the homepage pricing section (app/pages/index.vue).

export const BITTERCLIP_TRIAL = '$1 for 7 days, then $24/month'

// Said on every comparison, next to the plans, and in every Markdown twin.
export const BITTERCLIP_CATCH = 'The $1 trial covers one recording up to two hours, card required, with watermarked exports. Studio and clean exports start on a paid plan.'

export const BITTERCLIP_PLANS = [
  {
    name: 'Creator',
    price: '$24',
    includes: [
      '10 hours of footage a month',
      '$10 of AI agent use a month',
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
      'Async recording: one link, up to 25 people',
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
