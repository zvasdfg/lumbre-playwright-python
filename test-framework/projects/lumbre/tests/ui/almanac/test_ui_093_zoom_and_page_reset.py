import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.almanac, pytest.mark.regression]


@pytest.mark.case("UI-093", "Zoom enables contained image scrolling and resets on page change")
@pytest.mark.parametrize("document", [1, 11, 54])
def test_zoom_and_reset(almanac, document):
    reader = almanac
    reader.select(document)
    expect(reader.image).to_have_js_property("complete", True)
    reader.dialog.locator(".almanac-zoom").click()
    zoom = reader.dialog.locator(".almanac-zoom")
    expect(zoom).to_have_attribute("aria-pressed", "true")
    expect(reader.page.get_by_test_id("almanac-book")).to_have_class("almanac-book is-zoomed")
    scroll = reader.page.locator(".almanac-page-scroll")
    assert scroll.evaluate("e => e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth")
    scroll.evaluate("e => {e.scrollTop = 200; e.scrollLeft = 200;}")
    assert scroll.evaluate("e => e.scrollTop > 0 || e.scrollLeft > 0")
    zoom.click()
    expect(reader.page.get_by_test_id("almanac-book")).to_have_class("almanac-book")
    reader.dialog.locator(".almanac-zoom").click()
    reader.select(2 if document == 1 else 1)
    expect(reader.page.get_by_test_id("almanac-book")).to_have_class("almanac-book")
    expect(reader.dialog.locator(".almanac-zoom")).to_have_attribute("aria-pressed", "false")
    reader.close()
