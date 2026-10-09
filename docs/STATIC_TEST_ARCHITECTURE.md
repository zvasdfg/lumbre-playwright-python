# Static portal test architecture and case inventory

Revision: 2026-10-08. Scope: static portal, public store; legacy backend excluded.

## Boundaries

| Layer | Ownership | Must not do |
|---|---|---|
| `portal/scripts/*.test.mjs` | Pure model rules, exhaustive finite matrices, numeric boundaries | Start browsers or contact external services |
| `projects/lumbre_static/data/` | Independent scenario inputs and expected contracts | Compute expected results with the function under test |
| `projects/lumbre_static/components/` | Reusable interactions with one component | Hide business assertions, swallow failures or perform API writes |
| `projects/lumbre_static/tests/` | Isolated UI cases and local specialized adapters | Modify live inventory, orders or payment settings |
| `projects/lumbre_static/remote_smoke/` | Small public post-release acceptance | Inherit legacy API/reset fixtures |
| `projects/lumbre_static/store/` | External read-only portal/store integration | Block local builds on third-party availability |
| `automation/` | Generic browser/report/config fixtures | Import product models or product selectors |

Existing specialized scripts retain their assertions and are adapters, not a second
definition of business rules. Full migration to component objects is incremental.
Test data read from ingredient JSON enumerates actual catalog IDs; expected weighted
values use independent arithmetic. Compatibility expectations are separately defined.

## Automated case catalog

| ID | Input domain | Expected behavior |
|---|---|---|
| MATRIX-001 | 8 equipment × 6 fuels × 3 goals × 3 methods × 2 smoke × 5 supports × 2 units | 8,640 independent validity assertions; all confirmations enabled; no stages |
| MATRIX-002 | Every unordered pair of 60 ingredients | 1,770 pairs; five weighted tastes, order invariance, missing-data semantics and relative maximum |
| MATRIX-UI-001 | Every available goal/equipment/fuel tuple, mobile | Correct fuel options/value, successful result and budget, no nonfinite values/overflow |
| MATRIX-UI-002 | Every ingredient, fresh context | Open family, inspect, select, selected count, remove, restored add control |
| EDITOR-001 | 5 supports × 2 units | Add, reorder, pause clears/disables temperature, remove, build |
| EDITOR-002 | 12-stage boundary | Thirteenth addition prohibited; removal restores capacity |
| LIBRARY-001 | 390/1440 widths | Save, delete, undo, reload, duplicate-name cancellation preserves original |
| CATALOG-001 | Every public recipe on every pagination page | 100 unique sheets: image, preparation, sources, print control, no overflow and restored focus |
| FRAMEWORK-004/005 | Python module ASTs | Generic core cannot import projects; component objects cannot hide assertions or depend on scenarios |
| STATIC-UI-001…006 | 28 mobile/desktop journeys | Navigation, plan round trip, recipes, live lab radar and alias, filters, almanac |
| STATIC-REG-001 | 8 retained regression groups | Specialized fuel, constraints, storage, PDF and recipe return assertions |
| STATIC-REMOTE-001…003 | Document, API absence, two widths | Actual deployed static artifact usable, safe read-only checks |
| STORE-UI-001 | All four production SKUs | Title/SKU/150 g, available-or-sold-out control, actual return navigation |

## Execution lanes

- Build model tests: fast exhaustive finite rules.
- Core browser/print: independent cases, fresh contexts, retained specialized groups.
- Component matrix: separate CI job against the SAME downloaded build; blocks deployment.
- Published smoke: only after production deployment.
- Store integration: separate manual workflow, no real purchase.
- Local commands: `bash scripts/test-static-ui.sh` and `bash scripts/test-store-ui.sh`.
- Specialized groups prohibit xdist because their old PDF paths remain shared.
  Independent matrix jobs have their own filesystem/artifact directories.

## Honest coverage boundaries

### Execution evidence for this revision

- Model suites: 32 tests passed, including 8,640 configuration assertions and
  1,770 ingredient-pair assertions across five axes.
- Component/library matrix: 110 passed, zero skipped/failed (48 planner tuples,
  60 individual ingredients, two library viewports), 436.20 seconds.
  `/tmp/lumbre-matrix-v2.html`, `/tmp/lumbre-matrix-v2.xml`.
- Editor: 11 passed, `/tmp/lumbre-editor.xml`.
- Recipe inventory: all 100 unique sheets passed in one catalog traversal,
  `/tmp/lumbre-recipes-all-v3.xml`.
- Framework including architecture guards: 14 passed. Refactored reusable
  planner/laboratory interactions additionally passed two targeted smoke cases.
- 172 cases collect across current static and framework suites. Collection is
  not a claim that this entire combined selection ran together in this revision.
- Initial ingredient test counted empty placeholders as selected rows; its
  selector was corrected. Recipe counter parsing was made case-insensitive to
  respect rendered uppercase text. No product code changed to make tests pass.
- Workflow YAML and whitespace checks passed. Changes remain local; remote CI
  execution and deployment have not been performed for this revision.

“Every combination” must name its dimensions. The 8,640 matrix does NOT include
every stage sequence, confirmation permutation, time, temperature, browser or viewport.
Ingredient pairs are exhaustive pairs, NOT every subset of up to 12 ingredients or
every gram distribution. Continuous inputs use equivalence classes and boundaries.
Browser emulator tests do not replace a physical phone. Screenshots are evidence,
not visual-baseline assertions. Checkout, refunds, payments and email delivery need
an authorized sandbox. These remain explicit gaps; no 100% coverage claim is made.

Before claiming any component complete, link its interactions/states to executed
case IDs. Quick-plan transitions, modal keyboard isolation/restoration, interrupted
laboratory downloads, duration bounds and invalid blend quantities now have tests.
The resilience/keyboard selection runs in Chromium, Firefox and WebKit via
`bash scripts/test-static-cross-browser.sh`; this is not a claim that every matrix
case runs in all engines. Visual baselines still require an approved reference;
sandbox cart/checkout still requires an authorized test store. Consult
UI_COVERAGE_PLAN.md for scope and the execution record below.

## Completed execution — 2026-10-08, expanded boundaries

The complete current portal selection was executed locally, with targeted reruns
after correcting test assumptions. Results are consolidated, not a claim of one
all-green invocation:

| Layer | Final cases | Passed | Failed |
| --- | ---: | ---: | ---: |
| Node model / profile / link contracts | 56 | 56 | 0 |
| Framework + current static UI, Chromium | 185 | 185 | 0 |
| Additional Firefox / WebKit resilience contracts | 16 | 14 | 2 |
| Published portal + public Tiendanube journeys | 11 | 11 | 0 |
| Total, without counting reruns twice | 268 | 266 | 2 |

Evidence and reconciliation:

- `/tmp/lumbre-model-full.log`: 56 Node tests passed. Local Node 22.14 needs
  `--experimental-strip-types`. The CI architecture contract was updated to
  check the Pytest wrapper and component-matrix release gate, not retired shell commands.
- `/tmp/lumbre-full.html`, `/tmp/lumbre-full.xml`: 179-case complete initial
  selection, 177 passed / 2 failed, 968.65 seconds. Both failures were the earlier
  keyboard assertion requiring the close button to receive initial focus.
- `/tmp/lumbre-cross-verified.html`, `/tmp/lumbre-cross-verified.xml`: final
  corrected selection, 24 cases across three engines, 22 passed / 2 failed.
  All eight Chromium cases passed, including both keyboard cases above and the
  subsequently added HTTP 503 scenario. Native browser-chrome focus is allowed;
  background document control focus remains prohibited. Escape and trigger-focus
  restoration are still asserted. No application code was changed for this adjustment.
- `/tmp/lumbre-lab-boundaries.html`, `/tmp/lumbre-lab-boundaries.xml`: five additional
  laboratory quantity/alias boundary cases passed. These plus the new HTTP 503
  case bring the initial 179-case local selection to 185 executed cases.
- `/tmp/lumbre-external.html`, `/tmp/lumbre-external.xml`: all 11 read-only public
  portal/store cases passed. This supersedes the older production CTA-color failure
  as current observed evidence; this task did not deploy anything.
- All eight specialized groups passed, including PDF validation, storage failures,
  planner goals, simplified controls, fuels, kettle sizing, Weber defaults and
  recipe/blend return. All 48 planner tuples, 60 ingredients and 100 recipe sheets
  were exercised. The Node matrices include 8,640 configurations and 1,770 pairs.
- Python AST, shell syntax, three workflow YAML files and `git diff --check` passed.

### Compatibility finding at that revision — NETWORK-001

WebKit fails to recover the lazy laboratory after either an aborted JavaScript
request or an HTTP 503. The error message appears; after removing the injected
failure and clicking **Recargar página**, the laboratory remains unavailable.
Chromium and Firefox pass both scenarios. Trace and screenshot evidence lives in
`/tmp/lumbre-cross-verified-artifacts/`. Reproduced in multiple WebKit executions;
native Safari and physical iPhone reproduction are still pending. This is not
silenced with skip/xfail, and no claim is made yet about the underlying app versus
engine/cache cause.

No checkout submission, payment, inventory mutation, commit or deployment occurred.
Approved screenshot baselines and a sandbox checkout remain prerequisites for
those unimplemented test domains, not implied passing coverage.

## Transition expansion and recovery correction — 2026-10-08

28 new UI cases cover mobile and desktop. Their interactions live in reusable
component objects; assertions and expected outcomes remain in the test modules.

| Case ID | Verified behavior | Cases |
| --- | --- | ---: |
| LAB-STATE-001 | Limit of 12, blocked thirteenth ingredient, removal restores capacity and family count | 2 |
| LAB-STATE-002 | Identical formula reopens original; variant retains its own grams and preserves original after reload | 2 |
| LAB-STATE-003 | Direct/indirect change preserves grams and creates separate saved formulas | 2 |
| LAB-STATE-004 | Four peppers contribute by grams to all five radar axes; editing/removal recalculates | 2 |
| LAB-MATCH-001 | LMB-F-004 is absent at 60%, present at 80% and 100%; recommendation opens correct sheet | 6 |
| PLAN-STATE-001 | Equipment/fuel/goal/hours changes remove stale print action, then regenerate with current settings | 8 |
| PLAN-STATE-002 | Replace updates original; copy preserves original; both survive reload | 4 |
| PLAN-STATE-003 | Changes from a real second browser page cannot be silently overwritten | 2 |

The prior NETWORK-001 failures are resolved locally. The explicit recovery action
preserves the hash and starts a new document; when WebKit retains the failed module,
the loader retries the same compiled local laboratory asset with a fresh query.
The loader permits only same-origin `/assets/ingredient-lab-*.js` files already
referenced by the build. It performs one fallback after an explicit recovery
action. A persistent failure still displays the error and permits another attempt.
Local and session storage are verified to survive recovery.

Evidence:

- `/tmp/lumbre-transitions-v2.html` and XML: 26 passed, 149.61 seconds.
- `/tmp/lumbre-pepper-transitions.xml`: two additional radar/family cases passed.
- `/tmp/lumbre-recovery-all.html` and XML: all 24 keyboard/resilience cases passed
  across Chromium, Firefox and WebKit; supersedes the previous two WebKit failures.
- `/tmp/lumbre-recovery-repeated.html` and XML: all six network scenarios passed
  after adding persistent-first-retry and storage/hash assertions.
- `/tmp/lumbre-contracts-transitions.log`: all 56 Node contracts passed. Typecheck
  and static build passed. The subsequently updated CI contract also passed six tests.
- `/tmp/lumbre-impact-regression.html` and XML: all 50 impact-regression cases
  passed in 429.13 seconds (framework, original journeys and all eight specialized
  groups, including printing). Consolidated changed/affected verification is
  158 distinct cases passed: 28 new transitions + 24 cross-engine resilience +
  50 impact regressions + 56 Node contracts. Reruns are not counted twice.

The current local collection is 213 cases (was 185); adding the 16 focused
Firefox/WebKit cases, 11 external public cases and 56 Node cases gives a 296-case
portfolio. This revision executes changed and affected areas; collection is not
an assertion that all 296 were rerun together.

CI adds a Firefox/WebKit recovery and keyboard gate using the same static artifact.
Chromium remains in the main UI job. Its time limit is now 20 minutes to accommodate
the expanded cases and sequential specialized scripts. No new application dependency
was introduced. Remote CI, commit and deployment have not been performed this turn.

## Public store expansion and headed verification — 2026-10-08

`STORE-UI-001` now has 16 journeys (four products × mobile/desktop × portal
card/sheet entry), following actual outbound links, validating title/SKU/content
size, price, live stock CTA, loaded hero, overflow and primary-menu return.
`STORE-UI-002` has eight galleries (four products × mobile/desktop), verifying
every image loads, using mobile thumbnails or the desktop image grid.

The initial expanded runs exposed automation assumptions: controls were used
before theme load, a footer new-tab link could be mistaken for the primary menu,
and desktop tests tried to click hidden mobile thumbnails. Tests were corrected
to the observed theme; no store configuration was changed or force-click used.

Final live Chromium run: **24 passed, zero failed/skipped, 209.22 seconds**, headed
with 350 ms slow motion. Evidence: `/tmp/lumbre-store-final.html`,
`/tmp/lumbre-store-final.xml`, `/tmp/lumbre-store-final-artifacts`.
All four products were sold out and their purchase controls were disabled.
Inventory, carts, orders and payments were not changed; checkout is not verified
by this run. It still needs an authorized stocked test product and payment plan.

External collection is now 31 cases (seven public portal + 24 store), bringing
the catalog to 316 including local, focused cross-browser and Node contracts.
Only the 24 store cases were rerun in this store verification, not the entire
316-case portfolio. Commit, push and deployment remain unperformed.
