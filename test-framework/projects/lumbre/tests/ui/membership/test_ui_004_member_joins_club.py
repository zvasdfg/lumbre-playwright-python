import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.smoke
@pytest.mark.case("UI-004", "A visitor can register as a club member")
def test_member_can_join_the_club(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Register a membership with valid data"):
        member_name = "Ana Parrilla"
        home.register_member(name=member_name, email="ana@example.com")
        test_log.values(member_name=member_name, selected_experience="intermedio")

    with test_log.step("Validate the membership confirmation"):
        expected_confirmation = "Bienvenido al club"
        expect(home.toast.root).to_contain_text(expected_confirmation)
        test_log.values(
            observed_confirmation=home.toast.root.inner_text(),
            expected_confirmation_contains=expected_confirmation,
        )
