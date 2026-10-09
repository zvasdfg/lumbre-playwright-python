"""External integration: public GET/navigation only, no cart or inventory writes."""
from urllib.parse import urlparse
import re

import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.remote_smoke]
PRODUCTS = [(1, "Sazonador multiuso"), (2, "Sazonador para carne de res"),
            (3, "Sazonador para carne de cerdo"), (4, "Sazonador para carne de pollo")]


@pytest.mark.parametrize("index,name", PRODUCTS)
@pytest.mark.parametrize("width", [390, 1440], ids=["mobile", "desktop"])
@pytest.mark.parametrize("entry", ["card", "sheet"])
@pytest.mark.case("STORE-UI-001", "Portal product destination matches the public store SKU")
def test_store_product_and_return(page, app_url, index, name, width, entry):
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(app_url.rstrip("/") + "/#tienda")
    link = page.get_by_role("link", name=f"Comprar {name} en la tienda", exact=True)
    href = link.get_attribute("href")
    assert urlparse(href).netloc == "lumbre16.mitiendanube.com"
    if entry == "sheet":
        page.get_by_role("button", name=f"Ver ficha de {name}", exact=True).click()
        purchase = page.get_by_role("dialog").get_by_role("link", name="Comprar en la tienda ↗", exact=True)
        expect(purchase).to_have_attribute("href", href)
    else:
        purchase = link
    with page.expect_navigation(wait_until="domcontentloaded") as navigation:
        purchase.click()
    response = navigation.value
    assert response.status == 200
    # The theme attaches menu handlers after DOMContentLoaded.
    page.wait_for_load_state("load")
    assert page.url.rstrip("/") == href.rstrip("/")
    expect(page.get_by_role("heading", name=f"LMB-F-{index:03d} · {name} · 150 g", exact=False)).to_be_visible()
    expect(page.get_by_text(f"SKU: LMB-F-{index:03d}", exact=True)).to_be_visible()
    # Stock is live: do not require zero stock or a fixed price forever.
    expect(page.get_by_role("button", name="Agotado", exact=True).or_(
        page.get_by_role("button", name="Agregar al carrito", exact=True))).to_be_visible()
    sold_out = page.get_by_role("button", name="Agotado", exact=True)
    if sold_out.count():
        expect(sold_out).to_be_disabled()
        expect(page.get_by_role("button", name="Agregar al carrito", exact=True)).to_have_count(0)
        print(f"LMB-F-{index:03d}: agotado; compra bloqueada correctamente")
    else:
        expect(page.get_by_role("button", name="Agregar al carrito", exact=True)).to_be_enabled()
        print(f"LMB-F-{index:03d}: disponible; no se crea pedido")
    price = page.locator("#price_display")
    expect(price).to_be_visible()
    expect(price).to_contain_text(re.compile(r"\$\s*[\d,.]+"))
    assert int(price.get_attribute("data-product-price")) > 0
    hero = page.locator("img.js-product-slide-img").first
    expect(hero).to_be_visible()
    page.wait_for_function("e => e.complete && e.naturalWidth > 100", arg=hero.element_handle())
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    # Use the main menu, not the footer's external-link/new-tab variant.
    page.mouse.wheel(0, -10000)
    if width < 700:
        page.get_by_role("button", name="Abrir menú", exact=True).click()
        returns = page.locator("#nav-hamburger").get_by_role("link", name="Inicio · Portal Lumbre", exact=True)
    else:
        returns = page.get_by_role("banner").get_by_role("link", name="Inicio · Portal Lumbre", exact=True)
    expect(returns.first).to_have_attribute("href", "https://metodolumbre.com/#tienda")
    returns.first.click()
    expect(page).to_have_url("https://metodolumbre.com/#tienda")
    expect(page.get_by_test_id("product-card")).to_have_count(4)


@pytest.mark.case("STORE-UI-002", "Each product gallery loads all usage images at mobile and desktop sizes")
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
    assert thumbs.count() >= 4, "Primary product, diagram, gathering and preparation images are required"
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
        page.wait_for_function("e => e.complete && e.naturalWidth > 100", arg=image.element_handle())
        assert image.get_attribute("alt").startswith(f"LMB-F-{index:03d}")
        print(f"LMB-F-{index:03d}: imagen {position + 1} cargada ({width}px)")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
