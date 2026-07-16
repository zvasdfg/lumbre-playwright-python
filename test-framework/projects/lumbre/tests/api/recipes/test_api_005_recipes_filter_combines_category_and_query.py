import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-005",
    "The API combines category and text when filtering recipes",
)
def test_recipes_filter_combines_category_and_query(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Request recipes using a category and search text"):
        category = "vegetales"
        query = "duraznos"
        response = api.recipes(
            category=category,
            query=query,
        )
        test_log.values(requested_category=category, requested_query=query)

    with test_log.step("Extract the title of the first recipe"):
        recipe_title = response["data"][0]["title"]
        test_log.values(
            observed_count=response["count"],
            expected_count=1,
            observed_title=recipe_title,
            expected_title="Duraznos, miel y romero",
        )

    with test_log.step("Validate the result count and title"):
        assert response["count"] == 1, (
            f"Expected 1 recipe, but the API returned {response['count']}"
        )

        assert recipe_title == "Duraznos, miel y romero"
