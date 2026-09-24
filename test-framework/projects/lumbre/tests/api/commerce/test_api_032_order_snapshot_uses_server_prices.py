import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-032", "An order snapshots catalog prices and rejects client totals")
def test_order_snapshot_uses_server_prices(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    with test_log.step("Add a catalog product with a known server price"):
        cart_response = authenticated_api.add_cart_item({"productId": 111, "quantity": 2})
        cart = cart_response.json()["data"]
        test_log.values(observed_cart=cart, expected_total=520)
        assert cart_response.status == 201
        assert cart["total"] == 520

    with test_log.step("Reject a checkout payload that attempts to provide its own total"):
        manipulated = authenticated_api.create_order(
            {
                "customerName": "Cliente Fixture",
                "customerEmail": "fixture.customer@example.test",
                "total": 1,
            },
            "manipulated-total",
        )
        test_log.values(observed_status=manipulated.status, expected_status=422)
        assert manipulated.status == 422

    with test_log.step("Create an immutable snapshot from the server-owned cart"):
        response = authenticated_api.create_order(
            {
                "customerName": "Cliente Fixture",
                "customerEmail": "fixture.customer@example.test",
            },
            "server-priced-order",
        )
        order = response.json()["data"]
        openapi_contract.validate_response("/api/orders", "post", response.status, response.json())
        test_log.values(
            observed_status=response.status,
            observed_total=order["total"],
            observed_items=order["items"],
            expected_total=520,
        )
        assert response.status == 201
        assert order["total"] == 520
        assert order["items"][0]["unitPrice"] == 260
        assert order["items"][0]["lineTotal"] == 520
