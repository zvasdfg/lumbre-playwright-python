# Lumbre test project

Canonical active project, revision 2026-10-12. The organization follows the
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

UI-077 now includes mobile/desktop × aborted request/HTTP 503. Its controlled
loading phase exposes section collapse deterministically; recovery must preserve
the loading footprint, navigate to a new document twice and preserve storage.
It retains its original ID rather than adding a duplicate "stability suite".
Its reload check uses [wait_for_url](https://playwright.dev/python/docs/api/class-page#page-wait-for-url),
a changed recovery query and a per-document identity, rather than relying only
on the deprecated navigation-event waiter. No forced click or sleep masks the failure.

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

## Execution

Use the root [README](../../../README.md) for installation, local/headed/CI/store
commands, exact markers, targets, reports and safety boundaries. This guide owns
case IDs and domains, not a duplicate operational runbook.

## Coverage extension — UI-092 through UI-104

180 parameterized executions across these 13 behavior IDs. UI-055 retains
its original ID but now lives under `ui/almanac/`. Collection is not a PASS;
current executed results are recorded separately. No assertion is skipped,
xfailed or relaxed to hide a defect.

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
| UI-103 | home / print | Four production products/recipe/3-ingredient blend/12-ingredient blend/plan; self-contained A4 PDF creation, exact searchable product codes, visible text/quantities, no blank page/chrome, loaded images and text origins inside page bounds |
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

## Current laboratory behavior

Gram inputs are manual. Adding a component leaves its amount blank; removing
one preserves other amounts and updates total/radar. Saving requires 2–12 valid
positive amounts and a total at most 150 g. Existing IDs are updated in place to
protect manual entry, persistence, PDF and ingredient-based product matching.
Fixture amounts are synthetic test data, never manufacturing recipes.

## Results and retirement

Use the root README for the latest deployed revision and [sanitized history](../../../docs/CHANGELOG.md)
for prior checkpoints. This worktree requires its own execution evidence. Optional
store checks never submit cart/payment/orders or modify stock.

The obsolete backend cases and duplicate published-portal probes were retired.
The original sources remain in Git at aeaf9f4; those IDs are not recycled for
unrelated contracts. Eight specialized groups remain numbered adapters because
their shared-file assertions must run serially, not a second framework.
