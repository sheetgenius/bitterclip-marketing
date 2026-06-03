# BitterClip Marketing

Placeholder marketing site for `bitterclip.com`.

## Commands

```bash
bun install
bun run generate
bun run qa:smoke
```

## Email

`hello@bitterclip.com` (the early-access CTA address) is served by BitterInbox
hosted-domain webmail over SendGrid. DNS lives at Porkbun: ownership TXT,
SendGrid DKIM CNAMEs, `mx.sendgrid.net` MX, and a DMARC record.

### TODO: harden DMARC

DMARC was deployed on 2026-05-27 at `p=none` (observe-only) so we could watch
for alignment problems without dropping mail:

```
_dmarc.bitterclip.com TXT "v=DMARC1; p=none; rua=mailto:hello@bitterclip.com"
```

Once a few weeks of aggregate reports show SendGrid mail aligning cleanly,
tighten the policy to `p=quarantine` and then `p=reject`. Do not jump
straight to `p=reject` — confirm the reports are clean first.
