"""Invalidate stale output, protect stored originals and reject concurrent writes."""
import pytest
from playwright.sync_api import expect
from projects.lumbre_static.components.planner import Planner

pytestmark = [pytest.mark.ui, pytest.mark.regression]
STORAGE_KEY = "lumbre.fire-planner.presets.v1"


@pytest.fixture(params=[390, 1440], ids=["mobile", "desktop"])
def planner(page, app_url, request):
    page.set_viewport_size({"width": request.param, "height": 900})
    page.goto(app_url)
    component = Planner(page)
    component.configure("asar", "kettle", "carbon")
    component.build()
    yield component
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.mark.case("PLAN-STATE-001", "Primary configuration changes invalidate generated printable output")
@pytest.mark.parametrize("label,value,expected_fuel", [
    ("Equipo", "gas", "gas_lp"), ("Combustible principal", "briquetas", "briquetas"),
    ("Objetivo de cocción", "ahumar", "carbon"), ("Horas de cocción", "3", "carbon")])
def test_stale_result(planner, label, value, expected_fuel):
    page = planner.page
    expect(page.get_by_role("button", name="Imprimir / PDF", exact=True)).to_be_visible()
    control = page.get_by_label(label, exact=True)
    if label == "Horas de cocción":
        control.fill(value)
    else:
        control.select_option(value)
    expect(page.get_by_role("button", name="Imprimir / PDF", exact=True)).to_have_count(0)
    expect(page.get_by_label("Combustible principal", exact=True)).to_have_value(expected_fuel)
    for name in ("capabilityVerified", "fuelVerified", "smokeVerified"):
        for checkbox in page.locator(f'[name="{name}"]').all():
            checkbox.check()
    planner.build()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
    page.get_by_role("button", name="Imprimir / PDF", exact=True).click()
    expect(page.get_by_role("dialog")).to_be_visible()
    if label == "Horas de cocción":
        expect(page.get_by_role("dialog")).to_contain_text("3 h")


@pytest.mark.case("PLAN-STATE-002", "Replace updates saved plan; copy preserves original after reload")
@pytest.mark.parametrize("decision", ["Confirmar reemplazo", "Guardar como copia"])
def test_save_decisions(planner, decision):
    page = planner.page
    page.get_by_label("Nombre del plan", exact=True).fill("Domingo")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.get_by_role("button", name="Editar plan Domingo", exact=True).click()
    page.get_by_label("Horas de cocción", exact=True).fill("3")
    planner.build()
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    page.get_by_role("group", name="Confirmar reemplazo").get_by_role("button", name=decision, exact=True).click()
    page.reload()
    cards = page.get_by_test_id("fire-presets").locator("article")
    expect(cards).to_have_count(1 if decision == "Confirmar reemplazo" else 2)
    page.get_by_role("button", name="Editar plan Domingo", exact=True).click()
    expect(page.get_by_label("Horas de cocción", exact=True)).to_have_value("3" if decision == "Confirmar reemplazo" else "2")
    if decision == "Guardar como copia":
        page.get_by_role("button", name="Editar plan Domingo · copia 1", exact=True).click()
        expect(page.get_by_label("Horas de cocción", exact=True)).to_have_value("3")


@pytest.mark.case("PLAN-STATE-003", "Second-tab changes cannot be silently overwritten")
def test_concurrent_storage(planner, context):
    page = planner.page
    page.get_by_label("Nombre del plan", exact=True).fill("Original")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    other = context.new_page()
    other.goto(page.url)
    original = other.evaluate("key => localStorage.getItem(key)", STORAGE_KEY)
    other.evaluate("key => { const p = JSON.parse(localStorage.getItem(key)); p[0].name='Desde otra pestaña'; localStorage.setItem(key, JSON.stringify(p)); }", STORAGE_KEY)
    changed = other.evaluate("key => localStorage.getItem(key)", STORAGE_KEY)
    assert original != changed
    page.get_by_label("Nombre del plan", exact=True).fill("Mi cambio")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    confirmation = page.get_by_role("group", name="Confirmar reemplazo")
    if confirmation.count():
        confirmation.get_by_role("button", name="Confirmar reemplazo", exact=True).click()
    expect(page.get_by_test_id("fire-planner")).to_contain_text("Los planes cambiaron en otra pestaña")
    assert page.evaluate("key => localStorage.getItem(key)", STORAGE_KEY) == changed
    other.close()
