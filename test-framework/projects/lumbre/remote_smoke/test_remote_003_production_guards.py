import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.smoke
@pytest.mark.remote_smoke
@pytest.mark.case(
    "REMOTE-003",
    "The deployed target hides test hooks and limits enabled production writes",
)
def test_deployed_production_guards(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Probe operations that must remain unavailable in production"):
        account_payload = api.account()
        responses = {
            "test_reset": api.reset_demo_data_response(),
            "account_magic_link": api.request_magic_link(
                {"name": "Remote smoke", "email": "remote-smoke@example.invalid"}
            ),
            "membership_write": api.create_member({}),
            "hypothesis_write": api.create_hypothesis({}),
            "commerce_read": api.orders(),
            "stripe_webhook": api.stripe_webhook("{}"),
        }
        observed_statuses = {
            name: response.status
            for name, response in responses.items()
        }
        test_log.values(observed_statuses=observed_statuses)

    with test_log.step("Validate the protected production boundary"):
        assert account_payload["capabilities"] == {"authentication": True}
        assert observed_statuses == {
            "test_reset": 404,
            "account_magic_link": 200,
            "membership_write": 405,
            "hypothesis_write": 405,
            "commerce_read": 503,
            "stripe_webhook": 404,
        }
