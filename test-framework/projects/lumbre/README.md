# Lumbre test project

Canonical active project, revision 2026-10-09. The organization follows the
original framework: reusable core, project-owned POMs, test data and numbered
UI modules grouped by functional ownership. There is no second active
`lumbre_static` suite.

```text
projects/lumbre/
├── components/
│   ├── fire_almanac.py          FireAlmanac: reader actions, no assertions
│   ├── fire_planner.py          FirePlanner: actions, no business assertions
│   └── ingredient_lab.py        IngredientLab: actions, no business assertions
├── pages/home_page.py          HomePage: composition and page navigation
├── data/cases.py               Independent configuration/ingredient inputs
├── support/specialized.py      Technical adapter for retained script contracts
├── conftest.py                 Fresh contexts, viewport fixtures, target guards
└── tests/
    ├── test_architecture.py    Numbering, ownership and safe-selection contracts
    └── ui/
        ├── almanac/           UI-055 boundaries; UI-092 every document; UI-093 zoom…
        ├── home/              UI-001 purpose; UI-028 mobile; UI-063 navigation…
        ├── recipes/           UI-002 filters; UI-034 all sheets; UI-053 pagination…
        ├── ingredient_lab/    UI-016 each ingredient; UI-017 limit; UI-068 radar…
        ├── fire_planner/      UI-012 methods; UI-033 saved plans; UI-064 matrix…
        └── commerce/          UI-030 catalog; UI-086 store return; UI-087 gallery…
```

## IDs and discovery

One behavior per `test_ui_NNN_<behavior>.py`, with matching
`@pytest.mark.case("UI-NNN", "Observable result")`. Parameterized inputs
produce multiple executions of that same behavior ID, not new case IDs.
Applicable original IDs are retained. UI-063 onward identifies new behaviors;
retired IDs are not reused for unrelated features. API uses a separate sequence.

Feature directories describe responsibility. Execution categories
are Pytest markers, not additional suite directories:

| Marker | Selection |
| --- | --- |
| `portal` | Local current-portal cases |
| `store` | Public Tiendanube integration, read only |
| `matrix` | Extended ingredient/equipment/recipe/almanac traversal |
| `planner`, `laboratory`, `recipes`, `navigation`, `commerce`, `almanac` | Feature |
| `cross_browser` | Focused keyboard/recovery/transition compatibility |
| `accessibility`, `print_pdf` | Cross-feature keyboard/DOM and PDF contracts |
| `specialized` | Retained serialized scripts with shared PDF files |

## Run from the repository root

`--headed` and `--slowmo` are also forwarded to browsers owned by the retained
specialized scripts; without these flags, CI remains headless. For standalone
scripts the equivalent environment settings are `LUMBRE_TEST_HEADED=1` and
`LUMBRE_TEST_SLOWMO=80`.

The main runner builds and starts its own static preview. Other local runners
require a preview on port 3001. None of these commands deploy:

```bash
bash scripts/test-local.sh                             # framework + all local portal
bash scripts/test-static-ui.sh                         # UI against an existing preview
bash scripts/test-static-ui.sh -m 'portal and planner' # planner only
bash scripts/test-static-ui.sh -m 'portal and matrix'  # extended traversal
bash scripts/test-static-ui.sh --headed --slowmo=350   projects/lumbre/tests/ui/home/test_ui_001_home_communicates_club_purpose.py
bash scripts/test-static-cross-browser.sh              # three engines, focused
bash scripts/test-store-ui.sh                          # explicit public store
```

For native Pytest, from `test-framework/`:

```bash
BASE_URL=http://127.0.0.1:3001 .venv/bin/pytest
BASE_URL=http://127.0.0.1:3001 .venv/bin/pytest projects/lumbre/tests/ui/recipes
BASE_URL=http://127.0.0.1:3001 .venv/bin/pytest -m 'portal and not matrix'
.venv/bin/pytest -m framework_unit                       # no portal required
```

Default selection is framework units plus local portal; optional store cases
are collected but not selected without an explicit marker override. Local
regressions reject a public target. Remote cases require explicit HTTPS.
The active project has no automatic API reset, D1 seed or authentication.
No cart submission, inventory change, order or payment is performed by store tests.

## Coverage extension — UI-092 through UI-104

177 additional parameterized executions; 13 new behavior IDs. UI-055 retains
its original ID but now lives under `ui/almanac/`. Collection is not a PASS:
the keyboard contracts expose actual custom-dialog accessibility defects.
No assertions are skipped, xfailed or relaxed to hide these defects.

| ID | Owner | Input / observable contract |
| --- | --- | --- |
| UI-092 | almanac | 53 published documents × two widths; asset, dimensions, alternative text, ordinal, progress and overflow |
| UI-093 | almanac | Documents 001/011/054 × two widths; zoom scrolling, fit and page-change reset |
| UI-094 | almanac | Both widths; arrow boundaries, Escape, trigger focus and cover on reopening |
| UI-095 | almanac | Both widths; close/reopen, scroll preservation and desktop backdrop dismissal |
| UI-096 | home / deferred UI | Almanac/recipe/product × aborted/503 chunks; reload, actual refetch, preserved local/session sentinel data |
| UI-097 | almanac | Both widths × aborted/503 image; alternate page remains usable and failed image recovers on revisit |
| UI-098 | almanac | Nine editorial-note documents × two widths; warning follows document and reference-link destination changes |
| UI-099 | ingredient_lab | 3/6/12 ingredients × direct/indirect × two widths; 150.01 g blocks save, exact grams/alias survive session reload and variant |
| UI-100 | fire_planner | Celsius/Fahrenheit × two widths; cook/roast/rest metadata, unit, support and printable sheet survive reload |
| UI-101 | home / keyboard | Almanac/ingredient/blend/recipe × two widths; initial focus, forward/backward cycle, Escape and restoration; three browser engines in focused lane |
| UI-102 | home / accessibility | Both widths; unique IDs, image alt attributes, named form controls and valid ARIA references |
| UI-103 | home / print | Product/recipe/3-ingredient blend/12-ingredient blend/plan; self-contained A4 PDF creation, visible text/quantities, no blank page/chrome, loaded images and text origins inside page bounds |
| UI-104 | almanac | Both widths; explicit pending chunk, busy state and usable planner before releasing download |

`almanac_matrix` is the fourth component-matrix Actions lane, using the SAME
validated build as the other lanes. `accessibility` and `print_pdf` select the
cross-feature contracts; directories still express ownership. All files retain
one matching numbered behavior ID. Run the reader only with:

```bash
bash scripts/test-local.sh -m 'portal and almanac'
bash scripts/test-local.sh -m 'portal and accessibility'
bash scripts/test-local.sh -m 'portal and print_pdf'   # Chromium; install .[lumbre]
```

PDF assertions are not a full visual audit: origin bounds do not prove every
glyph is unclipped or layouts do not overlap. Locally rendered pages are review
evidence, not auto-approved screenshot baselines. DOM checks are not a complete
WCAG/axe audit. Empty `alt` is valid for decorative images. The 12 equal-weight
blend fixture is synthetic boundary data, not a recommended culinary formula.
The image-failure case covers navigation/revisit recovery; it does not claim a
dedicated missing-image placeholder exists. Stocked checkout and physical phones
still require separate authorized environments/manual checks.

## Latest execution

Static-only cleanup validation: 420 passed / 6 failed (426 local/framework).
The remaining six failures are existing UI-101 keyboard-focus variants. All
eight specialized groups passed headless. Optional store and fresh Firefox/WebKit
checks were not executed. See [cleanup evidence](../../../docs/STATIC_RETIREMENT_2026-10-09.md).

Last complete headed local/framework run before source retirement: 419 passed /
7 failed (six custom-dialog focus variants plus one recipe return regression).
This is historical evidence, not a new validation of the cleaned source.
Focused three-engine run: 28 passed / 20 failed (18 focus variants and two WebKit
product-chunk recovery failures). PDF rerun: five passed; 12 rendered pages
inspected. No all-green or exhaustive-combination claim.

See [detailed execution record](../../../docs/TEST_MIGRATION_2026-10-09.md#coverage-extension-ui-092ui-104)
and [full local HTML report](../../../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/report.html).

## Removed obsolete suites

The retired backend project, its reset/auth/cart/admin tests, its parallel runner
and backend-only workflow were removed after migration. The previous originals
remain recoverable in Git at `aeaf9f4`, not as a second runnable project.
`scripts/test-local.sh` now owns only a static preview and current framework/UI
tests. It does not migrate, seed or reset D1. The reusable automation core remains.

See [migration map](../../../docs/TEST_MIGRATION_2026-10-09.md) for source-to-ID
equivalences, original-case disposition and the subsequent cleanup record.
