import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


def sign_in(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200


@pytest.mark.api
@pytest.mark.case(
    "API-076",
    "A private blend reaches the public registry only after administrative approval",
)
def test_blend_publication_requires_review(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Create and submit an account-owned blend"):
        customer_email = "autora.blend@example.test"
        sign_in(api, name="Autora del Blend", email=customer_email)
        created = api.save_account_blend(
            {
                "title": "SPG de la casa",
                "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
                "objective": "Costra para res",
            }
        )
        assert created.status == 201
        blend_id = created.json()["data"]["id"]
        submitted = api.submit_account_blend(blend_id)
        test_log.values(
            blend_id=blend_id,
            observed_submit_status=submitted.status,
            observed_workflow_status=submitted.json()["data"]["status"],
            observed_public_count=api.hypotheses()["count"],
        )
        assert submitted.status == 200
        assert submitted.json()["data"]["status"] == "submitted"
        assert api.hypotheses()["count"] == 0
        assert api.logout().status == 200

    with test_log.step("Publish the submitted blend as an administrator"):
        sign_in(api, name="Administración Lumbre", email="admin@lumbre.example.test")
        moderation_queue = api.admin_blends().json()
        assert [item["id"] for item in moderation_queue["data"]] == [blend_id]
        approved = api.moderate_blend(
            blend_id,
            {"decision": "approve", "note": "Estructura clásica verificada."},
        )
        result = approved.json()["data"]
        test_log.values(
            observed_moderation_status=approved.status,
            observed_workflow_status=result["status"],
            published_hypothesis_id=result["publishedHypothesisId"],
        )
        assert approved.status == 200
        assert result["status"] == "published"
        assert result["publishedHypothesisId"] == "LHC-001"
        assert api.admin_blends().json()["count"] == 0
        assert api.logout().status == 200

    with test_log.step("Expose the approved sheet publicly and retain account ownership"):
        public_registry = api.hypotheses()
        sign_in(api, name="Autora del Blend", email=customer_email)
        private_registry = api.account_blends().json()
        owned = private_registry["data"][0]
        test_log.values(
            observed_public_ids=[item["id"] for item in public_registry["data"]],
            observed_owner_status=owned["status"],
            observed_owner_publication=owned["publishedHypothesisId"],
        )
        assert [item["id"] for item in public_registry["data"]] == ["LHC-001"]
        assert owned["id"] == blend_id
        assert owned["status"] == "published"
        assert owned["publishedHypothesisId"] == "LHC-001"
