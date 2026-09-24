import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.membership_preferences import membership_preference_payload


@pytest.mark.api
@pytest.mark.case(
    "API-054",
    "Account cooking preferences persist with an explicit consent audit event",
)
def test_preferences_persist_with_consent(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    preferences = membership_preference_payload()

    with test_log.step("Validate and save the account preference contract"):
        openapi_contract.validate_request("/api/account/preferences", "put", preferences)
        response = authenticated_api.update_membership_preferences(preferences)
        payload = response.json()
        openapi_contract.validate_response(
            "/api/account/preferences",
            "put",
            response.status,
            payload,
        )
        test_log.values(
            observed_status=response.status,
            observed_preferences=payload["data"],
            observed_consent_event=payload["consentHistory"][0],
        )
        assert response.status == 201
        assert payload["created"] is True
        assert payload["consentRecorded"] is True
        for field, expected in preferences.items():
            assert payload["data"][field] == expected
        assert payload["consentHistory"][0]["granted"] is True

    with test_log.step("Read the preferences from their account-owned resource"):
        persisted = authenticated_api.membership_preferences().json()
        test_log.values(observed_persisted_preferences=persisted["data"])
        for field, expected in preferences.items():
            assert persisted["data"][field] == expected
        assert persisted["data"]["configured"] is True
