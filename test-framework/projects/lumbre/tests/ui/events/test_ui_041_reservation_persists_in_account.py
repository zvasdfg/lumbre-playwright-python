import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-041",
    "A confirmed event reservation survives reload and appears in account history",
)
def test_reservation_persists_in_account_history(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    event_title = "Humo y fermentos"

    with test_log.step("Confirm an event reservation for the authenticated account"):
        authenticated_home.events.reserve_event(event_title)
        authenticated_home.event_reservation.select_party_size(event_title, 3)
        authenticated_home.event_reservation.confirm(event_title)
        expect(authenticated_home.toast.root).to_contain_text(
            "Reservación confirmada para 3 personas",
        )
        test_log.values(
            selected_event=event_title,
            party_size=3,
            observed_available_spots=authenticated_home.events.available_spots(
                event_title,
            ).inner_text(),
        )

    with test_log.step("Reload the portal using the same authenticated browser context"):
        authenticated_home.page.reload()
        authenticated_home.wait_until_ready()
        expect(authenticated_home.events.available_spots(event_title)).to_have_text("2 lugares")
        test_log.values(
            observed_available_spots_after_reload=authenticated_home.events.available_spots(
                event_title,
            ).inner_text(),
            expected_available_spots="2 lugares",
        )

    with test_log.step("Validate the persisted reservation in account history"):
        authenticated_home.open_account()
        expect(authenticated_home.account.reservation_history).to_contain_text(event_title)
        expect(authenticated_home.account.reservation_history).to_contain_text("3 lugares")
        expect(authenticated_home.account.reservation_history).to_contain_text("Confirmada")
        test_log.values(
            observed_reservation_history=authenticated_home.account.reservation_history.inner_text(),
            expected_event=event_title,
            expected_party_size="3 lugares",
            expected_status="Confirmada",
        )
