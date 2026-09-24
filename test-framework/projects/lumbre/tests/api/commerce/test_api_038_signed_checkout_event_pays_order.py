import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.stripe_events import stripe_event, stripe_signature


@pytest.mark.api
@pytest.mark.case("API-038", "A signed paid Checkout event completes the order and clears its cart")
def test_signed_checkout_event_pays_order(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 112, "quantity": 2})
    order = authenticated_api.create_order(
        {"customerName": "Cliente Fixture", "customerEmail": "fixture.customer@example.test"},
        "webhook-paid-order",
    ).json()["data"]
    checkout = authenticated_api.create_checkout_session(
        order["id"], "webhook-paid-session"
    ).json()["data"]
    raw_event = stripe_event(
        event_id="evt_lumbre_paid_001",
        event_type="checkout.session.completed",
        session_id=checkout["providerSessionId"],
        order_id=order["id"],
        amount_total=order["total"] * 100,
        payment_status="paid",
    )

    with test_log.step("Deliver a valid signed Stripe Checkout event"):
        response = authenticated_api.stripe_webhook(raw_event, stripe_signature(raw_event))
        result = response.json()
        test_log.values(observed_status=response.status, observed_result=result)
        assert response.status == 200
        assert result["received"] is True
        assert result["duplicate"] is False
        assert result["status"] == "paid"

    with test_log.step("Validate persisted payment state and cart fulfillment"):
        persisted_order = authenticated_api.order(order["id"]).json()["data"]
        cart = authenticated_api.cart()["data"]
        test_log.values(observed_order=persisted_order, observed_cart=cart)
        assert persisted_order["status"] == "paid"
        assert persisted_order["paidAt"] is not None
        assert cart == {"items": [], "totalQuantity": 0, "total": 0}
