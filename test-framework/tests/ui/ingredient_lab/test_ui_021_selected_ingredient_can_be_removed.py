import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-021",
    "Removing a selected ingredient updates the experiment bench",
)
def test_selected_ingredient_can_be_removed(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    selected_names = ["sal kosher", "pimienta negra"]

    with test_log.step("Add two ingredients to the experiment bench"):
        for ingredient_name in selected_names:
            lab.add_ingredient(ingredient_name)
        expect(lab.selected_items).to_have_count(2)
        expect(lab.create_protocol_button).to_be_enabled()
        test_log.values(
            selected_ingredients=selected_names,
            observed_selected_count=lab.selected_items.count(),
        )

    with test_log.step("Remove one selected ingredient"):
        removed_ingredient = "pimienta negra"
        lab.remove_selected_ingredient(removed_ingredient)
        test_log.values(removed_ingredient=removed_ingredient)

    with test_log.step("Validate the updated bench state"):
        expect(lab.selected_items).to_have_count(1)
        expect(lab.selected_ingredient(removed_ingredient)).to_have_count(0)
        expect(lab.selected_ingredient("sal kosher")).to_be_visible()
        expect(lab.create_protocol_button).to_be_disabled()
        test_log.values(
            observed_selected_count=lab.selected_items.count(),
            expected_selected_count=1,
            observed_create_disabled=lab.create_protocol_button.is_disabled(),
        )
