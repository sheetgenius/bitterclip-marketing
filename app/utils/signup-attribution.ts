export const SIGNUP_BASE_URL = 'https://app.bitterclip.com/sign_up'

export const ACQUISITION_PARAM_NAMES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'ttclid',
  'msclkid',
] as const

type QueryValue = string | null | undefined | Array<string | null>

type SignupUrlOptions = {
  baseUrl?: string
  query?: Record<string, QueryValue>
  plan?: string
  surface: string
  stage?: string
  landingPath?: string
}

const valueFromQuery = (value: QueryValue): string | null => {
  const raw = Array.isArray(value) ? value[0] : value
  const clean = raw?.trim()
  return clean ? clean.slice(0, 200) : null
}

const internalValue = (value: string | undefined, fallback: string): string => {
  const clean = value?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '')
  return (clean || fallback).slice(0, 80)
}

/**
 * Carry the visitor's original acquisition data into the app without letting
 * BitterClip's own CTA metadata overwrite it. Internal page/demo context uses
 * bc_* fields so paid-channel UTMs retain their original meaning.
 */
export function buildSignupUrl({
  baseUrl = SIGNUP_BASE_URL,
  query = {},
  plan,
  surface,
  stage = 'default',
  landingPath = '/',
}: SignupUrlOptions): string {
  const url = new URL(baseUrl)
  if (plan) url.searchParams.set('plan', plan)

  let hasInboundAcquisition = false
  for (const name of ACQUISITION_PARAM_NAMES) {
    const value = valueFromQuery(query[name])
    if (!value) continue
    hasInboundAcquisition = true
    url.searchParams.set(name, value)
  }

  const cleanSurface = internalValue(surface, 'marketing')
  const cleanStage = internalValue(stage, 'default')
  if (!hasInboundAcquisition) {
    url.searchParams.set('utm_source', 'bitterclip.com')
    url.searchParams.set('utm_medium', 'owned')
    url.searchParams.set('utm_campaign', cleanSurface)
    url.searchParams.set('utm_content', cleanStage)
  }

  url.searchParams.set('bc_surface', cleanSurface)
  url.searchParams.set('bc_stage', cleanStage)
  url.searchParams.set('bc_landing_path', landingPath.slice(0, 200))
  // Keep the existing handoff hint until every app-side consumer has moved to
  // the explicit bc_* fields.
  url.searchParams.set('from', `${cleanSurface}_${cleanStage}`)
  return url.toString()
}
