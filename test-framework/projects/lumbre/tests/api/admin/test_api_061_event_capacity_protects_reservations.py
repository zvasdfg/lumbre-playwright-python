import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-061",
    "Event capacity cannot be reduced below already confirmed reservations",
)
def test_event_capacity_protects_reservations(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Reserve two places and read the administrative event revision"):
        reservation = administrator_api.create_event_reservation(201, 2)
        event = next(
            item
            for item in administrator_api.admin_events().json()["data"]
            if item["id"] == 201
        )
        test_log.values(
            reservation_id=reservation.json()["data"]["id"],
            confirmed_party_size=2,
            event_capacity=event["capacity"],
            event_revision=event["revision"],
        )
        assert reservation.status == 201

    with test_log.step("Attempt to reduce capacity below the confirmed places"):
        rejected = administrator_api.update_event(
            event["id"], {"expectedRevision": event["revision"], "capacity": 1}
        )
        test_log.values(
            observed_status=rejected.status,
            observed_error=rejected.json()["error"],
            expected_status=409,
        )
        assert rejected.status == 409

    with test_log.step("Confirm that capacity, availability, and audit history did not change"):
        persisted = next(
            item for item in administrator_api.admin_events().json()["data"] if item["id"] == 201
        )
        public = next(item for item in administrator_api.events()["data"] if item["id"] == 201)
        audit = administrator_api.administrative_audit_events().json()
        test_log.values(
            persisted_capacity=persisted["capacity"],
            available_spots=public["spots"],
            audit_count=audit["count"],
        )
        assert persisted["capacity"] == 8
        assert public["spots"] == 6
        assert audit["count"] == 0
