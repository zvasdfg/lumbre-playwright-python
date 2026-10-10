"""Retained specialized assertions, exposed as a numbered canonical case."""

import pytest

from projects.lumbre.support.specialized import run_specialized

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.regression,
    pytest.mark.specialized,
    pytest.mark.navigation,
]


@pytest.mark.case("UI-078", "Static portal and print")
def test_static_portal_and_print(local_specialized_preview, test_log):
    for script in ("test-static.py", "check-static-print.py"):
        with test_log.step(f"Execute {script} without weakening its assertions"):
            result = run_specialized(script)
            test_log.values(script=script, exit_code=result.returncode)
            print(result.stdout)
            assert result.returncode == 0, f"{script} failed:\n{result.stdout}"
