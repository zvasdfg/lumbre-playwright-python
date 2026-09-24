import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-033", "Repeated order submission creates only one order")
def test_order_creation_is_idempotent(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 112, "quantity": 1})
    payload = {
        "customerName": "Cliente Fixture",
        "customerEmail": "fixture.customer@example.test",
    }

    with test_log.step("Submit the same order idempotency key twice"):
        first = authenticated_api.create_order(payload, "stable-order-key")
        replay = authenticated_api.create_order(payload, "stable-order-key")
        first_body = first.json()
        replay_body = replay.json()
        test_log.values(
            observed_first_status=first.status,
            observed_replay_status=replay.status,
            observed_first_id=first_body["data"]["id"],
            observed_replay_id=replay_body["data"]["id"],
            replay_created=replay_body["created"],
        )
        assert first.status == 201
        assert replay.status == 200
        assert first_body["data"]["id"] == replay_body["data"]["id"]
        assert replay_body["created"] is False

    with test_log.step("Confirm that history contains one persisted order"):
        history = authenticated_api.orders().json()
        test_log.values(observed_count=history["count"], observed_orders=history["data"])
        assert history["count"] == 1
