"""Canonical case IDs, module boundaries and remote-selection safety."""

import ast
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
    "ARCH-002", "Current fixtures and POMs never depend on the retired backend project"
)
def test_current_project_has_no_legacy_imports():
    for path in ROOT.rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom):
                assert not (node.module or "").startswith("projects.lumbre_legacy"), path
            if isinstance(node, ast.Import):
                assert not any(
                    alias.name.startswith("projects.lumbre_legacy") for alias in node.names
                ), path
    source = (ROOT / "conftest.py").read_text()
    assert "reset_demo_data" not in source
    assert "LumbreApi" not in source
    for path in (FRAME / "templates").glob("*.py.txt"):
        template = path.read_text()
        assert "projects.lumbre.api.lumbre_api" not in template
        ast.parse(template)
    snippet = FRAME.parent / ".vscode/playwright-python.code-snippets"
    assert "projects.lumbre.api.lumbre_api" not in snippet.read_text()


@pytest.mark.case(
    "ARCH-003",
    "One active project; default selection excludes store and production",
)
def test_default_selection_is_local():
    config = tomllib.loads((FRAME / "pyproject.toml").read_text())["tool"]["pytest"]["ini_options"]
    assert config["testpaths"] == ["tests/framework", "projects/lumbre/tests"]
    assert not (FRAME / "projects/lumbre_legacy").exists()
    assert not (FRAME / "projects/lumbre_static").exists()
    assert not (FRAME.parent / "scripts/test-parallel.sh").exists()
    assert not (FRAME.parent / ".github/workflows/legacy-backend-checks.yml").exists()
    runner = (FRAME.parent / "scripts/test-local.sh").read_text()
    assert "npm run build:static" in runner and "http.server 3001" in runner
    assert "framework_unit or portal" in runner
    for retired in ("wrangler", "dev:backend", "LUMBRE_D1_STATE_DIR", "STRIPE_WEBHOOK_SECRET"):
        assert retired not in runner
    for retired in (
        "check-planner-diagrams.py",
        "check-planner-editor.py",
        "check-planner-fuels.py",
        "check-planner-mounts.py",
        "check-planner-visual.py",
        "replay-planner-100.py",
        "replay-planner-100-v3.py",
    ):
        assert not (FRAME.parent / "portal/scripts" / retired).exists()
    assert "framework_unit or portal" in config["addopts"]
    for path in (ROOT / "tests").rglob("test_*.py"):
        if path.name == "test_architecture.py":
            continue
        tree = ast.parse(path.read_text())
        assignments = [
            node
            for node in tree.body
            if isinstance(node, ast.Assign)
            and any(
                isinstance(target, ast.Name) and target.id == "pytestmark"
                for target in node.targets
            )
        ]
        assert len(assignments) == 1, path
        markers = {
            node.attr for node in ast.walk(assignments[0].value) if isinstance(node, ast.Attribute)
        }
        assert len(markers & {"portal", "store", "production"}) == 1, path


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
