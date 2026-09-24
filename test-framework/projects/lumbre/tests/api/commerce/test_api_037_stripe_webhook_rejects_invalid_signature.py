import time

import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.data.stripe_events import stripe_signature


@pytest.mark.api
@pytest.mark.case("API-037", "Stripe webhook rejects missing, invalid, and stale signatures")
def test_stripe_webhook_rejects_invalid_signature(api: LumbreApi, test_log: TestLogger) -> None:
    raw_body = "{}"

    with test_log.step("Submit unsigned and incorrectly signed webhook bodies"):
        missing = api.stripe_webhook(raw_body)
        invalid = api.stripe_webhook(raw_body, "t=1,v1=not-a-valid-signature")
        stale = api.stripe_webhook(
            raw_body,
            stripe_signature(raw_body, timestamp=int(time.time()) - 600),
        )
        test_log.values(
            observed_missing_status=missing.status,
            observed_invalid_status=invalid.status,
            observed_stale_status=stale.status,
            expected_status=400,
        )
        assert missing.status == 400
        assert invalid.status == 400
        assert stale.status == 400
