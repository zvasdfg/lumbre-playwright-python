import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.smoke
@pytest.mark.case("API-001", "The service publishes a valid health status")
def test_health_endpoint(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request the service health status"):
        response = api.health()
        test_log.values(
            observed_status=response["status"],
            expected_status="ok",
            observed_service=response["service"],
            expected_service="lumbre-api",
        )

    with test_log.step("Validate the service status and identity"):
        assert response["status"] == "ok"
        assert response["service"] == "lumbre-api"
