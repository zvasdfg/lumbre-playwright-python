import re

import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.recipes,
    pytest.mark.matrix,
    pytest.mark.recipes_matrix,
    pytest.mark.portal,
]


@pytest.mark.case("UI-034", "Every paginated recipe renders its complete sheet and restores focus")
def test_all_recipe_sheets(page, app_url):
    page.set_viewport_size({"width": 390, "height": 900})
    page.goto(app_url.rstrip("/") + "/#recetas")
    status = page.get_by_test_id("recipe-page-status")
    expect(status).to_be_visible()
    match = re.search(r"de\s*(\d+)\s*recetas", status.inner_text(), re.IGNORECASE)
    assert match, status.inner_text()
    total = int(match.group(1))
    visited = set()
    while True:
        cards = page.get_by_test_id("recipe-card")
        for card in cards.all():
            title = card.locator("h3").inner_text()
            assert title not in visited, f"Duplicate recipe across pages: {title}"
            trigger = card.get_by_role("button")
            trigger.click()
            sheet = page.get_by_role("dialog", name=title, exact=True)
            expect(sheet).to_be_visible()
            expect(sheet).to_contain_text("Preparación paso a paso")
            expect(sheet).to_contain_text("Notas y fuentes")
            assert sheet.locator(".recipe-method li").count() > 0, title
            image = sheet.locator("img").first
            expect(image).to_have_js_property("complete", True)
            assert image.evaluate("e=>e.naturalWidth") > 0, title
            expect(sheet.get_by_role("button", name="Imprimir ficha", exact=True)).to_be_visible()
            assert sheet.evaluate("e=>e.scrollWidth<=e.clientWidth"), title
            page.keyboard.press("Escape")
            expect(sheet).to_have_count(0)
            expect(trigger).to_be_focused()
            visited.add(title)
        next_page = page.get_by_role("button", name="Siguiente →", exact=True)
        if not next_page.is_enabled():
            break
        before = status.inner_text()
        next_page.click()
        expect(status).not_to_have_text(before)
    assert len(visited) == total
    print(f"UI-034: {len(visited)} unique recipes inspected")
