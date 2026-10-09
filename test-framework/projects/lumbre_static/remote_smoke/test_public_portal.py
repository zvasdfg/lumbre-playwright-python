"""Read-only acceptance of the current static portal; no backend fixtures or writes."""
from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.remote_smoke, pytest.mark.smoke]


@pytest.mark.api
@pytest.mark.case("STATIC-REMOTE-001", "Static HTML retains its security headers")
def test_static_document(api_request_context, test_log):
    with test_log.step("Read the public document"):
        response = api_request_context.get("/")
        assert response.status == 200
        assert "text/html" in response.headers.get("content-type", "")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert "frame-ancestors 'none'" in response.headers.get("content-security-policy", "")


@pytest.mark.api
@pytest.mark.parametrize("path", ["/api/account", "/api/cart", "/api/orders", "/api/test/reset"])
@pytest.mark.case("STATIC-REMOTE-002", "Retired API routes are not exposed")
def test_no_backend(api_request_context, test_log, path):
    with test_log.step(f"GET {path}; never POST to production"):
        assert api_request_context.get(path).status == 404


@pytest.mark.ui
@pytest.mark.parametrize("width", [390, 1440])
@pytest.mark.case("STATIC-REMOTE-003", "Public catalog and purchase links render without backend")
def test_catalog(page, app_url, test_log, width):
    with test_log.step("Open a fresh public catalog"):
        page.set_viewport_size({"width": width, "height": 900})
        errors, api_calls = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("request", lambda request: api_calls.append(request.url)
                if urlparse(request.url).path.startswith("/api/") else None)
        page.goto(app_url.rstrip("/") + "/#tienda")
        expect(page.locator('[data-app-ready="true"]')).to_be_visible()
        expect(page.get_by_test_id("product-card")).to_have_count(4)
        expect(page.get_by_test_id("account-button")).to_have_count(0)
        expect(page.locator(".cart-button, .cart-drawer")).to_have_count(0)
        names = ["Sazonador multiuso", "Sazonador para carne de res",
                 "Sazonador para carne de cerdo", "Sazonador para carne de pollo"]
        for index, name in enumerate(names, 1):
            link = page.get_by_role("link", name=f"Comprar {name} en la tienda", exact=True)
            target = urlparse(link.get_attribute("href"))
            assert target.scheme == "https"
            assert target.netloc == "lumbre16.mitiendanube.com"
            assert target.path.startswith(f"/productos/lmb-f-{index:03d}-")
            page.get_by_role("button", name=f"Ver ficha de {name}", exact=True).click()
            sheet = page.get_by_role("dialog", name=name, exact=True)
            buy = sheet.get_by_role("link", name="Comprar en la tienda ↗", exact=True)
            expect(buy).to_have_attribute("href", link.get_attribute("href"))
            expect(buy).to_have_css("color", "rgb(255, 255, 255)")
            image = sheet.locator("img").first
            expect(image).to_have_js_property("complete", True)
            assert image.evaluate("e => e.naturalWidth") > 0
            sheet.get_by_role("button", name="Cerrar ficha de producto", exact=True).click()
        assert not errors, errors
        assert not api_calls, api_calls
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
