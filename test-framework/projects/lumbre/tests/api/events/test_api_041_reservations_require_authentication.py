import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-041", "Event reservation resources reject anonymous access")
def test_reservations_require_authentication(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Attempt to create and list reservations without an account session"):
        creation = api.create_event_reservation(201, 1)
        history = api.reservations()
        test_log.values(
            observed_creation_status=creation.status,
            observed_history_status=history.status,
            expected_status=401,
        )
        assert creation.status == 401
        assert history.status == 401
