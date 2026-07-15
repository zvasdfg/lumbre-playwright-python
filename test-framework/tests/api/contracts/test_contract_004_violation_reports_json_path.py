import pytest

from framework.contracts import ContractViolation, OpenApiContract
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.contract
@pytest.mark.case(
    "CONTRACT-004",
    "A schema mismatch reports the exact JSON path and violated expectation",
)
def test_contract_violation_reports_json_path(
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    invalid_health_payload = {
        "status": "ok",
        "service": "lumbre-api",
        "seedVersion": "2026.07.03",
        "timestamp": 12345,
    }

    with test_log.step("Validate an intentionally malformed health representation"):
        with pytest.raises(ContractViolation) as captured_error:
            openapi_contract.validate_response(
                "/api/health",
                "get",
                200,
                invalid_health_payload,
            )
        observed_message = str(captured_error.value)
        test_log.values(
            invalid_field="timestamp",
            invalid_value=invalid_health_payload["timestamp"],
            observed_diagnostic=observed_message,
        )

    with test_log.step("Validate the diagnostic quality"):
        assert "$.timestamp" in observed_message
        assert "is not of type 'string'" in observed_message
