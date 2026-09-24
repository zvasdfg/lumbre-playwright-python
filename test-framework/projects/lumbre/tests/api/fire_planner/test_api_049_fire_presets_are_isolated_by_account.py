import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.fire_presets import fire_preset_payload


def sign_in(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200


@pytest.mark.api
@pytest.mark.case(
    "API-049",
    "Fire-planner presets are visible and mutable only by their owning account",
)
def test_fire_presets_are_isolated_by_account(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Create a preset for the first account"):
        sign_in(api, name="Primera Cuenta", email="primer.fuego@example.test")
        created = api.save_fire_preset(fire_preset_payload("Fuego privado"))
        assert created.status == 201
        preset_id = created.json()["data"]["id"]
        assert api.logout().status == 200

    with test_log.step("Open a second account and inspect its own collection"):
        sign_in(api, name="Segunda Cuenta", email="segundo.fuego@example.test")
        collection = api.fire_presets().json()
        test_log.values(observed_second_account_presets=collection["data"], expected_count=0)
        assert collection["count"] == 0

    with test_log.step("Prevent the second account from deleting the first account preset"):
        deletion = api.delete_fire_preset(preset_id)
        test_log.values(
            foreign_preset_id=preset_id,
            observed_status=deletion.status,
            observed_error=deletion.json()["error"],
            expected_status=404,
        )
        assert deletion.status == 404
