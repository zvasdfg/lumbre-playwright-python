import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.commerce]


@pytest.mark.case("UI-030", "The portal provisions catalog presents the four production blends")
def test_blends_lead_store_catalog(portal, test_log):
    expected = [
        "Sazonador multiuso",
        "Sazonador para carne de res",
        "Sazonador para carne de cerdo",
        "Sazonador para carne de pollo",
    ]
    with test_log.step("Read all current product cards"):
        cards = portal.get_by_test_id("product-card")
        expect(cards).to_have_count(4)
        actual = cards.locator("h3").all_text_contents()
        test_log.values(observed_names=actual, expected_names=expected)
    with test_log.step("Check the production catalog rather than retired merchandise"):
        assert actual == expected
        for name in expected:
            expect(
                portal.get_by_role("link", name=f"Comprar {name} en la tienda", exact=True)
            ).to_be_visible()
