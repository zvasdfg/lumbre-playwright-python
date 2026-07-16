import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-012",
    "Repeating the Classic SPG formula increments its persisted counter",
)
def test_classic_spg_duplicate_increments_counter(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    hypothesis_id = "LHC-003"

    with test_log.step("Read the current Classic SPG repetition counter"):
        initial_response = api.hypothesis(hypothesis_id)
        initial_spg = initial_response.json()["data"]
        initial_count = initial_spg.get("contador_repeticiones", 0)

        test_log.values(
            hypothesis_id=hypothesis_id,
            observed_initial_count=initial_count,
        )

    with test_log.step("Submit the Classic SPG formula again"):
        payload = {
            "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
            "objective": "Costra para res",
        }
        response = api.create_hypothesis(payload)
        result = response.json()

        test_log.values(
            submitted_formula="Classic SPG",
            submitted_ingredients=payload["ingredient_ids"],
            observed_status=response.status,
            observed_duplicate=result["duplicate"],
            observed_duplicate_count=result["duplicate_count"],
            expected_duplicate_count=initial_count + 1,
        )

    with test_log.step("Read the formula again from the registry"):
        persisted_response = api.hypothesis(hypothesis_id)
        persisted_spg = persisted_response.json()["data"]
        persisted_count = persisted_spg["contador_repeticiones"]

        test_log.values(
            observed_persisted_count=persisted_count,
            expected_persisted_count=initial_count + 1,
        )

    with test_log.step("Validate the duplicate counter increment and persistence"):
        assert response.status == 200
        assert result["created"] is False
        assert result["duplicate"] is True
        assert result["data"]["id"] == hypothesis_id
        assert result["duplicate_count"] == initial_count + 1
        assert result["data"]["contador_repeticiones"] == initial_count + 1
        assert initial_response.status == 200
        assert persisted_response.status == 200
        assert persisted_count == initial_count + 1
