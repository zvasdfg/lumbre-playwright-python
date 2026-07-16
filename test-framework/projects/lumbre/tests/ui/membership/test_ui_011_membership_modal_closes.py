import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.parametrize(
    "close_method",
    ["button", "backdrop"],
    ids=["close-button", "backdrop"],
)
@pytest.mark.case(
    "UI-011",
    "The membership modal can be closed through different mechanisms",
)
def test_membership_modal_closes(
    home: HomePage,
    test_log: TestLogger,
    close_method: str,
) -> None:
    with test_log.step("Open the membership modal"):
        home.open_membership()
        expect(home.membership.root).to_be_visible()
        test_log.values(
            close_method=close_method,
            observed_modal_visible=home.membership.root.is_visible(),
            expected_modal_visible=True,
        )

    with test_log.step("Close the modal through the requested mechanism"):
        home.membership.close(close_method)

    with test_log.step("Validate that the modal is no longer visible"):
        expect(home.membership.root).not_to_be_visible()
        observed_modal_visible = home.membership.root.is_visible()
        test_log.values(
            observed_modal_visible=observed_modal_visible,
            expected_modal_visible=False,
            close_method=close_method,
        )
