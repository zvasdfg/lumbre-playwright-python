import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.planner,
    pytest.mark.cross_browser,
    pytest.mark.portal,
]


@pytest.mark.case("UI-075", "Quick presets replace goal and fuel without stale state")
def test_quick_plan_transitions(page, app_url):
    page.goto(app_url)
    for name, goal, fuel in [
        ("Indirecto con humo", "ahumar", "briquetas"),
        ("Dos zonas", "asar", "carbon"),
        ("Comida directa", "asar", "carbon"),
    ]:
        page.locator(".quick-plans").get_by_role("button", name=name).click()
        expect(page.get_by_label("Objetivo de cocción", exact=True)).to_have_value(goal)
        expect(page.get_by_label("Combustible principal", exact=True)).to_have_value(fuel)
        page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
        expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
