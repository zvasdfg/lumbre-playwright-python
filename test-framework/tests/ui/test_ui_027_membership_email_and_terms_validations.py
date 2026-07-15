import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.parametrize("invalid_field", ["email", "terms"])
@pytest.mark.case(
    "UI-027",
    "Membership email and terms constraints prevent invalid submission",
)
def test_membership_email_and_terms_validations(
    home: HomePage,
    test_log: TestLogger,
    invalid_field: str,
) -> None:
    with test_log.step("Prepare the membership form"):
        home.open_membership()
        email = "invalid-email" if invalid_field == "email" else "isaac@example.test"
        home.membership.complete(name="Isaac Arellano", email=email)
        if invalid_field != "terms":
            home.membership.accept_terms()
        test_log.values(invalid_field=invalid_field, submitted_email=email)

    with test_log.step("Attempt the invalid membership submission"):
        home.membership.submit()

    with test_log.step("Validate the browser constraint"):
        invalid_control = (
            home.membership.email_input
            if invalid_field == "email"
            else home.membership.terms_checkbox
        )
        observed_valid = invalid_control.evaluate("element => element.validity.valid")
        observed_validation_message = invalid_control.evaluate(
            "element => element.validationMessage"
        )
        expect(home.membership.root).to_be_visible()
        expect(invalid_control).to_be_focused()
        test_log.values(
            invalid_field=invalid_field,
            observed_valid=observed_valid,
            expected_valid=False,
            observed_validation_message=observed_validation_message,
        )
        assert observed_valid is False
        assert observed_validation_message
