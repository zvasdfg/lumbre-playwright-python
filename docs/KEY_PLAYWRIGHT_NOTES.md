# Key Playwright Notes

Daily reference for writing and reviewing tests in the Lumbre learning
framework.

## 1. A Locator is not a WebElement

A `Locator` stores a query that Playwright resolves again before each action.
It is not a static snapshot of a node.

```python
button = page.get_by_role("button", name="Confirmar")
button.click()
```

This avoids most stale-element behavior, but the query must still identify the
correct element unambiguously.

## 2. Do not synchronize with sleeps

Playwright auto-waits for actionability: uniqueness, visibility, stability,
enabled state, and the ability to receive events.

```python
# Avoid
time.sleep(2)

# Prefer an observable condition
expect(page.get_by_role("status")).to_contain_text("Bienvenido")
```

`--slowmo` is for observation and learning, not stability.

## 3. Prefer web-first assertions for dynamic UI

```python
# Retries until success or timeout
expect(locator).to_be_visible()

# Reads once
assert locator.is_visible()
```

Use `expect()` for dynamic browser state. Use plain `assert` for materialized
values such as JSON dictionaries, calculated totals, and HTTP status codes.

## 4. Locate elements as a user would

Preferred order:

1. `get_by_role()` and accessible name.
2. `get_by_label()`.
3. `get_by_text()`.
4. Placeholder, alt text, or title.
5. `get_by_test_id()` for a deliberate non-semantic contract.
6. CSS/XPath as a justified last resort.

Spanish locator strings are correct in this framework because the product UI
is Spanish. The automation code surrounding them remains English.

## 5. Strictness is diagnostic

An action against a locator that matches multiple elements should fail. Do not
add `.first`, `.last`, or `.nth()` merely to silence strictness. Scope the
locator to the correct component or identify the relevant business attribute.

## 6. Tests are isolated

Every UI test gets a clean `BrowserContext`. The autouse `reset_scenario`
fixture also calls `/api/test/reset` before every test. Never depend on another
test or on collection order.

## 7. Page Objects encapsulate actions, not hidden assertions

```python
# Page Object
def search_recipes(self, text: str) -> None:
    self.recipe_search.fill(text)

# Test
home.search_recipes("coliflor")
expect(home.recipe_named("Coliflor al rescoldo")).to_be_visible()
```

Prefer domain methods such as `register_member()` over generic wrappers such as
`click_button("join")`.

## 8. Component Objects define bounded widgets

Use a Component Object when a UI region owns multiple related locators and
actions: cart drawer, membership modal, events section, or reservation dialog.
Avoid deep inheritance and components that know about unrelated page areas.

## 9. Use the API for contracts and state

`APIRequestContext` is appropriate for:

- direct REST contract tests;
- deterministic setup and cleanup;
- faster data preparation;
- server-side postcondition checks.

Do not spend browser navigation on setup that the API can perform directly.

## 10. Expected negative responses are valid tests

`LumbreApi._json()` expects a successful response. For expected `4xx` behavior,
return the raw response and assert its contract:

```python
response = api.create_product(invalid_payload)
body = response.json()
assert response.status == 422
assert body["error"] == "name, category and a positive price are required"
```

## 11. Keep one behavior or equivalent contract family per file

```text
test_<layer>_<first_id>_<behavior_or_contract_family>.py
```

One file tells one behavioral story. Closely equivalent variants may share a
parameterized file when each dataset retains stable case metadata and a Pytest
ID. Shared mechanics belong in fixtures, Page Objects, Component Objects, or
API clients.

## 12. Every test declares traceability

```python
@pytest.mark.case("UI-006", "A successful search shows only the matching recipe")
```

The ID maps to the risk matrix. The description states observable behavior,
not an implementation detail.

## 13. Every test uses structured steps

```python
with test_log.step("Search for the term coliflor"):
    home.search_recipes("coliflor")

with test_log.step("Validate the matching recipe"):
    expect(home.recipe_named("Coliflor al rescoldo")).to_be_visible()
```

`test_log.step()` records number, start, result, duration, and exceptions. It is
the Pytest/Python equivalent used by this framework because Playwright Test's
native `test.step()` belongs to the TypeScript runner.

## 14. One UI step produces one screenshot

At the end of every `test_log.step()` in a UI test, the framework captures the
current viewport and attaches it to the HTML report. A step should therefore
contain one observable action or validation. Multiple actions inside one step
produce only one final-state screenshot.

API tests have no `Page` and do not produce screenshots.

## 15. Log useful values before asserting

```python
observed_status = response.status
expected_status = 201
test_log.values(
    observed_status=observed_status,
    expected_status=expected_status,
)
assert observed_status == expected_status
```

Record inputs, actual values, and the oracle. Never record passwords, tokens,
secrets, or real personal data.

## 16. TODOs must never create false positives

`assert ...` passes because `Ellipsis` is truthy. Incomplete scaffolds must keep
their skip marker:

```python
@pytest.mark.skip(reason="Pending exercise: complete the TODOs and remove this marker")
```

Remove it only after every placeholder has been replaced.

## 17. `force=True` is an investigation signal

Forcing an action disables actionability checks. First determine whether an
overlay, ambiguous locator, missing readiness condition, or impossible user
interaction is the real cause.

## 18. Headed mode and slow motion are learning tools

```bash
./scripts/test-local.sh -q -m ui --headed --slowmo 500
```

`--headed` displays the browser. `--slowmo 500` delays Playwright operations by
500 ms so the flow can be observed.

## 19. Trace is the primary failure artifact

The framework configures:

```text
--tracing=retain-on-failure
--screenshot=only-on-failure
```

The HTML report adds step screenshots for every UI execution. When a UI test
fails it also embeds a full-page screenshot and links to `trace.zip`.

Investigate in this order:

1. Failed case and step.
2. `[VALUES]` diagnostics.
3. Playwright call log.
4. Step and failure screenshots.
5. Trace timeline, DOM snapshots, console, and network.

## 20. Sync API is deliberate

This learning framework uses `playwright.sync_api` so early exercises focus on
test design, locators, assertions, fixtures, and synchronization. Do not mix
sync and async APIs without a concrete architectural need.

## 21. Browser lifecycle belongs to fixtures

Do not create `browser`, `context`, and `page` manually inside each test. Ask
Pytest for the resource:

```python
def test_example(page: Page) -> None:
    ...
```

The plugin owns creation, isolation, and teardown.

## 22. Reinstall browser binaries after Playwright upgrades

```bash
cd test-framework
.venv/bin/playwright install chromium
```

Each Playwright release expects compatible browser binaries.

## 23. Parametrize variations, not unrelated risks

`UI-011` uses two values because button and backdrop are variations of the same
close behavior. If setup, workflow, or primary risk changes, create a separate
case and file.

## 24. A rebrand can legitimately change tests

Role, label, and text locators represent user-visible contracts. When product
copy changes, update the affected expectations. Do not replace semantic
locators with CSS merely to avoid legitimate maintenance.

## 25. Register network routes before the triggering action

`page.route()` changes how matching browser requests are handled. Register it
before the click or submission that sends the request:

```python
page.route("**/api/members", return_membership_server_error)
home.membership.submit()
```

`route.fulfill()` returns a synthetic response without reaching the real
server. This is useful for deterministic UI handling of failures that would be
slow, unsafe, or difficult to reproduce through the deployed API. Keep the
mock setup and behavioral assertions in the test; keep form interactions in
the relevant Page or Component Object.

## 26. Keyboard behavior should use keyboard actions

When the interaction method is part of the risk, do not replace it with a
mouse click or direct value assignment. `UI-013` uses `focus()`,
`press("Enter")`, `press_sequentially()`, and `press("Tab")` to exercise the
actual keyboard path. Use `expect(locator).to_be_focused()` to validate focus
with Playwright's retry behavior.

## 27. Focus logging and focus assertions are different operations

Playwright Python does not provide `Locator.is_focused()`. When a boolean is
useful in diagnostic logs, a one-time DOM read can compare the locator's node
with `document.activeElement`:

```python
observed_focused = locator.evaluate(
    "element => element === document.activeElement"
)
```

This does not replace the web-first assertion:

```python
expect(locator).to_be_focused()
```

Use the DOM read as evidence and the assertion as the test verdict.

## Official references

- [Locators](https://playwright.dev/python/docs/locators)
- [Actionability](https://playwright.dev/python/docs/actionability)
- [Assertions](https://playwright.dev/python/docs/test-assertions)
- [Isolation](https://playwright.dev/python/docs/browser-contexts)
- [Pytest plugin](https://playwright.dev/python/docs/test-runners)
- [API testing](https://playwright.dev/python/docs/api-testing)
- [Trace Viewer](https://playwright.dev/python/docs/trace-viewer-intro)
