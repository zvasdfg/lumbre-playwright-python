import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-023",
    "The cart rejects client prices and calculates totals from the server catalog",
)
def test_cart_rejects_client_price(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Attempt to add a product with a manipulated price"):
        response = api.add_cart_item(
            {"productId": 101, "quantity": 2, "price": 1},
        )
        result = response.json()
        test_log.values(
            submitted_product_id=101,
            submitted_quantity=2,
            submitted_price=1,
            observed_status=response.status,
            observed_error=result.get("error"),
        )

    with test_log.step("Validate that the rejected request did not mutate the cart"):
        cart_after_rejection = api.cart()["data"]
        test_log.values(
            observed_cart=cart_after_rejection,
            expected_total=0,
        )

    with test_log.step("Add the product without sending a client price"):
        valid_response = api.add_cart_item({"productId": 101, "quantity": 2})
        server_cart = valid_response.json()["data"]
        item = server_cart["items"][0]
        test_log.values(
            observed_unit_price=item["unitPrice"],
            observed_line_total=item["lineTotal"],
            observed_cart_total=server_cart["total"],
            expected_unit_price=740,
            expected_total=1480,
        )

        assert response.status == 422
        assert cart_after_rejection == {"items": [], "totalQuantity": 0, "total": 0}
        assert valid_response.status == 201
        assert item["unitPrice"] == 740
        assert item["lineTotal"] == 1480
        assert server_cart["total"] == 1480
