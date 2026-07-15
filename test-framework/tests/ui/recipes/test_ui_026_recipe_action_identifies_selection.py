import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-026",
    "The recipe action identifies the selected recipe in its feedback",
)
def test_recipe_action_identifies_selection(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Choose a recipe from the catalog"):
        recipe_name = "Coliflor al rescoldo"
        recipe_card = home.recipe_named(recipe_name)
        expect(recipe_card).to_be_visible()
        test_log.values(selected_recipe=recipe_name)

    with test_log.step("Open the selected recipe"):
        home.view_recipe(recipe_name)

    with test_log.step("Validate recipe-specific feedback"):
        expected_message = f"Abriendo {recipe_name}."
        expect(home.status_message).to_contain_text(expected_message)
        test_log.values(
            observed_message=home.status_message.inner_text(),
            expected_message=expected_message,
        )
