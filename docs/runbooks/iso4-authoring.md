# ISO4 authoring runbook

Status: Current authority
Last verified: 2026-08-23

## Mental model

The Three.js scene is the editable movie project. Development renders it live on
the actual homepage. Production visitors receive an accepted video generation,
not the scene runtime.

## Read order

1. `CURRENT_STATE.md`
2. `docs/hero-iso4-brief.md`—the binding owner rulings
3. the latest relevant section of `docs/hero-iso4-workshop-journal.md`
4. `app/components/HeroIso4.vue`
5. `app/lib/hero-iso4/scene.ts`

The older `hero-iso-*` documents describe predecessor concepts. Preserve ISO3;
do not use it as a convenient implementation surface for ISO4.

## Workshop contract

- Judge and capture `/`, not `/lab/iso4`.
- Preserve deterministic seeking and release diagnostics.
- Inspect the real homepage copy, CTA, navigation, negative space, responsive
  camera family, and section boundary.
- Keep accepted mechanics locked unless new homepage evidence proves a
  regression.
- Store rendered evidence under ignored `tmp/iso4-homepage-workshop/` and append
  concise conclusions and absolute paths to the workshop journal.
- Do not commit frame sequences, contact sheets, captured videos, or bake output.

The release renderer hashes a conservative custody boundary including the scene,
hero component, homepage, core layout/style, source media, dependency lockfile,
Nuxt/package configuration, and bake tooling. After a scene pass, run:

```bash
bun run artifact:status
```

`clean` means the accepted movie still represents those inputs. `dirty` means a
new deliberate release or a reviewed custody-boundary reconciliation is needed
before claiming that current source is in production. It does not make every
ordinary marketing deployment render a movie.

## Acceptance before a release request

- deterministic and continuous homepage passes;
- required responsive camera families;
- real source-media provenance;
- cold-load and hardware playback;
- no copy/CTA/viewport collisions;
- no frame-rate-dependent mechanics;
- updated binding brief and append-only journal entry;
- `git diff --check`, generated build, and smoke tests.

Only then move to the ISO4 release runbook.
