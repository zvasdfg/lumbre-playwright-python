import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-081", "Archiving a blend preserves cart access and its public reference")
def test_archived_product_preserves_cart_access(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    api = administrator_api
    with test_log.step("Add a blend before archiving it"):
        assert api.add_cart_item({"productId": 121, "quantity": 1}).status == 201
        product = next(item for item in api.admin_products().json()["data"] if item["id"] == 121)
        response = api.update_product(
            121, {"expectedRevision": product["revision"], "active": False}
        )
        assert response.status == 200

    with test_log.step("Read the cart without offering the retired product for purchase"):
        cart = api.cart()["data"]
        test_log.values(cart=cart)
        assert cart == {"items": [], "totalQuantity": 0, "total": 0}
        assert 121 not in [item["id"] for item in api.products()["data"]]
        assert api.add_cart_item({"productId": 121, "quantity": 1}).status == 404

    with test_log.step("Retain the public technical sheet with its archive notice"):
        sheet = next(item for item in api.hypotheses()["data"] if item["id"] == "LMB-F-001")
        test_log.values(public_record_id=sheet["id"], notice=sheet["hipotesis"])
        assert "Producto archivado" in sheet["hipotesis"]
