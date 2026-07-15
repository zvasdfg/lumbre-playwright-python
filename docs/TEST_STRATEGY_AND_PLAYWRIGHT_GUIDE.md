# Lumbre Test Strategy and Playwright Learning Guide

> Project: Lumbre  
> Perspective: Staff QA architecture and coaching  
> Audience: QA engineers moving from Selenium + TypeScript to Playwright + Python  
> Stack: Python, Pytest, Playwright Sync API, POM, Component Objects, APIRequestContext

## 1. Purpose

This repository has two equally important goals:

1. Protect meaningful Lumbre product behavior with reliable automated tests.
2. Teach modern test design and Playwright concepts instead of translating a
   Selenium framework line by line.

Success is measured by tests that:

- represent product risks;
- run independently and in any order;
- use the cheapest appropriate test layer;
- wait for observable conditions instead of arbitrary time;
- expose useful diagnostics when they fail;
- keep test intent separate from UI and HTTP mechanics.

The product UI is in Spanish. Automation code, metadata, steps, comments, and
documentation are in English. Spanish strings remain in locators and expected
values when they are part of the actual product contract.

## 2. Current state

The suite currently contains:

- 20 API test files: `API-001` through `API-020`;
- 30 browser-oriented test files: `UI-001` through `UI-028`, `ERR-001`,
  and `BROWSER-001`;
- 50 unique case IDs and 56 Pytest executions;
- parameterized variants for `API-020`, `UI-011`, `UI-027`, and
  `BROWSER-001`;
- 3 smoke executions: `API-001`, `UI-001`, and `UI-004`;
- Chromium as the installed/default browser;
- automatic deterministic data reset before every test;
- structured case, step, value, timing, and result logs;
- a viewport screenshot after every UI step;
- retained Playwright trace and full-page screenshot on UI failure;
- a self-contained `pytest-html` report updated after every completed test when
  the suite is launched through `report-local.sh`.
- an explicit smoke contract executed in Chromium, Firefox, and WebKit;
- 100% coverage of the 50-risk committed functional catalog.

The latest validated baseline is **56 passed**.

## 3. Strategy principles

### 3.1 Automate risks, not pages

Before writing a test, answer:

- What user or business behavior is protected?
- What failure are we trying to detect?
- Which layer can detect it most cheaply and precisely?
- What observable evidence proves the behavior works?

Use API tests for data rules, status codes, filtering, and response contracts.
Use UI tests when browser events, accessibility, rendering, or integration are
part of the risk. Reserve longer E2E journeys for a small number of critical
paths.

### 3.2 User-facing semantics are the locator contract

Preferred locator order:

1. `get_by_role()` with an accessible name.
2. `get_by_label()` for form controls.
3. `get_by_text()` for visible content.
4. `get_by_placeholder()`, `get_by_alt_text()`, or `get_by_title()`.
5. `get_by_test_id()` for an explicit non-semantic contract.
6. CSS or XPath only when no stable user-facing contract exists.

Strictness is valuable. If a locator matches two elements, fix the ambiguity
instead of hiding it with `.first` or `.nth()` unless position is genuinely the
business rule.

### 3.3 Every test starts clean

`pytest-playwright` provides a fresh browser context for each UI test. The
autouse `reset_scenario` fixture calls `/api/test/reset` before every test,
including API tests. Tests must never depend on another test or execution order.

### 3.4 Wait for conditions, never elapsed time

Do not use `time.sleep()` or `wait_for_timeout()` for functional synchronization.
Locator actions auto-wait for actionability, and Playwright assertions retry
until their condition succeeds or times out.

`BasePage.open()` intentionally waits for:

```python
page.locator("main[data-app-ready='true']").wait_for(state="attached")
```

That is a real product readiness boundary, not an arbitrary delay.

### 3.5 Tests express intent; framework layers encapsulate mechanics

```python
home.search_recipes("coliflor")
expect(home.recipe_named("Coliflor al rescoldo")).to_be_visible()
```

The test chooses the behavior and expected result. The Page Object knows how
to interact with the product. Assertions remain in the test so the oracle is
visible.

## 4. Selenium-to-Playwright mental model

| Traditional Selenium model | This Playwright framework | Practical consequence |
| --- | --- | --- |
| Manually managed driver | Pytest `page` fixture | Lifecycle belongs to the framework |
| Stored `WebElement` | Re-resolved `Locator` | Less stale-element behavior |
| Explicit waits everywhere | Auto-waiting and `expect()` | Less manual synchronization |
| CSS/XPath first | Role, label, and text first | Tests align with accessibility |
| Shared long-lived session | Context per test | Cheap isolation |
| Immediate boolean checks | Retrying web-first assertions | Fewer race-condition failures |
| Screenshot-only diagnosis | Steps, screenshots, and trace | Full execution history |
| Monolithic setup | Scoped fixtures | Explicit dependencies |

Important distinctions:

- A `Locator` is a reusable query, not a snapshot of a DOM node.
- `expect(locator)` retries; `locator.is_visible()` reads once.
- Plain `assert` is correct for already-materialized values such as JSON and
  HTTP status codes.
- Playwright Python uses `APIRequestContext` for direct HTTP testing and state
  setup without browser navigation.

## 5. Framework architecture

```text
test-framework/
├── framework/
│   ├── config.py
│   ├── api/lumbre_api.py
│   ├── pages/
│   │   ├── base_page.py
│   │   └── home_page.py
│   ├── components/
│   │   ├── header.py
│   │   ├── membership_modal.py
│   │   ├── cart_drawer.py
│   │   ├── events_section.py
│   │   ├── ingredient_lab.py
│   │   └── event_reservation_modal.py
│   └── reporting/
│       ├── test_logger.py
│       ├── html_report.py
│       └── lumbre_report.css
├── tests/
│   ├── conftest.py
│   ├── api/
│   └── ui/
├── templates/
└── pyproject.toml
```

### Layer responsibilities

Tests:

- tell one behavioral story;
- contain assertions and expected business results;
- select explicit data;
- log diagnostic inputs, observed values, and expectations.

Page Objects:

- represent full pages;
- expose domain actions;
- own reusable page-level locators;
- may return a `Locator` so the test can assert on it.

Component Objects:

- represent reusable widgets and bounded UI regions;
- own component-specific locators and actions;
- avoid deep inheritance hierarchies.

Fixtures:

- own setup, teardown, scope, browser context options, API context, and reset;
- must not hide the main business action under test.

API client:

- centralizes routes and repeated transport details;
- returns parsed JSON for expected-success query helpers;
- returns raw `APIResponse` when status/error behavior is part of the test.

Reporting:

- requires `@pytest.mark.case(case_id, behavior)` on every test;
- numbers and times `test_log.step()` blocks;
- logs `[VALUES]` before assertions;
- captures UI evidence after each step without changing test syntax;
- enriches the HTML report with metadata, logs, screenshots, URL, and trace.

## 6. Execution flow

### UI test

```text
Pytest collects the test and markers
        ↓
autouse reset_scenario restores demo data through the API
        ↓
pytest-playwright creates a clean BrowserContext and Page
        ↓
home fixture opens HomePage and waits for app readiness
        ↓
test_log records each step and captures a screenshot after it
        ↓
web-first assertions validate observable behavior
        ↓
reporting hook attaches logs, screenshots, URL, and failure artifacts
        ↓
Playwright closes the context
```

### API test

```text
Pytest collects the test and markers
        ↓
reset_scenario restores deterministic data
        ↓
session APIRequestContext sends HTTP requests
        ↓
test validates status and parsed JSON with plain assertions
        ↓
reporting hook attaches case metadata and logs
```

API tests do not create a page and therefore do not produce step screenshots.

## 7. Coverage and risk matrix

The table below is the automated test inventory; it is not, by itself, the
coverage denominator. The independent committed-risk catalog, current 100%
baseline, calculation method, and completed growth plan are documented in
[`TEST_COVERAGE_GROWTH_PLAN.md`](TEST_COVERAGE_GROWTH_PLAN.md).

Priority definitions:

- **P0:** breaks a core user or system objective.
- **P1:** degrades an important behavior and belongs in regular regression.
- **P2:** secondary behavior, edge case, or specialized learning goal.

| ID | Automated behavior / protected risk | Priority | Layer | Status |
| --- | --- | --- | --- | --- |
| API-001 | Service publishes a valid health status | P0 | API + smoke | Automated |
| API-002 | Recipe category filtering returns only requested data | P1 | API | Automated |
| API-003 | Demo data reset restores a known seed | P0 | API | Automated |
| API-004 | Product creation rejects a non-positive price | P1 | API negative | Automated |
| API-005 | Recipe filtering combines category and query | P1 | API | Automated |
| API-006 | Valid membership data creates a member with `201` | P0 | API | Automated |
| API-007 | Ingredient filtering combines family and text query | P1 | API | Automated |
| API-008 | Ingredient detail contains research and experiment data | P1 | API contract | Automated |
| API-009 | Formula validation reports duplicate and unknown items by position | P0 | API negative | Automated |
| API-010 | Ingredient order does not create a duplicate hypothesis | P0 | API persistence | Automated |
| API-011 | Registry ids remain unique and researched formulas retain sources | P1 | API integrity | Automated |
| API-012 | Dedicated hypothesis resource persists the Classic SPG duplicate counter | P1 | API persistence | Automated |
| API-013 | A unique formula creates and persists a new hypothesis with `201` | P0 | API persistence | Automated |
| API-014 | An unknown hypothesis returns a stable `404` contract | P1 | API negative | Automated |
| API-015 | Malformed hypothesis JSON is rejected without registry mutation | P0 | API negative | Automated |
| API-016 | An unknown ingredient returns a stable `404` contract | P1 | API negative | Automated |
| API-017 | Product collection count and item contracts remain consistent | P2 | API contract | Automated |
| API-018 | Valid product creation returns `201` and its representation | P1 | API positive | Automated |
| API-019 | Event collection count and item contracts remain consistent | P2 | API contract | Automated |
| API-020 | Invalid membership variants return the stable `422` contract | P0 | API parameterized negative | Automated |
| UI-001 | Home communicates Lumbre's purpose | P1 | UI + smoke | Automated |
| UI-002 | Category filter displays matching recipe cards only | P1 | UI | Automated |
| UI-003 | Empty recipe search explains that no matches exist | P1 | UI | Automated |
| UI-004 | Visitor can join the club | P0 | E2E + smoke | Automated |
| UI-005 | Adding a product updates feedback and cart count | P0 | UI | Automated |
| UI-006 | Positive search displays one matching recipe | P1 | UI | Automated |
| UI-007 | Membership form prevents submission without a name | P0 | UI validation | Automated |
| UI-008 | Cart removes an added product and returns to empty | P1 | UI | Automated |
| UI-009 | Cart totals multiple products correctly | P1 | UI | Automated |
| UI-010 | Event reservation confirms the selected event | P1 | E2E | Automated |
| UI-011 | Membership modal closes by button and backdrop | P2 | UI parameterized | Automated |
| UI-012 | Fire planner recommends fuel for a direct-fire gathering | P1 | UI Component Object | Automated |
| UI-013 | Membership form follows a logical keyboard focus order | P1 | Accessibility | Automated |
| UI-014 | Membership submission sends the expected API request | P0 | UI network | Automated |
| UI-015 | Ingredient catalog combines family and search filters | P1 | UI | Automated |
| UI-016 | Ingredient sheet exposes research and adds to the formula | P1 | UI Component Object | Automated |
| UI-017 | Experiment bench enforces the six-component limit | P0 | UI boundary | Automated |
| UI-018 | Known formula reuses its existing technical sheet | P0 | E2E deduplication | Automated |
| UI-019 | A unique formula creates and displays a new technical sheet | P0 | E2E persistence | Automated |
| UI-020 | Fewer than two ingredients cannot create a technical sheet | P0 | UI boundary | Automated |
| UI-021 | Removing a selected ingredient updates the experiment bench | P1 | UI state | Automated |
| UI-022 | The registry opens the selected complete technical sheet | P1 | UI Component Object | Automated |
| UI-023 | Slow-cooking mode applies its distinct fuel rate | P1 | UI calculation | Automated |
| UI-024 | The vegetable reserve changes the fuel recommendation | P1 | UI calculation | Automated |
| UI-025 | Demonstration checkout communicates its completion state | P2 | UI | Automated |
| UI-026 | Recipe feedback identifies the selected recipe | P2 | UI | Automated |
| UI-027 | Email and terms constraints prevent invalid membership submission | P0 | UI parameterized validation | Automated |
| UI-028 | Critical content remains usable without mobile horizontal overflow | P1 | Responsive UI | Automated |
| ERR-001 | Membership API failure keeps the form available for retry | P1 | UI route mocking | Automated |
| BROWSER-001 | Critical home smoke contract passes in Chromium, Firefox, and WebKit | P1 | Cross-browser | Automated |

## 8. Current test inventory

| File | Key technique |
| --- | --- |
| `test_api_001_health_endpoint.py` | Successful JSON helper and smoke contract |
| `test_api_002_recipes_filtered_by_category.py` | Collection transformation and category assertions |
| `test_api_003_reset_demo_data.py` | Deterministic environment control |
| `test_api_004_product_rejects_non_positive_price.py` | Expected negative response and raw `APIResponse` |
| `test_api_005_recipes_filter_combines_category_and_query.py` | Multiple query parameters and diagnostic assertion message |
| `test_api_006_member_created_with_valid_data.py` | POST payload, `201`, body contract, and returned identity |
| `test_api_007_ingredients_filter_combines_family_and_query.py` | Domain-specific query parameters and filtered collection contract |
| `test_api_008_ingredient_detail_exposes_research_data.py` | Nested JSON contract and experiment-readiness assertions |
| `test_api_009_hypothesis_validates_each_ingredient.py` | Negative POST and position-specific validation diagnostics |
| `test_api_010_hypothesis_deduplicates_ingredient_order.py` | Canonical signature and idempotent persistence behavior |
| `test_api_011_hypothesis_registry_has_research_provenance.py` | Registry-wide uniqueness, ordering, and source provenance |
| `test_api_012_classic_spg_duplicate_increments_counter.py` | `GET /api/hipotesis/:id`, duplicate POST, and isolated JSON persistence |
| `test_api_013_new_hypothesis_is_persisted.py` | Dynamic unused signature selection, `201`, and resource persistence |
| `test_api_014_resource_not_found_contracts.py` | Parameterized hypothesis and ingredient `404` contracts (`API-014`, `API-016`) |
| `test_api_015_malformed_hypothesis_does_not_mutate_registry.py` | Raw byte body and before/after mutation guard |
| `test_api_017_collection_contracts.py` | Parameterized product and event collection contracts (`API-017`, `API-019`) |
| `test_api_018_valid_product_is_created.py` | Positive POST representation contract |
| `test_api_020_invalid_membership_is_rejected.py` | Parameterized API validation variants |
| `test_ui_001_home_communicates_club_purpose.py` | Smoke visibility and visible brand contract |
| `test_ui_002_recipe_filters_matching_cards.py` | Filter action, locator collection, and count retry |
| `test_ui_003_recipe_search_empty_state.py` | Negative UI state and zero results |
| `test_ui_004_member_joins_club.py` | Full membership journey and accessible form controls |
| `test_ui_005_product_added_to_cart.py` | Toast feedback and persistent cart count |
| `test_ui_006_recipe_search_finds_recipe.py` | Positive search and filtered locator |
| `test_ui_007_membership_constraint_validations.py` | Parameterized name, email, and terms validation through `evaluate()` (`UI-007`, `UI-027`) |
| `test_ui_008_cart_removes_product.py` | Component Object and negative visibility |
| `test_ui_009_cart_total_multiple_products.py` | Multiple products, looped assertions, and total oracle |
| `test_ui_010_event_reservation_confirmation.py` | Scoped dialog and reservation confirmation |
| `test_ui_011_membership_modal_closes.py` | Pytest parametrization and equivalent close mechanisms |
| `test_ui_012_fire_planner_cooking_styles.py` | Parameterized direct and slow cooking-style fuel oracles (`UI-012`, `UI-023`) |
| `test_ui_013_membership_keyboard_focus_order.py` | Keyboard activation, sequential typing, Tab order, and focus assertion |
| `test_ui_014_membership_submits_expected_request.py` | `page.expect_request()` and browser-to-API payload contract |
| `test_ui_015_ingredient_catalog_combines_filters.py` | Select and search interaction with locator collection assertions |
| `test_ui_016_ingredient_sheet_adds_to_formula.py` | Scoped ingredient dialog and cross-component state update |
| `test_ui_017_ingredient_formula_enforces_six_component_limit.py` | Boundary-value selection and disabled-state assertion |
| `test_ui_018_existing_formula_reuses_hypothesis.py` | `page.expect_response()`, deduplication, and technical-sheet integration |
| `test_ui_019_unique_formula_creates_hypothesis.py` | Dynamic data selection, browser `201` observation, and registry persistence |
| `test_ui_020_formula_requires_two_ingredients.py` | Minimum boundary and disabled-state assertions |
| `test_ui_021_selected_ingredient_can_be_removed.py` | Component removal and dependent state update |
| `test_ui_022_registry_opens_complete_hypothesis.py` | Registry-card identity and full technical-sheet sections |
| `test_ui_024_vegetable_reserve_changes_fuel.py` | Before/after calculation-state comparison |
| `test_ui_025_checkout_communicates_completion.py` | Cart-to-feedback integration |
| `test_ui_026_recipe_action_identifies_selection.py` | Scoped recipe action and exact identity feedback |
| `test_ui_028_mobile_viewport_keeps_critical_content_usable.py` | Runtime viewport change and DOM overflow measurement |
| `test_browser_001_smoke_engines.py` | Direct Chromium, Firefox, and WebKit engine lifecycle |
| `test_err_001_membership_server_error.py` | `page.route()`, HTTP 500 fulfillment, and recoverable form state |

## 9. Rules for new tests

### One behavior or contract family per file

Keep unrelated behaviors isolated. Closely equivalent contracts may share one
parameterized file when every dataset retains its own case marker and Pytest ID.

```text
test_<layer>_<first_id>_<behavior_or_contract_family>.py
```

Do not add unrelated `test_*` functions to an existing scenario file. Shared
fixtures and helpers belong in `conftest.py`, Page Objects, Component Objects,
or API clients.

### Arrange, Act, Assert through observable steps

```python
@pytest.mark.ui
@pytest.mark.case("UI-000", "The observable behavior")
def test_behavior(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Prepare the scenario"):
        test_data = "..."
        test_log.values(input_value=test_data)

    with test_log.step("Perform the user action"):
        home.search_recipes(test_data)

    with test_log.step("Validate the observable result"):
        expect(home.recipe_cards).to_have_count(1)
        test_log.values(
            observed_count=home.recipe_cards.count(),
            expected_count=1,
        )
```

One step should represent one observable action or validation. The framework
captures one screenshot at the end of each UI step, so an oversized step hides
intermediate states.

### Log before asserting

Record the actual value and oracle before the assertion so failures retain the
diagnostic context:

```python
test_log.values(observed_status=response.status, expected_status=201)
assert response.status == 201
```

Never log passwords, tokens, secrets, or real personal information.

### Incomplete tests must not pass

Scaffolds include:

```python
@pytest.mark.skip(reason="Pending exercise: complete the TODOs and remove this marker")
```

Keep the marker until all placeholders and TODOs are replaced. `assert ...` is
not a placeholder because `Ellipsis` is truthy and would create a false pass.

### Avoid stability anti-patterns

Do not use:

- arbitrary sleeps;
- `force=True` without a documented investigation;
- broad CSS/XPath when semantics exist;
- shared mutable state between tests;
- hidden assertions inside action methods;
- large generic helpers such as `click_button(name)`.

## 10. Reporting and failure diagnosis

Generate the report:

```bash
./scripts/report-local.sh
open test-framework/reports/lumbre-report.html
```

Successful UI results display their logs and screenshot gallery. API results
display their steps, values, status diagnostics, and case metadata.

For failures, investigate in this order:

1. Failed case and step.
2. `[VALUES]` inputs, actual values, and oracle.
3. Playwright call log and exception.
4. Step screenshot and full-page failure screenshot.
5. `trace.zip`: action timeline, DOM snapshots, console, and network.
6. Test data, locator semantics, and product readiness.

Open a trace:

```bash
cd test-framework
.venv/bin/playwright show-trace test-results/<test-directory>/trace.zip
```

## 11. Local commands

From the project root:

```bash
# Complete suite with managed portal lifecycle
./scripts/test-local.sh -q

# HTML report
./scripts/report-local.sh

# Markers
./scripts/test-local.sh -q -m smoke
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m ui

# One test file
./scripts/test-local.sh -q \
  tests/api/test_api_006_member_created_with_valid_data.py

# Headed learning run
./scripts/test-local.sh -q \
  tests/ui/test_ui_011_membership_modal_closes.py \
  --headed --slowmo 500

# Route mocking and recoverable UI behavior
./scripts/test-local.sh -q \
  tests/ui/test_err_001_membership_server_error.py

# One parameterized variant; quote the node ID in zsh
./scripts/test-local.sh -q \
  'tests/ui/test_ui_011_membership_modal_closes.py::test_membership_modal_closes[chromium-backdrop]'
```

Against an already-running portal:

```bash
cd test-framework
BASE_URL=http://localhost:3000 .venv/bin/pytest -q tests/ui
```

Static quality:

```bash
cd test-framework
.venv/bin/ruff format --check framework tests
.venv/bin/ruff check framework tests
.venv/bin/mypy framework tests
```

## 12. Learning path

Completed foundation:

1. Test anatomy, fixtures, Page Objects, and web-first assertions.
2. Semantic locators, filtering, strictness, and collections.
3. Structured steps, values, screenshots, traces, and HTML reporting.
4. Component Objects for cart, membership, and event interactions.
5. APIRequestContext for positive, negative, filtered, and POST contracts.
6. Pytest parametrization through `UI-011`.
7. Network interception and synthetic HTTP failures through `ERR-001`.
8. New product-component discovery and integration through `UI-012`.
9. Keyboard activation, sequential typing, focus order, and DOM evaluation
   through `UI-013`.
10. Browser request observation and payload validation through `UI-014`.
11. Ingredient-laboratory Component Object, nested API contracts, boundary
    values, canonical deduplication, and response observation through
    `API-007`–`API-011` and `UI-015`–`UI-018`.
12. Isolated filesystem persistence and before/after counter verification
    through `API-012`.
13. Positive creation, malformed payloads, stable `404` contracts, and
    collection schemas through `API-013`–`API-020`.
14. Dynamic new-record creation, minimum and removal boundaries, registry
    detail, calculation branches, native validation, and responsive layout
    through `UI-019`–`UI-028`.
15. Explicit browser-engine lifecycle and compatibility through
    `BROWSER-001` in Chromium, Firefox, and WebKit.

Recommended next exercises:

1. Add automated accessibility scanning while preserving semantic assertions.
2. Introduce targeted visual regression for the large technical-sheet dialog.
3. Add CI browser lanes only after defining artifact retention and retry policy.
4. Reassess the risk denominator whenever a new product behavior is added.

## 13. Review checklist

A new test is ready when:

- its ID exists in the risk matrix;
- its name describes behavior and result;
- it has exactly one primary risk;
- it passes alone and in the complete suite;
- it is independent and deterministic;
- reusable actions live in the correct framework layer;
- UI expectations use web-first assertions;
- API assertions validate status and relevant body fields;
- logs include useful actual and expected values;
- no secret or real personal data is recorded;
- no sleep, unjustified force, brittle selector, or false-positive TODO remains;
- its failure artifacts explain what happened.

## Official references

- [Locators](https://playwright.dev/python/docs/locators)
- [Actionability and auto-waiting](https://playwright.dev/python/docs/actionability)
- [Assertions](https://playwright.dev/python/docs/test-assertions)
- [Isolation](https://playwright.dev/python/docs/browser-contexts)
- [Page Object Model](https://playwright.dev/python/docs/pom)
- [Pytest plugin](https://playwright.dev/python/docs/test-runners)
- [API testing](https://playwright.dev/python/docs/api-testing)
- [Trace Viewer](https://playwright.dev/python/docs/trace-viewer-intro)
