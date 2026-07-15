import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.parametrize(
    ("resource_kind", "resource_id"),
    [
        pytest.param(
            "hypothesis",
            "LHC-999",
            id="hypothesis",
            marks=pytest.mark.case(
                "API-014",
                "An unknown hypothesis id returns a stable not-found contract",
            ),
        ),
        pytest.param(
            "ingredient",
            "ingrediente_inexistente",
            id="ingredient",
            marks=pytest.mark.case(
                "API-016",
                "An unknown ingredient id returns a stable not-found contract",
            ),
        ),
    ],
)
def test_unknown_resource_returns_not_found(
    api: LumbreApi,
    test_log: TestLogger,
    resource_kind: str,
    resource_id: str,
) -> None:
    with test_log.step(f"Request an unknown {resource_kind}"):
        response = (
            api.hypothesis(resource_id)
            if resource_kind == "hypothesis"
            else api.ingredient(resource_id)
        )
        result = response.json()
        test_log.values(
            requested_resource_kind=resource_kind,
            requested_resource_id=resource_id,
            observed_status=response.status,
            expected_status=404,
            observed_error=result.get("error"),
        )

    with test_log.step("Validate the not-found response"):
        assert response.status == 404
        assert resource_id in result["error"]
