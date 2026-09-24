from __future__ import annotations

from typing import Any


def fire_preset_payload(
    name: str = "Fuego de prueba",
    **configuration_overrides: Any,
) -> dict[str, Any]:
    configuration: dict[str, Any] = {
        "guests": 8,
        "cookingStyle": "dos_zonas",
        "durationHours": 4,
        "fuelType": "briquetas",
        "equipment": "kettle",
        "weather": "viento",
        "servingTime": "16:30",
        "includeVegetables": True,
    }
    configuration.update(configuration_overrides)
    return {"name": name, "configuration": configuration}
