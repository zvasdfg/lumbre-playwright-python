# Static-only source retirement — 2026-10-09

## Authorization and recovery

The owner explicitly authorized retiring the unused backend, then requested a
Git checkpoint before implementation. Checkpoint: `5652eddb3d8944a7508eb8ee2a21eca1205cd7ff`.
It preserves the numbered framework migration and expanded coverage before
source retirement. An additional touched-source archive exists locally at
`/tmp/lumbre-before-static-retirement-20261009.tar.gz`.
The completed cleanup is kept in a separate local commit for reversible review.
No push, deployment, remote database deletion, secret revocation or store write
was performed by this implementation.

## Scope

- Retired 152 tracked obsolete source/config/test/runner files, including the
  custom account/cart/order/payment, reservation/admin and database backend.
- Relocated 69 live files: shared data, all 60 ingredient JSON files, methodology,
  the almanac reader and shared CSS. New canonical paths are `portal/data/` and
  `portal/static/`; no duplicate live catalog was created.
- Removed API-090, API-091 and UI-088: seven parameterized duplicate published
  portal executions. IDs are not reused. Their runners and the post-publication
  browser job are removed; the artifact hash check remains.
- Retained UI-086/UI-087: 24 optional read-only Tiendanube integrations. They test
  a real external dependency, not another copy of the portal regression suite.
- Retained unchanged security header directives and build-output verification.
- Removed 102 selectors belonging exclusively to retired components; shared
  modal/form/button styles and the active laboratory note remain.
- Consolidated root dependencies onto the existing static profile and removed
  backend-only dependencies. Zod remains required by the planner. After its
  restoration, the root lock decreases from 723 to 98 entries (including root),
  without resolving new transitive versions. Cloudflare tooling remains isolated.
- Updated current architecture, commands, target guards and source paths. Older
  engineering examples/history are labeled archival rather than runnable guides.

## Preservation evidence

All 60 ingredient JSON files and `_headers` were compared byte-for-byte with
the checkpoint. Production product metadata, flavor references, recipe blends
and recipe preparations are byte-identical. The canonical recipe portion of
the old data module is byte-identical; only backend seed entities were removed.
The almanac reader's only source change is its direct browser image-adapter import.
No approved product/recipe/ingredient content or runtime public assets were edited.

## Verification

- TypeScript static typecheck: passed.
- Recipe integrity: 100 recipes passed.
- Node model/profile/store-link contracts: 54 passed.
- Ruff, workflow YAML parsing, shell syntax and Git whitespace checks: passed.
- Collection: 450 executions; 426 local/framework, 24 optional store checks.
- Build: passed, with deferred sheets and no application API/server artifact;
  initial JavaScript 411.40 kB / 123.29 kB gzip at this revision.
- Root manifest/lock agreement and equality to the static profile: passed.
- `npm ci --dry-run --offline`: accepted the final manifest/lock. This is not an
  installed-runtime test. A real isolated `npm ci` could not complete: the cache
  lacks `source-map-js@1.2.2`, and the registry download fails certificate
  verification (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). TLS/network settings were
  not relaxed; existing installed dependencies were used for typecheck/build.

Local Chromium/framework execution on the built artifact: **420 passed / 6 failed**,
426 total, with no skipped executions or setup errors. Regular isolated cases:
412 passed / 6 failed in 342.59 seconds using four workers. Shared-artifact
specialized scripts: eight passed in 343.37 seconds, strictly serial on the same
preview. The six failures are UI-101's existing mobile/desktop keyboard variants
for almanac, ingredient and blend dialogs: four miss initial focus and two allow
Tab to reach background controls. Their assertions remain unchanged.
UI-085 passed in this headless run; the prior headed failure is not thereby fixed.
No store checks or fresh Firefox/WebKit suite were executed in this cleanup.

Evidence directory: `/tmp/lumbre-static-retirement-20261009/`, containing
`general/` and `specialized/` reports, JUnit XML, logs, screenshots/traces and PDFs.

## Known pre-existing failures

### CI dependency correction

The first push of the cleanup (`ac29121`) failed in isolated CI typechecking:
Zod had incorrectly been classified as unused despite the planner's active import.
The local installation retained it and masked the omission. Restore the exact
previous `zod@4.6.5` manifest and lock entry in development and static release
profiles. Two pre-install contract tests now check shipped imports against
declared dependencies and explicitly reproduce the missing-Zod failure without
resolving the inherited installation. This correction does not relax UI gates
or fix the separately recorded keyboard defects.

Correction validation: nine profile contracts and 47 model/store-link contracts
passed; TypeScript, all 100 recipe checks and the static build passed. Both Zod
lock entries are byte-equivalent JSON to the checkpoint's original entry.
A clean isolated offline installation remains unverified locally: the cache
does not contain `source-map-js@1.2.2`; a verified HTTPS download of that exact
tarball timed out. No TLS or network settings were weakened. CI must confirm
the clean installation before publishing this correction.

The prior complete headed run had 419 passed / 7 failed: six custom-dialog
keyboard containment variants in UI-101 and one headed recipe return failure in
UI-085. Those reports remain unchanged. Cleanup does not authorize loosening
their assertions or declaring these defects fixed. Earlier focused WebKit
chunk-recovery failures also remain pending separate diagnosis.
