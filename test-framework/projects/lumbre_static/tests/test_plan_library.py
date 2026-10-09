"""Library transitions, not just happy-path creation."""
import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression]


@pytest.mark.case("LIBRARY-001", "Delete/undo survives reload and duplicate cancellation preserves original")
@pytest.mark.parametrize("width", [390,1440])
def test_library_transitions(page,app_url,width):
    page.set_viewport_size({"width":width,"height":900})
    page.goto(app_url)
    page.get_by_label("Horas de cocción",exact=True).fill("2")
    page.get_by_role("button",name="Construir plan de fuego",exact=True).click()
    name=page.get_by_label("Nombre del plan",exact=True)
    name.fill("Domingo")
    page.get_by_role("button",name="Guardar plan",exact=True).click()
    cards=page.get_by_test_id("fire-presets").locator("article")
    expect(cards).to_have_count(1)
    page.get_by_role("button",name="Eliminar plan Domingo",exact=True).click()
    expect(cards).to_have_count(0)
    page.get_by_role("button",name="Deshacer eliminación",exact=True).click()
    expect(cards).to_have_count(1)
    page.reload()
    expect(cards).to_have_count(1)
    page.get_by_role("button",name="Duplicar plan Domingo",exact=True).click()
    name.fill("Domingo")
    page.get_by_role("button",name="Guardar plan",exact=True).click()
    confirmation=page.get_by_role("group",name="Confirmar reemplazo",exact=True)
    expect(confirmation).to_be_visible()
    confirmation.get_by_role("button",name="Cancelar",exact=True).click()
    expect(cards).to_have_count(1)
    expect(confirmation).to_have_count(0)
