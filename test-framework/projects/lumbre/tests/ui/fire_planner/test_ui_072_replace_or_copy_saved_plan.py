import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.planner, pytest.mark.portal]


@pytest.mark.case("UI-072", "Replace updates saved plan; copy preserves original after reload")
@pytest.mark.parametrize("decision", ["Confirmar reemplazo", "Guardar como copia"])
def test_save_decisions(planner, decision):
    page = planner.page
    page.get_by_label("Nombre del plan", exact=True).fill("Domingo")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.get_by_role("button", name="Editar plan Domingo", exact=True).click()
    page.get_by_label("Horas de cocción", exact=True).fill("3")
    planner.build()
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.get_by_role("group", name="Confirmar reemplazo").get_by_role(
        "button", name=decision, exact=True
    ).click()
    page.reload()
    cards = page.get_by_test_id("fire-presets").locator("article")
    expect(cards).to_have_count(1 if decision == "Confirmar reemplazo" else 2)
    page.get_by_role("button", name="Editar plan Domingo", exact=True).click()
    expect(page.get_by_label("Horas de cocción", exact=True)).to_have_value(
        "3" if decision == "Confirmar reemplazo" else "2"
    )
    if decision == "Guardar como copia":
        page.get_by_role("button", name="Editar plan Domingo · copia 1", exact=True).click()
        expect(page.get_by_label("Horas de cocción", exact=True)).to_have_value("3")
