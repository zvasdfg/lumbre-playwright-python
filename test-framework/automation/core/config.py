from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    base_url: str
    headless: bool
    default_timeout_ms: int
    project_name: str
    locale: str
    viewport_width: int
    viewport_height: int

    @classmethod
    def from_environment(cls, environment: Mapping[str, str] | None = None) -> Settings:
        values = os.environ if environment is None else environment
        return cls(
            base_url=values.get("BASE_URL", "http://127.0.0.1:3000").rstrip("/"),
            headless=values.get("HEADLESS", "true").lower() not in {"0", "false", "no"},
            default_timeout_ms=int(values.get("DEFAULT_TIMEOUT_MS", "10000")),
            project_name=values.get("AUTOMATION_PROJECT", "Lumbre"),
            locale=values.get("LOCALE", "es-MX"),
            viewport_width=int(values.get("VIEWPORT_WIDTH", "1440")),
            viewport_height=int(values.get("VIEWPORT_HEIGHT", "1000")),
        )


settings = Settings.from_environment()
