import re

import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression,
              pytest.mark.navigation, pytest.mark.accessibility]


def luminance(rgb):
    channels = [int(v) / 255 for v in re.findall(r"\d+", rgb)[:3]]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
              for v in channels]
    return sum(v * weight for v, weight in zip(linear, [0.2126, 0.7152, 0.0722]))


@pytest.mark.case("UI-105", "Storefront and tool layouts remain clear without floating obstructions")
@pytest.mark.parametrize("width,height", [(320, 640), (390, 844), (768, 1024),
                                        (1024, 768), (1440, 900)])
def test_storefront_and_tools_layout(page, app_url, width, height):
    page.set_viewport_size({"width": width, "height": height})
    lab_requests = []
    page.on("request", lambda request: lab_requests.append(request.url)
            if re.search(r"ingredient-lab[^/]*\.js", request.url) else None)
    page.goto(app_url.rstrip("/") + "/#tienda")
    expect(page.locator('[data-app-ready="true"]')).to_be_visible()
    page.evaluate("document.fonts.ready")
    first = page.get_by_test_id("product-card").first
    expect(first.locator("img")).not_to_have_js_property("naturalWidth", 0)
    expect(page.locator("main > section").first).to_have_attribute("id", "tienda")
    assert not lab_requests, "Opening the first storefront must not request the laboratory"
    expect(page.locator("#store-title")).to_have_count(1)
    title = page.locator("#store-title").bounding_box()
    assert title and title["height"] < 180, title
    for link in page.get_by_role("navigation", name="Herramientas de Lumbre").get_by_role("link").all():
        box = link.bounding_box()
        assert box and box["y"] >= 0 and box["y"] + box["height"] <= height, box
    columns = page.locator("#tienda .product-grid").evaluate(
        "e => getComputedStyle(e).gridTemplateColumns.split(' ').length"
    )
    assert columns == (1 if width <= 520 else 2 if width <= 1100 else 4), columns
    shortcuts = page.get_by_role("navigation", name="Herramientas de Lumbre").get_by_role("link")
    tops = [link.bounding_box()["y"] for link in shortcuts.all()]
    assert max(tops) - min(tops) <= 2, tops

    almanac = page.locator("header").get_by_role("button", name="Almanaque", exact=False)
    expect(almanac).to_be_visible()
    assert almanac.evaluate("e => getComputedStyle(e).position") != "fixed"
    for card in page.get_by_test_id("product-card").all():
        photo = card.locator(".product-image-open").bounding_box()
        assert photo and abs(photo["width"] - photo["height"]) <= 2, photo
        for control in card.get_by_role("button").all():
            box = control.bounding_box()
            assert box and box["height"] >= 44, box
        assert card.locator(".product-card-open").evaluate("e => getComputedStyle(e).position") != "absolute"
        expect(card.get_by_role("heading", level=2)).to_have_count(1)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")

    if width <= 850:
        menu = page.locator(".mobile-nav")
        menu.locator("summary").click()
        expect(menu).to_have_attribute("open", "")
        menu.locator("summary").press("Escape")
        expect(menu).not_to_have_attribute("open", "")
        expect(menu.locator("summary")).to_be_focused()

    page.get_by_role("link", name="Usar el Planificador", exact=True).click()
    page.get_by_label("Horas de cocción", exact=True).fill("2")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
    colors = page.locator(".planner-output .planner-help").evaluate("""e => ({
        text: getComputedStyle(e).color,
        background: getComputedStyle(e.closest('.planner-output')).backgroundColor
    })""")
    light, dark = sorted([luminance(colors["text"]), luminance(colors["background"])], reverse=True)
    assert (light + 0.05) / (dark + 0.05) >= 4.5, colors
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
