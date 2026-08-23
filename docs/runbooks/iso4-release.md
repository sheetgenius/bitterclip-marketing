# ISO4 release runbook

Status: Current authority
Last verified: 2026-08-23

## What happens on an ordinary deploy

Nothing renders. Nuxt imports `app/lib/hero-iso4/release.ts`, builds HTML around
the already accepted immutable generation, and deploys the static site. This is
deliberate: changing docs, copy, or repository metadata must not invoke Chrome,
Three.js, FFmpeg, or BitterClip Artifact publication.

Run this first:

```bash
bun run artifact:status
```

The command compares the current declared renderer inputs with the checked-in
receipt of the accepted bake. It lists exact changed, added, and removed inputs.
It exits successfully by default so ordinary deployments stay fast. CI or a
release operator may use `bun run artifact:status -- --require-clean` when a
clean boundary is a prerequisite.

## Release custody

The flow is explicit and fail-closed:

```text
accepted live scene
→ deterministic six-family homepage bakes under tmp/
→ controlled CRF encodes and exact posters
→ strict source/asset release packet
→ BitterClip content-addressed generation publication
→ public URL/hash/range verification
→ generation acceptance with compare-and-swap
→ marketing manifest selection
→ generated-site and deployed-homepage acceptance
```

An unchanged Artifact definition fingerprint reuses the existing generation.
Publication does not select it; acceptance and the marketing pointer are
separate. A failure must leave `app/lib/hero-iso4/release.ts` untouched.

## Bake and packet tools

All outputs must be new paths below ignored `tmp/`:

```bash
bun run artifact:bake -- tmp/iso4-homepage-workshop/artifact-delivery/<release>/<profile> \
  --viewport <width>x<height> --dpr 1 --url http://localhost:4180/

bun run artifact:encode -- --input <lossless-master> --output <new-encode-output>

bun run artifact:packet -- --self-test
bun run qa:artifact-promote
```

Use `bun run artifact:bake -- --help` and
`bun run artifact:packet -- --help` for the strict current arguments. The packet
requires all six variant receipts plus declarations that exactly cover the
renderer-input set in `qa/iso4-artifact-provenance.mjs`; it rejects omissions,
extras, symlinks, fallback media, and paths outside the repository. Do not copy
an old command blindly when its receipts or acceptance version have changed.

The accepted variant contracts are defined once in
`app/lib/hero-iso4/release.ts`: mobile, tablet, tall, classic, standard, and
wide-band. The binding encode is silent H.264 High Profile, CFR 60fps,
`yuv420p`, BT.709, faststart, two-second GOP, slow preset, CRF 18, with exact
opening and terminal WebP posters. Recompare compression when the image changes
materially rather than assuming old metrics remain representative.

## Promotion and rollback

`qa/iso4-artifact-promote.mjs` never uploads or accepts. Its `verify` phase
checks the separately published BitterClip generation at immutable public URLs,
including byte hashes, sizes, types, cache policy, and MP4 range responses, then
emits an acceptance request under `tmp/`. Its `finalize` phase consumes the
separate BitterClip acceptance result and emits the exact marketing manifest
candidate.

Only after those receipts pass should `app/lib/hero-iso4/release.ts` be updated.
In the same release change, copy the newly accepted bake's validated renderer
receipt and generation provenance into
`config/iso4-accepted-renderer-inputs.json`. That record must describe the bytes
actually baked; never update it merely to silence `artifact:status`.
Rollback selects the prior ready, accepted generation in that same file and
reruns homepage acceptance; it never rerenders and never points to a mutable
`latest` URL.

The BitterClip-side custody model and operations are documented in
`/Users/c3po/co/bitterclip/docs/build/artifact-generation-custody-contract-2026-08-23.md`.
Product credentials and provider receipts remain outside this public repo.

## Final gates

```bash
bun run artifact:status -- --require-clean
bun run artifact:packet -- --self-test
bun run qa:artifact-promote
git diff --check
bun run generate
bun run qa:smoke
```

Then run the focused deterministic, playback, cold-load, responsive, WebKit,
and static/production Lighthouse checks appropriate to the changed generation.
Acceptance is the real homepage. Do not claim release readiness from a lab page,
deterministic stills alone, or a development-server Lighthouse score.
