import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.membership_preferences import membership_preference_payload


@pytest.mark.api
@pytest.mark.case(
    "API-055",
    "Consent history records initial choice and later changes without duplicate events",
)
def test_consent_history_records_only_changes(
    authenticated_api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Save an initial explicit opt-out"):
        initial = authenticated_api.update_membership_preferences(
            membership_preference_payload(newsletterConsent=False),
        ).json()
        assert initial["consentRecorded"] is True
        assert len(initial["consentHistory"]) == 1

    with test_log.step("Update cooking preferences without changing consent"):
        unchanged = authenticated_api.update_membership_preferences(
            membership_preference_payload(defaultGuests=14, newsletterConsent=False),
        ).json()
        test_log.values(
            observed_consent_recorded=unchanged["consentRecorded"],
            observed_history_count=len(unchanged["consentHistory"]),
        )
        assert unchanged["consentRecorded"] is False
        assert len(unchanged["consentHistory"]) == 1

    with test_log.step("Opt in and validate a second immutable consent event"):
        changed = authenticated_api.update_membership_preferences(
            membership_preference_payload(defaultGuests=14, newsletterConsent=True),
        ).json()
        observed_choices = [event["granted"] for event in changed["consentHistory"]]
        test_log.values(
            observed_consent_recorded=changed["consentRecorded"],
            observed_consent_choices=observed_choices,
        )
        assert changed["consentRecorded"] is True
        assert observed_choices == [True, False]
