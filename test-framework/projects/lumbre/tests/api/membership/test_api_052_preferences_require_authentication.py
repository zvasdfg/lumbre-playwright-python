import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.membership_preferences import membership_preference_payload


@pytest.mark.api
@pytest.mark.case("API-052", "Membership preference resources reject anonymous access")
def test_preferences_require_authentication(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Attempt to read and update preferences without an account session"):
        read_response = api.membership_preferences()
        update_response = api.update_membership_preferences(membership_preference_payload())
        test_log.values(
            observed_read_status=read_response.status,
            observed_update_status=update_response.status,
            expected_status=401,
        )
        assert read_response.status == 401
        assert update_response.status == 401
