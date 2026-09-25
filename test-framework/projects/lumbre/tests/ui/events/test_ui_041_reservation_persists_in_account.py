import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-041",
    "A confirmed event reservation survives reload and appears in account history",
)
def test_reservation_persists_in_account_history(
    authenticated_home: HomePage,
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    event_title = "Humo y fermentos"

    with test_log.step("Create a reservation through the retained events API"):
        response = authenticated_api.create_event_reservation(203, 3)
        assert response.status == 201
        reservation = response.json()["data"]
        test_log.values(
            created_reservation=reservation,
            observed_available_spots=response.json()["event"]["spots"],
        )

    with test_log.step("Reload the portal using the authenticated browser context"):
        authenticated_home.page.reload()
        authenticated_home.wait_until_ready()
        test_log.values(
            observed_agenda_sections=authenticated_home.page.locator("#agenda").count(),
            expected_agenda_sections=0,
        )
        expect(authenticated_home.page.locator("#agenda")).to_have_count(0)

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
