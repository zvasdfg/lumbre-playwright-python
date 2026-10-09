"""Enforce dependency direction without importing or launching the application."""
import ast
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.framework_unit
@pytest.mark.case("FRAMEWORK-004", "Generic framework cannot depend on project-specific code")
def test_core_dependency_direction():
    for path in (ROOT / "automation").rglob("*.py"):
        tree=ast.parse(path.read_text())
        for node in ast.walk(tree):
            modules = ([node.module or ""] if isinstance(node,ast.ImportFrom) else
                       [alias.name for alias in node.names] if isinstance(node,ast.Import) else [])
            assert not any(module.startswith("projects") for module in modules), path


@pytest.mark.framework_unit
@pytest.mark.case("FRAMEWORK-005", "Component objects do not hide test assertions or depend on scenarios")
def test_static_component_boundaries():
    for path in (ROOT / "projects/lumbre_static/components").glob("*.py"):
        tree=ast.parse(path.read_text())
        assert not any(isinstance(node,ast.Assert) for node in ast.walk(tree)), path
        for node in ast.walk(tree):
            if isinstance(node,ast.ImportFrom):
                module=node.module or ""
                assert ".tests" not in module and ".data" not in module, path
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Name):
                assert node.func.id != "expect", path
