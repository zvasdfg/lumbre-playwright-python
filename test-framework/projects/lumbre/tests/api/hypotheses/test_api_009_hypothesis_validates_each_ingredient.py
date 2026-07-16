import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-009",
    "A hypothesis request reports duplicate and unknown ingredients by position",
)
def test_hypothesis_validates_each_ingredient(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Prepare a formula with duplicate and unknown ingredients"):
        payload = {
            "ingredient_ids": ["sal_kosher", "sal_kosher", "ingrediente_inexistente"],
            "objective": "Costra para res",
        }
        test_log.values(
            requested_ingredient_ids=payload["ingredient_ids"],
            requested_objective=payload["objective"],
        )

    with test_log.step("Submit the invalid formula"):
        response = api.create_hypothesis(payload)
        result = response.json()
        validations = result["validation"]["ingredients"]

        test_log.values(
            observed_status=response.status,
            expected_status=422,
            observed_validation=validations,
        )

    with test_log.step("Validate the element-level diagnostics"):
        assert response.status == 422
        assert result["validation"]["valid"] is False
        assert validations[0]["valid"] is True
        assert validations[1]["position"] == 1
        assert "is duplicated in this formula" in validations[1]["errors"]
        assert validations[2]["position"] == 2
        assert "does not exist in the catalog" in validations[2]["errors"]
