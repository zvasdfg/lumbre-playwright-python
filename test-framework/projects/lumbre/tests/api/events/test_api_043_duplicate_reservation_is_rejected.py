import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-043",
    "An account cannot reserve the same event twice or consume capacity twice",
)
def test_duplicate_reservation_is_rejected(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Create the account's first reservation"):
        first = authenticated_api.create_event_reservation(202, 2)
        test_log.values(observed_status=first.status, reserved_party_size=2)
        assert first.status == 201

    with test_log.step("Attempt a second reservation for the same account and event"):
        duplicate = authenticated_api.create_event_reservation(202, 1)
        test_log.values(
            observed_status=duplicate.status,
            observed_error=duplicate.json()["error"],
            expected_status=409,
        )
        assert duplicate.status == 409

    with test_log.step("Validate that the duplicate did not consume another place"):
        event = next(event for event in authenticated_api.events()["data"] if event["id"] == 202)
        history = authenticated_api.reservations().json()
        test_log.values(
            observed_available_spots=event["spots"],
            expected_available_spots=10,
            observed_reservation_count=history["count"],
        )
        assert event["spots"] == 10
        assert history["count"] == 1
