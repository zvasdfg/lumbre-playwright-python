import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.navigation]


@pytest.mark.case("UI-028", "Critical content and actions remain usable on narrow mobile screens")
@pytest.mark.parametrize("width,height", [(320, 640), (390, 667), (390, 844)])
def test_mobile_viewport_keeps_critical_content_usable(page, app_url, test_log, width, height):
    with test_log.step("Open the portal at the supported mobile width"):
        page.set_viewport_size({"width": width, "height": height})
        page.goto(app_url)
        expect(page.locator('[data-app-ready="true"]')).to_be_visible()
        expect(page.get_by_role("heading", name="Sazonadores para cocinar al fuego.", exact=True)).to_be_visible()
        page.evaluate("document.fonts.ready")
    with test_log.step("Product identity and purchase are in the initial viewport without scrolling"):
        first = page.get_by_test_id("product-card").first
        image = first.locator("img")
        expect(image).to_have_js_property("complete", True)
        expect(image).not_to_have_js_property("naturalWidth", 0)
        for target in (first.get_by_role("heading", name="Sazonador multiuso", exact=True),
                       first.get_by_role("link", name="Comprar Sazonador multiuso en la tienda", exact=True)):
            box = target.bounding_box()
            assert box and box["y"] >= 0 and box["y"] + box["height"] <= height, box
        buy = first.get_by_role("link", name="Comprar Sazonador multiuso en la tienda", exact=True)
        assert buy.evaluate("""e => {
            const r = e.getBoundingClientRect();
            const points = [
                [r.x + 2, r.y + 2], [r.right - 2, r.y + 2],
                [r.x + 2, r.bottom - 2], [r.right - 2, r.bottom - 2],
                [r.x + r.width / 2, r.y + r.height / 2]
            ];
            return points.every(([x, y]) => e.contains(document.elementFromPoint(x, y)));
        }""")
        assert page.evaluate("scrollY") == 0
    with test_log.step("Keep tools reachable and prevent horizontal overflow"):
        expect(page.get_by_role("link", name="Entrar al laboratorio", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="Planear mi fuego", exact=False)).to_be_visible()
        expect(page.locator(".mobile-nav summary")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        test_log.values(viewport_width=width, viewport_height=height)
