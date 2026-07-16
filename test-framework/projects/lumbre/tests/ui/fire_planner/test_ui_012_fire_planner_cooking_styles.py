import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.parametrize(
    ("guests", "cooking_style", "duration_hours", "expected_fuel", "expected_label"),
    [
        pytest.param(
            8,
            "directo",
            2,
            "4 kg",
            None,
            id="direct-fire",
            marks=pytest.mark.case(
                "UI-012",
                "The fire planner recommends fuel for a direct-fire gathering",
            ),
        ),
        pytest.param(
            6,
            "lento",
            2,
            "5 kg",
            "lento y ahumado",
            id="slow-cooking",
            marks=pytest.mark.case(
                "UI-023",
                "The fire planner applies the slow-cooking fuel rate",
            ),
        ),
    ],
)
def test_fire_planner_cooking_style(
    home: HomePage,
    test_log: TestLogger,
    guests: int,
    cooking_style: str,
    duration_hours: int,
    expected_fuel: str,
    expected_label: str | None,
) -> None:
    with test_log.step("Open and configure the fire planner"):
        home.open_fire_planner()
        expect(home.fire_planner.root).to_be_visible()
        home.fire_planner.configure(
            guests=guests,
            cooking_style=cooking_style,
            duration_hours=duration_hours,
            include_vegetables=False,
        )
        test_log.values(
            guests=guests,
            cooking_style=cooking_style,
            duration_hours=duration_hours,
            include_vegetables=False,
        )

    with test_log.step("Calculate the required fuel"):
        home.fire_planner.calculate()
        expect(home.fire_planner.recommendation_status).to_be_visible()

    with test_log.step("Validate the cooking-style recommendation"):
        observed_recommendation = home.fire_planner.recommendation_status.inner_text()
        test_log.values(
            observed_recommendation=observed_recommendation,
            expected_fuel=expected_fuel,
            expected_label=expected_label,
        )
        expect(home.fire_planner.recommendation_status).to_contain_text(expected_fuel)
        if expected_label is not None:
            expect(home.fire_planner.recommendation_status).to_contain_text(expected_label)
