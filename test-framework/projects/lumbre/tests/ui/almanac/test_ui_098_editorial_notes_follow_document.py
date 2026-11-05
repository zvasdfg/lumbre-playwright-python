import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.almanac, pytest.mark.regression]


@pytest.mark.case("UI-098", "Editorial warning and cited destination follow the selected document")
@pytest.mark.parametrize(
    "document, expected, domain",
    [
        (1, "Láminas normalizadas de archivo", "www.fsis.usda.gov"),
        *[(n, "no representan zonas anatómicas exclusivas", "www.nidcd.nih.gov") for n in range(31, 37)],
        (50, "cerdo molido, a 71 °C", "www.fsis.usda.gov"),
        (52, "no una garantía de seguridad", "www.fsis.usda.gov"),
        (49, "74 °C internos", "www.foodsafety.gov"),
        (58, "Cambiar de cara no sustituye", "www.foodsafety.gov"),
        *[(n, "no garantizan inocuidad", "www.foodsafety.gov") for n in (60, 61, 81, 82, 86)],
        (74, "antes de 1 hora", "ask.fsis.usda.gov"),
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
    expect(note).to_contain_text("Láminas normalizadas de archivo")
    expect(note).not_to_contain_text(expected) if document != 1 else None
    almanac.close()
