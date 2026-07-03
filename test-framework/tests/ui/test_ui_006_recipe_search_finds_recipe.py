import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case("UI-006", "A successful search shows only the matching recipe")
def test_recipe_search_finds_a_recipe(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Search for the term coliflor"):
        query = "coliflor"
        home.search_recipes(query)
        test_log.values(search_query=query)

    with test_log.step("Validate the matching recipe"):
        expected_recipe = "Coliflor al rescoldo"
        expect(home.recipe_named(expected_recipe)).to_be_visible()

    with test_log.step("Validate that it is the only result"):
        expect(home.recipe_cards).to_have_count(1)
        observed_titles = home.recipe_cards.get_by_role("heading").all_inner_texts()
        test_log.values(
            observed_recipe_titles=observed_titles,
            expected_recipe_title=expected_recipe,
            observed_card_count=home.recipe_cards.count(),
            expected_card_count=1,
        )
