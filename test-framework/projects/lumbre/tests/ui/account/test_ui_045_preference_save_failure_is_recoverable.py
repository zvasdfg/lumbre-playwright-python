import pytest
from playwright.sync_api import Route, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-045",
    "A failed preference save preserves the edited values for retry",
)
def test_preference_save_failure_is_recoverable(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    def fail_updates(route: Route) -> None:
        if route.request.method == "PUT":
            route.fulfill(
                status=503,
                content_type="application/json",
                body='{"error":"Preference service unavailable"}',
            )
        else:
            route.fallback()

    authenticated_home.page.route("**/api/account/preferences", fail_updates)

    with test_log.step("Open the account and wait for its current preferences"):
        authenticated_home.open_account()
        account = authenticated_home.account
        expect(account.save_preferences_button).to_be_enabled()

    with test_log.step("Edit preferences while the save dependency is unavailable"):
        account.update_preferences(
            preferred_fuel="briquetas",
            equipment="abierta",
            cooking_style="dos_zonas",
            default_guests=9,
            newsletter_consent=True,
        )
        expect(account.preference_status).to_have_text(
            "No pudimos guardar tus preferencias. Intenta de nuevo.",
        )
        test_log.values(
            intercepted_method="PUT",
            simulated_status=503,
            observed_message=account.preference_status.inner_text(),
        )

    with test_log.step("Validate that edited values remain available for retry"):
        expect(account.preferred_fuel_select).to_have_value("briquetas")
        expect(account.equipment_select).to_have_value("abierta")
        expect(account.cooking_style_select).to_have_value("dos_zonas")
        expect(account.default_guests_input).to_have_value("9")
        expect(account.newsletter_checkbox).to_be_checked()
        expect(account.save_preferences_button).to_be_enabled()
