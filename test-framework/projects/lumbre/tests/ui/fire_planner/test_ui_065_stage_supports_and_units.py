import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.planner, pytest.mark.portal]


@pytest.mark.case("UI-065", "Every support and unit survive ordered stage edits")
@pytest.mark.parametrize("surface", ["rejilla", "plancha", "sarten", "bandeja", "sin_definir"])
@pytest.mark.parametrize("unit", ["C", "F"])
def test_stages(page, app_url, surface, unit):
    page.goto(app_url)
    page.locator(".planner-customize summary").click()
    page.get_by_label("Unidad de temperatura", exact=True).select_option(unit)
    page.get_by_label("Soporte del alimento", exact=True).select_option(surface)
    add = page.get_by_role("button", name="Añadir etapa", exact=True)
    add.click()
    page.get_by_label("Nombre de etapa 1", exact=True).fill("Sellar")
    page.get_by_label(f"Temperatura de etapa 1 (°{unit})", exact=True).fill("200")
    add.click()
    page.get_by_label("Nombre de etapa 2", exact=True).fill("Reposar")
    page.get_by_label("Tipo de etapa 2", exact=True).select_option("pausa")
    expect(page.get_by_label(f"Temperatura de etapa 2 (°{unit})", exact=True)).to_be_disabled()
    expect(page.get_by_label(f"Temperatura de etapa 2 (°{unit})", exact=True)).to_have_value("")
    page.get_by_role("button", name="Subir etapa 2", exact=True).click()
    expect(page.get_by_label("Nombre de etapa 1", exact=True)).to_have_value("Reposar")
    expect(page.get_by_label("Nombre de etapa 2", exact=True)).to_have_value("Sellar")
    expect(page.get_by_role("button", name="Subir etapa 1", exact=True)).to_be_disabled()
    page.get_by_role("button", name="Quitar etapa 1", exact=True).click()
    expect(page.get_by_label("Nombre de etapa 1", exact=True)).to_have_value("Sellar")
    expect(page.get_by_label("Nombre de etapa 2", exact=True)).to_have_count(0)
    expect(page.get_by_label("Soporte del alimento", exact=True)).to_have_value(surface)
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
