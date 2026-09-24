from __future__ import annotations

import pytest

from automation.core.config import settings

pytest_plugins = (
    "automation.core.reporting.html_report",
    "automation.adapters.playwright.pytest_plugin",
)


def pytest_sessionstart(session: pytest.Session) -> None:
    """Reject shared-state parallel runs before xdist starts worker processes."""
    config = session.config
    if hasattr(config, "workerinput"):
        return

    selected_paths = tuple(str(argument).replace("\\", "/") for argument in config.args)
    includes_lumbre = any("projects/lumbre" in path for path in selected_paths)
    if not includes_lumbre:
        return

    configured_workers = getattr(config.option, "numprocesses", None)
    if configured_workers in {None, 0, 1}:
        return
    if not isinstance(configured_workers, int):
        raise pytest.UsageError(
            "Lumbre requires an explicit parallel worker count. "
            "Use WORKERS=<count> ./scripts/test-parallel.sh."
        )

    configured_targets = len(settings.worker_base_urls)
    if configured_targets < configured_workers:
        raise pytest.UsageError(
            "Parallel Lumbre tests require one isolated target per worker. "
            f"Received {configured_targets} target(s) for {configured_workers} workers. "
            "Use WORKERS=<count> ./scripts/test-parallel.sh."
        )
