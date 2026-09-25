import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-011",
    "A new laboratory starts with an empty hypothesis registry",
)
def test_hypothesis_registry_starts_empty(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Request the hypothesis registry for a new scenario"):
        result = api.hypotheses()
        records = result["data"]
        test_log.values(
            observed_count=result["count"],
            observed_records=records,
            expected_count=0,
        )

    with test_log.step("Validate that only user-created combinations will appear"):
        assert result["count"] == 0
        assert records == []
