# Guided UI Test Creation Protocol

This protocol turns the creation of a Playwright UI test into a reviewable
learning sequence. It is intended for engineers who understand testing but are
still building fluency with Playwright, Python, and this framework's ownership
boundaries.

The protocol produces production-quality automation. It is not a wizard that
hides Playwright or a checklist that guarantees a useful test.

## 1. Collaboration contract

Every checkpoint follows the same five-part loop:

```text
Explain -> Propose -> Confirm -> Write -> Verify
```

1. **Explain:** state the behavior, ownership decision, and relevant
   Playwright concept.
2. **Propose:** show the exact code or structural change before editing.
3. **Confirm:** wait for the learner to approve that checkpoint.
4. **Write:** apply only the approved change; do not silently complete later
   checkpoints.
5. **Verify:** run the smallest useful static or executable check and report
   the observed result.

The mentor must explain failures with evidence before changing the test. The
learner may challenge a selector, abstraction, test level, name, or oracle at
any checkpoint. That review is part of the exercise.

## 2. Entry criteria

Do not start writing code until the proposed case has:

- one primary product risk;
- an observable user outcome;
- a stable case ID and priority;
- a reason to use UI rather than API or framework-unit coverage;
- deterministic setup or a documented test-data requirement;
- no equivalent behavior already protected by another case.

If the case only proves a server rule, prefer an API test. If it validates a
reusable automation utility without a SUT, place it under `tests/framework`.

## 3. Guided checkpoints

### Checkpoint 0: define the contract

Write the case before its implementation:

```text
ID: UI-XXX
Behavior: observable result written in English
Priority: P0, P1, or P2
Trigger: user action or browser event
Oracle: visible state that proves success
Layer: UI, E2E, network-controlled UI, accessibility, or cross-browser
```

Confirm that the case protects a new risk. Parameter variations of one
behavior do not automatically become new risks.

### Checkpoint 1: inspect the product surface

Inspect the rendered UI and source semantics before inventing a locator.
Identify:

- accessible role and name;
- label, placeholder, or stable test ID when appropriate;
- component root;
- current Page or Component Object ownership;
- states before and after the action.

Preserve Mexican Spanish in locators when it is part of the product contract:

```python
page.get_by_role("button", name="Cerrar mensaje")
```

Do not translate a product string inside a locator.

### Checkpoint 2: decide ownership

Use this decision table:

| Concern | Owner |
| --- | --- |
| Page navigation and top-level composition | Page Object |
| Locators and behavior inside a bounded widget | Component Object |
| Repeated product HTTP operations | Project API client |
| Browser, request-context, reporting lifecycle | Generic adapter/core |
| Input selection and observable oracle | Test |

Create a new Component Object when the DOM region has a clear boundary, its
own controls or state, and realistic reuse. Do not create a class only to wrap
one unrelated `click()`.

### Checkpoint 3: add locators from the component root

Create the smallest locator model first:

```python
class ToastNotification:
    def __init__(self, page: Page) -> None:
        self.root = page.get_by_role("status")
        self.close_button = self.root.get_by_role(
            "button",
            name="Cerrar mensaje",
        )
```

Scoping child locators through `root` reduces ambiguity. Locators are lazy
queries; constructing them does not require the element to exist yet.

Verify the new file with Ruff and Mypy before adding behavior.

### Checkpoint 4: add semantic actions

Expose product intent, not generic Playwright wrappers:

```python
def dismiss(self) -> None:
    self.close_button.click()
```

Prefer `dismiss()`, `submit()`, or `add_to_formula()` over helpers such as
`click_button()`. Keep assertions in the test unless the code is a reusable
technical contract validator.

### Checkpoint 5: compose the object graph

Register the component in the owning Page Object:

```python
self.toast = ToastNotification(page)
```

Tests should consume `home.toast`, not construct a second component instance or
repeat its selector. Preserve an old interface only temporarily while existing
consumers are migrated.

### Checkpoint 6: create a safe test scaffold

Create one file for the behavior and keep it explicitly skipped while it is
incomplete:

```python
@pytest.mark.ui
@pytest.mark.regression
@pytest.mark.case("UI-XXX", "Observable behavior")
def test_observable_behavior(home: HomePage, test_log: TestLogger) -> None:
    pytest.skip("Exercise under construction")
```

An empty body, `pass`, or `assert ...` can create a false pass. Add imports only
when they are used so the scaffold remains clean under Ruff.

### Checkpoint 7: arrange and trigger the state

Replace the skip with the smallest user action that creates the state:

```python
with test_log.step("Open a recipe from the catalog"):
    recipe_name = "Coliflor al rescoldo"
    recipe_card = home.recipe_named(recipe_name)
    expect(recipe_card).to_be_visible()
    home.view_recipe(recipe_name)
    test_log.values(selected_recipe=recipe_name)
```

Log the input that matters. Use web-first assertions for observable
preconditions; do not add sleeps to make the action work.

### Checkpoint 8: prove the initial result

Assert both state and business content when both matter:

```python
with test_log.step("Validate the recipe feedback"):
    expected_message = f"Abriendo {recipe_name}."
    expect(home.toast.root).to_be_visible()
    expect(home.toast.root).to_contain_text(expected_message)
    test_log.values(
        observed_message=home.toast.root.inner_text(),
        expected_message=expected_message,
    )
```

Use `inner_text()` for evidence after synchronization, not as a replacement
for a retrying Playwright assertion.

### Checkpoint 9: perform the behavior under test

Keep the action distinct when its screenshot or failure boundary is useful:

```python
with test_log.step("Dismiss the recipe feedback"):
    expect(home.toast.close_button).to_be_visible()
    home.toast.dismiss()
```

A locator action already auto-waits for actionability. An assertion before the
action is justified only when that state is part of the behavior or produces a
more meaningful oracle.

### Checkpoint 10: prove the final state

Assert the user-observable postcondition:

```python
with test_log.step("Validate that the feedback is dismissed"):
    expect(home.toast.root).to_be_hidden()
    test_log.values(
        observed_toast_visible=home.toast.root.is_visible(),
        expected_toast_visible=False,
    )
```

Prefer visibility semantics over DOM-count assertions unless physical removal
from the DOM is itself the contract.

### Checkpoint 11: run the new case in isolation

Use the managed runner when a test depends on Lumbre's test-only reset route or
isolated mutable registry:

```bash
./scripts/test-local.sh -q \
  projects/lumbre/tests/ui/<domain>/test_ui_xxx_behavior.py \
  --headed --slowmo 500
```

Headed mode and slow motion support observation; they are not stability
mechanisms. Against an already-running environment, first confirm that its
server mode exposes every fixture dependency.

Classify failures before editing code:

| Failure point | Likely category |
| --- | --- |
| Fixture or service startup | Environment or orchestration |
| Locator strictness/actionability | Test model or product accessibility |
| Correct locator, unexpected state | Product behavior or oracle |
| Passes alone, fails in suite | Isolation, shared state, or timing race |

### Checkpoint 12: migrate existing consumers

Search for locators or actions superseded by the new component:

```bash
rg -n "old_locator|new_component" test-framework/projects
```

Migrate existing tests, remove the duplicate interface, and run a focused
regression containing every consumer. This turns a new abstraction into an
actual ownership boundary.

### Checkpoint 13: validate and document the baseline

Run static checks and the complete suite:

```bash
cd test-framework
.venv/bin/ruff format --check automation projects tests
.venv/bin/ruff check automation projects tests
.venv/bin/mypy automation projects tests
cd ..
./scripts/test-local.sh -q
```

Only after a successful full run should documentation claim a new passing
baseline. Update:

- risk catalog and priority denominator;
- case and execution counts;
- architecture when ownership changed;
- report preview when it is a portfolio artifact.

## 4. Step design rules

A `test_log.step()` should describe one meaningful action or validation. Do not
split every Python statement into a step, and do not combine an entire journey
into one opaque step.

Each completed UI step captures a screenshot. Record:

- inputs that select the path;
- actual values used by the oracle;
- expected values;
- method or variant when parameterized.

Never record secrets, tokens, passwords, or real personal data.

## 5. Definition of done

A guided UI test is complete when:

- the case protects one cataloged risk;
- selectors have one clear owner;
- product actions are semantic and reusable where justified;
- the test owns its observable oracle;
- web-first assertions replace fixed waiting;
- the case runs independently;
- every affected consumer passes focused regression;
- Ruff and Mypy pass;
- the complete suite passes;
- evidence and documentation reflect the validated result;
- no temporary skip, TODO, duplicate locator, or false-pass placeholder remains.

## 6. Facilitator prompt

Use this request to start the protocol with an assistant or mentor:

> Guide me through creating one new UI test from zero. At each checkpoint,
> explain the design and Playwright concept, show the exact proposed code, and
> wait for my confirmation. After I confirm, write only that checkpoint and
> verify it before continuing. Include new Page or Component Object elements
> when the product surface requires them. Finish with focused regression, the
> complete suite, evidence, and documentation updates.

UI-029 is the reference implementation for this protocol:

```text
projects/lumbre/tests/ui/recipes/
└── test_ui_029_recipe_feedback_can_be_dismissed.py
```
