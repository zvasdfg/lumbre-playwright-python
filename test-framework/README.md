# Lumbre Playwright Python Framework

Educational test automation framework for the Spanish-language Lumbre portal.
It uses Python, Pytest, Playwright Sync API, Page Object Model, Component
Objects, API clients, structured test steps, automatic screenshots, traces,
and a self-contained HTML report.

## Installation

```bash
cd test-framework
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
playwright install chromium
cp .env.example .env
```

Configuration in `.env`:

```dotenv
BASE_URL=http://127.0.0.1:3000
HEADLESS=true
DEFAULT_TIMEOUT_MS=10000
```

`BASE_URL` is used by page navigation and `APIRequestContext`. The root-level
scripts override it automatically with their managed local server URL.

## Architecture

```text
test-framework/
├── framework/
│   ├── api/lumbre_api.py
│   ├── components/
│   │   ├── cart_drawer.py
│   │   ├── event_reservation_modal.py
│   │   ├── events_section.py
│   │   ├── header.py
│   │   └── membership_modal.py
│   ├── pages/
│   │   ├── base_page.py
│   │   └── home_page.py
│   ├── reporting/
│   │   ├── html_report.py
│   │   ├── lumbre_report.css
│   │   └── test_logger.py
│   └── config.py
├── tests/
│   ├── api/             API-001 through API-006
│   ├── ui/              UI-001 through UI-011
│   └── conftest.py
├── templates/
└── pyproject.toml
```

Responsibilities:

- Tests describe behavior, assertions, and relevant diagnostic values.
- Page Objects expose page-level domain actions and reusable locators.
- Component Objects model reusable widgets such as modals and the cart.
- `LumbreApi` hides repeated HTTP transport details.
- Fixtures own resource lifecycle, state reset, locale, and viewport.
- Reporting code owns steps, screenshots, metadata, and HTML customization.

## Test conventions

Every scenario has its own file:

```text
test_<layer>_<id>_<behavior>.py
```

Every test declares layer and traceability markers and requests `test_log`:

```python
@pytest.mark.ui
@pytest.mark.case("UI-000", "Observable behavior description")
def test_example(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Perform an observable action"):
        # Act through a Page Object or Component Object.
        ...

    with test_log.step("Validate the expected result"):
        # Keep the business expectation visible in the test.
        ...
        test_log.values(
            observed_value="actual value",
            expected_value="test oracle",
        )
```

Use English for automation code, metadata, step names, comments, and technical
messages. Preserve Spanish only when a locator, expected message, API domain
value, recipe, product, or event must match the Spanish product.

## Fixtures and isolation

- `page`: provided by `pytest-playwright`; a clean browser context per test.
- `browser_context_args`: Spanish-Mexico locale and `1440x1000` viewport.
- `api_request_context`: session-scoped Playwright API context.
- `api`: domain wrapper around the API context.
- `home`: opens a ready `HomePage`.
- `test_log`: case narrative, step timing, values, and UI screenshots.
- `reset_scenario`: autouse API reset before every test.

Tests must not depend on execution order or state produced by another test.

## Running tests

From the project root, with automatic portal lifecycle:

```bash
./scripts/test-local.sh -q
./scripts/test-local.sh -q -m smoke
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m ui
./scripts/test-local.sh -q -m ui --headed --slowmo 500
```

Run one file:

```bash
./scripts/test-local.sh -q \
  tests/api/test_api_006_member_created_with_valid_data.py
```

Run a parameterized variant:

```bash
./scripts/test-local.sh -q \
  'tests/ui/test_ui_011_membership_modal_closes.py::test_membership_modal_closes[chromium-close-button]'
```

Against an already-running portal:

```bash
cd test-framework
BASE_URL=http://localhost:3000 .venv/bin/pytest -q tests/ui
```

## Reporting and diagnostics

```bash
./scripts/report-local.sh
open test-framework/reports/lumbre-report.html
```

The HTML report is regenerated after each completed test and includes case ID,
behavior, duration, logs, values, environment metadata, and final UI URL.
Every completed UI step adds a viewport screenshot. A failed UI test also adds
a full-page screenshot and a local link to `trace.zip`.

Pytest defaults retain traces and failure screenshots:

```text
--tracing=retain-on-failure
--screenshot=only-on-failure
```

Open a trace with:

```bash
cd test-framework
.venv/bin/playwright show-trace test-results/<test-directory>/trace.zip
```

## Static quality checks

```bash
cd test-framework
.venv/bin/ruff format --check framework tests
.venv/bin/ruff check framework tests
.venv/bin/mypy framework tests
```

## VS Code snippets

| Prefix | Generates |
| --- | --- |
| `pw-ui-test` | Complete UI test scaffold |
| `pw-api-test` | Complete API test scaffold |
| `pw-step` | Structured test step |
| `pw-values` | Observed/expected diagnostic values |
| `pw-visible` | Visibility assertion |
| `pw-not-visible` | Negative visibility assertion |
| `pw-text` | Exact text assertion |
| `pw-component` | Component Object scaffold |

Scaffolds remain skipped until their TODOs are completed. Never remove the
`skip` marker while a placeholder could produce a false positive.

## Detailed documentation

- [Test strategy and learning guide](../docs/TEST_STRATEGY_AND_PLAYWRIGHT_GUIDE.md)
- [Key Playwright notes](../docs/KEY_PLAYWRIGHT_NOTES.md)
- [Playwright Python snippets](../docs/PLAYWRIGHT_PYTHON_SNIPPETS.md)
- [HTML reporting guide](../docs/HTML_REPORTING.md)
