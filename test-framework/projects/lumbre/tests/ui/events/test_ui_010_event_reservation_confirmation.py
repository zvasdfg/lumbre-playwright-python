import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-010",
    "The reservation confirms the selected event",
)
def test_event_reservation_confirms_selected_event(
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    event_title = "Fuego de montaña"
    expected_city = "Monterrey, NL"
    expected_available_spots = "8 lugares disponibles"

    with test_log.step("Select an event from the schedule"):
        authenticated_home.events.reserve_event(event_title)
        dialog = authenticated_home.event_reservation.for_event(event_title)
        expect(dialog).to_be_visible()
        test_log.values(selected_event=event_title)

    with test_log.step("Validate the selected event details"):
        expect(dialog.get_by_text(expected_city, exact=True)).to_be_visible()
        expect(dialog).to_contain_text(expected_available_spots)
        test_log.values(
            observed_dialog_text=dialog.inner_text(),
            expected_event=event_title,
            expected_city=expected_city,
            expected_available_spots=expected_available_spots,
        )

    with test_log.step("Confirm the reservation"):
        authenticated_home.event_reservation.select_party_size(event_title, 2)
        authenticated_home.event_reservation.confirm(event_title)

    with test_log.step("Validate the final confirmation message"):
        expected_confirmation = "Reservación confirmada para 2 personas"
        expect(authenticated_home.toast.root).to_contain_text(expected_confirmation)
        expect(authenticated_home.events.available_spots(event_title)).to_have_text("6 lugares")

        test_log.values(
            observed_confirmation=authenticated_home.toast.root.inner_text(),
            expected_confirmation_contains=expected_confirmation,
            observed_available_spots=authenticated_home.events.available_spots(
                event_title
            ).inner_text(),
            expected_available_spots_after_reservation="6 lugares",
        )
