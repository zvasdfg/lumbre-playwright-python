import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-007",
    "The ingredient catalog combines family and text filters",
)
def test_ingredients_filter_combines_family_and_query(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Request a chile ingredient by family and search text"):
        requested_family = "Chile"
        requested_query = "morita"
        result = api.ingredients(family=requested_family, query=requested_query)

        test_log.values(
            requested_family=requested_family,
            requested_query=requested_query,
            observed_count=result["count"],
            catalog_total=result["total"],
        )

    with test_log.step("Validate the filtered catalog result"):
        observed_ingredients = result["data"]
        observed_ids = [ingredient["id"] for ingredient in observed_ingredients]
        observed_families = sorted({ingredient["familia"] for ingredient in observed_ingredients})

        test_log.values(
            observed_ids=observed_ids,
            expected_ids=["chile_morita"],
            observed_families=observed_families,
            expected_families=[requested_family],
            family_is_advertised=requested_family in result["families"],
        )

        assert result["count"] == 1
        assert observed_ids == ["chile_morita"]
        assert observed_families == [requested_family]
        assert requested_family in result["families"]
