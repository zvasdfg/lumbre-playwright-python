import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.planner, pytest.mark.regression]


@pytest.mark.case(
    "UI-100", "Cook/roast/rest stage metadata persists through reload and printable sheet"
)
@pytest.mark.parametrize("unit", ["C", "F"])
def test_multistage_plan(planner, unit):
    page = planner.page
    page.locator(".planner-customize summary").click()
    page.get_by_label("Unidad de temperatura", exact=True).select_option(unit)
    temperatures = ("220", "180") if unit == "C" else ("428", "356")
    planner.add_stage(
        1, name="Sellado QA", temperature=temperatures[0], notes="Marcar por ambos lados"
    )
    planner.add_stage(
        2,
        name="Horneado QA",
        goal="hornear",
        method="indirecto",
        surface="bandeja",
        temperature=temperatures[1],
        duration="45 min",
        notes="Comprobar el centro",
    )
    planner.add_stage(3, name="Reposo QA", kind="pausa", duration="10 min", notes="Fuera del fuego")
    planner.build()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
    page.get_by_label("Nombre del plan", exact=True).fill(f"Tres fases {unit}")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.reload()
    page.get_by_role("button", name=f"Editar plan Tres fases {unit}", exact=True).click()
    if page.locator(".planner-customize").get_attribute("open") is None:
        page.locator(".planner-customize summary").click()
    expect(page.get_by_label("Unidad de temperatura", exact=True)).to_have_value(unit)
    for index, name in enumerate(("Sellado QA", "Horneado QA", "Reposo QA"), 1):
        expect(page.get_by_label(f"Nombre de etapa {index}", exact=True)).to_have_value(name)
    for index, temperature in enumerate(temperatures, 1):
        expect(
            page.get_by_label(f"Temperatura de etapa {index} (°{unit})", exact=True)
        ).to_have_value(temperature)
    expect(page.get_by_label("Objetivo de etapa 2", exact=True)).to_have_value("hornear")
    expect(page.get_by_label("Soporte de etapa 2", exact=True)).to_have_value("bandeja")
    expect(page.get_by_label("Tipo de etapa 3", exact=True)).to_have_value("pausa")
    expect(page.get_by_label(f"Temperatura de etapa 3 (°{unit})", exact=True)).to_have_value("")
    expect(page.locator(".planner-stage-editor fieldset").nth(2).locator("textarea")).to_have_value(
        "Fuera del fuego"
    )
    page.get_by_role("button", name=f"Imprimir plan Tres fases {unit}", exact=True).click()
    sheet = page.get_by_role("dialog", name=f"Tres fases {unit}", exact=True)
    expect(sheet).to_be_visible()
    for text in ("Sellado QA", "Horneado QA", "Reposo QA", "45 min", "10 min", "Fuera del fuego"):
        expect(sheet).to_contain_text(text)
    page.keyboard.press("Escape")
