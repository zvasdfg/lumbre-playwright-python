# Playwright Python Snippets

Practical reference for the Lumbre framework. Examples use Playwright Sync API,
Pytest, Page Objects, Component Objects, structured test steps, and web-first
assertions.

Use these snippets inside the review checkpoints defined by the
[Guided UI test creation protocol](GUIDED_UI_TEST_PROTOCOL.md). A scaffold is a
starting point, not a substitute for selecting a risk and designing an oracle.

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
| `pw-fill` | Fill a form control through a locator |
| `pw-select` | Select an option by its stable value |
| `pw-dialog` | Scoped dialog and child-control locators |
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
locator.focus()
locator.press("Enter")
locator.press_sequentially("Ana Parrilla")
locator.press("Tab")
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

For diagnostic logging of focus, compare the located DOM node with the
browser's current `document.activeElement`:

```python
observed_email_focused = home.membership.email_input.evaluate(
    "element => element === document.activeElement"
)
expect(home.membership.email_input).to_be_focused()
```

The `evaluate()` call is a one-time read for diagnostics. The `expect()` call
is the retrying assertion that determines the test result. Playwright Python
does not expose `Locator.is_focused()`.

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
        body='{"error":"Internal server error"}',
    )


page.route("**/api/members", return_server_error)
```

Register the route before the action that sends the request. `ERR-001` uses
this technique to prove that an HTTP 500 keeps the membership form open,
re-enables submission, preserves entered data, and displays useful feedback.

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

## 14. Trace Viewer

The framework retains a trace when a test fails:

```bash
cd test-framework
.venv/bin/playwright show-trace test-results/<test-directory>/trace.zip
```

Inspect the failed action, locator, before/after DOM, console, and network.

## 15. Codegen for exploration

```bash
cd test-framework
.venv/bin/playwright codegen http://localhost:3000
```

Codegen output is a draft. Move reusable actions into Page/Component Objects,
remove arbitrary waits, prefer semantic locators, and keep business assertions
visible in the test.

Execution, reporting, Inspector, and static-quality commands are maintained in
the root [README](../README.md) and the
[framework README](../test-framework/README.md).
