import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.recipes, pytest.mark.portal]


@pytest.mark.parametrize("filter_name", ["Fuego directo", "Lento y ahumado", "Vegetales"])
@pytest.mark.case("UI-002", "Recipe filters and search recover from empty results")
def test_recipe_search_and_filters(portal, filter_name):
    page = portal
    button = page.get_by_role("button", name=filter_name, exact=True)
    button.click()
    expect(button).to_have_attribute("aria-pressed", "true")
    expect(page.get_by_test_id("recipe-card").first).to_be_visible()
    title = page.get_by_test_id("recipe-card").first.locator("h3").inner_text()
    search = page.get_by_placeholder("Buscar receta...", exact=True)
    search.fill("zz-no-recipe-zz")
    expect(page.get_by_test_id("recipe-card")).to_have_count(0)
    search.fill(title)
    expect(page.get_by_test_id("recipe-card").first.locator("h3")).to_have_text(title)
    search.fill("")
    page.get_by_role("button", name="Todas", exact=True).click()
    expect(page.get_by_test_id("recipe-card")).to_have_count(6)
