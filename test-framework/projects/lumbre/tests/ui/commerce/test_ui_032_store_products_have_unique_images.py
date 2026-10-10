import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.commerce]


@pytest.mark.case("UI-032", "Each production product has a distinct loaded photograph")
def test_store_products_have_unique_images(portal, test_log):
    images = portal.get_by_test_id("product-card").locator("img")
    with test_log.step("Inspect the four product photographs"):
        expect(images).to_have_count(4)
        sources = images.evaluate_all("es => es.map(e => e.getAttribute('src'))")
        assert len(set(sources)) == 4
    with test_log.step("Check that every image actually loads"):
        for image in images.all():
            image.scroll_into_view_if_needed()
            portal.wait_for_function(
                "e => e.complete && e.naturalWidth > 0", arg=image.element_handle()
            )
        test_log.values(unique_product_images=len(set(sources)))
