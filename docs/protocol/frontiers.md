# Frontiers of excellence (review rubric)

We round-robin adversarial reviews across these dimensions. A page — and the set — is
"baked" only when each frontier passes. Refine these criteria every run (see `run-log.md`).

1. **Accuracy & verification** — Passes when: every factual claim is traceable to the
   product (repo / live app / existing pages); no invented features; volatile specifics
   (prices, plan names) are linked, not stated.
2. **Voice & humanity** — Passes when: warm, plain, second-person; reads like a person wrote
   it for a friend; no AI-writing tells (reflexive rule-of-three, em-dash overuse, inflated
   adjectives, "dive in", hollow hedging); varied sentence length. Humanizer-clean.
3. **Clarity & accessibility** — Passes when: task-first; scannable (headings, short
   paragraphs, numbered steps); terms defined in plain words; a non-technical creator can
   follow it unaided.
4. **Structure & maintainability (DRY)** — Passes when: every reused fact is single-sourced
   (snippet / data file), never copy-pasted; frontmatter consistent; file tree predictable;
   updating an evolving API touches ONE place. Co-equal with Voice.
5. **Completeness** — Passes when: covers the job end-to-end — prerequisites, the happy path,
   gotchas, troubleshooting, and next-step links.
6. **Consistency** — Passes when: terminology (Recording / Episode / Clip), formatting, and
   callout conventions match across all pages.
7. **Discoverability** — Passes when: titles/descriptions/nav are strong; pages cross-link;
   the machine-readable (`.md` / `llms.txt`) surface is generated and current.

**Round-robin protocol:** each review cycle assigns agents to a rotating subset of frontiers
so every dimension gets repeated, adversarial coverage across cycles. Cross-provider review
(Codex xhigh) runs periodically as an independent check, weighted toward Accuracy + Structure.
