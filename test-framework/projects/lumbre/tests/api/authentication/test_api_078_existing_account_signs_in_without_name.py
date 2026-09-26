import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-078",
    "An existing account requests a sign-in link without submitting a name",
)
def test_existing_account_signs_in_without_name(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    email = "regreso.lumbre@example.test"
    name = "Regreso Lumbre"

    with test_log.step("Create the account through the explicit sign-up flow"):
        sign_up = api.request_magic_link(
            {"mode": "sign-up", "name": name, "email": email}
        )
        first_delivery = api.latest_local_magic_link(email)
        first_link = first_delivery.json()["data"]["url"]
        verification = api.follow_magic_link(first_link)
        original_account = api.account()["data"]
        test_log.values(
            observed_sign_up_status=sign_up.status,
            observed_verification_status=verification.status,
            observed_account_id=original_account["id"],
        )
        assert sign_up.status == 200
        assert verification.status == 200

    with test_log.step("Close the session and request sign-in using only the email"):
        assert api.logout().status == 200
        sign_in = api.request_magic_link({"mode": "sign-in", "email": email})
        second_delivery = api.latest_local_magic_link(email)
        second_link = second_delivery.json()["data"]["url"]
        test_log.values(
            submitted_fields=["email", "mode"],
            observed_sign_in_status=sign_in.status,
            observed_new_link=second_link != first_link,
        )
        assert sign_in.status == 200
        assert second_link != first_link

    with test_log.step("Validate that sign-in restores the original account"):
        assert api.follow_magic_link(second_link).status == 200
        restored_account = api.account()["data"]
        test_log.values(
            observed_account_id=restored_account["id"],
            observed_name=restored_account["name"],
            expected_account_id=original_account["id"],
        )
        assert restored_account["id"] == original_account["id"]
        assert restored_account["name"] == name

