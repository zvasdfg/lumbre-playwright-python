"""Current portal fixtures: isolated browsers, no backend reset or authentication."""

from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect

from projects.lumbre.components.fire_almanac import FireAlmanac
from projects.lumbre.components.fire_planner import FirePlanner
from projects.lumbre.components.ingredient_lab import IngredientLab
from projects.lumbre.pages.home_page import HomePage


@pytest.fixture(autouse=True)
def target_scope(request, app_url):
    target = urlparse(app_url)
    remote = request.node.get_closest_marker("store") is not None
    if remote:
        if target.scheme != "https" or target.hostname in {"localhost", "127.0.0.1", "::1"}:
            raise pytest.UsageError(
                "Store integration cases require an explicitly selected public HTTPS target"
            )
    elif request.node.get_closest_marker("portal"):
        if target.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise pytest.UsageError(
                "Portal regressions require a local preview; "
                "use -m store for public targets"
            )


@pytest.fixture(autouse=True)
def numbered_evidence(request, target_scope, test_log):
    case = request.node.get_closest_marker("case")
    test_log.arrange(f"Case {case.args[0]} | {request.node.nodeid}")
    yield


@pytest.fixture(params=[390, 1440], ids=["mobile", "desktop"])
def portal(page, app_url, request):
    page.set_viewport_size({"width": request.param, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(app_url)
    expect(page.locator('[data-app-ready="true"]')).to_be_visible()
    yield page
    assert not errors, errors
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.fixture
def screen(page, app_url):
    page.set_viewport_size({"width": 390, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(app_url)
    expect(page.locator('[data-app-ready="true"]')).to_be_visible()
    yield page
    assert not errors, errors


@pytest.fixture(params=[390, 1440], ids=["mobile", "desktop"])
def lab(page, app_url, request):
    page.set_viewport_size({"width": request.param, "height": 900})
    page.goto(app_url)
    component = IngredientLab(page)
    component.open()
    yield component
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.fixture(params=[390, 1440], ids=["mobile", "desktop"])
def planner(page, app_url, request):
    page.set_viewport_size({"width": request.param, "height": 900})
    page.goto(app_url)
    component = FirePlanner(page)
    component.configure("asar", "kettle", "carbon")
    component.build()
    yield component
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.fixture
def home(page, app_url):
    home = HomePage(page, app_url)
    home.open()
    return home


@pytest.fixture
def local_specialized_preview(app_url, request, monkeypatch):
    # Child scripts own their browsers; explicitly forward the same CLI launch mode.
    monkeypatch.setenv("LUMBRE_TEST_HEADED", "1" if request.config.getoption("headed") else "0")
    monkeypatch.setenv("LUMBRE_TEST_SLOWMO", str(request.config.getoption("slowmo")))
    target = urlparse(app_url)
    assert target.hostname in {"localhost", "127.0.0.1"} and target.port == 3001, (
        "Specialized scripts require an explicit local preview on port 3001"
    )
    assert not hasattr(request.config, "workerinput"), "Shared PDF artifacts prohibit xdist"


@pytest.fixture
def almanac(portal):
    component = FireAlmanac(portal)
    component.open()
    return component
