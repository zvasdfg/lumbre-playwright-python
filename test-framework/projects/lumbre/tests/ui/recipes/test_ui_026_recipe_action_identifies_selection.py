import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.recipes]


@pytest.mark.case("UI-026", "Opening a recipe presents the selected recipe in its own dialog")
def test_recipe_action_identifies_selection(portal, test_log):
    card = portal.get_by_test_id("recipe-card").first
    title = card.locator("h3").inner_text()
    with test_log.step("Open the selected recipe"):
        card.get_by_role("button").click()
    with test_log.step("Check the selected title and preparation rather than the retired toast"):
        dialog = portal.get_by_role("dialog", name=title, exact=True)
        expect(dialog).to_be_visible()
        expect(dialog).to_contain_text("Preparación paso a paso")
        test_log.values(selected_recipe=title)
