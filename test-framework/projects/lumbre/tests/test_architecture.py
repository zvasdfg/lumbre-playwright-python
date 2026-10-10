"""Canonical case IDs, module boundaries and remote-selection safety."""

import ast
import importlib.util
import re
import tomllib
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FRAME = ROOT.parents[1]
pytestmark = pytest.mark.framework_unit


def case_id(function):
    for decorator in function.decorator_list:
        if (
            isinstance(decorator, ast.Call)
            and isinstance(decorator.func, ast.Attribute)
            and decorator.func.attr == "case"
        ):
            return decorator.args[0].value
    return None


@pytest.mark.case(
    "ARCH-001", "Every active case has one numbered module and one matching unique ID"
)
def test_numbered_case_structure():
    seen = set()
    files = list((ROOT / "tests/ui").rglob("test_*.py")) + list(
        (ROOT / "tests/api").rglob("test_*.py")
    )
    assert len(files) >= 50
    for path in files:
        match = re.fullmatch(r"test_(ui|api)_(\d{3})_.+\.py", path.name)
        assert match, path
        expected = f"{match[1].upper()}-{match[2]}"
        functions = [
            node
            for node in ast.parse(path.read_text()).body
            if isinstance(node, ast.FunctionDef) and node.name.startswith("test_")
        ]
        assert len(functions) == 1, path
        assert case_id(functions[0]) == expected, path
        assert expected not in seen, expected
        seen.add(expected)


@pytest.mark.case(
    "ARCH-002", "Project imports resolve and generic automation has no product dependency"
)
def test_current_project_import_boundaries():
    for path in ROOT.rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            names = []
            if isinstance(node, ast.ImportFrom) and not node.level:
                names = [node.module or ""]
            elif isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            for name in names:
                if name.startswith("projects."):
                    assert importlib.util.find_spec(name) is not None, (path, name)
    for path in (FRAME / "automation").rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom):
                assert not (node.module or "").startswith("projects."), path
            elif isinstance(node, ast.Import):
                assert not any(alias.name.startswith("projects.") for alias in node.names), path
    for path in (FRAME / "templates").glob("*.py.txt"):
        ast.parse(path.read_text())


@pytest.mark.case(
    "ARCH-003", "Default selection is local; external store cases are explicitly marked"
)
def test_default_selection_is_local():
    from projects.lumbre.data.cases import INGREDIENTS, PLANNER_CASES

    config = tomllib.loads((FRAME / "pyproject.toml").read_text())["tool"]["pytest"]["ini_options"]
    assert config["testpaths"] == ["tests/framework", "projects/lumbre/tests"]
    runner = (FRAME.parent / "scripts/test-local.sh").read_text()
    assert "npm run build:static" in runner and "http.server 3001" in runner
    assert "framework_unit or portal" in runner
    assert "framework_unit or portal" in config["addopts"]
    # A relocated source catalog must never silently produce an empty matrix.
    assert len(INGREDIENTS) == 60
    assert len(PLANNER_CASES) == 48
    for path in (ROOT / "tests").rglob("test_*.py"):
        if path.name == "test_architecture.py":
            continue
        tree = ast.parse(path.read_text())
        assignments = [
            node for node in tree.body
            if isinstance(node, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id == "pytestmark"
                    for target in node.targets)
        ]
        assert len(assignments) == 1, path
        markers = {
            node.attr for node in ast.walk(assignments[0].value) if isinstance(node, ast.Attribute)
        }
        assert len(markers & {"portal", "store"}) == 1, path


@pytest.mark.case(
    "ARCH-004", "Component and page objects contain interactions without business assertions"
)
def test_object_boundaries():
    for directory in ("components", "pages"):
        for path in (ROOT / directory).rglob("*.py"):
            tree = ast.parse(path.read_text())
            assert not any(isinstance(node, ast.Assert) for node in ast.walk(tree)), path
            for node in ast.walk(tree):
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                    assert node.func.id != "expect", path
                if isinstance(node, ast.ImportFrom):
                    assert ".tests" not in (node.module or "") and ".data" not in (
                        node.module or ""
                    ), path
