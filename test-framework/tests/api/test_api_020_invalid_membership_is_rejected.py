import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.parametrize(
    ("invalid_field", "payload"),
    [
        ("name", {"name": "I", "email": "isaac@example.test", "terms": "on"}),
        ("email", {"name": "Isaac Arellano", "email": "invalid", "terms": "on"}),
        ("terms", {"name": "Isaac Arellano", "email": "isaac@example.test"}),
    ],
)
@pytest.mark.case("API-020", "Invalid membership data is rejected with a stable contract")
def test_invalid_membership_is_rejected(
    api: LumbreApi,
    test_log: TestLogger,
    invalid_field: str,
    payload: dict[str, str],
) -> None:
    with test_log.step("Submit invalid membership data"):
        response = api.create_member(payload)
        result = response.json()
        test_log.values(
            invalid_field=invalid_field,
            submitted_payload=payload,
            observed_status=response.status,
            expected_status=422,
            observed_error=result.get("error"),
        )

    with test_log.step("Validate the rejection contract"):
        assert response.status == 422
        assert result == {"error": "invalid membership data"}
