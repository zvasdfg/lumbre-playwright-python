import pytest
from playwright.sync_api import Route, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-043",
    "A failed account preset save keeps the configuration available for retry",
)
def test_account_preset_save_failure_is_recoverable(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    planner = authenticated_home.fire_planner
    preset_name = "Fuego pendiente"

    with test_log.step("Open the authenticated planner and simulate an unavailable save API"):
        authenticated_home.open_fire_planner()

        def reject_save(route: Route) -> None:
            route.fulfill(
                status=503,
                content_type="application/json",
                body='{"error":"Preset service unavailable"}',
            )

        authenticated_home.page.route("**/api/fire-presets", reject_save)
        test_log.values(
            intercepted_route="POST /api/fire-presets",
            simulated_status=503,
        )

    with test_log.step("Attempt to save the named account preset"):
        planner.save_preset(preset_name)
        expect(planner.preset_message).to_have_text(
            "No pudimos guardar el preset en tu cuenta.",
        )
        test_log.values(
            observed_message=planner.preset_message.inner_text(),
            retained_name=planner.preset_name_input.input_value(),
        )

    with test_log.step("Validate that no false success was rendered and retry data remains"):
        expect(planner.preset(preset_name)).to_have_count(0)
        expect(planner.preset_name_input).to_have_value(preset_name)
        expect(planner.save_preset_button).to_be_enabled()
        test_log.values(
            observed_preset_count=planner.preset(preset_name).count(),
            retry_available=True,
        )
