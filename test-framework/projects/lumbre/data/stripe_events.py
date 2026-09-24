from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any

TEST_WEBHOOK_SECRET = "whsec_lumbre_test_webhook_secret_2026"


def stripe_event(
    *,
    event_id: str,
    event_type: str,
    session_id: str,
    order_id: str,
    amount_total: int,
    payment_status: str,
    currency: str = "mxn",
) -> str:
    """Build a compact Stripe snapshot event without customer or card data."""
    payload: dict[str, Any] = {
        "id": event_id,
        "type": event_type,
        "data": {
            "object": {
                "id": session_id,
                "amount_total": amount_total,
                "currency": currency,
                "payment_status": payment_status,
                "metadata": {"order_id": order_id},
            }
        },
    }
    return json.dumps(payload, separators=(",", ":"))


def stripe_signature(raw_body: str, *, timestamp: int | None = None) -> str:
    signed_at = timestamp or int(time.time())
    digest = hmac.new(
        TEST_WEBHOOK_SECRET.encode(),
        f"{signed_at}.{raw_body}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"t={signed_at},v1={digest}"
