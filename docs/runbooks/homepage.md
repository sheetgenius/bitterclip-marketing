# Homepage runbook

Status: Current authority
Last verified: 2026-08-23

## Ownership

The homepage is `app/pages/index.vue`. The real `/` route—with navigation,
proposition, CTA, fine print, cinematic, responsive spacing, and section
boundary—is the acceptance surface. A lab route or isolated component is never
sufficient evidence.

`app/components/HeroIso4.vue` owns the production video shell and development
mount for the cinematic. `app/lib/hero-iso4/scene.ts` owns the canonical live
scene. Keep cinematic delivery changes there when homepage structure does not
need to change.

## Before editing

1. Read `CURRENT_STATE.md` and inspect `git status --short`.
2. Preserve unrelated and untracked work; stage by exact path.
3. If the change touches ISO4 visuals, use the authoring runbook.
4. If it touches a baked renderer input, run `bun run artifact:status` before
   and after. A changed boundary does not automatically authorize a bake.

## Coordinated public surface

The homepage HTML and its authored Markdown alternate are a product pair. When
changing durable homepage claims, navigation, route semantics, metadata, or
structured data, inspect and update as applicable:

- `app/pages/index.vue`
- `public/index.md`
- `README.md`
- `CHANGELOG.md`
- `modules/generated-surfaces.ts` when the route inventory itself changes
- `qa/smoke.spec.ts`

Do not hand-edit generated docs Markdown, `llms` bundles, sitemap entries, or
feeds. The public-content runbook explains the source boundary.

## Acceptance

- Inspect `/` at the actual target viewports, including cold load.
- Protect copy, CTA, navigation, machine, outputs, negative space, and section
  boundary.
- For production-video behavior, verify poster to video to terminal-poster
  handoffs, one-play behavior, visibility pause/resume, reduced motion, and one
  responsive download.
- Do not start a second development server when one already exists.

Run:

```bash
bun run docs:audit
git diff --check
bun run generate
bun run qa:smoke
```
