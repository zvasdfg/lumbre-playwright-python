import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-064",
    "A rejected local payment preserves product inventory",
)
def test_rejected_payment_preserves_inventory(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    product_id = 112
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
        "inventory-rejected-order",
    ).json()["data"]

    with test_log.step("Submit a deterministic rejected payment"):
        response = administrator_api.pay_order(
            order["id"],
            "rejection",
            "inventory-rejected-payment",
        )
        test_log.values(
            observed_status=response.status,
            observed_outcome=response.json()["outcome"],
            observed_order_status=response.json()["data"]["status"],
        )
        assert response.status == 402
        assert response.json()["outcome"] == "rejected"

    with test_log.step("Validate that no inventory was consumed"):
        updated = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )
        test_log.values(
            initial_stock=initial_stock,
            observed_stock=updated["stock"],
        )
        assert updated["stock"] == initial_stock
