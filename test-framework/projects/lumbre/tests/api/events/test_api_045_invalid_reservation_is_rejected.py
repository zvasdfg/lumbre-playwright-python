from typing import Any

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.parametrize(
    ("event_id", "party_size", "expected_status"),
    [
        pytest.param(201, 0, 422, id="empty-party"),
        pytest.param(201, 5, 422, id="party-above-limit"),
        pytest.param(999, 1, 404, id="unknown-event"),
    ],
)
@pytest.mark.case(
    "API-045",
    "Invalid party sizes and unknown events are rejected without creating reservations",
)
def test_invalid_reservation_is_rejected(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
    event_id: int,
    party_size: Any,
    expected_status: int,
) -> None:
    with test_log.step("Submit an invalid event reservation"):
        response = authenticated_api.create_event_reservation(event_id, party_size)
        test_log.values(
            submitted_event_id=event_id,
            submitted_party_size=party_size,
            observed_status=response.status,
            observed_error=response.json()["error"],
            expected_status=expected_status,
        )
        assert response.status == expected_status

    with test_log.step("Validate that no reservation was persisted"):
        history = authenticated_api.reservations().json()
        test_log.values(observed_reservation_count=history["count"], expected_count=0)
        assert history["count"] == 0
