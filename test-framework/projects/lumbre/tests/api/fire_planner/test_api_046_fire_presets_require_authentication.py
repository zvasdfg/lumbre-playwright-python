import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.fire_presets import fire_preset_payload


@pytest.mark.api
@pytest.mark.case("API-046", "Fire-planner preset resources reject anonymous access")
def test_fire_presets_require_authentication(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Attempt every preset operation without an account session"):
        responses = {
            "list": api.fire_presets(),
            "save": api.save_fire_preset(fire_preset_payload()),
            "sync": api.sync_fire_presets([fire_preset_payload()]),
            "delete": api.delete_fire_preset("00000000-0000-4000-8000-000000000000"),
        }
        observed_statuses = {name: response.status for name, response in responses.items()}
        test_log.values(observed_statuses=observed_statuses, expected_status=401)
        assert set(observed_statuses.values()) == {401}
