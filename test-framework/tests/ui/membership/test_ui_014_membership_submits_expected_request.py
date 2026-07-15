import pytest
from playwright.sync_api import Page

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-014",
    "Membership submission sends the expected API request",
)
def test_membership_submits_expected_request(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Prepare valid membership data"):
        member_name = "Ana Roble"
        member_email = "ana.roble@example.test"
        member_experience = "avanzado"

        expected_payload = {
            "name": member_name,
            "email": member_email,
            "experience": member_experience,
            "terms": "on",
        }

        home.open_membership()
        home.membership.complete(
            name=member_name,
            email=member_email,
            experience=member_experience,
        )
        home.membership.accept_terms()

        test_log.values(
            member_name=member_name,
            member_email=member_email,
            member_experience=member_experience,
            terms_accepted=True,
        )

    with test_log.step("Submit the form and capture the API request"):
        with page.expect_request("**/api/members") as request_info:
            home.membership.submit()

        membership_request = request_info.value

        test_log.values(
            captured_request_url=membership_request.url,
        )

    with test_log.step("Validate the membership request contract"):
        observed_url = membership_request.url
        observed_method = membership_request.method
        observed_payload = membership_request.post_data_json

        expected_url_suffix = "/api/members"
        expected_method = "POST"

        test_log.values(
            observed_url=observed_url,
            expected_url_suffix=expected_url_suffix,
            observed_method=observed_method,
            expected_method=expected_method,
            observed_payload=observed_payload,
            expected_payload=expected_payload,
        )

        assert observed_url.endswith(expected_url_suffix)
        assert observed_method == expected_method
        assert observed_payload == expected_payload
