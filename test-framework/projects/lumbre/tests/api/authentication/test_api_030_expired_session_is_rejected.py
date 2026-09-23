import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-030",
    "An expired authenticated session no longer resolves an account",
)
def test_expired_session_is_rejected(api: LumbreApi, test_log: TestLogger) -> None:
    email = "sesion.vencida@example.test"

    with test_log.step("Create an authenticated customer session"):
        assert api.request_magic_link({"name": "Sesión Breve", "email": email}).status == 200
        magic_link = api.latest_local_magic_link(email).json()["data"]["url"]
        assert api.follow_magic_link(magic_link).status == 200
        account = api.account()["data"]
        test_log.values(
            observed_email=account["email"],
            observed_role=account["role"],
        )

    with test_log.step("Expire the persisted session through the test-only seam"):
        expiration_response = api.expire_session()
        test_log.values(
            observed_status=expiration_response.status,
            observed_expired=expiration_response.json()["expired"],
            expected_status=200,
        )
        assert expiration_response.status == 200

    with test_log.step("Validate that the expired cookie no longer authenticates"):
        observed_account = api.account()["data"]
        test_log.values(
            observed_account=observed_account,
            expected_authenticated=False,
        )
        assert observed_account is None
