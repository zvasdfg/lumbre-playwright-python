"""Preserve specialized contracts while reporting independent failures in Pytest.

These scripts still own browser contexts and use port 3001. Do not run them with
xdist: PDF paths are shared. Migrate internals before introducing parallelism.
"""
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlparse

import pytest

ROOT = Path(__file__).resolve().parents[4]
SCRIPTS = ROOT / "portal" / "scripts"
CASES = [
    ("test-static.py", "check-static-print.py"),
    ("test-storage-recovery.py",),
    ("test-planner-goals.py",),
    ("test-planner-simple.py",),
    ("test-planner-fuel.py",),
    ("test-planner-kettle-fuel.py",),
    ("test-planner-weber-defaults.py",),
    ("test-recipe-blend-back.py",),
]


@pytest.mark.regression
@pytest.mark.case("STATIC-REG-001", "Retained specialized static contract")
@pytest.mark.parametrize("scripts", CASES, ids=[case[0][5:-3] for case in CASES])
def test_specialized_contract(scripts, app_url, request):
    target = urlparse(app_url)
    assert target.hostname in {"localhost", "127.0.0.1"} and target.port == 3001, (
        "Specialized scripts require an explicit local preview on port 3001"
    )
    assert not hasattr(request.config, "workerinput"), "Shared PDF artifacts prohibit xdist"
    for script in scripts:
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / script)], cwd=ROOT,
            text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=240,
            check=False,
        )
        print(result.stdout)
        assert result.returncode == 0, f"{script} failed:\n{result.stdout}"
