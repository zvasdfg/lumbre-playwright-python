import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case("UI-003", "A search without matches displays a useful empty state")
def test_recipe_search_has_an_empty_state(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Search for a term without matches"):
        query = "helado de vainilla"
        home.search_recipes(query)
        test_log.values(search_query=query)

    with test_log.step("Validate the empty-state message"):
        expected_message = "No encontramos recetas con esos criterios."
        empty_state = home.page.get_by_text(expected_message)
        expect(empty_state).to_be_visible()
        test_log.values(
            observed_message=empty_state.inner_text(),
            expected_message=expected_message,
            observed_card_count=home.recipe_cards.count(),
            expected_card_count=0,
        )
