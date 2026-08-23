export interface Iso4ReleaseVariant {
  key: string
  media: string
  width: number
  height: number
  mp4Url: string
  mp4Sha256: string
  mp4Bytes: number
  openingPosterUrl: string
  openingPosterSha256: string
  terminalPosterUrl: string
  terminalPosterSha256: string
}

export interface Iso4ReleaseManifest {
  schema: 'bitterclip.programmable_artifact_generation.v1'
  artifactId: 'homepage-iso4'
  generation: string | null
  definitionFingerprint: string | null
  sceneDurationMs: number
  durationMs: number
  fps: 60
  frameCount: number
  terminalFrame: number
  variants: Iso4ReleaseVariant[]
}

export const ISO4_RELEASE_VARIANT_CONTRACTS = Object.freeze([
  { key: 'mobile', media: '(max-width: 599px)', width: 440, height: 956 },
  { key: 'tablet', media: '(min-width: 600px) and (max-width: 959px)', width: 768, height: 900 },
  // H.264 yuv420p requires even coded dimensions. The canonical acceptance
  // viewport remains 1817 CSS px wide; the master keeps the extra edge pixel
  // and cover-crops one half-pixel per side rather than silently discarding it.
  { key: 'tall', media: '(min-width: 960px) and (max-aspect-ratio: 4/3)', width: 1818, height: 1454 },
  { key: 'classic', media: '(min-width: 960px) and (min-aspect-ratio: 4/3) and (max-aspect-ratio: 3/2)', width: 1400, height: 1000 },
  { key: 'standard', media: '(min-width: 960px) and (min-aspect-ratio: 3/2) and (max-aspect-ratio: 17/10)', width: 1600, height: 1000 },
  { key: 'wide-band', media: '(min-width: 960px) and (min-aspect-ratio: 17/10)', width: 1920, height: 900 },
] satisfies Array<Pick<Iso4ReleaseVariant, 'key' | 'media' | 'width' | 'height'>>)

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const GENERATION_PATTERN = /^artg_[a-z0-9]{20}$/

function immutableGenerationUrl(value: string, fingerprint: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && !url.pathname.toLowerCase().includes('/latest')
      && url.pathname.split('/').includes(fingerprint)
  } catch {
    return false
  }
}

export function iso4ManifestIsReady(manifest: Iso4ReleaseManifest) {
  const fingerprint = manifest.definitionFingerprint ?? ''
  if (!manifest.generation?.match(GENERATION_PATTERN)
    || !fingerprint.match(SHA256_PATTERN)
    || manifest.sceneDurationMs !== 14_008
    || manifest.durationMs !== 14_367
    || manifest.fps !== 60
    || manifest.frameCount !== 862
    || manifest.terminalFrame !== 841
    || manifest.variants.length !== ISO4_RELEASE_VARIANT_CONTRACTS.length) {
    return false
  }

  const urls: string[] = []
  for (let index = 0; index < ISO4_RELEASE_VARIANT_CONTRACTS.length; index++) {
    const expected = ISO4_RELEASE_VARIANT_CONTRACTS[index]!
    const variant = manifest.variants[index]
    if (!variant
      || variant.key !== expected.key
      || variant.media !== expected.media
      || variant.width !== expected.width
      || variant.height !== expected.height
      || variant.mp4Bytes <= 0
      || !variant.mp4Sha256.match(SHA256_PATTERN)
      || !variant.openingPosterSha256.match(SHA256_PATTERN)
      || !variant.terminalPosterSha256.match(SHA256_PATTERN)) {
      return false
    }
    const variantUrls = [variant.mp4Url, variant.openingPosterUrl, variant.terminalPosterUrl]
    if (!variantUrls.every((url) => immutableGenerationUrl(url, fingerprint))) return false
    urls.push(...variantUrls)
  }
  return new Set(urls).size === urls.length
}

// This file is the only production publication pointer. Generated media never
// enters the marketing repository: a release command first publishes an
// immutable BitterClip Artifact generation, then patches these content-
// addressed URLs. An absent generation deliberately leaves production on the
// immediate SSR poster instead of silently importing the live Three.js scene.
export const iso4Release: Iso4ReleaseManifest = {
  schema: 'bitterclip.programmable_artifact_generation.v1',
  artifactId: 'homepage-iso4',
  generation: null,
  definitionFingerprint: null,
  sceneDurationMs: 14_008,
  durationMs: 14_367,
  fps: 60,
  frameCount: 862,
  terminalFrame: 841,
  variants: [],
}

export const iso4ReleaseReady = iso4ManifestIsReady(iso4Release)
