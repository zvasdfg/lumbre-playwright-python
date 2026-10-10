import pytest
from playwright.sync_api import expect

STORAGE_KEY = "lumbre.fire-planner.presets.v1"

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.planner, pytest.mark.portal]


@pytest.mark.case("UI-073", "Second-tab changes cannot be silently overwritten")
def test_concurrent_storage(planner, context):
    page = planner.page
    page.get_by_label("Nombre del plan", exact=True).fill("Original")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    other = context.new_page()
    other.goto(page.url)
    original = other.evaluate("key => localStorage.getItem(key)", STORAGE_KEY)
    other.evaluate(
        "key => { const p = JSON.parse(localStorage.getItem(key)); "
        "p[0].name='Desde otra pestaña'; localStorage.setItem(key, JSON.stringify(p)); }",
        STORAGE_KEY,
    )
    changed = other.evaluate("key => localStorage.getItem(key)", STORAGE_KEY)
    assert original != changed
    page.get_by_label("Nombre del plan", exact=True).fill("Mi cambio")
    page.get_by_role("button", name="Guardar plan", exact=True).click()
    confirmation = page.get_by_role("group", name="Confirmar reemplazo")
    if confirmation.count():
        confirmation.get_by_role("button", name="Confirmar reemplazo", exact=True).click()
    expect(page.get_by_test_id("fire-planner")).to_contain_text(
        "Los planes cambiaron en otra pestaña"
    )
    assert page.evaluate("key => localStorage.getItem(key)", STORAGE_KEY) == changed
    other.close()
