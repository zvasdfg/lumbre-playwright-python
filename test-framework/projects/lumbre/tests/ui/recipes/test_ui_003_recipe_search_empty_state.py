import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.recipes]


@pytest.mark.case(
    "UI-003", "An unmatched recipe query shows an empty state and clearing restores the catalog"
)
def test_recipe_search_empty_state(portal, test_log):
    search = portal.get_by_placeholder("Buscar receta...", exact=True)
    with test_log.step("Search for a recipe that does not exist"):
        search.fill("zz-no-recipe-zz")
        expect(portal.get_by_test_id("recipe-card")).to_have_count(0)
    with test_log.step("Clear the query and recover the first page"):
        search.fill("")
        expect(portal.get_by_test_id("recipe-card")).to_have_count(6)
