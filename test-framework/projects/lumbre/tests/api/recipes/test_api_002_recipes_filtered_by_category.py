import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-002", "The API filters recipes by the requested category")
def test_recipes_can_be_filtered_by_category(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request recipes from the vegetales category"):
        response = api.recipes(category="vegetales")

    with test_log.step("Extract categories from the returned recipes"):
        categories = {recipe["category"] for recipe in response["data"]}
        test_log.values(
            requested_category="vegetales",
            observed_count=response["count"],
            expected_count=2,
            observed_categories=sorted(categories),
            expected_categories=["vegetales"],
        )

    with test_log.step("Validate the count and category of every result"):
        assert response["count"] == 2
        assert categories == {"vegetales"}
