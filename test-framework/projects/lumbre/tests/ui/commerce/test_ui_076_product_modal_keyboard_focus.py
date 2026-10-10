import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.commerce,
    pytest.mark.cross_browser,
    pytest.mark.portal,
]


@pytest.mark.parametrize("width", [390, 1440])
@pytest.mark.case("UI-076", "Modal isolates background and restores trigger focus")
def test_product_keyboard_modal(page, app_url, width):
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(app_url + "/#tienda")
    trigger = page.get_by_role("button", name="Ver ficha de Sazonador multiuso", exact=True)
    trigger.focus()
    page.keyboard.press("Enter")
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    # Native dialog may focus the first action instead of the close action.
    # The accessibility contract is containment, not a particular button.
    assert dialog.evaluate("e => e.contains(document.activeElement)")
    for key in ["Tab"] * 8 + ["Shift+Tab"] * 8:
        page.keyboard.press(key)
        # Browser chrome is a legitimate tab stop; background document controls are not.
        assert dialog.evaluate(
            "e => e.contains(document.activeElement) || "
            "(!document.hasFocus() && document.activeElement === document.body)"
        )
    # Return from browser chrome, if needed, before testing Escape.
    if not page.evaluate("document.hasFocus()"):
        page.keyboard.press("Tab")
    assert dialog.evaluate("e => e.contains(document.activeElement)")
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)
    expect(trigger).to_be_focused()
    assert page.evaluate("document.body.style.overflow !== 'hidden'")
