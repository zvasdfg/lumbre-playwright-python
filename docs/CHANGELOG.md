# Engineering changes and verification history

This is a sanitized index, not an additional runbook or suite. Current commands,
features and limits belong in the root README. Reviewed 2026-10-27. History cleanup
rewrote earlier commit identities; pre-cleanup labels below are dated evidence,
not guaranteed checkout targets. Original recovery copies are owner-private.
GitHub still retains known confidential objects by SHA: do not claim they exist
only in the backup. Historical records are not current executable requirements.

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
| 2026-10-13 / 7971085, UI-077 correction | CI trace showed header pointer interception and continuing scroll without navigation: the failed lab panel collapsed an 800px placeholder to roughly 65px. Controlled-loading regression reproduced all four failures against the original CI build. Shared loading/error styling and footprint restored. Local: 423 nonserial + eight serial = 431 passed; 84 compatibility; 24 independent focused Firefox repetitions; 49 model/publication and nine profile contracts. CI 38457776095 then passed every job and deployed successfully; main/lab artifact SHA-256 and two old URLs with 404 verified. |
| 2026-10-27 / documentation and publication decision | All 12 canonical Markdown documents aligned with source, current manual laboratory and original numbered framework. Full ID catalog, execution lanes, examples and dated evidence clarified; no runtime feature or dependency change. Collection rechecked: 431 default = 208 general + 215 matrix + eight serial; 24 store opt-in; 28 compatibility per engine. Owner explicitly authorized reopening this same repository accepting retained-object risk; provider purge remains unconfirmed. Collection is not a fresh UI PASS; this delivery's actual checks/run are attributable to its commit in Actions. |

## 2026-11-03 — Approved 200 g product imagery and publication

Owner approved the reviewed r011 gallery and requested publication/deployment.
The canonical production catalog now reports **200 g** and uses the four approved
r011 JPEG covers. Original assets and r008 covers remain available for rollback.
The image contract checks versioned paths, JPEG bytes, historical covers and net
content; the opt-in store heading contract follows 200 g while product URLs stay
stable. This does not change the independent 150 g laboratory batch limit,
shipping weight, inventory, prices, ingredients or formulas. Deployment success
must be verified from the resulting Actions run and live site, not inferred here.

Pre-push validation: typecheck, 100 recipe content checks, 52 model/publication
tests, nine isolated-profile contracts, static build and public-tree audit passed.
The current build passed 214 framework/general UI cases and all eight serial
browser/PDF groups. An initial serial invocation on port 3002 was rejected by the
fixture before running cases; the unchanged contract passed on required port 3001.
Evidence: `/tmp/lumbre-r011-general.xml` and
`/tmp/lumbre-r011-specialized-3001.xml`. Complete matrix and compatibility remain
deployment gates in CI, not claimed as fresh local results for this revision.

## 2026-11-02 — Compact product-first welcome (local)

Owner approved a brief welcome followed immediately by Provisiones, not a large
hero ahead of the products. `/` and `/#inicio` now lead with a single page title,
four production products, and purchase links before the long descriptions.
Provisiones is first in both menus; tools and their anchors remain available.
The old photo hero is replaced with compact tool entry points after the catalog.
No inventory, product formulas, dependencies, lockfiles or deployment workflow
were changed. This entry records local work, not a commit, push or deployment.

Updated contracts: model/source checks for order and the unique title, HomePage's
`home_title`, UI-001, UI-028 and static acceptance. UI-028 now checks 320×640,
390×667 and 390×844 without scrolling; name/button bounds and the button's center
and four corners must be unobstructed. A small Almanaque overlap in the shortest
viewport was corrected by reducing photo height; the whole jar remains visible.
PDF checks now also reject the new home title leaking into printed sheets.

Local verification on November 2:

- Types, 51 model/publication tests, nine isolated-profile contracts, 100 recipe
  content checks, public-tree audit and the static build passed.
- Initial functional candidate: 19 focused checks, 209 general checks, eight
  serial groups and 56 Firefox/WebKit compatibility checks passed.
- After the final photo-size/corner-hit refinement, the complete 209-check
  general group passed again, including the strengthened mobile and PDF cases
  (`/tmp/lumbre-compact-final-general.xml`, 207.96 seconds).
- Collection is now 432 default local/framework + 24 opt-in store executions:
  209 general + 215 matrix + eight serial. This is a collection count; the 215
  matrix executions were not rerun for this presentation change. Remote store
  tests, fresh registry audits and GitHub Actions/deployment were not run.

Final local entry artifact: `index-sJFBYKLB.js`, SHA-256
`7e976a46ae4efa4c6fcf7b4664ac100469831f641eab753de77b00568aea60a1`.
CSS: `index-BxnNUYGj.css`, SHA-256
`94d2a43a298b74cf1da6a33a3071a4c2eb0457e02d9df26b4505b064dc0b849b`.
Evidence logs and screenshots under `/tmp/lumbre-compact-*` and
`/tmp/lumbre-bienvenida-compacta-390.png` are local and temporary, not CI artifacts.

## 2026-11-02 — Follow-up portal UX/UI audit (local)

The owner's review found the compact welcome still unbalanced. This follow-up
keeps the product-first decision while correcting the horizontal heading, 4/2/1
responsive grid, square product photography, explicit product actions and tool
shortcuts at the welcome. Details remain in product sheets. Almanaque moves into
the sticky header instead of covering content; mobile tool headings/padding and
planner output contrast are corrected. Mobile menu Escape/blur closure and heading
levels are checked. Opening #tienda no longer downloads the deferred laboratory.
No product/formula/inventory/payment, dependency or workflow changes.

An initial Firefox compatibility failure showed an add button still moving during
the click. Hash navigation and lazy alignment now settle immediately, while
explicit result/variant actions retain smooth scrolling. UI-101 additionally
asserts both selections before saving. No forced clicks, fixed sleeps, automatic
retries or weakened assertions were introduced.

Final local verification: types, 51 model/publication tests, nine profile contracts,
100 recipe checks and the current public-tree audit passed. The same final build
passed 214 general checks, 56 Firefox/WebKit compatibility checks, ten additional
responsive checks, eight serial groups (including PDF/recovery), and 12 independent
Firefox blend repetitions. UI-105 adds five default executions; collection is now
437 local/framework + 24 opt-in store = 461. The 215 matrix executions and remote
store tests were not rerun. Local evidence is under `/tmp/lumbre-ux-final-*` and
`/tmp/lumbre-ux-firefox-repeat-*`; see [audit](UX_UI_AUDIT.md) for scope and sources.
This is not a commit, push, WCAG certification or deployment.

Final entry `index-CGu_d5de.js`: SHA-256
`a0bcf9fa232c9676a35eec720a5ad52ad95582f0fb57e75bcd87a9aafeacdddc`.
CSS `index-eWTV-Rz1.css`: SHA-256
`342f39909d6e3a13c8936a14f89f9e996865b4ee9b7a6086c4ea5ebb5e36d605`.

## 2026-11-02 — Product cover revision r008 (local)

The owner supplied four current packaging references: large use name and product
code over a dark-red stripe, black/black/red/ivory caps. Optimized JPEG copies now
live under the versioned `editorial/products/r008/` path and the canonical product
catalog supplies them to cards, sheets and the laboratory archive. Older files
remain intact; no formula, price, stock, dependency or workflow changed.

Actual checks for this asset build: types, 52 model/publication tests, static build
and 18 focused Chromium UI/PDF executions passed (UI-028, UI-030, UI-103, UI-105).
The earlier complete UX run was not repeated for the asset-only change. This is
local code work, not a new commit, push or deployment. Remote Tiendanube galleries
were updated separately; subsequent secondary-image revisions do not change
these four covers.

Entry `index-452_i7I3.js`: SHA-256
`9d6f2ee6f0606a195d7d66733880c4e8f1df6518889b8baf1d06fa5d7fb7f67c`.
CSS remains `index-eWTV-Rz1.css`, SHA-256
`342f39909d6e3a13c8936a14f89f9e996865b4ee9b7a6086c4ea5ebb5e36d605`.

## Earlier deployment evidence

Last completed deployment evidence:
[GitHub Actions run 38457776095](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/38457776095)
for the functional baseline 7971085. Later documentation publication results are
available in [Actions](https://github.com/zvasdfg/lumbre-playwright-python/actions).
The old 31 optional external cases became 24 real store cases after removing
seven duplicate/retired-route checks. Default local CI coverage is not replaced
by tests against production; the only post-deploy gate is artifact identity.

Publication outcome, 2026-10-27: documentation commit **d31a863** pushed to main.
[CI 40602275948](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/40602275948)
failed npm audit on two high-severity Vite/Zod findings; UI/deploy were skipped.
No runtime/dependency change was made or deployed. The same repository was then
made public with the owner's explicit retained-object risk acceptance, verified
via the unauthenticated GitHub API. Historical purge remains unconfirmed.
That failed run did not deploy. Dependency remediation follows in the entry below;
do not reinterpret the original run as successful.

Pipeline remediation, 2026-10-27: coordinated Vite 8.3.5/Zod 4.6.7 static and
development manifests/locks. Isolated deploy audit additionally exposed Undici;
Wrangler 4.154.0 brings Undici 7.30.1 while retaining sharp 0.35.5. Locks regenerated
with npm 11.17.0, public registry URLs/integrities preserved, no local file links
or missing Linux bindings. Profile contracts now protect the reviewed patches
and portable native packages. Clean static install, corporate-registry audit,
49 model/publication contracts, types, recipe integrity and build passed.
The patched deployment profile also passed a clean install/audit and Wrangler
dry-run with the generated assets; no production secret was used locally.
Official-registry audits and browser/deploy results remain attributable to the
actual Actions run for the remediation commit, not the failed documentation run.
No advisory/CI gate, TLS validation or historical security warning was bypassed.

Local documentation-release checks, 2026-10-27: 49 model/publication + nine profile
contracts and 18 infrastructure executions passed. Types, 100-recipe integrity,
build/public-output guards, current-tree scanner (563 files), whitespace and
documentation checks passed (12 Markdown files, 53 local links, 24 Python/shell
blocks; 64 UI IDs/counts/owners/lanes matched collection). This is not a new local
431-case UI execution. Fresh local npm audit responses were unavailable due to
certificate validation; no network/TLS changes or advisory bypass was used.

Historical failed runs and parameter counts must not be described as tests of a
later revision. Compatibility counts overlap engine variants. No table row claims
exhaustive combinations, sensory validation, checkout or a physical-phone audit.
