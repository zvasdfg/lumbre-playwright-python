import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-016",
    "An ingredient sheet exposes research data and can add the component to a formula",
)
def test_ingredient_sheet_adds_to_formula(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    ingredient_name = "ajo granulado"

    with test_log.step("Find and open a documented ingredient"):
        lab.search(ingredient_name)
        lab.open_ingredient(ingredient_name)
        dialog = lab.ingredient_dialog(ingredient_name)

        expect(dialog).to_be_visible()
        test_log.values(
            opened_ingredient=ingredient_name,
            observed_dialog_visible=dialog.is_visible(),
            expected_dialog_visible=True,
        )

    with test_log.step("Validate the ingredient research summary"):
        expect(dialog.get_by_text("Perfil sensorial", exact=True)).to_be_visible()
        expect(dialog.get_by_text("Compatibilidades", exact=True)).to_be_visible()
        expect(dialog).to_contain_text("Ajo deshidratado en gránulos")

        observed_dialog_text = dialog.inner_text()
        test_log.values(
            observed_has_sensory_profile="perfil sensorial" in observed_dialog_text.lower(),
            observed_has_compatibility="compatibilidades" in observed_dialog_text.lower(),
            observed_has_description="ajo deshidratado en gránulos" in observed_dialog_text.lower(),
        )

    with test_log.step("Add the ingredient to the experimental formula"):
        lab.add_open_ingredient_to_formula(ingredient_name)

        expect(dialog).to_be_hidden()
        expect(lab.selected_ingredient(ingredient_name)).to_be_visible()
        test_log.values(
            selected_ingredient=ingredient_name,
            observed_selected_count=lab.selected_items.count(),
            expected_selected_count=1,
        )

        expect(lab.selected_items).to_have_count(1)
