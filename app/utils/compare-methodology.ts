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

export const compareMethodology = (page: CompareMethodologyPage, supportEmail: string) => {
  const tally = compareTally(page.rows)
  const sourceCount = page.sources?.length ?? 0
  return [
    {
      term: 'Who wrote this',
      detail: 'The BitterClip team. We sell BitterClip, so read this as a vendor’s comparison rather than an independent review, and check the sources.',
    },
    {
      term: 'What we compared',
      detail: `${plural(tally.total, 'job')} a person brings to both products when turning long recordings into finished episodes and clips, from getting the recording in to what the monthly bill buys. Jobs ${page.competitor} does better are included.`,
    },
    {
      term: 'How each row is called',
      detail: `A row goes to the product that does that job better. When both do it well in different ways, or neither clearly wins, it is a tie. Every comparison gives at least two rows to the other product or to a tie. This one: BitterClip ${tally.bitterclip}, ${page.competitor} ${tally.competitor}, tie ${tally.even}.`,
    },
    {
      term: 'Where the facts come from',
      detail: `${page.competitor}’s prices, limits, and terms come from the ${plural(sourceCount, 'public source')} listed at the end of this page, mostly its own pricing, help, and legal pages. Prices are the US-dollar prices those pages listed on the check date. BitterClip’s side describes what every customer on the named plan had that day; features still in private testing are left out.`,
    },
    {
      term: 'When it was checked',
      detail: `${formatReviewed(page.reviewed)}. The date changes only when the facts are checked again.`,
    },
    {
      term: 'Corrections',
      detail: `If something here is wrong or out of date, email ${supportEmail} and we will fix the page.`,
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
