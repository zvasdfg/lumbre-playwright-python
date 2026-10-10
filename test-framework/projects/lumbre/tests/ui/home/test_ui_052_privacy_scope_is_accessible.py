import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.regression,
    pytest.mark.smoke,
    pytest.mark.navigation,
]


@pytest.mark.case("UI-052", "The current footer discloses local storage and external checkout")
def test_privacy_scope_is_accessible(portal, test_log):
    with test_log.step("Inspect the current public privacy disclosure"):
        footer = portal.locator("footer")
        footer.scroll_into_view_if_needed()
        expect(footer).to_contain_text("Tu privacidad")
        expect(footer).to_contain_text(
            "Tus mezclas y presets se guardan únicamente en este navegador"
        )
        expect(footer).to_contain_text("Las compras se realizan en nuestra tienda Tiendanube")
    with test_log.step("Verify retired internal commerce is not presented"):
        expect(portal.locator(".cart-button, .cart-drawer")).to_have_count(0)
        expect(portal.get_by_test_id("account-button")).to_have_count(0)
