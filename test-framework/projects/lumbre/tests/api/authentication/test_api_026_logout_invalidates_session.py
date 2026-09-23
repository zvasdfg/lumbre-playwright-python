import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-026",
    "Logout invalidates an authenticated session without deleting the account",
)
def test_logout_invalidates_session(api: LumbreApi, test_log: TestLogger) -> None:
    email = "salida@example.test"

    with test_log.step("Authenticate through a local magic-link delivery"):
        assert api.request_magic_link({"name": "Luz Brasa", "email": email}).status == 200
        delivery = api.latest_local_magic_link(email)
        magic_link = delivery.json()["data"]["url"]
        assert api.follow_magic_link(magic_link).status == 200
        authenticated_account = api.account()["data"]
        test_log.values(
            observed_authenticated_email=authenticated_account["email"],
            observed_authenticated_role=authenticated_account["role"],
        )

    with test_log.step("Close the authenticated session"):
        logout_response = api.logout()
        test_log.values(
            observed_logout_status=logout_response.status,
            expected_logout_status=200,
        )
        assert logout_response.status == 200

    with test_log.step("Validate that the same client is now anonymous"):
        observed_account = api.account()["data"]
        test_log.values(
            observed_account=observed_account,
            expected_authenticated=False,
        )
        assert observed_account is None
