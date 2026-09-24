import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-036", "Hosted checkout creation is authenticated and idempotent")
def test_hosted_checkout_is_idempotent(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 111, "quantity": 1})
    order = authenticated_api.create_order(
        {"customerName": "Cliente Fixture", "customerEmail": "fixture.customer@example.test"},
        "hosted-checkout-order",
    ).json()["data"]

    with test_log.step("Create and replay one hosted Checkout Session"):
        first = authenticated_api.create_checkout_session(order["id"], "hosted-session-key")
        replay = authenticated_api.create_checkout_session(order["id"], "hosted-session-key")
        first_body = first.json()
        replay_body = replay.json()
        test_log.values(
            observed_first_status=first.status,
            observed_replay_status=replay.status,
            observed_provider_session=first_body["data"]["providerSessionId"],
            replay_created=replay_body["created"],
        )
        assert first.status == 201
        assert replay.status == 200
        assert first_body["data"] == replay_body["data"]
        assert replay_body["created"] is False

    with test_log.step("Validate that Lumbre exposes only a hosted redirect reference"):
        checkout = first_body["data"]
        serialized = str(checkout).lower()
        test_log.values(observed_checkout=checkout, card_data_present="card" in serialized)
        assert checkout["provider"] == "stripe"
        assert checkout["providerSessionId"].startswith("cs_test_")
        assert checkout["checkoutUrl"].startswith("http://localhost:3100/")
        assert "card" not in serialized
