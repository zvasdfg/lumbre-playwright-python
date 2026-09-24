import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.fire_presets import fire_preset_payload


@pytest.mark.api
@pytest.mark.case(
    "API-050",
    "Local preset sync imports missing names while preserving server-owned conflicts",
)
def test_local_preset_sync_merges_safely(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    with test_log.step("Create the server-authoritative preset"):
        server = fire_preset_payload("Plan compartido", guests=10, weather="frio")
        response = authenticated_api.save_fire_preset(server)
        assert response.status == 201

    with test_log.step("Sync one conflicting and one missing browser-local preset"):
        conflicting = fire_preset_payload("  PLAN COMPARTIDO ", guests=2, weather="templado")
        missing = fire_preset_payload("Plan importado", guests=14, fuelType="lena")
        response = authenticated_api.sync_fire_presets([conflicting, missing])
        payload = response.json()
        openapi_contract.validate_response(
            "/api/fire-presets/sync",
            "post",
            response.status,
            payload,
        )
        test_log.values(
            observed_imported=payload["imported"],
            observed_skipped=payload["skipped"],
            observed_presets=payload["data"],
        )
        assert response.status == 200
        assert payload["imported"] == 1
        assert payload["skipped"] == 1
        assert payload["count"] == 2

    with test_log.step("Validate that the server version won the name conflict"):
        shared = next(preset for preset in payload["data"] if preset["name"] == "Plan compartido")
        imported = next(preset for preset in payload["data"] if preset["name"] == "Plan importado")
        test_log.values(
            observed_server_configuration=shared["configuration"],
            observed_imported_configuration=imported["configuration"],
        )
        assert shared["configuration"] == server["configuration"]
        assert imported["configuration"] == missing["configuration"]
