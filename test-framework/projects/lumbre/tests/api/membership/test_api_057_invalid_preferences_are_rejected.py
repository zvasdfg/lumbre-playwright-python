from typing import Any

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.membership_preferences import membership_preference_payload


@pytest.mark.api
@pytest.mark.parametrize(
    ("field", "invalid_value"),
    [
        pytest.param("defaultGuests", 1, id="too-few-guests"),
        pytest.param("preferredFuel", "gas", id="unsupported-fuel"),
        pytest.param("unexpected", True, id="unknown-field"),
    ],
)
@pytest.mark.case(
    "API-057",
    "Invalid membership preferences are rejected without persistence",
)
def test_invalid_preferences_are_rejected(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
    field: str,
    invalid_value: Any,
) -> None:
    with test_log.step("Submit one invalid membership preference payload"):
        response = authenticated_api.update_membership_preferences(
            membership_preference_payload(**{field: invalid_value}),
        )
        test_log.values(
            submitted_field=field,
            submitted_value=invalid_value,
            observed_status=response.status,
            observed_error=response.json()["error"],
        )
        assert response.status == 422

    with test_log.step("Validate that defaults and consent history remain untouched"):
        preferences = authenticated_api.membership_preferences().json()
        assert preferences["data"]["configured"] is False
        assert preferences["consentHistory"] == []
