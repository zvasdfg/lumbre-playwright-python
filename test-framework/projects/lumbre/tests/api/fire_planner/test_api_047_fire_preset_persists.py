import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.fire_presets import fire_preset_payload


@pytest.mark.api
@pytest.mark.case("API-047", "An authenticated account can persist and list a fire preset")
def test_fire_preset_persists(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    preset = fire_preset_payload("Domingo con viento")

    with test_log.step("Save a named fire-planner configuration"):
        response = authenticated_api.save_fire_preset(preset)
        payload = response.json()
        openapi_contract.validate_response("/api/fire-presets", "post", response.status, payload)
        test_log.values(
            observed_status=response.status,
            observed_preset=payload["data"],
            observed_created=payload["created"],
        )
        assert response.status == 201
        assert payload["created"] is True
        assert payload["data"]["name"] == preset["name"]
        assert payload["data"]["configuration"] == preset["configuration"]

    with test_log.step("Read the account-owned preset collection"):
        response = authenticated_api.fire_presets()
        collection = response.json()
        openapi_contract.validate_response("/api/fire-presets", "get", response.status, collection)
        test_log.values(observed_count=collection["count"], observed_presets=collection["data"])
        assert collection["count"] == 1
        assert collection["data"][0]["id"] == payload["data"]["id"]
