import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.almanac, pytest.mark.regression]


@pytest.mark.case("UI-095", "Close/reopen clears zoom and page without moving background scroll")
def test_reader_close_reopen(almanac):
    reader = almanac
    background_y = reader.page.evaluate("scrollY")
    reader.select(11)
    reader.dialog.locator(".almanac-zoom").click()
    assert reader.page.evaluate("document.body.style.overflow === 'hidden'")
    reader.dialog.locator("#almanac-title").click()
    expect(reader.dialog).to_be_visible()
    reader.close()
    assert abs(reader.page.evaluate("scrollY") - background_y) <= 2
    reader.open()
    expect(reader.status).to_have_text("PORTADA")
    expect(reader.dialog.locator(".almanac-zoom")).to_have_count(0)
    expect(reader.page.get_by_role("button", name="Página anterior", exact=True)).to_be_disabled()
    # On small screens the reader fills the backdrop, so no backdrop target exists.
    if reader.page.viewport_size["width"] > 850:
        reader.page.mouse.click(1, 1)
        expect(reader.dialog).to_have_count(0)
        expect(reader.page.get_by_role("button", name="Almanaque", exact=False)).to_be_focused()
    else:
        reader.close()
