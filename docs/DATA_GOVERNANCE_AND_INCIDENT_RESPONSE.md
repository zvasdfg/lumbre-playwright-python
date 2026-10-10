# Static portal data boundaries and incident handling

Engineering scope: current portal, 2026-10-09. This is not a replacement for the
approved customer-facing privacy notice or store policies.

## Data boundaries

- Canonical recipes, ingredients and public product declarations are versioned
  build-time data in `portal/data/`.
- Saved plans and user blends stay in browser local/session storage. They remain
  until the user removes them or clears site data; storage is not a remote account.
- Purchasing leaves the portal for Tiendanube. Its customer/order/payment and
  shipping data are not managed by a Lumbre application database.
- Static hosting may process network metadata. This document does not assert
  provider retention periods or configure advertising/store tracking.
- Source retirement did not inspect, delete or revoke ignored backups, local
  credentials, historical remote records or provider settings.

## Evidence hygiene

Automation uses synthetic names and isolated browser contexts. Do not include
real customer records, secret values, cookies, personal data, payment details or
unredacted provider exports in commits, reports, issues or screenshots. Existing
historical evidence remains dated; a collected test is not a passing execution.

## Incident handling

The repository owner coordinates technical response. Record the time, affected
component, tested/deployed artifact identity and sanitized evidence. Contain
credible disclosure or unauthorized access, preserve evidence and rotate exposed
credentials through the owning provider. Validate the corrected build with its
local tests and publication hashes before promoting it. Store incidents require
the store's operational controls, not a removed portal backend.

Notification obligations and legal/customer communications require the
appropriate owner/reviewer; this technical cleanup does not determine them.
