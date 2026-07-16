import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-020",
    "A technical sheet cannot be created with fewer than two ingredients",
)
def test_formula_requires_two_ingredients(home: HomePage, test_log: TestLogger) -> None:
    lab = home.ingredient_lab

    with test_log.step("Validate the empty experiment bench"):
        expect(lab.create_protocol_button).to_be_disabled()
        test_log.values(
            observed_selected_count=lab.selected_items.count(),
            observed_create_disabled=lab.create_protocol_button.is_disabled(),
            expected_minimum=2,
        )

    with test_log.step("Add only one ingredient"):
        ingredient_name = "sal kosher"
        lab.add_ingredient(ingredient_name)
        expect(lab.selected_items).to_have_count(1)
        test_log.values(selected_ingredient=ingredient_name, observed_selected_count=1)

    with test_log.step("Validate the minimum boundary"):
        expect(lab.create_protocol_button).to_be_disabled()
        test_log.values(
            observed_create_disabled=lab.create_protocol_button.is_disabled(),
            expected_create_disabled=True,
        )
