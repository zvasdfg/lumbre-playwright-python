from copy import deepcopy

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-080", "One persisted blend supplies both the store and public laboratory")
def test_catalog_blend_populates_public_lab(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    api = administrator_api
    with test_log.step("Create a complete blend using one catalog request"):
        template = next(item for item in api.admin_products().json()["data"] if item["id"] == 121)
        details = deepcopy(template["details"])
        details["productCode"] = "LMB-F-080"
        payload = {
            "name": "Sazonador de prueba",
            "category": "blends",
            "price": 99,
            "stock": 0,
            "active": True,
            "details": details,
        }
        created = api.create_product(payload)
        assert created.status == 201
        product = created.json()["data"]
        test_log.values(product_id=product["id"], product_code=details["productCode"])

    with test_log.step("Verify identical public declarations and unavailable zero inventory"):
        public = next(item for item in api.products()["data"] if item["id"] == product["id"])
        sheet = next(
            item for item in api.hypotheses()["data"] if item["id"] == details["productCode"]
        )
        test_log.values(store_product=public, laboratory_components=sheet["componentes"])
        assert public["price"] == 99
        assert public["purchaseEnabled"] is False
        assert sheet["componentes"] == details["components"]
        assert sheet["producto"]["nombre"] == public["name"]
        assert api.create_product(payload).status == 409

    with test_log.step("Update persisted inventory and name without rebuilding the portal"):
        response = api.update_product(
            product["id"],
            {
                "expectedRevision": product["revision"],
                "name": "Sazonador actualizado",
                "stock": 3,
            },
        )
        assert response.status == 200
        public = next(item for item in api.products()["data"] if item["id"] == product["id"])
        sheet = next(
            item for item in api.hypotheses()["data"] if item["id"] == details["productCode"]
        )
        test_log.values(
            stock=public["stock"], store_name=public["name"], lab_name=sheet["producto"]["nombre"]
        )
        assert public["purchaseEnabled"] is True
        assert public["stock"] == 3
        assert sheet["producto"]["nombre"] == public["name"] == "Sazonador actualizado"
