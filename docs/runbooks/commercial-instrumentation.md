# Commercial claims and instrumentation

Status: **current public-repository authority**

This public repository owns truthful product claims and privacy-safe interaction
emitters. It does not own customer evidence, cost structure, conversion targets,
abuse analysis, cohort results, or commercial interpretation.

Authorized maintainers with the adjacent private product checkout must continue
at:

`../../../bitterclip/docs/telemetry/README.md`

The product's commercial contract lives at:

`../../../bitterclip/docs/product/pricing-and-market-plan.md`

Private homepage sequencing, copy rationale, and learning questions live at:

`../../../bitterclip/docs/product/homepage-commercial-story.md`

Those paths are local cross-repository pointers, not public-product links. When
the private checkout is unavailable, verify only what the public site currently
claims and do not invent shipped product behavior or experiment rationale.

## Change order

1. Verify the owner ruling and target contract in the private product repo.
2. Add backward-compatible private event consumers when semantics change.
3. Ship and verify product behavior.
4. Update public copy and neutral emitters.
5. Verify the homepage, signup handoff, checkout, and attribution custody.
6. Interpret the result only in the private lane.

Never publish a claim ahead of the behavior it depends on.

## Neutral event contract

Public events describe visible interaction rather than commercial judgment:

| Event | Required neutral properties |
|---|---|
| `hero_cta_click` | `placement`, `plan_intent` |
| `proof_cta_click` | `placement`, `plan_intent` |
| `pricing_cta_click` | `placement`, `plan_intent` |
| `proof_video_play` | `placement` |
| `proof_video_quartile` | `placement`, `quartile` |
| `proof_video_complete` | `placement` |
| `pricing_view` | `placement` |
| `agent_portability_view` | `placement` |
| `faq_open` | `placement`, `faq_id` |

Allowed shared context is route, viewport class, first-party session/event
deduplication state, and privacy-safe campaign custody. Do not emit prompt text,
transcripts, media names, account or user identifiers, email, provider payloads,
or customer content.

Event names and placement identifiers are public implementation facts. Their
target rates, observed rates, winning/losing interpretation, and customer
segments are private.

## Attribution custody

Preserve supported UTM parameters and `bc_*` campaign fields from landing through
signup and the product-side checkout bridge. Do not add ad-network identifiers to
public documentation merely because the implementation can receive them. Keep
payloads bounded and covered by the applicable public privacy policy.

Instrumentation must never block navigation, playback, signup, or checkout. An
analytics outage is a missing observation, not a customer-facing failure.

## Public-copy rule

Public copy may state verified product truth, pricing, trial terms, and the role
of the embedded or external agent. It must not include the internal reason a
phrase was selected, acceptable conversion thresholds, trial unit economics,
named customer evidence, or an abuse model.

When changing the homepage, follow `homepage.md` and `public-content.md` as well.
Update the Vue route, authored Markdown twin, metadata/structured data, generated
surfaces, changelog, and smoke assertions as one coherent public semantic change.

Do not retain copy-research journals or truth-audit reasoning in this public
repository. Preserve durable public conclusions in page copy, this neutral
runbook, and `CHANGELOG.md`; preserve commercial interpretation in the private
homepage authority linked above. Git history remains provenance for removed
public-era journals, not a current instruction surface.
