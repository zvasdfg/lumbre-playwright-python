import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.laboratory, pytest.mark.portal]


@pytest.mark.case("UI-015", "Lab search, quantities, radar, alias and deletion")
def test_lab_search_recalculation_and_alias(portal):
    page = portal
    page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()
    search = page.get_by_role("searchbox", name="Buscar componente", exact=True)
    search.fill("zz-no-ingredient-zz")
    expect(page.get_by_test_id("ingredient-card")).to_have_count(0)
    search.fill("")
    for ingredient in ("sal_kosher", "pimienta_negra", "ajo_granulado"):
        card = page.get_by_test_id("ingredient-card").filter(
            has=page.locator(f'[data-ingredient-id="{ingredient}"]')
        )
        group = page.locator("details.ingredient-family-group").filter(has=card)
        if group.get_attribute("open") is None:
            group.locator("summary").click()
        card.get_by_role("button", name="Agregar", exact=True).click()
        expect(group.locator("summary")).to_contain_text("1 seleccionados")
    expect(page.get_by_label("Gramos de sal kosher", exact=True)).to_have_value("67.5")
    expect(page.get_by_label("Gramos de pimienta negra", exact=True)).to_have_value("60")
    expect(page.get_by_label("Gramos de ajo granulado", exact=True)).to_have_value("22.5")
    radar = page.locator(".experiment-bench .lab-radar svg")
    expect(radar.locator("text")).to_have_text(["Salado", "Dulce", "Ácido", "Amargo", "Umami"])
    previous = radar.locator("title").text_content()
    page.get_by_label("Gramos de sal kosher", exact=True).fill("1")
    expect(radar.locator("title")).not_to_have_text(previous)
    page.get_by_role("button", name="Retirar ajo granulado", exact=True).click()
    expect(page.get_by_label("Gramos de sal kosher", exact=True)).to_have_value("75")
    expect(page.get_by_label("Gramos de pimienta negra", exact=True)).to_have_value("75")
    page.get_by_label("Nombre de tu blend", exact=True).fill("Prueba pimientas")
    page.get_by_role("button", name="Guardar en esta sesión", exact=True).click()
    sheet = page.get_by_test_id("hypothesis-print-preview")
    expect(sheet.locator("#hypothesis-sheet-title")).to_have_text("Prueba pimientas")
    expect(sheet.locator(".lab-sheet-quantities tbody tr")).to_have_count(2)
    expect(sheet.locator(".lab-sheet-quantities")).not_to_contain_text("%")
    expect(sheet).not_to_contain_text("codex-clipboard")
    page.get_by_role("button", name="Cerrar ficha técnica", exact=True).click()
    page.reload()
    page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()
    expect(page.get_by_test_id("session-blends")).to_contain_text("Prueba pimientas")
    page.get_by_role("button", name="Eliminar blend Prueba pimientas", exact=True).click()
    expect(page.get_by_test_id("session-blends")).to_have_count(0)
