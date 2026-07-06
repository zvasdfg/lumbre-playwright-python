import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-012",
    "The fire planner recommends fuel for a direct-fire gathering",
)
def test_fire_planner_recommends_fuel(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open the fire planner"):
        home.open_fire_planner()
        expect(home.fire_planner.root).to_be_visible()

    with test_log.step("Configure a direct-fire gathering"):
        home.fire_planner.configure(
            guests=8,
            cooking_style="directo",
            duration_hours=2,
            include_vegetables=False,
        )
        test_log.values(
            guests=8,
            cooking_style="directo",
            duration_hours=2,
            include_vegetables=False,
        )

    with test_log.step("Calculate the required fuel"):
        home.fire_planner.calculate()

    with test_log.step("Validate the fuel recommendation"):
        expect(home.fire_planner.recommendation_status).to_be_visible()

        observed_recommendation = home.fire_planner.recommendation_status.inner_text()
        expected_recommendation = "4 kg"

        test_log.values(
            observed_recommendation=observed_recommendation,
            expected_recommendation=expected_recommendation,
        )

        expect(home.fire_planner.recommendation_status).to_contain_text(expected_recommendation)
