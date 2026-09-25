# Data Governance and Incident Response

> Status: deployment gate for the public Lumbre demonstration. This engineering
> policy is not a substitute for legal advice or a legally complete privacy
> notice.

## 1. Scope and hard boundary

The deployed production profile is a public demonstration. It enables public
catalog reads and an anonymous cart. Authentication, membership enrollment,
event reservations, authenticated presets, orders, payments, and administrative
mutations remain disabled.

Those capabilities must not be enabled until all of the following exist:

- the legal identity and service address of the data controller;
- a monitored contact channel and procedure for data-subject requests;
- approved purposes, processors, transfers, and retention periods;
- account deletion or anonymization behavior tested at the API and database
  layers;
- production email/payment providers and secrets with named owners;
- a reviewed integral privacy notice shown before personal data is collected.

The public `/privacidad` page therefore describes the limited technical demo;
it explicitly does not claim to be the missing integral notice.

## 2. Current data inventory and retention

| Data | Purpose and storage | Current retention | Enforcement |
| --- | --- | --- | --- |
| Public catalog and editorial content | Serve recipes, ingredients, products, events, and reviewed hypotheses | Until replaced by a reviewed version | Versioned source and D1 seed |
| Anonymous session ID | Protect one visitor's cart without identity data | 30 days after last cart activity | Protected cookie plus D1 expiry; daily scheduled deletion |
| Anonymous cart items | Restore product IDs and quantities for that anonymous session | Same as the anonymous session | Cascading D1 deletion |
| Browser fire presets | Let a visitor reuse a plan without an account | Until the visitor deletes the preset or site storage | Browser `localStorage`; never sent to D1 while anonymous |
| Application request logs | Diagnose API failures using request ID, method, path, status, and duration | Up to 3 days on the current Workers Free plan | Cloudflare Workers Logs provider limit |
| Rate-limit actor key | Protect cart mutations from abuse using an anonymous session ID or client address | Provider-managed rate-limit window | Not written to an application table or custom log |
| D1 Time Travel history | Recover from destructive database changes | 7 days on the current Workers Free plan | Cloudflare-managed point-in-time recovery |
| Manual D1 exports | Pre-migration recovery and restore rehearsal | Delete within 7 days after validation unless attached to an active incident | Git-ignored local directory; operator-owned deletion |
| Synthetic-monitor artifacts | Diagnose staging failures using public content and synthetic evidence | 14 days | GitHub Actions artifact setting |
| Local automation reports | Learning and local diagnostics with synthetic identities | Developer-controlled; remove before sharing a machine | Git-ignored local reports directory |

Lumbre application logs must never contain request or response bodies, cookies,
session identifiers, authorization material, names, email addresses, delivery
notes, provider secrets, or payment data. Test reports use `.example.test`
identities and must never target real customer records.

Cloudflare may process network metadata as the infrastructure provider. Lumbre
does not add advertising analytics, fingerprinting, or behavioral profiling.

## 3. Dormant data model

The local/test model already exercises names, emails, authenticated sessions,
preferences, explicit newsletter-consent history, orders, delivery notes,
reservations, administrative audit records, and provider event hashes. This is
test capability, not authorization to process those fields in production.

The following retention decisions are intentionally unresolved and block those
features from production:

- customer/account closure and downstream order anonymization;
- statutory order and transaction retention;
- consent and administrative audit retention;
- expired authentication and verification-record cleanup;
- deletion of local-only magic-link delivery URLs before any production email
  adapter is enabled.

## 4. Ownership

| Role | Current owner | Responsibility |
| --- | --- | --- |
| Data owner | Repository owner | Approves collection, purpose, retention, and public notice changes |
| Incident commander | Repository owner | Classifies incidents, freezes deployments, and coordinates recovery |
| Technical responder | Repository owner | Investigates Worker, D1, deployment, and automation evidence |
| Communications/legal reviewer | Unassigned — production blocker | Determines notification and external communication obligations |
| Secondary incident owner | Unassigned — production blocker | Provides independent verification and coverage |

No live personal-data feature may be enabled while either production-blocking
role is unassigned.

## 5. Incident classification

- **SEV-1:** confirmed or credible unauthorized access, secret disclosure,
  personal-data exposure, payment-integrity failure, destructive production
  corruption, or loss of administrative control.
- **SEV-2:** persistent deployed health/D1 failure, repeated security-control
  failure, restore failure, elevated server errors, or unavailable critical
  public functionality without confirmed disclosure.
- **SEV-3:** isolated staging-monitor failure, transient provider/network event,
  or non-critical defect with a safe workaround.

SEV-1 and SEV-2 block deployments immediately. A staging synthetic failure
starts as SEV-3; it becomes SEV-2 when one manual rerun reproduces the failure
or health/D1 readiness is visibly degraded.

## 6. Response procedure

1. **Detect and identify.** Record UTC time, environment, deployment version,
   request IDs, affected routes, and reporter without copying sensitive payloads.
2. **Classify and contain.** Stop promotions; disable affected writes or the
   Worker when continued processing creates risk. Revoke exposed credentials
   rather than merely deleting them from Git.
3. **Preserve evidence.** Save relevant metadata, sanitized logs, deployment
   identifiers, and database bookmarks. Never attach raw D1 exports to public
   issues or test reports.
4. **Eradicate.** Patch the cause, rotate secrets, remove unauthorized access,
   or restore D1 using the reviewed recovery runbook.
5. **Validate.** Run health, security, catalog, and browser smoke checks against
   the affected environment before reopening traffic or writes.
6. **Communicate.** The assigned legal/communications reviewer determines
   whether users, providers, or authorities must be notified and approves the
   content and timing. Do not improvise legal conclusions in a public issue.
7. **Recover and review.** Monitor the corrected environment, document impact
   and timeline, create owned follow-up actions, and test the missing control.

## 7. Evidence handling

- Use request IDs, hashes, counts, timestamps, and redacted examples whenever
  they are sufficient.
- Restrict D1 exports and provider logs to responders who need them.
- Do not place secrets or personal data in commits, GitHub issues, Actions
  summaries, screenshots, HTML reports, or chat transcripts.
- Record credential rotation and revocation without recording secret values.
- An incident hold may extend normal deletion only for the minimum evidence
  required; the incident commander records its scope and release date.

## 8. Review triggers

Review this policy and `/privacidad` before any new data field, cookie, provider,
tracking technology, authenticated production route, payment flow, retention
job, or cross-border transfer. Review it after every SEV-1/SEV-2 incident and at
least before each production release.

Legal and platform references:

- [Mexico's current Federal Law on Protection of Personal Data Held by Private Parties](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf)
- [Cloudflare Workers Logs retention and pricing](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
