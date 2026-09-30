from copy import deepcopy

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.parametrize(
    "invalid_field", ["missing_details", "unknown_ingredient", "duplicate_ingredient"]
)
@pytest.mark.case("API-082", "Incomplete or invalid blend declarations cannot enter the catalog")
def test_blend_catalog_rejects_invalid_declarations(
    administrator_api: LumbreApi,
    test_log: TestLogger,
    invalid_field: str,
) -> None:
    api = administrator_api
    with test_log.step("Prepare an invalid declaration from a known valid product"):
        before = api.admin_products().json()["data"]
        details = deepcopy(next(item for item in before if item["id"] == 121)["details"])
        details["productCode"] = "LMB-F-082"
        payload = {
            "name": "Declaración inválida",
            "category": "blends",
            "price": 99,
            "details": details,
        }
        if invalid_field == "missing_details":
            del payload["details"]
        elif invalid_field == "unknown_ingredient":
            details["components"][0]["id"] = "unknown_ingredient"
        else:
            details["components"][1] = deepcopy(details["components"][0])

    with test_log.step("Reject the input without creating a store or laboratory record"):
        response = api.create_product(payload)
        test_log.values(
            invalid_field=invalid_field, observed_status=response.status, error=response.json()
        )
        assert response.status == 422
        assert len(api.admin_products().json()["data"]) == len(before)
        assert "LMB-F-082" not in [item["id"] for item in api.hypotheses()["data"]]
