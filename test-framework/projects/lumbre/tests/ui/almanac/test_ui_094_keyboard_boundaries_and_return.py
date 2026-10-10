import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.almanac,
    pytest.mark.regression,
    pytest.mark.cross_browser,
]


@pytest.mark.case(
    "UI-094", "Arrow navigation respects cover/last boundaries and Escape restores focus"
)
def test_keyboard_boundaries(almanac):
    reader = almanac
    close = reader.page.get_by_role("button", name="Cerrar almanaque", exact=True)
    close.focus()
    reader.page.keyboard.press("ArrowLeft")
    expect(reader.status).to_have_text("PORTADA")
    reader.page.keyboard.press("ArrowRight")
    expect(reader.status).to_contain_text("DOC. 001")
    reader.page.keyboard.press("ArrowLeft")
    expect(reader.status).to_have_text("PORTADA")
    reader.select(54)
    close.focus()
    reader.page.keyboard.press("ArrowRight")
    expect(reader.status).to_contain_text("DOC. 054")
    reader.page.keyboard.press("ArrowLeft")
    expect(reader.status).to_contain_text("DOC. 053")
    reader.page.keyboard.press("Escape")
    expect(reader.dialog).to_have_count(0)
    expect(reader.page.get_by_role("button", name="Almanaque", exact=False)).to_be_focused()
    assert reader.page.evaluate("document.body.style.overflow !== 'hidden'")
    reader.open()
    expect(reader.status).to_have_text("PORTADA")
    reader.close()
