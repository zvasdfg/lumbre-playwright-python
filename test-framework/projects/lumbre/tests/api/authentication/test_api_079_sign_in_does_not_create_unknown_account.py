import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-079",
    "A sign-in request for an unknown email does not create an account",
)
def test_sign_in_does_not_create_unknown_account(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    email = "desconocido@example.test"

    with test_log.step("Request sign-in for an email without an account"):
        response = api.request_magic_link({"mode": "sign-in", "email": email})
        test_log.values(
            submitted_email=email,
            observed_status=response.status,
            observed_payload=response.json(),
        )
        assert response.status == 200
        assert response.json() == {"status": True}

    with test_log.step("Validate that no access link or account was created"):
        delivery = api.latest_local_magic_link(email)
        account = api.account()["data"]
        test_log.values(
            observed_delivery_status=delivery.status,
            observed_authenticated_account=account,
        )
        assert delivery.status == 404
        assert account is None

