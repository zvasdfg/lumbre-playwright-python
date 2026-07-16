import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-017",
    "The experiment bench enforces its six-component boundary",
)
def test_ingredient_formula_enforces_six_component_limit(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    selected_names = [
        "sal kosher",
        "pimienta negra",
        "ajo granulado",
        "azúcar morena",
        "chipotle seco",
        "tomillo",
    ]

    with test_log.step("Add six ingredients to the experiment bench"):
        expect(lab.ingredient_cards).to_have_count(60)
        for ingredient_name in selected_names:
            lab.add_ingredient(ingredient_name)

        observed_selected_count = lab.selected_items.count()
        test_log.values(
            selected_ingredients=selected_names,
            observed_selected_count=observed_selected_count,
            expected_selected_count=6,
        )
        expect(lab.selected_items).to_have_count(6)

    with test_log.step("Validate the boundary message"):
        expect(lab.selection_limit).to_have_text("La mesa admite un máximo de 6 componentes.")
        test_log.values(
            observed_limit_message=lab.selection_limit.inner_text(),
            expected_limit=6,
        )

    with test_log.step("Validate that a seventh ingredient cannot be added"):
        seventh_ingredient = "pimienta blanca"
        add_button = lab.ingredient_card(seventh_ingredient).get_by_role(
            "button",
            name="Agregar",
            exact=True,
        )
        expect(add_button).to_be_disabled()
        test_log.values(
            blocked_ingredient=seventh_ingredient,
            observed_button_disabled=add_button.is_disabled(),
            expected_button_disabled=True,
        )
