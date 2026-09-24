import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-060",
    "A stale product revision is rejected without overwriting the accepted administrator change",
)
def test_stale_product_revision_is_rejected(
    administrator_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Capture one product revision as two hypothetical editor sessions"):
        product = administrator_api.admin_products().json()["data"][0]
        shared_revision = product["revision"]
        test_log.values(product_id=product["id"], shared_revision=shared_revision)

    with test_log.step("Save the first editor's change"):
        accepted = administrator_api.update_product(
            product["id"], {"expectedRevision": shared_revision, "badge": "Edición vigente"}
        )
        assert accepted.status == 200
        test_log.values(accepted_revision=accepted.json()["data"]["revision"])

    with test_log.step("Submit the second editor's stale revision"):
        rejected = administrator_api.update_product(
            product["id"], {"expectedRevision": shared_revision, "badge": "Cambio obsoleto"}
        )
        test_log.values(
            observed_status=rejected.status,
            observed_error=rejected.json()["error"],
            expected_status=409,
        )
        assert rejected.status == 409

    with test_log.step("Confirm that the accepted value and audit history remain authoritative"):
        persisted = next(
            item
            for item in administrator_api.admin_products().json()["data"]
            if item["id"] == product["id"]
        )
        audit = administrator_api.administrative_audit_events().json()
        test_log.values(persisted_badge=persisted["badge"], audit_count=audit["count"])
        assert persisted["badge"] == "Edición vigente"
        assert audit["count"] == 1
