import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.laboratory, pytest.mark.portal]


@pytest.mark.case("UI-017", "Twelfth ingredient blocks additions; removal restores capacity")
def test_selection_capacity(lab):
    ids = [
        "sal_mar_gruesa",
        "pimienta_negra",
        "ajo_granulado",
        "azucar_morena",
        "chile_pasilla",
        "comino",
        "sumac",
        "shiitake_seco",
        "romero",
        "cafe_molido",
        "cacao_puro",
        "pimienta_blanca",
    ]
    for ingredient in ids:
        lab.add(ingredient)
    page = lab.page
    selected = page.get_by_role("list", name="Componentes seleccionados").locator(
        "li:not(.empty-slot)"
    )
    expect(selected).to_have_count(12)
    thirteenth = lab.card("pimienta_verde")
    lab.expand(lab.family(thirteenth))
    expect(thirteenth.get_by_role("button", name="Agregar", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Retirar pimienta blanca", exact=True).click()
    expect(selected).to_have_count(11)
    expect(thirteenth.get_by_role("button", name="Agregar", exact=True)).to_be_enabled()
    thirteenth.get_by_role("button", name="Agregar", exact=True).click()
    expect(selected).to_have_count(12)
    expect(lab.family(thirteenth).locator("summary")).to_contain_text("2 seleccionados")
