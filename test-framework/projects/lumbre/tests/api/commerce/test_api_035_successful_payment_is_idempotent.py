import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-035", "An approved idempotent payment clears the cart once")
def test_successful_payment_is_idempotent(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    authenticated_api.add_cart_item({"productId": 111, "quantity": 3})
    order = authenticated_api.create_order(
        {"customerName": "Cliente Fixture", "customerEmail": "fixture.customer@example.test"},
        "approved-order",
    ).json()["data"]

    with test_log.step("Approve the payment and replay the same payment key"):
        first = authenticated_api.pay_order(order["id"], "success", "stable-payment-key")
        replay = authenticated_api.pay_order(order["id"], "success", "stable-payment-key")
        first_body = first.json()
        replay_body = replay.json()
        openapi_contract.validate_response(
            "/api/orders/{id}/payment", "post", first.status, first_body
        )
        test_log.values(
            observed_first_payment_id=first_body["paymentId"],
            observed_replay_payment_id=replay_body["paymentId"],
            observed_order_status=replay_body["data"]["status"],
            replay_created=replay_body["created"],
        )
        assert first.status == 200
        assert replay.status == 200
        assert replay_body["paymentId"] == first_body["paymentId"]
        assert replay_body["created"] is False
        assert replay_body["data"]["status"] == "paid"

    with test_log.step("Confirm the cart cleared and history retained the paid snapshot"):
        cart = authenticated_api.cart()["data"]
        history = authenticated_api.orders().json()
        test_log.values(observed_cart=cart, observed_history=history)
        assert cart == {"items": [], "totalQuantity": 0, "total": 0}
        assert history["count"] == 1
        assert history["data"][0]["status"] == "paid"
        assert history["data"][0]["total"] == 780
