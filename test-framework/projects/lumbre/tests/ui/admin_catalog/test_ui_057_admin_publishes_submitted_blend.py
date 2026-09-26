import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


def sign_in(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200


@pytest.mark.ui
@pytest.mark.case(
    "UI-057",
    "An administrator reviews a submitted blend before it reaches the public laboratory",
)
def test_admin_publishes_submitted_blend(
    administrator_home: HomePage,
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Prepare a customer blend awaiting editorial review"):
        sign_in(api, name="Autora UI", email="autora.ui@example.test")
        created = api.save_account_blend(
            {
                "title": "SPG editorial",
                "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
                "objective": "Costra para res",
            }
        )
        blend_id = created.json()["data"]["id"]
        submitted = api.submit_account_blend(blend_id)
        assert submitted.status == 200
        assert api.logout().status == 200
        test_log.values(
            submitted_blend_id=blend_id,
            submitted_title="SPG editorial",
            observed_status=submitted.json()["data"]["status"],
        )

    with test_log.step("Approve the blend from the administrative review queue"):
        administrator_home.open_admin_catalog()
        admin = administrator_home.admin_catalog
        expect(admin.blend(blend_id)).to_be_visible()
        admin.approve_blend(blend_id, "Estructura clásica confirmada.")
        expect(admin.message).to_have_text("Blend publicado.")
        expect(admin.blend(blend_id)).to_have_count(0)
        published = api.hypotheses()["data"]
        assert len(published) == 1
        published_hypothesis = published[0]
        test_log.values(
            observed_admin_message=admin.message.inner_text(),
            observed_pending_blend_count=admin.blend(blend_id).count(),
            published_hypothesis_id=published_hypothesis["id"],
        )
        assert published_hypothesis["id"] == "LHC-001"

    with test_log.step("Read the approved technical sheet from the public laboratory"):
        admin.close()
        administrator_home.open()
        public_sheet = administrator_home.ingredient_lab.hypothesis_card("LHC-001")
        expect(public_sheet).to_be_visible()
        expect(public_sheet).to_contain_text("Costra para res")
        test_log.values(
            observed_public_sheet=public_sheet.inner_text(),
            expected_public_hypothesis_id="LHC-001",
        )
