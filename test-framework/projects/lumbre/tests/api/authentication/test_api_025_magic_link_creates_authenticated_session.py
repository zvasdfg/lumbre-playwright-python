import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-025",
    "A single-use magic link creates an authenticated customer session",
)
def test_magic_link_creates_authenticated_session(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    email = "ana.fuego@example.test"

    with test_log.step("Request a passwordless account link"):
        response = api.request_magic_link({"name": "Ana Fuego", "email": email})
        test_log.values(
            submitted_name="Ana Fuego",
            submitted_email=email,
            observed_status=response.status,
            expected_status=200,
        )
        assert response.status == 200

    with test_log.step("Retrieve and follow the deterministic local delivery"):
        delivery_response = api.latest_local_magic_link(email)
        magic_link = delivery_response.json()["data"]["url"]
        verification_response = api.follow_magic_link(magic_link)
        test_log.values(
            observed_delivery_status=delivery_response.status,
            observed_verification_status=verification_response.status,
            magic_link_was_delivered=bool(magic_link),
        )
        assert delivery_response.status == 200
        assert verification_response.status == 200

    with test_log.step("Validate the authenticated customer representation"):
        account = api.account()["data"]
        test_log.values(
            observed_name=account["name"],
            observed_email=account["email"],
            observed_role=account["role"],
            expected_role="customer",
        )
        assert account["name"] == "Ana Fuego"
        assert account["email"] == email
        assert account["role"] == "customer"

    with test_log.step("Validate that the verification link cannot be reused"):
        reused_response = api.follow_magic_link(magic_link)
        token_was_rejected = "error" in reused_response.url.lower()
        test_log.values(
            observed_status=reused_response.status,
            magic_link_was_rejected=token_was_rejected,
            expected_single_use=True,
        )
        assert token_was_rejected
