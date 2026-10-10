import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.recipes, pytest.mark.portal]


@pytest.mark.case("UI-053", "Recipe pagination and blend return preserve context")
def test_recipe_pagination_and_modal_return(portal):
    page = portal
    first = page.get_by_test_id("recipe-card").first.locator("h3").inner_text()
    page.get_by_role("button", name="Ir a página 2", exact=True).click()
    expect(page.get_by_test_id("recipe-page-status")).to_contain_text("7–12")
    page.get_by_role("button", name="Ir a página 1", exact=True).click()
    expect(page.get_by_test_id("recipe-card").first.locator("h3")).to_have_text(first)
    card = page.get_by_test_id("recipe-card").first
    card.get_by_role("button").click()
    recipe = page.get_by_role("dialog", name=first, exact=True)
    recipe.locator(".recipe-blend-link").click()
    expect(page.get_by_role("dialog")).to_have_count(1)
    page.get_by_role("button", name="Volver a la receta", exact=False).click()
    expect(recipe).to_be_visible()
    expect(recipe.locator(".recipe-blend-link")).to_be_focused()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)
