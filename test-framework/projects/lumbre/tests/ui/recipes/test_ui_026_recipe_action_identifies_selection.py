import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


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
        expect(home.toast.root).to_contain_text(expected_message)
        test_log.values(
            observed_message=home.toast.root.inner_text(),
            expected_message=expected_message,
        )
