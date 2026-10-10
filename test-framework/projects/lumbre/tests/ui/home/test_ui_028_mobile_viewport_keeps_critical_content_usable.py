import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.navigation]


@pytest.mark.case("UI-028", "Critical content and actions remain usable on narrow mobile screens")
@pytest.mark.parametrize("width", [320, 390])
def test_mobile_viewport_keeps_critical_content_usable(page, app_url, test_log, width):
    with test_log.step("Open the portal at the supported mobile width"):
        page.set_viewport_size({"width": width, "height": 844})
        page.goto(app_url)
        expect(page.locator('[data-app-ready="true"]')).to_be_visible()
        expect(page.get_by_role("heading", name="El fuego nos reúne.", exact=True)).to_be_visible()
    with test_log.step("Validate mobile entry points and absence of horizontal overflow"):
        expect(page.get_by_role("link", name="Entrar al laboratorio", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="Planear mi fuego", exact=False)).to_be_visible()
        expect(page.locator(".mobile-nav summary")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        test_log.values(viewport_width=width)
