from copy import deepcopy

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-083", "Private product drafts publish once and preserve their public archive"
)
def test_product_draft_publication_lifecycle(
    administrator_api: LumbreApi, test_log: TestLogger
) -> None:
    api = administrator_api
    with test_log.step("Save a private draft even when active is requested"):
        template = next(p for p in api.admin_products().json()["data"] if p["id"] == 121)
        details = deepcopy(template["details"])
        details.update(productCode="LMB-F-083", publicationStatus="draft")
        response = api.create_product(
            {
                "name": "Borrador privado",
                "category": "blends",
                "price": 99,
                "stock": 2,
                "active": True,
                "details": details,
            }
        )
        assert response.status == 201
        draft = response.json()["data"]
        assert draft["active"] is False
        assert all(p["id"] != draft["id"] for p in api.products()["data"])
        assert all(p["id"] != "LMB-F-083" for p in api.hypotheses()["data"])
        activation = api.update_product(
            draft["id"], {"expectedRevision": draft["revision"], "active": True}
        )
        assert activation.status == 200
        draft = activation.json()["data"]
        assert draft["active"] is False
        test_log.values(product_id=draft["id"], draft_active=draft["active"])

    with test_log.step("Publish the same record to store and public laboratory"):
        details["publicationStatus"] = "published"
        response = api.update_product(
            draft["id"], {"expectedRevision": draft["revision"], "active": True, "details": details}
        )
        assert response.status == 200
        published = response.json()["data"]
        assert any(p["id"] == draft["id"] for p in api.products()["data"])
        assert len([p for p in api.hypotheses()["data"] if p["id"] == "LMB-F-083"]) == 1
        test_log.values(
            publication=published["details"]["publicationStatus"], revision=published["revision"]
        )

    with test_log.step("Reject returning to draft and archive without deleting the public sheet"):
        details["publicationStatus"] = "draft"
        rejected = api.update_product(
            draft["id"], {"expectedRevision": published["revision"], "details": details}
        )
        assert rejected.status == 422
        archived = api.update_product(
            draft["id"], {"expectedRevision": published["revision"], "active": False}
        )
        assert archived.status == 200
        assert all(p["id"] != draft["id"] for p in api.products()["data"])
        sheet = next(p for p in api.hypotheses()["data"] if p["id"] == "LMB-F-083")
        assert "archivado" in sheet["hipotesis"]
        test_log.values(archive_message=sheet["hipotesis"])
