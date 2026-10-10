import re

import pytest
from playwright.sync_api import expect

from projects.lumbre.components.ingredient_lab import IngredientLab

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.navigation,
    pytest.mark.accessibility,
    pytest.mark.regression,
    pytest.mark.cross_browser,
]


@pytest.mark.case("UI-101", "Dialogs contain keyboard focus and Escape returns to their trigger")
@pytest.mark.parametrize("feature", ["almanac", "ingredient", "blend", "recipe"])
def test_dialog_keyboard_containment(portal, feature):
    page = portal
    if feature == "almanac":
        trigger = page.get_by_role("button", name="Almanaque", exact=False)
        trigger.focus()
        page.keyboard.press("Enter")
    elif feature == "recipe":
        trigger = page.get_by_test_id("recipe-card").first.get_by_role("button")
        trigger.focus()
        page.keyboard.press("Enter")
    else:
        lab = IngredientLab(page)
        lab.open()
        if feature == "ingredient":
            card = lab.card("sal_kosher")
            lab.expand(lab.family(card))
            trigger = card.get_by_role("button", name="Ficha", exact=True)
            trigger.focus()
            page.keyboard.press("Enter")
        else:
            lab.add("sal_kosher")
            lab.add("pimienta_negra")
            trigger = page.get_by_role("button", name="Guardar en esta sesión", exact=True)
            page.get_by_label("Nombre de tu blend", exact=True).fill("Accesibilidad QA")
            trigger.focus()
            page.keyboard.press("Enter")
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    expect(dialog).to_have_attribute("aria-labelledby", re.compile(r".+"))
    assert dialog.evaluate("e => e.contains(document.activeElement)"), (
        "Opening must focus the dialog"
    )
    # Cover a complete forward/backward cycle, including all controls in these sheets.
    for key in ["Tab"] * 24 + ["Shift+Tab"] * 24:
        page.keyboard.press(key)
        assert dialog.evaluate(
            "e => e.contains(document.activeElement) || "
            "(!document.hasFocus() && document.activeElement === document.body)"
        ), f"{feature}: {key} escaped to a background control"
    if not page.evaluate("document.hasFocus()"):
        page.keyboard.press("Tab")
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)
    expect(trigger).to_be_focused()
