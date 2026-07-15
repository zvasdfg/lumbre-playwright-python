import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case("API-016", "An unknown ingredient id returns a stable not-found contract")
def test_unknown_ingredient_returns_not_found(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request an unknown ingredient"):
        ingredient_id = "ingrediente_inexistente"
        response = api.ingredient(ingredient_id)
        result = response.json()
        test_log.values(
            requested_ingredient_id=ingredient_id,
            observed_status=response.status,
            expected_status=404,
            observed_error=result.get("error"),
        )

    with test_log.step("Validate the not-found response"):
        assert response.status == 404
        assert ingredient_id in result["error"]
