import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.regression
@pytest.mark.case(
    "UI-029",
    "Recipe feedback can be dismissed by the user",
)
def test_recipe_feedback_can_be_dismissed(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open a recipe from the catalog"):
        recipe_name = "Coliflor al rescoldo"
        recipe_card = home.recipe_named(recipe_name)

        expect(recipe_card).to_be_visible()
        home.view_recipe(recipe_name)

        test_log.values(selected_recipe=recipe_name)

    with test_log.step("Validate the recipe feedback"):
        expected_message = f"Abriendo {recipe_name}."

        expect(home.toast.root).to_be_visible()
        expect(home.toast.root).to_contain_text(expected_message)

        test_log.values(
            observed_message=home.toast.root.inner_text(),
            expected_message=expected_message,
        )

    with test_log.step("Dismiss the recipe feedback"):
        expect(home.toast.close_button).to_be_visible()

        test_log.values(
            dismissal_method="close button",
            accessible_name="Cerrar mensaje",
        )

        home.toast.dismiss()

    with test_log.step("Validate that the feedback is dismissed"):
        expect(home.toast.root).to_be_hidden()

        test_log.values(
            observed_toast_visible=home.toast.root.is_visible(),
            expected_toast_visible=False,
        )
