import pytest

from framework.contracts import OpenApiContract
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.contract
@pytest.mark.smoke
@pytest.mark.case(
    "CONTRACT-001",
    "The published OpenAPI document is structurally valid and uses JSON Schema 2020-12",
)
def test_openapi_document_is_valid(
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    with test_log.step("Inspect the published API description metadata"):
        document = openapi_contract.document
        observed_operations = sum(
            method.lower() in {"get", "post", "put", "patch", "delete"}
            for path_item in document["paths"].values()
            for method in path_item
        )
        test_log.values(
            observed_openapi_version=document.get("openapi"),
            observed_schema_dialect=document.get("jsonSchemaDialect"),
            observed_path_count=len(document["paths"]),
            observed_operation_count=observed_operations,
        )

    with test_log.step("Validate the complete OpenAPI description"):
        openapi_contract.validate_document()

    with test_log.step("Validate the declared contract baseline"):
        assert document["openapi"].startswith("3.1.")
        assert document["jsonSchemaDialect"] == "https://json-schema.org/draft/2020-12/schema"
        assert observed_operations == 12
