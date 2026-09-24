import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.membership_preferences import membership_preference_payload


def sign_in(api: LumbreApi, *, name: str, email: str) -> None:
    assert api.request_magic_link({"name": name, "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200


@pytest.mark.api
@pytest.mark.case("API-056", "Membership preferences are isolated by authenticated account")
def test_preferences_are_isolated_by_account(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Configure preferences for the first account"):
        sign_in(api, name="Primera Cuenta", email="primera.preferencia@example.test")
        first = api.update_membership_preferences(membership_preference_payload())
        assert first.status == 201
        assert api.logout().status == 200

    with test_log.step("Open another account and read its independent defaults"):
        sign_in(api, name="Segunda Cuenta", email="segunda.preferencia@example.test")
        second = api.membership_preferences().json()
        test_log.values(
            observed_configured=second["data"]["configured"],
            observed_newsletter_consent=second["data"]["newsletterConsent"],
            observed_history=second["consentHistory"],
        )
        assert second["data"]["configured"] is False
        assert second["data"]["newsletterConsent"] is False
        assert second["consentHistory"] == []
