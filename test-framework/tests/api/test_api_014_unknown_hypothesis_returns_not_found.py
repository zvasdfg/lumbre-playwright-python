import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case("API-014", "An unknown hypothesis id returns a stable not-found contract")
def test_unknown_hypothesis_returns_not_found(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request an unknown hypothesis"):
        hypothesis_id = "LHC-999"
        response = api.hypothesis(hypothesis_id)
        result = response.json()
        test_log.values(
            requested_hypothesis_id=hypothesis_id,
            observed_status=response.status,
            expected_status=404,
            observed_error=result.get("error"),
        )

    with test_log.step("Validate the not-found response"):
        assert response.status == 404
        assert hypothesis_id in result["error"]
