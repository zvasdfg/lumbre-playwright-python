from uuid import uuid4

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-074",
    "Repeated cart mutations are rejected at the Worker boundary",
)
def test_cart_mutations_are_rate_limited(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    rate_limit_key = f"api-074-{uuid4()}"
    headers = {"X-Lumbre-Test-Rate-Limit-Key": rate_limit_key}

    with test_log.step("Consume the allowed cart-mutation budget"):
        accepted_statuses = [
            api.add_cart_item(
                {"productId": 101, "quantity": 1},
                headers=headers,
            ).status
            for _ in range(30)
        ]
        test_log.values(
            observed_rate_limit_key=rate_limit_key,
            observed_accepted_statuses=accepted_statuses,
            expected_limit=30,
        )

    with test_log.step("Exceed the cart-mutation budget"):
        rejected = api.add_cart_item(
            {"productId": 101, "quantity": 1},
            headers=headers,
        )
        payload = rejected.json()
        test_log.values(
            observed_status=rejected.status,
            observed_error=payload["error"],
            observed_retry_after=rejected.headers.get("retry-after"),
            observed_request_id=rejected.headers.get("x-request-id"),
        )

        assert accepted_statuses == [201] * 30
        assert rejected.status == 429
        assert payload["error"] == "Too many requests"
        assert payload["requestId"] == rejected.headers["x-request-id"]
        assert rejected.headers["retry-after"] == "60"

