# Playwright Python Snippets

Practical reference for the Lumbre framework. Examples use Playwright Sync API,
Pytest, Page Objects, Component Objects, structured test steps, and web-first
assertions.

## 1. Generate scaffolds in VS Code

In a Python file, type a prefix and press Tab:

| Prefix | Generates |
| --- | --- |
| `pw-ui-test` | Complete skipped UI test scaffold |
| `pw-api-test` | Complete skipped API test scaffold |
| `pw-step` | `test_log.step()` block |
| `pw-values` | Observed and expected value log |
| `pw-visible` | Visibility assertion |
| `pw-not-visible` | Negative visibility assertion |
| `pw-text` | Exact text assertion |
| `pw-component` | Component Object scaffold |

Equivalent copyable files exist in `test-framework/templates/`.

Generated tests contain a skip marker. Keep it until every TODO is complete:

```python
@pytest.mark.skip(reason="Pending exercise: complete the TODOs and remove this marker")
```

## 2. Semantic locators

The portal is Spanish, so accessible locator strings intentionally preserve
Spanish product copy:

```python
page.get_by_role("button", name="Confirmar reservación")
page.get_by_label("Correo electrónico")
page.get_by_placeholder("Buscar receta...")
page.get_by_text("Lugar apartado", exact=False)
page.get_by_test_id("recipe-card")
```

Scope inside a component to avoid ambiguity:

```python
cart = page.get_by_role("dialog", name="Tu canasta")
remove_button = cart.get_by_role("button", name="Eliminar Pinzas Forja 45")
```

Filter a collection by contained semantics:

```python
card = page.get_by_test_id("recipe-card").filter(
    has=page.get_by_role("heading", name="Coliflor al rescoldo")
)
```

Use `exact=True` when the product contract requires an exact accessible name.

## 3. Common UI actions

```python
locator.click()
locator.fill("coliflor")
locator.check()
locator.select_option("intermedio")
page.goto("http://localhost:3000")
```

Do not add `wait_for_timeout()` after these actions. Playwright waits for
actionability automatically.

## 4. Web-first assertions

```python
expect(locator).to_be_visible()
expect(locator).not_to_be_visible()
expect(locator).to_have_text("Exact text")
expect(locator).to_contain_text("Stable fragment")
expect(locator).to_have_count(2)
expect(locator).to_be_focused()
expect(locator).to_have_attribute("required", "")
```

Web-first assertions retry until success or timeout. Avoid replacing them with
one-time reads for dynamic UI:

```python
# More race-prone for dynamic state
assert locator.is_visible() is True
```

## 5. Structured steps and values

```python
with test_log.step("Validate the cart total"):
    expect(home.cart.total).to_have_text(expected_total)
    test_log.values(
        observed_total=home.cart.total.inner_text(),
        expected_total=expected_total,
    )
```

For UI tests, each completed step automatically creates one viewport screenshot
in the HTML report. Keep each step focused on one observable action or result.

Log useful inputs, actual values, and oracles. Do not log passwords, tokens,
secrets, or real personal information.

## 6. Locator collections

Wait for the expected collection state before reading it:

```python
expect(home.recipe_cards).to_have_count(2)

observed_count = home.recipe_cards.count()
observed_titles = home.recipe_cards.get_by_role("heading").all_inner_texts()
```

Avoid calling `all()` on a dynamically loading collection before a condition
confirms that it is ready.

## 7. DOM properties with `evaluate()`

Use `evaluate()` when Playwright has no dedicated API for the required browser
property:

```python
name_is_missing = home.membership.name_input.evaluate(
    "element => element.validity.valueMissing"
)
assert name_is_missing is True
```

The JavaScript executes in the page and serializes its result back to Python.
Prefer dedicated Playwright APIs whenever one exists.

## 8. API GET and parsed JSON

Successful query helpers can return parsed JSON:

```python
response = api.recipes(category="vegetales", query="duraznos")

observed_count = response["count"]
expected_count = 1
test_log.values(
    observed_count=observed_count,
    expected_count=expected_count,
)
assert observed_count == expected_count
```

## 9. API POST and raw APIResponse

Return `APIResponse` when the test must validate status or expected errors:

```python
payload = {
    "name": "Ana Parrilla",
    "email": "ana.parrilla@example.test",
    "experience": "intermedio",
    "terms": "accepted",
}

response = api.create_member(payload)
body = response.json()

test_log.values(
    observed_status=response.status,
    expected_status=201,
    observed_created=body["created"],
    expected_created=True,
)

assert response.status == 201
assert body["created"] is True
```

`response.status` is a property. `response.json()` is a method.

## 10. Negative API response

```python
payload = {
    "name": "Test grill",
    "category": "tools",
    "price": 0,
}

response = api.create_product(payload)
body = response.json()

assert response.status == 422
assert body["error"] == "name, category and a positive price are required"
```

Do not call a helper that asserts `to_be_ok()` when a `4xx` response is the
expected behavior.

## 11. Pytest parametrization

```python
@pytest.mark.parametrize(
    "close_method",
    ["button", "backdrop"],
    ids=["close-button", "backdrop"],
)
def test_membership_modal_closes(
    home: HomePage,
    test_log: TestLogger,
    close_method: str,
) -> None:
    home.open_membership()
    home.membership.close(close_method)
    expect(home.membership.root).not_to_be_visible()
```

Parametrize variations of the same behavior. Create a new file when the
workflow or primary risk changes.

## 12. Route mocking

```python
from playwright.sync_api import Route


def return_server_error(route: Route) -> None:
    route.fulfill(
        status=500,
        content_type="application/json",
        body='{"error":"unexpected error"}',
    )


page.route("**/api/recipes**", return_server_error)
```

Register the route before the action that sends the request. Route mocking is
planned for `ERR-001`; it is not yet part of the automated baseline.

## 13. Component Object pattern

```python
from playwright.sync_api import Locator, Page


class ExampleComponent:
    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("region", name="Example")

    def item_named(self, name: str) -> Locator:
        return self.root.get_by_role("listitem").filter(
            has=self.root.get_by_text(name, exact=True)
        )
```

Scope all component locators to `root` whenever possible.

## 14. Daily commands

From the project root:

```bash
# Complete suite with automatic portal startup and shutdown
./scripts/test-local.sh -q

# Complete suite with incremental HTML report
./scripts/report-local.sh

# Layers and smoke
./scripts/test-local.sh -q -m ui
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m smoke

# One file
./scripts/test-local.sh -q \
  tests/api/test_api_006_member_created_with_valid_data.py

# Headed and slowed UI execution
./scripts/test-local.sh -q \
  tests/ui/test_ui_011_membership_modal_closes.py \
  --headed --slowmo 500

# One parameterized node ID; quote brackets in zsh
./scripts/test-local.sh -q \
  'tests/ui/test_ui_011_membership_modal_closes.py::test_membership_modal_closes[chromium-backdrop]'
```

Against an already-running portal:

```bash
cd test-framework
BASE_URL=http://localhost:3000 .venv/bin/pytest -q tests/ui
```

Playwright Inspector:

```bash
cd test-framework
PWDEBUG=1 BASE_URL=http://localhost:3000 .venv/bin/pytest -s \
  tests/ui/test_ui_010_event_reservation_confirmation.py --headed
```

Static quality:

```bash
cd test-framework
.venv/bin/ruff format --check framework tests
.venv/bin/ruff check framework tests
.venv/bin/mypy framework tests
```

## 15. Trace Viewer

The framework retains a trace when a test fails:

```bash
cd test-framework
.venv/bin/playwright show-trace test-results/<test-directory>/trace.zip
```

Inspect the failed action, locator, before/after DOM, console, and network.

## 16. Codegen for exploration

```bash
cd test-framework
.venv/bin/playwright codegen http://localhost:3000
```

Codegen output is a draft. Move reusable actions into Page/Component Objects,
remove arbitrary waits, prefer semantic locators, and keep business assertions
visible in the test.
