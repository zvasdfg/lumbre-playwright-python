from __future__ import annotations

from typing import Any


def membership_preference_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "preferredFuel": "lena",
        "equipment": "ahumador",
        "cookingStyle": "lento",
        "defaultGuests": 10,
        "newsletterConsent": True,
    }
    payload.update(overrides)
    return payload
