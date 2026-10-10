import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.almanac, pytest.mark.regression]


@pytest.mark.case("UI-098", "Editorial warning and cited destination follow the selected document")
@pytest.mark.parametrize(
    "document, expected, domain",
    [
        (1, "Láminas originales de archivo", "www.fsis.usda.gov"),
        *[(n, "no corresponden a zonas exclusivas", "www.nidcd.nih.gov") for n in range(31, 37)],
        (50, "cerdo molido, a 71 °C", "www.fsis.usda.gov"),
        (52, "no una garantía de seguridad", "www.fsis.usda.gov"),
    ],
)
def test_editorial_notes(almanac, document, expected, domain):
    almanac.select(document)
    note = almanac.page.get_by_role("complementary", name="Nota editorial", exact=True)
    expect(note).to_contain_text(expected)
    link = note.get_by_role("link")
    assert link.get_attribute("href").startswith(f"https://{domain}/")
    expect(link).to_have_attribute("target", "_blank")
    assert "noreferrer" in link.get_attribute("rel")
    almanac.select(54)
    expect(note).to_contain_text("Láminas originales de archivo")
    expect(note).not_to_contain_text(expected) if document != 1 else None
    almanac.close()
