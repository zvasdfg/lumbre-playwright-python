import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case(
    "API-008",
    "An ingredient detail exposes usable research and experiment data",
)
def test_ingredient_detail_exposes_research_data(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Request a documented ingredient by id"):
        requested_id = "ajo_granulado"
        response = api.ingredient(requested_id)
        response_body = response.json()

        test_log.values(
            requested_id=requested_id,
            observed_status=response.status,
            expected_status=200,
        )

    with test_log.step("Inspect the ingredient research fields"):
        ingredient = response_body["data"]
        populated_sensory_values = [
            value for value in ingredient["perfil_sensorial"].values() if value is not None
        ]
        proposed_experiments = ingredient["experimentos"]

        test_log.values(
            observed_name=ingredient["nombre"],
            observed_family=ingredient["familia"],
            sensory_attributes=len(populated_sensory_values),
            bibliography_entries=len(ingredient["bibliografia"]),
            proposed_experiments=len(proposed_experiments),
        )

    with test_log.step("Validate that the detail can support an experiment"):
        assert response.status == 200
        assert ingredient["id"] == requested_id
        assert ingredient["familia"] == "Allium"
        assert ingredient["descripcion"]
        assert len(populated_sensory_values) == 10
        assert ingredient["dosificacion"]["recomendado"] == "3 g/kg"
        assert len(ingredient["bibliografia"]) >= 2
        assert proposed_experiments
        assert proposed_experiments[0]["metodo"]
        assert proposed_experiments[0]["metricas"]
