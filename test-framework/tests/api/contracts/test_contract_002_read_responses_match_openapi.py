from typing import Any

import pytest

from framework.api.lumbre_api import LumbreApi
from framework.contracts import OpenApiContract
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.contract
@pytest.mark.parametrize(
    ("resource_kind", "path"),
    [
        ("api_index", "/api"),
        ("health", "/api/health"),
        ("recipes", "/api/recipes"),
        ("products", "/api/products"),
        ("events", "/api/events"),
        ("ingredients", "/api/ingredientes"),
        ("ingredient", "/api/ingredientes"),
        ("hypotheses", "/api/hipotesis"),
        ("hypothesis", "/api/hipotesis/{id}"),
    ],
)
@pytest.mark.case(
    "CONTRACT-002",
    "Every public read response satisfies its published OpenAPI schema",
)
def test_read_response_matches_openapi(
    api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
    resource_kind: str,
    path: str,
) -> None:
    with test_log.step(f"Request the {resource_kind} representation"):
        payloads: dict[str, Any] = {
            "api_index": api.api_index,
            "health": api.health,
            "recipes": api.recipes,
            "products": api.products,
            "events": api.events,
            "ingredients": api.ingredients,
            "ingredient": lambda: api.ingredient("sal_kosher").json(),
            "hypotheses": api.hypotheses,
            "hypothesis": lambda: api.hypothesis("LHC-003").json(),
        }
        payload = payloads[resource_kind]()
        test_log.values(
            operation=f"GET {path}",
            observed_top_level_fields=sorted(payload),
            observed_status=200,
        )

    with test_log.step("Validate the live response against the documented schema"):
        openapi_contract.validate_response(path, "get", 200, payload)
