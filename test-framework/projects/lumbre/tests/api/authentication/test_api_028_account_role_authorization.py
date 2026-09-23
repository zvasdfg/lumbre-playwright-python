import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


def authenticate(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200


@pytest.mark.api
@pytest.mark.case(
    "API-028",
    "Administrative account data is protected by authenticated role authorization",
)
def test_account_role_authorization(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Validate that anonymous access is rejected"):
        anonymous_response = api.admin_accounts()
        test_log.values(
            observed_status=anonymous_response.status,
            observed_error=anonymous_response.json()["error"],
            expected_status=401,
        )
        assert anonymous_response.status == 401

    with test_log.step("Validate that an authenticated customer remains forbidden"):
        authenticate(
            api,
            name="Cliente Brasa",
            email="cliente.autorizacion@example.test",
        )
        customer_response = api.admin_accounts()
        test_log.values(
            observed_role=api.account()["data"]["role"],
            observed_status=customer_response.status,
            observed_error=customer_response.json()["error"],
            expected_status=403,
        )
        assert customer_response.status == 403

    with test_log.step("Validate that the seeded test administrator is authorized"):
        assert api.logout().status == 200
        authenticate(
            api,
            name="Administración Lumbre",
            email="admin@lumbre.example.test",
        )
        admin_response = api.admin_accounts()
        payload = admin_response.json()
        test_log.values(
            observed_role=api.account()["data"]["role"],
            observed_status=admin_response.status,
            observed_account_count=payload["count"],
            returned_fields=sorted(payload["data"][0]),
        )
        assert admin_response.status == 200
        assert payload["count"] == 2
        assert {account["role"] for account in payload["data"]} == {"admin", "customer"}
