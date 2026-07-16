import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-010",
    "A registered hypothesis is reused regardless of ingredient order",
)
def test_hypothesis_deduplicates_ingredient_order(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Prepare an existing SPG formula in a different order"):
        payload = {
            "ingredient_ids": ["ajo_granulado", "sal_kosher", "pimienta_negra"],
            "objective": "Costra para res",
        }
        expected_signature = "LHC:ajo_granulado+pimienta_negra+sal_kosher"

        test_log.values(
            requested_ingredient_ids=payload["ingredient_ids"],
            expected_hypothesis_id="LHC-003",
            expected_signature=expected_signature,
        )

    with test_log.step("Submit the reordered formula"):
        response = api.create_hypothesis(payload)
        result = response.json()

        test_log.values(
            observed_status=response.status,
            observed_created=result["created"],
            observed_duplicate=result["duplicate"],
            observed_id=result["data"]["id"],
            observed_signature=result["data"]["firma"],
        )

    with test_log.step("Validate that no second hypothesis was created"):
        assert response.status == 200
        assert result["created"] is False
        assert result["duplicate"] is True
        assert result["data"]["id"] == "LHC-003"
        assert result["data"]["firma"] == expected_signature
        assert result["validation"]["valid"] is True
