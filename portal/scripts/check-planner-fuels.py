"""Compatibility entry point. Expanded regression lives in check-planner-editor.py."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name("check-planner-editor.py")), run_name="__main__")
