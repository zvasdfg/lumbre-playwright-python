from typing import Any

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.fire_presets import fire_preset_payload


@pytest.mark.api
@pytest.mark.parametrize(
    ("field", "invalid_value"),
    [
        pytest.param("guests", 1, id="too-few-guests"),
        pytest.param("durationHours", 3, id="unsupported-duration"),
        pytest.param("servingTime", "25:90", id="invalid-serving-time"),
    ],
)
@pytest.mark.case(
    "API-051",
    "Invalid fire-planner configurations are rejected without persistence",
)
def test_invalid_fire_preset_is_rejected(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
    field: str,
    invalid_value: Any,
) -> None:
    with test_log.step("Submit one invalid fire-planner configuration"):
        response = authenticated_api.save_fire_preset(
            fire_preset_payload(**{field: invalid_value}),
        )
        test_log.values(
            submitted_field=field,
            submitted_value=invalid_value,
            observed_status=response.status,
            observed_error=response.json()["error"],
            expected_status=422,
        )
        assert response.status == 422

    with test_log.step("Validate that the rejected preset was not persisted"):
        collection = authenticated_api.fire_presets().json()
        test_log.values(observed_preset_count=collection["count"], expected_count=0)
        assert collection["count"] == 0
