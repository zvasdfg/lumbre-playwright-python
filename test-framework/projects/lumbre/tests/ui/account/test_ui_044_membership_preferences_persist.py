import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-044",
    "Authenticated membership preferences survive a complete page reload",
)
def test_membership_preferences_persist(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open the account and configure cooking preferences"):
        authenticated_home.open_account()
        account = authenticated_home.account
        expect(account.save_preferences_button).to_be_enabled()
        account.update_preferences(
            preferred_fuel="lena",
            equipment="ahumador",
            cooking_style="lento",
            default_guests=12,
            newsletter_consent=True,
        )
        expect(account.preference_status).to_have_text("Tus preferencias quedaron guardadas.")
        test_log.values(
            preferred_fuel="lena",
            equipment="ahumador",
            cooking_style="lento",
            default_guests=12,
            newsletter_consent=True,
        )

    with test_log.step("Reload the complete portal using the authenticated session"):
        authenticated_home.page.reload(wait_until="domcontentloaded")
        authenticated_home.wait_until_ready()
        authenticated_home.open_account()
        expect(authenticated_home.account.save_preferences_button).to_be_enabled()

    with test_log.step("Validate that every preference was restored from the account"):
        account = authenticated_home.account
        expect(account.preferred_fuel_select).to_have_value("lena")
        expect(account.equipment_select).to_have_value("ahumador")
        expect(account.cooking_style_select).to_have_value("lento")
        expect(account.default_guests_input).to_have_value("12")
        expect(account.newsletter_checkbox).to_be_checked()
        test_log.values(
            observed_fuel=account.preferred_fuel_select.input_value(),
            observed_equipment=account.equipment_select.input_value(),
            observed_style=account.cooking_style_select.input_value(),
            observed_guests=account.default_guests_input.input_value(),
            observed_consent=account.newsletter_checkbox.is_checked(),
        )
