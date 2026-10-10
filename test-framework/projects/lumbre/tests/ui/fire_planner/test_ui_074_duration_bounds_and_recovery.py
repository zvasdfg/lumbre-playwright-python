import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.planner,
    pytest.mark.cross_browser,
    pytest.mark.portal,
]


@pytest.mark.parametrize("hours", ["0", "-1", "48.1"])
@pytest.mark.case("UI-074", "Duration bounds reject invalid plans and recover")
def test_duration_bounds_and_recovery(page, app_url, hours):
    page.goto(app_url)
    duration = page.get_by_label("Horas de cocción", exact=True)
    duration.fill(hours)
    assert not duration.evaluate("e => e.checkValidity()")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_have_count(0)
    duration.fill("2")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
