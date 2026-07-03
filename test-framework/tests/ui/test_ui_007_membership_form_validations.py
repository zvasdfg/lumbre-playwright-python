import pytest
from playwright.sync_api import expect

from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-007",
    "The form prevents submitting a membership without a name",
)
def test_membership_requires_a_name(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Open the membership form"):
        home.open_membership()
        expect(home.membership.root).to_be_visible()

    with test_log.step("Attempt to submit the empty form"):
        home.membership.submit()

    with test_log.step("Validate that the name is required"):
        expect(home.membership.root).to_be_visible()
        expect(home.membership.name_input).to_be_focused()

        name_is_missing = home.membership.name_input.evaluate(
            "element => element.validity.valueMissing"
        )
        test_log.values(
            observed_name_value_missing=name_is_missing,
            expected_name_value_missing=True,
            observed_focused_element="Nombre completo",
        )
        assert name_is_missing is True
