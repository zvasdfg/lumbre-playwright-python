import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-069",
    "A paid order cannot be cancelled or restore sold inventory without a refund",
)
def test_paid_order_cannot_be_cancelled(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    product_id = 113
    product = next(
        item for item in administrator_api.admin_products().json()["data"]
        if item["id"] == product_id
    )
    administrator_api.update_product(
        product_id,
        {"expectedRevision": product["revision"], "stock": 3},
    )
    administrator_api.add_cart_item({"productId": product_id, "quantity": 1})
    order = administrator_api.create_order(
        {
            "customerName": "Administración Lumbre",
            "customerEmail": "admin@lumbre.example.test",
        },
        "paid-cancellation-order",
    ).json()["data"]
    assert administrator_api.pay_order(
        order["id"],
        "success",
        "paid-cancellation-payment",
    ).status == 200

    with test_log.step("Attempt to cancel an already paid order"):
        response = administrator_api.cancel_order(order["id"], "paid-cancellation")
        test_log.values(
            observed_status=response.status,
            observed_error=response.json()["error"],
            expected_status=409,
        )
        assert response.status == 409
        assert "refund" in response.json()["error"].lower()

    with test_log.step("Validate that sold inventory remains consumed"):
        persisted = administrator_api.order(order["id"]).json()["data"]
        stock = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )["stock"]
        test_log.values(observed_order_status=persisted["status"], observed_stock=stock)
        assert persisted["status"] == "paid"
        assert stock == 2
