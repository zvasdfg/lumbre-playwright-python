import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.stripe_events import stripe_event, stripe_signature


@pytest.mark.api
@pytest.mark.case(
    "API-039", "A repeated provider event is acknowledged without a second transition"
)
def test_provider_event_is_deduplicated(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 113, "quantity": 1})
    order = authenticated_api.create_order(
        {"customerName": "Cliente Fixture", "customerEmail": "fixture.customer@example.test"},
        "deduplicated-event-order",
    ).json()["data"]
    checkout = authenticated_api.create_checkout_session(
        order["id"], "deduplicated-event-session"
    ).json()["data"]
    raw_event = stripe_event(
        event_id="evt_lumbre_duplicate_001",
        event_type="checkout.session.completed",
        session_id=checkout["providerSessionId"],
        order_id=order["id"],
        amount_total=order["total"] * 100,
        payment_status="paid",
    )
    signature = stripe_signature(raw_event)

    with test_log.step("Deliver the identical signed provider event twice"):
        first = authenticated_api.stripe_webhook(raw_event, signature)
        duplicate = authenticated_api.stripe_webhook(raw_event, signature)
        test_log.values(
            observed_first=first.json(),
            observed_duplicate=duplicate.json(),
        )
        assert first.status == 200
        assert duplicate.status == 200
        assert first.json()["duplicate"] is False
        assert duplicate.json()["duplicate"] is True
        assert duplicate.json()["eventId"] == first.json()["eventId"]
