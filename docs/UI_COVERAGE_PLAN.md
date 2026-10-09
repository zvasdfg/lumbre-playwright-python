# Portal and store UI coverage

Revision: 2026-10-08. Scope: current static Lumbre portal + Tiendanube public store.
Evidence: deploy.yml, portal/scripts/test-*.py, check-static-print.py,
lab-formula.test.mjs, fire-plan-model.test.mjs, fire-plan-fuel.test.mjs,
test-framework/projects/lumbre_static/remote_smoke and reviewed public purchase flow.
This is a coverage plan, not a claim that all proposed scenarios have passed.

## Retirement and retained value

- Removed four obsolete remote smoke modules: D1 health/seed, API catalogs,
  passwordless account UI, and production write probes (including reset/sign-in).
- Replaced them with static HTML/security headers, GET-only unavailable API checks,
  four public product sheets, purchase link destinations, contrast and loaded images.
- Kept backend local tests because the backend source remains an explicit local
  target; excluded them from default collection. They are not portal coverage.
- Kept static CI scripts, unit calculations, storage recovery and PDF contracts.
  Do not remove them until equivalent migrated cases pass on the same build.
- Replaced the production URL default; staging must explicitly target static output.
- No inventory changes, real orders, payment attempts or account mutations in smoke.

## Feature matrix

Existing means assertions found in source, not a fresh successful execution.

| Feature | Existing coverage | Required additions / acceptance |
|---|---|---|
| Home, Method, global navigation | First Provisiones click after lazy loading | All section anchors, direct hash entry, reload, browser back/forward, mobile menu closes, sticky header does not obscure target |
| Planifier goals/equipment/fuel | Asar/ahumar/hornear, defaults, incompatible choices, pellets, kettle, fuel estimates | Data-driven compatibility matrix, transitions between previously valid/invalid settings, empty/extreme numeric input; sampled UI combinations plus exhaustive model units |
| Plan stages and diagrams | Mixed goals, editor, result and overflow checks | Add/remove/reorder stages where supported; correct illustration per configuration; missing-image fallback; mobile visual baseline |
| Saved plans | Save/reload/edit, storage corruption/quota | Rename/delete/cancel, duplicate names, old saved schema, units round trip, no data loss after validation errors |
| Recipe catalog | Initial cards, page 2, three sheets, return from blend | Every filter and pagination boundary, empty result where supported, recipe-to-product routing, focus/scroll restoration |
| Ingredient explorer | Selection, family expansion, gram changes | Search and empty results, selected counts per family, remove/re-add, all group controls, ingredient detail and modal return |
| Formula/radar | Strong unit coverage plus one UI scenario | UI updates after add/remove/manual weight; SP/SPG representative cases, zero/invalid values, five axes, dominant-value normalization; match threshold boundary UI using local fixtures |
| Blend records and sheets | Alias, SES ID, grams, no percentages, session reload | Multiple blends, long names, supported edit/delete paths; no production percentages or internal source notes in public DOM/PDF |
| Provisions/product sheets | Four products, links, five taste axes, print, return focus, contrast | All CTA states, keyboard focus trap, zoom, links actually arriving at corresponding store SKU |
| Almanac | Page selection, image size, next/previous boundary | Open/close keyboard, first page boundary, slow/failed image recovery, mobile layout/zoom |
| Print/PDF | Product/recipe/blend/plan text and page-count checks | Rendered-page visual checks for clipping, overlaps, missing diagrams; long-content fixtures, consistency with on-screen quantities |
| Static/privacy boundaries | No account/cart UI, no API traffic, retired APIs 404 | Public footer/legal links; no formula leakage in public bundles, clear classification of expected versus unexpected network errors |
| Tiendanube product catalog | Manual purchase-path review only | Four SKU destinations, product name/150 g, price against an approved configurable catalog, gallery, description, stock CTA, public policy/contact links |
| Tiendanube return navigation | Manual confirmation | Menu Portal Lumbre returns to #tienda; distinguish logo/store-home behavior, mobile and desktop |
| Cart and checkout | Manual prior checkout; stale cart error observed | Empty cart, add/update/remove, stock depletion, totals/shipping, invalid address, back navigation, payment options in authorized test environment only |
| Confirmation and emails | Not currently automated | Test orders/provider sandbox required; correct confirmation, reference, total and receipt. Email changes remain deferred by owner |

## Implemented UI expansion

Further combinatorial coverage and case-level architecture are documented in
[STATIC_TEST_ARCHITECTURE.md](STATIC_TEST_ARCHITECTURE.md). New model checks cover
8,640 configurations and 1,770 ingredient pairs. UI expansion covers every available
goal/equipment/fuel tuple, every ingredient, all 100 recipe sheets, stage supports
and units, the stage limit and saved-plan lifecycle. These named domains do not
mean all possible continuous inputs or arbitrary ingredient subsets are exhausted.

The current revision adds 28 isolated desktop/mobile journey executions in
`test_journeys.py`: all first-click anchors, goal defaults and saved plans,
stale print invalidation, recipe pagination and blend return, ingredient search,
SPG/SP quantities, live radar updates, aliases, saved blend deletion, recipe
filters/empty search recovery, and almanac boundaries.

Eight specialized regression groups now execute as separate Pytest cases; the
static PDF producer and checker remain together to preserve dependency order.
Their internals still use independent scripts and shared PDF paths, so parallel
xdist execution is explicitly rejected. The old assertions were not removed.

The public Tiendanube suite now contains 24 cases: four products × two widths ×
two portal entry points (16 journeys), plus four product galleries × two widths
(8 cases). It follows actual purchase links rather than bypassing them with a
direct URL load. Checks cover destination, SKU/title/150 g, positive price,
available-or-disabled sold-out CTA, loaded hero, overflow and primary-menu return
to Provisions. Gallery checks use mobile thumbnails and the desktop image grid.
The theme must finish loading before its menu handlers can be exercised; the
footer return link is a separate new-tab variant, not the primary-menu control.
No stock changes, cart writes, orders or payments are made. This external suite
has a manual workflow separate from the deploy gate. Checkout requires an
authorized stocked test product; a passing public suite does not validate it.

Deploy configuration now runs the static Pytest suite and adds a read-only
post-deploy UI smoke. Workflow changes are local, not yet committed or exercised
on GitHub. Local runners isolate artifact directories per invocation.

## Delivery sequence

1. **Current cleanup:** retire obsolete remote tests, isolate static suite and document
   correct targets. Validate collection, syntax and current smoke before claiming PASS.
2. **Migrate active scripts:** split test-static.py by behavior, fixture-owned browser
   context per case, configurable BASE_URL, stable IDs, HTML/JUnit and trace/screenshot
   on failure. Preserve existing CI assertions; remove old scripts only at parity.
   PDF generation and assertions must belong to the same case, not depend on run order.
3. **Complete portal journeys:** implement matrix gaps; keep arithmetic combinatorics
   in unit tests and use representative boundary/end-to-end UI cases.
4. **Store contract suite:** separate read-only external job, following actual portal
   links. Do not hardcode zero stock or permanent price; use approved expectations.
   Tiendanube outage is an integration incident, not a reason to block portal build.
5. **Visual/accessibility/mobile:** Chromium desktop + mobile, WebKit mobile emulation,
   Firefox targeted smoke; 320/390/768/1440 layouts, keyboard, zoom, contrast and
   accessible names. Approved visual baselines; never automatically accept differences.
   Physical phone check remains separate from emulation.
6. **Checkout controlled tests:** require a test store/product, inventory strategy,
   shipping fixtures and payment sandbox. No production purchase just to make CI green.

## Execution and evidence

- Every PR: deterministic model tests + local static core journeys; no external store dependency.
- Deploy gate: same validated artifact, complete static regression + Chromium print.
- Post-deploy: short read-only static smoke on the published domain, wired into
  deploy.yml in this revision; manual entry is scripts/test-production.sh.
- External store/cross-browser extended runs: separate manual jobs initially; enable
  recurring schedule only with owner agreement.
- Each failure: case ID, target/build revision, browser/viewport, expected/actual,
  screenshot, trace and console/network diagnostics, with personal data redacted.
- Retries must remain visible; no blanket retry to conceal deterministic failures.
- Completion: every matrix row has case IDs, explicit exclusions and fresh evidence;
  no obsolete backend assumption, unexplained skip, or unverified checkout claim.

## Remaining risks

### Verification of this revision

UI expansion execution evidence:

- New isolated portal journeys: 28 passed, 0 failed/skipped, 98.43 seconds.
  HTML: `/tmp/lumbre-journeys-v3.html`; JUnit: `/tmp/lumbre-journeys-v3.xml`.
- Public store journey: 4 passed, 0 failed/skipped, 16.03 seconds.
  JUnit: `/tmp/lumbre-store-v2.xml`.
- Specialized Pytest adapter: storage recovery passed; 36 static cases collected
  using the same invocation/configuration as CI (28 new + 8 retained groups).
- Existing static acceptance, eight PDF documents and storage recovery passed.
- All six retained planner/recipe scripts passed: 27 goal/equipment/viewport
  combinations, printable plans, incompatible and mixed goals, defaults, saved
  plans and units, six fuels at two widths, missing/invalid consumption,
  kettle sizing, Weber defaults and repeated recipe/blend return.
- Initial test-development failures were corrected (search locator, deferred
  almanac and closed mobile store menu); results above use the corrected tests.
- Separate concurrent runs initially shared the default artifact directory;
  local runners now use unique directories and CI jobs use separate artifact paths.
- Workflow YAML, Python syntax, shell syntax and diff whitespace were checked.
  CI workflows have not yet been executed remotely for these uncommitted changes.

- Framework units: 12 passed.
- New smoke collection: 7 cases collected.
- Local corrected build: both UI cases passed (390 and 1440 px, all four rubs).
- Production run 2026-10-08 16:55 America/Mexico_City: 5 HTTP cases passed;
  both UI cases failed because purchase text was still rgb(116, 39, 25), not white.
  This is a production discrepancy, not a skipped assertion. Report:
  `test-framework/reports/runs/lumbre-production-smoke-2026-10-08_16-55-08.html`.
- Shell syntax and git diff whitespace checks passed. The legacy backend suite
  was not rerun. Existing static regressions were rerun during the UI expansion
  above. No deployment made.

Specialized scripts still run sequentially internally, but Pytest reports each group
independently and continues to the next after failure. Full internal migration
is pending. Screenshots are evidence, not yet visual comparisons. The generic stale
cart error is owned by Tiendanube and remains unresolved. Current smoke checks the
portal link contract; the separate store suite now navigates the external store. Test code cannot
establish culinary/sensory validity or legal compliance of policies.

## Latest complete execution — 2026-10-08

See [the execution record](STATIC_TEST_ARCHITECTURE.md#completed-execution--2026-10-08-expanded-boundaries)
for reconciled evidence: 268 distinct cases executed, 266 passed and two WebKit
network-recovery failures. This includes the complete local portal suite, all Node
contracts, the focused three-engine selection and public portal/store checks.
Quick-plan transitions, keyboard isolation/restoration, abort/HTTP-503 recovery,
duration limits and invalid blend quantities now have automated cases. Native
browser-chrome focus is not incorrectly treated as background-page focus.

Remaining prerequisites: an approved visual baseline and an authorized checkout
sandbox. Neither payment/order creation nor arbitrary ingredient subsets, stage
sequences or all browser/device combinations are covered by these counts.

## Current transition expansion

28 mobile/desktop cases now cover selection limits, multiple peppers and their
weighted radar, duplicate blends, saved variants, cooking-heat changes, the
production recommendation threshold, stale planner output, replace/copy decisions
and concurrent browser-page writes. See the case mapping and evidence in
[STATIC_TEST_ARCHITECTURE.md](STATIC_TEST_ARCHITECTURE.md#transition-expansion-and-recovery-correction--2026-10-08).

The two previous WebKit recovery failures pass with the local correction, including
an outage that persists through the first retry and preserved browser storage.
Firefox/WebKit now have a CI compatibility job required before deployment. Native
Safari/iPhone verification and approved visual baselines remain separate follow-up
work. Checkout/payment still requires a test store.
