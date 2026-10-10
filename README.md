<p align="center">
  <img src="portal/public/brand/lumbre-logo-primary.png" alt="Lumbre" width="120" />
</p>

# Playwright Python Automation Framework

Reusable Python/Pytest/Playwright infrastructure with one numbered Lumbre project.
The current system under test is the static Método Lumbre portal and its public
Tiendanube purchase destinations. Product copy is Spanish; engineering code and
documentation are English. The retired backend is not current test coverage.

## Organization

```text
test-framework/
├── automation/              Generic configuration, adapters and evidence
├── tests/framework/         Generic infrastructure tests
└── projects/lumbre/
    ├── pages/               Page composition/navigation
    ├── components/          Reusable planner/laboratory interactions
    ├── data/                Independent scenario inputs
    ├── support/             Serialized PDF/regression transport
    ├── conftest.py          Browser isolation and target guards
    └── tests/
        ├── api/system/      Numbered public GET contracts
        └── ui/              Numbered home/recipes/lab/planner/commerce cases
```

One behavior per `test_ui_NNN_*.py` or `test_api_NNN_*.py`. Input variants retain
their ID. Feature folders describe ownership; strict Pytest markers select
local, matrix, cross-browser, published-portal and store execution categories.

## Install and run

```bash
cd test-framework
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
playwright install chromium firefox webkit
cd ../portal
npm ci
cd ..
bash scripts/test-local.sh
```

The main runner builds a static artifact, owns a temporary preview on port 3001,
runs framework plus local portal cases and archives HTML/JUnit/trace evidence.
It never starts the old backend, initializes D1 or resets remote data. An occupied
preview port is an error; the runner will not stop a process owned by the user.

```bash
bash scripts/test-local.sh -m 'portal and laboratory'
bash scripts/test-local.sh --headed --slowmo=350 -m 'portal and smoke'
# The following local runners require an existing static preview on port 3001:
bash scripts/test-static-ui.sh
bash scripts/test-static-cross-browser.sh
# Explicit public read-only validation:
bash scripts/test-production.sh
bash scripts/test-store-ui.sh
```

Bare Pytest from `test-framework/` selects framework/local portal, requiring a
preview unless selecting `-m framework_unit`. Local cases reject public targets.
The full local runner is sequential because specialized PDF scripts share paths;
CI runs independent matrix lanes against the same prebuilt static artifact.

## Current coverage and results

The active project contains 67 numbered UI/API modules and four architecture
contracts. Collection has 457 parameterized executions: 426 local/framework and
31 explicit public portal/store cases. The UI-092–UI-104 extension adds 13
behaviors / 177 executions, including all 53 published almanac documents at two
widths, large blends, multi-stage plans, keyboard, network recovery and A4 PDFs.
Existing matrices still traverse 48 planner configurations, 60 ingredients and
100 recipe sheets; this does not mean every possible ingredient subset/duration.

Latest full local run: 416 passed / 10 failed in 27 min 19 s. Four initial
test-development failures passed after scoped-alert / uppercase-PDF corrections;
the six remaining Chromium failures expose real focus defects in custom dialogs.
Focused final three-engine run: 28 passed / 20 failed (18 focus variants and two
WebKit product-chunk recovery failures). Final PDF run: five passed; all 12 pages
were rendered and inspected. Model/profile contracts: 53 passed. Raw results are
retained, not rewritten into an all-green report. See the
[execution record](docs/TEST_MIGRATION_2026-10-09.md#coverage-extension-ui-092ui-104)
and [full report](test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/report.html).

The 31 external cases were deselected in this extension, not validated or marked
as passing; their previous network limitation remains unresolved. Store tests do
not create carts, orders, payments or inventory changes.

GitHub deploy gates preserve build/model, general UI, component matrices and
browser compatibility before publication. Published smoke runs afterwards;
external store checks are a separate manual workflow. This cleanup is local and
does not itself commit or deploy.

## Documentation

- [Active tree, case numbering and commands](test-framework/projects/lumbre/README.md)
- [Current architecture and execution lanes](docs/STATIC_TEST_ARCHITECTURE.md)
- [Migration, original IDs and cleanup](docs/TEST_MIGRATION_2026-10-09.md)
- [Coverage plan](docs/UI_COVERAGE_PLAN.md)
- [Adding a project](docs/ADDING_A_PROJECT.md)
- [Static portal](docs/STATIC_PORTAL.md)

Retired account/cart/admin/backend tests and their runners were removed after
integration. They remain recoverable in Git at `aeaf9f4`. Historical design and
execution records are documentation only, not extra runnable suites.
