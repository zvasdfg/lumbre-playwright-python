import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-059",
    "Account access presents distinct sign-in and sign-up forms",
)
def test_sign_in_and_sign_up_are_distinct(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open the account modal through the sign-in action"):
        home.open_account()
        expect(home.account.root.get_by_role("heading")).to_have_text("Entra a Lumbre.")
        expect(home.account.email_input).to_be_visible()
        expect(home.account.name_input).to_be_hidden()
        expect(home.account.request_link_button).to_have_text("Enviar enlace para entrar")
        test_log.values(
            observed_heading=home.account.root.get_by_role("heading").inner_text(),
            observed_name_field=False,
            observed_submit_label=home.account.request_link_button.inner_text(),
        )

    with test_log.step("Switch to the explicit account creation form"):
        home.account.sign_up_mode_button.click()
        expect(home.account.root.get_by_role("heading")).to_have_text("Crea tu cuenta.")
        expect(home.account.name_input).to_be_visible()
        expect(home.account.email_input).to_be_visible()
        expect(home.account.request_link_button).to_have_text("Crear cuenta con enlace")
        test_log.values(
            observed_heading=home.account.root.get_by_role("heading").inner_text(),
            observed_name_field=True,
            observed_submit_label=home.account.request_link_button.inner_text(),
        )

    with test_log.step("Return to sign-in without retaining sign-up-only fields"):
        home.account.sign_in_mode_button.click()
        expect(home.account.name_input).to_be_hidden()
        expect(home.account.email_input).to_be_focused()
        test_log.values(
            observed_sign_in_selected=home.account.sign_in_mode_button.get_attribute(
                "aria-pressed"
            ),
            observed_name_field=False,
            observed_email_focused=True,
        )

