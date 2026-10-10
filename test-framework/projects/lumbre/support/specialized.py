"""Technical subprocess adapter. The canonical tests own assertions and case IDs."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SCRIPTS = ROOT / "portal/scripts"


def run_specialized(script):
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=240,
        check=False,
    )
