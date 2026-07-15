import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case("API-017", "The product collection publishes a consistent count and contract")
def test_products_collection_contract(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request the product collection"):
        result = api.products()
        products = result["data"]
        test_log.values(
            observed_count=result["count"],
            observed_product_names=[product["name"] for product in products],
        )

    with test_log.step("Validate the collection contract"):
        required_fields = {"id", "name", "category", "price"}
        observed_fields = [set(product) for product in products]
        test_log.values(
            expected_count=len(products),
            required_fields=sorted(required_fields),
            observed_fields=[sorted(fields) for fields in observed_fields],
        )
        assert result["count"] == len(products)
        assert products
        assert all(required_fields <= fields for fields in observed_fields)
        assert all(product["price"] > 0 for product in products)
