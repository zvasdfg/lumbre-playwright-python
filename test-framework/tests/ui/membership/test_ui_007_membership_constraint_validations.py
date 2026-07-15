import pytest
from playwright.sync_api import Locator, expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.parametrize(
    ("invalid_field", "name", "email", "accept_terms"),
    [
        pytest.param(
            "name",
            "",
            "isaac@example.test",
            True,
            id="name-required",
            marks=pytest.mark.case(
                "UI-007",
                "The form prevents submitting a membership without a name",
            ),
        ),
        pytest.param(
            "email",
            "Isaac Arellano",
            "invalid-email",
            True,
            id="email-format",
            marks=pytest.mark.case(
                "UI-027",
                "Membership email and terms constraints prevent invalid submission",
            ),
        ),
        pytest.param(
            "terms",
            "Isaac Arellano",
            "isaac@example.test",
            False,
            id="terms-required",
            marks=pytest.mark.case(
                "UI-027",
                "Membership email and terms constraints prevent invalid submission",
            ),
        ),
    ],
)
def test_membership_constraint_validation(
    home: HomePage,
    test_log: TestLogger,
    invalid_field: str,
    name: str,
    email: str,
    accept_terms: bool,
) -> None:
    with test_log.step("Prepare the membership form"):
        home.open_membership()
        home.membership.complete(name=name, email=email)
        if accept_terms:
            home.membership.accept_terms()
        test_log.values(
            invalid_field=invalid_field,
            submitted_name=name,
            submitted_email=email,
            accepted_terms=accept_terms,
        )

    with test_log.step("Attempt the invalid membership submission"):
        home.membership.submit()

    with test_log.step("Validate the browser constraint"):
        controls: dict[str, Locator] = {
            "name": home.membership.name_input,
            "email": home.membership.email_input,
            "terms": home.membership.terms_checkbox,
        }
        invalid_control = controls[invalid_field]
        observed_valid = invalid_control.evaluate("element => element.validity.valid")
        observed_value_missing = invalid_control.evaluate(
            "element => element.validity.valueMissing"
        )
        observed_validation_message = invalid_control.evaluate(
            "element => element.validationMessage"
        )

        expect(home.membership.root).to_be_visible()
        expect(invalid_control).to_be_focused()
        test_log.values(
            invalid_field=invalid_field,
            observed_valid=observed_valid,
            expected_valid=False,
            observed_value_missing=observed_value_missing,
            observed_validation_message=observed_validation_message,
        )
        assert observed_valid is False
        assert observed_validation_message
        if invalid_field in {"name", "terms"}:
            assert observed_value_missing is True
