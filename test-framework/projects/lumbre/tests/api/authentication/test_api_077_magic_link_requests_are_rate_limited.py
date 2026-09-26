from uuid import uuid4

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-077",
    "Repeated magic-link requests are rejected at the Worker boundary",
)
def test_magic_link_requests_are_rate_limited(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    rate_limit_key = f"api-077-{uuid4()}"
    headers = {"X-Lumbre-Test-Rate-Limit-Key": rate_limit_key}
    payload = {"name": "Acceso Controlado", "email": "limite@example.test"}

    with test_log.step("Consume the allowed authentication-request budget"):
        accepted_statuses = [
            api.request_magic_link(payload, headers=headers).status
            for _ in range(5)
        ]
        test_log.values(
            observed_rate_limit_key=rate_limit_key,
            observed_accepted_statuses=accepted_statuses,
            expected_limit=5,
        )
        assert accepted_statuses == [200] * 5

    with test_log.step("Exceed the authentication-request budget"):
        rejected = api.request_magic_link(payload, headers=headers)
        response_payload = rejected.json()
        test_log.values(
            observed_status=rejected.status,
            observed_error=response_payload["error"],
            observed_retry_after=rejected.headers.get("retry-after"),
            observed_request_id=rejected.headers.get("x-request-id"),
        )

        assert rejected.status == 429
        assert response_payload["error"] == "Too many requests"
        assert response_payload["requestId"] == rejected.headers["x-request-id"]
        assert rejected.headers["retry-after"] == "60"
