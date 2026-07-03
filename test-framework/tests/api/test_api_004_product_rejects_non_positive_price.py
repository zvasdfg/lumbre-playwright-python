import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case("API-004", "The API rejects products with a non-positive price")
def test_product_rejects_non_positive_price(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Prepare a product with price=0"):
        payload = {
            "name": "Test grill",
            "category": "tools",
            "price": 0,
        }
        test_log.values(product_name=payload["name"], requested_price=payload["price"])

    with test_log.step("Send the invalid product to the API"):
        response = api.create_product(payload)
        error = response.json()["error"]
        test_log.values(
            observed_status=response.status,
            expected_status=422,
            observed_error=error,
        )

    with test_log.step("Validate the rejection and error message"):
        assert response.status == 422
        assert error == "name, category and a positive price are required"
