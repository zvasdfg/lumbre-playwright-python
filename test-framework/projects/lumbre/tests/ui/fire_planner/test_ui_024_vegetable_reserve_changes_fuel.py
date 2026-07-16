import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-024",
    "Adding a vegetable reserve changes the fire planner recommendation",
)
def test_vegetable_reserve_changes_fuel(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Calculate without a vegetable reserve"):
        home.open_fire_planner()
        home.fire_planner.configure(
            guests=2,
            cooking_style="lento",
            duration_hours=2,
            include_vegetables=False,
        )
        home.fire_planner.calculate()
        expect(home.fire_planner.recommendation_status).to_contain_text("2 kg")
        initial_recommendation = home.fire_planner.recommendation_status.inner_text()
        test_log.values(
            include_vegetables=False,
            observed_initial_recommendation=initial_recommendation,
        )

    with test_log.step("Recalculate with a vegetable reserve"):
        home.fire_planner.vegetable_reserve_checkbox.check()
        expect(home.fire_planner.recommendation_status).not_to_be_visible()
        home.fire_planner.calculate()
        updated_recommendation = home.fire_planner.recommendation_status.inner_text()
        test_log.values(
            include_vegetables=True,
            observed_updated_recommendation=updated_recommendation,
            expected_updated_fuel="3 kg",
        )

    with test_log.step("Validate the reserve changes the result"):
        expect(home.fire_planner.recommendation_status).to_contain_text("3 kg")
        assert initial_recommendation != updated_recommendation
