import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


def sign_in(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200


@pytest.mark.api
@pytest.mark.case(
    "API-044",
    "A sold-out event rejects additional reservations without overselling capacity",
)
def test_sold_out_event_rejects_reservation(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Reserve four of the event's five places"):
        sign_in(api, name="Primera Cuenta", email="primera.reserva@example.test")
        first = api.create_event_reservation(203, 4)
        assert first.status == 201
        assert api.logout().status == 200
        test_log.values(first_party_size=4, observed_remaining_spots=first.json()["event"]["spots"])

    with test_log.step("Reserve the final place from a different account"):
        sign_in(api, name="Segunda Cuenta", email="segunda.reserva@example.test")
        second = api.create_event_reservation(203, 1)
        assert second.status == 201
        assert api.logout().status == 200
        test_log.values(
            second_party_size=1, observed_remaining_spots=second.json()["event"]["spots"]
        )

    with test_log.step("Reject another account after capacity reaches zero"):
        sign_in(api, name="Tercera Cuenta", email="tercera.reserva@example.test")
        rejected = api.create_event_reservation(203, 1)
        event = next(event for event in api.events()["data"] if event["id"] == 203)
        test_log.values(
            observed_status=rejected.status,
            observed_error=rejected.json()["error"],
            observed_available_spots=event["spots"],
            expected_available_spots=0,
        )
        assert rejected.status == 409
        assert event["spots"] == 0
