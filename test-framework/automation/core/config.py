from __future__ import annotations

import os
import re
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
    worker_base_urls: tuple[str, ...]

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
            worker_base_urls=tuple(
                url.strip().rstrip("/")
                for url in values.get("AUTOMATION_WORKER_BASE_URLS", "").split(",")
                if url.strip()
            ),
        )

    def base_url_for_worker(self, worker_id: str) -> str:
        """Resolve an isolated target for one pytest-xdist worker."""
        if not self.worker_base_urls or worker_id == "master":
            return self.base_url

        match = re.fullmatch(r"gw(\d+)", worker_id)
        if match is None:
            raise ValueError(f"Unsupported pytest-xdist worker id: {worker_id}")

        worker_index = int(match.group(1))
        try:
            return self.worker_base_urls[worker_index]
        except IndexError as error:
            raise ValueError(
                f"No isolated base URL configured for {worker_id}; "
                f"received {len(self.worker_base_urls)} worker URL(s)"
            ) from error


settings = Settings.from_environment()
