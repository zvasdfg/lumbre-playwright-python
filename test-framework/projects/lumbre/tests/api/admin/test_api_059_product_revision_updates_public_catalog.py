import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-059",
    "An administrator updates a product revision and commerce reads the new server price",
)
def test_product_revision_updates_public_catalog(
    administrator_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read the administrative product and capture its current revision"):
        response = administrator_api.admin_products()
        product = next(item for item in response.json()["data"] if item["id"] == 111)
        test_log.values(
            product_id=product["id"],
            old_price=product["price"],
            revision=product["revision"],
        )
        openapi_contract.validate_response(
            "/api/admin/products", "get", response.status, response.json()
        )

    with test_log.step("Update the price using optimistic concurrency"):
        payload = {"expectedRevision": product["revision"], "price": 275}
        openapi_contract.validate_request("/api/admin/products/{id}", "patch", payload)
        updated_response = administrator_api.update_product(product["id"], payload)
        updated = updated_response.json()["data"]
        test_log.values(observed_price=updated["price"], observed_revision=updated["revision"])
        assert updated_response.status == 200
        assert updated["price"] == 275
        assert updated["revision"] == product["revision"] + 1
        openapi_contract.validate_response(
            "/api/admin/products/{id}", "patch", updated_response.status, updated_response.json()
        )

    with test_log.step("Verify that public catalog and cart pricing use the persisted value"):
        public_product = next(
            item for item in administrator_api.products()["data"] if item["id"] == product["id"]
        )
        cart_response = administrator_api.add_cart_item({"productId": product["id"], "quantity": 2})
        cart_item = cart_response.json()["data"]["items"][0]
        test_log.values(public_price=public_product["price"], cart_item=cart_item)
        assert public_product["price"] == 275
        assert cart_item["unitPrice"] == 275
        assert cart_item["lineTotal"] == 550

    with test_log.step("Verify that the administrative change produced an audit event"):
        audit_response = administrator_api.administrative_audit_events()
        audit = audit_response.json()["data"][0]
        test_log.values(audit_action=audit["action"], before=audit["before"], after=audit["after"])
        assert audit["resourceType"] == "product"
        assert audit["resourceId"] == str(product["id"])
        assert audit["before"]["price"] == product["price"]
        assert audit["after"]["price"] == 275
        openapi_contract.validate_response(
            "/api/admin/audit-events", "get", audit_response.status, audit_response.json()
        )
