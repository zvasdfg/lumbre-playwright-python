import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-023",
    "The fire planner applies the slow-cooking fuel rate",
)
def test_fire_planner_calculates_slow_cooking(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open and configure the fire planner"):
        home.open_fire_planner()
        home.fire_planner.configure(
            guests=6,
            cooking_style="lento",
            duration_hours=2,
        )
        test_log.values(
            guests=6,
            cooking_style="lento",
            duration_hours=2,
            kilograms_per_guest=0.8,
        )

    with test_log.step("Calculate the slow-cooking recommendation"):
        home.fire_planner.calculate()
        expect(home.fire_planner.recommendation_status).to_be_visible()

    with test_log.step("Validate the distinct fuel calculation"):
        expected_recommendation = "5 kg"
        observed_recommendation = home.fire_planner.recommendation_status.inner_text()
        test_log.values(
            observed_recommendation=observed_recommendation,
            expected_recommendation=expected_recommendation,
        )
        expect(home.fire_planner.recommendation_status).to_contain_text(expected_recommendation)
        expect(home.fire_planner.recommendation_status).to_contain_text("lento y ahumado")
