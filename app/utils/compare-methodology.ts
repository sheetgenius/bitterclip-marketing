// The per-page "How we compared" section. One source for the rendered
// /compare/<slug> page and its generated Markdown twin, so the method a person
// reads and the method an AI reader extracts cannot drift apart.

// Stated in words in the method below; change both together.
export const MIN_NON_BITTERCLIP_ROWS = 2

type Edge = 'bitterclip' | 'competitor' | 'even'

export interface CompareMethodologyPage {
  competitor: string
  reviewed: string
  rows: { edge?: Edge | string }[]
  sources?: unknown[]
}

export const compareTally = (rows: { edge?: string }[]) => ({
  total: rows.length,
  bitterclip: rows.filter((r) => r.edge === 'bitterclip').length,
  competitor: rows.filter((r) => r.edge === 'competitor').length,
  even: rows.filter((r) => r.edge === 'even').length,
})

const formatReviewed = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`))

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

// `sourceUrl` is this page's own file in the public repository.
export const compareMethodology = (page: CompareMethodologyPage, sourceUrl: string) => {
  const tally = compareTally(page.rows)
  const sourceCount = page.sources?.length ?? 0
  return [
    {
      term: 'Who wrote it',
      detail: `The BitterClip team. We sell BitterClip, so this is a vendor’s comparison: every fact about ${page.competitor} comes from the public sources listed on this page.`,
    },
    {
      term: 'How jobs are scored',
      detail: `Each job goes to the product that does it better, or is a tie when both do it well or the choice comes down to taste. Here: BitterClip ${tally.bitterclip}, ${page.competitor} ${tally.competitor}, tie ${tally.even}.`,
    },
    {
      term: 'Where the facts come from',
      detail: `${plural(sourceCount, 'public source')}, mostly ${page.competitor}’s own pricing, help, and legal pages. Prices are in US dollars as listed that day. BitterClip’s side covers what’s live for customers on the plan named.`,
    },
    {
      term: 'Corrections',
      detail: 'This page is open source. If something is wrong or out of date, edit its file on GitHub and open a pull request.',
      link: { label: 'Edit this page on GitHub', url: sourceUrl },
    },
  ]
}

// Build-time guard for the rule the method states.
export const assertCompareBalance = (slug: string, rows: { edge?: string }[]) => {
  const nonBitterclip = rows.filter((r) => r.edge !== 'bitterclip').length
  if (nonBitterclip < MIN_NON_BITTERCLIP_ROWS) {
    throw new Error(`compare/${slug}: ${nonBitterclip} rows go to the other product or a tie; the method requires at least ${MIN_NON_BITTERCLIP_ROWS}.`)
  }
}
