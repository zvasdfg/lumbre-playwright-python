import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-015",
    "Malformed hypothesis JSON is rejected without mutating the registry",
)
def test_malformed_hypothesis_does_not_mutate_registry(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read the registry before the malformed request"):
        initial_registry = api.hypotheses()["data"]
        malformed_body = '{"ingredient_ids": ["sal_kosher"],'
        test_log.values(
            initial_registry_count=len(initial_registry),
            submitted_body=malformed_body,
        )

    with test_log.step("Submit malformed JSON"):
        response = api.create_hypothesis_raw(malformed_body)
        result = response.json()
        test_log.values(
            observed_status=response.status,
            expected_status=400,
            observed_error=result.get("error"),
        )

    with test_log.step("Validate rejection without persistence"):
        final_registry = api.hypotheses()["data"]
        test_log.values(
            observed_final_registry_count=len(final_registry),
            expected_final_registry_count=len(initial_registry),
        )
        assert response.status == 400
        assert result["error"] == "A valid JSON body is required"
        assert len(final_registry) == len(initial_registry)
