import logging

import pytest

from automation.core.reporting import TestLogger

pytestmark = [
    pytest.mark.framework_unit,
    pytest.mark.case(
        "FRAMEWORK-003",
        "The reusable logger records steps, values, and screenshot evidence",
    ),
]


def test_logger_records_step_values_and_evidence(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger="automation.tests")
    logger = TestLogger(
        case_id="EXAMPLE-001",
        behavior="Demonstrate reusable evidence",
        capture_screenshot=lambda: b"png-evidence",
    )

    logger.start()
    with logger.step("Execute a reusable action"):
        logger.values(observed_status=201, expected_status=201)
    logger.finish("PASS")

    assert logger.step_evidence[0].screenshot == b"png-evidence"
    assert logger.step_evidence[0].name == "Execute a reusable action"
    assert "observed_status=201" in caplog.text
    assert "[STEP 01 PASS]" in caplog.text
