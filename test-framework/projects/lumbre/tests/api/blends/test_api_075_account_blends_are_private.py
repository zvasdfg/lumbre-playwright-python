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
    "API-075",
    "Saved blends remain private to their authenticated owner",
)
def test_account_blends_are_private(api: LumbreApi, test_log: TestLogger) -> None:
    blend = {
        "title": "Corteza privada",
        "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
        "objective": "Costra para res",
    }

    with test_log.step("Reject blend access without an authenticated account"):
        anonymous_read = api.account_blends()
        anonymous_write = api.save_account_blend(blend)
        test_log.values(
            observed_read_status=anonymous_read.status,
            observed_write_status=anonymous_write.status,
            expected_status=401,
        )
        assert anonymous_read.status == 401
        assert anonymous_write.status == 401

    with test_log.step("Save a private blend for the first account"):
        sign_in(api, name="Primera Mezcladora", email="primera.mezcla@example.test")
        created = api.save_account_blend(blend)
        payload = created.json()
        blend_id = payload["data"]["id"]
        test_log.values(
            observed_status=created.status,
            saved_blend_id=blend_id,
            observed_blend_status=payload["data"]["status"],
        )
        assert created.status == 201
        assert payload["data"]["status"] == "draft"
        assert api.hypotheses()["count"] == 0
        assert api.logout().status == 200

    with test_log.step("Keep the blend out of a second account collection"):
        sign_in(api, name="Segunda Mezcladora", email="segunda.mezcla@example.test")
        second_collection = api.account_blends().json()
        test_log.values(
            observed_second_account_blends=second_collection["data"],
            expected_count=0,
        )
        assert second_collection["count"] == 0
        assert api.archive_account_blend(blend_id).status == 404
