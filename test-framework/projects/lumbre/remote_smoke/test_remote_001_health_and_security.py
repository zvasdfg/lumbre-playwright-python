from uuid import UUID

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.smoke
@pytest.mark.remote_smoke
@pytest.mark.case(
    "REMOTE-001",
    "The deployed service and its D1 binding are healthy and hardened",
)
def test_deployed_health_and_security(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request health from the deployed target"):
        response = api.health_response()
        payload = response.json()
        request_id = response.headers.get("x-request-id", "")
        test_log.values(
            observed_http_status=response.status,
            observed_service_status=payload.get("status"),
            observed_database=payload.get("database"),
            observed_request_id=request_id,
        )

    with test_log.step("Validate service, persistence, and security controls"):
        UUID(request_id)
        assert response.status == 200
        assert payload["status"] == "ok"
        assert payload["database"]["status"] == "ready"
        assert payload["database"]["provider"] == "cloudflare-d1"
        assert payload["database"]["seedVersion"] == payload["seedVersion"]
        assert response.headers["x-frame-options"] == "DENY"
        assert response.headers["x-content-type-options"] == "nosniff"
        assert "default-src 'self'" in response.headers["content-security-policy"]
        assert "max-age=" in response.headers["strict-transport-security"]
