import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case("UI-013", "The membership form follows a logical keyboard focus order")
def test_membership_keyboard_focus_order(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Open the membership modal"):
        home.open_membership_with_keyboard()

        expect(home.membership.root).to_be_visible()
        test_log.values(
            observed_modal_visible=home.membership.root.is_visible(),
            expected_modal_visible=True,
        )
        expect(home.membership.name_input).to_be_focused()

    with test_log.step("Enter the member name and move to the next field"):
        member_name = "Ana Parrilla"

        home.membership.enter_name_and_move_to_email_with_keyboard(
            member_name=member_name,
        )

        test_log.values(member_name=member_name)

    with test_log.step("Validate the keyboard focus order"):
        observed_name = home.membership.name_input.input_value()
        observed_email_focused = home.membership.email_input.evaluate(
            "element => element === document.activeElement"
        )
        expected_email_focused = True
        test_log.values(
            observed_name=observed_name,
            expected_name=member_name,
            observed_email_focused=observed_email_focused,
            expected_email_focused=expected_email_focused,
        )
        expect(home.membership.name_input).to_have_value(member_name)
        expect(home.membership.email_input).to_be_focused()
