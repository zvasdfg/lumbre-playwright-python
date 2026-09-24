import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.stripe_events import stripe_event, stripe_signature


@pytest.mark.api
@pytest.mark.case(
    "API-066",
    "An expired hosted checkout releases its reserved inventory",
)
def test_expired_checkout_releases_inventory(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    product_id = 111
    initial_stock = 5
    product = next(
        item for item in administrator_api.admin_products().json()["data"]
        if item["id"] == product_id
    )
    administrator_api.update_product(
        product_id,
        {"expectedRevision": product["revision"], "stock": initial_stock},
    )
    administrator_api.add_cart_item({"productId": product_id, "quantity": 2})
    order = administrator_api.create_order(
        {"customerName": "Administración Lumbre", "customerEmail": "admin@lumbre.example.test"},
        "hosted-inventory-order",
    ).json()["data"]

    with test_log.step("Create a hosted checkout that reserves inventory"):
        checkout = administrator_api.create_checkout_session(
            order["id"],
            "hosted-inventory-session",
        ).json()["data"]
        reserved = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )
        test_log.values(
            provider_session=checkout["providerSessionId"],
            initial_stock=initial_stock,
            observed_reserved_stock=reserved["stock"],
        )
        assert reserved["stock"] == 3

    with test_log.step("Deliver a signed checkout expiration event"):
        raw_event = stripe_event(
            event_id="evt_lumbre_inventory_expired",
            event_type="checkout.session.expired",
            session_id=checkout["providerSessionId"],
            order_id=order["id"],
            amount_total=order["total"] * 100,
            payment_status="unpaid",
        )
        response = administrator_api.stripe_webhook(
            raw_event,
            stripe_signature(raw_event),
        )
        test_log.values(observed_status=response.status, observed_result=response.json())
        assert response.status == 200
        assert response.json()["status"] == "failed"

    with test_log.step("Validate that all reserved units were restored"):
        restored = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )
        test_log.values(
            observed_restored_stock=restored["stock"],
            expected_stock=initial_stock,
        )
        assert restored["stock"] == initial_stock
