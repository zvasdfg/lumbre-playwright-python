# Adding a New Automation Project

This guide explains how to connect another system under test to the reusable
Python and Playwright automation core. A project owns all product knowledge;
the core must remain unaware of its routes, selectors, payloads, and reset
mechanisms.

## 1. Architectural boundary

Use this decision rule:

> If code names a product concept, endpoint, selector, or test-data rule, it
> belongs in `projects/<project>/`. If it can serve another system unchanged,
> it may belong in `automation/`.

The reusable packages are:

```text
automation/
├── core/
│   ├── config.py       Environment-derived execution settings
│   ├── contracts/      OpenAPI and JSON Schema validation
│   └── reporting/      Steps, values, evidence, and pytest-html hooks
└── adapters/
    └── playwright/     Generic Pytest fixtures backed by Playwright
```

Lumbre is the reference consumer under `projects/lumbre/`; it is not part of
the automation core.

## 2. Create the project package

Choose a lowercase Python package name. For a fictional Example Store:

```text
projects/example_store/
├── __init__.py
├── api/
│   ├── __init__.py
│   └── example_store_api.py
├── components/
├── pages/
├── conftest.py
└── tests/
    ├── api/
    └── ui/
```

Add `__init__.py` to every directory imported as a Python package. Functional
domain folders beneath `tests/` may remain ordinary Pytest directories.

Do not copy Lumbre selectors, routes, reset behavior, or payloads into the new
project. Reuse structure and conventions, not product knowledge.

## 3. Use the generic fixtures

The root Pytest configuration loads
`automation.adapters.playwright.pytest_plugin`. Every project can consume:

| Fixture | Provided behavior |
| --- | --- |
| `app_url` | Normalized `BASE_URL` |
| `browser_context_args` | Configured locale and viewport |
| `api_request_context` | Session-level Playwright `APIRequestContext` |
| `page` | Isolated page from `pytest-playwright` |
| `test_log` | Steps, values, timing, and optional UI screenshots |

The project must add fixtures for its own API client, Page Objects, test-data
lifecycle, authentication, or OpenAPI location.

Example `projects/example_store/conftest.py`:

```python
import pytest
from playwright.sync_api import APIRequestContext, Page

from projects.example_store.api.example_store_api import ExampleStoreApi
from projects.example_store.pages.home_page import HomePage


@pytest.fixture
def api(api_request_context: APIRequestContext) -> ExampleStoreApi:
    return ExampleStoreApi(api_request_context)


@pytest.fixture
def home(page: Page, app_url: str) -> HomePage:
    home_page = HomePage(page, app_url)
    home_page.open()
    return home_page
```

Add an autouse reset fixture only when the SUT provides a deterministic reset
contract. A test-only endpoint such as Lumbre's is not a core requirement.

## 4. Add a domain API client

The client owns repeated transport mechanics and domain route names. Tests own
payload selection and assertions.

```python
from typing import Any

from playwright.sync_api import APIRequestContext, APIResponse, expect


class ExampleStoreApi:
    def __init__(self, request: APIRequestContext) -> None:
        self._request = request

    def health(self) -> dict[str, Any]:
        response = self._request.get("/api/health")
        expect(response).to_be_ok()
        return response.json()

    def create_order(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/orders", data=payload)
```

Keep generic HTTP abstractions out until at least two projects demonstrate the
same repeated need. A speculative universal API client usually hides useful
domain intent.

## 5. Add Page and Component Objects

Page and Component Objects remain project-specific because selectors and
accessible names are part of the SUT contract.

```python
from playwright.sync_api import Page


class HomePage:
    def __init__(self, page: Page, base_url: str) -> None:
        self.page = page
        self.base_url = base_url.rstrip("/")
        self.primary_action = page.get_by_role("button", name="Start order")

    def open(self) -> None:
        self.page.goto(self.base_url, wait_until="domcontentloaded")
```

Do not create generic wrappers for `click()`, `fill()`, locators, or
Playwright assertions. Add an abstraction only when it represents reusable
product behavior or framework infrastructure.

## 6. Write normalized tests

Every functional test keeps stable case metadata and the existing step/value
evidence convention:

```python
import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.example_store.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case("STORE-UI-001", "A shopper can begin an order")
def test_shopper_begins_order(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Begin an order"):
        home.primary_action.click()

    with test_log.step("Validate the resulting workflow"):
        expect(home.page.get_by_role("heading", name="Your order")).to_be_visible()
```

Register a new marker in `pyproject.toml` only when it represents a reusable
selection dimension. Product case IDs do not require one marker per project.

## 7. Configure the project

The generic core recognizes:

```dotenv
BASE_URL=https://example.test
HEADLESS=true
DEFAULT_TIMEOUT_MS=10000
AUTOMATION_PROJECT=Example Store
LOCALE=en-US
VIEWPORT_WIDTH=1440
VIEWPORT_HEIGHT=1000
```

`AUTOMATION_PROJECT` changes report identity, not test selection. Never place a
secret in a public frontend variable or commit a real `.env` file.

## 8. Register default collection

To include the project in an unqualified `pytest` run, add its tests to
`[tool.pytest.ini_options].testpaths`:

```toml
testpaths = [
  "tests/framework",
  "projects/lumbre/tests",
  "projects/example_store/tests",
]
```

Otherwise, run it explicitly without changing the default portfolio suite:

```bash
cd test-framework
AUTOMATION_PROJECT="Example Store" \
BASE_URL=https://example.test \
.venv/bin/pytest -q projects/example_store/tests
```

## 9. Add local lifecycle orchestration only when needed

The root `scripts/test-local.sh` starts the Lumbre SUT and is intentionally
project-specific. A new locally managed SUT should receive its own explicit
runner, for example `scripts/test-example-store-local.sh`.

That runner should:

1. create isolated test data;
2. start only the required services;
3. poll a health endpoint with a bounded timeout;
4. export `BASE_URL` and `AUTOMATION_PROJECT`;
5. execute `projects/example_store/tests`;
6. archive reports and traces;
7. stop services and remove temporary data through a trap/finalizer.

Do not add product startup logic to the generic Pytest plugin.

## 10. Optional OpenAPI integration

If the new API publishes an OpenAPI document, expose a project fixture:

```python
from automation.core.contracts import OpenApiContract


@pytest.fixture(scope="session")
def openapi_contract(api_request_context) -> OpenApiContract:
    response = api_request_context.get("/openapi.json")
    return OpenApiContract(response.json())
```

The reusable adapter supports document validation, local `$ref` resolution,
request validation, and status-specific response validation. The project owns
the contract URL and the operations it exercises.

## 11. Quality gates before registration

Before considering a project integrated, require:

```bash
cd test-framework
.venv/bin/ruff format --check automation projects tests
.venv/bin/ruff check automation projects tests
.venv/bin/mypy automation projects tests
.venv/bin/pytest -q tests/framework
.venv/bin/pytest -q projects/example_store/tests
```

Also verify:

- no imports from another product project;
- no product concepts added to `automation/`;
- no committed secrets or generated reports;
- tests run independently and in any order;
- failure evidence identifies inputs, observations, and expectations;
- project documentation states setup, environment, markers, and ownership.

## 12. Pull-request checklist

- [ ] Project package and `__init__.py` files added.
- [ ] API, Page, and Component Objects remain inside the project.
- [ ] Project fixtures consume generic Playwright fixtures.
- [ ] Case metadata and risk catalog updated.
- [ ] Local or remote execution command documented.
- [ ] OpenAPI fixture added when a published contract exists.
- [ ] Static checks and framework unit tests pass.
- [ ] Project functional suite passes without modifying another project.
