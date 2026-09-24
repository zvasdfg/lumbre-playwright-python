import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-053",
    "A new account receives safe unconfigured cooking preferences without implied consent",
)
def test_preferences_have_safe_defaults(
    authenticated_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read preferences for an account that has never configured them"):
        response = authenticated_api.membership_preferences()
        payload = response.json()
        openapi_contract.validate_response(
            "/api/account/preferences",
            "get",
            response.status,
            payload,
        )
        test_log.values(
            observed_preferences=payload["data"],
            observed_consent_history=payload["consentHistory"],
        )
        assert response.status == 200
        assert payload["data"]["configured"] is False
        assert payload["data"]["newsletterConsent"] is False
        assert payload["data"]["updatedAt"] is None
        assert payload["consentHistory"] == []
