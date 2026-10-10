import pytest
from playwright.sync_api import expect

from projects.lumbre.components.fire_planner import FirePlanner
from projects.lumbre.data.cases import FUELS, PLANNER_CASES

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.planner,
    pytest.mark.matrix,
    pytest.mark.planner_matrix,
    pytest.mark.portal,
]


@pytest.mark.case("UI-064", "Every available goal/equipment/fuel combination produces a budget")
@pytest.mark.parametrize("goal,equipment,fuel", PLANNER_CASES)
def test_planner_matrix(screen, goal, equipment, fuel):
    planner = FirePlanner(screen)
    planner.configure(goal, equipment, fuel)
    actual = (
        screen.get_by_label("Combustible principal", exact=True)
        .locator("option")
        .evaluate_all("es=>es.map(e=>e.value)")
    )
    assert set(actual) == set(FUELS[equipment])
    expect(screen.get_by_label("Combustible principal", exact=True)).to_have_value(fuel)
    planner.build()
    expect(screen.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
    estimate = screen.locator(".planner-result .fire-fuel-estimate")
    expect(estimate).to_be_visible()
    assert "NaN" not in estimate.inner_text()
    assert "Infinity" not in estimate.inner_text()
    assert screen.evaluate("document.documentElement.scrollWidth<=innerWidth")
