from __future__ import annotations

import logging
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from time import perf_counter


@dataclass(frozen=True)
class StepEvidence:
    """Screenshot captured after an executable UI step."""

    number: int
    name: str
    status: str
    screenshot: bytes


class TestLogger:
    """Writes a consistent, human-readable narrative for one test scenario."""

    __test__ = False

    def __init__(
        self,
        case_id: str,
        behavior: str,
        capture_screenshot: Callable[[], bytes] | None = None,
    ) -> None:
        self.case_id = case_id
        self.behavior = behavior
        self._logger = logging.getLogger("lumbre.tests")
        self._step_number = 0
        self._capture_screenshot = capture_screenshot
        self.step_evidence: list[StepEvidence] = []

    def start(self) -> None:
        self._logger.info("=" * 78)
        self._logger.info("[%s] %s", self.case_id, self.behavior)
        self._logger.info("=" * 78)

    def arrange(self, message: str) -> None:
        self._logger.info("[ARRANGE] %s", message)

    def act(self, message: str) -> None:
        self._logger.info("[ACT]     %s", message)

    def verify(self, message: str) -> None:
        self._logger.info("[VERIFY]  %s", message)

    def evidence(self, message: str) -> None:
        self._logger.info("[EVIDENCE] %s", message)

    def values(self, **values: object) -> None:
        """Log business-relevant inputs, observed values and expectations."""
        rendered = ", ".join(f"{name}={value!r}" for name, value in values.items())
        self._logger.info("[VALUES]   %s", rendered)

    def _save_step_screenshot(self, number: int, name: str, status: str) -> None:
        if self._capture_screenshot is None:
            return

        try:
            screenshot = self._capture_screenshot()
        except Exception as error:
            self._logger.warning(
                "[SCREENSHOT %02d SKIP] Unable to capture evidence | %s: %s",
                number,
                type(error).__name__,
                error,
            )
            return

        self.step_evidence.append(
            StepEvidence(
                number=number,
                name=name,
                status=status,
                screenshot=screenshot,
            )
        )
        self._logger.info(
            "[SCREENSHOT %02d] Evidence captured after the step | %s",
            number,
            name,
        )

    @contextmanager
    def step(self, name: str) -> Iterator[None]:
        """Log one executable test step and preserve the original exception."""
        self._step_number += 1
        step_number = self._step_number
        started_at = perf_counter()
        self._logger.info("[STEP %02d START] %s", step_number, name)

        try:
            yield
        except BaseException as error:
            elapsed = perf_counter() - started_at
            self._logger.error(
                "[STEP %02d FAIL]  %s | %.2fs | %s: %s",
                step_number,
                name,
                elapsed,
                type(error).__name__,
                error,
            )
            self._save_step_screenshot(step_number, name, "FAIL")
            raise
        else:
            elapsed = perf_counter() - started_at
            self._logger.info(
                "[STEP %02d PASS]  %s | %.2fs",
                step_number,
                name,
                elapsed,
            )
            self._save_step_screenshot(step_number, name, "PASS")

    def finish(self, status: str) -> None:
        self._logger.info("[%s] %s | %s", status, self.case_id, self.behavior)
