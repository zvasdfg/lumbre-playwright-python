import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-070",
    "Order fulfillment transitions reject a customer account",
)
def test_fulfillment_requires_admin_role(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 111, "quantity": 1})
    order = authenticated_api.create_order(
        {
            "customerName": "Cliente Fixture",
            "customerEmail": "fixture.customer@example.test",
        },
        "customer-fulfillment-order",
    ).json()["data"]
    assert authenticated_api.pay_order(
        order["id"],
        "success",
        "customer-fulfillment-payment",
    ).status == 200

    with test_log.step("Attempt an administrative fulfillment transition as a customer"):
        response = authenticated_api.update_order_fulfillment(order["id"], "processing")
        persisted = authenticated_api.order(order["id"]).json()["data"]
        test_log.values(
            observed_status=response.status,
            observed_error=response.json()["error"],
            observed_fulfillment_status=persisted["fulfillmentStatus"],
        )
        assert response.status == 403
        assert persisted["fulfillmentStatus"] == "unfulfilled"
