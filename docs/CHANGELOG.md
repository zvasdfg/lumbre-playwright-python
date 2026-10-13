# Engineering changes and verification history

This is a sanitized index, not an additional runbook or suite. Current commands,
features and limits belong in the root README. Old source and detailed records
remain recoverable in Git; they are not current executable requirements.

| Date / checkpoint | Change and actual evidence |
| --- | --- |
| 2026-09-30 / f65acc8 | Original recipe preparations and source/safety review; culinary proposals, not kitchen validation. |
| 2026-10-09 / 5652edd | Checkpoint before retiring the old backend and duplicate published-portal tests. Original IDs migrated into the numbered Lumbre feature tree. |
| 2026-10-09 / ac29121 | Removed unused backend/accounts/cart/payment/admin code and duplicate remote regressions. Local cleanup had six known focus failures; it was not an all-green release. |
| 2026-10-09 / 914579b | Restored active Zod dependency and added isolated release-import guards. CI static build passed; keyboard/recovery failed and the combined browser job timed out. |
| 2026-10-12 / b96012a | Native modal containment/restoration, explicit chunk recovery and disjoint general/serial CI jobs. Local 426 passed; three-engine compatibility 78 passed. CI general lane had one PDF identifier extraction failure. |
| 2026-10-12 / 6de17af | Print tracking correction; UI-103 extended to all four products, exact PDF assertions retained. Local 429 passed; all jobs and production bundle verification succeeded in the linked run below. |
| 2026-10-12 / current worktree | Documentation consolidation and publication audit. Owner authorized removing internal formula references and using manual quantities; no inheritance of previous-release results. See SECURITY.md for final checks and outstanding historical exposure. |

Last completed deployment evidence:
[GitHub Actions run 38293660881](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/38293660881).
The old 31 optional external cases became 24 real store cases after removing
seven duplicate/retired-route checks. Default local CI coverage is not replaced
by tests against production; the only post-deploy gate is artifact identity.

Historical failed runs and parameter counts must not be described as tests of a
later revision. Compatibility counts overlap engine variants. No table row claims
exhaustive combinations, sensory validation, checkout or a physical-phone audit.
