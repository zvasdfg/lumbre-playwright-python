# Playwright Python Automation Framework

## Current organization — 2026-10-09

```text
test-framework/
├── automation/                 Reusable configuration, browser and reporting
├── tests/framework/            Tests of that reusable infrastructure
├── projects/
│   └── lumbre/                 Portal and public-store project
│   │   ├── pages/
│   │   ├── components/
│   │   ├── data/
│   │   ├── support/
│   │   ├── conftest.py
│   │   └── tests/
│   │       └── ui/
│   │           ├── almanac/test_ui_NNN_*.py
│   │           ├── home/test_ui_NNN_*.py
│   │           ├── recipes/test_ui_NNN_*.py
│   │           ├── ingredient_lab/test_ui_NNN_*.py
│   │           ├── fire_planner/test_ui_NNN_*.py
│   │           └── commerce/test_ui_NNN_*.py
├── templates/                  Page/component/test scaffolds
└── pyproject.toml              Dependencies, strict markers and discovery
```

Start here: [active project guide](projects/lumbre/README.md),
[source-to-ID migration](../docs/TEST_MIGRATION_2026-10-09.md), and
[architecture](../docs/STATIC_TEST_ARCHITECTURE.md).

The active project follows the original numbered, feature-separated design.
Matrices and optional store integration are selected with Pytest
markers under the same tree. The reusable `automation` core has no project imports.

## Installation

```bash
cd test-framework
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev,lumbre]'
playwright install chromium firefox webkit
cp .env.example .env
```

## Execute

From the repository root, the main runner owns a temporary static preview:

```bash
bash scripts/test-local.sh
```

With an existing static preview on port 3001:

```bash
bash scripts/test-static-ui.sh
bash scripts/test-static-ui.sh -m 'portal and laboratory'
bash scripts/test-static-cross-browser.sh
bash scripts/test-store-ui.sh
```

From `test-framework/`, `BASE_URL=http://127.0.0.1:3001 .venv/bin/pytest` runs
framework and local portal cases. `pytest -m framework_unit` needs no app server.
Optional store tests require explicit `-m store` and an HTTPS target.

HTML/JUnit reports and browser failure evidence are retained per invocation.
Each UI file owns one case ID; parameter variants retain that ID.
Neither collection counts nor parameter counts imply exhaustive product coverage.
Store tests are read-only; checkout/payment still require an authorized sandbox.

## Retired coverage

Obsolete backend cases, backend lifecycle fixtures and the parallel backend runner
are removed. Original sources can be recovered from Git at `aeaf9f4` if needed;
they are not current product coverage. [Historical documentation](../docs/LEGACY_TEST_FRAMEWORK.md)
is explicitly archival, not an executable runbook. The original IDs retained for
current behavior remain under `projects/lumbre/tests`.
