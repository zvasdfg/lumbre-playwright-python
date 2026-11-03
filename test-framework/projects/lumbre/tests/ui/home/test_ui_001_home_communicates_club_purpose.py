import re

import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.regression,
    pytest.mark.smoke,
    pytest.mark.navigation,
]


@pytest.mark.case(
    "UI-001", "Compact welcome leads with products, external purchase and retained tools"
)
def test_home_leads_with_products_and_keeps_tools_reachable(portal, test_log):
    with test_log.step("Read the compact welcome before the four production products"):
        expect(
            portal.get_by_role("heading", name="Sazonadores para cocinar al fuego.", exact=True)
        ).to_be_visible()
        expect(portal.locator("h1")).to_have_count(1)
        expect(
            portal.get_by_text("Cuatro mezclas. Encuentra la tuya.", exact=True)
        ).to_be_visible()
        expect(portal.locator("main > section").first).to_have_attribute("id", "tienda")
        expect(portal.locator(".hero-photo")).to_have_count(0)
        expect(portal.get_by_test_id("product-card")).to_have_count(4)
        first = portal.get_by_test_id("product-card").first
        expect(first.locator("img")).to_have_attribute("loading", "eager")
        expect(first.get_by_role("link", name="Comprar Sazonador multiuso en la tienda")).to_have_attribute(
            "href", re.compile(r"https://lumbre16\.mitiendanube\.com/productos/lmb-f-001-")
        )
    with test_log.step("Validate actionable entry points without membership or account UI"):
        expect(
            portal.get_by_role("link", name="Entrar al laboratorio", exact=True)
        ).to_have_attribute("href", "#laboratorio")
        expect(portal.get_by_role("button", name="Planear mi fuego", exact=False)).to_be_visible()
        expect(portal.get_by_role("link", name="Explorar recetas", exact=False)).to_have_attribute(
            "href", "#recetas"
        )
        expect(portal.get_by_test_id("account-button")).to_have_count(0)
        expect(portal.get_by_test_id("cart-count")).to_have_count(0)
