import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-053",
    "The recipe catalog shows at most six recipes and advances without duplicates",
)
def test_recipe_catalog_paginates_six_at_a_time(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read the first recipe page"):
        expect(home.recipe_cards).to_have_count(6)
        expect(home.recipe_page_status).to_have_text("Mostrando 1–6 de 100 recetas")
        first_page_titles = home.recipe_cards.get_by_role("heading").all_inner_texts()
        test_log.values(
            observed_page_status=home.recipe_page_status.inner_text(),
            observed_titles=first_page_titles,
            observed_card_count=home.recipe_cards.count(),
        )

    with test_log.step("Advance to the second recipe page"):
        home.go_to_recipe_page(2)
        expect(home.recipe_cards).to_have_count(6)
        expect(home.recipe_page_status).to_have_text("Mostrando 7–12 de 100 recetas")
        second_page_titles = home.recipe_cards.get_by_role("heading").all_inner_texts()
        test_log.values(
            observed_page_status=home.recipe_page_status.inner_text(),
            observed_titles=second_page_titles,
            observed_card_count=home.recipe_cards.count(),
        )

    with test_log.step("Validate the page boundary and distinct content"):
        assert len(first_page_titles) == 6
        assert len(second_page_titles) == 6
        assert set(first_page_titles).isdisjoint(second_page_titles)
