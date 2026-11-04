import pytest
from playwright.sync_api import expect

from projects.lumbre.data.cases import ALMANAC_DOCUMENTS, ALMANAC_PORTRAIT_DOCUMENTS

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.almanac,
    pytest.mark.matrix,
    pytest.mark.almanac_matrix,
    pytest.mark.regression,
]


@pytest.mark.case("UI-092", "Every published almanac document loads at both viewports")
@pytest.mark.parametrize("document", ALMANAC_DOCUMENTS, ids=lambda n: f"DOC-{n}")
def test_every_document(almanac, document):
    reader = almanac
    expect(reader.index.locator("option")).to_have_count(107)
    reader.select(document)
    ordinal = ALMANAC_DOCUMENTS.index(document) + 1
    expect(reader.status).to_contain_text(f"DOC. {document[:3]} ·")
    if document in ("059", "059-cepillo"):
        expect(reader.status).to_contain_text("cepillo" if document == "059-cepillo" else "sartén")
        expect(reader.page.get_by_role("complementary", name="Nota editorial")).to_contain_text("dos originales distintos")
    expect(reader.page.get_by_test_id("almanac-page")).to_have_attribute("data-page", str(ordinal))
    expect(reader.image).to_have_attribute("src", f"/editorial/almanac/page-{document}.jpeg")
    width, height = (1145, 1374) if int(document[:3]) in ALMANAC_PORTRAIT_DOCUMENTS else (1254, 1254)
    expect(reader.image).to_have_js_property("naturalWidth", width)
    expect(reader.image).to_have_js_property("naturalHeight", height)
    assert len(reader.image.get_attribute("alt") or "") > 15
    assert reader.dialog.evaluate("e => e.scrollWidth <= e.clientWidth")
    expect(reader.page.locator(".almanac-progress strong")).to_have_text(f"{ordinal:02d} / 106")
    reader.close()
