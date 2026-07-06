# UI-013 Completed Keyboard Focus Exercise

> Status: completed and automated in
> `test-framework/tests/ui/test_ui_013_membership_keyboard_focus_order.py`.

## Behavioral objective

Prove that a visitor can open the membership dialog with the keyboard, type a
name through sequential key events, move with `Tab`, and reach the email field
in the expected focus order.

## Protected risk

A mouse-only test can pass while keyboard users cannot activate the dialog or
move through its controls. This scenario specifically protects keyboard
activation, autofocus, text entry, and logical focus movement.

## Architecture

```text
Test
  -> HomePage.open_membership_with_keyboard()
    -> Header.open_membership_with_keyboard()
      -> join_button.focus() + join_button.press("Enter")

Test
  -> MembershipModal.enter_name_and_move_to_email_with_keyboard()
    -> name_input.press_sequentially(name) + name_input.press("Tab")
```

The test owns data, logging, and assertions. `Header` owns its trigger, and
`MembershipModal` owns controls and keyboard mechanics inside the dialog.

## Assertions and diagnostics

The scenario uses web-first assertions for the verdict:

```python
expect(home.membership.name_input).to_be_focused()
expect(home.membership.name_input).to_have_value(member_name)
expect(home.membership.email_input).to_be_focused()
```

`Locator` does not expose `is_focused()` in Playwright Python. The test obtains
a boolean only for diagnostic logging by comparing the email input DOM node
with `document.activeElement`:

```python
observed_email_focused = home.membership.email_input.evaluate(
    "element => element === document.activeElement"
)
```

`evaluate()` performs a one-time read. It does not retry until focus changes,
so it must not replace `expect(...).to_be_focused()`.

## Run the scenario

From the project root:

```bash
./scripts/test-local.sh -q \
  tests/ui/test_ui_013_membership_keyboard_focus_order.py
```

For a visible learning run:

```bash
./scripts/test-local.sh -q \
  tests/ui/test_ui_013_membership_keyboard_focus_order.py \
  --headed --slowmo 500
```

## Definition of done

- activation uses `Enter`, not `click()`;
- text entry uses sequential keyboard events, not `fill()`;
- `Tab` moves focus from name to email;
- focus expectations use retrying Playwright assertions;
- observed and expected values appear in structured logs;
- each meaningful step contributes a screenshot to the HTML report;
- no sleep, forced action, positional locator, or hidden assertion is used.
