from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    base_url: str = os.getenv("BASE_URL", "http://127.0.0.1:3000").rstrip("/")
    headless: bool = os.getenv("HEADLESS", "true").lower() not in {"0", "false", "no"}
    default_timeout_ms: int = int(os.getenv("DEFAULT_TIMEOUT_MS", "10000"))


settings = Settings()
