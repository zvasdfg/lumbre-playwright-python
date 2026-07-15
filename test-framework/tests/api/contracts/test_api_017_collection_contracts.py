import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.parametrize(
    ("resource_kind", "required_fields", "positive_field"),
    [
        pytest.param(
            "products",
            {"id", "name", "category", "price"},
            "price",
            id="products",
            marks=pytest.mark.case(
                "API-017",
                "The product collection publishes a consistent count and contract",
            ),
        ),
        pytest.param(
            "events",
            {"id", "day", "month", "city", "title", "detail", "spots"},
            "spots",
            id="events",
            marks=pytest.mark.case(
                "API-019",
                "The event collection publishes a consistent count and contract",
            ),
        ),
    ],
)
def test_collection_contract(
    api: LumbreApi,
    test_log: TestLogger,
    resource_kind: str,
    required_fields: set[str],
    positive_field: str,
) -> None:
    with test_log.step(f"Request the {resource_kind} collection"):
        result = api.products() if resource_kind == "products" else api.events()
        resources = result["data"]
        test_log.values(
            requested_resource_kind=resource_kind,
            observed_count=result["count"],
            observed_names=[
                resource["name" if resource_kind == "products" else "title"]
                for resource in resources
            ],
        )

    with test_log.step("Validate the collection contract"):
        observed_fields = [set(resource) for resource in resources]
        test_log.values(
            expected_count=len(resources),
            required_fields=sorted(required_fields),
            observed_fields=[sorted(fields) for fields in observed_fields],
            positive_field=positive_field,
        )
        assert result["count"] == len(resources)
        assert resources
        assert all(required_fields <= fields for fields in observed_fields)
        assert all(resource[positive_field] > 0 for resource in resources)
