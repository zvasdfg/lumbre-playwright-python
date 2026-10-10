import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.planner, pytest.mark.portal]


@pytest.mark.case("UI-071", "Primary configuration changes invalidate generated printable output")
@pytest.mark.parametrize(
    "label,value,expected_fuel",
    [
        ("Equipo", "gas", "gas_lp"),
        ("Combustible principal", "briquetas", "briquetas"),
        ("Objetivo de cocción", "ahumar", "carbon"),
        ("Horas de cocción", "3", "carbon"),
    ],
)
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
