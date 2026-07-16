from itertools import combinations

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-013",
    "A unique ingredient formula creates and persists a new hypothesis",
)
def test_new_hypothesis_is_persisted(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Select an ingredient pair that has not been registered"):
        ingredients = api.ingredients()["data"]
        initial_registry = api.hypotheses()["data"]
        existing_signatures = {record["firma"] for record in initial_registry}
        selected_pair = next(
            pair
            for pair in combinations(ingredients, 2)
            if f"LHC:{'+'.join(sorted(item['id'] for item in pair))}" not in existing_signatures
        )
        selected_ids = [item["id"] for item in selected_pair]
        expected_signature = f"LHC:{'+'.join(sorted(selected_ids))}"
        payload = {
            "ingredient_ids": selected_ids,
            "objective": "Costra para res",
        }
        test_log.values(
            selected_ingredients=[item["nombre"] for item in selected_pair],
            expected_signature=expected_signature,
            initial_registry_count=len(initial_registry),
        )

    with test_log.step("Create the unique hypothesis"):
        response = api.create_hypothesis(payload)
        result = response.json()
        created_id = result["data"]["id"]
        test_log.values(
            observed_status=response.status,
            expected_status=201,
            observed_created=result["created"],
            observed_id=created_id,
            observed_signature=result["data"]["firma"],
        )

    with test_log.step("Read the new resource from its individual endpoint"):
        persisted_response = api.hypothesis(created_id)
        persisted = persisted_response.json()["data"]
        final_registry = api.hypotheses()["data"]
        test_log.values(
            observed_persisted_id=persisted["id"],
            observed_final_registry_count=len(final_registry),
            expected_final_registry_count=len(initial_registry) + 1,
        )

    with test_log.step("Validate creation and persistence"):
        assert response.status == 201
        assert result["created"] is True
        assert result["duplicate"] is False
        assert result["data"]["firma"] == expected_signature
        assert persisted_response.status == 200
        assert persisted["firma"] == expected_signature
        assert len(final_registry) == len(initial_registry) + 1
