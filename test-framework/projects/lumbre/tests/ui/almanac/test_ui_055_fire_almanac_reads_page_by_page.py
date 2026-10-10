import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.almanac, pytest.mark.portal]


@pytest.mark.case("UI-055", "Almanac boundary controls and image loading")
def test_almanac_boundaries(portal):
    page = portal
    page.get_by_role("button", name="Almanaque", exact=False).click()
    index = page.get_by_label("Ir a una página del almanaque")
    expect(index).to_be_visible()
    count = index.locator("option").count()
    assert count > 1
    index.select_option(index=count - 1)
    expect(page.get_by_role("button", name="Página siguiente", exact=True)).to_be_disabled()
    image = page.get_by_test_id("almanac-page").locator("img")
    expect(image).to_have_js_property("naturalWidth", 1254)
    index.select_option(index=0)
    expect(page.get_by_role("button", name="Página anterior", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Cerrar almanaque", exact=True).click()
    expect(index).to_have_count(0)
