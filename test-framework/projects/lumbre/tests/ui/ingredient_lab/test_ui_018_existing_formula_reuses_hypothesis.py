import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.laboratory, pytest.mark.portal]


@pytest.mark.case("UI-018", "Duplicate formula reopens original; variant preserves saved amounts")
def test_duplicate_and_variant(lab):
    page = lab.page
    lab.add("sal_mar_gruesa")
    lab.add("pimienta_negra")
    lab.save("Original")
    lab.close_sheet()
    lab.save("Otro nombre")
    expect(page.locator("#hypothesis-sheet-title")).to_have_text("Original")
    lab.close_sheet()
    cards = page.get_by_test_id("session-blends").locator("article")
    expect(cards).to_have_count(1)
    cards.get_by_role("button", name="Crear variante", exact=True).click()
    expect(page.get_by_label("Nombre de tu blend", exact=True)).to_have_value("Original · variante")
    page.get_by_label("Gramos de sal mar gruesa", exact=True).fill("60")
    page.get_by_label("Gramos de pimienta negra", exact=True).fill("90")
    lab.save("Variante")
    lab.close_sheet()
    expect(cards).to_have_count(2)
    page.reload()
    lab.open()
    original = cards.filter(has=page.get_by_role("heading", name="Original", exact=True))
    variant = cards.filter(has=page.get_by_role("heading", name="Variante", exact=True))
    expect(original).to_contain_text("75 g")
    expect(variant).to_contain_text("60 g")
    expect(variant).to_contain_text("90 g")
