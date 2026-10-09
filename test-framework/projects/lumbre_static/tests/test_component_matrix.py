"""Finite UI matrix; model suites own the full configuration cross product."""
import pytest
from playwright.sync_api import expect

from projects.lumbre_static.components.planner import Planner
from projects.lumbre_static.components.laboratory import Laboratory
from projects.lumbre_static.data.cases import FUELS, PLANNER_CASES, INGREDIENTS

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.matrix]


@pytest.fixture
def screen(page, app_url):
    page.set_viewport_size({"width":390,"height":900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(app_url)
    expect(page.locator('[data-app-ready="true"]')).to_be_visible()
    yield page
    assert not errors, errors


@pytest.mark.case("MATRIX-UI-001", "Every available goal/equipment/fuel combination produces a budget")
@pytest.mark.parametrize("goal,equipment,fuel", PLANNER_CASES)
def test_planner_matrix(screen, goal, equipment, fuel):
    planner=Planner(screen)
    planner.configure(goal,equipment,fuel)
    actual=screen.get_by_label("Combustible principal",exact=True).locator("option").evaluate_all(
        "es=>es.map(e=>e.value)")
    assert set(actual)==set(FUELS[equipment])
    expect(screen.get_by_label("Combustible principal",exact=True)).to_have_value(fuel)
    planner.build()
    expect(screen.get_by_role("status",name="Plan de fuego listo")).to_be_visible()
    estimate=screen.locator(".planner-result .fire-fuel-estimate")
    expect(estimate).to_be_visible()
    assert "NaN" not in estimate.inner_text()
    assert "Infinity" not in estimate.inner_text()
    assert screen.evaluate("document.documentElement.scrollWidth<=innerWidth")


@pytest.mark.case("MATRIX-UI-002", "Every catalog ingredient can be inspected, selected and removed")
@pytest.mark.parametrize("item", INGREDIENTS, ids=lambda item:item["id"])
def test_each_ingredient(screen,item):
    lab=Laboratory(screen)
    lab.open()
    card=lab.card(item["id"])
    group=lab.family(card)
    expect(group).to_be_visible()
    lab.expand(group)
    card.get_by_role("button",name="Ficha",exact=True).click()
    dialog=screen.get_by_role("dialog")
    expect(dialog).to_contain_text(item["nombre"])
    dialog.get_by_role("button",name="Cerrar ficha",exact=True).click()
    card.get_by_role("button",name="Agregar",exact=True).click()
    expect(screen.get_by_label("Componentes seleccionados")).to_contain_text(item["nombre"])
    expect(group.locator("summary")).to_contain_text("1 seleccionados")
    screen.get_by_role("button",name=f'Retirar {item["nombre"]}',exact=True).click()
    expect(screen.get_by_label("Componentes seleccionados").locator("li:not(.empty-slot)")).to_have_count(0)
    expect(card.get_by_role("button",name="Agregar",exact=True)).to_have_attribute("aria-pressed","false")
