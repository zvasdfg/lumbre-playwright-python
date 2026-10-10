import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.recipes]


@pytest.mark.case("UI-029", "The recipe dialog closes with Escape and restores its trigger focus")
def test_recipe_feedback_can_be_dismissed(portal, test_log):
    trigger = portal.get_by_test_id("recipe-card").first.get_by_role("button")
    with test_log.step("Open the current recipe dialog"):
        trigger.click()
        expect(portal.get_by_role("dialog")).to_be_visible()
    with test_log.step("Dismiss it and restore access to the catalog"):
        portal.keyboard.press("Escape")
        expect(portal.get_by_role("dialog")).to_have_count(0)
        expect(trigger).to_be_focused()
