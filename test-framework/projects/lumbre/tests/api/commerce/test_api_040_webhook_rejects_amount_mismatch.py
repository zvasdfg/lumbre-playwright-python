import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.stripe_events import stripe_event, stripe_signature


@pytest.mark.api
@pytest.mark.case(
    "API-040", "A signed provider event cannot change an order with a mismatched amount"
)
def test_webhook_rejects_amount_mismatch(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 111, "quantity": 1})
    order = authenticated_api.create_order(
        {"customerName": "Cliente Fixture", "customerEmail": "fixture.customer@example.test"},
        "amount-mismatch-order",
    ).json()["data"]
    checkout = authenticated_api.create_checkout_session(
        order["id"], "amount-mismatch-session"
    ).json()["data"]
    raw_event = stripe_event(
        event_id="evt_lumbre_mismatch_001",
        event_type="checkout.session.completed",
        session_id=checkout["providerSessionId"],
        order_id=order["id"],
        amount_total=100,
        payment_status="paid",
    )

    with test_log.step("Deliver a valid signature containing an invalid provider amount"):
        response = authenticated_api.stripe_webhook(raw_event, stripe_signature(raw_event))
        persisted_order = authenticated_api.order(order["id"]).json()["data"]
        cart = authenticated_api.cart()["data"]
        test_log.values(
            observed_status=response.status,
            observed_error=response.json(),
            observed_order_status=persisted_order["status"],
            observed_cart=cart,
        )
        assert response.status == 422
        assert persisted_order["status"] == "pending"
        assert cart["totalQuantity"] == 1
