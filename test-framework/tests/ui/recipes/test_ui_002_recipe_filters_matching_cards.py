import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case("UI-002", "The visual filter shows only recipes from the selected category")
def test_recipe_filters_return_only_matching_cards(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Select the Vegetales filter"):
        selected_filter = "Vegetales"
        home.filter_recipes(selected_filter)
        test_log.values(selected_filter=selected_filter)

    with test_log.step("Validate the filtered recipe count"):
        expect(home.recipe_cards).to_have_count(2)
        test_log.values(
            observed_card_count=home.recipe_cards.count(),
            expected_card_count=2,
        )

    with test_log.step("Validate a representative recipe from the category"):
        expected_recipe = "Coliflor al rescoldo"
        expect(home.recipe_named(expected_recipe)).to_be_visible()
        observed_titles = home.recipe_cards.get_by_role("heading").all_inner_texts()
        test_log.values(
            observed_recipe_titles=observed_titles,
            expected_representative_recipe=expected_recipe,
        )
