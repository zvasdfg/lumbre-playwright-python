import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.planner, pytest.mark.portal]


@pytest.mark.parametrize(
    "goal,temperature", [("asar", "220"), ("ahumar", "120"), ("hornear", "180")]
)
@pytest.mark.case("UI-012", "FirePlanner defaults, persistence and stale print invalidation")
def test_planner_defaults_and_saved_round_trip(portal, goal, temperature):
    page = portal
    page.get_by_label("Objetivo de cocción", exact=True).select_option(goal)
    expect(page.get_by_label("Temperatura de trabajo", exact=True)).to_have_value(temperature)
    page.get_by_label("Horas de cocción", exact=True).fill("2.5")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.locator(".planner-result")).to_contain_text("2.5 h")
    page.get_by_label("Nombre del plan", exact=True).fill("Round trip")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.reload()
    page.get_by_role("button", name="Editar plan Round trip", exact=True).click()
    expect(page.get_by_label("Objetivo de cocción", exact=True)).to_have_value(goal)
    expect(page.get_by_label("Horas de cocción", exact=True)).to_have_value("2.5")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    page.get_by_role("button", name="Imprimir / PDF", exact=True).click()
    expect(page.get_by_role("dialog")).to_contain_text("2.5 h")
    page.get_by_role("button", name="Cerrar plan imprimible", exact=True).click()
    page.get_by_label("Horas de cocción", exact=True).fill("3")
    expect(page.get_by_role("button", name="Imprimir / PDF", exact=True)).to_have_count(0)
