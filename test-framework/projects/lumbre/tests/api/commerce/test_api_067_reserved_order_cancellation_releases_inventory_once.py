import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.parametrize("starting_state", ["reserved", "failed"])
@pytest.mark.case(
    "API-067",
    "Cancelling an eligible order restores reserved inventory at most once",
)
def test_reserved_order_cancellation_releases_inventory_once(
    administrator_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
    starting_state: str,
) -> None:
    product_id = 111
    product = next(
        item for item in administrator_api.admin_products().json()["data"]
        if item["id"] == product_id
    )
    administrator_api.update_product(
        product_id,
        {"expectedRevision": product["revision"], "stock": 4},
    )
    administrator_api.add_cart_item({"productId": product_id, "quantity": 2})
    order = administrator_api.create_order(
        {
            "customerName": "Administración Lumbre",
            "customerEmail": "admin@lumbre.example.test",
        },
        "cancel-reserved-order",
    ).json()["data"]
    if starting_state == "reserved":
        administrator_api.create_checkout_session(order["id"], "cancel-reserved-session")
    else:
        rejected = administrator_api.pay_order(
            order["id"],
            "rejection",
            "cancel-rejected-payment",
        )
        assert rejected.status == 402

    with test_log.step("Cancel and replay the eligible order cancellation"):
        first = administrator_api.cancel_order(order["id"], "cancel-reserved-key")
        replay = administrator_api.cancel_order(order["id"], "cancel-reserved-key")
        first_body = first.json()
        replay_body = replay.json()
        test_log.values(
            first_status=first.status,
            first_created=first_body["created"],
            replay_created=replay_body["created"],
            observed_order_status=replay_body["data"]["status"],
            observed_fulfillment_status=replay_body["data"]["fulfillmentStatus"],
            starting_state=starting_state,
        )
        assert first.status == 200
        assert first_body["created"] is True
        assert replay_body["created"] is False
        assert replay_body["data"]["status"] == "cancelled"
        assert replay_body["data"]["fulfillmentStatus"] == "cancelled"
        openapi_contract.validate_response(
            "/api/orders/{id}/cancel",
            "post",
            first.status,
            first_body,
        )

    with test_log.step("Validate that inventory returned to its original quantity"):
        restored = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )
        test_log.values(
            initial_stock=4,
            order_quantity=2,
            starting_state=starting_state,
            observed_stock=restored["stock"],
        )
        assert restored["stock"] == 4
