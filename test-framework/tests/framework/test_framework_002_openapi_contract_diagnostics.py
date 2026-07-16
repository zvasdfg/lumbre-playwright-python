import pytest

from automation.core.contracts import ContractViolation, OpenApiContract

pytestmark = [
    pytest.mark.framework_unit,
    pytest.mark.case(
        "FRAMEWORK-002",
        "The reusable OpenAPI adapter validates payloads and reports actionable violations",
    ),
]


@pytest.fixture
def contract() -> OpenApiContract:
    return OpenApiContract(
        {
            "paths": {
                "/widgets": {
                    "post": {
                        "requestBody": {
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": ["name"],
                                        "properties": {"name": {"type": "string"}},
                                        "additionalProperties": False,
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "required": ["data"],
                                            "properties": {
                                                "data": {
                                                    "type": "object",
                                                    "required": ["id"],
                                                    "properties": {"id": {"type": "integer"}},
                                                }
                                            },
                                        }
                                    }
                                }
                            }
                        },
                    }
                }
            }
        }
    )


def test_contract_accepts_documented_request_and_response(contract: OpenApiContract) -> None:
    contract.validate_request("/widgets", "post", {"name": "Forja"})
    contract.validate_response("/widgets", "post", 201, {"data": {"id": 7}})


def test_contract_reports_nested_json_path(contract: OpenApiContract) -> None:
    with pytest.raises(ContractViolation, match=r"\$\.data\.id"):
        contract.validate_response("/widgets", "post", 201, {"data": {"id": "seven"}})


def test_contract_reports_undocumented_status(contract: OpenApiContract) -> None:
    with pytest.raises(ContractViolation, match="undocumented status 500"):
        contract.validate_response("/widgets", "post", 500, {"error": "failed"})


def test_contract_rejects_invalid_request_before_transport(contract: OpenApiContract) -> None:
    with pytest.raises(ContractViolation, match="'name' is a required property"):
        contract.validate_request("/widgets", "post", {})
