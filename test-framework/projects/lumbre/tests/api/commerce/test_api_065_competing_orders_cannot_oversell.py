import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-065",
    "Competing orders cannot sell more units than the available inventory",
)
def test_competing_orders_cannot_oversell(
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
        {"expectedRevision": product["revision"], "stock": 1},
    )
    administrator_api.add_cart_item({"productId": product_id, "quantity": 1})
    order_payload = {
        "customerName": "Administración Lumbre",
        "customerEmail": "admin@lumbre.example.test",
    }
    first_order = administrator_api.create_order(
        order_payload,
        "competing-order-one",
    ).json()["data"]
    second_order = administrator_api.create_order(
        order_payload,
        "competing-order-two",
    ).json()["data"]

    with test_log.step("Pay the first order for the final available unit"):
        accepted = administrator_api.pay_order(
            first_order["id"],
            "success",
            "competing-payment-one",
        )
        test_log.values(
            accepted_order=first_order["id"],
            accepted_status=accepted.status,
        )
        assert accepted.status == 200

    with test_log.step("Attempt to pay the competing order snapshot"):
        rejected = administrator_api.pay_order(
            second_order["id"],
            "success",
            "competing-payment-two",
        )
        test_log.values(
            rejected_order=second_order["id"],
            observed_status=rejected.status,
            observed_error=rejected.json()["error"],
        )
        assert rejected.status == 409
        assert "inventory" in rejected.json()["error"].lower()

    with test_log.step("Validate the inventory boundary remains at zero"):
        updated = next(
            item for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product_id
        )
        test_log.values(observed_stock=updated["stock"], expected_stock=0)
        assert updated["stock"] == 0
