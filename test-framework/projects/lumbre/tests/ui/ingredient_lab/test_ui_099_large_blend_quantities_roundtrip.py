import pytest
from playwright.sync_api import expect

from projects.lumbre.data.cases import BLEND_COMPONENT_IDS

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.laboratory, pytest.mark.regression]


@pytest.mark.case("UI-099", "3/6/12 component manual weights survive saving, reload and variant")
@pytest.mark.parametrize("count", [3, 6, 12])
@pytest.mark.parametrize("heat", ["directo", "indirecto"])
def test_large_blend_roundtrip(lab, count, heat):
    page = lab.page
    page.get_by_label("Primero, el fuego", exact=True).select_option(heat)
    ids = BLEND_COMPONENT_IDS[:count]
    for ingredient in ids:
        lab.add(ingredient)
    # Synthetic boundary data, NOT a culinary recommendation.
    grams = 150 / count
    for ingredient in ids:
        lab.set_grams(ingredient, grams)
    alias = f"Mezcla QA {count} {heat} " + "larga " * 7
    page.get_by_label("Nombre de tu blend", exact=True).fill(alias)
    save = page.get_by_role("button", name="Guardar en esta sesión", exact=True)
    lab.set_grams(ids[0], grams + 0.01)
    expect(save).to_be_disabled()
    lab.set_grams(ids[0], grams)
    expect(save).to_be_enabled()
    lab.save(alias)
    sheet = page.get_by_test_id("hypothesis-print-preview")
    expect(sheet.get_by_role("heading", name=alias.strip(), exact=True)).to_be_visible()
    rows = sheet.locator(".lab-sheet-quantities tbody tr")
    expect(rows).to_have_count(count)
    expect(sheet.locator(".lab-sheet-quantities tfoot")).to_contain_text("150 g")
    for row in rows.all():
        expect(row.locator("td")).to_have_text(f"{grams:g} g")
    assert "% del lote" not in sheet.inner_text()
    lab.close_sheet()
    page.reload()
    page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()
    card = (
        page.get_by_test_id("session-blends")
        .locator("article")
        .filter(has=page.get_by_role("heading", name=alias.strip(), exact=True))
    )
    expect(card).to_be_visible()
    card.get_by_role("button", name="Crear variante", exact=True).click()
    expect(page.get_by_label("Primero, el fuego", exact=True)).to_have_value(heat)
    for ingredient in ids:
        name = lab.card(ingredient).locator("h3").text_content()
        expect(page.get_by_label(f"Gramos de {name}", exact=True)).to_have_value(f"{grams:g}")
    expect(page.get_by_role("button", name="Guardar en esta sesión", exact=True)).to_be_enabled()
