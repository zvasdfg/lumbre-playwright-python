import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-031", "Order resources reject anonymous access")
def test_order_requires_authentication(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Attempt to create and list orders without an account session"):
        creation = api.create_order(
            {"customerName": "Cliente Anónimo", "customerEmail": "anon@example.test"},
            "anonymous-order",
        )
        history = api.orders()
        test_log.values(
            observed_creation_status=creation.status,
            observed_history_status=history.status,
            expected_status=401,
        )
        assert creation.status == 401
        assert history.status == 401
