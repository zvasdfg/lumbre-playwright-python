# Playwright Python Automation Framework

Reusable Python automation core with a Lumbre reference project. It combines
Pytest, Playwright Sync API, project-owned Page and Component Objects, direct API
testing, executable OpenAPI/JSON Schema contracts, structured evidence, traces,
and self-contained HTML reports.

Project context, validated counts, and the complete quick start live in the
root [README](../README.md). System boundaries and dependency direction live in
[Architecture](../docs/ARCHITECTURE.md).

## Installation

```bash
cd test-framework
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
playwright install chromium firefox webkit
cp .env.example .env
```

Local configuration:

```dotenv
BASE_URL=http://127.0.0.1:3000
HEADLESS=true
DEFAULT_TIMEOUT_MS=10000
AUTOMATION_PROJECT=Lumbre
LOCALE=es-MX
VIEWPORT_WIDTH=1440
VIEWPORT_HEIGHT=1000
```

`BASE_URL` is shared by browser navigation and `APIRequestContext`. The managed
root runner overrides it with its temporary portal URL.

## Package layout

```text
test-framework/
├── automation/
│   ├── core/                   Configuration, contracts, reporting, diagnostics
│   └── adapters/playwright/    Generic Playwright Pytest fixtures
├── projects/
│   └── lumbre/
│       ├── api/                Domain APIRequestContext client
│       ├── components/         Product-owned Component Objects
│       ├── pages/              Product-owned Page Objects
│       ├── conftest.py         Lumbre lifecycle and domain fixtures
│       └── tests/              API, UI, network, and browser contracts
├── tests/framework/            Unit tests for reusable framework behavior
├── templates/                  Learning scaffolds
└── pyproject.toml              Dependencies and Pytest configuration
```

## Conventions

- `automation` must not import from `projects`.
- Projects own tests, Page Objects, Component Objects, API clients, and product fixtures.
- The core owns configuration, contracts, reporting, and generic tool adapters.
- `LumbreApi` owns Lumbre routes and transport details inside its project.
- Reporting hooks own screenshots, metadata, URLs, and traces without knowing the SUT.

One behavior or equivalent parameterized contract family belongs in each file:

```text
test_<layer>_<first_id>_<behavior_or_contract_family>.py
```

Every dataset retains stable case metadata and a Pytest ID. Automation code and
technical messages use English; locators and expectations preserve Spanish when
they match the product contract.

## Fixtures and isolation

| Fixture | Responsibility |
| --- | --- |
| `page` | Clean Playwright browser context per UI test |
| `browser_context_args` | `es-MX` locale and `1440x1000` viewport |
| `api_request_context` | Session-scoped direct HTTP context |
| `api` | Domain wrapper around APIRequestContext |
| `openapi_contract` | Contract downloaded from the active `BASE_URL` |
| `home` | Ready `HomePage` opened at the configured base URL |
| `test_log` | Case narrative, steps, values, timing, and screenshots |
| `reset_scenario` | Deterministic API reset before each test |

`app_url`, `browser_context_args`, `api_request_context`, and `test_log` are
supplied by the reusable Playwright adapter. `api`, `openapi_contract`, `home`,
and `reset_scenario` belong to Lumbre and demonstrate the fixtures a consuming
project may define.

`scripts/test-local.sh` copies version-controlled hypothesis JSON into a
temporary directory before starting the portal. Persistence scenarios therefore
write real files without changing repository seed data. The runner also sets
the portal environment explicitly to `test`; mutation contracts and
`/api/test/reset` are never enabled by a production build.

## Running tests

From the project root:

```bash
# Full managed suite
./scripts/test-local.sh -q

# Layer selection
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m ui
./scripts/test-local.sh -q -m contract

# Visible learning or investigation run
./scripts/test-local.sh -q -m ui --headed --slowmo 500

# Framework unit tests do not start or require the Lumbre portal
cd test-framework
.venv/bin/pytest -q tests/framework -m framework_unit
```

Against an already-running portal:

```bash
cd test-framework
BASE_URL=http://localhost:3000 .venv/bin/pytest -q projects/lumbre/tests/ui
```

## Executable API contracts

The SUT publishes its OpenAPI 3.1 description at
`/openapi/lumbre.openapi.json`. `OpenApiContract` obtains that document through
Playwright's `APIRequestContext`, validates the description, resolves local
schema references, and validates request or response payloads with JSON Schema
Draft 2020-12.

The adapter selects response schemas by path, method, and actual HTTP status.
A divergence reports actionable locations such as:

```text
Schema violation in response 200 from GET /api/health:
$.timestamp: 12345 is not of type 'string'
```

This boundary is intentionally independent of repository paths. Contract tests
can target any environment by changing `BASE_URL`; the portal is merely the
current system under test.

Quote a parameterized node ID in zsh:

```bash
./scripts/test-local.sh -q \
  'projects/lumbre/tests/ui/membership/test_ui_011_membership_modal_closes.py::test_membership_modal_closes[chromium-close-button]'
```

## Reporting and diagnostics

Each normal managed run writes a timestamped report:

```text
reports/runs/lumbre-report-YYYY-MM-DD_HH-MM-SS.html
```

The newest result is also copied to `reports/lumbre-report.html`. Pytest-html
updates the active file after each completed test, not after each individual
`test_log.step()`.

Every result includes case metadata, behavior, duration, steps, and values. UI
results also include the final URL and a viewport screenshot after each step.
UI failures add a full-page screenshot and a link to the retained trace. API
tests do not produce screenshots because they do not create a `Page`.

Open the latest report:

```bash
open test-framework/reports/lumbre-report.html
```

Open a retained failure trace:

```bash
cd test-framework
.venv/bin/playwright show-trace test-results/<test-directory>/trace.zip
```

Reports remain local because embedded Base64 screenshots can make a full-suite
HTML file exceed 20 MB.

## Static quality

```bash
cd test-framework
.venv/bin/ruff format --check .
.venv/bin/ruff check .
.venv/bin/mypy automation projects tests
```

## VS Code snippets

The shared workspace exposes scaffolds for UI tests, API tests, structured
steps, diagnostic values, locators, assertions, dialogs, and Component Objects.
Generated tests remain skipped until every TODO is implemented; placeholders
must never create a false pass.

See [Playwright Python snippets](../docs/PLAYWRIGHT_PYTHON_SNIPPETS.md) for the
available prefixes and examples.

## References

- [Test strategy and risk catalog](../docs/TEST_STRATEGY.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Adding a new automation project](../docs/ADDING_A_PROJECT.md)
- [Guided UI test creation protocol](../docs/GUIDED_UI_TEST_PROTOCOL.md)
- [Engineering case studies](../docs/ENGINEERING_CASE_STUDIES.md)
- [Key Playwright notes](../docs/KEY_PLAYWRIGHT_NOTES.md)
- [Playwright Python snippets](../docs/PLAYWRIGHT_PYTHON_SNIPPETS.md)
