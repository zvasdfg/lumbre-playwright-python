# UI-012 Completed Fire Planner Exercise

> Status: completed and automated in
> `test-framework/tests/ui/test_ui_012_fire_planner_recommends_fuel.py`.

## Behavioral objective

Prove that the fire planner recommends `4 kg` of charcoal for eight people,
two hours, and direct-fire cooking.

This document preserves the exercise sequence used to discover the UI,
implement Playwright locators and actions inside a Component Object, connect
it to `HomePage`, and consume those capabilities from a normalized test.

## Concepts practiced

- semantic and scoped locators;
- dialog strictness;
- `fill()` and `select_option()`;
- web-first assertions;
- Page Object and Component Object responsibility boundaries;
- type annotations such as `-> None`;
- structured steps, diagnostic values, and screenshots;
- refactoring a passing test without changing its behavior.

## Product contract

Use these observable Spanish product values exactly:

| Contract | Value |
| --- | --- |
| Open button | `Planear mi fuego` |
| Dialog name | `Calcula tu fuego.` |
| Guest label | `Personas` |
| Cooking-style label | `Tipo de cocción` |
| Cooking-style option value | `directo` |
| Duration label | `Duración estimada` |
| Duration option value | `2` |
| Vegetable-reserve label | `Incluir una reserva para vegetales` |
| Submit button | `Calcular combustible` |
| Result status name | `Recomendación de combustible` |
| Expected result | contains `4 kg` |

Locators and expected copy remain in Spanish because they represent the real
product. Python names, metadata, comments, and step descriptions remain in
English.

## Phase 1 - Explore before automating

Run the portal and inspect the behavior manually:

```bash
cd portal
npm run dev
```

Open `http://localhost:3000`, select `Planear mi fuego`, change the values, and
calculate a recommendation. Record which elements are buttons, labels, dialog,
and status. Do not inspect CSS classes first; start from what a user or assistive
technology can perceive.

## Phase 2 - Create the Component Object

The completed exercise created:

```text
test-framework/framework/components/fire_planner_modal.py
```

Start with `pw-component`. Write the Playwright locators and actions from
scratch. The component should own:

- dialog root;
- guest input;
- cooking-style select;
- duration select;
- vegetable-reserve checkbox;
- calculate button;
- recommendation status;
- actions for completing and submitting the form.

The component must not own:

- test data such as `8`;
- the expected `4 kg` oracle;
- Playwright `expect()` calls;
- test-step logging.

Methods that only perform actions should declare `-> None`. A locator-returning
query should declare `-> Locator`.

## Phase 3 - Connect the component to HomePage

Update `HomePage` to construct `FirePlannerModal` and expose the page-level
action that opens it. `HomePage` owns the trigger because the trigger lives on
the home page; `FirePlannerModal` owns controls inside the dialog.

## Phase 4 - Create a normalized test

The completed exercise added one behavior file:

```text
test-framework/tests/ui/test_ui_012_fire_planner_recommends_fuel.py
```

Use the `pw-ui-test` snippet with:

- case: `UI-012`;
- behavior: `The fire planner recommends fuel for a direct-fire gathering`;
- function: `test_fire_planner_recommends_fuel`.

Keep the standard `home: HomePage` and `test_log: TestLogger` fixtures. Use
these snippets as building blocks:

- `pw-step` for each observable action;
- `pw-visible` and `pw-text` for web-first assertions;
- `pw-values` for inputs, observed result, and oracle.

Recommended step boundaries:

1. Open the fire planner.
2. Configure eight people, direct fire, and two hours.
3. Calculate the fuel recommendation.
4. Validate that the scoped result contains `4 kg`.

The test uses `home.open_fire_planner()` and `home.fire_planner`. It must not
repeat locators already owned by the component. Keep the assertions in the
test.

## Phase 5 - Verify the finished exercise

The skip marker was removed after all placeholders were completed. Re-run the
scenario with:

```bash
./scripts/test-local.sh -q \
  tests/ui/test_ui_012_fire_planner_recommends_fuel.py \
  --headed --slowmo 500
```

Then run static quality checks and the full suite:

```bash
cd test-framework
.venv/bin/ruff format --check framework tests
.venv/bin/ruff check framework tests
.venv/bin/mypy framework tests
cd ..
./scripts/test-local.sh -q
```

## Definition of done

- one new behavior file exists;
- the product flow was observed before automation;
- final UI mechanics live in `FirePlannerModal` and `HomePage`;
- assertions and expected values remain in the test;
- every meaningful action has a step screenshot;
- logs show inputs, actual recommendation, and expected recommendation;
- the test passes alone and in the full suite;
- no arbitrary sleep, forced click, positional locator, or hidden assertion was added.
