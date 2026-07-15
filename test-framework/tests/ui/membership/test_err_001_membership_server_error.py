import pytest
from playwright.sync_api import Page, Route, expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


def return_membership_server_error(route: Route) -> None:
    route.fulfill(
        status=500,
        content_type="application/json",
        body='{"error": "Internal server error"}',
    )


@pytest.mark.ui
@pytest.mark.case(
    "ERR-001",
    "A membership server error keeps the form available for retry",
)
def test_membership_server_error_keeps_form_available(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Configure the membership API failure"):
        page.route("**/api/members", return_membership_server_error)
        test_log.values(
            mocked_endpoint="/api/members",
            mocked_status=500,
        )

    with test_log.step("Open the membership form"):
        home.open_membership()

    with test_log.step("Complete valid membership details"):
        member_name = "Ana Fuego"
        member_email = "ana.fuego@example.com"

        home.membership.complete(
            name=member_name,
            email=member_email,
            experience="intermedio",
        )
        home.membership.accept_terms()

        test_log.values(
            member_name=member_name,
            member_email=member_email,
            selected_experience="intermedio",
            terms_accepted=True,
        )

    with test_log.step("Submit the membership registration"):
        home.membership.submit()

    with test_log.step("Validate the recoverable error"):
        expected_error = "No pudimos completar el registro"

        expect(home.status_message).to_contain_text(expected_error)
        observed_error = home.status_message.inner_text()

        expect(home.membership.root).to_be_visible()
        expect(home.membership.submit_button).to_be_enabled()
        expect(home.membership.name_input).to_have_value(member_name)
        expect(home.membership.email_input).to_have_value(member_email)
        expect(home.membership.terms_checkbox).to_be_checked()

        test_log.values(
            observed_error=observed_error,
            expected_error_contains=expected_error,
            modal_remains_visible=True,
            submit_button_enabled=True,
            retained_name=member_name,
            retained_email=member_email,
            terms_remain_checked=True,
        )
