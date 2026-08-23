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
  generation: 'artg_m4v4oeiuvgi8geltufb1',
  definitionFingerprint: '4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0',
  sceneDurationMs: 14_008,
  durationMs: 14_367,
  fps: 60,
  frameCount: 862,
  terminalFrame: 841,
  variants: [
    {
      key: 'mobile',
      media: '(max-width: 599px)',
      width: 440,
      height: 956,
      mp4Url: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/mobile-h264.mp4',
      mp4Sha256: '887b28977f18820136d9c0f360e8d7d1ca1900804c832ba9321f2d5c98e6b53c',
      mp4Bytes: 1_276_245,
      openingPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/mobile-opening.webp',
      openingPosterSha256: '96e1361f488bb9eb1cafff6e7b205c36a1ffebf3e460e038aeb4d65a47a98842',
      terminalPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/mobile-terminal.webp',
      terminalPosterSha256: 'd4139f75d8e3687bafe0244237123757d88d0bd4e81838b783e061e33717540c',
    },
    {
      key: 'tablet',
      media: '(min-width: 600px) and (max-width: 959px)',
      width: 768,
      height: 900,
      mp4Url: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/tablet-h264.mp4',
      mp4Sha256: '4e9c8dc384b9212606e6bdf71b45b223f8d3dcadd1d6eaad897edeb6108b5c5e',
      mp4Bytes: 1_312_037,
      openingPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/tablet-opening.webp',
      openingPosterSha256: 'e7f00ea02ca280852d5f98abdda45b3651d48f60338f45de1155fc31d1568cb0',
      terminalPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/tablet-terminal.webp',
      terminalPosterSha256: 'f171a037e5fce7911cd2c5da07413f989488904b4fd1f1b1d5accba9d32eee59',
    },
    {
      key: 'tall',
      media: '(min-width: 960px) and (max-aspect-ratio: 4/3)',
      width: 1818,
      height: 1454,
      mp4Url: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/tall-h264.mp4',
      mp4Sha256: 'b8debb8885ab5ac447f9b66f32bc76dccfacb4ee1452adbe857226521a000175',
      mp4Bytes: 3_443_278,
      openingPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/tall-opening.webp',
      openingPosterSha256: 'caeba63965b4e96ddc96da380a24d1eafa70c396bedd5d31c60b506e31525dbc',
      terminalPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/tall-terminal.webp',
      terminalPosterSha256: '58748d2d360b12a644c057b0f1ed5398b269672d871e76eb549f4c8fd02a8c2f',
    },
    {
      key: 'classic',
      media: '(min-width: 960px) and (min-aspect-ratio: 4/3) and (max-aspect-ratio: 3/2)',
      width: 1400,
      height: 1000,
      mp4Url: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/classic-h264.mp4',
      mp4Sha256: 'f429b6135cd3b95710dfe62eefd16f3d9b447b5fb9eaf5cd191e10aa9f5a03fa',
      mp4Bytes: 2_169_611,
      openingPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/classic-opening.webp',
      openingPosterSha256: 'a8a9d54f73f2e132d017e2220f368b4ed093e68bd6cf1185d37db5d132aeb061',
      terminalPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/classic-terminal.webp',
      terminalPosterSha256: 'c8ccb660a0bfa756436cab54ff350a78a4ec81c0563f270d88c65660116feba5',
    },
    {
      key: 'standard',
      media: '(min-width: 960px) and (min-aspect-ratio: 3/2) and (max-aspect-ratio: 17/10)',
      width: 1600,
      height: 1000,
      mp4Url: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/standard-h264.mp4',
      mp4Sha256: 'b1e146723d71789d95968697519f2c7d873b42d508a0a2e4cdef71534598fa27',
      mp4Bytes: 2_410_811,
      openingPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/standard-opening.webp',
      openingPosterSha256: '40d59ba837fd044531b3218d3d411286eb80570cb4f42890568f0a752ecdee43',
      terminalPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/standard-terminal.webp',
      terminalPosterSha256: '02eab2a5c141ed0db17db04f5774d5f300de7706b69e9d0a89218e8a29057ae8',
    },
    {
      key: 'wide-band',
      media: '(min-width: 960px) and (min-aspect-ratio: 17/10)',
      width: 1920,
      height: 900,
      mp4Url: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/wide-band-h264.mp4',
      mp4Sha256: 'ff045c867415221be390de15a8ef1da2c085d091df30d1464018ee10b2c27186',
      mp4Bytes: 2_324_374,
      openingPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/wide-band-opening.webp',
      openingPosterSha256: '366c3bb4f6c632a7f38f6a3f432853fce192147f1e0e8710425f28e2aea5b583',
      terminalPosterUrl: 'https://cdn.bitterclip.com/public-artifacts/v1/accounts/acct_eavhcrpcso1z/definitions/artd_zykh9cbhehwelho6lhct/generations/4e8c690670d979a763dd0d790fb29c66d84edbc193625f7823aab7bb5ff10ea0/wide-band-terminal.webp',
      terminalPosterSha256: '7655a1707b7e2b355396240e9fad36e8e82312d3537150900c18d63a82f7e0ed',
    },
  ],
}

export const iso4ReleaseReady = iso4ManifestIsReady(iso4Release)
