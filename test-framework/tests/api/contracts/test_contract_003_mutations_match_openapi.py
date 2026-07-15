from typing import Any

import pytest
from playwright.sync_api import APIResponse

from framework.api.lumbre_api import LumbreApi
from framework.contracts import OpenApiContract
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.contract
@pytest.mark.parametrize(
    ("operation_kind", "path", "payload"),
    [
        (
            "product",
            "/api/products",
            {"name": "Parrilla contractual", "category": "herramientas", "price": 750},
        ),
        (
            "membership",
            "/api/members",
            {
                "name": "Ana Contrato",
                "email": "ana.contrato@example.test",
                "experience": "intermedio",
                "terms": "accepted",
            },
        ),
        (
            "hypothesis",
            "/api/hipotesis",
            {
                "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
                "objective": "Costra para res",
            },
        ),
    ],
)
@pytest.mark.case(
    "CONTRACT-003",
    "Mutation requests and successful responses satisfy the same OpenAPI operation contract",
)
def test_mutation_request_and_response_match_openapi(
    api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
    operation_kind: str,
    path: str,
    payload: dict[str, Any],
) -> None:
    with test_log.step("Validate the request before sending it"):
        openapi_contract.validate_request(path, "post", payload)
        test_log.values(
            operation=f"POST {path}",
            operation_kind=operation_kind,
            validated_request_fields=sorted(payload),
        )

    with test_log.step("Execute the documented mutation"):
        operations: dict[str, Any] = {
            "product": api.create_product,
            "membership": api.create_member,
            "hypothesis": api.create_hypothesis,
        }
        response: APIResponse = operations[operation_kind](payload)
        response_payload = response.json()
        test_log.values(
            observed_status=response.status,
            declared_statuses=openapi_contract.response_statuses(path, "post"),
            observed_response_fields=sorted(response_payload),
        )

    with test_log.step("Validate the live response against its status schema"):
        openapi_contract.validate_response(path, "post", response.status, response_payload)
