# Internal documentation map

Status: Current routing authority
Last verified: 2026-08-23

This directory contains both current operating guidance and preserved design
history. Detail is not authority: use the status table below before relying on a
document. Public creator documentation lives in `content/`, not here.

## Start here

1. Read [`CURRENT_STATE.md`](../CURRENT_STATE.md).
2. Read the applicable runbook.
3. Read only the binding brief or historical evidence needed for the task.
4. Verify the code and runtime before acting; dates and historical observations
   can drift.

| Task | Read next | Acceptance surface |
| --- | --- | --- |
| Homepage structure, copy, CTA, or layout | [`runbooks/homepage.md`](runbooks/homepage.md) | `/` with real navigation and copy |
| Public docs, blog, compare, routes, Markdown, sitemap, or `llms` | [`runbooks/public-content.md`](runbooks/public-content.md) | generated static site |
| Live ISO4 scene or visual workshop | [`runbooks/iso4-authoring.md`](runbooks/iso4-authoring.md), then [`hero-iso4-brief.md`](hero-iso4-brief.md) | `/`, never the lab alone |
| ISO4 bake, compression, Artifact promotion, or rollback | [`runbooks/iso4-release.md`](runbooks/iso4-release.md) | generated site and deployed `/` |
| Deployment or repository context | [`README.md`](../README.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md), and `config/deploy.yml` | generated site and `/up` |

## Authority levels

- **Current authority**: maintain when the implementation or contract changes.
- **Current evidence ledger**: append-only observations; the binding brief wins
  when a historical entry conflicts.
- **Current convention**: active authoring or review rules for its named scope.
- **Historical**: useful provenance, rejected options, or completed work. It is
  not an instruction to recreate the old state.
- **Submission snapshot**: reverify provider rules and product facts before use.

## Registry

| Document | Status | Use |
| --- | --- | --- |
| `docs/README.md` | Current authority | This map and status registry. |
| `docs/runbooks/homepage.md` | Current authority | Homepage ownership and coordinated-change checklist. |
| `docs/runbooks/public-content.md` | Current authority | Authored versus generated public surfaces. |
| `docs/runbooks/iso4-authoring.md` | Current authority | Live scene workshop and homepage acceptance. |
| `docs/runbooks/iso4-release.md` | Current authority | Renderer diff, bake, Artifact promotion, and rollback. |
| `docs/hero-iso4-brief.md` | Current binding design brief | Accepted ISO4 visual, mechanical, and delivery rulings. |
| `docs/hero-iso4-workshop-journal.md` | Current evidence ledger | Append-only ISO4 hypotheses, rounds, measurements, and evidence paths. |
| `docs/protocol/authoring-conventions.md` | Current convention | Creator-doc file layout, frontmatter, snippets, and data. |
| `docs/protocol/frontiers.md` | Current review rubric | Accuracy, voice, clarity, maintainability, and completeness checks. |
| `docs/protocol/run-log.md` | Historical evidence with a useful current-practice section | Docs-build history; reverify product facts. |
| `docs/protocol/content-architecture.md` | Historical design rationale | DRY content architecture that led to the current substrate. |
| `docs/protocol/build-plan.md` | Historical implementation plan | Planned page inventory; implementation has since shipped. |
| `docs/protocol/build-plan.json` | Historical machine-readable companion | Input used by the completed docs build; not a current task plan. |
| `docs/protocol/grounding-brief.md` | Historical product snapshot | June 2026 terminology and voice evidence; not authoritative now. |
| `docs/protocol/review-r1.md` | Historical review | Pre-publication fix list. |
| `docs/protocol/codex-review-r1.md` | Historical review | Product-grounded adversarial review. |
| `docs/protocol/codex-review-r1.summary.md` | Historical review summary | Pointer to the full Codex review. |
| `docs/docs-site-spec.md` | Historical design spec | Initial docs-site proposal, now implemented and evolved. |
| `docs/docs-site-spec.review.md` | Historical review | Adversarial review of the initial spec. |
| `docs/hero-iso-brief.md` | Historical predecessor | ISO1 design brief. Do not alter ISO3/ISO4 from this document. |
| `docs/hero-iso-nit-ledger.md` | Historical predecessor evidence | Earlier ISO workshop defects and dispositions. |
| `docs/hero-iso-workshop-start.md` | Historical workshop prompt | Earlier ISO workshop launch message. |
| `docs/homepage-promotion-audit.md` | Historical completed migration | Audit used to promote ISO4 to `/`. |
| `docs/homepage-copy-rd-journal.md` | Historical evidence | Homepage copy research and settled decisions at that time. |
| `docs/copy-truth-audit-2026-08-24.md` | Historical audit evidence | Copy-to-product-truth findings captured on 2026-08-24; reverify before applying. |
| `docs/landing-editor-conversion-analysis.md` | Historical study | Prior embedded-editor conversion analysis. |
| `docs/landing-editor-conversion-journal.md` | Historical evidence | Prior conversion workshop ledger. |
| `docs/sign-in-and-conversion-study-2026-06-17.md` | Historical study | Sign-in discovery findings from the prior homepage. |
| `docs/chatgpt-app-submission.md` | Submission snapshot | Public-only submission checklist; provider and product facts must be reverified. |
| `docs/anthropic-connector-submission.md` | Submission snapshot | Public-only submission checklist; provider and product facts must be reverified. |

`bun run docs:audit` checks that every tracked internal document is in
this registry, that current entrypoints do not reference retired page files,
that every Vue-owned authored route twin exists and is advertised, and that
binary workshop evidence has not been committed under `docs/`.

## Storage boundary

- `content/`: authored public docs, blog, compare pages, and shared public data.
- `docs/`: internal durable guidance and textual historical evidence.
- `public/`: deliberate public static assets and authored alternates for
  Vue-owned routes. Do not edit build-generated docs outputs here.
- `tmp/`: ignored renders, screenshots, videos, contact sheets, receipts, and
  other workshop evidence.

Do not promote a local evidence directory into `docs/` merely to make it easier
to find. Link its absolute path from the relevant journal entry while it is
useful; durable conclusions belong in text.
