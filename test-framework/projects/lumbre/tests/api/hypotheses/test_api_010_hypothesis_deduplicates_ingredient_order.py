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
    with test_log.step("Register the first SPG formula"):
        original_payload = {
            "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
            "objective": "Costra para res",
        }
        original_response = api.create_hypothesis(original_payload)
        original = original_response.json()
        assert original_response.status == 201
        assert original["data"]["id"] == "LHC-001"
        test_log.values(
            observed_status=original_response.status,
            observed_hypothesis_id=original["data"]["id"],
        )

    with test_log.step("Prepare the same SPG formula in a different order"):
        reordered_payload = {
            "ingredient_ids": ["ajo_granulado", "sal_kosher", "pimienta_negra"],
            "objective": "Costra para res",
        }
        expected_signature = "LHC:ajo_granulado+pimienta_negra+sal_kosher"

        test_log.values(
            requested_ingredient_ids=reordered_payload["ingredient_ids"],
            expected_hypothesis_id="LHC-001",
            expected_signature=expected_signature,
        )

    with test_log.step("Submit the reordered formula"):
        response = api.create_hypothesis(reordered_payload)
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
        assert result["data"]["id"] == "LHC-001"
        assert result["data"]["firma"] == expected_signature
        assert result["validation"]["valid"] is True
