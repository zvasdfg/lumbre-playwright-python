import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.recipes]


@pytest.mark.case("UI-006", "Searching by a real recipe title returns that recipe")
def test_recipe_search_finds_recipe(portal, test_log):
    with test_log.step("Read a real recipe title instead of using a stale hard-coded title"):
        title = portal.get_by_test_id("recipe-card").first.locator("h3").inner_text()
        test_log.values(selected_recipe=title)
    with test_log.step("Search for the selected title"):
        portal.get_by_placeholder("Buscar receta...", exact=True).fill(title)
        card = portal.get_by_test_id("recipe-card").filter(
            has=portal.get_by_role("heading", name=title, exact=True)
        )
        expect(card).to_have_count(1)
        expect(card).to_be_visible()
