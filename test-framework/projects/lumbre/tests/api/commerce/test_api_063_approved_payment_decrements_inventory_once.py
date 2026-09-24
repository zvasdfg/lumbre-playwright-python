import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-063",
    "An approved idempotent payment decrements product inventory exactly once",
)
def test_approved_payment_decrements_inventory_once(
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
        "inventory-approved-order",
    ).json()["data"]

    with test_log.step("Approve and replay the same inventory-backed payment"):
        first = administrator_api.pay_order(order["id"], "success", "inventory-payment-key")
        replay = administrator_api.pay_order(order["id"], "success", "inventory-payment-key")
        test_log.values(
            first_status=first.status,
            replay_status=replay.status,
            first_payment_id=first.json()["paymentId"],
            replay_payment_id=replay.json()["paymentId"],
        )
        assert first.status == 200
        assert replay.status == 200
        assert replay.json()["created"] is False
        assert replay.json()["paymentId"] == first.json()["paymentId"]

    with test_log.step("Validate that inventory was decremented only once"):
        updated = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )
        test_log.values(
            initial_stock=initial_stock,
            purchased_quantity=2,
            observed_stock=updated["stock"],
            expected_stock=3,
        )
        assert updated["stock"] == 3
