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
        └── ui/              Numbered home/recipes/lab/planner/commerce cases
```

One behavior per `test_ui_NNN_*.py`. Input variants retain
their ID. Feature folders describe ownership; strict Pytest markers select
local, matrix, cross-browser and optional store execution categories.

## Install and run

```bash
cd test-framework
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev,lumbre]'
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
bash scripts/test-store-ui.sh
```

Bare Pytest from `test-framework/` selects framework/local portal, requiring a
preview unless selecting `-m framework_unit`. Local cases reject public targets.
The full local runner is sequential because specialized PDF scripts share paths;
CI selects the same numbered cases with Pytest markers: isolated cases use two
workers, shared-file/PDF cases run serially in their own job, and component
matrices and Firefox/WebKit checks use independent lanes. Every job validates
the same prebuilt artifact and gates deployment.

## Current coverage and results

The active project contains 64 numbered UI behaviors and four architecture
contracts. Collection has 453 parameterized executions: 429 local/framework and
24 optional read-only Tiendanube checks. The UI-092–UI-104 extension adds 13
behaviors / 180 executions, including all 53 published almanac documents at two
widths, large blends, multi-stage plans, keyboard, network recovery and A4 PDFs.
Other matrices traverse 48 planner configurations, 60 ingredients and 100 recipes.
This is finite coverage, not every possible ingredient subset or stage sequence.

October 12 final PDF-code correction: all 429 local/framework executions passed.
The preceding native-dialog/recovery revision passed 78 three-engine compatibility
executions and six focused headed cases. CI must validate the final revision.
Counts overlap Chromium coverage and do not imply exhaustive combinations.
Earlier cleanup/headed failures remain historical evidence, not erased results.
See [current browser/CI evidence](docs/BROWSER_CI_FIXES_2026-10-12.md),
[cleanup evidence](docs/STATIC_RETIREMENT_2026-10-09.md) and
[migration history](docs/TEST_MIGRATION_2026-10-09.md).

Actions tests the built artifact before publishing. After publication only a
short HTML/JavaScript hash check remains, not another browser suite. Optional
store checks use a separate manual workflow and perform no cart, payment, order
or inventory write. There is no active application backend or database runtime.

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
