import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.fire_presets import fire_preset_payload


@pytest.mark.api
@pytest.mark.case(
    "API-048",
    "A normalized duplicate preset name updates the existing account record",
)
def test_duplicate_name_updates_preset(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Create the original named preset"):
        original = authenticated_api.save_fire_preset(
            fire_preset_payload("Domingo con viento", guests=6),
        )
        assert original.status == 201
        original_id = original.json()["data"]["id"]

    with test_log.step("Save the same normalized name with a changed configuration"):
        updated = authenticated_api.save_fire_preset(
            fire_preset_payload("  DOMINGO   CON VIENTO  ", guests=12, weather="frio"),
        )
        payload = updated.json()
        test_log.values(
            original_id=original_id,
            updated_id=payload["data"]["id"],
            observed_created=payload["created"],
            observed_configuration=payload["data"]["configuration"],
        )
        assert updated.status == 200
        assert payload["created"] is False
        assert payload["data"]["id"] == original_id
        assert payload["data"]["configuration"]["guests"] == 12

    with test_log.step("Validate that updating did not create a duplicate"):
        collection = authenticated_api.fire_presets().json()
        test_log.values(observed_count=collection["count"], expected_count=1)
        assert collection["count"] == 1
