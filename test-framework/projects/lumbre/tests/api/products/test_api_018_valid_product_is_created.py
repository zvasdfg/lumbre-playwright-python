import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-018", "A valid product payload returns its created representation")
def test_valid_product_is_created(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Prepare a valid product payload"):
        payload = {
            "name": "Cepillo de brasas",
            "category": "herramientas",
            "price": 450,
        }
        test_log.values(submitted_product=payload)

    with test_log.step("Create the product"):
        response = api.create_product(payload)
        result = response.json()
        test_log.values(
            observed_status=response.status,
            expected_status=201,
            observed_created=result["created"],
            observed_product=result["data"],
        )

    with test_log.step("Validate the created representation"):
        assert response.status == 201
        assert result["created"] is True
        assert result["data"]["id"] == 1000
        assert {key: result["data"][key] for key in payload} == payload
