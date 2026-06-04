# Security And Public Boundary

This repository contains the public static website for BitterClip. It does not
contain the private BitterClip product application, media-processing backend,
customer data store, billing system, provider payload store, or private
operational runbooks.

## Reporting Sensitive Issues

Do not post secrets, credentials, customer data, private recordings, provider
payloads, or exploit details in public GitHub issues or pull requests.

If you have access to a private Bitter support or maintainer channel, report the
issue there. Otherwise, open a minimal public issue that says a private security
report is needed, without including sensitive details.

## What Belongs Here

Appropriate public reports include:

- broken public links
- incorrect public product context
- missing or stale sitemap, robots, Markdown, or `llms.txt` entries
- accessibility or rendering issues on the public marketing site
- public repository hygiene issues that do not disclose secrets

Sensitive reports include:

- exposed keys, tokens, cookies, or credentials
- private deployment or registry material
- customer data or private media
- private operational details
- product-app vulnerabilities outside this static marketing site

## Maintainer Response

If sensitive material appears in this public repository, remove it from the
public surface, rotate affected credentials when applicable, and record only a
sanitized public changelog note.
