from uuid import UUID

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-072",
    "API responses expose correlation and browser security controls",
)
def test_responses_are_correlated_and_hardened(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read a successful API response"):
        response = api.cart_response()
        request_id = response.headers.get("x-request-id", "")
        content_security_policy = response.headers.get("content-security-policy", "")
        test_log.values(
            observed_status=response.status,
            observed_request_id=request_id,
            observed_content_security_policy=content_security_policy,
            observed_frame_policy=response.headers.get("x-frame-options"),
            observed_content_type_policy=response.headers.get("x-content-type-options"),
        )

    with test_log.step("Validate correlation and the security baseline"):
        UUID(request_id)
        assert response.status == 200
        assert "default-src 'self'" in content_security_policy
        assert "object-src 'none'" in content_security_policy
        assert "frame-ancestors 'none'" in content_security_policy
        assert response.headers["x-frame-options"] == "DENY"
        assert response.headers["x-content-type-options"] == "nosniff"

