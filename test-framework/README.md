# Lumbre Playwright Python Framework

Python automation package for the Spanish-language Lumbre portal. It combines
Pytest, Playwright Sync API, Page Object Model, Component Objects, direct API
testing, structured evidence, traces, and self-contained HTML reports.

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
```

`BASE_URL` is shared by browser navigation and `APIRequestContext`. The managed
root runner overrides it with its temporary portal URL.

## Package layout

```text
test-framework/
├── framework/
│   ├── api/lumbre_api.py       Domain API operations
│   ├── components/             Bounded widget models
│   ├── pages/                  Page composition and navigation
│   ├── reporting/              Steps, evidence, and pytest-html hooks
│   └── config.py               Environment settings
├── tests/
│   ├── api/                    API-001 through API-020
│   ├── ui/                     UI-001 through UI-028, ERR-001, BROWSER-001
│   └── conftest.py             Fixtures and lifecycle
├── templates/                  Learning scaffolds
└── pyproject.toml              Dependencies and Pytest configuration
```

## Conventions

- Tests own behavior, test data, assertions, and diagnostic values.
- Page Objects own page-level entry points and composition.
- Component Objects own locators and actions inside bounded widgets.
- `LumbreApi` owns repeated HTTP routes and transport details.
- Fixtures own lifecycle, context settings, and deterministic reset.
- Reporting hooks own screenshots, metadata, URLs, and traces.

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
| `home` | Ready `HomePage` opened at the configured base URL |
| `test_log` | Case narrative, steps, values, timing, and screenshots |
| `reset_scenario` | Deterministic API reset before each test |

`scripts/test-local.sh` copies version-controlled hypothesis JSON into a
temporary directory before starting the portal. Persistence scenarios therefore
write real files without changing repository seed data.

## Running tests

From the project root:

```bash
# Full managed suite
./scripts/test-local.sh -q

# Layer selection
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m ui

# Visible learning or investigation run
./scripts/test-local.sh -q -m ui --headed --slowmo 500
```

Against an already-running portal:

```bash
cd test-framework
BASE_URL=http://localhost:3000 .venv/bin/pytest -q tests/ui
```

Quote a parameterized node ID in zsh:

```bash
./scripts/test-local.sh -q \
  'tests/ui/test_ui_011_membership_modal_closes.py::test_membership_modal_closes[chromium-close-button]'
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
.venv/bin/mypy framework tests
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
- [Engineering case studies](../docs/ENGINEERING_CASE_STUDIES.md)
- [Key Playwright notes](../docs/KEY_PLAYWRIGHT_NOTES.md)
- [Playwright Python snippets](../docs/PLAYWRIGHT_PYTHON_SNIPPETS.md)
