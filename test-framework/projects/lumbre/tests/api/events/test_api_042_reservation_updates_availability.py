import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-042",
    "A confirmed reservation persists in account history and reduces availability",
)
def test_reservation_updates_availability(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read the server-owned availability before reserving"):
        before = next(event for event in authenticated_api.events()["data"] if event["id"] == 201)
        test_log.values(observed_available_spots=before["spots"], expected_available_spots=8)
        assert before["spots"] == 8

    with test_log.step("Reserve two places for the authenticated account"):
        response = authenticated_api.create_event_reservation(201, 2)
        payload = response.json()
        openapi_contract.validate_response(
            "/api/events/{id}/reservations",
            "post",
            response.status,
            payload,
        )
        test_log.values(
            observed_status=response.status,
            observed_reservation=payload["data"],
            observed_event=payload["event"],
        )
        assert response.status == 201
        assert payload["data"]["partySize"] == 2
        assert payload["event"]["spots"] == 6

    with test_log.step("Validate persisted history and public availability"):
        history_response = authenticated_api.reservations()
        history = history_response.json()
        after = next(event for event in authenticated_api.events()["data"] if event["id"] == 201)
        openapi_contract.validate_response(
            "/api/reservations",
            "get",
            history_response.status,
            history,
        )
        test_log.values(
            observed_history=history["data"],
            observed_available_spots=after["spots"],
            expected_available_spots=6,
        )
        assert history["count"] == 1
        assert history["data"][0]["eventTitle"] == "Fuego de montaña"
        assert after["spots"] == 6
