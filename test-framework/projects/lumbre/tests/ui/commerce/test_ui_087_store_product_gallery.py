import re

import pytest
from playwright.sync_api import expect

PRODUCTS = [
    (1, "Sazonador multiuso"),
    (2, "Sazonador para carne de res"),
    (3, "Sazonador para carne de cerdo"),
    (4, "Sazonador para carne de pollo"),
]

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.commerce,
    pytest.mark.store,
    pytest.mark.remote_smoke,
]


@pytest.mark.case(
    "UI-087", "Each product gallery loads all usage images at mobile and desktop sizes"
)
@pytest.mark.parametrize("index,name", PRODUCTS)
@pytest.mark.parametrize("width", [390, 1440], ids=["mobile", "desktop"])
def test_product_gallery(page, app_url, index, name, width):
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(app_url.rstrip("/") + "/#tienda")
    page.get_by_role("link", name=f"Comprar {name} en la tienda", exact=True).click()
    page.wait_for_load_state("load")
    expect(page.get_by_text(f"SKU: LMB-F-{index:03d}", exact=True)).to_be_visible()
    thumbs = page.locator(".js-product-thumb")
    images = page.locator("img.js-product-slide-img")
    assert thumbs.count() >= 4, (
        "Primary product, diagram, gathering and preparation images are required"
    )
    assert images.count() == thumbs.count()
    for position in range(thumbs.count()):
        image = images.nth(position)
        if width < 700:
            thumb = thumbs.nth(position)
            thumb.click()
            expect(thumb).to_have_class(re.compile(r"\bselected\b"))
        else:
            # Desktop uses a visible image grid; its mobile thumbs are hidden.
            image.scroll_into_view_if_needed()
        expect(image).to_be_visible()
        page.wait_for_function(
            "e => e.complete && e.naturalWidth > 100", arg=image.element_handle()
        )
        assert image.get_attribute("alt").startswith(f"LMB-F-{index:03d}")
        print(f"LMB-F-{index:03d}: imagen {position + 1} cargada ({width}px)")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
