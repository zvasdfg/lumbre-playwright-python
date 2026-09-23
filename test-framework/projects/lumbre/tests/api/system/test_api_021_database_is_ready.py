import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.smoke
@pytest.mark.case("API-021", "The service reports a ready and correctly seeded database")
def test_database_is_ready(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request the service and database health status"):
        response = api.health()
        database = response["database"]
        test_log.values(
            observed_service_status=response["status"],
            observed_database_status=database["status"],
            observed_provider=database["provider"],
            observed_database_seed=database["seedVersion"],
            expected_database_seed=response["seedVersion"],
        )

    with test_log.step("Validate the database readiness contract"):
        assert response["status"] == "ok"
        assert database["status"] == "ready"
        assert database["provider"] == "cloudflare-d1"
        assert database["seedVersion"] == response["seedVersion"]
