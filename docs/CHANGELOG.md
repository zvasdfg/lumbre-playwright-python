# Engineering changes and verification history

This is a sanitized index, not an additional runbook or suite. Current commands,
features and limits belong in the root README. Old source and detailed records
remain recoverable in Git except retired confidential content, which is retained
only in the owner's private backup; they are not current executable requirements.

| Date / checkpoint | Change and actual evidence |
| --- | --- |
| 2026-09-30 / f65acc8 | Original recipe preparations and source/safety review; culinary proposals, not kitchen validation. |
| 2026-10-09 / 5652edd | Checkpoint before retiring the old backend and duplicate published-portal tests. Original IDs migrated into the numbered Lumbre feature tree. |
| 2026-10-09 / ac29121 | Removed unused backend/accounts/cart/payment/admin code and duplicate remote regressions. Local cleanup had six known focus failures; it was not an all-green release. |
| 2026-10-09 / 914579b | Restored active Zod dependency and added isolated release-import guards. CI static build passed; keyboard/recovery failed and the combined browser job timed out. |
| 2026-10-12 / b96012a | Native modal containment/restoration, explicit chunk recovery and disjoint general/serial CI jobs. Local 426 passed; three-engine compatibility 78 passed. CI general lane had one PDF identifier extraction failure. |
| 2026-10-12 / 6de17af | Print tracking correction; UI-103 extended to all four products, exact PDF assertions retained. Local 429 passed; all jobs and production bundle verification succeeded in the linked run below. |
| 2026-10-13 / 5d08c6d | Documentation consolidation, manual laboratory and publication guards. Verified private backup, coordinated history cleanup/force push, nine affected build artifacts removed. All CI jobs and deployment passed; main/lab production SHA-256 matches CI and two known old URLs return 404. GitHub retained original objects by SHA, so the repository remains temporarily private pending provider cleanup. |
| 2026-10-13 / f54306c | Documentation-only follow-up. CI failed UI-077 Firefox-abort at the first recovery navigation; deployment was skipped. A green prior release does not imply this run passed. |
| 2026-10-13 / UI-077 correction | CI trace showed header pointer interception and continuing scroll with no URL change. The failed laboratory panel collapsed the 800px placeholder to roughly 65px and lacked its normal section styling. The original two local checks passed despite the CI failure; controlled-loading regression then failed all four scenarios against the original CI build. Shared loading/error styling and footprint restored. On local Playwright 1.63: 423 nonserial + eight serial = 431 passed; 84 compatibility passed; six independent Firefox repetitions = 24 passed; 49 model/publication and nine profile contracts passed. No failures/skips in successful suites. CI/Linux validation and deployment are pending at the time of this change; local results do not imply publication success. |

Last completed deployment evidence:
[GitHub Actions run 38441242795](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/38441242795).
The old 31 optional external cases became 24 real store cases after removing
seven duplicate/retired-route checks. Default local CI coverage is not replaced
by tests against production; the only post-deploy gate is artifact identity.

Historical failed runs and parameter counts must not be described as tests of a
later revision. Compatibility counts overlap engine variants. No table row claims
exhaustive combinations, sensory validation, checkout or a physical-phone audit.
