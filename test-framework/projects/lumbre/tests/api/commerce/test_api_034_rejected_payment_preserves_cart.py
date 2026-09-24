import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-034", "A rejected payment fails the order and preserves its cart")
def test_rejected_payment_preserves_cart(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 113, "quantity": 1})
    order = authenticated_api.create_order(
        {"customerName": "Cliente Fixture", "customerEmail": "fixture.customer@example.test"},
        "rejected-order",
    ).json()["data"]

    with test_log.step("Run the deterministic rejection scenario"):
        response = authenticated_api.pay_order(order["id"], "rejection", "rejected-payment")
        result = response.json()
        openapi_contract.validate_response(
            "/api/orders/{id}/payment", "post", response.status, result
        )
        test_log.values(
            observed_status=response.status,
            observed_outcome=result["outcome"],
            observed_order_status=result["data"]["status"],
        )
        assert response.status == 402
        assert result["outcome"] == "rejected"
        assert result["data"]["status"] == "failed"

    with test_log.step("Confirm the server retained the authenticated cart"):
        cart = authenticated_api.cart()["data"]
        test_log.values(observed_cart=cart, expected_quantity=1)
        assert cart["totalQuantity"] == 1
        assert cart["items"][0]["productId"] == 113
